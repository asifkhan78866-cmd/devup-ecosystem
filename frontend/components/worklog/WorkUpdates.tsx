"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Briefcase, Users, Coffee, AlertTriangle, Car, Link2, Check, Clock, Lock,
} from "lucide-react";
import { candidateApi } from "@/lib/api/workspace";

/**
 * The intern's own work updates.
 *
 * Deliberately built to be answerable in about fifteen seconds on a phone: a
 * kind is one tap, the text box is pre-filled from the previous slot, and a
 * link is optional. Anything slower than that gets "worked on task" four times
 * a day, which is worse than no system at all.
 */

const KINDS = [
  { key: "WORK", label: "Work", icon: Briefcase },
  { key: "MEETING", label: "Meeting", icon: Users },
  { key: "BLOCKED", label: "Blocked", icon: AlertTriangle },
  { key: "BREAK", label: "Break", icon: Coffee },
  { key: "TRAVEL", label: "Travel", icon: Car },
] as const;

const STATE_TONE: Record<string, { fg: string; label: string }> = {
  ON_TIME: { fg: "#c8f135", label: "Filed" },
  LATE: { fg: "#facc15", label: "Late" },
  EXCUSED: { fg: "#8fb6ff", label: "Excused" },
  MISSED: { fg: "#f87171", label: "Missed" },
  OPEN: { fg: "#facc15", label: "Due now" },
  PENDING: { fg: "#6b6b6b", label: "Later" },
};

const hhmm = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });

export default function WorkUpdates({ internId }: { internId: string }) {
  const [day, setDay] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [kind, setKind] = useState<string>("WORK");
  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const [showLink, setShowLink] = useState(false);

  const [summary, setSummary] = useState({ done: "", blocked: "", tomorrow: "" });
  const [summaryOpen, setSummaryOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await candidateApi.myWorkDay(internId);
      setDay(d);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [internId]);

  useEffect(() => { load(); }, [load]);

  // A slot due now, or the earliest one still missing — whichever is nearer.
  const open = day?.slots?.find((s: any) => s.state === "OPEN");
  const missed = day?.slots?.filter((s: any) => s.state === "MISSED") ?? [];
  const target = open ?? missed[0] ?? null;

  const file = async () => {
    if (!target || text.trim().length < 3) return;
    setBusy(true);
    setError(null);
    try {
      await candidateApi.fileSlot(internId, {
        slotStart: target.slotStart,
        kind,
        summary: text.trim(),
        evidenceUrl: link.trim() || undefined,
      });
      setText("");
      setLink("");
      setShowLink(false);
      setKind("WORK");
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const saveSummary = async () => {
    if (summary.done.trim().length < 10) {
      setError("Say what you got done today — a line or two.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await candidateApi.fileDaySummary(internId, {
        done: summary.done.trim(),
        blocked: summary.blocked.trim() || undefined,
        tomorrow: summary.tomorrow.trim() || undefined,
      });
      setSummaryOpen(false);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return null;
  if (!day?.isWorkingDay || day.slots.length === 0) return null;

  const c = day.compliance;
  const box =
    "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[13px] text-white/90 outline-none transition focus:border-[#c8f135]/40";

  return (
    <div className="rounded-2xl bg-[#111111] border border-white/[0.07] p-6">
      <div className="flex items-start justify-between gap-3 mb-1">
        <h2 className="text-white text-[15px] font-semibold" style={{ fontFamily: "var(--font-syne)" }}>
          Work updates
        </h2>
        <span
          className="text-[11px] tabular-nums"
          style={{ color: c.percent >= 100 ? "#c8f135" : c.percent >= 60 ? "#facc15" : "#f87171" }}
        >
          {c.filed} of {c.required} filed
        </span>
      </div>
      <p className="text-[11.5px] text-[#6b6b6b] mb-4">
        Every {Math.round((new Date(day.slots[0].slotEnd).getTime() - new Date(day.slots[0].slotStart).getTime()) / 60000)} minutes,
        say what you worked on. Unreported time is not paid.
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-[12.5px] text-red-300">
          {error}
        </div>
      )}

      {/* The thing they came here to do */}
      {target ? (
        <div
          className="mb-5 rounded-xl border p-4"
          style={{
            borderColor: target.state === "MISSED" ? "rgba(248,113,113,0.28)" : "rgba(200,241,53,0.25)",
            background: target.state === "MISSED" ? "rgba(248,113,113,0.05)" : "rgba(200,241,53,0.04)",
          }}
        >
          <div className="mb-3 flex items-center gap-2 text-[12px]">
            <Clock className="h-3.5 w-3.5" style={{ color: target.state === "MISSED" ? "#f87171" : "#c8f135" }} />
            <span className="text-white/85">
              {hhmm(target.slotStart)}–{hhmm(target.slotEnd)}
            </span>
            <span style={{ color: target.state === "MISSED" ? "#f87171" : "#c8f135" }}>
              {target.state === "MISSED" ? "· missed, file it late" : "· due now"}
            </span>
          </div>

          <div className="mb-3 flex flex-wrap gap-1.5">
            {KINDS.map((k) => {
              const Icon = k.icon;
              const active = kind === k.key;
              return (
                <button
                  key={k.key}
                  onClick={() => setKind(k.key)}
                  className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11.5px] transition"
                  style={
                    active
                      ? { borderColor: "rgba(200,241,53,0.4)", background: "rgba(200,241,53,0.1)", color: "#c8f135" }
                      : { borderColor: "rgba(255,255,255,0.1)", color: "#8b8b8b" }
                  }
                >
                  <Icon className="h-3 w-3" />
                  {k.label}
                </button>
              );
            })}
          </div>

          <textarea
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              kind === "BLOCKED"
                ? "What are you stuck on? This reaches the founders straight away."
                : kind === "BREAK"
                  ? "Lunch, or whatever it was"
                  : "What did you actually do in this block?"
            }
            className={box + " resize-none"}
          />

          {showLink ? (
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://github.com/… or a doc link"
              className={box + " mt-2"}
            />
          ) : (
            <button
              onClick={() => setShowLink(true)}
              className="mt-2 inline-flex items-center gap-1 text-[11px] text-[#6b6b6b] transition hover:text-white"
            >
              <Link2 className="h-3 w-3" /> Add a link
            </button>
          )}

          <button
            disabled={busy || text.trim().length < 3}
            onClick={file}
            className="mt-3 w-full rounded-lg py-2.5 text-[13px] font-semibold transition disabled:opacity-40"
            style={{ background: "#c8f135", color: "#0a0a0a" }}
          >
            {busy ? "Saving…" : "File this update"}
          </button>
        </div>
      ) : (
        <div className="mb-5 rounded-xl border border-white/[0.08] p-4 text-center">
          <p className="text-[12.5px] text-[#8b8b8b]">
            {c.filed >= c.required ? "All updates filed. Nice." : "Nothing due right now."}
          </p>
        </div>
      )}

      {/* The day so far */}
      <div className="space-y-1.5">
        {day.slots.map((s: any) => {
          const tone = STATE_TONE[s.state] ?? STATE_TONE.PENDING;
          return (
            <div key={s.slotStart} className="flex items-start gap-3 rounded-lg border border-white/[0.05] px-3 py-2">
              <span className="shrink-0 text-[10.5px] tabular-nums text-[#6b6b6b] pt-0.5">
                {hhmm(s.slotStart)}
              </span>
              <div className="min-w-0 flex-1">
                {s.log ? (
                  <>
                    <div className="text-[12.5px] text-[#d4d4d4]">{s.log.summary}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] text-[#4d4d4d]">
                      <span>{s.log.kind.toLowerCase()}</span>
                      {s.log.evidenceUrl && (
                        <a
                          href={s.log.evidenceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 hover:text-white"
                        >
                          <Link2 className="h-2.5 w-2.5" /> link
                        </a>
                      )}
                      {s.log.excuseReason && <span style={{ color: "#8fb6ff" }}>· {s.log.excuseReason}</span>}
                    </div>
                  </>
                ) : (
                  <div className="text-[12px] text-[#4d4d4d]">—</div>
                )}
              </div>
              <span className="shrink-0 text-[10px] pt-0.5" style={{ color: tone.fg }}>
                {tone.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* End of day */}
      <div className="mt-5 border-t border-white/5 pt-4">
        {day.summary ? (
          <div className="rounded-xl border border-white/[0.06] p-3">
            <div className="mb-1 flex items-center gap-1.5 text-[11px]" style={{ color: "#c8f135" }}>
              <Check className="h-3 w-3" /> Day summary filed
            </div>
            <p className="text-[12.5px] text-[#d4d4d4]">{day.summary.done}</p>
            {day.summary.blocked && (
              <p className="mt-1 text-[11.5px]" style={{ color: "#facc15" }}>
                Blocked: {day.summary.blocked}
              </p>
            )}
          </div>
        ) : summaryOpen ? (
          <div className="space-y-2">
            <textarea
              rows={2}
              value={summary.done}
              onChange={(e) => setSummary({ ...summary, done: e.target.value })}
              placeholder="What did you get done today?"
              className={box + " resize-none"}
            />
            <input
              value={summary.blocked}
              onChange={(e) => setSummary({ ...summary, blocked: e.target.value })}
              placeholder="Anything blocking you? (optional)"
              className={box}
            />
            <input
              value={summary.tomorrow}
              onChange={(e) => setSummary({ ...summary, tomorrow: e.target.value })}
              placeholder="What's next tomorrow? (optional)"
              className={box}
            />
            <div className="flex gap-2">
              <button
                disabled={busy}
                onClick={saveSummary}
                className="flex-1 rounded-lg py-2 text-[12.5px] font-semibold disabled:opacity-40"
                style={{ background: "#c8f135", color: "#0a0a0a" }}
              >
                {busy ? "Saving…" : "Save summary"}
              </button>
              <button
                onClick={() => setSummaryOpen(false)}
                className="rounded-lg border border-white/10 px-3 py-2 text-[12.5px] text-[#8b8b8b]"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setSummaryOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 py-3 text-[12.5px] text-[#8b8b8b] transition hover:border-white/30 hover:text-white"
          >
            <Lock className="h-3.5 w-3.5" />
            Write your end-of-day summary — the day is incomplete without it
          </button>
        )}
      </div>
    </div>
  );
}
