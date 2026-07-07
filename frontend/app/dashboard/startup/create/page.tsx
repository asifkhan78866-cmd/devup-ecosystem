"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Rocket, ImageIcon } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const DOMAINS = ["AI_ML", "FINTECH", "HEALTHTECH", "DEVTOOLS", "SAAS", "EDTECH", "WEB3", "E_COMMERCE", "CLEANTECH", "DEEPTECH", "OTHER"];
const STAGES = ["IDEA", "MVP", "PRE_SEED", "SEED", "SERIES_A", "SERIES_B", "GROWTH"];

const inputClass =
  "w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-[#c8f135]/50 transition-colors";
const labelClass = "block text-sm text-[#a1a1a1] mb-1.5";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

export default function CreateStartupPage() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const token = session?.access_token;

  const [form, setForm] = useState({ name: "", tagline: "", description: "", domain: "OTHER", stage: "IDEA", location: "" });
  const [logo, setLogo] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Please log in to create your startup.");
      return;
    }
    if (!logo) {
      setError("A startup logo is required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      // POST /api/startups is multipart and requires a logo; slug/foundedYear/
      // headcount are required by the backend schema so they're derived/defaulted.
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("slug", slugify(form.name));
      fd.append("tagline", form.tagline);
      fd.append("description", form.description);
      fd.append("domain", form.domain);
      fd.append("stage", form.stage);
      fd.append("location", form.location);
      fd.append("foundedYear", String(new Date().getFullYear()));
      fd.append("headcount", "1-5");
      fd.append("logo", logo);

      // No Content-Type header — the browser sets the multipart boundary.
      const res = await fetch(`${API}/api/startups`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (data.success) {
        router.push("/dashboard/startup");
      } else {
        setError(data.error || "Failed to create startup");
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return <div className="p-8 text-white">Loading...</div>;
  if (!token) return <div className="p-8 text-white">Please log in to create your startup.</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto min-h-screen">
      <div className="flex items-center gap-3 mb-2">
        <Rocket className="w-6 h-6 text-[#c8f135]" />
        <h1 style={{ fontFamily: "var(--font-syne)", fontWeight: 800 }} className="text-3xl text-white">Create your startup</h1>
      </div>
      <p style={{ fontFamily: "var(--font-inter)" }} className="text-[#a1a1a1] mb-8">
        Set up your startup profile. You&apos;ll be able to edit details, upload media, post jobs, and manage your team afterwards.
      </p>

      {error && <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-[#111111] border border-white/5 rounded-xl p-6 space-y-5">
        <div>
          <label className={labelClass}>Name</label>
          <input required className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. NexusAI" />
        </div>

        <div>
          <label className={labelClass}>Tagline</label>
          <input required className={inputClass} value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="One line on what you do" />
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea required className={`${inputClass} min-h-28 resize-y`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
          <input required className={inputClass} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Bengaluru" />
        </div>

        <div>
          <label className={labelClass}>Logo <span className="text-[#6b6b6b]">(required)</span></label>
          <label className="flex items-center gap-2 border border-white/10 text-white text-sm px-4 py-2.5 rounded-lg cursor-pointer hover:bg-white/5 transition-colors w-max">
            <ImageIcon className="w-4 h-4" /> {logo ? logo.name : "Choose an image"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setLogo(e.target.files?.[0] ?? null)} />
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 bg-[#c8f135] text-black font-semibold rounded-lg px-5 py-2.5 hover:bg-[#b0d829] transition-colors disabled:opacity-60"
        >
          <Rocket className="w-4 h-4" /> {submitting ? "Creating..." : "Create Startup"}
        </button>
      </form>
    </div>
  );
}
