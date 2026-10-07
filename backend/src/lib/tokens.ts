import { createHash, randomBytes } from "crypto";

/**
 * Bearer tokens that travel by email: verification links and invitations.
 *
 * 256 bits from the CSPRNG, URL-safe. Only the SHA-256 is ever stored, so a
 * copy of the database — a backup, a leaked dump, a curious admin — cannot be
 * turned back into a working link. A fast hash is enough here: the input is
 * random, not a guessable password.
 */
export function newToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}
