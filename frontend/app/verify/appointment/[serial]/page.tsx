"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, XCircle, Clock, Ban, Search, ShieldCheck, ShieldAlert } from "lucide-react";

/**
 * Public verification of a Lead DevUp appointment.
 *
 * Reached by scanning the QR on the revenue stamp of a printed deed, almost
 * always by someone who has never seen this site — a college placement office,
 * an event desk, a company being approached by somebody claiming to represent
 * DevUp. It has to answer two questions at a glance: is this appointment real
 * and current, and what is this person actually allowed to do.
 *
 * The second question is the one that matters in practice. A director cannot
 * sign anything or promise anyone a placement, and the people most likely to be
 * told otherwise are exactly the ones scanning this code.
 */

interface Authority {
  may: string[];
  mayNot: string[];
}

interface Result {
  found: boolean;
  serial?: string;
  documentNo?: string;
  holder?: string;
  office?: string;
  territory?: string;
  state?: string;
  city?: string | null;
  institution?: string | null;
  effectiveFrom?: string;
  effectiveTo?: string;
  issuedAt?: string;
  status?: "ACTIVE" | "REVOKED" | "EXPIRED" | "PENDING";
  valid?: boolean;
  authority?: Authority;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const STATE: Record<
  string,
  { icon: typeof CheckCircle2; tone: string; title: string; detail: string }
> = {
  ACTIVE: {
    icon: CheckCircle2,
    tone: "#16A34A",
    title: "Appointment verified",
    detail: "This appointment is genuine and currently in force.",
  },
  EXPIRED: {
    icon: Clock,
    tone: "#B45309",
    title: "Term has ended",
    detail: "This appointment was genuine but its term has run out.",
  },
  REVOKED: {
    icon: Ban,
    tone: "#DC2626",
    title: "Appointment withdrawn",
    detail: "This person no longer holds this office.",
  },
  PENDING: {
    icon: Clock,
    tone: "#B45309",
    title: "Not yet in force",
    detail: "This appointment has been issued but its term has not started.",
  },
};

const fmt = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
    : "—";

export default function VerifyAppointmentPage() {
  const { serial } = useParams<{ serial: string }>();
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!serial) return;
    fetch(`${API}/api/verify/appointment/${encodeURIComponent(serial)}`)
      .then((r) => r.json())
      .then((j) => setResult(j.data))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [serial]);

  /* Light, not the dark product theme: this gets opened under office lighting,
     often on a cheap phone at arm's length. */
  return (
    <main className="min-h-screen bg-[#F4F5F7] px-5 py-10 text-[#14181C]">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-5 text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[2px] text-[#8B9299]">
            DevUp Ecosystem Pvt Ltd
          </div>
          <div className="text-[13px] text-[#5A6169]">Appointment verification</div>
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
              <h1 className="text-lg font-bold">No such appointment</h1>
              <p className="mt-1 text-sm text-[#5A6169]">
                Nothing matches <span className="font-mono">{String(serial)}</span>. Check the serial
                on the stamp, or treat the document as unverified.
              </p>
            </div>
          </Card>
        ) : (
          <Verdict result={result} />
        )}

        <p className="mt-5 text-center text-[11px] leading-relaxed text-[#8B9299]">
          Appointments are made to a named person and cannot be transferred.
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
  const state = STATE[result.status ?? "ACTIVE"] ?? STATE.ACTIVE;
  const Icon = state.icon;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-start gap-3">
          <Icon className="mt-0.5 h-9 w-9 shrink-0" style={{ color: state.tone }} />
          <div className="min-w-0">
            <h1 className="text-lg font-bold leading-tight" style={{ color: state.tone }}>
              {state.title}
            </h1>
            <p className="mt-1 text-sm text-[#5A6169]">{state.detail}</p>
          </div>
        </div>

        <div className="mt-5 border-t border-[#EDEFF1] pt-4">
          <div className="text-[11px] uppercase tracking-[1.5px] text-[#8B9299]">Holder</div>
          <div className="mt-0.5 text-xl font-bold leading-tight">{result.holder}</div>
          <div className="mt-1 text-[15px] text-[#14181C]">
            {result.office} &middot; <span className="font-semibold">{result.territory}</span>
          </div>
        </div>

        <dl className="mt-4 space-y-2 border-t border-[#EDEFF1] pt-4 text-sm">
          <Row k="Term" v={`${fmt(result.effectiveFrom)} — ${fmt(result.effectiveTo)}`} />
          {result.institution ? <Row k="Institution" v={result.institution} /> : null}
          <Row k="Instrument" v={result.documentNo ?? "—"} mono />
          <Row k="Stamp serial" v={result.serial ?? "—"} mono />
          <Row k="Issued" v={fmt(result.issuedAt)} />
        </dl>
      </Card>

      {/*
        The part that prevents the actual harm. Someone scans this because a
        student turned up saying they represent DevUp; what they need to know is
        the edge of that authority, not the dates.
      */}
      {result.authority ? (
        <Card>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#16A34A]" />
            <h2 className="text-sm font-semibold">
              What this {result.valid ? "office allows" : "office allowed"}
            </h2>
          </div>
          <ul className="mt-2.5 space-y-1.5">
            {result.authority.may.map((m) => (
              <li key={m} className="flex gap-2 text-sm text-[#3C444B]">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[#16A34A]" />
                {m}
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center gap-2 border-t border-[#EDEFF1] pt-3.5">
            <ShieldAlert className="h-4 w-4 text-[#DC2626]" />
            <h2 className="text-sm font-semibold">What it never allows</h2>
          </div>
          <ul className="mt-2.5 space-y-1.5">
            {result.authority.mayNot.map((m) => (
              <li key={m} className="flex gap-2 text-sm text-[#3C444B]">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[#DC2626]" />
                {m}
              </li>
            ))}
          </ul>
          <p className="mt-3.5 rounded-lg bg-[#FBF7EC] px-3 py-2 text-[12px] leading-relaxed text-[#7A5C1E]">
            If anyone has told you otherwise, treat it as unauthorised and write to{" "}
            <a className="underline" href="mailto:ventures@devupecosystem.com">
              ventures@devupecosystem.com
            </a>
            .
          </p>
        </Card>
      ) : null}
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-[#8B9299]">{k}</dt>
      <dd className={`text-right ${mono ? "font-mono text-[12px]" : ""}`}>{v}</dd>
    </div>
  );
}
