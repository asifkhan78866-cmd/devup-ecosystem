"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Send, AlertTriangle, Check } from "lucide-react";
import { founderApi } from "@/lib/api/workspace";
import StartupLogo from "@/components/StartupLogo";

/**
 * Founder appointment letters across the whole ecosystem.
 *
 * Founders belong to individual startups, but issuing their letters is a DevUp
 * job — one screen for every startup rather than opening each workspace. The
 * admin ticks who receives one, so nothing goes out unseen.
 */
export default function FounderLettersPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const load = useCallback(async () => {
    try {
      setRows(await founderApi.list());
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const eligible = rows.filter((r) => r.canIssue);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setResult(null);
  };

  const send = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Issue and email a founder letter to ${selected.size} ${selected.size === 1 ? "person" : "people"}? Each letter is numbered and cannot be un-issued.`)) return;
    setBusy(true);
    setError(null);
    try {
      const r = await founderApi.issueMany([...selected]);
      setResult(r);
      setSelected(new Set());
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  // Group by startup so the page reads as "who is at which company".
  const byStartup = rows.reduce<Record<string, any[]>>((acc, r) => {
    const k = r.startup.name;
    (acc[k] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 md:p-9">
      <div className="max-w-[1100px] mx-auto">
        <Link href="/admin" className="text-[#c8f135] text-sm hover:underline mb-6 inline-flex items-center gap-1.5">
          <ArrowLeft className="w-3.5 h-3.5" /> Admin
        </Link>

        <header className="mb-6">
          <h1 className="text-white text-[26px] md:text-[30px] font-extrabold tracking-[-0.02em]" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
            Founder Letters
          </h1>
          <p className="text-[#8b8b8b] text-[13.5px] mt-1.5">
            Appointment letters for founders across every startup in the ecosystem.
            Each is numbered, signed by DevUp, and emailed with the PDF attached.
          </p>
        </header>

        {error && (
          <div className="mb-4 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-300 text-sm">{error}</div>
        )}

        {result && (
          <div className="mb-4 p-3.5 rounded-xl border" style={{ borderColor: "rgba(200,241,53,0.2)", background: "rgba(200,241,53,0.06)" }}>
            <p className="text-[13px] text-[#c8f135] font-medium">
              {result.issued} letter{result.issued === 1 ? "" : "s"} issued and emailed.
            </p>
            {result.skipped?.length > 0 && (
              <ul className="mt-2 space-y-0.5">
                {result.skipped.map((s: any, i: number) => (
                  <li key={i} className="text-[11.5px] text-[#facc15]">
                    {s.email} — {s.reason}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 mb-5">
          <button
            disabled={busy || selected.size === 0}
            onClick={send}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold disabled:opacity-40 transition"
            style={{ background: "#c8f135", color: "#0a0a0a" }}
          >
            <Send className="w-3.5 h-3.5" />
            {busy ? "Sending…" : selected.size ? `Send ${selected.size} letter${selected.size === 1 ? "" : "s"}` : "Send letters"}
          </button>

          {eligible.length > 0 && (
            <button
              onClick={() => setSelected(new Set(eligible.map((r) => r.id)))}
              className="text-[12px] text-[#8b8b8b] hover:text-white transition"
            >
              Select all {eligible.length} who can receive one
            </button>
          )}
          {selected.size > 0 && (
            <button onClick={() => setSelected(new Set())} className="text-[12px] text-[#6b6b6b] hover:text-white transition">
              Clear
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-[#6b6b6b] text-sm">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="p-10 rounded-2xl border border-dashed border-white/[0.09] text-center">
            <p className="text-[#6b6b6b] text-sm">No founders recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(byStartup).map(([name, members]) => (
              <div key={name} className="rounded-2xl border border-white/[0.06] overflow-hidden">
                <div className="flex items-center gap-2.5 px-4 py-3 bg-white/[0.03]">
                  <StartupLogo src={members[0].startup.logoUrl} name={name} className="w-6 h-6" rounded="rounded" />
                  <span className="text-[13px] text-white font-semibold">{name}</span>
                  <span className="text-[10px] text-[#6b6b6b] tabular-nums">{members[0].startup.code}</span>
                  {members[0].startup.type === "ECOSYSTEM_PARTNER" && (
                    <span className="text-[9.5px] px-1.5 py-0.5 rounded" style={{ background: "rgba(143,182,255,0.12)", color: "#8fb6ff" }}>
                      PARTNER
                    </span>
                  )}
                </div>

                <div className="divide-y divide-white/5">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                      <input
                        type="checkbox"
                        disabled={!m.canIssue}
                        checked={selected.has(m.id)}
                        onChange={() => toggle(m.id)}
                        className="w-4 h-4 shrink-0 accent-[#c8f135] disabled:opacity-25"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] text-[#e4e4e4] truncate">
                          {m.name ?? m.email.split("@")[0]}
                          <span className="text-[#6b6b6b] text-[11px]"> · {m.role.toLowerCase()}</span>
                        </div>
                        <div className="text-[11px] text-[#6b6b6b] truncate">{m.email}</div>
                      </div>

                      {m.letter ? (
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[10px] text-[#4d4d4d] tabular-nums hidden md:inline">{m.letter.documentNo}</span>
                          {m.letter.pdfUrl ? (
                            <a
                              href={m.letter.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px]"
                              style={{ color: "#c8f135" }}
                            >
                              <Download className="w-3 h-3" /> PDF
                            </a>
                          ) : (
                            <span className="text-[10.5px] text-[#facc15]">file pending</span>
                          )}
                          <Check className="w-3.5 h-3.5" style={{ color: "#c8f135" }} />
                        </div>
                      ) : m.blocked ? (
                        <span className="shrink-0 inline-flex items-center gap-1 text-[10.5px] text-[#facc15]" title={m.blocked}>
                          <AlertTriangle className="w-3 h-3" /> {m.blocked}
                        </span>
                      ) : (
                        <span className="shrink-0 text-[10.5px] text-[#6b6b6b]">no letter yet</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
