"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Building2, Home, Clock, CalendarDays } from "lucide-react";
import { candidateApi } from "@/lib/api/workspace";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S"];

/** Minutes as "2h 14m", the way a person reads a working day. */
function duration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function timeOf(iso: string | null) {
  return iso
    ? new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })
    : "—";
}

export default function MyAttendancePage() {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setCards(await candidateApi.myAttendance());
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

  if (loading) return <div className="p-8 text-[#6b6b6b] text-sm">Loading…</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 md:p-8">
      <div className="max-w-[820px] mx-auto">
        <header className="mb-7">
          <h1 className="text-white text-2xl md:text-3xl font-bold" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
            Attendance
          </h1>
          <p className="text-[#6b6b6b] text-sm mt-1">Check in when you start, check out when you finish.</p>
        </header>

        {error && (
          <div className="mb-4 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-300 text-sm">{error}</div>
        )}

        {cards.length === 0 ? (
          <div className="p-10 rounded-xl border border-dashed border-white/10 text-center">
            <CalendarDays className="w-8 h-8 text-[#3d3d3d] mx-auto mb-3" />
            <p className="text-[#6b6b6b] text-sm">
              Attendance appears here once your internship starts.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {cards.map((c) => (
              <InternshipCard key={c.internId} card={c} busy={busy === c.internId} onAct={act} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InternshipCard({ card, busy, onAct }: any) {
  const t = card.today;
  const isOffice = t.mode === "OFFICE";

  return (
    <div className="rounded-2xl bg-[#111111] border border-white/5 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-white/5 flex items-center gap-2.5">
        {card.startup?.logoUrl && (
          <img src={card.startup.logoUrl} alt="" className="w-6 h-6 rounded bg-white object-contain p-0.5" />
        )}
        <div className="min-w-0">
          <div className="text-white text-sm font-semibold truncate">{card.startup?.name}</div>
          <div className="text-[10px] text-[#6b6b6b] tabular-nums">
            {card.internCode} · {card.designation}
          </div>
        </div>
      </div>

      <div className="p-6">
        {!t.isWorkingDay ? (
          <div className="text-center py-8">
            <p className="text-[#8b8b8b] text-sm">
              Today is not a working day. Enjoy it.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center gap-2 mb-5">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium"
                style={
                  isOffice
                    ? { background: "rgba(200,241,53,0.12)", color: "#c8f135" }
                    : { background: "rgba(143,182,255,0.12)", color: "#8fb6ff" }
                }
              >
                {isOffice ? <Building2 className="w-3 h-3" /> : <Home className="w-3 h-3" />}
                {isOffice ? `Office · ${t.officeStart}–${t.officeEnd}` : `Remote · ${duration(t.requiredMinutes)} minimum`}
              </span>
            </div>

            <LiveTimer today={t} />

            <div className="flex items-center justify-center gap-6 text-[11px] text-[#6b6b6b] mb-6">
              <span>In {timeOf(t.checkIn)}</span>
              <span>Out {timeOf(t.checkOut)}</span>
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

        <WeekStrip internId={card.internId} officeDays={card.officeDays} />
      </div>
    </div>
  );
}

/**
 * Counts up from check-in while the day is open.
 *
 * Anchored to the server's check-in timestamp and re-derived every tick rather
 * than incremented, so a sleeping laptop or a clock the user has changed cannot
 * drift the displayed total away from what will actually be recorded.
 */
function LiveTimer({ today }: any) {
  const [, force] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (today.checkIn && !today.checkOut) {
      timer.current = setInterval(() => force((n) => n + 1), 1000);
      return () => { if (timer.current) clearInterval(timer.current); };
    }
  }, [today.checkIn, today.checkOut]);

  if (!today.checkIn) {
    return (
      <div className="text-center mb-5">
        <div className="text-[#3d3d3d] text-[42px] font-bold tabular-nums leading-none">00:00</div>
        <div className="text-[11px] text-[#6b6b6b] mt-2">Not started</div>
      </div>
    );
  }

  const end = today.checkOut ? new Date(today.checkOut) : new Date();
  const secs = Math.max(0, Math.floor((end.getTime() - new Date(today.checkIn).getTime()) / 1000));
  const hh = String(Math.floor(secs / 3600)).padStart(2, "0");
  const mm = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");

  const met = secs / 60 >= today.requiredMinutes;

  return (
    <div className="text-center mb-5">
      <div
        className="text-[42px] font-bold tabular-nums leading-none"
        style={{ color: met ? "#c8f135" : "#e4e4e4" }}
      >
        {hh}:{mm}
        <span className="text-[22px] text-[#6b6b6b]">:{ss}</span>
      </div>
      <div className="text-[11px] mt-2" style={{ color: met ? "#c8f135" : "#6b6b6b" }}>
        {met ? "Minimum hours met" : `${duration(Math.max(0, today.requiredMinutes - Math.floor(secs / 60)))} to go`}
      </div>
    </div>
  );
}

/** This month at a glance — statuses only, never amounts. */
function WeekStrip({ internId, officeDays }: { internId: string; officeDays: number[] }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const now = new Date();
    candidateApi
      .myAttendanceMonth(internId, now.getFullYear(), now.getMonth() + 1)
      .then(setData)
      .catch(() => {});
  }, [internId]);

  if (!data) return null;

  const colour: Record<string, string> = {
    PRESENT: "#c8f135",
    LATE: "#facc15",
    HALF_DAY: "#fb923c",
    LEAVE: "#8fb6ff",
    ABSENT: "#f87171",
    HOLIDAY: "#3d3d3d",
    PENDING: "#2a2a2a",
    OPEN: "#facc15",
  };

  return (
    <div className="mt-7 pt-5 border-t border-white/5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] text-[#8b8b8b] uppercase tracking-wider">
          {new Date(data.year, data.month - 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
        </span>
        <span className="text-[11px] tabular-nums" style={{ color: "#c8f135" }}>
          {data.attendancePercent}% attendance
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {data.entries.map((e: any) => (
          <div
            key={e.date}
            title={`${new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · ${e.mode} · ${e.status}`}
            className="w-6 h-6 rounded flex items-center justify-center text-[9px] font-medium"
            style={{
              background: `${colour[e.status] ?? "#2a2a2a"}22`,
              color: colour[e.status] ?? "#6b6b6b",
              border: `1px solid ${colour[e.status] ?? "#2a2a2a"}44`,
            }}
          >
            {new Date(e.date).getUTCDate()}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[#6b6b6b]">
        {Object.entries(data.totals).map(([k, v]) => (
          <span key={k}>
            <span style={{ color: colour[k] ?? "#6b6b6b" }}>●</span> {k.replace(/_/g, " ").toLowerCase()} {String(v)}
          </span>
        ))}
      </div>

      <p className="text-[10px] text-[#4d4d4d] mt-3">
        Office days: {officeDays.map((d) => DAY_LABELS[d - 1]).join(", ")} · the rest are remote.
      </p>
    </div>
  );
}
