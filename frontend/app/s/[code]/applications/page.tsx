"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Search, LayoutGrid, List, RefreshCw } from "lucide-react";
import { workspaceApi, PIPELINE_STAGES, STAGE_LABEL } from "@/lib/api/workspace";

export default function ApplicationsPage() {
  const { code } = useParams<{ code: string }>();
  const [view, setView] = useState<"board" | "list">("board");
  const [board, setBoard] = useState<any>(null);
  const [list, setList] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobId, setJobId] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!code) return;
    setLoading(true);
    setError(null);
    try {
      if (view === "board") {
        setBoard(await workspaceApi.board(code, jobId || undefined));
      } else {
        const qs = new URLSearchParams();
        if (jobId) qs.set("jobId", jobId);
        if (q) qs.set("q", q);
        setList(await workspaceApi.applications(code, `?${qs.toString()}`));
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [code, view, jobId, q]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (code) workspaceApi.jobs(code).then(setJobs).catch(() => {});
  }, [code]);

  return (
    <div className="px-5 py-7 md:px-9 md:py-9 max-w-[1600px] mx-auto">
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-white text-[26px] md:text-[30px] font-extrabold tracking-[-0.02em]" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
            Applicants
          </h1>
          <p className="text-[#8b8b8b] text-[13.5px] mt-1.5">Track candidates through the hiring pipeline.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-[#8b8b8b] hover:text-white transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <div className="flex rounded-lg border border-white/10 overflow-hidden">
            <button
              onClick={() => setView("board")}
              className={`p-2 transition ${view === "board" ? "bg-[#c8f135]/10 text-[#c8f135]" : "text-[#6b6b6b] hover:text-white"}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-2 transition ${view === "list" ? "bg-[#c8f135]/10 text-[#c8f135]" : "text-[#6b6b6b] hover:text-white"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 mb-5">
        <select
          value={jobId}
          onChange={(e) => setJobId(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[#111111] border border-white/10 text-[#e4e4e4] text-sm outline-none focus:border-[#c8f135]/40"
        >
          <option value="">All roles</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>{j.title}</option>
          ))}
        </select>

        {view === "list" && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b6b6b]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Name, email or APP-number"
              className="pl-9 pr-3 py-2 w-[280px] rounded-lg bg-[#111111] border border-white/10 text-[#e4e4e4] text-sm outline-none focus:border-[#c8f135]/40"
            />
          </div>
        )}
      </div>

      {error && <div className="mb-4 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-300 text-sm">{error}</div>}

      {view === "board" ? (
        <BoardView code={code} board={board} loading={loading} />
      ) : (
        <ListView code={code} list={list} loading={loading} />
      )}
    </div>
  );
}

function BoardView({ code, board, loading }: { code: string; board: any; loading: boolean }) {
  if (loading && !board) return <p className="text-[#6b6b6b] text-sm">Loading pipeline…</p>;
  if (!board) return null;

  // Only show stages that hold candidates, plus the early ones, so the board
  // stays readable instead of showing twelve mostly-empty columns.
  const visible = PIPELINE_STAGES.filter(
    (s, i) => i < 4 || (board.counts?.[s] ?? 0) > 0
  );

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-max">
        {visible.map((stage) => {
          const items = (board.items ?? []).filter((a: any) => a.stage === stage);
          return (
            <div key={stage} className="w-[262px] shrink-0">
              <div className="flex items-center justify-between mb-2.5 px-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8b8b8b]">
                  {STAGE_LABEL[stage]}
                </span>
                <span className="text-[10px] text-[#6b6b6b] tabular-nums px-1.5 py-0.5 rounded bg-white/5">
                  {board.counts?.[stage] ?? 0}
                </span>
              </div>

              <div className="space-y-2 min-h-[80px] p-2 rounded-xl bg-white/[0.015] border border-white/5">
                {items.length === 0 ? (
                  <p className="text-[10px] text-[#4d4d4d] text-center py-5">Empty</p>
                ) : (
                  items.map((a: any) => (
                    <Link
                      key={a.id}
                      href={`/s/${code}/applications/${a.id}`}
                      className="block p-3 rounded-lg bg-[#141414] border border-white/5 hover:border-white/20 transition group"
                    >
                      <div className="text-[#e4e4e4] text-xs font-medium truncate group-hover:text-white transition">
                        {a.applicantName ?? "Unnamed"}
                      </div>
                      <div className="text-[10px] text-[#6b6b6b] truncate mt-0.5">{a.job?.title}</div>
                      {a.college && (
                        <div className="text-[10px] text-[#4d4d4d] truncate mt-1">{a.college}</div>
                      )}
                      <div className="text-[9px] text-[#4d4d4d] mt-1.5 tabular-nums">{a.applicationNo}</div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ListView({ code, list, loading }: { code: string; list: any; loading: boolean }) {
  if (loading && !list) return <p className="text-[#6b6b6b] text-sm">Loading…</p>;
  if (!list?.items?.length) return <p className="text-[#6b6b6b] text-sm">No applications found.</p>;

  return (
    <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03]">
            <tr>
              {["Candidate", "Role", "Stage", "College", "Applied", "Ref"].map((h) => (
                <th key={h} className="text-left text-[10px] font-semibold text-[#6b6b6b] uppercase tracking-wider px-4 py-3.5">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {list.items.map((a: any) => (
              <tr key={a.id} className="hover:bg-white/[0.02] transition">
                <td className="px-4 py-3">
                  <Link href={`/s/${code}/applications/${a.id}`} className="text-[#e4e4e4] hover:text-[#c8f135] transition text-xs font-medium">
                    {a.applicantName ?? "Unnamed"}
                  </Link>
                  <div className="text-[10px] text-[#6b6b6b]">{a.applicantEmail}</div>
                </td>
                <td className="px-4 py-3 text-[#a1a1a1] text-xs">{a.job?.title}</td>
                <td className="px-4 py-3">
                  <span className="text-[10px] px-2 py-1 rounded" style={{ background: "rgba(200,241,53,0.08)", color: "#c8f135" }}>
                    {STAGE_LABEL[a.stage] ?? a.stage}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#8b8b8b] text-xs">{a.college ?? "—"}</td>
                <td className="px-4 py-3 text-[#6b6b6b] text-xs">
                  {new Date(a.appliedAt).toLocaleDateString("en-IN")}
                </td>
                <td className="px-4 py-3 text-[#4d4d4d] text-[10px] tabular-nums">{a.applicationNo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {list.pages > 1 && (
        <div className="px-4 py-3 text-[11px] text-[#6b6b6b] border-t border-white/5">
          Page {list.page} of {list.pages} · {list.total} total
        </div>
      )}
    </div>
  );
}
