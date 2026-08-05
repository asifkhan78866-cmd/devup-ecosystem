"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Briefcase, CheckCircle2, XCircle, Clock, Award } from "lucide-react";
import { candidateApi, STAGE_LABEL } from "@/lib/api/workspace";
import StartupLogo from "@/components/StartupLogo";

export default function MyApplicationsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRows(await candidateApi.myApplications());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const respond = async (id: string, accept: boolean, withdrawing = false) => {
    if (withdrawing && !confirm(
      "Withdraw your acceptance? The startup will be told you are not joining, and this offer cannot be accepted again."
    )) return;

    setBusy(id);
    setError(null);
    try {
      await candidateApi.respondToOffer(
        id,
        accept,
        accept ? undefined : withdrawing ? "Withdrawn after accepting" : "Declined by candidate"
      );
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 md:p-8">
      <div className="max-w-[900px] mx-auto">
        <header className="mb-7">
          <h1 className="text-white text-2xl md:text-3xl font-bold" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
            My Applications
          </h1>
          <p className="text-[#6b6b6b] text-sm mt-1">Every role you have applied to across the ecosystem.</p>
        </header>

        {error && <div className="mb-4 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-300 text-sm">{error}</div>}

        {loading ? (
          <p className="text-[#6b6b6b] text-sm">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="p-10 rounded-xl border border-dashed border-white/10 text-center">
            <Briefcase className="w-8 h-8 text-[#3d3d3d] mx-auto mb-3" />
            <p className="text-[#6b6b6b] text-sm mb-4">You have not applied to any roles yet.</p>
            <Link href="/careers" className="text-[#c8f135] text-sm hover:underline">Browse open roles →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((a) => {
              const offerPending = a.offer?.status === "SENT";
              const closed = Boolean(a.outcome);
              // Only one accepted offer may be held across the ecosystem, so an
              // acceptance stays reversible until the joining actually happens.
              const canWithdraw = a.offer?.status === "ACCEPTED" && a.outcome !== "HIRED";
              return (
                <div key={a.id} className="p-5 rounded-xl bg-[#111111] border border-white/5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {a.job?.startup?.logoUrl && (
                          <StartupLogo src={a.job.startup.logoUrl} name={a.job.startup.name} rounded="rounded" className="w-5 h-5" />
                        )}
                        <span className="text-[11px] text-[#8b8b8b]">{a.job?.startup?.name}</span>
                      </div>
                      <h3 className="text-white text-sm font-semibold" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
                        {a.job?.title}
                      </h3>
                      <div className="text-[10px] text-[#4d4d4d] mt-1 tabular-nums">{a.applicationNo}</div>
                    </div>

                    <div className="text-right shrink-0">
                      {closed ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded bg-red-500/10 text-red-300">
                          <XCircle className="w-3 h-3" /> {a.outcome}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded" style={{ background: "rgba(200,241,53,0.1)", color: "#c8f135" }}>
                          <Clock className="w-3 h-3" /> {STAGE_LABEL[a.stage] ?? a.stage}
                        </span>
                      )}
                      <div className="text-[10px] text-[#6b6b6b] mt-1.5">
                        Applied {new Date(a.appliedAt).toLocaleDateString("en-IN")}
                      </div>
                    </div>
                  </div>

                  {offerPending && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <div className="flex items-start gap-2 mb-3">
                        <Award className="w-4 h-4 text-[#c8f135] shrink-0 mt-0.5" />
                        <div className="text-xs">
                          <p className="text-[#e4e4e4] font-medium">You have an offer</p>
                          <p className="text-[#6b6b6b] text-[11px] mt-0.5">
                            {a.offer.offerNo} · joining {new Date(a.offer.joiningDate).toLocaleDateString("en-IN")} ·
                            respond by {new Date(a.offer.expiresAt).toLocaleDateString("en-IN")}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          disabled={busy === a.id}
                          onClick={() => respond(a.id, true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium disabled:opacity-40"
                          style={{ background: "rgba(200,241,53,0.15)", color: "#c8f135" }}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Accept offer
                        </button>
                        <button
                          disabled={busy === a.id}
                          onClick={() => respond(a.id, false)}
                          className="px-3 py-1.5 rounded-lg text-[11px] border border-white/10 text-[#8b8b8b] hover:text-[#f87171] transition disabled:opacity-40"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  )}

                  {canWithdraw && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <p className="text-[11px] text-[#6b6b6b] mb-2">
                        Offer accepted · {a.offer.offerNo} · joining{" "}
                        {new Date(a.offer.joiningDate).toLocaleDateString("en-IN")}. You can hold
                        only one accepted offer at a time — withdraw to take another.
                      </p>
                      <button
                        disabled={busy === a.id}
                        onClick={() => respond(a.id, false, true)}
                        className="px-3 py-1.5 rounded-lg text-[11px] border border-white/10 text-[#8b8b8b] hover:text-[#f87171] transition disabled:opacity-40"
                      >
                        Withdraw acceptance
                      </button>
                    </div>
                  )}

                  {a.offer?.status === "ACCEPTED" && (
                    <div className="mt-3 pt-3 border-t border-white/5 text-[11px] text-[#c8f135] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Offer accepted — welcome aboard.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
