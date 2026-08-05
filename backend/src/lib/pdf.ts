import { logger } from "../middleware/logger";

/**
 * HTML → PDF using headless Chrome.
 *
 * The HR templates are already print-styled HTML with @page rules, so rendering
 * them through a real browser gives output identical to what a person would get
 * from Ctrl+P — which matters, because candidates print these and show them to
 * colleges.
 *
 * Chromium is heavy and may be unavailable in some deployments, so every failure
 * path degrades to "no PDF" rather than breaking document issuance. The document
 * record and its HTML are always saved either way.
 */

type Browser = { newPage: () => Promise<any>; close: () => Promise<void> };

let browserPromise: Promise<Browser | null> | null = null;
let unavailableReason: string | null = null;

async function getBrowser(): Promise<Browser | null> {
  if (unavailableReason) return null;
  if (browserPromise) return browserPromise;

  browserPromise = (async () => {
    try {
      const puppeteer = (await import("puppeteer")).default as any;
      return (await puppeteer.launch({
        headless: true,
        // Required in containers; dev-shm is tiny there and Chrome will crash.
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"],
      })) as Browser;
    } catch (err) {
      unavailableReason = (err as Error).message;
      logger.warn(`PDF rendering unavailable, documents will be HTML only: ${unavailableReason}`);
      return null;
    }
  })();

  return browserPromise;
}

export function isPdfAvailable() {
  return unavailableReason === null;
}

export interface PdfOptions {
  /** A4 for letters, or a custom size for ID cards. */
  width?: string;
  height?: string;
  landscape?: boolean;
}

export async function htmlToPdf(html: string, opts: PdfOptions = {}): Promise<Buffer | null> {
  const browser = await getBrowser();
  if (!browser) return null;

  let page: any;
  try {
    page = await browser.newPage();

    // waitUntil networkidle0 so remote logos and signature images are painted
    // before the snapshot; without it letters can render with missing branding.
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 20000 });

    const pdf = await page.pdf({
      ...(opts.width && opts.height
        ? { width: opts.width, height: opts.height }
        : { format: "A4" }),
      landscape: opts.landscape ?? false,
      printBackground: true,
      preferCSSPageSize: true,
    });

    return Buffer.from(pdf);
  } catch (err) {
    logger.error(`PDF render failed: ${(err as Error).message}`);
    return null;
  } finally {
    if (page) await page.close().catch(() => {});
  }
}

/** Frees Chromium on shutdown so the process can exit cleanly. */
export async function closePdfBrowser() {
  if (!browserPromise) return;
  const b = await browserPromise.catch(() => null);
  if (b) await b.close().catch(() => {});
  browserPromise = null;
}
