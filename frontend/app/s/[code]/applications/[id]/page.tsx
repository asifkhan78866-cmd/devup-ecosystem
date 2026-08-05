"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, FileText, Globe, Mail, Phone,
  GraduationCap, CalendarPlus, XCircle, ChevronRight, Award, UserPlus,
} from "lucide-react";
import { workspaceApi, MANUAL_STAGES, STAGE_LABEL } from "@/lib/api/workspace";

export default function ApplicationDetail() {
  const { code, id } = useParams<{ code: string; id: string }>();
  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [modal, setModal] = useState<null | "interview" | "offer" | "reject">(null);

  const load = useCallback(async () => {
    if (!code || !id) return;
    try {
      setApp(await workspaceApi.application(code, id));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [code, id]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (fn: () => Promise<unknown>, successMsg: string) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await fn();
      setNotice(successMsg);
      setModal(null);
      await load();
    } catch (e: any) {
      // A stale version means someone else moved this candidate first.
      setError(
        e.code === "STALE_VERSION"
          ? "Someone else updated this application. It has been refreshed — please try again."
          : e.message
      );
      if (e.code === "STALE_VERSION") await load();
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="p-8 text-[#6b6b6b] text-sm">Loading…</div>;
  if (!app) return <div className="p-8 text-red-300 text-sm">{error ?? "Not found"}</div>;

  const closed = Boolean(app.outcome);
  const canOffer = app.stage === "SELECTED" && !app.offer && !closed;
  const canOnboard = app.offer?.status === "ACCEPTED" && app.stage !== "ONBOARDED";

  return (
    <div className="px-5 py-7 md:px-9 md:py-9 max-w-[1200px] mx-auto">
      <Link href={`/s/${code}/applications`} className="inline-flex items-center gap-1.5 text-[#6b6b6b] hover:text-[#a1a1a1] text-xs mb-5 transition">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to applicants
      </Link>

      {error && <Banner tone="error">{error}</Banner>}
      {notice && <Banner tone="ok">{notice}</Banner>}

      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-white text-[26px] md:text-[30px] font-extrabold tracking-[-0.02em]" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
            {app.applicantName ?? "Unnamed candidate"}
          </h1>
          <p className="text-[#6b6b6b] text-sm mt-1">
            {app.job?.title} · <span className="tabular-nums">{app.applicationNo}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg text-xs" style={{ background: "rgba(200,241,53,0.1)", color: "#c8f135" }}>
            {STAGE_LABEL[app.stage] ?? app.stage}
          </span>
          {closed && (
            <span className="px-3 py-1.5 rounded-lg text-xs bg-red-500/10 text-red-300 border border-red-500/20">
              {app.outcome}
            </span>
          )}
        </div>
      </header>

      {/* Actions */}
      {!closed && (
        <div className="flex flex-wrap gap-2 mb-6 p-4 rounded-2xl bg-[#111111] border border-white/[0.06]">
          <select
            disabled={busy}
            value=""
            onChange={(e) => {
              const toStage = e.target.value;
              if (!toStage) return;
              act(
                () => workspaceApi.transition(code, id, { toStage, version: app.version }),
                `Moved to ${STAGE_LABEL[toStage]}`
              );
            }}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[#e4e4e4] text-xs outline-none focus:border-[#c8f135]/40 disabled:opacity-50"
          >
            <option value="">Move to stage…</option>
            {MANUAL_STAGES.filter((s) => s !== app.stage).map((s) => (
              <option key={s} value={s}>{STAGE_LABEL[s]}</option>
            ))}
          </select>

          <Btn onClick={() => setModal("interview")} disabled={busy} icon={CalendarPlus}>Schedule interview</Btn>

          {canOffer && <Btn onClick={() => setModal("offer")} disabled={busy} icon={Award} accent>Generate offer</Btn>}

          {canOnboard && (
            <Btn
              onClick={() => act(() => workspaceApi.onboard(code, id), "Candidate onboarded")}
              disabled={busy}
              icon={UserPlus}
              accent
            >
              Onboard
            </Btn>
          )}

          <Btn onClick={() => setModal("reject")} disabled={busy} icon={XCircle} danger>Reject</Btn>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        {/* Left */}
        <div className="space-y-4">
          <Card title="Candidate">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <Field icon={Mail} label="Email" value={app.applicantEmail} />
              <Field icon={Phone} label="Phone" value={app.applicantPhone} />
              <Field icon={GraduationCap} label="College" value={app.college} />
              <Field label="CGPA" value={app.cgpa} />
              <Field label="Experience" value={app.experienceYears ? `${app.experienceYears} yrs` : null} />
            </div>

            {app.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {app.skills.map((s: string) => (
                  <span key={s} className="text-[10px] px-2 py-1 rounded bg-white/5 border border-white/5 text-[#a1a1a1]">
                    {s}
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-4">
              {app.resumeUrl && <LinkBtn href={app.resumeUrl} icon={FileText}>Resume</LinkBtn>}
              {app.githubUrl && <LinkBtn href={app.githubUrl} icon={Globe}>GitHub</LinkBtn>}
              {app.linkedinUrl && <LinkBtn href={app.linkedinUrl} icon={Globe}>LinkedIn</LinkBtn>}
              {app.portfolioUrl && <LinkBtn href={app.portfolioUrl} icon={Globe}>Portfolio</LinkBtn>}
            </div>
          </Card>

          {app.coverLetter && (
            <Card title="Cover Letter">
              <p className="text-[#a1a1a1] text-xs leading-relaxed whitespace-pre-wrap">{app.coverLetter}</p>
            </Card>
          )}

          {app.interviews?.length > 0 && (
            <Card title="Interviews">
              <div className="divide-y divide-white/5">
                {app.interviews.map((iv: any) => (
                  <div key={iv.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[#e4e4e4] text-xs font-medium">{STAGE_LABEL[iv.stage] ?? iv.stage}</span>
                      <span className="text-[10px] text-[#6b6b6b]">{iv.status}</span>
                    </div>
                    <div className="text-[10px] text-[#6b6b6b] mt-1">
                      {new Date(iv.scheduledAt).toLocaleString("en-IN")} · {iv.mode}
                    </div>
                    {iv.feedback?.map((f: any) => (
                      <div key={f.id} className="mt-2 p-2 rounded bg-white/[0.03] text-[10px]">
                        <span className="text-[#c8f135]">{f.recommend}</span>
                        <span className="text-[#6b6b6b]"> · {f.rating}/5</span>
                        {f.notes && <p className="text-[#a1a1a1] mt-1">{f.notes}</p>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {app.offer && (
            <Card title="Offer">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <Field label="Offer No" value={app.offer.offerNo} />
                <Field label="Status" value={app.offer.status} />
                <Field label="Designation" value={app.offer.designation} />
                <Field label="CTC / Stipend" value={app.offer.ctc ?? app.offer.stipend} />
                <Field label="Joining" value={new Date(app.offer.joiningDate).toLocaleDateString("en-IN")} />
                <Field label="Expires" value={new Date(app.offer.expiresAt).toLocaleDateString("en-IN")} />
              </div>
            </Card>
          )}
        </div>

        {/* Timeline */}
        <Card title="History">
          <div className="space-y-0">
            {app.events?.map((e: any, i: number) => (
              <div key={e.id} className="flex gap-3 pb-4 last:pb-0 relative">
                {i < app.events.length - 1 && (
                  <div className="absolute left-[5px] top-4 bottom-0 w-px bg-white/10" />
                )}
                <div className="w-2.5 h-2.5 rounded-full mt-1 shrink-0 z-10" style={{ background: e.outcome ? "#f87171" : "#c8f135" }} />
                <div className="min-w-0">
                  <div className="text-[#e4e4e4] text-[11px] font-medium">
                    {e.outcome ?? STAGE_LABEL[e.toStage] ?? e.toStage}
                  </div>
                  <div className="text-[10px] text-[#6b6b6b]">
                    {new Date(e.createdAt).toLocaleString("en-IN")}
                  </div>
                  {e.note && <p className="text-[10px] text-[#8b8b8b] mt-0.5">{e.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {modal === "interview" && (
        <InterviewModal
          onClose={() => setModal(null)}
          busy={busy}
          onSubmit={(body: unknown) => act(() => workspaceApi.scheduleInterview(code, id, body), "Interview scheduled")}
        />
      )}
      {modal === "offer" && (
        <OfferModal
          job={app.job}
          onClose={() => setModal(null)}
          busy={busy}
          onSubmit={(body: unknown) => act(() => workspaceApi.generateOffer(code, id, body), "Offer generated and sent")}
        />
      )}
      {modal === "reject" && (
        <RejectModal
          onClose={() => setModal(null)}
          busy={busy}
          onSubmit={(reason: string) => act(() => workspaceApi.reject(code, id, { reason, version: app.version }), "Application rejected")}
        />
      )}
    </div>
  );
}

/* ── UI primitives ─────────────────────────────────── */

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="p-5 rounded-2xl bg-[#111111] border border-white/[0.06]">
      <h2 className="text-white text-sm font-semibold mb-4" style={{ fontFamily: "var(--font-syne), sans-serif" }}>{title}</h2>
      {children}
    </section>
  );
}

function Field({ icon: Icon, label, value }: { icon?: any; label: string; value?: any }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-[10px] text-[#6b6b6b] flex items-center gap-1 mb-0.5">
        {Icon && <Icon className="w-3 h-3" />} {label}
      </div>
      <div className="text-[#e4e4e4] truncate">{String(value)}</div>
    </div>
  );
}

function Btn({ children, onClick, disabled, icon: Icon, accent, danger }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition disabled:opacity-40 border"
      style={{
        background: accent ? "rgba(200,241,53,0.1)" : danger ? "rgba(248,113,113,0.08)" : "rgba(255,255,255,0.04)",
        borderColor: accent ? "rgba(200,241,53,0.3)" : danger ? "rgba(248,113,113,0.25)" : "rgba(255,255,255,0.1)",
        color: accent ? "#c8f135" : danger ? "#f87171" : "#e4e4e4",
      }}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />} {children}
    </button>
  );
}

function LinkBtn({ href, icon: Icon, children }: any) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[#a1a1a1] text-[11px] hover:text-white hover:border-white/20 transition"
    >
      <Icon className="w-3 h-3" /> {children} <ChevronRight className="w-3 h-3" />
    </a>
  );
}

function Banner({ tone, children }: { tone: "error" | "ok"; children: React.ReactNode }) {
  return (
    <div
      className="mb-4 p-3 rounded-lg text-sm border"
      style={
        tone === "error"
          ? { background: "rgba(248,113,113,0.08)", borderColor: "rgba(248,113,113,0.2)", color: "#fca5a5" }
          : { background: "rgba(200,241,53,0.06)", borderColor: "rgba(200,241,53,0.2)", color: "#c8f135" }
      }
    >
      {children}
    </div>
  );
}

function Modal({ title, children, onClose }: any) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-[#141414] border border-white/10 p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-white text-sm font-semibold mb-4" style={{ fontFamily: "var(--font-syne), sans-serif" }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

const input = "w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[#e4e4e4] text-xs outline-none focus:border-[#c8f135]/40";
const label = "block text-[10px] text-[#6b6b6b] mb-1";

function InterviewModal({ onClose, onSubmit, busy }: any) {
  const [f, setF] = useState({ stage: "TECHNICAL_ROUND", scheduledAt: "", mode: "ONLINE", meetingUrl: "", durationMins: 45 });
  return (
    <Modal title="Schedule interview" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className={label}>Round</label>
          <select className={input} value={f.stage} onChange={(e) => setF({ ...f, stage: e.target.value })}>
            {["HR_ROUND", "TECHNICAL_ROUND", "ASSIGNMENT", "FINAL_INTERVIEW"].map((s) => (
              <option key={s} value={s}>{STAGE_LABEL[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Date & time</label>
          <input type="datetime-local" className={input} value={f.scheduledAt} onChange={(e) => setF({ ...f, scheduledAt: e.target.value })} />
        </div>
        <div>
          <label className={label}>Mode</label>
          <select className={input} value={f.mode} onChange={(e) => setF({ ...f, mode: e.target.value })}>
            <option value="ONLINE">Online</option>
            <option value="OFFLINE">In person</option>
            <option value="PHONE">Phone</option>
          </select>
        </div>
        {f.mode === "ONLINE" && (
          <div>
            <label className={label}>Meeting link</label>
            <input className={input} placeholder="https://meet.google.com/…" value={f.meetingUrl} onChange={(e) => setF({ ...f, meetingUrl: e.target.value })} />
          </div>
        )}
        <button
          disabled={busy || !f.scheduledAt}
          onClick={() => onSubmit({ ...f, scheduledAt: new Date(f.scheduledAt).toISOString() })}
          className="w-full py-2 rounded-lg text-xs font-medium disabled:opacity-40"
          style={{ background: "rgba(200,241,53,0.15)", color: "#c8f135" }}
        >
          Schedule
        </button>
      </div>
    </Modal>
  );
}

function OfferModal({ job, onClose, onSubmit, busy }: any) {
  const isIntern = job?.type === "INTERNSHIP";
  const in30 = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
  const [f, setF] = useState({
    designation: job?.title ?? "",
    department: job?.department ?? "",
    ctc: "",
    stipend: job?.stipend ?? "",
    joiningDate: in30,
  });
  // Expiry is not HR's to choose — the offer lapses two days before joining.
  const expires = new Date(new Date(f.joiningDate).getTime() - 2 * 864e5);
  return (
    <Modal title="Generate offer letter" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className={label}>Designation</label>
          <input className={input} value={f.designation} onChange={(e) => setF({ ...f, designation: e.target.value })} />
        </div>
        <div>
          <label className={label}>Department</label>
          <input className={input} value={f.department} onChange={(e) => setF({ ...f, department: e.target.value })} />
        </div>
        <div>
          <label className={label}>{isIntern ? "Monthly stipend" : "Annual CTC"}</label>
          <input
            className={input}
            placeholder={isIntern ? "₹15,000/month" : "₹12,00,000"}
            value={isIntern ? f.stipend : f.ctc}
            onChange={(e) => setF(isIntern ? { ...f, stipend: e.target.value } : { ...f, ctc: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={label}>Joining date</label>
            <input type="date" className={input} value={f.joiningDate} onChange={(e) => setF({ ...f, joiningDate: e.target.value })} />
          </div>
          <div>
            <label className={label}>Offer expires</label>
            <div className={`${input} text-[#8b8b8b] flex items-center`}>
              {isNaN(expires.getTime()) ? "—" : expires.toLocaleDateString("en-IN", { dateStyle: "medium" })}
            </div>
          </div>
        </div>
        <p className="text-[10px] text-[#6b6b6b]">
          A numbered offer letter is issued using this startup&apos;s branding. The number cannot be
          reused. The offer lapses two days before the joining date if unanswered.
        </p>
        <button
          disabled={busy || !f.designation}
          onClick={() => onSubmit(f)}
          className="w-full py-2 rounded-lg text-xs font-medium disabled:opacity-40"
          style={{ background: "rgba(200,241,53,0.15)", color: "#c8f135" }}
        >
          Generate & send
        </button>
      </div>
    </Modal>
  );
}

function RejectModal({ onClose, onSubmit, busy }: any) {
  const [reason, setReason] = useState("");
  return (
    <Modal title="Reject candidate" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className={label}>Reason (kept internally)</label>
          <textarea rows={3} className={input} value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <p className="text-[10px] text-[#6b6b6b]">
          This is final. The application is retained in history and the candidate is notified.
        </p>
        <button
          disabled={busy || reason.trim().length < 3}
          onClick={() => onSubmit(reason)}
          className="w-full py-2 rounded-lg text-xs font-medium disabled:opacity-40"
          style={{ background: "rgba(248,113,113,0.12)", color: "#f87171" }}
        >
          Reject
        </button>
      </div>
    </Modal>
  );
}
