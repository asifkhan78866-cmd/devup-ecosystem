"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { X, FileText, Check, Upload, AlertCircle } from "lucide-react";
import { profileApi, StudentProfile } from "@/lib/api/profile";
import { apiClient } from "@/lib/api/client";

const input =
  "w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[#e4e4e4] text-sm outline-none focus:border-[#c8f135]/40";
const labelCls = "block text-[11px] text-[#6b6b6b] mb-1.5";

/**
 * Everything already on the student's profile is prefilled and marked as such,
 * so applying to another startup is a confirm-and-send rather than a re-typing
 * exercise. Edits here apply to this application only; the profile is untouched.
 */
export default function ApplyModal({
  jobId,
  jobTitle,
  startupName,
  onClose,
  onApplied,
}: {
  jobId: string;
  jobTitle: string;
  startupName?: string;
  onClose: () => void;
  onApplied?: (applicationNo: string) => void;
}) {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [f, setF] = useState({
    coverLetter: "", applicantName: "", applicantEmail: "", applicantPhone: "",
    college: "", cgpa: "", experienceYears: "",
    githubUrl: "", linkedinUrl: "", portfolioUrl: "", skills: [] as string[],
  });

  useEffect(() => {
    profileApi
      .get()
      .then((p) => {
        setProfile(p);
        setF((prev) => ({
          ...prev,
          applicantName: p.name ?? "",
          applicantEmail: p.email ?? "",
          applicantPhone: p.phone ?? "",
          college: p.college ?? "",
          cgpa: p.cgpa != null ? String(p.cgpa) : "",
          experienceYears: p.experienceYears != null ? String(p.experienceYears) : "",
          githubUrl: p.githubUrl ?? "",
          linkedinUrl: p.linkedinUrl ?? "",
          portfolioUrl: p.portfolioUrl ?? "",
          skills: p.skills ?? [],
        }));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const set = (k: string, v: string) => setF({ ...f, [k]: v });

  const hasResume = Boolean(resumeFile || profile?.resumeUrl);
  const prefilled = (v: string) => v.trim().length > 0;

  const submit = async () => {
    if (!hasResume) {
      setError("Attach a resume, or upload one to your profile first.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      Object.entries(f).forEach(([k, v]) => {
        if (k === "skills") fd.append(k, JSON.stringify(v));
        else if (v) fd.append(k, String(v));
      });
      // Falls back to the profile resume server-side when no file is attached.
      if (resumeFile) fd.append("resume", resumeFile);

      const res = await apiClient<any>(`/api/jobs/${jobId}/apply`, { method: "POST", body: fd });
      setDone(res.applicationNo ?? "submitted");
      onApplied?.(res.applicationNo);
    } catch (e: any) {
      setError(
        e.code === "DUPLICATE_APPLICATION"
          ? "You have already applied to this role."
          : e.message
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 overflow-y-auto bg-black/75 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg my-8 rounded-2xl bg-[#141414] border border-white/10" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 border-b border-white/5">
          <div>
            <h3 className="text-white text-base font-semibold" style={{ fontFamily: "var(--font-syne)" }}>
              {done ? "Application sent" : `Apply — ${jobTitle}`}
            </h3>
            {startupName && !done && <p className="text-[11px] text-[#6b6b6b] mt-0.5">at {startupName}</p>}
          </div>
          <button onClick={onClose} className="text-[#6b6b6b] hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(200,241,53,0.12)" }}>
              <Check className="w-6 h-6 text-[#c8f135]" />
            </div>
            <p className="text-white text-sm mb-1">Your application is in.</p>
            <p className="text-[#6b6b6b] text-xs mb-5">Reference <span className="tabular-nums text-[#a1a1a1]">{done}</span></p>
            <Link href="/dashboard/applications" className="inline-block px-4 py-2 rounded-lg text-xs" style={{ background: "rgba(200,241,53,0.15)", color: "#c8f135" }}>
              Track your applications
            </Link>
          </div>
        ) : loading ? (
          <p className="p-6 text-[#6b6b6b] text-sm">Loading your profile…</p>
        ) : (
          <div className="p-5 space-y-3">
            {profile?.missing && profile.missing.length > 0 && (
              <div className="p-3 rounded-lg border flex gap-2.5" style={{ borderColor: "rgba(250,204,21,0.25)", background: "rgba(250,204,21,0.07)" }}>
                <AlertCircle className="w-4 h-4 text-[#facc15] shrink-0 mt-0.5" />
                <div className="text-[11px]">
                  <p className="text-[#facc15]">Missing from your profile: {profile.missing.join(", ")}</p>
                  <Link href="/profile" className="text-[#a1a1a1] underline hover:text-white">Complete your profile</Link>
                  <span className="text-[#6b6b6b]"> so future applications autofill.</span>
                </div>
              </div>
            )}

            {profile?.completeness ? (
              <p className="text-[11px] text-[#6b6b6b] flex items-center gap-1.5">
                <Check className="w-3 h-3 text-[#c8f135]" /> Prefilled from your profile — edit anything for this application only.
              </p>
            ) : null}

            {error && <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-300 text-xs">{error}</div>}

            {/* Resume */}
            <div>
              <label className={labelCls}>Resume *</label>
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)} />
              {resumeFile ? (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03] border border-white/10">
                  <span className="text-[11px] text-[#e4e4e4] truncate flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-[#c8f135]" /> {resumeFile.name}
                  </span>
                  <button onClick={() => setResumeFile(null)} className="text-[10px] text-[#8b8b8b] hover:text-white">Remove</button>
                </div>
              ) : profile?.resumeUrl ? (
                <div className="flex items-center justify-between p-2.5 rounded-lg border" style={{ background: "rgba(200,241,53,0.05)", borderColor: "rgba(200,241,53,0.2)" }}>
                  <span className="text-[11px] text-[#c8f135] truncate flex items-center gap-2">
                    <Check className="w-3.5 h-3.5" /> Using {profile.resumeFileName ?? "your saved resume"}
                  </span>
                  <button onClick={() => fileRef.current?.click()} className="text-[10px] text-[#8b8b8b] hover:text-white shrink-0">Use another</button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()} className="w-full p-4 rounded-lg border border-dashed border-white/15 hover:border-[#c8f135]/40 transition flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4 text-[#6b6b6b]" />
                  <span className="text-[11px] text-[#a1a1a1]">Attach resume (PDF or Word)</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Field label="Full name *" filled={prefilled(f.applicantName)}>
                <input className={input} value={f.applicantName} onChange={(e) => set("applicantName", e.target.value)} />
              </Field>
              <Field label="Phone" filled={prefilled(f.applicantPhone)}>
                <input className={input} value={f.applicantPhone} onChange={(e) => set("applicantPhone", e.target.value)} />
              </Field>
            </div>

            <Field label="Email *" filled={prefilled(f.applicantEmail)}>
              <input className={input} value={f.applicantEmail} onChange={(e) => set("applicantEmail", e.target.value)} />
            </Field>

            <div className="grid grid-cols-3 gap-2">
              <Field label="College" filled={prefilled(f.college)}>
                <input className={input} value={f.college} onChange={(e) => set("college", e.target.value)} />
              </Field>
              <Field label="CGPA" filled={prefilled(f.cgpa)}>
                <input type="number" step="0.01" max={10} className={input} value={f.cgpa} onChange={(e) => set("cgpa", e.target.value)} />
              </Field>
              <Field label="Exp (yrs)" filled={prefilled(f.experienceYears)}>
                <input type="number" step="0.5" className={input} value={f.experienceYears} onChange={(e) => set("experienceYears", e.target.value)} />
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Field label="GitHub" filled={prefilled(f.githubUrl)}>
                <input className={input} value={f.githubUrl} onChange={(e) => set("githubUrl", e.target.value)} />
              </Field>
              <Field label="LinkedIn" filled={prefilled(f.linkedinUrl)}>
                <input className={input} value={f.linkedinUrl} onChange={(e) => set("linkedinUrl", e.target.value)} />
              </Field>
              <Field label="Portfolio" filled={prefilled(f.portfolioUrl)}>
                <input className={input} value={f.portfolioUrl} onChange={(e) => set("portfolioUrl", e.target.value)} />
              </Field>
            </div>

            {f.skills.length > 0 && (
              <div>
                <label className={labelCls}>Skills <span className="text-[#c8f135]">· from profile</span></label>
                <div className="flex flex-wrap gap-1.5">
                  {f.skills.map((s) => (
                    <span key={s} className="text-[10px] px-2 py-1 rounded bg-white/5 border border-white/10 text-[#a1a1a1]">{s}</span>
                  ))}
                </div>
              </div>
            )}

            <Field label="Cover letter">
              <textarea rows={4} className={input} placeholder="Why this role?" value={f.coverLetter} onChange={(e) => set("coverLetter", e.target.value)} />
            </Field>

            <button
              onClick={submit}
              disabled={submitting || !f.applicantName || !f.applicantEmail || !hasResume}
              className="w-full py-2.5 rounded-lg text-sm font-medium disabled:opacity-40"
              style={{ background: "rgba(200,241,53,0.15)", color: "#c8f135" }}
            >
              {submitting ? "Submitting…" : "Submit application"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, filled, children }: { label: string; filled?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>
        {label}
        {filled && <span className="text-[#c8f135] ml-1">·</span>}
      </label>
      {children}
    </div>
  );
}
