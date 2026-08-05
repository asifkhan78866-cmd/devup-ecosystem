"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { FileText, ExternalLink, AlertTriangle } from "lucide-react";
import { workspaceApi } from "@/lib/api/workspace";

const TONE: Record<string, { bg: string; fg: string }> = {
  SENT: { bg: "rgba(250,204,21,0.1)", fg: "#facc15" },
  ACCEPTED: { bg: "rgba(200,241,53,0.1)", fg: "#c8f135" },
  DECLINED: { bg: "rgba(248,113,113,0.1)", fg: "#f87171" },
  REVOKED: { bg: "rgba(248,113,113,0.1)", fg: "#f87171" },
  EXPIRED: { bg: "rgba(255,255,255,0.06)", fg: "#8b8b8b" },
  DRAFT: { bg: "rgba(255,255,255,0.06)", fg: "#8b8b8b" },
};

export default function OffersPage() {
  const { code } = useParams<{ code: string }>();
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!code) return;
    workspaceApi
      .documents(code, "OFFER_LETTER")
      .then(setDocs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [code]);

  useEffect(() => { load(); }, [load]);

  /** Rebuild a missing file without reissuing — the number stays the same. */
  const regenerate = async (docId: string) => {
    setBusy(docId);
    setError(null);
    try {
      await workspaceApi.regenerateDocument(code, docId);
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="px-5 py-7 md:px-9 md:py-9 max-w-[1200px] mx-auto">
      <header className="mb-6">
        <h1 className="text-white text-[26px] md:text-[30px] font-extrabold tracking-[-0.02em]" style={{ fontFamily: "var(--font-syne), sans-serif" }}>Offers</h1>
        <p className="text-[#8b8b8b] text-[13.5px] mt-1.5">
          Every offer letter issued by this startup. Numbers are sequential per financial year and never reused.
        </p>
      </header>

      {error && <div className="mb-4 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-300 text-sm">{error}</div>}

      {loading ? (
        <p className="text-[#6b6b6b] text-sm">Loading…</p>
      ) : docs.length === 0 ? (
        <div className="p-10 rounded-2xl border border-dashed border-white/[0.09] text-center">
          <FileText className="w-8 h-8 text-[#3d3d3d] mx-auto mb-3" />
          <p className="text-[#6b6b6b] text-sm">
            No offers issued yet. Generate one from a candidate at the Selected stage.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.06] overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03]">
              <tr>
                {["Offer No", "Candidate", "Designation", "Issued", "Status", ""].map((h) => (
                  <th key={h} className="text-left text-[10px] font-semibold text-[#6b6b6b] uppercase tracking-wider px-4 py-3.5 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {docs.map((d) => {
                const p = d.payload ?? {};
                const revoked = Boolean(d.revokedAt);
                const tone = revoked ? TONE.REVOKED : TONE.SENT;
                return (
                  <tr key={d.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-4 py-3 text-[11px] tabular-nums text-[#c8f135] whitespace-nowrap">{d.documentNo}</td>
                    <td className="px-4 py-3 text-xs text-[#e4e4e4]">{p.candidateName ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-[#a1a1a1]">{p.designation ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-[#6b6b6b] whitespace-nowrap">
                      {new Date(d.issuedAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] px-2 py-1 rounded" style={{ background: tone.bg, color: tone.fg }}>
                        {revoked ? "REVOKED" : "ISSUED"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {d.pdfUrl ? (
                        <a
                          href={d.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-[#8b8b8b] hover:text-white transition"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        /* Issued but fileless — the candidate got an email with no
                           attachment, so say so rather than showing an empty cell. */
                        <button
                          disabled={busy === d.id}
                          onClick={() => regenerate(d.id)}
                          title="This letter was issued without a PDF. Generate it now."
                          className="inline-flex items-center gap-1 text-[11px] disabled:opacity-40"
                          style={{ color: "#facc15" }}
                        >
                          <AlertTriangle className="w-3 h-3" />
                          {busy === d.id ? "Generating…" : "No file — generate"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
