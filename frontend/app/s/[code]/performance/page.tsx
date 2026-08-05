"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Plus, Star, X } from "lucide-react";
import { workspaceApi } from "@/lib/api/workspace";

const input = "w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[#e4e4e4] text-xs outline-none focus:border-[#c8f135]/40";
const labelCls = "block text-[10px] text-[#6b6b6b] mb-1";

const STATUS_TONE: Record<string, { bg: string; fg: string }> = {
  DRAFT: { bg: "rgba(255,255,255,0.06)", fg: "#8b8b8b" },
  SUBMITTED: { bg: "rgba(250,204,21,0.1)", fg: "#facc15" },
  ACKNOWLEDGED: { bg: "rgba(200,241,53,0.1)", fg: "#c8f135" },
};

export default function PerformancePage() {
  const { code } = useParams<{ code: string }>();
  const [reviews, setReviews] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!code) return;
    try {
      const [r, s, e] = await Promise.all([
        workspaceApi.reviews(code),
        workspaceApi.reviewSummary(code).catch(() => null),
        workspaceApi.employees(code).catch(() => []),
      ]);
      setReviews(r);
      setSummary(s);
      setEmployees(e);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    load();
  }, [load]);

  const maxDist = summary ? Math.max(1, ...Object.values(summary.distribution ?? {}).map(Number)) : 1;

  return (
    <div className="px-5 py-7 md:px-9 md:py-9 max-w-[1200px] mx-auto">
      <header className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-white text-[26px] md:text-[30px] font-extrabold tracking-[-0.02em]" style={{ fontFamily: "var(--font-syne), sans-serif" }}>Performance</h1>
          <p className="text-[#8b8b8b] text-[13.5px] mt-1.5">Reviews stay private as drafts until submitted.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          disabled={employees.length === 0}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium disabled:opacity-40"
          style={{ background: "rgba(200,241,53,0.12)", color: "#c8f135" }}
        >
          <Plus className="w-3.5 h-3.5" /> New review
        </button>
      </header>

      {error && <div className="mb-4 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-300 text-sm">{error}</div>}

      {summary && summary.total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 mb-5">
          <div className="p-5 rounded-2xl bg-[#111111] border border-white/[0.06]">
            <div className="text-[11px] text-[#6b6b6b] mb-1">Average rating</div>
            <div className="text-white text-3xl font-bold" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
              {summary.average}
            </div>
            <div className="text-[11px] text-[#6b6b6b] mt-1">
              {summary.total} review{summary.total === 1 ? "" : "s"} · {summary.reviewed} people
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#111111] border border-white/[0.06]">
            <div className="text-[11px] text-[#6b6b6b] mb-3">Rating distribution</div>
            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((n) => (
                <div key={n} className="flex items-center gap-2.5">
                  <span className="text-[11px] text-[#8b8b8b] w-3">{n}</span>
                  <Star className="w-3 h-3 text-[#c8f135]" />
                  <div className="flex-1 h-3 rounded bg-white/[0.03] overflow-hidden">
                    <div className="h-full rounded" style={{ width: `${((summary.distribution?.[n] ?? 0) / maxDist) * 100}%`, background: "rgba(200,241,53,0.5)" }} />
                  </div>
                  <span className="text-[11px] text-[#a1a1a1] w-6 text-right tabular-nums">{summary.distribution?.[n] ?? 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-[#6b6b6b] text-sm">Loading…</p>
      ) : reviews.length === 0 ? (
        <div className="p-10 rounded-2xl border border-dashed border-white/[0.09] text-center">
          <p className="text-[#6b6b6b] text-sm">
            {employees.length === 0
              ? "Onboard an employee before writing reviews."
              : "No reviews yet. Write the first one."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {reviews.map((r) => {
            const tone = STATUS_TONE[r.status] ?? STATUS_TONE.DRAFT;
            return (
              <div key={r.id} className="p-4 rounded-2xl bg-[#111111] border border-white/[0.06]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-white text-sm font-medium">{r.employee?.fullName}</div>
                    <div className="text-[10px] text-[#6b6b6b] tabular-nums mt-0.5">
                      {r.employee?.employeeCode} · {new Date(r.periodStart).toLocaleDateString("en-IN")} – {new Date(r.periodEnd).toLocaleDateString("en-IN")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} className="w-3 h-3" style={{ color: n <= r.rating ? "#c8f135" : "#3d3d3d" }} />
                      ))}
                    </span>
                    <span className="text-[10px] px-2 py-1 rounded" style={{ background: tone.bg, color: tone.fg }}>
                      {r.status}
                    </span>
                    {r.status === "DRAFT" && (
                      <button
                        onClick={async () => {
                          await workspaceApi.updateReview(code, r.id, { status: "SUBMITTED" });
                          await load();
                        }}
                        className="text-[10px] px-2 py-1 rounded border border-white/10 text-[#8b8b8b] hover:text-white transition"
                      >
                        Submit
                      </button>
                    )}
                  </div>
                </div>

                {(r.strengths || r.improvements || r.goals) && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-white/5 text-[11px]">
                    {r.strengths && <Block label="Strengths" value={r.strengths} />}
                    {r.improvements && <Block label="Improvements" value={r.improvements} />}
                    {r.goals && <Block label="Goals" value={r.goals} />}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <ReviewForm
          employees={employees}
          busy={busy}
          onClose={() => setShowForm(false)}
          onSubmit={async (body: Record<string, unknown>) => {
            setBusy(true);
            setError(null);
            try {
              await workspaceApi.createReview(code, body);
              setShowForm(false);
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
  );
}

const Block = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div className="text-[#6b6b6b] mb-0.5">{label}</div>
    <p className="text-[#a1a1a1] leading-relaxed">{value}</p>
  </div>
);

function ReviewForm({ employees, onClose, onSubmit, busy }: any) {
  const today = new Date();
  const quarterAgo = new Date(today);
  quarterAgo.setMonth(quarterAgo.getMonth() - 3);

  const [f, setF] = useState({
    employeeId: employees[0]?.id ?? "",
    periodStart: quarterAgo.toISOString().slice(0, 10),
    periodEnd: today.toISOString().slice(0, 10),
    rating: 3,
    strengths: "",
    improvements: "",
    goals: "",
    submit: false,
  });
  const set = (k: string, v: unknown) => setF({ ...f, [k]: v });

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 overflow-y-auto bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md my-8 rounded-xl bg-[#141414] border border-white/10 p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-sm font-semibold" style={{ fontFamily: "var(--font-syne), sans-serif" }}>New review</h3>
          <button onClick={onClose} className="text-[#6b6b6b] hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className={labelCls}>Employee</label>
            <select className={input} value={f.employeeId} onChange={(e) => set("employeeId", e.target.value)}>
              {employees.map((e: any) => (
                <option key={e.id} value={e.id}>{e.fullName} — {e.employeeCode}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div><label className={labelCls}>Period start</label><input type="date" className={input} value={f.periodStart} onChange={(e) => set("periodStart", e.target.value)} /></div>
            <div><label className={labelCls}>Period end</label><input type="date" className={input} value={f.periodEnd} onChange={(e) => set("periodEnd", e.target.value)} /></div>
          </div>

          <div>
            <label className={labelCls}>Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => set("rating", n)} className="p-1.5 rounded transition" style={{ background: n <= f.rating ? "rgba(200,241,53,0.15)" : "rgba(255,255,255,0.04)" }}>
                  <Star className="w-4 h-4" style={{ color: n <= f.rating ? "#c8f135" : "#4d4d4d" }} />
                </button>
              ))}
            </div>
          </div>

          <div><label className={labelCls}>Strengths</label><textarea rows={2} className={input} value={f.strengths} onChange={(e) => set("strengths", e.target.value)} /></div>
          <div><label className={labelCls}>Areas to improve</label><textarea rows={2} className={input} value={f.improvements} onChange={(e) => set("improvements", e.target.value)} /></div>
          <div><label className={labelCls}>Goals for next period</label><textarea rows={2} className={input} value={f.goals} onChange={(e) => set("goals", e.target.value)} /></div>

          <label className="flex items-center gap-2 text-[11px] text-[#a1a1a1] cursor-pointer">
            <input type="checkbox" checked={f.submit} onChange={(e) => set("submit", e.target.checked)} className="accent-[#c8f135]" />
            Share with the employee now (otherwise saved as a private draft)
          </label>

          <button
            disabled={busy || !f.employeeId}
            onClick={() => onSubmit(f)}
            className="w-full py-2 rounded-lg text-xs font-medium disabled:opacity-40"
            style={{ background: "rgba(200,241,53,0.15)", color: "#c8f135" }}
          >
            {f.submit ? "Save & share" : "Save draft"}
          </button>
        </div>
      </div>
    </div>
  );
}
