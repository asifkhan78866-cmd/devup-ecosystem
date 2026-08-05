"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { profileApi, StudentProfile } from "@/lib/api/profile";
import { candidateApi } from "@/lib/api/workspace";
import ApplicationStatus from "@/components/apply/ApplicationStatus";
import { parseSkills, mergeSkills } from "@/lib/skills";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Building2,
  Clock,
  Briefcase,
  DollarSign,
  Users,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import StartupLogo from "@/components/StartupLogo";

/* ─── helpers ─── */
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

function badgeColor(type: string): string {
  switch (type) {
    case "INTERNSHIP":
      return "#fb923c";
    case "PART_TIME":
      return "#a78bfa";
    case "CONTRACT":
      return "#38bdf8";
    default:
      return "#c8f135";
  }
}

function typeLabel(type: string): string {
  switch (type) {
    case "FULL_TIME":
      return "Full-time";
    case "PART_TIME":
      return "Part-time";
    case "INTERNSHIP":
      return "Internship";
    case "CONTRACT":
      return "Contract";
    default:
      return type;
  }
}

/* ─── animation variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

/* ─── Share button component ─── */
function ShareButton({
  icon,
  label,
  onClick,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
}) {
  const baseClass =
    "group flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.06] hover:scale-[1.03] active:scale-[0.98]";

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={baseClass}
        style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#a1a1a1", textDecoration: "none" }}
      >
        {icon}
        <span className="group-hover:text-white transition-colors">{label}</span>
        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
      </a>
    );
  }

  return (
    <button
      onClick={onClick}
      className={baseClass}
      style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#a1a1a1" }}
    >
      {icon}
      <span className="group-hover:text-white transition-colors">{label}</span>
    </button>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */
export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { session, user } = useAuth();

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* share state */
  const [copied, setCopied] = useState(false);

  /* form state */
  const [applicantName, setApplicantName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  /* The profile is the source of truth for an application — the form only
     collects what might differ for this specific role. */
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  /* If they already applied, the form is replaced by their progress. */
  const [myApplication, setMyApplication] = useState<any>(null);
  const [appLoading, setAppLoading] = useState(true);

  const loadMyApplication = useCallback(async () => {
    if (!session?.access_token || !id) { setAppLoading(false); return; }
    try {
      setMyApplication(await candidateApi.myApplicationForJob(id));
    } catch {
      setMyApplication(null);
    } finally {
      setAppLoading(false);
    }
  }, [session?.access_token, id]);

  useEffect(() => { loadMyApplication(); }, [loadMyApplication]);

  useEffect(() => {
    if (!session?.access_token) { setProfileLoading(false); return; }
    profileApi
      .get()
      .then((p) => {
        setProfile(p);
        setApplicantName(p.name || user?.name || "");
        setApplicantEmail(p.email || user?.email || "");
        setApplicantPhone(p.phone || "");
      })
      .catch(() => {
        setApplicantName(user?.name || "");
        setApplicantEmail(user?.email || "");
      })
      .finally(() => setProfileLoading(false));
  }, [session?.access_token, user]);

  /* fetch job */
  useEffect(() => {
    if (!id) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/jobs/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setJob(data.data);
        } else {
          setError("Job not found");
        }
      })
      .catch(() => setError("Failed to load job"))
      .finally(() => setLoading(false));
  }, [id]);

  /* Apply eligibility — mirrors the server rule so the UI never offers a
     submission the API will reject. A file picked here counts as a resume. */
  const minToApply = profile?.minToApply ?? 50;
  const eligibility = profile?.canApply;
  const resumeSatisfied = Boolean(profile?.resumeUrl || resumeFile);
  const canSubmit = Boolean(
    eligibility?.eligible ||
      (resumeSatisfied &&
        (profile?.completeness ?? 0) >= minToApply &&
        (eligibility?.missing ?? []).filter((m) => m !== "Resume").length === 0)
  );
  // Hard requirements still outstanding. A resume attached to this form counts,
  // so it is dropped from the list once a file is picked.
  const missingRequired = (eligibility?.missing ?? []).filter(
    (m) => !(m === "Resume" && resumeSatisfied)
  );
  const blockingReason =
    eligibility?.reason ??
    (resumeSatisfied ? "" : "Upload a resume to your profile or attach one above.");

  /* Inline completion of the missing required fields, so a student who is one
     field short does not have to abandon this form to go and fix it. */
  const [quickSkill, setQuickSkill] = useState("");
  const [quickSkills, setQuickSkills] = useState<string[]>([]);
  const [quickCollege, setQuickCollege] = useState("");
  const [quickSaving, setQuickSaving] = useState(false);

  // Same parsing as the profile page: a pasted list is split intelligently so
  // multi-word skills such as "REST API" are not torn apart.
  const addQuickSkill = () => {
    const incoming = parseSkills(quickSkill);
    if (incoming.length === 0) return setQuickSkill("");
    setQuickSkills(mergeSkills(quickSkills, incoming));
    setQuickSkill("");
  };

  // Text still in the skills box counts as filled — otherwise the Save button
  // never appears for someone who typed their skills but did not press Add.
  const pendingQuickSkills = mergeSkills(quickSkills, parseSkills(quickSkill));
  const canQuickSave =
    (missingRequired.includes("Skills") && pendingQuickSkills.length > 0) ||
    (missingRequired.includes("College") && quickCollege.trim().length > 0) ||
    (missingRequired.includes("Phone number") && applicantPhone.trim().length > 0);

  const saveQuickFields = async () => {
    setQuickSaving(true);
    setSubmitError("");
    try {
      const patch: Record<string, unknown> = {
        name: profile?.name || applicantName,
        bio: profile?.bio, city: profile?.city, degree: profile?.degree,
        branch: profile?.branch, graduationYear: profile?.graduationYear,
        cgpa: profile?.cgpa, experienceYears: profile?.experienceYears,
        githubUrl: profile?.githubUrl, linkedinUrl: profile?.linkedinUrl,
        twitterUrl: profile?.twitterUrl, portfolioUrl: profile?.portfolioUrl,
        skills: pendingQuickSkills.length
          ? mergeSkills(profile?.skills ?? [], pendingQuickSkills)
          : profile?.skills,
        college: quickCollege.trim() || profile?.college,
        phone: applicantPhone.trim() || profile?.phone,
      };
      const updated = await profileApi.save(patch);
      setProfile(updated);
      setQuickSkills([]);
      setQuickSkill("");
      setQuickCollege("");
    } catch (e: any) {
      setSubmitError(e.message ?? "Could not save. Try again.");
    } finally {
      setQuickSaving(false);
    }
  };

  /* share helpers */
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = job ? `Check out this role: ${job.title} at ${job.startup?.name || "DevUp"} — ` : "";

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  /* apply */
  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.access_token || !job) return;

    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);

    try {
      const formData = new FormData();
      formData.append("coverLetter", coverLetter);
      formData.append("applicantName", applicantName);
      formData.append("applicantEmail", applicantEmail);
      formData.append("applicantPhone", applicantPhone);

      // Carry the rest of the profile through so the startup receives GitHub,
      // LinkedIn, portfolio, skills and academics — not just name and resume.
      if (profile) {
        if (profile.githubUrl) formData.append("githubUrl", profile.githubUrl);
        if (profile.linkedinUrl) formData.append("linkedinUrl", profile.linkedinUrl);
        if (profile.portfolioUrl) formData.append("portfolioUrl", profile.portfolioUrl);
        if (profile.college) formData.append("college", profile.college);
        if (profile.cgpa != null) formData.append("cgpa", String(profile.cgpa));
        if (profile.experienceYears != null)
          formData.append("experienceYears", String(profile.experienceYears));
        if (profile.skills?.length) formData.append("skills", JSON.stringify(profile.skills));
      }

      // Only send a file when one was picked; otherwise the server uses the
      // resume already saved on the profile.
      if (resumeFile) formData.append("resume", resumeFile);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/jobs/${job.id}/apply`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: formData,
        }
      );

      const data = await res.json();
      if (data.success) {
        setSubmitSuccess(true);
        loadMyApplication();
        setCoverLetter("");
        setApplicantPhone("");
        setResumeFile(null);
      } else {
        setSubmitError(data.error || "Failed to apply for job.");
      }
    } catch (err: any) {
      setSubmitError(err.message || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  /* ─── loading ─── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#c8f135]" />
      </div>
    );
  }

  /* ─── error / not found ─── */
  if (error || !job) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-6 px-4">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(200,241,53,0.06)", border: "1px solid rgba(200,241,53,0.15)" }}
        >
          <Briefcase className="w-8 h-8 text-[#c8f135]" />
        </div>
        <h1 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "28px", fontWeight: 700, color: "#fff" }}>
          Job not found
        </h1>
        <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "15px", color: "#6b6b6b", textAlign: "center", maxWidth: "400px" }}>
          This role may have been filled or removed. Browse other opportunities in the DevUp Ecosystem.
        </p>
        <Link
          href="/careers"
          className="flex items-center gap-2 px-6 py-3 bg-[#c8f135] text-black font-semibold rounded-xl transition-transform hover:scale-[1.02]"
          style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Browse all jobs
        </Link>
      </div>
    );
  }

  /* derived */
  const companyName = job.startup?.name || "DevUp";
  const companyInitial = companyName[0];
  const color = badgeColor(job.type);
  const label = typeLabel(job.type);
  const salary = job.salaryRange || job.stipend || null;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* ═══ Top gradient accent ═══ */}
      <div
        className="absolute top-0 left-0 right-0 h-[320px] pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 0%, rgba(200,241,53,0.06) 0%, transparent 100%)`,
        }}
      />

      <div className="relative max-w-4xl mx-auto px-4 md:px-8 pt-28 md:pt-32 pb-32">
        {/* ═══ Back nav ═══ */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
          <Link
            href="/careers"
            className="inline-flex items-center gap-2 text-[#6b6b6b] hover:text-[#c8f135] transition-colors mb-8 group"
            style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px" }}
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            All opportunities
          </Link>
        </motion.div>

        {/* ═══ Breadcrumb ═══ */}
        <motion.nav variants={fadeUp} initial="hidden" animate="show" custom={0.5} className="flex items-center gap-1.5 mb-6" style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "12px", color: "#3d3d3d" }}>
          <Link href="/" className="hover:text-[#6b6b6b] transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/careers" className="hover:text-[#6b6b6b] transition-colors">Careers</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#6b6b6b] truncate max-w-[200px]">{job.title}</span>
        </motion.nav>

        {/* ═══ Hero Card ═══ */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={1}
          className="relative overflow-hidden rounded-2xl border border-white/[0.06] p-6 md:p-10 mb-8"
          style={{
            background: "linear-gradient(145deg, rgba(17,17,17,0.95) 0%, rgba(10,10,10,0.98) 100%)",
            boxShadow: "0 0 80px rgba(200,241,53,0.03)",
          }}
        >
          {/* Accent glow behind logo */}
          <div className="absolute -top-20 -left-20 w-40 h-40 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, ${color}15 0%, transparent 70%)` }} />

          <div className="relative flex flex-col sm:flex-row items-start gap-5 mb-8">
            {/* Company Avatar */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border"
              style={{
                background: `${color}08`,
                borderColor: `${color}25`,
              }}
            >
              {job.startup?.logoUrl ? (
                <StartupLogo src={job.startup.logoUrl} name={companyName} className="w-10 h-10" />
              ) : (
                <span style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "26px", fontWeight: 700, color }}>
                  {companyInitial}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              {/* Type badge */}
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium"
                  style={{
                    background: `${color}12`,
                    border: `1px solid ${color}30`,
                    color,
                    fontFamily: "var(--font-inter), sans-serif",
                    letterSpacing: "0.03em",
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                  {label}
                </span>
                {job.isRemote && (
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium"
                    style={{
                      background: "rgba(56,189,248,0.08)",
                      border: "1px solid rgba(56,189,248,0.2)",
                      color: "#38bdf8",
                      fontFamily: "var(--font-inter), sans-serif",
                    }}
                  >
                    Remote friendly
                  </span>
                )}
              </div>

              {/* Title */}
              <h1
                style={{
                  fontFamily: "var(--font-syne), sans-serif",
                  fontSize: "clamp(24px, 4vw, 36px)",
                  fontWeight: 700,
                  color: "#fff",
                  lineHeight: 1.15,
                  letterSpacing: "-0.02em",
                  marginBottom: "8px",
                }}
              >
                {job.title}
              </h1>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3">
                <span className="inline-flex items-center gap-1.5" style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px", color: "#a1a1a1" }}>
                  <Building2 className="w-3.5 h-3.5 text-[#6b6b6b]" />
                  {companyName}
                </span>
                <span className="inline-flex items-center gap-1.5" style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px", color: "#a1a1a1" }}>
                  <MapPin className="w-3.5 h-3.5 text-[#6b6b6b]" />
                  {job.location}
                </span>
                {salary && (
                  <span className="inline-flex items-center gap-1.5" style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px", color: "#a1a1a1" }}>
                    <DollarSign className="w-3.5 h-3.5 text-[#6b6b6b]" />
                    {salary}
                  </span>
                )}
                {job.openings > 1 && (
                  <span className="inline-flex items-center gap-1.5" style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px", color: "#a1a1a1" }}>
                    <Users className="w-3.5 h-3.5 text-[#6b6b6b]" />
                    {job.openings} openings
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5" style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#3d3d3d" }}>
                  <Clock className="w-3.5 h-3.5" />
                  {timeAgo(job.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* ═══ Share bar ═══ */}
          <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-white/[0.06]">
            <span style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "12px", color: "#3d3d3d", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Share
            </span>

            <ShareButton
              icon={copied ? <Check className="w-4 h-4 text-[#c8f135]" /> : <Copy className="w-4 h-4" />}
              label={copied ? "Copied!" : "Copy link"}
              onClick={handleCopy}
            />
            <ShareButton
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                </svg>
              }
              label="LinkedIn"
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
            />
            <ShareButton
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              }
              label="X (Twitter)"
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
            />
            <ShareButton
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              }
              label="WhatsApp"
              href={`https://wa.me/?text=${encodeURIComponent(shareText + shareUrl)}`}
            />
          </div>
        </motion.div>

        {/* ═══ Content grid ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          {/* ─── Left column: Description ─── */}
          <div className="space-y-8">
            {/* About the Role */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={2}
              className="rounded-2xl border border-white/[0.06] p-6 md:p-8"
              style={{ background: "#111111" }}
            >
              <h2
                className="flex items-center gap-3 mb-6"
                style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "20px", fontWeight: 700, color: "#fff" }}
              >
                <span className="w-1 h-6 rounded-full bg-[#c8f135]" />
                About the Role
              </h2>
              <div
                className="prose prose-invert max-w-none"
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: "15px",
                  lineHeight: "1.75",
                  color: "#a1a1a1",
                  whiteSpace: "pre-wrap",
                }}
              >
                {job.description || "No description provided."}
              </div>
            </motion.div>

            {/* Skills / Requirements */}
            {job.skills?.length > 0 && (
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={3}
                className="rounded-2xl border border-white/[0.06] p-6 md:p-8"
                style={{ background: "#111111" }}
              >
                <h2
                  className="flex items-center gap-3 mb-6"
                  style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "20px", fontWeight: 700, color: "#fff" }}
                >
                  <span className="w-1 h-6 rounded-full bg-[#c8f135]" />
                  Skills & Requirements
                </h2>
                <div className="flex flex-wrap gap-2.5">
                  {job.skills.map((skill: string, i: number) => (
                    <motion.span
                      key={i}
                      variants={fadeUp}
                      initial="hidden"
                      animate="show"
                      custom={3 + i * 0.1}
                      className="px-4 py-2 rounded-xl"
                      style={{
                        background: "rgba(200,241,53,0.05)",
                        border: "1px solid rgba(200,241,53,0.12)",
                        fontFamily: "var(--font-inter), sans-serif",
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#c8f135",
                      }}
                    >
                      {skill}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Job details info grid */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={4}
              className="rounded-2xl border border-white/[0.06] p-6 md:p-8"
              style={{ background: "#111111" }}
            >
              <h2
                className="flex items-center gap-3 mb-6"
                style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "20px", fontWeight: 700, color: "#fff" }}
              >
                <span className="w-1 h-6 rounded-full bg-[#c8f135]" />
                Job Details
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { icon: <Briefcase className="w-4 h-4" />, label: "Type", value: label },
                  { icon: <MapPin className="w-4 h-4" />, label: "Location", value: job.location },
                  ...(salary ? [{ icon: <DollarSign className="w-4 h-4" />, label: "Compensation", value: salary }] : []),
                  { icon: <Users className="w-4 h-4" />, label: "Openings", value: String(job.openings || 1) },
                  ...(job.domain ? [{ icon: <Building2 className="w-4 h-4" />, label: "Domain", value: job.domain }] : []),
                  ...(job.deadline ? [{ icon: <Clock className="w-4 h-4" />, label: "Deadline", value: new Date(job.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) }] : []),
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-2 p-4 rounded-xl border border-white/[0.04]"
                    style={{ background: "rgba(255,255,255,0.02)" }}
                  >
                    <div className="flex items-center gap-2 text-[#3d3d3d]">
                      {item.icon}
                      <span style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{item.label}</span>
                    </div>
                    <span style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px", fontWeight: 500, color: "#e4e4e4" }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* About the company */}
            {job.startup && (
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={5}
                className="rounded-2xl border border-white/[0.06] p-6 md:p-8"
                style={{ background: "#111111" }}
              >
                <h2
                  className="flex items-center gap-3 mb-6"
                  style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "20px", fontWeight: 700, color: "#fff" }}
                >
                  <span className="w-1 h-6 rounded-full bg-[#c8f135]" />
                  About {companyName}
                </h2>
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${color}08`, border: `1px solid ${color}20` }}
                  >
                    {job.startup.logoUrl ? (
                      <StartupLogo src={job.startup.logoUrl} name={companyName} className="w-8 h-8" />
                    ) : (
                      <span style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "20px", fontWeight: 700, color }}>{companyInitial}</span>
                    )}
                  </div>
                  <div>
                    <h3 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "16px", fontWeight: 600, color: "#fff" }}>{companyName}</h3>
                    {job.startup.tagline && (
                      <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#6b6b6b", marginTop: "2px" }}>{job.startup.tagline}</p>
                    )}
                  </div>
                </div>
                {job.startup.description && (
                  <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px", lineHeight: "1.7", color: "#a1a1a1" }}>
                    {job.startup.description.slice(0, 300)}{job.startup.description.length > 300 ? "…" : ""}
                  </p>
                )}
                <Link
                  href={`/ecosystem/${job.startupId}`}
                  className="inline-flex items-center gap-2 mt-4 text-[#c8f135] hover:underline transition-colors"
                  style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px" }}
                >
                  View company profile
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </motion.div>
            )}
          </div>

          {/* ─── Right column: Apply form (sticky on desktop) ─── */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={2}
            className="lg:sticky lg:top-8 self-start"
          >
            <div
              className="rounded-2xl border border-white/[0.06] p-6 md:p-8"
              style={{
                background: "linear-gradient(180deg, #131313 0%, #111111 100%)",
                boxShadow: "0 0 60px rgba(200,241,53,0.02)",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-syne), sans-serif",
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#fff",
                  marginBottom: "6px",
                }}
              >
                {myApplication ? "Your application" : "Apply for this role"}
              </h2>
              <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#6b6b6b", marginBottom: "24px" }}>
                at {companyName}
              </p>

              {appLoading ? (
                <p className="py-6 text-[13px] text-[#6b6b6b]">Checking your application…</p>
              ) : myApplication ? (
                /* Already applied — show progress instead of inviting a duplicate. */
                <ApplicationStatus application={myApplication} onChanged={loadMyApplication} />
              ) : submitSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center py-8 text-center"
                >
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)" }}>
                    <Check className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "18px", fontWeight: 700, color: "#fff", marginBottom: "8px" }}>Application sent!</h3>
                  <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px", color: "#6b6b6b" }}>
                    The team at {companyName} will review your application.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleApply} className="space-y-4">
                  {submitError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                      {submitError}
                    </div>
                  )}

                  <div>
                    <label htmlFor="jd-name" style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#6b6b6b", display: "block", marginBottom: "6px" }}>Full Name</label>
                    <input
                      id="jd-name"
                      type="text"
                      required
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-3 outline-none text-[#e4e4e4] focus:border-[#c8f135]/50 transition-colors"
                      style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px" }}
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label htmlFor="jd-email" style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#6b6b6b", display: "block", marginBottom: "6px" }}>Email</label>
                    <input
                      id="jd-email"
                      type="email"
                      required
                      value={applicantEmail}
                      onChange={(e) => setApplicantEmail(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-3 outline-none text-[#e4e4e4] focus:border-[#c8f135]/50 transition-colors"
                      style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px" }}
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="jd-phone" style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#6b6b6b", display: "block", marginBottom: "6px" }}>Phone</label>
                    <input
                      id="jd-phone"
                      type="tel"
                      required
                      value={applicantPhone}
                      onChange={(e) => setApplicantPhone(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-3 outline-none text-[#e4e4e4] focus:border-[#c8f135]/50 transition-colors"
                      style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px" }}
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <div>
                    <label htmlFor="jd-resume" style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#6b6b6b", display: "block", marginBottom: "6px" }}>Resume</label>
                    {profile?.resumeUrl && !resumeFile ? (
                      <div className="flex items-center justify-between gap-3 rounded-xl border p-3"
                           style={{ background: "rgba(200,241,53,0.05)", borderColor: "rgba(200,241,53,0.2)" }}>
                        <span className="truncate text-[12px] text-[#c8f135]">
                          Using {profile.resumeFileName ?? "your saved resume"}
                        </span>
                        <label htmlFor="jd-resume" className="shrink-0 cursor-pointer text-[11px] text-[#8b8b8b] hover:text-white">
                          Use another
                        </label>
                      </div>
                    ) : null}
                    <input
                      id="jd-resume"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                      className={`w-full bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-3 outline-none text-[#e4e4e4] focus:border-[#c8f135]/50 transition-colors text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#c8f135]/10 file:text-[#c8f135] hover:file:bg-[#c8f135]/20 ${profile?.resumeUrl && !resumeFile ? "hidden" : ""}`}
                    />
                  </div>

                  {/* What the startup will receive from the profile, so the
                      student can see it is attached without retyping it. */}
                  {profile && (profile.githubUrl || profile.linkedinUrl || profile.portfolioUrl || profile.skills?.length) ? (
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                      <p className="mb-2 text-[11px] text-[#6b6b6b]">Also sent from your profile</p>
                      <div className="flex flex-wrap gap-1.5">
                        {profile.githubUrl && <Tag>GitHub</Tag>}
                        {profile.linkedinUrl && <Tag>LinkedIn</Tag>}
                        {profile.portfolioUrl && <Tag>Portfolio</Tag>}
                        {profile.college && <Tag>{profile.college}</Tag>}
                        {profile.cgpa != null && <Tag>CGPA {String(profile.cgpa)}</Tag>}
                        {profile.skills?.slice(0, 4).map((sk) => <Tag key={sk}>{sk}</Tag>)}
                        {(profile.skills?.length ?? 0) > 4 && <Tag>+{(profile.skills!.length - 4)} more</Tag>}
                      </div>
                      <Link href="/profile" className="mt-2 inline-block text-[11px] text-[#c8f135] hover:underline">
                        Edit profile
                      </Link>
                    </div>
                  ) : null}

                  <div>
                    <label htmlFor="jd-cover" style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#6b6b6b", display: "block", marginBottom: "6px" }}>Cover Note (Optional)</label>
                    <textarea
                      id="jd-cover"
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-3 outline-none text-[#e4e4e4] focus:border-[#c8f135]/50 transition-colors resize-none h-[90px]"
                      style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px" }}
                      placeholder="Why are you a great fit?"
                    />
                  </div>

                  {/* Two different reasons to block, and they need different
                      messages. A missing required field is not a percentage
                      problem — showing a 79%-against-50% bar there reads as
                      "you have passed" while the button stays disabled. */}
                  {session?.access_token && !profileLoading && !canSubmit && (
                    <div className="rounded-xl border p-3"
                         style={{ background: "rgba(250,204,21,0.07)", borderColor: "rgba(250,204,21,0.25)" }}>
                      {missingRequired.length > 0 ? (
                        <>
                          <p className="mb-1.5 text-[12px] font-medium text-[#facc15]">
                            {missingRequired.length === 1
                              ? `${missingRequired[0]} is required to apply`
                              : `${missingRequired.length} things are required to apply`}
                          </p>
                          <p className="mb-2.5 text-[11px] leading-relaxed text-[#8b8b8b]">
                            Add them here — they save to your profile, so you will
                            not be asked again.
                          </p>

                          {/* Filled inline rather than sending the student off to
                              /profile and losing the form they already started. */}
                          <div className="space-y-2">
                            {missingRequired.includes("Skills") && (
                              <div>
                                <label className="mb-1 block text-[10px] text-[#8b8b8b]">Skills</label>
                                <div className="flex gap-1.5">
                                  <input
                                    value={quickSkill}
                                    onChange={(e) => setQuickSkill(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") { e.preventDefault(); addQuickSkill(); }
                                    }}
                                    onBlur={addQuickSkill}
                                    onPaste={(e) => {
                                      const incoming = parseSkills(e.clipboardData.getData("text"));
                                      if (incoming.length > 1) {
                                        e.preventDefault();
                                        setQuickSkills(mergeSkills(quickSkills, incoming));
                                        setQuickSkill("");
                                      }
                                    }}
                                    placeholder="Paste all your skills at once"
                                    className="flex-1 rounded-lg border border-white/[0.08] bg-[#0a0a0a] px-2.5 py-1.5 text-[12px] text-[#e4e4e4] outline-none focus:border-[#c8f135]/50"
                                  />
                                  <button type="button" onClick={addQuickSkill}
                                          className="rounded-lg border border-white/[0.08] px-2.5 text-[12px] text-[#c8f135]">
                                    Add
                                  </button>
                                </div>
                                {quickSkills.length > 0 && (
                                  <div className="mt-1.5 flex flex-wrap gap-1">
                                    {quickSkills.map((sk) => (
                                      <span key={sk}
                                            className="rounded bg-white/[0.06] px-2 py-0.5 text-[10px] text-[#a1a1a1]">
                                        {sk}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {missingRequired.includes("College") && (
                              <div>
                                <label className="mb-1 block text-[10px] text-[#8b8b8b]">College</label>
                                <input
                                  value={quickCollege}
                                  onChange={(e) => setQuickCollege(e.target.value)}
                                  placeholder="Your college"
                                  className="w-full rounded-lg border border-white/[0.08] bg-[#0a0a0a] px-2.5 py-1.5 text-[12px] text-[#e4e4e4] outline-none focus:border-[#c8f135]/50"
                                />
                              </div>
                            )}

                            {missingRequired.includes("Phone number") && (
                              <div>
                                <label className="mb-1 block text-[10px] text-[#8b8b8b]">Phone</label>
                                <input
                                  value={applicantPhone}
                                  onChange={(e) => setApplicantPhone(e.target.value)}
                                  placeholder="Your phone number"
                                  className="w-full rounded-lg border border-white/[0.08] bg-[#0a0a0a] px-2.5 py-1.5 text-[12px] text-[#e4e4e4] outline-none focus:border-[#c8f135]/50"
                                />
                              </div>
                            )}

                            {missingRequired.includes("Resume") && (
                              <p className="text-[11px] text-[#8b8b8b]">
                                Attach a resume above, or upload one to your profile.
                              </p>
                            )}

                            {canQuickSave && (
                              <button
                                type="button"
                                onClick={saveQuickFields}
                                disabled={quickSaving}
                                className="w-full rounded-lg py-2 text-[12px] font-medium disabled:opacity-50"
                                style={{ background: "rgba(200,241,53,0.15)", color: "#c8f135" }}
                              >
                                {quickSaving ? "Saving..." : "Save and continue"}
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <span className="text-[12px] text-[#facc15]">
                              Profile {profile?.completeness ?? 0}% complete
                            </span>
                            <span className="text-[11px] text-[#8b8b8b]">{minToApply}% needed</span>
                          </div>
                          <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                            <div className="h-full rounded-full transition-all"
                                 style={{ width: `${profile?.completeness ?? 0}%`, background: "#facc15" }} />
                          </div>
                          <p className="text-[11px] leading-relaxed text-[#8b8b8b]">
                            {blockingReason}
                          </p>
                        </>
                      )}
                      <Link href="/profile" className="mt-2 inline-block text-[12px] font-medium text-[#c8f135] hover:underline">
                        {missingRequired.length > 0 ? "Add to your profile →" : "Complete your profile →"}
                      </Link>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || !session?.access_token || profileLoading || !canSubmit}
                    className="w-full py-3.5 bg-[#c8f135] text-black font-semibold rounded-xl transition-all hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(200,241,53,0.15)] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                    style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "15px" }}
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Application"}
                  </button>
                  {!session?.access_token && (
                    <p className="text-center" style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#6b6b6b" }}>
                      <Link href="/login" className="text-[#c8f135] hover:underline">Log in</Link> to apply
                    </p>
                  )}
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[10px] text-[#a1a1a1]">
      {children}
    </span>
  );
}
