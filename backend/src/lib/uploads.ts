import { randomBytes } from "crypto";
import { AppError } from "../middleware/errorHandler";

/**
 * What an uploaded file actually is, decided by its bytes.
 *
 * The browser's Content-Type and the file's extension are whatever the sender
 * typed, so neither is trusted: a page of HTML called "logo.png" and sent as
 * image/png is still HTML. Every upload is identified here from its leading
 * signature, the stored object gets the type that was detected, and its key is
 * built on the server — the client's file name never becomes part of a path.
 *
 * Only these four formats are accepted anywhere. They are also the only types
 * the storage buckets allow, and none of them can carry markup or script the
 * way SVG and HTML can.
 */

type Kind = "jpeg" | "png" | "webp" | "pdf";

const KINDS: Record<Kind, { mime: string; ext: string }> = {
  jpeg: { mime: "image/jpeg", ext: "jpg" },
  png: { mime: "image/png", ext: "png" },
  webp: { mime: "image/webp", ext: "webp" },
  pdf: { mime: "application/pdf", ext: "pdf" },
};

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export function detectKind(buf: Buffer): Kind | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
  if (buf.length >= 8 && buf.subarray(0, 8).equals(PNG_SIGNATURE)) return "png";
  if (buf.length >= 12 && buf.toString("latin1", 0, 4) === "RIFF" && buf.toString("latin1", 8, 12) === "WEBP") return "webp";
  // The PDF header may follow up to 1KB of junk, and real-world generators do that.
  if (buf.length >= 5 && buf.subarray(0, 1024).includes("%PDF-")) return "pdf";
  return null;
}

/**
 * PDFs that run something when opened: document JavaScript or a launch action.
 * Names can be hex-escaped (/J#61vaScript), so escapes are decoded first. This
 * cannot see inside compressed object streams; it stops the plain form, and
 * the files are served from the storage domain, never from the app's origin.
 */
function pdfHasActiveContent(buf: Buffer): boolean {
  const text = buf.toString("latin1").replace(/#([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  return /\/(JavaScript|Launch)\b/.test(text);
}

const MB = 1024 * 1024;

export const UPLOAD_RULES = {
  image: { kinds: ["jpeg", "png", "webp"] as Kind[], maxBytes: 5 * MB, label: "a JPG, PNG or WebP image" },
  document: { kinds: ["pdf"] as Kind[], maxBytes: 10 * MB, label: "a PDF" },
  identity: { kinds: ["jpeg", "png", "webp", "pdf"] as Kind[], maxBytes: 8 * MB, label: "a JPG, PNG, WebP or PDF" },
};
export type UploadRule = keyof typeof UPLOAD_RULES;

export type VerifiedFile = {
  buffer: Buffer;
  /** Detected from the content — this, not the browser's claim, is stored. */
  mime: string;
  ext: string;
  size: number;
  /** The sender's file name, cleaned for display only. Never used in a path. */
  displayName: string | null;
};

type IncomingFile = { buffer: Buffer; originalname?: string } | undefined | null;

export function verifyUpload(file: IncomingFile, rule: UploadRule, maxBytes?: number): VerifiedFile {
  const r = UPLOAD_RULES[rule];
  if (!file?.buffer?.length) throw new AppError(400, `Attach ${r.label}.`, "FILE_REQUIRED");

  const limit = Math.min(maxBytes ?? r.maxBytes, r.maxBytes);
  if (file.buffer.length > limit) {
    throw new AppError(413, `That file is larger than ${Math.floor(limit / MB)}MB.`, "FILE_TOO_LARGE");
  }

  const kind = detectKind(file.buffer);
  if (!kind || !r.kinds.includes(kind)) {
    throw new AppError(400, `Upload ${r.label}.`, "INVALID_FILE_TYPE");
  }
  if (kind === "pdf" && pdfHasActiveContent(file.buffer)) {
    throw new AppError(400, "This PDF contains scripts or actions. Export or print it to a plain PDF and try again.", "UNSAFE_FILE");
  }

  return { buffer: file.buffer, ...KINDS[kind], size: file.buffer.length, displayName: safeDisplayName(utf8FileName(file.originalname)) };
}

/**
 * Browsers send multipart file names as UTF-8, but multer hands them over
 * decoded as Latin-1, so "रिज़्यूमे.pdf" arrives as mojibake. Re-decode when the
 * bytes form valid UTF-8; otherwise keep the name as given.
 */
function utf8FileName(name?: string): string | undefined {
  if (!name || !/[\u0080-\u00ff]/.test(name)) return name;
  const decoded = Buffer.from(name, "latin1").toString("utf8");
  return decoded.includes("\uFFFD") ? name : decoded;
}

const SEGMENT = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;

/**
 * A storage key built only from server-side identifiers.
 *
 * Each folder segment must be a plain id, slug or enum value, so nothing a
 * client sends can add "..", a slash or another user's folder to the path. The
 * file part is a label, a timestamp and random bytes, so a new upload never
 * replaces an existing object.
 */
export function objectKey(folders: string[], label: string, ext: string): string {
  for (const s of [...folders, label]) {
    if (typeof s !== "string" || !SEGMENT.test(s)) throw new AppError(400, "Invalid upload target.", "INVALID_UPLOAD_TARGET");
  }
  return [...folders, `${label}-${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`].join("/");
}

/** The sender's file name for showing back to people: no path, no control characters, bounded. */
export function safeDisplayName(name?: string | null): string | null {
  if (!name) return null;
  const base = name.split(/[\\/]/).pop() ?? "";
  // eslint-disable-next-line no-control-regex
  const clean = base.replace(/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g, "").replace(/\s+/g, " ").trim();
  return clean ? clean.slice(0, 120) : null;
}
