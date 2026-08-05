"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2, Briefcase, Users, Award, UserCheck, GraduationCap,
  CalendarDays, TrendingUp, XCircle,
} from "lucide-react";
import { platformApi } from "@/lib/api/workspace";
import { STAGE_LABEL } from "@/lib/api/workspace";

export default function PlatformHiringDashboard() {
  const [overview, setOverview] = useState<any>(null);
  const [comparison, setComparison] = useState<any[]>([]);
  const [funnel, setFunnel] = useState<any[]>([]);
  const [colleges, setColleges] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      platformApi.overview(),
      platformApi.comparison().catch(() => []),
      platformApi.funnel().catch(() => []),
      platformApi.colleges().catch(() => []),
      platformApi.trends(6).catch(() => []),
    ])
      .then(([o, c, f, col, t]) => {
        setOverview(o);
        setComparison(c);
        setFunnel(f);
        setColleges(col);
        setTrends(t);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-[#6b6b6b] text-sm">Loading platform analytics…</div>;
  if (error) return <div className="p-8 text-red-300 text-sm">{error}</div>;
  if (!overview) return null;

  const cards = [
    { label: "Startups", value: overview.totalStartups, sub: `${overview.activeStartups} active`, icon: Building2 },
    { label: "Active Jobs", value: overview.activeJobs, icon: Briefcase },
    { label: "Applications", value: overview.totalApplications, icon: Users },
    { label: "Offers Generated", value: overview.offersGenerated, sub: `${overview.offersAccepted} accepted`, icon: Award },
    { label: "Selected", value: overview.selectedCandidates, icon: UserCheck },
    { label: "Rejected", value: overview.rejectedCandidates, icon: XCircle },
    { label: "Employees", value: overview.activeEmployees, icon: UserCheck },
    { label: "Interns", value: overview.activeInterns, icon: GraduationCap },
    { label: "Interviews", value: overview.totalInterviews, icon: CalendarDays },
    { label: "Conversion", value: `${overview.hiringConversionRate}%`, sub: "application → hire", icon: TrendingUp },
  ];

  const maxFunnel = Math.max(1, ...funnel.map((f) => f.count));
  const maxTrend = Math.max(1, ...trends.map((t) => t.applications));
  const maxComp = Math.max(1, ...comparison.map((c) => c.applications));

  return (
    <div className="p-6 md:p-8 max-w-[1500px]">
      <header className="mb-7">
        <h1 className="text-white text-2xl md:text-3xl font-bold" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
          Ecosystem Hiring
        </h1>
        <p className="text-[#6b6b6b] text-sm mt-1">
          Every startup, aggregated. Figures only — candidate details stay inside each workspace.
        </p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {cards.map(({ label, value, sub, icon: Icon }) => (
          <div key={label} className="p-4 rounded-xl bg-[#111111] border border-white/5">
            <Icon className="w-4 h-4 text-[#6b6b6b] mb-3" />
            <div className="text-white text-2xl font-bold" style={{ fontFamily: "var(--font-syne), sans-serif" }}>{value ?? 0}</div>
            <div className="text-[11px] text-[#6b6b6b] mt-0.5">{label}</div>
            {sub && <div className="text-[10px] text-[#4d4d4d] mt-0.5">{sub}</div>}
          </div>
        ))}
      </div>

      {/* Startup comparison */}
      <section className="p-5 rounded-xl bg-[#111111] border border-white/5 mb-4">
        <h2 className="text-white text-sm font-semibold mb-4" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
          Startup Comparison
        </h2>
        {comparison.length === 0 ? (
          <p className="text-[#6b6b6b] text-xs">No data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {["Startup", "Jobs", "Applications", "Hired", "Conversion", ""].map((h) => (
                    <th key={h} className="text-left text-[10px] font-semibold text-[#6b6b6b] uppercase tracking-wider pb-2 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {comparison.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-2.5 pr-4">
                      <span className="text-[#e4e4e4] text-xs font-medium">{s.name}</span>
                      {s.code && <span className="text-[10px] text-[#4d4d4d] ml-2 tabular-nums">{s.code}</span>}
                    </td>
                    <td className="py-2.5 pr-4 text-[#a1a1a1] text-xs tabular-nums">{s.jobs}</td>
                    <td className="py-2.5 pr-4 w-[220px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-white/5 rounded overflow-hidden min-w-[60px]">
                          <div className="h-full rounded" style={{ width: `${(s.applications / maxComp) * 100}%`, background: "rgba(200,241,53,0.6)" }} />
                        </div>
                        <span className="text-[#e4e4e4] text-xs tabular-nums w-8 text-right">{s.applications}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 text-[#c8f135] text-xs tabular-nums">{s.hired}</td>
                    <td className="py-2.5 pr-4 text-[#a1a1a1] text-xs tabular-nums">{s.conversionRate}%</td>
                    <td className="py-2.5">
                      {s.code && (
                        <Link href={`/s/${s.code}`} className="text-[11px] text-[#8b8b8b] hover:text-[#c8f135] transition">Open →</Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <section className="p-5 rounded-xl bg-[#111111] border border-white/5">
          <h2 className="text-white text-sm font-semibold mb-4" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
            Ecosystem Hiring Funnel
          </h2>
          <div className="space-y-2">
            {funnel.map((f) => (
              <div key={f.stage} className="flex items-center gap-3">
                <span className="text-[11px] text-[#8b8b8b] w-[120px] shrink-0 truncate">{STAGE_LABEL[f.stage] ?? f.stage}</span>
                <div className="flex-1 h-5 bg-white/[0.03] rounded overflow-hidden">
                  <div className="h-full rounded transition-all duration-500" style={{ width: `${Math.max(f.count ? 4 : 0, (f.count / maxFunnel) * 100)}%`, background: "linear-gradient(90deg, rgba(200,241,53,0.7), rgba(200,241,53,0.3))" }} />
                </div>
                <span className="text-[11px] text-[#e4e4e4] w-8 text-right tabular-nums">{f.count}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="p-5 rounded-xl bg-[#111111] border border-white/5">
          <h2 className="text-white text-sm font-semibold mb-4" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
            Monthly Applications & Hires
          </h2>
          {trends.length === 0 ? (
            <p className="text-[#6b6b6b] text-xs">No history yet.</p>
          ) : (
            <>
              <div className="flex items-end gap-2 h-[180px]">
                {trends.map((t) => (
                  <div key={t.month} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                    <span className="text-[10px] text-[#e4e4e4] tabular-nums">{t.applications}</span>
                    <div className="w-full flex flex-col justify-end flex-1 gap-0.5">
                      <div className="w-full rounded-t" style={{ height: `${(t.applications / maxTrend) * 100}%`, background: "rgba(200,241,53,0.5)", minHeight: t.applications ? 3 : 0 }} />
                      {t.hired > 0 && <div className="w-full rounded-b" style={{ height: `${(t.hired / maxTrend) * 100}%`, background: "rgba(120,170,255,0.7)", minHeight: 3 }} />}
                    </div>
                    <span className="text-[9px] text-[#6b6b6b]">{t.month.slice(5)}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-3 text-[10px] text-[#6b6b6b]">
                <span className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-sm inline-block" style={{ background: "rgba(200,241,53,0.5)" }} /> Applications</span>
                <span className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-sm inline-block" style={{ background: "rgba(120,170,255,0.7)" }} /> Hired</span>
              </div>
            </>
          )}
        </section>
      </div>

      <section className="p-5 rounded-xl bg-[#111111] border border-white/5">
        <h2 className="text-white text-sm font-semibold mb-4" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
          College Distribution
        </h2>
        {colleges.length === 0 ? (
          <p className="text-[#6b6b6b] text-xs">No college data captured yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1.5">
            {colleges.map((c) => (
              <div key={c.college} className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                <span className="text-[#a1a1a1] truncate pr-3">{c.college}</span>
                <span className="text-[#e4e4e4] tabular-nums shrink-0">{c.count}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
