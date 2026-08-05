"use client";

import { useEffect, useState, useCallback } from "react";
import {
  X, FileText, ExternalLink, Check, Upload, Trash2, AlertTriangle,
  Mail, Phone, GraduationCap, Briefcase, Calendar, IdCard, ShieldCheck,
} from "lucide-react";
import { workspaceApi, ONBOARDING_DOC_LABELS, DOC_STATUS_TONE } from "@/lib/api/workspace";

/**
 * Everything about one person: their record, what they have uploaded, what the
 * company has issued them, and where they came from. Opened from the Employees
 * and Interns tables so HR never has to piece this together across pages.
 */
export default function PersonDrawer({
  code,
  personId,
  onClose,
  onChanged,
}: {
  code: string;
  personId: string;
  onClose: () => void;
  onChanged?: () => void;
}) {
  const [p, setP] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<null | { message: string; force: boolean }>(null);

  const load = useCallback(async () => {
    try {
      setP(await workspaceApi.person(code, personId));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [code, personId]);

  useEffect(() => { load(); }, [load]);

  const act = async (fn: () => Promise<unknown>, msg: string) => {
    setBusy(true); setError(null); setNotice(null);
    try {
      await fn();
      setNotice(msg);
      await load();
      onChanged?.();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (force: boolean) => {
    setBusy(true); setError(null);
    try {
      await workspaceApi.deletePerson(code, personId, force);
      onChanged?.();
      onClose();
    } catch (e: any) {
      // The API refuses when issued documents exist, unless forced.
      if (e.code === "HAS_ISSUED_DOCUMENTS") {
        setConfirmDelete({ message: e.message, force: true });
      } else {
        setError(e.message);
      }
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="h-full w-full max-w-[620px] overflow-y-auto border-l border-white/10 bg-[#0d0d0d]"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <p className="p-8 text-sm text-[#6b6b6b]">Loading…</p>
        ) : !p ? (
          <p className="p-8 text-sm text-red-300">{error ?? "Not found"}</p>
        ) : (
          <>
            {/* Header */}
            <div className="sticky top-0 z-10 border-b border-white/5 bg-[#0d0d0d] px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-white text-[20px] font-bold" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
                      {p.fullName}
                    </h2>
                    {p.isDirectHire && (
                      <span className="rounded px-1.5 py-0.5 text-[9px]" style={{ background: "rgba(143,182,255,0.12)", color: "#8fb6ff" }}>
                        DIRECT
                      </span>
                    )}
                    <span className="rounded px-1.5 py-0.5 text-[9px]" style={{ background: "rgba(255,255,255,0.06)", color: "#8b8b8b" }}>
                      {p.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] tabular-nums text-[#c8f135]">{p.code}</p>
                  <p className="text-[12px] text-[#8b8b8b]">
                    {p.designation}{p.department ? ` · ${p.department}` : ""} · {p.kind === "INTERN" ? "Intern" : "Employee"}
                  </p>
                </div>
                <button onClick={onClose} className="text-[#6b6b6b] hover:text-white"><X className="h-5 w-5" /></button>
              </div>

              {/* Onboarding progress */}
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-[11px]">
                  <span className="text-[#8b8b8b]">
                    Onboarding · {p.onboarding.progress.requiredApproved}/{p.onboarding.progress.requiredTotal} approved
                  </span>
                  <span style={{ color: p.onboarding.progress.complete ? "#c8f135" : "#facc15" }}>
                    {p.onboarding.progress.complete ? "Complete" : `${p.onboarding.progress.percent}%`}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full rounded-full transition-all"
                       style={{ width: `${p.onboarding.progress.percent}%`, background: p.onboarding.progress.complete ? "#c8f135" : "#facc15" }} />
                </div>
              </div>
            </div>

            <div className="space-y-5 px-6 py-5">
              {error && <Banner tone="error">{error}</Banner>}
              {notice && <Banner tone="ok">{notice}</Banner>}

              {/* Details */}
              <Section title="Details">
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <Field icon={Mail} label="Email" value={p.email} />
                  <Field icon={Phone} label="Phone" value={p.phone} />
                  <Field icon={IdCard} label={p.kind === "INTERN" ? "Intern ID" : "Employee ID"} value={p.code} mono />
                  <Field icon={Briefcase} label="Designation" value={p.designation} />
                  <Field icon={Calendar} label={p.kind === "INTERN" ? "Start date" : "Joined"} value={fmt(p.joinedAt)} />
                  {p.kind === "INTERN"
                    ? <Field icon={Calendar} label="End date" value={fmt(p.endDate)} />
                    : <Field icon={Calendar} label="Exit date" value={p.exitedAt ? fmt(p.exitedAt) : "—"} />}
                  {p.kind === "INTERN" && <Field icon={GraduationCap} label="College" value={p.college} />}
                  <Field label={p.kind === "INTERN" ? "Stipend" : "Annual CTC"} value={p.stipend ?? p.ctc} />
                  <Field icon={ShieldCheck} label="DevUp account" value={p.hasAccount ? "Linked" : "Not registered"} />
                </div>
              </Section>

              {/* Where they came from */}
              <Section title="Source">
                {p.application ? (
                  <div className="space-y-1.5 text-[12px]">
                    <Row k="Applied for" v={p.application.jobTitle} />
                    <Row k="Application" v={p.application.applicationNo} mono />
                    <Row k="Applied on" v={fmt(p.application.appliedAt)} />
                    {p.offer && <><Row k="Offer" v={p.offer.offerNo} mono /><Row k="Offer status" v={p.offer.status} /></>}
                  </div>
                ) : (
                  <p className="text-[12px] text-[#8b8b8b]">
                    Added directly — no application or interview history behind this record.
                  </p>
                )}
              </Section>

              {/* Documents they uploaded */}
              <Section
                title={`Documents from them (${p.onboarding.items.filter((i: any) => i.status === "APPROVED").length}/${p.onboarding.items.length})`}
                action={
                  <button
                    onClick={() => act(() => workspaceApi.requestOnboardingDocs(code, p.id), "Reminder sent")}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] text-[#e4e4e4] transition hover:bg-white/10 disabled:opacity-40"
                  >
                    <Mail className="h-3 w-3" /> Remind
                  </button>
                }
              >
                <div className="divide-y divide-white/5">
                  {p.onboarding.items.map((item: any) => {
                    const tone = DOC_STATUS_TONE[item.status] ?? DOC_STATUS_TONE.PENDING;
                    return (
                      <div key={item.docType} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[12.5px] text-[#e4e4e4]">
                              {item.label ?? ONBOARDING_DOC_LABELS[item.docType]}
                            </span>
                            {!item.isRequired && <span className="text-[9px] text-[#5a5a5a]">optional</span>}
                          </div>
                          {item.rejectReason && <p className="mt-0.5 text-[10.5px] text-[#f87171]">{item.rejectReason}</p>}
                          {item.fileUrl && (
                            <a href={item.fileUrl} target="_blank" rel="noopener noreferrer"
                               className="mt-0.5 inline-flex items-center gap-1 text-[10.5px] text-[#8b8b8b] hover:text-white">
                              <FileText className="h-3 w-3" /> {item.fileName} <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <span className="whitespace-nowrap rounded px-2 py-1 text-[10px]" style={{ background: tone.bg, color: tone.fg }}>
                            {tone.label}
                          </span>
                          {item.status === "SUBMITTED" && (
                            <button
                              onClick={() => act(() => workspaceApi.reviewOnboardingDoc(code, item.documentId, true), "Approved")}
                              disabled={busy}
                              className="rounded-lg p-1.5 disabled:opacity-40"
                              style={{ background: "rgba(200,241,53,0.1)", color: "#c8f135" }}
                              title="Approve"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Section>

              {/* Documents issued to them */}
              <Section title={`Documents issued to them (${p.issuedDocuments.length})`}>
                {p.issuedDocuments.length === 0 ? (
                  <p className="text-[12px] text-[#6b6b6b]">Nothing issued yet.</p>
                ) : (
                  <div className="divide-y divide-white/5">
                    {p.issuedDocuments.map((d: any) => (
                      <div key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                          <div className="text-[12.5px] text-[#e4e4e4]">{String(d.docType).replace(/_/g, " ")}</div>
                          <div className="text-[10.5px] tabular-nums text-[#8b8b8b]">{d.documentNo}</div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {d.revokedAt && (
                            <span className="rounded px-2 py-1 text-[10px]" style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}>
                              REVOKED
                            </span>
                          )}
                          <span className="text-[10.5px] text-[#6b6b6b]">{fmt(d.issuedAt)}</span>
                          {d.pdfUrl && (
                            <a href={d.pdfUrl} target="_blank" rel="noopener noreferrer"
                               className="inline-flex items-center gap-1 text-[11px] text-[#8b8b8b] hover:text-white">
                              Open <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              {/* Danger zone */}
              <div className="rounded-xl border p-4" style={{ borderColor: "rgba(248,113,113,0.2)", background: "rgba(248,113,113,0.04)" }}>
                <div className="mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-[#f87171]" />
                  <span className="text-[13px] font-semibold text-white">Remove from team</span>
                </div>
                <p className="mb-3 text-[11.5px] leading-relaxed text-[#8b8b8b]">
                  Permanently deletes this record, their uploaded documents and their workspace access.
                  Attendance and reviews go too. This cannot be undone.
                </p>

                {confirmDelete ? (
                  <div className="space-y-2">
                    <p className="text-[11.5px] text-[#facc15]">{confirmDelete.message}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => remove(true)}
                        disabled={busy}
                        className="rounded-lg px-3 py-2 text-[11.5px] font-medium disabled:opacity-40"
                        style={{ background: "rgba(248,113,113,0.15)", color: "#f87171" }}
                      >
                        Delete anyway
                      </button>
                      <button onClick={() => setConfirmDelete(null)} className="rounded-lg border border-white/10 px-3 py-2 text-[11.5px] text-[#8b8b8b]">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => remove(false)}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11.5px] font-medium disabled:opacity-40"
                    style={{ background: "rgba(248,113,113,0.12)", color: "#f87171" }}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove {p.fullName.split(" ")[0]}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "—";

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-white/[0.06] bg-[#111111] p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-[13px] font-semibold text-white" style={{ fontFamily: "var(--font-syne), sans-serif" }}>{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({ icon: Icon, label, value, mono }: any) {
  return (
    <div>
      <div className="mb-0.5 flex items-center gap-1 text-[10px] text-[#6b6b6b]">
        {Icon && <Icon className="h-3 w-3" />} {label}
      </div>
      <div className={`truncate text-[12.5px] text-[#e4e4e4] ${mono ? "tabular-nums" : ""}`}>{value || "—"}</div>
    </div>
  );
}

const Row = ({ k, v, mono }: { k: string; v?: string; mono?: boolean }) => (
  <div className="flex justify-between gap-3">
    <span className="text-[#6b6b6b]">{k}</span>
    <span className={`text-[#e4e4e4] ${mono ? "tabular-nums" : ""}`}>{v || "—"}</span>
  </div>
);

function Banner({ tone, children }: { tone: "error" | "ok"; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-3 text-[12.5px]"
      style={tone === "error"
        ? { background: "rgba(248,113,113,0.08)", borderColor: "rgba(248,113,113,0.2)", color: "#fca5a5" }
        : { background: "rgba(200,241,53,0.06)", borderColor: "rgba(200,241,53,0.2)", color: "#c8f135" }}>
      {children}
    </div>
  );
}
