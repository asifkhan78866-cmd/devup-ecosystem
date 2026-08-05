import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { prisma } from "../../lib/prisma";
import { uploadFile } from "../../lib/storage";
import { env } from "../../config/env";
import { AppError } from "../../middleware/errorHandler";
import * as push from "../shared/push.service";
import { completeness, missingRequired, suggestions, canApply, MIN_COMPLETENESS_TO_APPLY } from "./completeness";

const router = Router();
const ok = (res: any, data: unknown, status = 200) => res.status(status).json({ success: true, data });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.includes(file.mimetype)) return cb(null, false);
    cb(null, true);
  },
});

/**
 * Unset fields come back from the database as `null`, and the client sends that
 * same shape straight back when saving. Plain `.optional()` accepts `undefined`
 * but rejects `null`, so every empty field would fail validation. `.nullish()`
 * accepts both; empty strings and nulls are normalised to undefined so the
 * service can decide what to persist.
 */
const text = (max: number) =>
  z
    .string()
    .max(max)
    .nullish()
    .transform((v) => (v == null || v.trim() === "" ? undefined : v.trim()));

/** Accepts a valid URL, or empty/null meaning "clear this field". */
const url = z
  .union([z.string().url(), z.literal(""), z.null()])
  .optional()
  .transform((v) => (v ? v : undefined));

/**
 * Blank and null both mean "not provided". They are stripped before coercion —
 * z.coerce.number() turns "" into 0, which would then fail a range check and
 * report a confusing "must be between 1950 and 2100" for an empty box.
 */
const num = (min: number, max: number, int = false) =>
  z.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    (int ? z.coerce.number().int() : z.coerce.number()).min(min).max(max).optional()
  );

const profileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120).nullish().transform((v) => v?.trim() || undefined),
    bio: text(2000),
    phone: text(20),
    college: text(200),
    degree: text(120),
    branch: text(120),
    city: text(120),
    graduationYear: num(1950, 2100, true),
    cgpa: num(0, 10),
    experienceYears: num(0, 60),
    skills: z.array(z.string().max(40)).max(50).nullish().transform((v) => v ?? undefined),
    githubUrl: url,
    linkedinUrl: url,
    twitterUrl: url,
    portfolioUrl: url,
    isOpenToWork: z.boolean().nullish().transform((v) => v ?? undefined),
    isLookingForCofounder: z.boolean().nullish().transform((v) => v ?? undefined),
  }),
});

/** The profile is the single source an application autofills from. */
router.get("/", requireAuth, async (req, res) => {
  const profile = await prisma.profile.findUnique({ where: { userId: req.user!.id } });
  ok(res, {
    ...profile,
    email: req.user!.email,
    avatarUrl: req.user!.avatarUrl,
    completeness: completeness(profile),
    missing: missingRequired(profile),
    suggestions: suggestions(profile),
    minToApply: MIN_COMPLETENESS_TO_APPLY,
    canApply: canApply(profile),
  });
});

router.put("/", requireAuth, validate(profileSchema), async (req, res) => {
  const b = req.body;

  // validate() checks the shape but does not write the parsed value back, so the
  // handler still sees the raw body. Normalise here: blank and null both mean
  // "clear this field", and numbers arrive as strings from some clients.
  const str = (v: unknown) => {
    if (v == null) return null;
    const t = String(v).trim();
    return t === "" ? null : t;
  };
  const dec = (v: unknown) => {
    if (v == null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? new Prisma.Decimal(n) : null;
  };
  const int = (v: unknown) => {
    if (v == null || v === "") return null;
    const n = Number(v);
    return Number.isInteger(n) ? n : null;
  };

  const data: Prisma.ProfileUncheckedCreateInput = {
    userId: req.user!.id,
    name: str(b.name) ?? req.user!.email.split("@")[0],
    bio: str(b.bio),
    phone: str(b.phone),
    college: str(b.college),
    degree: str(b.degree),
    branch: str(b.branch),
    graduationYear: int(b.graduationYear),
    cgpa: dec(b.cgpa),
    experienceYears: dec(b.experienceYears),
    city: str(b.city),
    skills: Array.isArray(b.skills) ? b.skills : [],
    githubUrl: str(b.githubUrl),
    linkedinUrl: str(b.linkedinUrl),
    twitterUrl: str(b.twitterUrl),
    portfolioUrl: str(b.portfolioUrl),
    isOpenToWork: b.isOpenToWork ?? true,
    isLookingForCofounder: b.isLookingForCofounder ?? false,
  };

  const { userId, ...updateData } = data;
  const saved = await prisma.profile.upsert({
    where: { userId: req.user!.id },
    create: data,
    update: updateData,
  });

  ok(res, {
    ...saved,
    completeness: completeness(saved),
    missing: missingRequired(saved),
    suggestions: suggestions(saved),
    minToApply: MIN_COMPLETENESS_TO_APPLY,
    canApply: canApply(saved),
  });
});

router.post("/resume", requireAuth, upload.single("resume"), async (req, res) => {
  if (!req.file) throw new AppError(400, "Upload a PDF or Word document", "INVALID_FILE");

  const url = await uploadFile(
    env.STORAGE_BUCKET_RESUMES,
    `profiles/${req.user!.id}/${Date.now()}-${req.file.originalname}`,
    req.file.buffer,
    req.file.mimetype
  );

  const existing = await prisma.profile.findUnique({ where: { userId: req.user!.id } });
  const saved = await prisma.profile.upsert({
    where: { userId: req.user!.id },
    create: {
      userId: req.user!.id,
      name: existing?.name ?? req.user!.email.split("@")[0],
      skills: [],
      resumeUrl: url,
      resumeFileName: req.file.originalname,
      resumeUpdatedAt: new Date(),
    },
    update: { resumeUrl: url, resumeFileName: req.file.originalname, resumeUpdatedAt: new Date() },
  });

  ok(res, saved, 201);
});

// ── Web push ────────────────────────────────────────
router.get("/push/key", (_req, res) =>
  ok(res, { publicKey: env.VAPID_PUBLIC_KEY ?? null, enabled: push.isPushEnabled() })
);

router.post(
  "/push/subscribe",
  requireAuth,
  validate(
    z.object({
      body: z.object({
        endpoint: z.string().url(),
        keys: z.object({ p256dh: z.string(), auth: z.string() }),
      }),
    })
  ),
  async (req, res) => {
    await push.subscribe({
      userId: req.user!.id,
      endpoint: req.body.endpoint,
      p256dh: req.body.keys.p256dh,
      auth: req.body.keys.auth,
      userAgent: req.headers["user-agent"],
    });
    ok(res, { subscribed: true }, 201);
  }
);

router.post("/push/unsubscribe", requireAuth, async (req, res) => {
  await push.unsubscribe(req.body?.endpoint ?? "");
  ok(res, { subscribed: false });
});

router.post("/push/test", requireAuth, async (req, res) => {
  const result = await push.sendPush(req.user!.id, {
    title: "DevUp notifications are on",
    body: "You will now get updates about your applications here.",
    url: "/dashboard/applications",
  });
  ok(res, result);
});

// ── Notifications feed ──────────────────────────────
router.get("/notifications", requireAuth, async (req, res) => {
  const items = await prisma.notification.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  ok(res, { items, unread: items.filter((n) => !n.isRead).length });
});

router.post("/notifications/read", requireAuth, async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.id, ...(req.body?.id ? { id: req.body.id } : {}) },
    data: { isRead: true },
  });
  ok(res, { ok: true });
});

const emptyToNull = (v?: string) => (v === "" ? null : v);

export default router;
