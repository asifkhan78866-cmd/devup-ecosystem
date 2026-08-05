"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import {
  UserPlus, Upload, Check, X, Mail, FileText, ExternalLink,
  ChevronRight, ChevronLeft, AlertCircle, Users,
} from "lucide-react";
import { workspaceApi, ONBOARDING_DOC_LABELS, DOC_STATUS_TONE } from "@/lib/api/workspace";
import PersonDrawer from "@/components/workspace/PersonDrawer";

const input =
  "w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[#e4e4e4] text-xs outline-none focus:border-[#c8f135]/40";
const labelCls = "block text-[10px] text-[#6b6b6b] mb-1";

export default function OnboardingPage() {
  const { code } = useParams<{ code: string }>();
  const [queue, setQueue] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [modal, setModal] = useState<null | "hire" | "bulk">(null);
  const [drawer, setDrawer] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    if (!code) return;
    try {
      const q = await workspaceApi.onboardingQueue(code);
      setQueue(q);
      // Keep a person selected so the detail pane is never empty on first load.
      setSelected((cur) => cur ?? q[0]?.id ?? null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [code]);

  const loadChecklist = useCallback(async () => {
    if (!code || !selected) { setChecklist(null); return; }
    try {
      setChecklist(await workspaceApi.onboardingChecklist(code, selected));
    } catch (e: any) {
      setError(e.message);
    }
  }, [code, selected]);

  useEffect(() => { loadQueue(); }, [loadQueue]);
  useEffect(() => { loadChecklist(); }, [loadChecklist]);

  const act = async (fn: () => Promise<unknown>, msg: string) => {
    setBusy(true); setError(null); setNotice(null);
    try {
      await fn();
      setNotice(msg);
      await Promise.all([loadQueue(), loadChecklist()]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-5 py-7 md:px-9 md:py-9 max-w-[1440px] mx-auto">
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-white text-[26px] md:text-[30px] font-extrabold tracking-[-0.02em]" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
            Onboarding
          </h1>
          <p className="text-[#8b8b8b] text-[13.5px] mt-1.5">
            Collect and verify documents from everyone joining your team.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setModal("bulk")} className="px-3 py-2 rounded-lg text-xs border border-white/10 bg-white/5 text-[#e4e4e4] hover:bg-white/10 transition">
            Bulk import
          </button>
          <button
            onClick={() => setModal("hire")}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
            style={{ background: "rgba(200,241,53,0.12)", color: "#c8f135" }}
          >
            <UserPlus className="w-3.5 h-3.5" /> Add team member
          </button>
        </div>
      </header>

      {error && <Banner tone="error">{error}</Banner>}
      {notice && <Banner tone="ok">{notice}</Banner>}

      {loading ? (
        <p className="text-[#6b6b6b] text-sm">Loading…</p>
      ) : queue.length === 0 ? (
        <div className="p-10 rounded-2xl border border-dashed border-white/[0.09] text-center">
          <Users className="w-8 h-8 text-[#3d3d3d] mx-auto mb-3" />
          <p className="text-[#6b6b6b] text-sm mb-1">Everyone is fully onboarded.</p>
          <p className="text-[#4d4d4d] text-xs">
            Add someone hired outside the pipeline, or import your existing team.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 items-start">
          {/* People */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#111111] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 text-[11px] uppercase tracking-wider text-[#6b6b6b]">
              {queue.length} pending
            </div>
            <div className="max-h-[520px] overflow-y-auto">
              {queue.map((p) => {
                const active = p.id === selected;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelected(p.id)}
                    className="w-full text-left px-4 py-3 border-b border-white/5 last:border-0 transition"
                    style={{ background: active ? "rgba(200,241,53,0.06)" : "transparent" }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] text-[#e4e4e4] truncate">{p.fullName}</span>
                      {p.isDirectHire && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded shrink-0" style={{ background: "rgba(143,182,255,0.12)", color: "#8fb6ff" }}>
                          DIRECT
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#6b6b6b] tabular-nums mt-0.5">{p.code}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${p.progress.percent}%`, background: p.progress.complete ? "#c8f135" : "#facc15" }} />
                      </div>
                      <span className="text-[10px] text-[#8b8b8b] tabular-nums">{p.progress.percent}%</span>
                    </div>
                    {p.progress.awaitingReview > 0 && (
                      <div className="mt-1.5 text-[10px]" style={{ color: "#facc15" }}>
                        {p.progress.awaitingReview} awaiting review
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Checklist */}
          {checklist ? (
            <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                <div>
                  <button
                    onClick={() => setDrawer(checklist.person.id)}
                    className="text-left text-white text-[17px] font-semibold hover:text-[#c8f135] transition"
                    style={{ fontFamily: "var(--font-syne), sans-serif" }}
                  >
                    {checklist.person.fullName} &rsaquo;
                  </button>
                  <p className="text-[11.5px] text-[#8b8b8b] mt-0.5">
                    {checklist.person.code} · {checklist.person.kind === "INTERN" ? "Intern" : "Employee"} · {checklist.person.email}
                  </p>
                </div>
                <button
                  onClick={() => act(() => workspaceApi.requestOnboardingDocs(code, checklist.person.id), "Reminder sent")}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] border border-white/10 bg-white/5 text-[#e4e4e4] hover:bg-white/10 transition disabled:opacity-40"
                >
                  <Mail className="w-3.5 h-3.5" /> Request documents
                </button>
              </div>

              <div className="mb-5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11.5px] text-[#8b8b8b]">
                    {checklist.progress.requiredApproved} of {checklist.progress.requiredTotal} required documents approved
                  </span>
                  <span className="text-[12px] tabular-nums" style={{ color: checklist.progress.complete ? "#c8f135" : "#facc15" }}>
                    {checklist.progress.percent}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${checklist.progress.percent}%`, background: checklist.progress.complete ? "#c8f135" : "#facc15" }} />
                </div>
              </div>

              <div className="divide-y divide-white/5">
                {checklist.items.map((item: any) => (
                  <DocRow
                    key={item.docType}
                    item={item}
                    code={code}
                    personId={checklist.person.id}
                    busy={busy}
                    onAct={act}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-10 text-center">
              <p className="text-[#6b6b6b] text-sm">Select someone to review their documents.</p>
            </div>
          )}
        </div>
      )}

      {drawer && (
        <PersonDrawer
          code={code}
          personId={drawer}
          onClose={() => setDrawer(null)}
          onChanged={() => { loadQueue(); loadChecklist(); }}
        />
      )}

      {modal === "hire" && (
        <DirectHireModal
          busy={busy}
          onClose={() => setModal(null)}
          onSubmit={(body: Record<string, unknown>) =>
            act(async () => {
              await workspaceApi.directHire(code, body);
              setModal(null);
            }, "Team member added")
          }
        />
      )}
      {modal === "bulk" && (
        <BulkImportModal
          busy={busy}
          onClose={() => setModal(null)}
          onSubmit={(body: Record<string, unknown>) =>
            act(async () => {
              const res: any = await workspaceApi.bulkImport(code, body);
              setModal(null);
              setNotice(`${res.created.length} added, ${res.failed.length} skipped`);
            }, "Import finished")
          }
        />
      )}
    </div>
  );
}

function DocRow({ item, code, personId, busy, onAct }: any) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const tone = DOC_STATUS_TONE[item.status] ?? DOC_STATUS_TONE.PENDING;

  return (
    <div className="py-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-[#e4e4e4]">{item.label ?? ONBOARDING_DOC_LABELS[item.docType]}</span>
            {!item.isRequired && <span className="text-[9px] text-[#5a5a5a]">optional</span>}
          </div>
          {item.rejectReason && (
            <p className="text-[11px] mt-1" style={{ color: "#f87171" }}>{item.rejectReason}</p>
          )}
          {item.fileName && (
            <a href={item.fileUrl} target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-1 text-[11px] text-[#8b8b8b] hover:text-white transition mt-1">
              <FileText className="w-3 h-3" /> {item.fileName} <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] px-2 py-1 rounded whitespace-nowrap" style={{ background: tone.bg, color: tone.fg }}>
            {tone.label}
          </span>

          {item.status === "SUBMITTED" && (
            <>
              <button
                onClick={() => onAct(() => workspaceApi.reviewOnboardingDoc(code, item.documentId, true), "Approved")}
                disabled={busy}
                className="p-1.5 rounded-lg transition disabled:opacity-40"
                style={{ background: "rgba(200,241,53,0.1)", color: "#c8f135" }}
                title="Approve"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setRejecting((r) => !r)}
                disabled={busy}
                className="p-1.5 rounded-lg transition disabled:opacity-40"
                style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}
                title="Reject"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {/* HR can upload on someone's behalf — common when documents arrive over email. */}
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onAct(() => workspaceApi.uploadOnboardingDoc(code, personId, item.docType, f), "Uploaded");
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="p-1.5 rounded-lg border border-white/10 text-[#8b8b8b] hover:text-white transition disabled:opacity-40"
            title="Upload on their behalf"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {rejecting && (
        <div className="mt-2.5 flex gap-2">
          <input
            className={input}
            placeholder="What needs fixing? They will see this."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <button
            disabled={busy || reason.trim().length < 3}
            onClick={() =>
              onAct(async () => {
                await workspaceApi.reviewOnboardingDoc(code, item.documentId, false, reason);
                setRejecting(false);
                setReason("");
              }, "Rejected — they have been notified")
            }
            className="px-3 rounded-lg text-[11px] whitespace-nowrap disabled:opacity-40"
            style={{ background: "rgba(248,113,113,0.12)", color: "#f87171" }}
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}

function Banner({ tone, children }: { tone: "error" | "ok"; children: React.ReactNode }) {
  return (
    <div className="mb-4 p-3 rounded-lg border text-sm"
      style={tone === "error"
        ? { background: "rgba(248,113,113,0.08)", borderColor: "rgba(248,113,113,0.2)", color: "#fca5a5" }
        : { background: "rgba(200,241,53,0.06)", borderColor: "rgba(200,241,53,0.2)", color: "#c8f135" }}>
      {children}
    </div>
  );
}

function Modal({ title, subtitle, children, onClose }: any) {
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 overflow-y-auto bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg my-8 rounded-2xl bg-[#141414] border border-white/10 p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-white text-[15px] font-semibold" style={{ fontFamily: "var(--font-syne), sans-serif" }}>{title}</h3>
            {subtitle && <p className="text-[11px] text-[#6b6b6b] mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-[#6b6b6b] hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function DirectHireModal({ onClose, onSubmit, busy }: any) {
  const [f, setF] = useState<any>({
    fullName: "", email: "", phone: "", designation: "", department: "",
    employmentType: "FULL_TIME", joinedAt: new Date().toISOString().slice(0, 10),
    endDate: "", college: "", ctc: "", stipend: "", requestDocuments: true,
    issueOfferLetter: true, workMode: "OFFICE", location: "",
  });
  const set = (k: string, v: any) => setF({ ...f, [k]: v });
  const isIntern = f.employmentType === "INTERNSHIP";
  const valid = f.fullName.trim().length >= 2 && /\S+@\S+\.\S+/.test(f.email) && f.designation.trim().length >= 2;

  return (
    <Modal title="Add team member" subtitle="For people hired outside the application pipeline" onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div><label className={labelCls}>Full name *</label><input className={input} value={f.fullName} onChange={(e) => set("fullName", e.target.value)} /></div>
          <div><label className={labelCls}>Email *</label><input className={input} value={f.email} onChange={(e) => set("email", e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className={labelCls}>Designation *</label><input className={input} value={f.designation} onChange={(e) => set("designation", e.target.value)} /></div>
          <div><label className={labelCls}>Department</label><input className={input} value={f.department} onChange={(e) => set("department", e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Type</label>
            <select className={input} value={f.employmentType} onChange={(e) => set("employmentType", e.target.value)}>
              {["FULL_TIME", "INTERNSHIP", "PART_TIME", "CONTRACT"].map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          <div><label className={labelCls}>Phone</label><input className={input} value={f.phone} onChange={(e) => set("phone", e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className={labelCls}>{isIntern ? "Start date" : "Joining date"} *</label><input type="date" className={input} value={f.joinedAt} onChange={(e) => set("joinedAt", e.target.value)} /></div>
          {isIntern
            ? <div><label className={labelCls}>End date</label><input type="date" className={input} value={f.endDate} onChange={(e) => set("endDate", e.target.value)} /></div>
            : <div><label className={labelCls}>Annual CTC</label><input className={input} value={f.ctc} onChange={(e) => set("ctc", e.target.value)} /></div>}
        </div>
        {isIntern && (
          <div className="grid grid-cols-2 gap-2">
            <div><label className={labelCls}>College</label><input className={input} value={f.college} onChange={(e) => set("college", e.target.value)} /></div>
            <div><label className={labelCls}>Stipend</label><input className={input} value={f.stipend} onChange={(e) => set("stipend", e.target.value)} /></div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Work mode</label>
            <select className={input} value={f.workMode} onChange={(e) => set("workMode", e.target.value)}>
              {["OFFICE", "HYBRID", "REMOTE"].map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div><label className={labelCls}>Location</label><input className={input} placeholder="Hyderabad" value={f.location} onChange={(e) => set("location", e.target.value)} /></div>
        </div>

        <div className="space-y-2 rounded-lg border border-white/[0.08] bg-white/[0.02] p-3">
          <label className="flex items-start gap-2 text-[11px] text-[#a1a1a1] cursor-pointer">
            <input type="checkbox" checked={f.issueOfferLetter} onChange={(e) => set("issueOfferLetter", e.target.checked)} className="accent-[#c8f135] mt-0.5" />
            <span>
              <span className="text-[#e4e4e4]">Issue a numbered offer letter</span>
              <span className="block text-[10px] text-[#6b6b6b]">
                Generates the PDF on your branding and emails it as an attachment.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-2 text-[11px] text-[#a1a1a1] cursor-pointer">
            <input type="checkbox" checked={f.requestDocuments} onChange={(e) => set("requestDocuments", e.target.checked)} className="accent-[#c8f135] mt-0.5" />
            <span>
              <span className="text-[#e4e4e4]">Email the document checklist</span>
              <span className="block text-[10px] text-[#6b6b6b]">
                Aadhaar, photo, marksheet and the rest, so they can start uploading.
              </span>
            </span>
          </label>
        </div>

        <p className="text-[10px] text-[#6b6b6b]">
          They get a permanent {isIntern ? "intern" : "employee"} ID and workspace access, same as a pipeline hire.
        </p>

        <button
          disabled={busy || !valid}
          onClick={() => onSubmit({ ...f, location: f.location || undefined, endDate: f.endDate || undefined, ctc: f.ctc || undefined, stipend: f.stipend || undefined, college: f.college || undefined, phone: f.phone || undefined, department: f.department || undefined })}
          className="w-full py-2.5 rounded-lg text-xs font-medium disabled:opacity-40"
          style={{ background: "rgba(200,241,53,0.15)", color: "#c8f135" }}
        >
          {busy ? "Adding…" : "Add to team"}
        </button>
      </div>
    </Modal>
  );
}

function BulkImportModal({ onClose, onSubmit, busy }: any) {
  const [text, setText] = useState("");
  const [requestDocuments, setRequestDocuments] = useState(true);

  /** One person per line: name, email, designation, type, joining date. */
  const rows = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [fullName, email, designation, employmentType, joinedAt] = line.split(",").map((c) => c.trim());
      return {
        fullName, email, designation: designation || "Team Member",
        employmentType: (employmentType || "FULL_TIME").toUpperCase().replace(/[ -]/g, "_"),
        joinedAt: joinedAt || new Date().toISOString().slice(0, 10),
      };
    })
    .filter((r) => r.fullName && /\S+@\S+\.\S+/.test(r.email ?? ""));

  return (
    <Modal title="Bulk import team" subtitle="Add everyone hired before this system existed" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className={labelCls}>One person per line</label>
          <textarea
            rows={8}
            className={`${input} font-mono`}
            placeholder={"Name, email, designation, FULL_TIME, 2026-01-15\nAsha Rao, asha@acme.com, Backend Engineer, FULL_TIME, 2025-11-01\nRahul K, rahul@acme.com, Design Intern, INTERNSHIP, 2026-02-01"}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <p className="mt-1 text-[10px] text-[#6b6b6b]">
            Order: name, email, designation, type, joining date. Only name and email are required.
          </p>
        </div>

        {rows.length > 0 && (
          <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-3">
            <p className="text-[11px] text-[#c8f135] mb-1.5">{rows.length} valid row{rows.length === 1 ? "" : "s"} detected</p>
            <div className="max-h-24 overflow-y-auto space-y-0.5">
              {rows.slice(0, 6).map((r, i) => (
                <div key={i} className="text-[10px] text-[#8b8b8b] truncate">
                  {r.fullName} · {r.email} · {r.designation}
                </div>
              ))}
              {rows.length > 6 && <div className="text-[10px] text-[#5a5a5a]">+{rows.length - 6} more</div>}
            </div>
          </div>
        )}

        <label className="flex items-center gap-2 text-[11px] text-[#a1a1a1] cursor-pointer">
          <input type="checkbox" checked={requestDocuments} onChange={(e) => setRequestDocuments(e.target.checked)} className="accent-[#c8f135]" />
          Email everyone their document checklist
        </label>

        <p className="text-[10px] text-[#6b6b6b]">
          Rows are processed independently — a duplicate or bad email is skipped and reported, not fatal.
        </p>

        <button
          disabled={busy || rows.length === 0}
          onClick={() => onSubmit({ rows, requestDocuments })}
          className="w-full py-2.5 rounded-lg text-xs font-medium disabled:opacity-40"
          style={{ background: "rgba(200,241,53,0.15)", color: "#c8f135" }}
        >
          {busy ? "Importing…" : `Import ${rows.length} ${rows.length === 1 ? "person" : "people"}`}
        </button>
      </div>
    </Modal>
  );
}
