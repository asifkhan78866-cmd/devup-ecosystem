"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { FileText, ExternalLink, Plus, X, AlertCircle } from "lucide-react";
import { workspaceApi } from "@/lib/api/workspace";

const input = "w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[#e4e4e4] text-xs outline-none focus:border-[#c8f135]/40";
const labelCls = "block text-[10px] text-[#6b6b6b] mb-1";

const DOC_TYPES = [
  { value: "CERTIFICATE", label: "Completion Certificate", subject: "both" },
  { value: "LOR", label: "Letter of Recommendation", subject: "both" },
  { value: "EXPERIENCE_LETTER", label: "Experience Letter", subject: "employee" },
  { value: "RELIEVING", label: "Relieving Letter", subject: "employee" },
  { value: "ID_CARD", label: "ID Card", subject: "both" },
] as const;

export default function DocumentsPage() {
  const { code } = useParams<{ code: string }>();
  const [docs, setDocs] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [interns, setInterns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!code) return;
    try {
      const [d, e, i] = await Promise.all([
        workspaceApi.documents(code, filter || undefined),
        workspaceApi.employees(code).catch(() => []),
        workspaceApi.interns(code).catch(() => []),
      ]);
      setDocs(d);
      setEmployees(e);
      setInterns(i);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [code, filter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="px-5 py-7 md:px-9 md:py-9 max-w-[1200px] mx-auto">
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-white text-[26px] md:text-[30px] font-extrabold tracking-[-0.02em]" style={{ fontFamily: "var(--font-syne), sans-serif" }}>Documents</h1>
          <p className="text-[#8b8b8b] text-[13.5px] mt-1.5">
            Certificates, LORs and letters. Every document is numbered and carries your branding.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          disabled={employees.length + interns.length === 0}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium disabled:opacity-40"
          style={{ background: "rgba(200,241,53,0.12)", color: "#c8f135" }}
        >
          <Plus className="w-3.5 h-3.5" /> Issue document
        </button>
      </header>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {[{ value: "", label: "All" }, { value: "OFFER_LETTER", label: "Offer Letters" }, ...DOC_TYPES].map((t) => (
          <button
            key={t.value}
            onClick={() => setFilter(t.value)}
            className="px-3 py-1.5 rounded-full text-[11px] whitespace-nowrap border transition"
            style={{
              background: filter === t.value ? "rgba(200,241,53,0.1)" : "transparent",
              borderColor: filter === t.value ? "rgba(200,241,53,0.3)" : "rgba(255,255,255,0.08)",
              color: filter === t.value ? "#c8f135" : "#6b6b6b",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className="mb-4 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-300 text-sm">{error}</div>}

      {loading ? (
        <p className="text-[#6b6b6b] text-sm">Loading…</p>
      ) : docs.length === 0 ? (
        <div className="p-10 rounded-2xl border border-dashed border-white/[0.09] text-center">
          <FileText className="w-8 h-8 text-[#3d3d3d] mx-auto mb-3" />
          <p className="text-[#6b6b6b] text-sm">
            {employees.length + interns.length === 0
              ? "Onboard someone before issuing documents."
              : "No documents issued yet."}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.06] overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03]">
              <tr>
                {["Document No", "Type", "Issued to", "Date", "Status", ""].map((h) => (
                  <th key={h} className="text-left text-[10px] font-semibold text-[#6b6b6b] uppercase tracking-wider px-4 py-3.5 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {docs.map((d) => (
                <tr key={d.id} className="hover:bg-white/[0.02] transition">
                  <td className="px-4 py-3 text-[11px] tabular-nums text-[#c8f135] whitespace-nowrap">{d.documentNo}</td>
                  <td className="px-4 py-3 text-xs text-[#a1a1a1] whitespace-nowrap">{String(d.docType).replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 text-xs text-[#e4e4e4]">{d.payload?.fullName ?? d.payload?.candidateName ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-[#6b6b6b] whitespace-nowrap">{new Date(d.issuedAt).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-3">
                    <span
                      className="text-[10px] px-2 py-1 rounded"
                      style={
                        d.revokedAt
                          ? { background: "rgba(248,113,113,0.1)", color: "#f87171" }
                          : { background: "rgba(200,241,53,0.1)", color: "#c8f135" }
                      }
                    >
                      {d.revokedAt ? "REVOKED" : "ISSUED"}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {d.pdfUrl && (
                      <a href={d.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-[#8b8b8b] hover:text-white transition">
                        View <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <IssueForm
          employees={employees}
          interns={interns}
          busy={busy}
          onClose={() => setShowForm(false)}
          onSubmit={async (body: Record<string, unknown>) => {
            setBusy(true);
            setError(null);
            try {
              await workspaceApi.issueDocument(code, body);
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

function IssueForm({ employees, interns, onClose, onSubmit, busy }: any) {
  const [docType, setDocType] = useState<string>("CERTIFICATE");
  const [subjectId, setSubjectId] = useState("");
  const [body, setBody] = useState("");
  const [remarks, setRemarks] = useState("");

  const meta = DOC_TYPES.find((d) => d.value === docType)!;
  // Experience and relieving letters only make sense for employees.
  const pool = meta.subject === "employee"
    ? employees.map((e: any) => ({ ...e, kind: "employee" }))
    : [
        ...employees.map((e: any) => ({ ...e, kind: "employee" })),
        ...interns.map((i: any) => ({ ...i, kind: "intern" })),
      ];

  const selected = pool.find((p: any) => p.id === subjectId);
  const needsExit = (docType === "EXPERIENCE_LETTER" || docType === "RELIEVING") && selected && !selected.exitedAt;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 overflow-y-auto bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md my-8 rounded-xl bg-[#141414] border border-white/10 p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-sm font-semibold" style={{ fontFamily: "var(--font-syne), sans-serif" }}>Issue document</h3>
          <button onClick={onClose} className="text-[#6b6b6b] hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className={labelCls}>Document type</label>
            <select
              className={input}
              value={docType}
              onChange={(e) => {
                setDocType(e.target.value);
                setSubjectId("");
              }}
            >
              {DOC_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>Issue to</label>
            <select className={input} value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">Select a person…</option>
              {pool.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} — {p.employeeCode ?? p.internCode}
                </option>
              ))}
            </select>
            {pool.length === 0 && (
              <p className="text-[10px] text-[#facc15] mt-1">No eligible people for this document type.</p>
            )}
          </div>

          {needsExit && (
            <div className="p-2.5 rounded-lg border flex gap-2" style={{ borderColor: "rgba(250,204,21,0.25)", background: "rgba(250,204,21,0.07)" }}>
              <AlertCircle className="w-3.5 h-3.5 text-[#facc15] shrink-0 mt-0.5" />
              <p className="text-[10px] text-[#facc15]">
                This person has no exit date recorded. Set it on the Employees page before issuing this letter.
              </p>
            </div>
          )}

          {docType === "LOR" && (
            <div>
              <label className={labelCls}>Recommendation body</label>
              <textarea rows={4} className={input} placeholder="Leave blank to use the standard wording." value={body} onChange={(e) => setBody(e.target.value)} />
            </div>
          )}

          {docType === "CERTIFICATE" && (
            <div>
              <label className={labelCls}>Remarks (optional)</label>
              <input className={input} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            </div>
          )}

          <button
            disabled={busy || !subjectId || needsExit}
            onClick={() =>
              onSubmit({
                docType,
                [selected?.kind === "intern" ? "internId" : "employeeId"]: subjectId,
                extra: {
                  ...(body ? { body } : {}),
                  ...(remarks ? { remarks } : {}),
                },
              })
            }
            className="w-full py-2 rounded-lg text-xs font-medium disabled:opacity-40"
            style={{ background: "rgba(200,241,53,0.15)", color: "#c8f135" }}
          >
            Issue & notify
          </button>
        </div>
      </div>
    </div>
  );
}
