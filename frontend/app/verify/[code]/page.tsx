"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, XCircle, Clock, Ban, Search } from "lucide-react";

/**
 * Public ticket verification.
 *
 * Opened by scanning the QR on a printed ticket, usually by someone at a
 * reception desk who has never seen this site before. It has to answer one
 * question in one glance — is this good — and it must not require an account,
 * because the person checking is the partner's staff, not a DevUp member.
 *
 * Checking is deliberately read-only. Consuming a ticket happens in the
 * partner portal, so a curious scan cannot burn somebody's benefit.
 */

interface Result {
  found: boolean;
  code?: string;
  status?: string;
  valid?: boolean;
  recipientName?: string;
  perkTitle?: string;
  perkSubtitle?: string | null;
  partnerName?: string;
  partnerLogoUrl?: string | null;
  brandColor?: string;
  finalPrice?: number | null;
  originalPrice?: number | null;
  priceUnit?: string | null;
  sourceEvent?: string | null;
  issuedAt?: string;
  expiresAt?: string;
  redeemedAt?: string | null;
  revokeReason?: string | null;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const STATE: Record<
  string,
  { icon: typeof CheckCircle2; tone: string; title: string; detail: string }
> = {
  ISSUED: { icon: CheckCircle2, tone: "#16A34A", title: "Valid", detail: "Accept this ticket." },
  REDEEMED: { icon: XCircle, tone: "#DC2626", title: "Already used", detail: "This ticket has been redeemed." },
  EXPIRED: { icon: Clock, tone: "#B45309", title: "Expired", detail: "This ticket is past its validity date." },
  REVOKED: { icon: Ban, tone: "#DC2626", title: "Revoked", detail: "This ticket was withdrawn." },
};

export default function VerifyPage() {
  const { code } = useParams<{ code: string }>();
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!code) return;
    fetch(`${API}/api/verify/${encodeURIComponent(code)}`)
      .then((r) => r.json())
      .then((j) => setResult(j.data))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [code]);

  /* Light, not the dark product theme: this gets opened under fluorescent
     reception lighting, often on a cheap phone at arm's length. */
  return (
    <main className="min-h-screen bg-[#F4F5F7] px-5 py-10 text-[#14181C]">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-5 text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[2px] text-[#8B9299]">
            DevUp Ecosystem
          </div>
          <div className="text-[13px] text-[#5A6169]">Ticket verification</div>
        </div>

        {loading ? (
          <Card>
            <p className="py-8 text-center text-sm text-[#5A6169]">Checking…</p>
          </Card>
        ) : failed ? (
          <Card>
            <p className="py-8 text-center text-sm text-[#DC2626]">
              Could not reach the verification service. Check your connection and try again.
            </p>
          </Card>
        ) : !result?.found ? (
          <Card>
            <div className="py-6 text-center">
              <Search className="mx-auto mb-3 h-9 w-9 text-[#B4BABF]" />
              <h1 className="text-lg font-bold">No such ticket</h1>
              <p className="mt-1 text-sm text-[#5A6169]">
                Nothing matches <span className="font-mono">{String(code)}</span>. Check the code and
                try again.
              </p>
            </div>
          </Card>
        ) : (
          <Verdict result={result} />
        )}

        <p className="mt-5 text-center text-[11px] leading-relaxed text-[#8B9299]">
          Tickets are issued to a named person and cannot be transferred.
          <br />
          Please check the holder&apos;s name against their ID.
        </p>
      </div>
    </main>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#E3E6E9] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      {children}
    </div>
  );
}

function Verdict({ result }: { result: Result }) {
  const state = STATE[result.status ?? "EXPIRED"] ?? STATE.EXPIRED;
  const Icon = state.icon;
  const accent = result.brandColor ?? "#1F7A4D";

  return (
    <Card>
      {/* The verdict comes first and largest — the desk needs it before detail. */}
      <div
        className="-mx-5 -mt-5 mb-5 flex items-center gap-3 rounded-t-2xl px-5 py-4"
        style={{ background: `${state.tone}10`, borderBottom: `1px solid ${state.tone}22` }}
      >
        <Icon className="h-7 w-7 shrink-0" style={{ color: state.tone }} />
        <div>
          <div className="text-lg font-bold leading-tight" style={{ color: state.tone }}>
            {state.title}
          </div>
          <div className="text-[12.5px] text-[#5A6169]">{state.detail}</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-[10.5px] font-semibold uppercase tracking-[1.6px] text-[#8B9299]">
          Issued to
        </div>
        <div className="text-xl font-bold">{result.recipientName}</div>
        {result.sourceEvent && (
          <div className="text-[12px] text-[#5A6169]">Awarded at {result.sourceEvent}</div>
        )}
      </div>

      <div className="rounded-xl border border-[#E3E6E9] p-3.5">
        <div className="flex items-center gap-2.5">
          {result.partnerLogoUrl ? (
            <img src={result.partnerLogoUrl} alt="" className="h-7 w-7 rounded bg-white object-contain" />
          ) : (
            <span className="h-7 w-7 rounded" style={{ background: accent }} />
          )}
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold">{result.perkTitle}</div>
            <div className="text-[11.5px] text-[#5A6169]">{result.partnerName}</div>
          </div>
        </div>

        {result.finalPrice != null && (
          <div className="mt-3 flex items-baseline gap-2 border-t border-[#EDEFF1] pt-3">
            {result.originalPrice != null && (
              <span className="text-[12px] text-[#8B9299] line-through">
                ₹{result.originalPrice.toLocaleString("en-IN")}
              </span>
            )}
            <span className="text-lg font-bold" style={{ color: accent }}>
              ₹{result.finalPrice.toLocaleString("en-IN")}
            </span>
            {result.priceUnit && (
              <span className="text-[11px] uppercase tracking-wider text-[#8B9299]">
                {result.priceUnit}
              </span>
            )}
          </div>
        )}
      </div>

      <dl className="mt-4 space-y-1.5 text-[12px]">
        <Row label="Code" value={<span className="font-mono">{result.code}</span>} />
        {result.issuedAt && <Row label="Issued" value={fmt(result.issuedAt)} />}
        {result.expiresAt && <Row label="Valid until" value={fmt(result.expiresAt)} />}
        {result.redeemedAt && <Row label="Redeemed" value={fmt(result.redeemedAt)} />}
        {result.revokeReason && <Row label="Reason" value={result.revokeReason} />}
      </dl>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-[#8B9299]">{label}</dt>
      <dd className="text-right font-medium text-[#14181C]">{value}</dd>
    </div>
  );
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
