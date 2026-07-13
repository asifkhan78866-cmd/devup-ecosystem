"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  ImageIcon,
  Save,
  X,
  Pencil,
  Trash2,
  ExternalLink,
  Share2,
  Check,
  Loader2,
  Eye,
  EyeOff,
  Briefcase,
  Copy,
} from "lucide-react";
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

function typeLabel(type: string): string {
  switch (type) {
    case "FULL_TIME": return "Full-time";
    case "PART_TIME": return "Part-time";
    case "INTERNSHIP": return "Internship";
    case "CONTRACT": return "Contract";
    default: return type;
  }
}

function badgeColor(type: string): string {
  switch (type) {
    case "INTERNSHIP": return "#fb923c";
    case "PART_TIME": return "#a78bfa";
    case "CONTRACT": return "#38bdf8";
    default: return "#c8f135";
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

/* ─── Job form modal (shared between Create & Edit) ─── */
function JobFormModal({
  mode,
  initialData,
  startupName,
  token,
  startupId,
  onClose,
  onSuccess,
}: {
  mode: "create" | "edit";
  initialData: typeof emptyJob & { id?: string };
  startupName: string;
  token: string;
  startupId: string;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const [job, setJob] = useState(initialData);
  const [jobError, setJobError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setJobError("");

    try {
      const payload: Record<string, unknown> = {
        title: job.title,
        description: job.description,
        type: job.type,
        domain: job.domain,
        skills: typeof job.skills === "string"
          ? job.skills.split(",").map((s) => s.trim()).filter(Boolean)
          : job.skills,
        location: job.location,
        isRemote: job.isRemote,
        openings: parseInt(String(job.openings), 10) || 1,
      };
      if (job.stipend) payload.stipend = job.stipend;
      if (job.salaryRange) payload.salaryRange = job.salaryRange;
      if (job.deadline) payload.deadline = new Date(job.deadline).toISOString();

      if (mode === "create") {
        payload.startupId = startupId;
        const res = await fetch(`${API}/api/jobs`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          onSuccess("Job posted successfully.");
        } else {
          setJobError(data.error || "Failed to post job");
          return;
        }
      } else {
        const res = await fetch(`${API}/api/jobs/${job.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          onSuccess("Job updated successfully.");
        } else {
          setJobError(data.error || "Failed to update job");
          return;
        }
      }
    } catch (err: any) {
      setJobError(err?.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl text-white font-bold" style={{ fontFamily: "var(--font-syne)" }}>
            {mode === "create" ? "Post a Job" : "Edit Job"} at {startupName}
          </h2>
          <button onClick={onClose} className="text-[#6b6b6b] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            disabled={saving}
            className="w-full bg-[#c8f135] text-black font-semibold rounded-lg py-3 hover:bg-[#b0d829] transition-colors mt-2 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {mode === "create" ? (saving ? "Posting..." : "Post Job") : (saving ? "Saving..." : "Save Changes")}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── Job card in the listing ─── */
function JobCard({
  job,
  token,
  onEdit,
  onRefresh,
  onNotice,
}: {
  job: any;
  token: string;
  onEdit: (job: any) => void;
  onRefresh: () => void;
  onNotice: (msg: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const color = badgeColor(job.type);
  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/careers/${job.id}`
    : `/careers/${job.id}`;

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleToggleActive() {
    setToggling(true);
    try {
      const res = await fetch(`${API}/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: !job.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        onNotice(job.isActive ? "Job deactivated." : "Job reactivated.");
        onRefresh();
      }
    } catch {
      // silent
    } finally {
      setToggling(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`${API}/api/jobs/${job.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        onNotice("Job deleted.");
        onRefresh();
      }
    } catch {
      // silent
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div
      className="relative bg-[#111111] border rounded-xl p-5 transition-all duration-200"
      style={{
        borderColor: job.isActive ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
        opacity: job.isActive ? 1 : 0.6,
      }}
    >
      {/* Top row: title + badge */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5 mb-2">
            <h3
              className="text-white truncate"
              style={{ fontFamily: "var(--font-syne)", fontSize: "16px", fontWeight: 700 }}
            >
              {job.title}
            </h3>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium shrink-0"
              style={{
                background: `${color}12`,
                border: `1px solid ${color}30`,
                color,
                fontFamily: "var(--font-inter)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
              {typeLabel(job.type)}
            </span>
            {!job.isActive && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  color: "#ef4444",
                  fontFamily: "var(--font-inter)",
                }}
              >
                <EyeOff className="w-3 h-3" />
                Inactive
              </span>
            )}
          </div>
          <div
            className="flex flex-wrap items-center gap-x-3 gap-y-1"
            style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#6b6b6b" }}
          >
            <span>{job.location}</span>
            <span>·</span>
            {job.salaryRange && <><span style={{ color: "#a1a1a1" }}>{job.salaryRange}</span><span>·</span></>}
            {job.stipend && <><span style={{ color: "#a1a1a1" }}>{job.stipend}</span><span>·</span></>}
            <span>{job.openings || 1} opening{(job.openings || 1) > 1 ? "s" : ""}</span>
            <span>·</span>
            <span>{timeAgo(job.createdAt)}</span>
          </div>
        </div>

        {/* Applications count */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
            style={{
              background: "rgba(200,241,53,0.05)",
              border: "1px solid rgba(200,241,53,0.1)",
              fontFamily: "var(--font-inter)",
              fontSize: "12px",
              color: "#c8f135",
            }}
          >
            <Users className="w-3.5 h-3.5" />
            {job._count?.applications ?? job.applications?.length ?? 0} applications
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/[0.04]">
        {/* Edit */}
        <button
          onClick={() => onEdit(job)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] text-[#a1a1a1] hover:text-white hover:border-white/[0.15] hover:bg-white/[0.03] transition-all text-xs"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </button>

        {/* Toggle active */}
        <button
          onClick={handleToggleActive}
          disabled={toggling}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] text-[#a1a1a1] hover:text-white hover:border-white/[0.15] hover:bg-white/[0.03] transition-all text-xs disabled:opacity-50"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          {job.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {job.isActive ? "Deactivate" : "Reactivate"}
        </button>

        {/* Copy share link */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] text-[#a1a1a1] hover:text-[#c8f135] hover:border-[#c8f135]/20 hover:bg-[#c8f135]/5 transition-all text-xs"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[#c8f135]" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied!" : "Copy link"}
        </button>

        {/* View public page */}
        <Link
          href={`/careers/${job.id}`}
          target="_blank"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] text-[#a1a1a1] hover:text-white hover:border-white/[0.15] hover:bg-white/[0.03] transition-all text-xs no-underline"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View page
        </Link>

        {/* Delete */}
        <div className="ml-auto">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-400" style={{ fontFamily: "var(--font-inter)" }}>Delete this job?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all text-xs disabled:opacity-50"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Yes, delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 rounded-lg border border-white/[0.08] text-[#6b6b6b] hover:text-white transition-all text-xs"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] text-[#6b6b6b] hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/5 transition-all text-xs"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */
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

  /* ─── Jobs state ─── */
  const [jobs, setJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [jobModalMode, setJobModalMode] = useState<"create" | "edit">("create");
  const [editingJob, setEditingJob] = useState<(typeof emptyJob & { id?: string }) | null>(null);

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

  /* ─── Fetch startup jobs ─── */
  const fetchJobs = useCallback(async () => {
    if (!startupId || !token) return;
    setLoadingJobs(true);
    try {
      const res = await fetch(`${API}/api/jobs?startupId=${startupId}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setJobs(data.data);
      }
    } catch (err) {
      console.error("Error fetching jobs", err);
    } finally {
      setLoadingJobs(false);
    }
  }, [startupId, token]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

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

  function openCreateModal() {
    setEditingJob(null);
    setJobModalMode("create");
    setJobModalOpen(true);
  }

  function openEditModal(job: any) {
    setEditingJob({
      id: job.id,
      title: job.title || "",
      description: job.description || "",
      type: job.type || "FULL_TIME",
      domain: job.domain || "",
      skills: Array.isArray(job.skills) ? job.skills.join(", ") : (job.skills || ""),
      location: job.location || "",
      isRemote: job.isRemote || false,
      stipend: job.stipend || "",
      salaryRange: job.salaryRange || "",
      openings: String(job.openings || 1),
      deadline: job.deadline ? new Date(job.deadline).toISOString().slice(0, 16) : "",
    });
    setJobModalMode("edit");
    setJobModalOpen(true);
  }

  function handleJobSuccess(msg: string) {
    setJobModalOpen(false);
    setEditingJob(null);
    setNotice(msg);
    fetchJobs();
  }

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

  const activeJobs = jobs.filter((j) => j.isActive);
  const inactiveJobs = jobs.filter((j) => !j.isActive);

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
            onClick={openCreateModal}
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

      {/* ═══ Job Management Section ═══ */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-5">
          <h2
            className="flex items-center gap-3 text-white"
            style={{ fontFamily: "var(--font-syne)", fontSize: "22px", fontWeight: 700 }}
          >
            <Briefcase className="w-5 h-5 text-[#c8f135]" />
            Your Job Posts
            <span
              className="ml-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
              style={{
                background: "rgba(200,241,53,0.08)",
                border: "1px solid rgba(200,241,53,0.15)",
                color: "#c8f135",
                fontFamily: "var(--font-inter)",
              }}
            >
              {jobs.length}
            </span>
          </h2>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#c8f135]/20 bg-[#c8f135]/5 text-[#c8f135] hover:bg-[#c8f135]/10 transition-all text-sm font-medium"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            <Plus className="w-3.5 h-3.5" />
            New job
          </button>
        </div>

        {loadingJobs ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#c8f135]" />
          </div>
        ) : jobs.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed"
            style={{ borderColor: "rgba(200,241,53,0.15)", background: "rgba(200,241,53,0.02)" }}
          >
            <Briefcase className="w-10 h-10 mb-4 text-[#3d3d3d]" />
            <p style={{ fontFamily: "var(--font-syne)", fontSize: "18px", color: "#fff", marginBottom: "6px" }}>
              No jobs posted yet
            </p>
            <p style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#6b6b6b", marginBottom: "20px" }}>
              Post your first role to start receiving applications.
            </p>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 bg-[#c8f135] text-black px-5 py-2.5 rounded-lg font-semibold hover:bg-[#b0d829] transition-colors"
              style={{ fontFamily: "var(--font-inter)", fontSize: "14px" }}
            >
              <Plus className="w-4 h-4" />
              Post a Job
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Active jobs */}
            {activeJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                token={token!}
                onEdit={openEditModal}
                onRefresh={fetchJobs}
                onNotice={setNotice}
              />
            ))}

            {/* Inactive jobs */}
            {inactiveJobs.length > 0 && (
              <>
                <div className="flex items-center gap-3 mt-6 mb-2">
                  <div className="h-px flex-1 bg-white/[0.04]" />
                  <span
                    className="text-xs uppercase tracking-widest"
                    style={{ fontFamily: "var(--font-inter)", color: "#3d3d3d" }}
                  >
                    Inactive
                  </span>
                  <div className="h-px flex-1 bg-white/[0.04]" />
                </div>
                {inactiveJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    token={token!}
                    onEdit={openEditModal}
                    onRefresh={fetchJobs}
                    onNotice={setNotice}
                  />
                ))}
              </>
            )}
          </div>
        )}
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

      {/* Job create/edit modal */}
      {jobModalOpen && (
        <JobFormModal
          mode={jobModalMode}
          initialData={editingJob || emptyJob}
          startupName={startup?.name || "your startup"}
          token={token!}
          startupId={startupId!}
          onClose={() => { setJobModalOpen(false); setEditingJob(null); }}
          onSuccess={handleJobSuccess}
        />
      )}
    </div>
  );
}
