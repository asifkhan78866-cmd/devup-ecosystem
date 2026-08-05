"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { AlertTriangle, IndianRupee, Lock, Check } from "lucide-react";
import { financeApi } from "@/lib/api/workspace";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const rupees = (n: number) => "₹" + n.toLocaleString("en-IN");

export default function FinancePage() {
  const { code } = useParams<{ code: string }>();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [sheet, setSheet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!code) return;
    setLoading(true);
    try {
      setSheet(await financeApi.stipends(code, year, month));
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [code, year, month]);

  useEffect(() => { load(); }, [load]);

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key);
    setError(null);
    try { await fn(); await load(); }
    catch (e: any) { setError(e.message); }
    finally { setBusy(null); }
  };

  const prev = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); } else setMonth(month - 1);
  };
  const next = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); } else setMonth(month + 1);
  };

  return (
    <div className="px-5 py-7 md:px-9 md:py-9 max-w-[1240px] mx-auto">
      <header className="mb-6">
        <h1 className="text-white text-[26px] md:text-[30px] font-extrabold tracking-[-0.02em]" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
          Stipends
        </h1>
        <p className="text-[#8b8b8b] text-[13.5px] mt-1.5">
          What each intern is owed this month, worked out from their attendance. Visible to founders only.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-1 rounded-lg border border-white/[0.08] overflow-hidden">
          <button onClick={prev} className="px-3 py-2 text-[#8b8b8b] hover:text-white hover:bg-white/5 transition text-sm">←</button>
          <span className="px-3 py-2 text-white text-sm font-medium min-w-[130px] text-center">
            {MONTHS[month - 1]} {year}
          </span>
          <button onClick={next} className="px-3 py-2 text-[#8b8b8b] hover:text-white hover:bg-white/5 transition text-sm">→</button>
        </div>

        {sheet && sheet.rows.some((r: any) => r.status === "DRAFT" && !r.problem) && (
          <button
            disabled={busy === "month"}
            onClick={() => run("month", () => financeApi.approveMonth(code, year, month))}
            className="px-4 py-2 rounded-lg text-xs font-medium disabled:opacity-40"
            style={{ background: "rgba(200,241,53,0.15)", color: "#c8f135" }}
          >
            {busy === "month" ? "Approving…" : "Approve all"}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-300 text-sm">{error}</div>
      )}

      {loading ? (
        <p className="text-[#6b6b6b] text-sm">Loading…</p>
      ) : !sheet || sheet.rows.length === 0 ? (
        <div className="p-10 rounded-2xl border border-dashed border-white/[0.09] text-center">
          <p className="text-[#6b6b6b] text-sm">No interns were engaged in {MONTHS[month - 1]} {year}.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Stat label="Interns" value={String(sheet.totals.interns)} />
            <Stat label="Total payable" value={rupees(sheet.totals.totalNet)} accent />
            <Stat label="Approved" value={String(sheet.totals.approved)} />
            <Stat label="Paid" value={String(sheet.totals.paid)} />
          </div>

          {sheet.totals.needsAttention > 0 && (
            <div className="mb-5 p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.07] flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[12.5px] text-amber-200/90">
                {sheet.totals.needsAttention} intern{sheet.totals.needsAttention === 1 ? "" : "s"} cannot be
                calculated and {sheet.totals.needsAttention === 1 ? "is" : "are"} excluded from the total.
                Set a stipend amount below to include {sheet.totals.needsAttention === 1 ? "them" : "them"}.
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-white/[0.06] overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-white/[0.03]">
                <tr>
                  {["Intern", "Stipend", "Days", "Present", "Late", "Half", "Leave", "Absent", "Payable", "Amount", ""].map((h) => (
                    <th key={h} className="text-left text-[10px] font-semibold text-[#6b6b6b] uppercase tracking-wider px-3.5 py-3.5 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sheet.rows.map((r: any) => (
                  <Row key={r.internId} r={r} code={code} busy={busy} run={run} year={year} month={month} />
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-[11px] text-[#4d4d4d] mt-4">
            Rate is the monthly stipend divided by that month&apos;s working days, so full attendance always
            pays the agreed amount. Late arrivals pay in full; half days pay half; the first leave each month
            is paid. Approved figures are frozen — a later attendance correction will not change them.
          </p>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="p-4 rounded-xl bg-[#111111] border border-white/5">
      <div className="text-[10px] text-[#6b6b6b] uppercase tracking-wider mb-1.5">{label}</div>
      <div className="text-xl font-bold tabular-nums" style={{ color: accent ? "#c8f135" : "#ffffff" }}>
        {value}
      </div>
    </div>
  );
}

function Row({ r, code, busy, run, year, month }: any) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState("");

  const locked = r.status === "PAID";
  const approved = r.status === "APPROVED";

  return (
    <tr className="hover:bg-white/[0.02] transition">
      <td className="px-3.5 py-3 whitespace-nowrap">
        <div className="text-[#e4e4e4] text-xs font-medium">{r.fullName}</div>
        <div className="text-[10px] text-[#4d4d4d] tabular-nums">{r.internCode}</div>
      </td>

      <td className="px-3.5 py-3 whitespace-nowrap">
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
              placeholder="5000"
              className="w-20 bg-[#0a0a0a] border border-white/10 rounded px-2 py-1 text-xs text-white tabular-nums"
            />
            <button
              onClick={() =>
                run(`set-${r.internId}`, async () => {
                  await financeApi.setStipend(code, r.internId, Number(amount));
                  setEditing(false);
                })
              }
              className="text-[10px] px-2 py-1 rounded"
              style={{ background: "rgba(200,241,53,0.15)", color: "#c8f135" }}
            >
              Save
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setEditing(true); setAmount(String(r.stipendAmount ?? "")); }}
            disabled={locked}
            className="text-xs tabular-nums text-left disabled:cursor-not-allowed"
            style={{ color: r.problem ? "#facc15" : "#a1a1a1" }}
          >
            {r.stipendAmount ? rupees(r.stipendAmount) : "Set amount"}
          </button>
        )}
      </td>

      <td className="px-3.5 py-3 text-xs text-[#8b8b8b] tabular-nums">{r.workingDays}</td>
      <td className="px-3.5 py-3 text-xs tabular-nums" style={{ color: "#c8f135" }}>{r.presentDays}</td>
      <td className="px-3.5 py-3 text-xs tabular-nums" style={{ color: "#facc15" }}>{r.lateDays}</td>
      <td className="px-3.5 py-3 text-xs tabular-nums" style={{ color: "#fb923c" }}>{r.halfDays}</td>
      <td className="px-3.5 py-3 text-xs tabular-nums" style={{ color: "#8fb6ff" }}>
        {r.leaveDays}
        {r.paidLeaveDays > 0 && <span className="text-[9px] text-[#4d4d4d]"> ({r.paidLeaveDays} paid)</span>}
      </td>
      <td className="px-3.5 py-3 text-xs tabular-nums" style={{ color: r.absentDays > 0 ? "#f87171" : "#4d4d4d" }}>
        {r.absentDays}
      </td>
      <td className="px-3.5 py-3 text-xs text-[#a1a1a1] tabular-nums">{(r.payableCentidays / 100).toFixed(1)}</td>

      <td className="px-3.5 py-3 whitespace-nowrap">
        {r.problem ? (
          <span className="text-[10px] text-amber-400" title={r.problem}>Cannot calculate</span>
        ) : (
          <div className="text-sm font-semibold tabular-nums text-white">{rupees(r.netAmount)}</div>
        )}
      </td>

      <td className="px-3.5 py-3 whitespace-nowrap text-right">
        {locked ? (
          <span className="inline-flex items-center gap-1 text-[10px] text-[#6b6b6b]">
            <Lock className="w-3 h-3" /> Paid
          </span>
        ) : approved ? (
          <button
            disabled={busy === `paid-${r.payoutId}`}
            onClick={() => run(`paid-${r.payoutId}`, () => financeApi.markPaid(code, r.payoutId, prompt("Payment reference (UPI / NEFT id)") ?? undefined))}
            className="text-[10px] px-2.5 py-1.5 rounded border border-white/10 text-[#a1a1a1] hover:text-white transition"
          >
            Mark paid
          </button>
        ) : r.problem ? null : (
          <button
            disabled={busy === `ap-${r.internId}`}
            onClick={() => run(`ap-${r.internId}`, () => financeApi.approve(code, r.internId, year, month))}
            className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded disabled:opacity-40"
            style={{ background: "rgba(200,241,53,0.12)", color: "#c8f135" }}
          >
            <Check className="w-3 h-3" /> Approve
          </button>
        )}
      </td>
    </tr>
  );
}
