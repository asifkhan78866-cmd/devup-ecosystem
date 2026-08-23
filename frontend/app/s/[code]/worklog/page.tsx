"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { AlertTriangle, ChevronLeft, Link2, ShieldCheck, Clock } from "lucide-react";
import { worklogApi } from "@/lib/api/workspace";

/**
 * Who accounted for their time, and who did not.
 *
 * Three depths, because that is how the question is actually asked: everyone
 * today, then one person's month, then one person's day. Blocked items are
 * pulled to the top of the first screen — it is the only state that needs
 * somebody else to act.
 */

const TONE: Record<string, string> = {
  ON_TIME: "#c8f135",
  LATE: "#facc15",
  EXCUSED: "#8fb6ff",
  MISSED: "#f87171",
  OPEN: "#facc15",
  PENDING: "#3d3d3d",
};

const hhmm = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
/**
 * The IST calendar date, not the UTC one.
 *
 * toISOString() would hand back yesterday for anyone loading this between
 * midnight and 05:30 IST — the date picker would silently open on the wrong
 * day, and every intern would look absent.
 */
const isoDate = (d: Date) =>
  new Date(d.getTime() + 330 * 60000).toISOString().slice(0, 10);

export default function WorkLogPage() {
  const { code } = useParams<{ code: string }>();
  const [drill, setDrill] = useState<{ internId: string; name: string } | null>(null);

  return (
    <div className="px-5 py-7 md:px-9 md:py-9 max-w-[1240px] mx-auto">
      <header className="mb-6">
        <h1
          className="text-white text-[26px] md:text-[30px] font-extrabold tracking-[-0.02em]"
          style={{ fontFamily: "var(--font-syne), sans-serif" }}
        >
          Work Updates
        </h1>
        <p className="text-[#8b8b8b] text-[13.5px] mt-1.5">
          What every intern reported, slot by slot. Unreported time is not paid.
        </p>
      </header>

      {drill ? (
        <InternMonth code={code} internId={drill.internId} name={drill.name} onBack={() => setDrill(null)} />
      ) : (
        <Today code={code} onOpen={(internId, name) => setDrill({ internId, name })} />
      )}
    </div>
  );
}

function Today({ code, onOpen }: { code: string; onOpen: (id: string, name: string) => void }) {
  const [date, setDate] = useState(isoDate(new Date()));
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!code) return;
    setLoading(true);
    try {
      setData(await worklogApi.today(code, date));
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [code, date]);

  useEffect(() => { load(); }, [load]);

  const rows = data?.rows ?? [];
  const blocked = rows.filter((r: any) => r.blocked?.length);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/90 outline-none"
        />
        {rows.length > 0 && (
          <span className="text-[11.5px] text-[#6b6b6b]">
            {rows.filter((r: any) => r.compliance.required > 0).length} working today
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>
      )}

      {/* Blocked first — the only thing here that needs someone else */}
      {blocked.length > 0 && (
        <div className="mb-5 rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-4">
          <div className="mb-2 flex items-center gap-2 text-[12.5px] font-medium text-amber-300">
            <AlertTriangle className="h-4 w-4" />
            {blocked.length} {blocked.length === 1 ? "person is" : "people are"} blocked
          </div>
          {blocked.map((r: any) => (
            <div key={r.internId} className="text-[12px] text-amber-200/80">
              <span className="font-medium">{r.fullName}</span> — {r.blocked.join("; ")}
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-[#6b6b6b]">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/[0.09] p-10 text-center">
          <p className="text-sm text-[#6b6b6b]">No active interns.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/[0.06]">
          {rows.map((r: any) => (
            <button
              key={r.internId}
              onClick={() => onOpen(r.internId, r.fullName)}
              className="flex w-full items-center gap-4 border-b border-white/5 px-4 py-3.5 text-left transition last:border-0 hover:bg-white/[0.03]"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] text-[#e4e4e4]">{r.fullName}</div>
                <div className="text-[10.5px] tabular-nums text-[#4d4d4d]">
                  {r.internCode} · {r.mode?.toLowerCase()}
                  {r.attendance?.checkIn ? ` · in ${hhmm(r.attendance.checkIn)}` : " · not checked in"}
                </div>
              </div>

              {/* One pip per slot: the shape of the day at a glance */}
              <div className="hidden shrink-0 gap-1 sm:flex">
                {r.slots.map((s: any) => (
                  <span
                    key={s.slotStart}
                    title={`${hhmm(s.slotStart)} · ${s.state}${s.log ? ` · ${s.log.summary}` : ""}`}
                    className="h-5 w-5 rounded"
                    style={{
                      background: `${TONE[s.state] ?? "#2a2a2a"}22`,
                      border: `1px solid ${TONE[s.state] ?? "#2a2a2a"}55`,
                    }}
                  />
                ))}
              </div>

              <div className="w-24 shrink-0 text-right">
                {r.compliance.required > 0 ? (
                  <>
                    <div
                      className="text-[13px] font-semibold tabular-nums"
                      style={{
                        color:
                          r.compliance.percent >= 100 ? "#c8f135" : r.compliance.percent >= 60 ? "#facc15" : "#f87171",
                      }}
                    >
                      {r.compliance.percent}%
                    </div>
                    <div className="text-[10px] text-[#4d4d4d]">
                      {r.compliance.filed}/{r.compliance.required}
                      {r.hasSummary ? " · summary" : " · no summary"}
                    </div>
                  </>
                ) : (
                  <span className="text-[10.5px] text-[#4d4d4d]">off</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function InternMonth({
  code, internId, name, onBack,
}: { code: string; internId: string; name: string; onBack: () => void }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<any>(null);
  const [openDay, setOpenDay] = useState<string | null>(null);

  useEffect(() => {
    worklogApi.month(code, internId, year, month).then(setData).catch(() => setData(null));
  }, [code, internId, year, month]);

  const prev = () => (month === 1 ? (setMonth(12), setYear(year - 1)) : setMonth(month - 1));
  const next = () => (month === 12 ? (setMonth(1), setYear(year + 1)) : setMonth(month + 1));

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-[12.5px] text-[#8b8b8b] transition hover:text-white"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> All interns
        </button>
        <span className="text-[15px] font-semibold text-white">{name}</span>
        <div className="ml-auto flex items-center gap-1 rounded-lg border border-white/[0.08]">
          <button onClick={prev} className="px-2.5 py-1.5 text-sm text-[#8b8b8b] hover:text-white">←</button>
          <span className="min-w-[120px] px-2 text-center text-[12.5px] text-white">
            {new Date(year, month - 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
          </span>
          <button onClick={next} className="px-2.5 py-1.5 text-sm text-[#8b8b8b] hover:text-white">→</button>
        </div>
      </div>

      {!data ? (
        <p className="text-sm text-[#6b6b6b]">Loading…</p>
      ) : (
        <>
          {data.totals && (
            <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="Days worked" value={String(data.totals.days)} />
              <Stat label="Complete" value={String(data.totals.complete)} accent="#c8f135" />
              <Stat label="Incomplete" value={String(data.totals.incomplete)} accent={data.totals.incomplete ? "#f87171" : undefined} />
              <Stat
                label="Slots reported"
                value={`${data.totals.slotsFiled}/${data.totals.slotsRequired}`}
                accent={data.totals.compliancePercent >= 80 ? "#c8f135" : "#facc15"}
              />
            </div>
          )}

          <div className="mb-5 flex flex-wrap gap-1.5">
            {data.days.map((d: any) => {
              const key = isoDate(new Date(d.date));
              const colour =
                d.status === "PENDING" ? "#2a2a2a"
                  : d.required === 0 ? "#3d3d3d"
                  : d.incomplete ? "#f87171"
                  : d.percent >= 100 ? "#c8f135"
                  : "#facc15";
              return (
                <button
                  key={key}
                  onClick={() => setOpenDay(openDay === key ? null : key)}
                  title={`${key} · ${d.filed}/${d.required} slots${d.hasSummary ? " · summary" : " · no summary"}`}
                  className="h-9 w-9 rounded-lg text-[11px] font-medium tabular-nums transition"
                  style={{
                    background: openDay === key ? `${colour}33` : `${colour}18`,
                    border: `1px solid ${openDay === key ? colour : colour + "44"}`,
                    color: colour,
                  }}
                >
                  {new Date(d.date).getUTCDate()}
                </button>
              );
            })}
          </div>

          {openDay && <DayTimeline code={code} internId={internId} date={openDay} />}
        </>
      )}
    </>
  );
}

function DayTimeline({ code, internId, date }: { code: string; internId: string; date: string }) {
  const [day, setDay] = useState<any>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    worklogApi.day(code, internId, date).then(setDay).catch(() => setDay(null));
  }, [code, internId, date]);

  useEffect(() => { load(); }, [load]);

  const excuse = async (slotStart: string) => {
    const reason = prompt("Why is this slot excused? (power cut, illness, …)");
    if (!reason) return;
    setBusy(slotStart);
    try {
      await worklogApi.excuse(code, internId, { slotStart, reason });
      load();
    } finally {
      setBusy(null);
    }
  };

  if (!day) return null;

  return (
    <div className="rounded-2xl border border-white/[0.06] p-5">
      <div className="mb-4 flex flex-wrap items-center gap-3 text-[12px] text-[#8b8b8b]">
        <span className="text-[13.5px] font-medium text-white">
          {new Date(date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
        </span>
        <span>{day.mode?.toLowerCase()}</span>
        {day.attendance?.checkIn && (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> in {hhmm(day.attendance.checkIn)}
            {day.attendance.checkOut ? ` · out ${hhmm(day.attendance.checkOut)}` : ""}
          </span>
        )}
        <span
          className="ml-auto tabular-nums"
          style={{ color: day.compliance.incomplete ? "#f87171" : "#c8f135" }}
        >
          {day.compliance.filed}/{day.compliance.required} · {day.compliance.percent}%
          {day.compliance.incomplete ? " · INCOMPLETE" : ""}
        </span>
      </div>

      {day.slots.length === 0 ? (
        <p className="text-[12.5px] text-[#4d4d4d]">Nothing was owed on this day.</p>
      ) : (
        <div className="space-y-1.5">
          {day.slots.map((s: any) => (
            <div key={s.slotStart} className="flex items-start gap-3 rounded-lg border border-white/[0.05] px-3 py-2.5">
              <span className="shrink-0 pt-0.5 text-[10.5px] tabular-nums text-[#6b6b6b]">
                {hhmm(s.slotStart)}–{hhmm(s.slotEnd)}
              </span>
              <div className="min-w-0 flex-1">
                {s.log ? (
                  <>
                    <div className="text-[12.5px] text-[#d4d4d4]">{s.log.summary}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-[#4d4d4d]">
                      <span>{s.log.kind.toLowerCase()}</span>
                      <span>filed {hhmm(s.log.submittedAt)}</span>
                      {s.log.evidenceUrl && (
                        <a
                          href={s.log.evidenceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 hover:text-white"
                        >
                          <Link2 className="h-2.5 w-2.5" /> evidence
                        </a>
                      )}
                      {s.log.excuseReason && (
                        <span className="inline-flex items-center gap-0.5" style={{ color: "#8fb6ff" }}>
                          <ShieldCheck className="h-2.5 w-2.5" /> {s.log.excuseReason}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-[12px] text-[#4d4d4d]">Nothing reported</div>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span className="text-[10px]" style={{ color: TONE[s.state] ?? "#6b6b6b" }}>
                  {s.state.toLowerCase().replace("_", " ")}
                </span>
                {s.state === "MISSED" && (
                  <button
                    disabled={busy === s.slotStart}
                    onClick={() => excuse(s.slotStart)}
                    className="rounded border border-white/10 px-2 py-1 text-[10px] text-[#8b8b8b] transition hover:text-white disabled:opacity-40"
                  >
                    {busy === s.slotStart ? "…" : "Excuse"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 border-t border-white/5 pt-3">
        {day.summary ? (
          <>
            <div className="text-[11px] uppercase tracking-wider text-[#6b6b6b]">End of day</div>
            <p className="mt-1 text-[12.5px] text-[#d4d4d4]">{day.summary.done}</p>
            {day.summary.blocked && (
              <p className="mt-1 text-[11.5px]" style={{ color: "#facc15" }}>Blocked: {day.summary.blocked}</p>
            )}
            {day.summary.tomorrow && (
              <p className="mt-1 text-[11.5px] text-[#8b8b8b]">Next: {day.summary.tomorrow}</p>
            )}
          </>
        ) : (
          <p className="text-[11.5px]" style={{ color: "#f87171" }}>
            No end-of-day summary — the day is capped at 75% for this reason alone.
          </p>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#111111] p-4">
      <div className="mb-1.5 text-[10px] uppercase tracking-wider text-[#6b6b6b]">{label}</div>
      <div className="text-xl font-bold tabular-nums" style={{ color: accent ?? "#ffffff" }}>{value}</div>
    </div>
  );
}
