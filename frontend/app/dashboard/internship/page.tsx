"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Building2, Home, Upload, Check, Clock, CalendarDays, AlertCircle, ShieldCheck, Download, FileText,
} from "lucide-react";
import ProtectedContent from "@/components/auth/ProtectedContent";
import { candidateApi, ONBOARDING_DOC_LABELS } from "@/lib/api/workspace";
import StartupLogo from "@/components/StartupLogo";
import WorkUpdates from "@/components/worklog/WorkUpdates";

/**
 * The intern's own dashboard.
 *
 * Everything here belongs to them: their internship, their hours, their
 * documents. Deliberately not the workspace at /s/[code] — that is a hiring
 * tool for staff, showing applicant names, funnels and colleagues' records.
 * There is no stipend figure anywhere on this page; what someone is paid is
 * founder-only.
 */
export default function MyInternshipPage() {
  const [cards, setCards] = useState<any[]>([]);
  const [checklists, setChecklists] = useState<any[]>([]);
  const [issued, setIssued] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [a, o, d] = await Promise.all([
        candidateApi.myAttendance().catch(() => []),
        candidateApi.myOnboarding().catch(() => []),
        candidateApi.myDocuments().catch(() => []),
      ]);
      setCards(a ?? []);
      setChecklists(o ?? []);
      setIssued(d ?? []);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (internId: string, action: "in" | "out") => {
    setBusy(internId);
    setError(null);
    try {
      if (action === "in") await candidateApi.checkIn(internId);
      else await candidateApi.checkOut(internId);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  const upload = async (personId: string, docType: string, file: File) => {
    setBusy(personId + docType);
    setError(null);
    setNotice(null);
    try {
      await candidateApi.uploadMyDoc(personId, docType, file);
      setNotice("Uploaded — your HR team will review it shortly.");
      await load();
    } catch (e: any) {
      setError(e.message || "Upload failed. Use a PDF or image under 10 MB.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <ProtectedContent blurRadius={12} message="Login to view your internship">
      <div className="min-h-screen bg-[#0a0a0a] pt-28 pb-24">
        <div className="max-w-3xl mx-auto px-6">
          <Link href="/dashboard" className="text-[#c8f135] text-sm hover:underline mb-6 inline-block">
            &larr; Back to Dashboard
          </Link>

          <h1 className="text-3xl text-white mb-1" style={{ fontFamily: "var(--font-syne)", fontWeight: 800 }}>
            My Internship
          </h1>
          <p className="text-[#a1a1a1] text-sm mb-7">
            Your hours, your documents, your progress.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-300 text-sm">{error}</div>
          )}
          {notice && (
            <div className="mb-4 p-3 rounded-lg border border-[#c8f135]/20 bg-[#c8f135]/10 text-[#c8f135] text-sm">{notice}</div>
          )}

          {loading ? (
            <p className="text-[#6b6b6b] text-sm">Loading…</p>
          ) : cards.length === 0 && checklists.length === 0 && issued.length === 0 ? (
            <div className="p-10 rounded-xl border border-dashed border-white/10 text-center">
              <CalendarDays className="w-8 h-8 text-[#3d3d3d] mx-auto mb-3" />
              <p className="text-[#6b6b6b] text-sm">
                Nothing here yet. This page fills in once your internship starts.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {cards.map((c) => (
                <div key={c.internId} className="space-y-6">
                  <InternshipCard card={c} busy={busy === c.internId} onAct={act} />
                  {/* Only meaningful once they are checked in for the day. */}
                  <WorkUpdates internId={c.internId} />
                </div>
              ))}

              {issued.length > 0 && <IssuedDocuments docs={issued} />}

              {checklists.map((list) => (
                <DocumentsCard
                  key={list.person.id}
                  list={list}
                  busy={busy}
                  onUpload={upload}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedContent>
  );
}

function duration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function InternshipCard({ card, busy, onAct }: any) {
  const t = card.today;
  const isOffice = t.mode === "OFFICE";
  const days = Math.max(
    0,
    Math.ceil((new Date(card.endDate).getTime() - Date.now()) / 864e5)
  );

  return (
    <div className="rounded-2xl bg-[#111111] border border-white/[0.07] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
        <StartupLogo src={card.startup?.logoUrl} name={card.startup?.name} className="w-10 h-10" />
        <div className="min-w-0 flex-1">
          <div className="text-white text-[15px] font-semibold truncate">{card.startup?.name}</div>
          <div className="text-[11.5px] text-[#8b8b8b] truncate">
            {card.designation}
            {card.department ? ` · ${card.department}` : ""}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] text-[#c8f135] tabular-nums">{card.internCode}</div>
          <div className="text-[10px] text-[#6b6b6b]">{days} days left</div>
        </div>
      </div>

      <div className="p-6">
        {!t.isWorkingDay ? (
          <div className="text-center py-6">
            <p className="text-[#8b8b8b] text-sm">Today is not a working day.</p>
            <p className="text-[11px] text-[#4d4d4d] mt-1">Nothing to record — enjoy it.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center mb-5">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium"
                style={
                  isOffice
                    ? { background: "rgba(200,241,53,0.12)", color: "#c8f135" }
                    : { background: "rgba(143,182,255,0.12)", color: "#8fb6ff" }
                }
              >
                {isOffice ? <Building2 className="w-3 h-3" /> : <Home className="w-3 h-3" />}
                {isOffice
                  ? `Office day · ${t.officeStart}–${t.officeEnd}`
                  : `Remote day · ${duration(t.requiredMinutes)} minimum`}
              </span>
            </div>

            <LiveTimer today={t} />

            <div className="flex items-center justify-center gap-6 text-[11px] text-[#6b6b6b] mb-6">
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                In {t.checkIn ? new Date(t.checkIn).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : "—"}
              </span>
              <span>
                Out {t.checkOut ? new Date(t.checkOut).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : "—"}
              </span>
            </div>

            {t.canCheckIn && (
              <button
                disabled={busy}
                onClick={() => onAct(card.internId, "in")}
                className="w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-40 transition"
                style={{ background: "#c8f135", color: "#0a0a0a" }}
              >
                {busy ? "…" : "Check In"}
              </button>
            )}
            {t.canCheckOut && (
              <button
                disabled={busy}
                onClick={() => onAct(card.internId, "out")}
                className="w-full py-3 rounded-xl text-sm font-semibold border border-white/12 text-[#e4e4e4] hover:border-white/25 disabled:opacity-40 transition"
              >
                {busy ? "…" : "Check Out"}
              </button>
            )}
            {!t.canCheckIn && !t.canCheckOut && (
              <div className="text-center py-2 text-[#6b6b6b] text-xs">
                Done for today — {duration(t.workedMinutes)} recorded.
              </div>
            )}
          </>
        )}

        <MonthGrid internId={card.internId} officeDays={card.officeDays} />
      </div>
    </div>
  );
}

function LiveTimer({ today }: any) {
  const [, force] = useState(0);

  useEffect(() => {
    if (today.checkIn && !today.checkOut) {
      const id = setInterval(() => force((n) => n + 1), 1000);
      return () => clearInterval(id);
    }
  }, [today.checkIn, today.checkOut]);

  if (!today.checkIn) {
    return (
      <div className="text-center mb-5">
        <div className="text-[#3d3d3d] text-[44px] font-bold tabular-nums leading-none">00:00</div>
        <div className="text-[11px] text-[#6b6b6b] mt-2">Not started</div>
      </div>
    );
  }

  // Re-derived from the server timestamp each tick, never incremented, so a
  // sleeping laptop cannot drift the display away from what is recorded.
  const end = today.checkOut ? new Date(today.checkOut) : new Date();
  const secs = Math.max(0, Math.floor((end.getTime() - new Date(today.checkIn).getTime()) / 1000));
  const hh = String(Math.floor(secs / 3600)).padStart(2, "0");
  const mm = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const met = secs / 60 >= today.requiredMinutes;

  return (
    <div className="text-center mb-5">
      <div className="text-[44px] font-bold tabular-nums leading-none" style={{ color: met ? "#c8f135" : "#e4e4e4" }}>
        {hh}:{mm}
        <span className="text-[22px] text-[#6b6b6b]">:{ss}</span>
      </div>
      <div className="text-[11px] mt-2" style={{ color: met ? "#c8f135" : "#6b6b6b" }}>
        {met
          ? "Minimum hours met"
          : `${duration(Math.max(0, today.requiredMinutes - Math.floor(secs / 60)))} to go`}
      </div>
    </div>
  );
}

const STATUS_COLOUR: Record<string, string> = {
  PRESENT: "#c8f135",
  LATE: "#facc15",
  HALF_DAY: "#fb923c",
  LEAVE: "#8fb6ff",
  ABSENT: "#f87171",
  HOLIDAY: "#3d3d3d",
  PENDING: "#2a2a2a",
  OPEN: "#facc15",
};

function MonthGrid({ internId, officeDays }: { internId: string; officeDays: number[] }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const now = new Date();
    candidateApi
      .myAttendanceMonth(internId, now.getFullYear(), now.getMonth() + 1)
      .then(setData)
      .catch(() => {});
  }, [internId]);

  if (!data) return null;

  return (
    <div className="mt-7 pt-5 border-t border-white/5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] text-[#8b8b8b] uppercase tracking-wider">
          {new Date(data.year, data.month - 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
        </span>
        <span className="text-[11px] tabular-nums font-medium" style={{ color: "#c8f135" }}>
          {data.attendancePercent}% attendance
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {data.entries.map((e: any) => (
          <div
            key={e.date}
            title={`${new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · ${e.mode} · ${e.status}`}
            className="w-7 h-7 rounded flex items-center justify-center text-[10px] font-medium"
            style={{
              background: `${STATUS_COLOUR[e.status] ?? "#2a2a2a"}22`,
              color: STATUS_COLOUR[e.status] ?? "#6b6b6b",
              border: `1px solid ${STATUS_COLOUR[e.status] ?? "#2a2a2a"}44`,
            }}
          >
            {new Date(e.date).getUTCDate()}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[#6b6b6b]">
        {Object.entries(data.totals).map(([k, v]) => (
          <span key={k}>
            <span style={{ color: STATUS_COLOUR[k] ?? "#6b6b6b" }}>●</span>{" "}
            {k.replace(/_/g, " ").toLowerCase()} {String(v)}
          </span>
        ))}
      </div>

      <p className="text-[10px] text-[#4d4d4d] mt-3">
        Office days: {officeDays.map((d) => DAY_LABELS[d - 1]).join(", ")} · the rest are remote.
      </p>
    </div>
  );
}

function DocumentsCard({ list, busy, onUpload }: any) {
  const done = list.progress?.complete;

  return (
    <div className="rounded-2xl bg-[#111111] border border-white/[0.07] p-6">
      <div className="flex items-start justify-between gap-3 mb-1">
        <h2 className="text-white text-[15px] font-semibold" style={{ fontFamily: "var(--font-syne)" }}>
          Your documents
        </h2>
        <span className="text-[11px] tabular-nums" style={{ color: done ? "#c8f135" : "#facc15" }}>
          {list.progress?.requiredApproved ?? 0} of {list.progress?.requiredTotal ?? 0} approved
        </span>
      </div>
      <p className="text-[11.5px] text-[#6b6b6b] mb-4">
        Photos of the originals are fine. {list.startup?.name} will review each one.
      </p>

      <div className="mb-4 flex gap-2.5 rounded-xl border border-white/10 bg-white/[0.02] p-3">
        <ShieldCheck className="w-4 h-4 text-[#8fb6ff] shrink-0 mt-0.5" />
        <p className="text-[11px] text-[#8b8b8b]">
          Only your HR team can open these. They are never shown to other interns or on your public profile.
        </p>
      </div>

      <div className="space-y-2">
        {list.items.map((item: any) => (
          <DocRow
            key={item.docType}
            item={item}
            personId={list.person.id}
            busy={busy === list.person.id + item.docType}
            onUpload={onUpload}
          />
        ))}
      </div>
    </div>
  );
}

function DocRow({ item, personId, busy, onUpload }: any) {
  const status = item.document?.status ?? "MISSING";
  const tone: Record<string, { bg: string; fg: string; label: string }> = {
    APPROVED: { bg: "rgba(200,241,53,0.12)", fg: "#c8f135", label: "Approved" },
    PENDING: { bg: "rgba(250,204,21,0.12)", fg: "#facc15", label: "Under review" },
    REJECTED: { bg: "rgba(248,113,113,0.12)", fg: "#f87171", label: "Re-upload" },
    MISSING: { bg: "rgba(255,255,255,0.04)", fg: "#6b6b6b", label: "Not uploaded" },
  };
  const t = tone[status] ?? tone.MISSING;
  const canUpload = status !== "APPROVED";

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] p-3">
      <div className="min-w-0 flex-1">
        <div className="text-[13px] text-[#e4e4e4]">
          {ONBOARDING_DOC_LABELS[item.docType] ?? item.docType}
          {item.required && <span className="text-[#f87171] ml-1">*</span>}
        </div>
        {status === "REJECTED" && item.document?.reviewNote && (
          <div className="text-[11px] text-[#f87171] mt-0.5 flex items-start gap-1">
            <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
            {item.document.reviewNote}
          </div>
        )}
      </div>

      <span
        className="shrink-0 rounded px-2 py-1 text-[10px] font-medium"
        style={{ background: t.bg, color: t.fg }}
      >
        {status === "APPROVED" && <Check className="inline w-3 h-3 mr-0.5" />}
        {t.label}
      </span>

      {canUpload && (
        <label
          className="shrink-0 cursor-pointer rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-[#a1a1a1] transition hover:border-white/25 hover:text-white"
          style={busy ? { opacity: 0.4, pointerEvents: "none" } : undefined}
        >
          <Upload className="inline w-3 h-3 mr-1" />
          {busy ? "…" : status === "MISSING" ? "Upload" : "Replace"}
          <input
            type="file"
            className="hidden"
            accept="application/pdf,image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(personId, item.docType, f);
              e.target.value = "";
            }}
          />
        </label>
      )}
    </div>
  );
}

const DOC_LABEL: Record<string, string> = {
  OFFER_LETTER: "Offer letter",
  EXPERIENCE_LETTER: "Experience certificate",
  LOR: "Letter of recommendation",
  CERTIFICATE: "Completion certificate",
  ID_CARD: "ID card",
  RELIEVING: "Relieving letter",
};

/**
 * Documents the company issued to them, theirs to download whenever.
 *
 * These are the letters people are asked for months later — by a college, a
 * visa office, the next employer. Emailing them once and hoping the attachment
 * survives the recipient's inbox is not good enough, so they live here too.
 */
function IssuedDocuments({ docs }: { docs: any[] }) {
  return (
    <div className="rounded-2xl bg-[#111111] border border-white/[0.07] p-6">
      <h2 className="text-white text-[15px] font-semibold mb-1" style={{ fontFamily: "var(--font-syne)" }}>
        Your documents
      </h2>
      <p className="text-[11.5px] text-[#6b6b6b] mb-4">
        Issued to you. Download them any time — you will need these later.
      </p>

      <div className="space-y-2">
        {docs.map((d) => (
          <div key={d.id} className="flex items-center gap-3 rounded-xl border border-white/[0.06] p-3">
            <FileText className="w-4 h-4 shrink-0" style={{ color: "#c8f135" }} />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] text-[#e4e4e4]">
                {DOC_LABEL[d.docType] ?? d.docType.replace(/_/g, " ")}
                {d.designation ? <span className="text-[#6b6b6b]"> · {d.designation}</span> : null}
              </div>
              <div className="text-[10px] text-[#4d4d4d] tabular-nums mt-0.5">
                {d.documentNo} · {d.startup?.name} · {new Date(d.issuedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
              </div>
            </div>
            {d.pdfUrl ? (
              <a
                href={d.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11.5px] font-medium transition"
                style={{ background: "rgba(200,241,53,0.12)", color: "#c8f135" }}
              >
                <Download className="w-3 h-3" /> Download
              </a>
            ) : (
              /* Issued but the file was never produced — say so plainly rather
                 than showing a dead button. HR can rebuild it. */
              <span className="shrink-0 text-[10.5px] text-[#facc15]">
                File being prepared
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
