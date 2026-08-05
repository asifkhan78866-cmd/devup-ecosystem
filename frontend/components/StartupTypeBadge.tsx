"use client";

import { Handshake } from "lucide-react";

export const ECOSYSTEM_PARTNER = "ECOSYSTEM_PARTNER";

export function isPartner(startup: { type?: string | null } | null | undefined) {
  return startup?.type === ECOSYSTEM_PARTNER;
}

/**
 * Marks an organisation as an external ecosystem partner rather than something
 * DevUp built. Rendered wherever partners appear alongside ventures so the two
 * are never visually conflated.
 */
export default function StartupTypeBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full whitespace-nowrap"
      style={{
        padding: compact ? "2px 7px" : "3px 10px",
        fontFamily: "var(--font-inter), sans-serif",
        fontSize: compact ? "9px" : "10px",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        background: "rgba(120,170,255,0.10)",
        border: "1px solid rgba(120,170,255,0.28)",
        color: "#8fb6ff",
      }}
    >
      <Handshake style={{ width: compact ? 9 : 11, height: compact ? 9 : 11 }} />
      {compact ? "Partner" : "Ecosystem Partner"}
    </span>
  );
}
