"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Upload, FileText, Check, Bell, BellOff, X, Plus } from "lucide-react";
import ProtectedContent from "@/components/auth/ProtectedContent";
import { parseSkills, mergeSkills } from "@/lib/skills";
import {
  profileApi, StudentProfile, enablePush, disablePush,
  currentPushSubscription, pushSupported,
} from "@/lib/api/profile";

const input =
  "w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[#e4e4e4] text-sm outline-none focus:border-[#c8f135]/40 transition";
const labelCls = "block text-[11px] text-[#6b6b6b] mb-1.5";

export default function ProfilePage() {
  const [p, setP] = useState<StudentProfile>({ skills: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [skillDraft, setSkillDraft] = useState("");
  const [pushOn, setPushOn] = useState(false);
  const [pushMsg, setPushMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    profileApi
      .get()
      .then((d) => setP({ ...d, skills: d.skills ?? [] }))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    currentPushSubscription().then((s) => setPushOn(Boolean(s)));
  }, []);

  const set = (k: keyof StudentProfile, v: unknown) => {
    setP((prev) => ({ ...prev, [k]: v }));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      // Server-owned fields are stripped — the resume is set by its own upload
      // endpoint and completeness is derived, not stored.
      // Anything still sitting in the skills box counts. Without this, a user
      // who types their skills and hits Save loses them silently.
      const pendingSkills = parseSkills(skillDraft);
      const finalSkills = mergeSkills(p.skills ?? [], pendingSkills);
      if (pendingSkills.length) {
        set("skills", finalSkills);
        setSkillDraft("");
      }

      const body: Record<string, unknown> = {
        name: p.name, bio: p.bio, phone: p.phone, college: p.college,
        degree: p.degree, branch: p.branch, city: p.city, skills: finalSkills,
        githubUrl: p.githubUrl, linkedinUrl: p.linkedinUrl,
        twitterUrl: p.twitterUrl, portfolioUrl: p.portfolioUrl,
        isOpenToWork: p.isOpenToWork ?? true,
        isLookingForCofounder: p.isLookingForCofounder ?? false,
        graduationYear: p.graduationYear ? Number(p.graduationYear) : undefined,
        cgpa: p.cgpa === "" || p.cgpa == null ? undefined : Number(p.cgpa),
        experienceYears:
          p.experienceYears === "" || p.experienceYears == null ? undefined : Number(p.experienceYears),
      };

      const updated = await profileApi.save(body);
      setP((prev) => ({ ...prev, ...updated }));
      setSaved(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const onResume = async (file?: File | null) => {
    if (!file) return;
    setError(null);
    try {
      const updated = await profileApi.uploadResume(file);
      setP((prev) => ({ ...prev, ...updated }));
    } catch (e: any) {
      setError(e.message || "Upload failed. Use a PDF or Word file under 10 MB.");
    }
  };

  const togglePush = async () => {
    setPushMsg(null);
    if (pushOn) {
      await disablePush();
      setPushOn(false);
      return;
    }
    const res = await enablePush();
    if (res.ok) {
      setPushOn(true);
      await profileApi.testPush().catch(() => {});
    } else {
      setPushMsg(res.reason ?? "Could not enable notifications.");
    }
  };

  // Accepts one skill or a whole pasted list — "HTML CSS JavaScript" or
  // "REST API, Tailwind CSS" both work.
  const addSkill = () => {
    const incoming = parseSkills(skillDraft);
    if (incoming.length === 0) return setSkillDraft("");
    set("skills", mergeSkills(p.skills ?? [], incoming));
    setSkillDraft("");
  };

  return (
    <ProtectedContent blurRadius={12} message="Login to View Profile">
      <div className="min-h-screen bg-[#0a0a0a] pt-28 pb-24">
        <div className="max-w-3xl mx-auto px-6">
          <Link href="/dashboard" className="text-[#c8f135] text-sm hover:underline mb-6 inline-block">
            &larr; Back to Dashboard
          </Link>

          <h1 className="text-3xl text-white mb-1" style={{ fontFamily: "var(--font-syne)", fontWeight: 800 }}>
            Your Profile
          </h1>
          <p className="text-[#a1a1a1] text-sm mb-6">
            Fill this once. Every startup application autofills from here.
          </p>

          {!loading && (
            <div className="mb-6 p-4 rounded-xl bg-[#111111] border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#e4e4e4] text-sm font-medium">Profile strength</span>
                <span className="text-[#c8f135] text-sm tabular-nums">{p.completeness ?? 0}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${p.completeness ?? 0}%`, background: "linear-gradient(90deg,#c8f135,rgba(200,241,53,0.4))" }}
                />
              </div>
              {p.missing && p.missing.length > 0 && (
                <p className="text-[11px] text-[#8b8b8b] mt-2">
                  Needed before applying: <span className="text-[#facc15]">{p.missing.join(", ")}</span>
                </p>
              )}
            </div>
          )}

          {error && <div className="mb-4 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-300 text-sm">{error}</div>}
          {saved && (
            <div className="mb-4 p-3 rounded-lg border text-sm flex items-center gap-2" style={{ borderColor: "rgba(200,241,53,0.2)", background: "rgba(200,241,53,0.06)", color: "#c8f135" }}>
              <Check className="w-4 h-4" /> Profile saved.
            </div>
          )}

          {loading ? (
            <p className="text-[#6b6b6b] text-sm">Loading…</p>
          ) : (
            <div className="space-y-4">
              <Card title="Resume">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => onResume(e.target.files?.[0])}
                />
                {p.resumeUrl ? (
                  <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-[#c8f135] shrink-0" />
                      <div className="min-w-0">
                        <a href={p.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-[#e4e4e4] text-xs hover:text-[#c8f135] transition truncate block">
                          {p.resumeFileName ?? "resume.pdf"}
                        </a>
                        {p.resumeUpdatedAt && (
                          <span className="text-[10px] text-[#6b6b6b]">
                            Updated {new Date(p.resumeUpdatedAt).toLocaleDateString("en-IN")}
                          </span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => fileRef.current?.click()} className="text-[11px] text-[#8b8b8b] hover:text-white transition shrink-0">
                      Replace
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full p-6 rounded-lg border border-dashed border-white/15 hover:border-[#c8f135]/40 transition flex flex-col items-center gap-2"
                  >
                    <Upload className="w-5 h-5 text-[#6b6b6b]" />
                    <span className="text-[#a1a1a1] text-xs">Upload your resume (PDF or Word, max 10 MB)</span>
                  </button>
                )}
              </Card>

              <Card title="Basics">
                <Row>
                  <Field label="Full name *"><input className={input} value={p.name ?? ""} onChange={(e) => set("name", e.target.value)} /></Field>
                  <Field label="Phone *"><input className={input} value={p.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></Field>
                </Row>
                <Field label="Email"><input className={`${input} opacity-60`} value={p.email ?? ""} disabled /></Field>
                <Field label="Short bio"><textarea rows={3} className={input} value={p.bio ?? ""} onChange={(e) => set("bio", e.target.value)} /></Field>
                <Field label="City"><input className={input} value={p.city ?? ""} onChange={(e) => set("city", e.target.value)} /></Field>
              </Card>

              <Card title="Education">
                <Field label="College *"><input className={input} value={p.college ?? ""} onChange={(e) => set("college", e.target.value)} /></Field>
                <Row>
                  <Field label="Degree"><input className={input} placeholder="B.Tech" value={p.degree ?? ""} onChange={(e) => set("degree", e.target.value)} /></Field>
                  <Field label="Branch"><input className={input} placeholder="CSE" value={p.branch ?? ""} onChange={(e) => set("branch", e.target.value)} /></Field>
                </Row>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label="Graduation year"><input type="number" className={input} value={p.graduationYear ?? ""} onChange={(e) => set("graduationYear", e.target.value)} /></Field>
                  <Field label="CGPA"><input type="number" step="0.01" max={10} className={input} value={p.cgpa ?? ""} onChange={(e) => set("cgpa", e.target.value)} /></Field>
                  <Field label="Experience (yrs)"><input type="number" step="0.5" className={input} value={p.experienceYears ?? ""} onChange={(e) => set("experienceYears", e.target.value)} /></Field>
                </div>
              </Card>

              <Card title="Skills">
                <div className="flex gap-2">
                  <input
                    className={input}
                    placeholder="Paste your skills — e.g. HTML CSS JavaScript, or REST API, Tailwind CSS"
                    value={skillDraft}
                    onChange={(e) => setSkillDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                    onBlur={addSkill}
                    onPaste={(e) => {
                      const text = e.clipboardData.getData("text");
                      const incoming = parseSkills(text);
                      // Only intercept a genuine list; a single word types normally.
                      if (incoming.length > 1) {
                        e.preventDefault();
                        set("skills", mergeSkills(p.skills ?? [], incoming));
                        setSkillDraft("");
                      }
                    }}
                  />
                  <button onClick={addSkill} className="px-3 rounded-lg bg-white/5 border border-white/10 text-[#c8f135]">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {(p.skills ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {(p.skills ?? []).map((s) => (
                      <span key={s} className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-white/5 border border-white/10 text-[#a1a1a1]">
                        {s}
                        <button onClick={() => set("skills", (p.skills ?? []).filter((x) => x !== s))} className="hover:text-red-300">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </Card>

              <Card title="Links">
                <Field label="GitHub"><input className={input} placeholder="https://github.com/username" value={p.githubUrl ?? ""} onChange={(e) => set("githubUrl", e.target.value)} /></Field>
                <Field label="LinkedIn"><input className={input} placeholder="https://linkedin.com/in/username" value={p.linkedinUrl ?? ""} onChange={(e) => set("linkedinUrl", e.target.value)} /></Field>
                <Field label="Portfolio"><input className={input} placeholder="https://yoursite.com" value={p.portfolioUrl ?? ""} onChange={(e) => set("portfolioUrl", e.target.value)} /></Field>
                <Field label="Twitter / X"><input className={input} value={p.twitterUrl ?? ""} onChange={(e) => set("twitterUrl", e.target.value)} /></Field>
              </Card>

              <Card title="Preferences">
                <Toggle checked={p.isOpenToWork ?? true} onChange={(v: boolean) => set("isOpenToWork", v)} title="Open to work" hint="Show startups that you are available." />
                <Toggle checked={p.isLookingForCofounder ?? false} onChange={(v: boolean) => set("isLookingForCofounder", v)} title="Looking for a co-founder" hint="Appear in co-founder matching." />

                {pushSupported() && (
                  <div className="flex items-start justify-between gap-4 pt-3 mt-1 border-t border-white/5">
                    <div>
                      <div className="text-[#e4e4e4] text-sm flex items-center gap-2">
                        {pushOn ? <Bell className="w-4 h-4 text-[#c8f135]" /> : <BellOff className="w-4 h-4 text-[#6b6b6b]" />}
                        Push notifications
                      </div>
                      <p className="text-[11px] text-[#6b6b6b] mt-0.5">
                        Get interview and offer updates on this device, even when the tab is closed.
                      </p>
                      {pushMsg && <p className="text-[11px] text-[#facc15] mt-1">{pushMsg}</p>}
                    </div>
                    <button
                      onClick={togglePush}
                      className="shrink-0 px-3 py-1.5 rounded-lg text-[11px] border transition"
                      style={{
                        background: pushOn ? "rgba(200,241,53,0.1)" : "rgba(255,255,255,0.04)",
                        borderColor: pushOn ? "rgba(200,241,53,0.3)" : "rgba(255,255,255,0.1)",
                        color: pushOn ? "#c8f135" : "#e4e4e4",
                      }}
                    >
                      {pushOn ? "On" : "Enable"}
                    </button>
                  </div>
                )}
              </Card>

              <button
                onClick={save}
                disabled={saving}
                className="px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-40"
                style={{ background: "rgba(200,241,53,0.15)", color: "#c8f135" }}
              >
                {saving ? "Saving…" : "Save profile"}
              </button>
            </div>
          )}
        </div>
      </div>
    </ProtectedContent>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="p-5 rounded-xl bg-[#111111] border border-white/5 space-y-3">
      <h2 className="text-white text-sm font-semibold" style={{ fontFamily: "var(--font-syne)" }}>{title}</h2>
      {children}
    </section>
  );
}

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div><label className={labelCls}>{label}</label>{children}</div>
);

function Toggle({
  checked, onChange, title, hint,
}: { checked: boolean; onChange: (v: boolean) => void; title: string; hint: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-[#e4e4e4] text-sm">{title}</div>
        <p className="text-[11px] text-[#6b6b6b] mt-0.5">{hint}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        className="shrink-0 w-10 rounded-full p-0.5 transition"
        style={{ background: checked ? "rgba(200,241,53,0.4)" : "rgba(255,255,255,0.1)", height: 22 }}
      >
        <span
          className="block w-4 h-4 rounded-full bg-white transition-transform"
          style={{ transform: checked ? "translateX(18px)" : "translateX(0)" }}
        />
      </button>
    </div>
  );
}
