import { readFileSync } from "fs";
import path from "path";

/**
 * Stamp and seal assets for HRMS document templates.
 *
 * These are loaded synchronously at module init and held as base64 data URIs
 * for the lifetime of the process — identical to the approach in
 * lead-applications/stamps.ts but synchronous because the template functions
 * that consume them are pure string interpolations and cannot await.
 */

const STAMPS_DIR = path.resolve(__dirname, "../../assets/stamps");
const SRC_STAMPS_DIR = path.resolve(process.cwd(), "src/assets/stamps");

function loadAsDataUri(filename: string): string {
  for (const dir of [STAMPS_DIR, SRC_STAMPS_DIR]) {
    try {
      const buf = readFileSync(path.join(dir, filename));
      return `data:image/png;base64,${buf.toString("base64")}`;
    } catch {
      /* try the next location */
    }
  }
  // Return a transparent 1×1 PNG so the template never has a broken src.
  return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
}

export const DEVUP_AUTHORISED_SIGN_STAMP = loadAsDataUri("authorised-sign.png");
export const DEVUP_WAX_SEAL = loadAsDataUri("wax-seal.png");
export const DEVUP_OFFICIAL_SEAL = loadAsDataUri("official-seal.png");
