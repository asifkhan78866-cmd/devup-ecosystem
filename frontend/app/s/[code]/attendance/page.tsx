"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { workspaceApi } from "@/lib/api/workspace";

const STATUSES = ["PRESENT", "WFH", "HALF_DAY", "LEAVE", "ABSENT", "HOLIDAY"] as const;

const TONE: Record<string, { bg: string; fg: string }> = {
  PRESENT: { bg: "rgba(200,241,53,0.14)", fg: "#c8f135" },
  WFH: { bg: "rgba(120,170,255,0.14)", fg: "#8fb6ff" },
  HALF_DAY: { bg: "rgba(250,204,21,0.14)", fg: "#facc15" },
  LEAVE: { bg: "rgba(167,139,250,0.14)", fg: "#a78bfa" },
  ABSENT: { bg: "rgba(248,113,113,0.14)", fg: "#f87171" },
  HOLIDAY: { bg: "rgba(255,255,255,0.06)", fg: "#8b8b8b" },
};

const iso = (d: Date) => d.toISOString().slice(0, 10);

export default function AttendancePage() {
  const { code } = useParams<{ code: string }>();
  const [date, setDate] = useState(iso(new Date()));
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    if (!code) return;
    setLoading(true);
    setError(null);
    try {
      setData(await workspaceApi.attendance(code, date));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [code, date]);

  useEffect(() => {
    load();
  }, [load]);

  const mark = async (employeeId: string, status: string) => {
    setError(null);
    setSaved(false);
    try {
      await workspaceApi.markAttendance(code, { employeeId, date, status });
      setSaved(true);
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const markAllPresent = async () => {
    const unmarked = (data?.roster ?? []).filter((r: any) => !r.attendance);
    if (unmarked.length === 0) return;
    setError(null);
    try {
      await workspaceApi.bulkAttendance(code, {
        date,
        entries: unmarked.map((r: any) => ({ employeeId: r.id, status: "PRESENT" })),
      });
      setSaved(true);
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const shift = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    if (d > new Date()) return; // attendance cannot be marked ahead of time
    setDate(iso(d));
  };

  const isToday = date === iso(new Date());

  return (
    <div className="px-5 py-7 md:px-9 md:py-9 max-w-[1100px] mx-auto">
      <header className="mb-6">
        <h1 className="text-white text-[26px] md:text-[30px] font-extrabold tracking-[-0.02em]" style={{ fontFamily: "var(--font-syne), sans-serif" }}>Attendance</h1>
        <p className="text-[#8b8b8b] text-[13.5px] mt-1.5">One record per person per day. Re-marking corrects the entry.</p>
      </header>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <button onClick={() => shift(-1)} className="p-2 rounded-lg bg-white/5 border border-white/10 text-[#8b8b8b] hover:text-white transition">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <input
          type="date"
          value={date}
          max={iso(new Date())}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[#111111] border border-white/10 text-[#e4e4e4] text-sm outline-none focus:border-[#c8f135]/40"
        />
        <button
          onClick={() => shift(1)}
          disabled={isToday}
          className="p-2 rounded-lg bg-white/5 border border-white/10 text-[#8b8b8b] hover:text-white transition disabled:opacity-30"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {isToday && <span className="text-[11px] text-[#c8f135] px-2">Today</span>}

        <button
          onClick={markAllPresent}
          className="ml-auto px-3 py-2 rounded-lg text-xs"
          style={{ background: "rgba(200,241,53,0.12)", color: "#c8f135" }}
        >
          Mark remaining present
        </button>
      </div>

      {data?.summary && Object.keys(data.summary).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(data.summary).map(([status, count]) => (
            <span key={status} className="text-[11px] px-2.5 py-1 rounded" style={{ background: TONE[status]?.bg, color: TONE[status]?.fg }}>
              {status.replace(/_/g, " ")}: {count as number}
            </span>
          ))}
        </div>
      )}

      {error && <div className="mb-4 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-300 text-sm">{error}</div>}
      {saved && (
        <div className="mb-4 p-2.5 rounded-lg border text-xs flex items-center gap-2" style={{ borderColor: "rgba(200,241,53,0.2)", background: "rgba(200,241,53,0.06)", color: "#c8f135" }}>
          <Check className="w-3.5 h-3.5" /> Attendance saved.
        </div>
      )}

      {loading ? (
        <p className="text-[#6b6b6b] text-sm">Loading…</p>
      ) : !data?.roster?.length ? (
        <div className="p-10 rounded-2xl border border-dashed border-white/[0.09] text-center">
          <p className="text-[#6b6b6b] text-sm">No active employees yet. People appear here once onboarded.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
          {data.roster.map((r: any) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-3.5 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition">
              <div className="min-w-0">
                <div className="text-[#e4e4e4] text-xs font-medium">{r.fullName}</div>
                <div className="text-[10px] text-[#6b6b6b] tabular-nums">
                  {r.employeeCode}{r.department ? ` · ${r.department}` : ""}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {STATUSES.map((s) => {
                  const active = r.attendance?.status === s;
                  return (
                    <button
                      key={s}
                      onClick={() => mark(r.id, s)}
                      className="px-2.5 py-1 rounded text-[10px] border transition"
                      style={{
                        background: active ? TONE[s].bg : "transparent",
                        borderColor: active ? TONE[s].fg + "55" : "rgba(255,255,255,0.08)",
                        color: active ? TONE[s].fg : "#6b6b6b",
                      }}
                    >
                      {s.replace(/_/g, " ")}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
