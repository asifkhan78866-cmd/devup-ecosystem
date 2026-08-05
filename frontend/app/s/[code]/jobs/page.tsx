"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Plus, Users, X } from "lucide-react";
import { workspaceApi } from "@/lib/api/workspace";

const STATUS_TONE: Record<string, { bg: string; fg: string }> = {
  OPEN: { bg: "rgba(200,241,53,0.1)", fg: "#c8f135" },
  DRAFT: { bg: "rgba(255,255,255,0.06)", fg: "#8b8b8b" },
  PAUSED: { bg: "rgba(250,204,21,0.1)", fg: "#facc15" },
  CLOSED: { bg: "rgba(248,113,113,0.1)", fg: "#f87171" },
  FILLED: { bg: "rgba(120,170,255,0.1)", fg: "#8fb6ff" },
};

export default function JobsPage() {
  const { code } = useParams<{ code: string }>();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!code) return;
    try {
      setJobs(await workspaceApi.jobs(code));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    load();
  }, [load]);

  const closeJob = async (id: string) => {
    setError(null);
    try {
      await workspaceApi.closeJob(code, id);
      await load();
    } catch (e: any) {
      // The API blocks closing a role with candidates still in flight.
      if (e.code === "CANDIDATES_IN_FLIGHT") {
        if (confirm(`${e.message}\n\nClose anyway and reject them?`)) {
          await workspaceApi.closeJob(code, id, true, "Role closed");
          await load();
        }
      } else setError(e.message);
    }
  };

  return (
    <div className="px-5 py-7 md:px-9 md:py-9 max-w-[1440px] mx-auto">
      <header className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-white text-[26px] md:text-[30px] font-extrabold tracking-[-0.02em]" style={{ fontFamily: "var(--font-syne), sans-serif" }}>Jobs</h1>
          <p className="text-[#8b8b8b] text-[13.5px] mt-1.5">Roles you are hiring for.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
          style={{ background: "rgba(200,241,53,0.12)", color: "#c8f135" }}
        >
          <Plus className="w-3.5 h-3.5" /> New role
        </button>
      </header>

      {error && <div className="mb-4 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-300 text-sm">{error}</div>}

      {loading ? (
        <p className="text-[#6b6b6b] text-sm">Loading…</p>
      ) : jobs.length === 0 ? (
        <div className="p-10 rounded-2xl border border-dashed border-white/[0.09] text-center">
          <p className="text-[#6b6b6b] text-sm">No roles yet. Create your first one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {jobs.map((j) => {
            const tone = STATUS_TONE[j.status] ?? STATUS_TONE.DRAFT;
            return (
              <div key={j.id} className="p-5 rounded-2xl bg-[#111111] border border-white/[0.06] flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-white text-sm font-semibold" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
                    {j.title}
                  </h3>
                  <span className="text-[9px] px-2 py-1 rounded shrink-0" style={{ background: tone.bg, color: tone.fg }}>
                    {j.status}
                  </span>
                </div>

                <p className="text-[11px] text-[#6b6b6b] mb-3">
                  {j.department ? `${j.department} · ` : ""}
                  {String(j.type).replace(/_/g, " ")} · {String(j.workMode ?? "OFFICE").toLowerCase()}
                </p>

                <div className="flex items-center gap-1.5 text-[11px] text-[#8b8b8b] mb-4">
                  <Users className="w-3.5 h-3.5" />
                  {j._count?.applications ?? 0} applicant{j._count?.applications === 1 ? "" : "s"}
                  <span className="text-[#3d3d3d]">·</span>
                  {j.openings} opening{j.openings === 1 ? "" : "s"}
                </div>

                <div className="flex gap-2 mt-auto">
                  {j.status !== "OPEN" && j.status !== "CLOSED" && (
                    <button
                      onClick={() => workspaceApi.publishJob(code, j.id).then(load)}
                      className="flex-1 py-1.5 rounded-lg text-[11px] border border-white/10 bg-white/5 text-[#e4e4e4] hover:bg-white/10 transition"
                    >
                      Publish
                    </button>
                  )}
                  {j.status === "OPEN" && (
                    <button
                      onClick={() => closeJob(j.id)}
                      className="flex-1 py-1.5 rounded-lg text-[11px] border border-white/10 text-[#8b8b8b] hover:text-[#f87171] transition"
                    >
                      Close role
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <JobForm
          busy={busy}
          onClose={() => setShowForm(false)}
          onSubmit={async (body: Record<string, unknown>) => {
            setBusy(true);
            setError(null);
            try {
              await workspaceApi.createJob(code, body);
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

const input = "w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[#e4e4e4] text-xs outline-none focus:border-[#c8f135]/40";
const label = "block text-[10px] text-[#6b6b6b] mb-1";

function JobForm({ onClose, onSubmit, busy }: any) {
  const [f, setF] = useState<any>({
    title: "", description: "", type: "FULL_TIME", domain: "SAAS", department: "",
    workMode: "OFFICE", location: "", openings: 1, stipend: "", salaryRange: "",
    durationMonths: "", deadline: "", status: "DRAFT",
    responsibilities: "", requiredSkills: "", preferredSkills: "",
  });
  const set = (k: string, v: any) => setF({ ...f, [k]: v });
  const csv = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 overflow-y-auto bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg my-8 rounded-xl bg-[#141414] border border-white/10 p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-sm font-semibold" style={{ fontFamily: "var(--font-syne), sans-serif" }}>New role</h3>
          <button onClick={onClose} className="text-[#6b6b6b] hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-3">
          <div><label className={label}>Title *</label><input className={input} value={f.title} onChange={(e) => set("title", e.target.value)} /></div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={label}>Employment type</label>
              <select className={input} value={f.type} onChange={(e) => set("type", e.target.value)}>
                {["FULL_TIME", "INTERNSHIP", "PART_TIME", "CONTRACT"].map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Work mode</label>
              <select className={input} value={f.workMode} onChange={(e) => set("workMode", e.target.value)}>
                {["OFFICE", "REMOTE", "HYBRID"].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div><label className={label}>Department</label><input className={input} value={f.department} onChange={(e) => set("department", e.target.value)} /></div>
            <div><label className={label}>Domain</label><input className={input} value={f.domain} onChange={(e) => set("domain", e.target.value)} /></div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div><label className={label}>Location *</label><input className={input} value={f.location} onChange={(e) => set("location", e.target.value)} /></div>
            <div><label className={label}>Openings</label><input type="number" min={1} className={input} value={f.openings} onChange={(e) => set("openings", e.target.value)} /></div>
          </div>

          <div><label className={label}>Description *</label><textarea rows={3} className={input} value={f.description} onChange={(e) => set("description", e.target.value)} /></div>
          <div><label className={label}>Responsibilities (comma separated)</label><input className={input} value={f.responsibilities} onChange={(e) => set("responsibilities", e.target.value)} /></div>
          <div><label className={label}>Required skills (comma separated)</label><input className={input} value={f.requiredSkills} onChange={(e) => set("requiredSkills", e.target.value)} /></div>
          <div><label className={label}>Preferred skills (comma separated)</label><input className={input} value={f.preferredSkills} onChange={(e) => set("preferredSkills", e.target.value)} /></div>

          <div className="grid grid-cols-2 gap-2">
            {f.type === "INTERNSHIP" ? (
              <>
                <div><label className={label}>Stipend</label><input className={input} value={f.stipend} onChange={(e) => set("stipend", e.target.value)} /></div>
                <div><label className={label}>Duration (months)</label><input type="number" className={input} value={f.durationMonths} onChange={(e) => set("durationMonths", e.target.value)} /></div>
              </>
            ) : (
              <>
                <div><label className={label}>Salary range</label><input className={input} value={f.salaryRange} onChange={(e) => set("salaryRange", e.target.value)} /></div>
                <div><label className={label}>Deadline</label><input type="date" className={input} value={f.deadline} onChange={(e) => set("deadline", e.target.value)} /></div>
              </>
            )}
          </div>

          <div>
            <label className={label}>Publish immediately?</label>
            <select className={input} value={f.status} onChange={(e) => set("status", e.target.value)}>
              <option value="DRAFT">Save as draft</option>
              <option value="OPEN">Publish now</option>
            </select>
          </div>

          <button
            disabled={busy || !f.title || !f.location || f.description.length < 10}
            onClick={() =>
              onSubmit({
                ...f,
                openings: Number(f.openings) || 1,
                durationMonths: f.durationMonths ? Number(f.durationMonths) : undefined,
                deadline: f.deadline || undefined,
                responsibilities: csv(f.responsibilities),
                requiredSkills: csv(f.requiredSkills),
                preferredSkills: csv(f.preferredSkills),
                skills: csv(f.requiredSkills),
              })
            }
            className="w-full py-2 rounded-lg text-xs font-medium disabled:opacity-40"
            style={{ background: "rgba(200,241,53,0.15)", color: "#c8f135" }}
          >
            Create role
          </button>
        </div>
      </div>
    </div>
  );
}
