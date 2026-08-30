import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";
import { env } from "../config/env";
import { logger } from "../middleware/logger";

/**
 * Encryption for secrets held on behalf of clients.
 *
 * AES-256-GCM, so a tampered ciphertext fails to decrypt rather than returning
 * plausible rubbish. The key never goes in the database: the whole point of
 * encrypting a column is that reading the table is not enough, and a key stored
 * beside the data defeats that entirely.
 *
 * Deliberately small. There is no key rotation, no versioning, no envelope
 * scheme — those matter at a scale this is not at, and a complicated crypto
 * layer nobody understands is worse than a simple one everybody does.
 */

const ALGORITHM = "aes-256-gcm";

/**
 * The key, as 32 bytes.
 *
 * A hex or base64 secret of the right length is used directly. Anything else is
 * hashed to length, so a passphrase works — badly, but predictably — rather
 * than throwing at the moment somebody tries to save a credential.
 */
function key(): Buffer | null {
  const raw = env.CREDENTIAL_ENCRYPTION_KEY;
  if (!raw) return null;

  if (/^[0-9a-f]{64}$/i.test(raw)) return Buffer.from(raw, "hex");
  const b64 = Buffer.from(raw, "base64");
  if (b64.length === 32) return b64;
  return createHash("sha256").update(raw).digest();
}

export function secretsAvailable() {
  return key() !== null;
}

export interface Sealed {
  cipher: string;
  iv: string;
  tag: string;
}

/**
 * Encrypts a secret for storage.
 *
 * Throws rather than storing plaintext when no key is configured. A silent
 * fallback would put client credentials in the clear in a shared database, and
 * nothing downstream would ever indicate it had happened.
 */
export function seal(plain: string): Sealed {
  const k = key();
  if (!k) {
    throw new Error(
      "CREDENTIAL_ENCRYPTION_KEY is not set — refusing to store a secret unencrypted"
    );
  }

  const iv = randomBytes(12);
  const c = createCipheriv(ALGORITHM, k, iv);
  const cipher = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return {
    cipher: cipher.toString("base64"),
    iv: iv.toString("base64"),
    tag: c.getAuthTag().toString("base64"),
  };
}

/**
 * Decrypts, or returns null.
 *
 * Null covers every failure — wrong key, tampered ciphertext, a row written
 * before the key changed. The caller shows "cannot be decrypted" either way,
 * and distinguishing the causes to a user only helps someone probing.
 */
export function open(sealed: Partial<Sealed>): string | null {
  const k = key();
  if (!k || !sealed.cipher || !sealed.iv || !sealed.tag) return null;

  try {
    const d = createDecipheriv(ALGORITHM, k, Buffer.from(sealed.iv, "base64"));
    d.setAuthTag(Buffer.from(sealed.tag, "base64"));
    return Buffer.concat([
      d.update(Buffer.from(sealed.cipher, "base64")),
      d.final(),
    ]).toString("utf8");
  } catch {
    logger.warn("a stored secret could not be decrypted");
    return null;
  }
}

/** Enough to recognise a secret without revealing it. */
export function hint(plain: string) {
  if (plain.length <= 4) return "••••";
  return `••••${plain.slice(-4)}`;
}
