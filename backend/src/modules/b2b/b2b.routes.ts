import { Router } from "express";
import { z } from "zod";
import { EngagementStage } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import * as cat from "./catalogue.service";
import * as eng from "./engagements.service";
import { activityFor } from "../shared/changes";

/**
 * B2B administration: catalogue, engagements, money, vault, delivery.
 *
 * All of it platform-admin only. The public site reads the catalogue through
 * its own router, which serves active services and nothing else.
 */

const ok = (res: any, data: unknown, status = 200) => res.status(status).json({ success: true, data });
const money = z.number().int().min(0);

// ── Public: the catalogue the website renders ────────────────────────────
export const publicCatalogueRouter = Router();

publicCatalogueRouter.get("/", async (_req, res) => {
  res.set("Cache-Control", "public, max-age=120");
  ok(res, await cat.listServices());
});

publicCatalogueRouter.get("/:slug", async (req, res) => {
  res.set("Cache-Control", "public, max-age=120");
  ok(res, await cat.getService(String(req.params.slug)));
});

/** Delivered work, published with the client's consent recorded. */
publicCatalogueRouter.get("/showcase/published", async (_req, res) => {
  const rows = await prisma.showcaseEntry.findMany({
    where: { published: true, consentGiven: true },
    orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }],
    include: { engagement: { select: { clientCompany: true, service: { select: { name: true } } } } },
  });
  // A client who consented to the work being shown has not necessarily
  // consented to being named, so the name is withheld unless they did.
  ok(
    res,
    rows.map((r) => ({
      id: r.id,
      title: r.title,
      summary: r.summary,
      outcome: r.outcome,
      imageUrls: r.imageUrls,
      service: r.engagement.service?.name ?? null,
      client: r.clientNamed ? r.engagement.clientCompany : null,
      publishedAt: r.publishedAt,
    }))
  );
});

// ── Admin ────────────────────────────────────────────────────────────────
export const adminB2bRouter = Router();
adminB2bRouter.use(requireAuth, requireRole(["ADMIN", "SUPER_ADMIN"]));

const actor = (req: any) => req.user.id as string;

// Catalogue
const serviceBody = z.object({
  body: z.object({
    slug: z.string().max(60).optional(),
    name: z.string().min(2).max(120),
    category: z.string().min(1).max(40),
    categoryLabel: z.string().min(1).max(60),
    icon: z.string().max(60).optional(),
    short: z.string().min(1).max(400),
    tagline: z.string().max(200).optional(),
    size: z.enum(["small", "large"]).optional(),
    whyDevUp: z.any().optional(),
    whatsIncluded: z.array(z.string().max(300)).optional(),
    howItWorks: z.any().optional(),
    engagementType: z.string().max(120).optional(),
    priceFrom: money.optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  }),
});

adminB2bRouter.get("/services", async (req, res) =>
  ok(res, await cat.listServices({
    includeInactive: true,
    // Removed rows are shown only on request, and arrive marked.
    includeRemoved: req.query.includeRemoved === "true",
  }))
);
adminB2bRouter.post("/services", validate(serviceBody), async (req, res) =>
  ok(res, await cat.createService(req.body, actor(req)), 201)
);
adminB2bRouter.patch("/services/:id", async (req, res) =>
  ok(res, await cat.updateService(req.params.id as string, req.body, actor(req)))
);
adminB2bRouter.delete("/services/:id", async (req, res) =>
  ok(res, await cat.retireService(req.params.id as string, actor(req), req.body?.reason))
);

adminB2bRouter.post("/services/:id/restore", async (req, res) =>
  ok(res, await cat.restoreService(req.params.id as string, actor(req)))
);

// Engagements
adminB2bRouter.get("/engagements", async (req, res) => {
  const stage = z.nativeEnum(EngagementStage).safeParse(req.query.stage);
  ok(
    res,
    await eng.listEngagements({
      stage: stage.success ? stage.data : undefined,
      q: req.query.q ? String(req.query.q) : undefined,
    })
  );
});

adminB2bRouter.get("/engagements/:id", async (req, res) =>
  ok(res, await eng.getEngagement(req.params.id as string))
);

adminB2bRouter.post(
  "/engagements",
  validate(
    z.object({
      body: z.object({
        serviceId: z.string().uuid().nullable().optional(),
        requestId: z.string().uuid().nullable().optional(),
        clientName: z.string().min(2).max(120),
        clientCompany: z.string().min(2).max(160),
        clientEmail: z.string().email(),
        clientPhone: z.string().max(20).optional(),
        clientGstin: z.string().max(20).optional(),
        approverName: z.string().max(120).optional(),
        approverEmail: z.string().email().optional(),
        title: z.string().min(2).max(200),
        summary: z.string().max(2000).optional(),
        contractValue: money.optional(),
        depositPct: z.number().int().min(0).max(100).optional(),
        warrantyDays: z.number().int().min(0).max(365).optional(),
      }),
    })
  ),
  async (req, res) => ok(res, await eng.createEngagement(req.body, actor(req)), 201)
);

adminB2bRouter.patch("/engagements/:id", async (req, res) =>
  ok(res, await eng.updateEngagement(req.params.id as string, req.body, actor(req)))
);

/** The gate. Refuses forward moves whose conditions are not met. */
adminB2bRouter.post(
  "/engagements/:id/stage",
  validate(z.object({ body: z.object({ stage: z.nativeEnum(EngagementStage) }) })),
  async (req, res) => ok(res, await eng.advanceStage(req.params.id as string, req.body.stage, actor(req)))
);

// Money
adminB2bRouter.post("/engagements/:id/milestones", async (req, res) => {
  const row = await prisma.engagementMilestone.create({
    data: {
      engagementId: req.params.id as string,
      title: String(req.body.title ?? "").trim(),
      amount: Number(req.body.amount ?? 0),
      dueOn: req.body.dueOn ? new Date(req.body.dueOn) : null,
      sortOrder: Number(req.body.sortOrder ?? 0),
    },
  });
  ok(res, row, 201);
});

adminB2bRouter.post(
  "/engagements/:id/payments",
  validate(
    z.object({
      body: z.object({
        amount: money.min(1),
        tdsDeducted: money.optional(),
        paidOn: z.string(),
        method: z.string().max(40).optional(),
        reference: z.string().max(80).optional(),
        milestoneId: z.string().uuid().optional(),
        invoiceId: z.string().uuid().optional(),
        note: z.string().max(300).optional(),
      }),
    })
  ),
  async (req, res) =>
    ok(res, await eng.recordPayment({ ...req.body, engagementId: req.params.id as string, actorId: actor(req) }), 201)
);

adminB2bRouter.post(
  "/engagements/:id/invoices",
  validate(
    z.object({
      body: z.object({
        subtotal: money.min(1),
        gstPct: z.number().int().min(0).max(28).optional(),
        sacCode: z.string().max(12).optional(),
        sellerGstin: z.string().max(20).optional(),
        dueOn: z.string().optional(),
        notes: z.string().max(500).optional(),
      }),
    })
  ),
  async (req, res) =>
    ok(res, await eng.createInvoice({ ...req.body, engagementId: req.params.id as string, actorId: actor(req) }), 201)
);

// Vault
adminB2bRouter.post("/engagements/:id/credentials", async (req, res) =>
  ok(
    res,
    await eng.saveCredential({
      engagementId: req.params.id as string,
      id: req.body.id,
      provider: String(req.body.provider ?? "").trim(),
      accountRef: req.body.accountRef,
      label: String(req.body.label ?? "").trim(),
      purpose: req.body.purpose,
      username: req.body.username,
      url: req.body.url,
      secret: req.body.secret,
      actorId: actor(req),
    }),
    201
  )
);

/** Audited on every call — that is the point of it existing. */
adminB2bRouter.post("/credentials/:id/reveal", async (req, res) =>
  ok(res, await eng.revealCredential(req.params.id as string, actor(req)))
);

adminB2bRouter.delete("/credentials/:id", async (req, res) =>
  ok(res, await eng.deleteCredential(req.params.id as string, actor(req), req.body?.reason))
);

/**
 * Who changed what, and when.
 *
 * Read straight off the audit log rather than kept as a second copy — a
 * separate history table is one that can disagree with the record it describes.
 */
adminB2bRouter.get("/activity/:entity/:id", async (req, res) =>
  ok(res, await activityFor(String(req.params.entity), String(req.params.id)))
);

// Delivery
adminB2bRouter.post("/engagements/:id/team", async (req, res) => {
  const row = await prisma.engagementMember.create({
    data: {
      engagementId: req.params.id as string,
      name: String(req.body.name ?? "").trim(),
      email: req.body.email ?? null,
      role: String(req.body.role ?? "").trim(),
      userId: req.body.userId ?? null,
    },
  });
  ok(res, row, 201);
});

adminB2bRouter.delete("/team/:id", async (req, res) => {
  await prisma.engagementMember.delete({ where: { id: req.params.id as string } });
  ok(res, { ok: true });
});

adminB2bRouter.post("/engagements/:id/tasks", async (req, res) => {
  const row = await prisma.engagementTask.create({
    data: {
      engagementId: req.params.id as string,
      title: String(req.body.title ?? "").trim(),
      detail: req.body.detail ?? null,
      assignee: req.body.assignee ?? null,
      dueOn: req.body.dueOn ? new Date(req.body.dueOn) : null,
      sortOrder: Number(req.body.sortOrder ?? 0),
    },
  });
  ok(res, row, 201);
});

adminB2bRouter.patch("/tasks/:id", async (req, res) => {
  const row = await prisma.engagementTask.update({
    where: { id: req.params.id as string },
    data: {
      ...(req.body.status ? { status: req.body.status } : {}),
      ...(req.body.title ? { title: String(req.body.title).trim() } : {}),
      ...(req.body.assignee !== undefined ? { assignee: req.body.assignee } : {}),
    },
  });
  ok(res, row);
});

adminB2bRouter.post("/engagements/:id/deliverables", async (req, res) => {
  const row = await prisma.deliverable.create({
    data: {
      engagementId: req.params.id as string,
      title: String(req.body.title ?? "").trim(),
      description: req.body.description ?? null,
      url: req.body.url ?? null,
      deemedAfterDays: Number(req.body.deemedAfterDays ?? 7),
    },
  });
  ok(res, row, 201);
});

adminB2bRouter.patch("/deliverables/:id", async (req, res) => {
  const { action, by, note } = req.body ?? {};
  const now = new Date();
  const data =
    action === "submit"
      ? { status: "SUBMITTED" as const, submittedAt: now }
      : action === "accept"
      ? { status: "ACCEPTED" as const, acceptedAt: now, acceptedBy: by ?? null, rejectNote: null }
      : action === "reject"
      ? { status: "REJECTED" as const, rejectNote: note ?? null }
      : {};
  ok(res, await prisma.deliverable.update({ where: { id: req.params.id as string }, data }));
});

/** Submitted long enough ago that silence counts as acceptance. */
adminB2bRouter.get("/deliverables/deemed-accepted", async (_req, res) =>
  ok(res, await eng.deemedAccepted())
);

adminB2bRouter.post("/engagements/:id/handover", async (req, res) => {
  const row = await prisma.handoverItem.create({
    data: {
      engagementId: req.params.id as string,
      label: String(req.body.label ?? "").trim(),
      detail: req.body.detail ?? null,
      sortOrder: Number(req.body.sortOrder ?? 0),
    },
  });
  ok(res, row, 201);
});

adminB2bRouter.patch("/handover/:id", async (req, res) => {
  const done = Boolean(req.body.done);
  ok(
    res,
    await prisma.handoverItem.update({
      where: { id: req.params.id as string },
      data: { done, doneAt: done ? new Date() : null },
    })
  );
});

// Scope and costs
adminB2bRouter.post("/engagements/:id/changes", async (req, res) => {
  const row = await prisma.changeRequest.create({
    data: {
      engagementId: req.params.id as string,
      title: String(req.body.title ?? "").trim(),
      description: req.body.description ?? null,
      amount: Number(req.body.amount ?? 0),
      extraDays: Number(req.body.extraDays ?? 0),
    },
  });
  ok(res, row, 201);
});

adminB2bRouter.patch("/changes/:id", async (req, res) => {
  const status = req.body.status === "APPROVED" ? "APPROVED" : "DECLINED";
  ok(
    res,
    await prisma.changeRequest.update({
      where: { id: req.params.id as string },
      data: { status, decidedAt: new Date(), decidedBy: actor(req) },
    })
  );
});

adminB2bRouter.post("/engagements/:id/costs", async (req, res) => {
  const row = await prisma.passThroughCost.create({
    data: {
      engagementId: req.params.id as string,
      vendor: String(req.body.vendor ?? "").trim(),
      detail: req.body.detail ?? null,
      amount: Number(req.body.amount ?? 0),
      incurredOn: new Date(req.body.incurredOn ?? Date.now()),
    },
  });
  ok(res, row, 201);
});

// Maintenance
adminB2bRouter.post(
  "/engagements/:id/maintenance",
  validate(
    z.object({
      body: z.object({
        amount: money.min(1),
        cadence: z.enum(["MONTHLY", "QUARTERLY", "ANNUAL"]).optional(),
        startsOn: z.string().optional(),
        inclusions: z.array(z.string().max(200)).optional(),
        exclusions: z.array(z.string().max(200)).optional(),
        note: z.string().max(300).optional(),
      }),
    })
  ),
  async (req, res) =>
    ok(res, await eng.upsertMaintenance({ ...req.body, engagementId: req.params.id as string, actorId: actor(req) }))
);

adminB2bRouter.get("/maintenance/renewals", async (req, res) =>
  ok(res, await eng.renewalsDue(req.query.days ? Number(req.query.days) : 14))
);

// Showcase
adminB2bRouter.put("/engagements/:id/showcase", async (req, res) => {
  const engagementId = req.params.id as string;
  const data = {
    title: String(req.body.title ?? "").trim(),
    summary: String(req.body.summary ?? "").trim(),
    outcome: req.body.outcome ?? null,
    imageUrls: Array.isArray(req.body.imageUrls) ? req.body.imageUrls : [],
    clientNamed: Boolean(req.body.clientNamed),
    consentGiven: Boolean(req.body.consentGiven),
    consentBy: req.body.consentBy ?? null,
    consentAt: req.body.consentGiven ? new Date() : null,
    published: Boolean(req.body.published),
    publishedAt: req.body.published ? new Date() : null,
    sortOrder: Number(req.body.sortOrder ?? 0),
  };

  // Publishing without recorded consent is the one thing this must not do.
  if (data.published && !data.consentGiven) {
    return res.status(409).json({
      success: false,
      error: "Record the client's consent before publishing this",
      code: "NO_CONSENT",
    });
  }

  ok(
    res,
    await prisma.showcaseEntry.upsert({
      where: { engagementId },
      create: { engagementId, ...data },
      update: data,
    })
  );
});
