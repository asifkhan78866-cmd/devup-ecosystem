"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Ticket, Download, CheckCircle2, Clock, XCircle } from "lucide-react";
import ProtectedContent from "@/components/auth/ProtectedContent";
import { candidateApi } from "@/lib/api/workspace";

/**
 * Tickets the signed-in person has been awarded.
 *
 * Most were issued before they had an account — awarded at an event, by email —
 * so the backend matches on address as well as user id and writes the link
 * back on first visit.
 */

interface MyTicket {
  id: string;
  code: string;
  status: string;
  recipientName: string;
  sourceEvent: string | null;
  issuedAt: string;
  expiresAt: string;
  redeemedAt: string | null;
  pdfUrl: string | null;
  perk: {
    title: string;
    subtitle: string | null;
    finalPrice: number | null;
    originalPrice: number | null;
    priceUnit: string | null;
    percentOff: number | null;
    terms: string[];
  };
  partner: {
    name: string;
    logoUrl: string | null;
    brandColor: string;
    address: string | null;
    phone: string | null;
  };
}

const STATE: Record<string, { icon: typeof CheckCircle2; tone: string; label: string }> = {
  ISSUED: { icon: CheckCircle2, tone: "#c8f135", label: "Ready to use" },
  REDEEMED: { icon: XCircle, tone: "#8fb6ff", label: "Used" },
  EXPIRED: { icon: Clock, tone: "#8b9299", label: "Expired" },
};

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<MyTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    candidateApi
      .myTickets()
      .then(setTickets)
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedContent blurRadius={12} message="Login to view your tickets">
      <div className="min-h-screen bg-[#0a0a0a] pb-24 pt-28">
        <div className="mx-auto max-w-3xl px-6">
          <Link href="/dashboard" className="mb-6 inline-block text-sm text-[#c8f135] hover:underline">
            &larr; Back to Dashboard
          </Link>

          <h1 className="mb-1 text-3xl text-white" style={{ fontFamily: "var(--font-syne)", fontWeight: 800 }}>
            My Passes
          </h1>
          <p className="mb-7 text-sm text-[#a1a1a1]">
            Benefits from DevUp partners, awarded to you.
          </p>

          {loading ? (
            <p className="text-sm text-[#6b6b6b]">Loading…</p>
          ) : tickets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-10 text-center">
              <Ticket className="mx-auto mb-3 h-8 w-8 text-[#3d3d3d]" />
              <p className="text-sm text-[#6b6b6b]">
                No passes yet. These are awarded at DevUp events.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((t) => (
                <TicketCard key={t.id} t={t} />
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedContent>
  );
}

function TicketCard({ t }: { t: MyTicket }) {
  const state = STATE[t.status] ?? STATE.EXPIRED;
  const Icon = state.icon;
  const spent = t.status !== "ISSUED";

  return (
    <div
      className="overflow-hidden rounded-2xl border bg-[#111111]"
      style={{ borderColor: spent ? "rgba(255,255,255,0.06)" : `${t.partner.brandColor}44`, opacity: spent ? 0.65 : 1 }}
    >
      <div className="flex flex-wrap items-center gap-3 border-b border-white/5 px-5 py-3.5">
        {t.partner.logoUrl ? (
          <img src={t.partner.logoUrl} alt="" className="h-8 w-8 rounded bg-white object-contain p-0.5" />
        ) : (
          <span className="h-8 w-8 rounded" style={{ background: t.partner.brandColor }} />
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white">{t.partner.name}</div>
          {t.sourceEvent && <div className="text-[11px] text-[#6b6b6b]">Awarded at {t.sourceEvent}</div>}
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: state.tone }}>
          <Icon className="h-3.5 w-3.5" /> {state.label}
        </span>
      </div>

      <div className="p-5">
        <h2 className="text-[17px] font-bold text-white">{t.perk.title}</h2>
        {t.perk.subtitle && <p className="mt-1 text-[12.5px] text-[#a1a1a1]">{t.perk.subtitle}</p>}

        {t.perk.finalPrice != null && (
          <div className="mt-3 flex items-baseline gap-2">
            {t.perk.originalPrice != null && (
              <span className="text-[13px] text-[#6b6b6b] line-through">
                ₹{t.perk.originalPrice.toLocaleString("en-IN")}
              </span>
            )}
            <span className="text-xl font-bold" style={{ color: t.partner.brandColor }}>
              ₹{t.perk.finalPrice.toLocaleString("en-IN")}
            </span>
            {t.perk.priceUnit && (
              <span className="text-[10px] uppercase tracking-wider text-[#6b6b6b]">{t.perk.priceUnit}</span>
            )}
          </div>
        )}

        {/* The code is the whole point of the page — big enough to read out. */}
        <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-center">
          <div className="text-[10px] uppercase tracking-[1.6px] text-[#6b6b6b]">Your code</div>
          <div
            className="mt-1 font-mono text-lg font-bold tracking-[2px]"
            style={{ color: spent ? "#6b6b6b" : t.partner.brandColor }}
          >
            {t.code}
          </div>
          <div className="mt-1.5 text-[11px] text-[#6b6b6b]">
            {t.status === "REDEEMED" && t.redeemedAt
              ? `Used on ${fmt(t.redeemedAt)}`
              : t.status === "EXPIRED"
                ? `Expired ${fmt(t.expiresAt)}`
                : `Valid until ${fmt(t.expiresAt)}`}
          </div>
        </div>

        {t.partner.address && (
          <p className="mt-3 text-[11.5px] leading-relaxed text-[#8b8b8b]">
            {t.partner.address}
            {t.partner.phone ? ` · ${t.partner.phone}` : ""}
          </p>
        )}

        {t.perk.terms.length > 0 && (
          <ul className="mt-3 list-disc space-y-0.5 pl-4 text-[11px] text-[#5a5a5a]">
            {t.perk.terms.slice(0, 3).map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        )}

        {t.pdfUrl && (
          <a
            href={t.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium"
            style={{ background: `${t.partner.brandColor}22`, color: t.partner.brandColor }}
          >
            <Download className="h-3.5 w-3.5" /> Download ticket
          </a>
        )}
      </div>
    </div>
  );
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
