import { readFile } from "fs/promises";
import path from "path";
import { logger } from "../../middleware/logger";

/**
 * The company's seals and stamps, as data URIs.
 *
 * Read off disk rather than fetched: a document template cannot recover from a
 * seal that fails to download, and an appointment that goes out with a blank
 * square where the seal should be is worse than one that is late. They are
 * loaded once and held for the life of the process.
 *
 * The source scans are JPEGs with solid backgrounds; the transparent PNGs here
 * were keyed out from them, so they can sit on cream paper without showing a
 * rectangle.
 */

export type StampName = "officialSeal" | "waxSeal" | "authorisedSign" | "inkStamp";

const FILES: Record<StampName, string> = {
  /** Flat blue ink roundel. The seal of office on the deed. */
  officialSeal: "official-seal.png",
  /** Embossed wax. Reserved for the certificate, which is the piece people show. */
  waxSeal: "wax-seal.png",
  /** "For DevUp Ecosystem Pvt. Ltd. … Authorised Signatory" with the signature. */
  authorisedSign: "authorised-sign.png",
  /** Ink roundel with the DevUp flourish. Used on the handbook. */
  inkStamp: "ink-stamp.png",
};

// __dirname is dist/modules/... once built, and the assets are not compiled,
// so the path walks back to src.
const DIR = path.resolve(__dirname, "../../assets/stamps");
const SRC_DIR = path.resolve(process.cwd(), "src/assets/stamps");

const cache = new Map<StampName, string | null>();

async function load(name: StampName): Promise<string | null> {
  if (cache.has(name)) return cache.get(name) ?? null;
  const file = FILES[name];
  let uri: string | null = null;
  for (const dir of [DIR, SRC_DIR]) {
    try {
      const buf = await readFile(path.join(dir, file));
      uri = `data:image/png;base64,${buf.toString("base64")}`;
      break;
    } catch {
      /* try the next location */
    }
  }
  if (!uri) logger.warn(`stamp asset missing: ${file}`);
  cache.set(name, uri);
  return uri;
}

export interface Stamps {
  officialSeal: string | null;
  waxSeal: string | null;
  authorisedSign: string | null;
  inkStamp: string | null;
}

export async function loadStamps(): Promise<Stamps> {
  const [officialSeal, waxSeal, authorisedSign, inkStamp] = await Promise.all([
    load("officialSeal"),
    load("waxSeal"),
    load("authorisedSign"),
    load("inkStamp"),
  ]);
  return { officialSeal, waxSeal, authorisedSign, inkStamp };
}
