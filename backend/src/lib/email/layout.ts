import { env } from "../../config/env";

/**
 * Shared shell for every outbound email.
 *
 * Email clients are not browsers: Outlook renders through Word, which ignores
 * flexbox, grid and most modern CSS. Everything here is table-based with inline
 * styles and absolute image URLs, which is the only combination that renders
 * consistently across Gmail, Outlook, Apple Mail and mobile clients.
 */

export const SITE_URL = env.PUBLIC_SITE_URL || "https://www.devupecosystem.com";
export const LOGO_URL = `${SITE_URL}/images/devup-logo.png`;

const BRAND = "#c8f135";
const BG = "#0a0a0a";
const CARD = "#141414";
const TEXT = "#e4e4e4";
const MUTED = "#8b8b8b";

export const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export interface EmailOptions {
  /** Shown in the inbox preview line, before the body is opened. */
  preheader?: string;
  heading: string;
  /** Pre-escaped HTML for the body. */
  body: string;
  cta?: { label: string; url: string };
  /** Small print under the CTA, e.g. a plain-text fallback link. */
  footnote?: string;
  /** Name shown above the DevUp footer, for startup-issued mail. */
  fromOrg?: string;
  /**
   * Startup logo, shown beside the DevUp mark. Mail about a specific startup is
   * co-branded so the recipient recognises who it is actually from — DevUp is
   * the platform, the startup is the sender.
   */
  orgLogoUrl?: string | null;
}

/**
 * Header lockup. With a startup logo it becomes "DevUp × Startup" as a
 * three-cell table, which is the only layout Outlook renders reliably.
 */
function header(orgLogoUrl?: string | null, orgName?: string) {
  const devup = `<a href="${SITE_URL}" style="text-decoration:none;">
      <img src="${LOGO_URL}" width="118" alt="DevUp Ecosystem"
           style="display:block;width:118px;max-width:118px;height:auto;border:0;outline:none;">
    </a>`;

  if (!orgLogoUrl) {
    return `<tr><td align="center" style="padding-bottom:24px;">${devup}</td></tr>`;
  }

  return `<tr>
    <td align="center" style="padding-bottom:24px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="right" style="padding-right:14px;">${devup}</td>
          <td align="center" style="padding:0 14px;border-left:1px solid rgba(255,255,255,0.14);
                     font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${MUTED};">
            &times;
          </td>
          <td align="left" style="padding-left:14px;">
            <img src="${esc(orgLogoUrl)}" height="38" alt="${esc(orgName ?? "")}"
                 style="display:block;height:38px;width:auto;max-width:150px;border:0;outline:none;border-radius:6px;">
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

/** Bulletproof CTA — a table, because Outlook drops padding on <a>. */
function button(label: string, url: string) {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 6px;">
    <tr>
      <td align="center" bgcolor="${BRAND}" style="border-radius:10px;">
        <a href="${esc(url)}"
           style="display:inline-block;padding:13px 30px;font-family:Arial,Helvetica,sans-serif;
                  font-size:14px;font-weight:bold;color:#0a0a0a;text-decoration:none;border-radius:10px;">
          ${esc(label)}
        </a>
      </td>
    </tr>
  </table>`;
}

export function renderEmail(o: EmailOptions) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="dark light">
  <title>${esc(o.heading)}</title>
</head>
<body style="margin:0;padding:0;background:${BG};">
  <!-- Preheader: shown in the inbox list, hidden in the body. -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    ${esc(o.preheader ?? o.heading)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${BG}" style="background:${BG};">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">

          ${header(o.orgLogoUrl, o.fromOrg)}

          <!-- Card -->
          <tr>
            <td bgcolor="${CARD}" style="background:${CARD};border-radius:16px;padding:34px 32px;">
              <h1 style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:21px;
                         line-height:1.3;font-weight:bold;color:#ffffff;">
                ${esc(o.heading)}
              </h1>

              <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:${TEXT};">
                ${o.body}
              </div>

              ${o.cta ? button(o.cta.label, o.cta.url) : ""}

              ${
                o.footnote
                  ? `<p style="margin:18px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;
                              line-height:1.6;color:${MUTED};">${o.footnote}</p>`
                  : ""
              }
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 16px 0;">
              ${
                o.fromOrg
                  ? `<p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${MUTED};">
                       Sent by <strong style="color:${TEXT};">${esc(o.fromOrg)}</strong>
                     </p>`
                  : ""
              }
              <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${MUTED};">
                <a href="${SITE_URL}" style="color:${MUTED};text-decoration:none;">DevUp Ecosystem</a>
                &nbsp;·&nbsp; Hyderabad, India
              </p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#5a5a5a;">
                You are receiving this because you have an account on DevUp Ecosystem.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Paragraph helper so callers do not hand-write escaped markup. */
export const p = (text: string) =>
  `<p style="margin:0 0 14px;">${esc(text)}</p>`;

/** Bolded inline value, for names and references inside a paragraph. */
export const strong = (text: string) => `<strong style="color:#ffffff;">${esc(text)}</strong>`;

/** Key/value block used for offer and interview details. */
export function details(rows: Array<[string, string | undefined | null]>) {
  const visible = rows.filter(([, v]) => Boolean(v));
  if (visible.length === 0) return "";
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="margin:18px 0;border-collapse:collapse;">
    ${visible
      .map(
        ([k, v]) => `
      <tr>
        <td style="padding:8px 12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);
                   font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${MUTED};width:42%;">
          ${esc(k)}
        </td>
        <td style="padding:8px 12px;border:1px solid rgba(255,255,255,0.06);
                   font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#ffffff;">
          ${esc(v as string)}
        </td>
      </tr>`
      )
      .join("")}
  </table>`;
}
