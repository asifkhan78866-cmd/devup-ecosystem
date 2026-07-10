"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Plus, ImageIcon, Save, X } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useStartup } from "@/lib/hooks/useStartup";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const DOMAINS = ["AI_ML", "FINTECH", "HEALTHTECH", "DEVTOOLS", "SAAS", "EDTECH", "WEB3", "E_COMMERCE", "CLEANTECH", "DEEPTECH", "OTHER"];
const STAGES = ["IDEA", "MVP", "PRE_SEED", "SEED", "SERIES_A", "SERIES_B", "GROWTH"];
const JOB_TYPES = ["INTERNSHIP", "FULL_TIME", "PART_TIME", "CONTRACT"];

const emptyJob = {
  title: "",
  description: "",
  type: "FULL_TIME",
  domain: "",
  skills: "",
  location: "",
  isRemote: false,
  stipend: "",
  salaryRange: "",
  openings: "1",
  deadline: "",
};

const inputClass =
  "w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-[#c8f135]/50 transition-colors";
const labelClass = "block text-sm text-[#a1a1a1] mb-1.5";

export default function StartupDashboardPage() {
  const { user, session, loading: authLoading } = useAuth();
  const token = session?.access_token;

  const [startupId, setStartupId] = useState<string | null>(null);
  const [resolving, setResolving] = useState(true);

  // GET /api/startups/:id — public read, reused via the existing hook.
  const { data: startup, isLoading: loadingStartup, refetch } = useStartup(startupId ?? undefined);

  const [form, setForm] = useState({ name: "", description: "", domain: "OTHER", stage: "IDEA", location: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [job, setJob] = useState(emptyJob);
  const [jobError, setJobError] = useState("");
  const [postingJob, setPostingJob] = useState(false);

  // Resolve the founder's own startup from their AuthProvider profile.
  useEffect(() => {
    if (authLoading) return;
    
    // Fallback if not logged in
    if (!token || !user) {
      setResolving(false);
      return;
    }

    // Since we added `startups` to AuthProvider's user profile, we can just read it.
    if (user.startups && user.startups.length > 0) {
      setStartupId(user.startups[0].id);
    } else {
      setStartupId(null);
    }
    
    setResolving(false);
  }, [authLoading, token, user]);

  // Prefill the edit form once the startup detail loads.
  useEffect(() => {
    if (!startup) return;
    setForm({
      name: startup.name ?? "",
      description: startup.description ?? "",
      domain: startup.domain ?? "OTHER",
      stage: startup.stage ?? "IDEA",
      location: startup.location ?? "",
    });
  }, [startup]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startupId || !token) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch(`${API}/api/startups/${startupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setNotice("Changes saved.");
        refetch();
      } else {
        setError(data.error || "Failed to save changes");
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (type: "logo" | "banner", file?: File) => {
    if (!file || !startupId || !token) return;
    setError("");
    setNotice("");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(`${API}/api/startups/${startupId}/${type}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (data.success) {
        setNotice(`${type === "logo" ? "Logo" : "Banner"} updated.`);
        refetch();
      } else {
        setError(data.error || `Failed to upload ${type}`);
      }
    } catch (err: any) {
      setError(err?.message || "Upload failed");
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startupId || !token) return;
    setPostingJob(true);
    setJobError("");
    try {
      const payload: Record<string, unknown> = {
        startupId, // injected from context — never user-editable
        title: job.title,
        description: job.description,
        type: job.type,
        domain: job.domain,
        skills: job.skills.split(",").map((s) => s.trim()).filter(Boolean),
        location: job.location,
        isRemote: job.isRemote,
        openings: parseInt(job.openings, 10) || 1,
      };
      if (job.stipend) payload.stipend = job.stipend;
      if (job.salaryRange) payload.salaryRange = job.salaryRange;
      if (job.deadline) payload.deadline = new Date(job.deadline).toISOString();

      const res = await fetch(`${API}/api/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setJobModalOpen(false);
        setJob(emptyJob);
        setNotice("Job posted.");
      } else {
        setJobError(data.error || "Failed to post job");
      }
    } catch (err: any) {
      setJobError(err?.message || "Something went wrong");
    } finally {
      setPostingJob(false);
    }
  };

  if (authLoading || resolving) return <div className="p-8 text-white">Loading your startup...</div>;
  if (!token) return <div className="p-8 text-white">Please log in to manage your startup.</div>;
  if (!startupId) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-white">
        <p className="text-[#a1a1a1] mb-4">You don&apos;t own a startup yet.</p>
        <Link
          href="/dashboard/startup/create"
          className="inline-flex items-center gap-2 bg-[#c8f135] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#b0d829] transition-colors"
        >
          <Plus className="w-4 h-4" /> Create your startup
        </Link>
      </div>
    );
  }
  if (loadingStartup && !startup) return <div className="p-8 text-white">Loading your startup...</div>;

  return (
    <div className="p-6 md:p-8 pt-28 md:pt-32 max-w-6xl mx-auto min-h-screen pb-24">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 gap-4 flex-wrap">
        <div>
          <h1 style={{ fontFamily: "var(--font-syne)", fontWeight: 800 }} className="text-3xl text-white mb-2">
            {startup?.name || "Your Startup"}
          </h1>
          <p style={{ fontFamily: "var(--font-inter)" }} className="text-[#a1a1a1]">
            Manage your startup profile, media, jobs, and team.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setJobError(""); setJobModalOpen(true); }}
            className="flex items-center gap-2 bg-[#c8f135] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#b0d829] transition-colors"
          >
            <Plus className="w-4 h-4" /> Post a Job
          </button>
          <Link
            href="/dashboard/team"
            className="flex items-center gap-2 border border-white/10 text-white px-4 py-2 rounded-lg font-medium hover:bg-white/5 transition-colors"
          >
            <Users className="w-4 h-4" /> Manage Team
          </Link>
        </div>
      </div>

      {error && <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">{error}</div>}
      {notice && <div className="mb-6 p-3 bg-[#c8f135]/10 border border-[#c8f135]/20 text-[#c8f135] rounded-lg text-sm">{notice}</div>}

      {/* Media */}
      <div className="bg-[#111111] border border-white/5 rounded-xl overflow-hidden mb-8">
        <div className="relative h-40 bg-[#0a0a0a]">
          {startup?.bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={startup.bannerUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#6b6b6b] text-sm">No banner</div>
          )}
          <label className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur text-white text-xs px-3 py-1.5 rounded-lg cursor-pointer hover:bg-black/80 transition-colors">
            <ImageIcon className="w-3.5 h-3.5" /> Change banner
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload("banner", e.target.files?.[0])} />
          </label>
        </div>
        <div className="flex items-center gap-4 p-6">
          <div className="w-16 h-16 rounded-xl bg-[#1a1a1a] border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
            {startup?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={startup.logoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[#c8f135] font-bold text-2xl">{(startup?.name || "S")[0].toUpperCase()}</span>
            )}
          </div>
          <label className="flex items-center gap-1.5 border border-white/10 text-white text-sm px-4 py-2 rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
            <ImageIcon className="w-4 h-4" /> Change logo
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload("logo", e.target.files?.[0])} />
          </label>
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSave} className="bg-[#111111] border border-white/5 rounded-xl p-6 space-y-5">
        <h2 className="text-xl text-white font-bold" style={{ fontFamily: "var(--font-syne)" }}>Startup Details</h2>

        <div>
          <label className={labelClass}>Name</label>
          <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea className={`${inputClass} min-h-28 resize-y`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Domain</label>
            <select className={inputClass} value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })}>
              {DOMAINS.map((d) => <option key={d} value={d}>{d.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Stage</label>
            <select className={inputClass} value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}>
              {STAGES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Location</label>
          <input className={inputClass} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-[#c8f135] text-black font-semibold rounded-lg px-5 py-2.5 hover:bg-[#b0d829] transition-colors disabled:opacity-60"
        >
          <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>

      {/* Post a Job modal — startupId comes from context, not the form. */}
      {jobModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl text-white font-bold" style={{ fontFamily: "var(--font-syne)" }}>
                Post a Job at {startup?.name || "your startup"}
              </h2>
              <button onClick={() => setJobModalOpen(false)} className="text-[#6b6b6b] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-4">
              {jobError && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">{jobError}</div>}

              <div>
                <label className={labelClass}>Title</label>
                <input required className={inputClass} value={job.title} onChange={(e) => setJob({ ...job, title: e.target.value })} placeholder="e.g. Founding Engineer" />
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea required className={`${inputClass} min-h-24 resize-y`} value={job.description} onChange={(e) => setJob({ ...job, description: e.target.value })} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Type</label>
                  <select className={inputClass} value={job.type} onChange={(e) => setJob({ ...job, type: e.target.value })}>
                    {JOB_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Domain</label>
                  <input required className={inputClass} value={job.domain} onChange={(e) => setJob({ ...job, domain: e.target.value })} placeholder="e.g. Engineering" />
                </div>
              </div>

              <div>
                <label className={labelClass}>Skills <span className="text-[#6b6b6b]">(comma-separated)</span></label>
                <input className={inputClass} value={job.skills} onChange={(e) => setJob({ ...job, skills: e.target.value })} placeholder="React, Node.js, Postgres" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Location</label>
                  <input required className={inputClass} value={job.location} onChange={(e) => setJob({ ...job, location: e.target.value })} placeholder="e.g. Bengaluru" />
                </div>
                <div>
                  <label className={labelClass}>Openings</label>
                  <input type="number" min={1} className={inputClass} value={job.openings} onChange={(e) => setJob({ ...job, openings: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Stipend <span className="text-[#6b6b6b]">(optional)</span></label>
                  <input className={inputClass} value={job.stipend} onChange={(e) => setJob({ ...job, stipend: e.target.value })} placeholder="e.g. ₹25,000/mo" />
                </div>
                <div>
                  <label className={labelClass}>Salary range <span className="text-[#6b6b6b]">(optional)</span></label>
                  <input className={inputClass} value={job.salaryRange} onChange={(e) => setJob({ ...job, salaryRange: e.target.value })} placeholder="e.g. ₹12–18 LPA" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                  <label className={labelClass}>Deadline <span className="text-[#6b6b6b]">(optional)</span></label>
                  <input type="datetime-local" className={inputClass} value={job.deadline} onChange={(e) => setJob({ ...job, deadline: e.target.value })} />
                </div>
                <label className="flex items-center gap-2 text-sm text-[#a1a1a1] pb-2.5 cursor-pointer">
                  <input type="checkbox" checked={job.isRemote} onChange={(e) => setJob({ ...job, isRemote: e.target.checked })} className="accent-[#c8f135]" />
                  Remote friendly
                </label>
              </div>

              <button
                type="submit"
                disabled={postingJob}
                className="w-full bg-[#c8f135] text-black font-semibold rounded-lg py-3 hover:bg-[#b0d829] transition-colors mt-2 disabled:opacity-60"
              >
                {postingJob ? "Posting..." : "Post Job"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
