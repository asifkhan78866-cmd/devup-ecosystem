"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Video, MapPin, Star } from "lucide-react";
import { workspaceApi, STAGE_LABEL } from "@/lib/api/workspace";

export default function InterviewsPage() {
  const { code } = useParams<{ code: string }>();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackFor, setFeedbackFor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!code) return;
    try {
      setRows(await workspaceApi.interviews(code));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="px-5 py-7 md:px-9 md:py-9 max-w-[1100px] mx-auto">
      <header className="mb-6">
        <h1 className="text-white text-[26px] md:text-[30px] font-extrabold tracking-[-0.02em]" style={{ fontFamily: "var(--font-syne), sans-serif" }}>Interviews</h1>
        <p className="text-[#8b8b8b] text-[13.5px] mt-1.5">Upcoming rounds across all open roles.</p>
      </header>

      {error && <div className="mb-4 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-300 text-sm">{error}</div>}

      {loading ? (
        <p className="text-[#6b6b6b] text-sm">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="p-10 rounded-2xl border border-dashed border-white/[0.09] text-center">
          <p className="text-[#6b6b6b] text-sm">No interviews scheduled. Schedule one from a candidate&apos;s page.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((iv) => (
            <div key={iv.id} className="p-4 rounded-2xl bg-[#111111] border border-white/[0.06]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/s/${code}/applications/${iv.application?.id}`}
                    className="text-white text-sm font-medium hover:text-[#c8f135] transition"
                  >
                    {iv.application?.applicantName ?? "Candidate"}
                  </Link>
                  <div className="text-[11px] text-[#6b6b6b] mt-0.5">
                    {iv.application?.job?.title} · {STAGE_LABEL[iv.stage] ?? iv.stage}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-[#8b8b8b]">
                    <span>{new Date(iv.scheduledAt).toLocaleString("en-IN")}</span>
                    <span className="flex items-center gap-1">
                      {iv.mode === "ONLINE" ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                      {iv.mode}
                    </span>
                    <span className="text-[#4d4d4d]">{iv.durationMins} min</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {iv.meetingUrl && (
                    <a
                      href={iv.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg text-[11px] border border-white/10 bg-white/5 text-[#e4e4e4] hover:bg-white/10 transition"
                    >
                      Join
                    </a>
                  )}
                  <button
                    onClick={() => setFeedbackFor(feedbackFor === iv.id ? null : iv.id)}
                    className="px-3 py-1.5 rounded-lg text-[11px]"
                    style={{ background: "rgba(200,241,53,0.1)", color: "#c8f135" }}
                  >
                    {iv.feedback?.length ? "Update feedback" : "Add feedback"}
                  </button>
                </div>
              </div>

              {feedbackFor === iv.id && (
                <FeedbackForm
                  busy={busy}
                  onSubmit={async (body: unknown) => {
                    setBusy(true);
                    setError(null);
                    try {
                      await workspaceApi.submitFeedback(code, iv.id, body);
                      setFeedbackFor(null);
                      await load();
                    } catch (e: any) {
                      setError(e.message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const input = "w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[#e4e4e4] text-xs outline-none focus:border-[#c8f135]/40";

function FeedbackForm({ onSubmit, busy }: any) {
  const [f, setF] = useState({ rating: 3, recommend: "NEUTRAL", strengths: "", concerns: "", notes: "" });

  return (
    <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] text-[#6b6b6b] mb-1">Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setF({ ...f, rating: n })}
                className="p-1.5 rounded transition"
                style={{ background: n <= f.rating ? "rgba(200,241,53,0.15)" : "rgba(255,255,255,0.04)" }}
              >
                <Star className="w-3.5 h-3.5" style={{ color: n <= f.rating ? "#c8f135" : "#4d4d4d" }} />
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-[10px] text-[#6b6b6b] mb-1">Recommendation</label>
          <select className={input} value={f.recommend} onChange={(e) => setF({ ...f, recommend: e.target.value })}>
            {["STRONG_YES", "YES", "NEUTRAL", "NO", "STRONG_NO"].map((r) => (
              <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
      </div>

      <input className={input} placeholder="Strengths" value={f.strengths} onChange={(e) => setF({ ...f, strengths: e.target.value })} />
      <input className={input} placeholder="Concerns" value={f.concerns} onChange={(e) => setF({ ...f, concerns: e.target.value })} />
      <textarea rows={2} className={input} placeholder="Notes" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />

      <button
        disabled={busy}
        onClick={() => onSubmit(f)}
        className="px-4 py-1.5 rounded-lg text-[11px] font-medium disabled:opacity-40"
        style={{ background: "rgba(200,241,53,0.15)", color: "#c8f135" }}
      >
        Submit feedback
      </button>
    </div>
  );
}
