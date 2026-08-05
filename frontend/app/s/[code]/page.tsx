"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Briefcase, Users, CalendarDays, FileText, UserCheck, GraduationCap, TrendingUp } from "lucide-react";
import { workspaceApi, STAGE_LABEL } from "@/lib/api/workspace";

export default function WorkspaceDashboard() {
  const { code } = useParams<{ code: string }>();
  const [data, setData] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [colleges, setColleges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    Promise.all([
      workspaceApi.dashboard(code),
      workspaceApi.trends(code).catch(() => []),
      workspaceApi.colleges(code).catch(() => []),
    ])
      .then(([d, t, c]) => {
        setData(d);
        setTrends(t);
        setColleges(c);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) return <div className="p-8 text-[#6b6b6b] text-sm">Loading workspace…</div>;
  if (error) return <div className="p-8 text-red-300 text-sm">{error}</div>;
  if (!data) return null;

  const cards = [
    { label: "Open Positions", value: data.openPositions, icon: Briefcase, href: `/s/${code}/jobs` },
    { label: "In Pipeline", value: data.inPipeline, icon: Users, href: `/s/${code}/applications` },
    { label: "Upcoming Interviews", value: data.upcomingInterviews, icon: CalendarDays, href: `/s/${code}/interviews` },
    { label: "Offers Out", value: data.offers?.SENT ?? 0, icon: FileText, href: `/s/${code}/offers` },
    { label: "Employees", value: data.activeEmployees, icon: UserCheck, href: `/s/${code}/employees` },
    { label: "Interns", value: data.activeInterns, icon: GraduationCap, href: `/s/${code}/interns` },
  ];

  const maxFunnel = Math.max(1, ...data.funnel.map((f: any) => f.count));
  const maxTrend = Math.max(1, ...trends.map((t) => t.applications));

  return (
    <div className="px-5 py-7 md:px-9 md:py-9 max-w-[1440px] mx-auto">
      <header className="mb-7">
        <h1
          className="text-white"
          style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "clamp(26px, 3.2vw, 34px)", fontWeight: 800, letterSpacing: "-0.02em" }}
        >
          Hiring Overview
        </h1>
        <p className="text-[#8b8b8b] text-[13.5px] mt-1.5">
          {data.totalApplications} total application{data.totalApplications === 1 ? "" : "s"}
          <span className="mx-2 text-[#3d3d3d]">·</span>
          {data.conversionRate}% conversion to hire
        </p>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 mb-7">
        {cards.map(({ label, value, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="p-5 rounded-2xl bg-[#111111] border border-white/[0.06] hover:border-[#c8f135]/25 hover:bg-[#131313] transition-all group"
          >
            <Icon className="w-[18px] h-[18px] text-[#5a5a5a] group-hover:text-[#c8f135] transition mb-4" />
            <div className="text-white leading-none" style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 30, fontWeight: 800 }}>
              {value ?? 0}
            </div>
            <div className="text-[11.5px] text-[#7a7a7a] mt-2">{label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4 items-start">
        {/* Funnel */}
        <section className="p-6 rounded-2xl bg-[#111111] border border-white/[0.06]">
          <h2 className="text-white text-[15px] font-semibold mb-5" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
            Hiring Funnel
          </h2>
          <div className="space-y-2.5">
            {data.funnel.map((f: any) => (
              <div key={f.stage} className="flex items-center gap-3">
                <span className="text-[12px] text-[#9a9a9a] w-[130px] shrink-0 truncate">
                  {STAGE_LABEL[f.stage] ?? f.stage}
                </span>
                <div className="flex-1 h-[22px] bg-white/[0.025] rounded-md overflow-hidden">
                  <div
                    className="h-full rounded transition-all duration-500"
                    style={{
                      width: `${Math.max(f.count ? 4 : 0, (f.count / maxFunnel) * 100)}%`,
                      background: "linear-gradient(90deg, rgba(200,241,53,0.7), rgba(200,241,53,0.35))",
                    }}
                  />
                </div>
                <span className="text-[12px] text-[#e4e4e4] w-8 text-right tabular-nums">{f.count}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Trends */}
        <section className="p-6 rounded-2xl bg-[#111111] border border-white/[0.06]">
          <h2 className="text-white text-[15px] font-semibold mb-5 flex items-center gap-2" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
            <TrendingUp className="w-4 h-4 text-[#6b6b6b]" /> Applications by Month
          </h2>
          {trends.length === 0 ? (
            <p className="text-[#6b6b6b] text-xs">No application history yet.</p>
          ) : (
            <div className="flex items-end gap-2 h-[180px]">
              {trends.map((t) => (
                <div key={t.month} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                  <span className="text-[10px] text-[#e4e4e4] tabular-nums">{t.applications}</span>
                  <div className="w-full flex flex-col justify-end flex-1 gap-0.5">
                    <div
                      className="w-full rounded-t"
                      style={{ height: `${(t.applications / maxTrend) * 100}%`, background: "rgba(200,241,53,0.5)", minHeight: t.applications ? 3 : 0 }}
                    />
                    {t.hired > 0 && (
                      <div
                        className="w-full rounded-b"
                        style={{ height: `${(t.hired / maxTrend) * 100}%`, background: "rgba(120,170,255,0.7)", minHeight: 3 }}
                      />
                    )}
                  </div>
                  <span className="text-[9px] text-[#6b6b6b] truncate w-full text-center">{t.month.slice(5)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-4 mt-3 text-[10px] text-[#6b6b6b]">
            <span className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-sm inline-block" style={{ background: "rgba(200,241,53,0.5)" }} /> Applications</span>
            <span className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-sm inline-block" style={{ background: "rgba(120,170,255,0.7)" }} /> Hired</span>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Colleges */}
        <section className="p-6 rounded-2xl bg-[#111111] border border-white/[0.06]">
          <h2 className="text-white text-[15px] font-semibold mb-5" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
            Applications by College
          </h2>
          {colleges.length === 0 ? (
            <p className="text-[#6b6b6b] text-xs">No college data captured yet.</p>
          ) : (
            <div className="space-y-1.5">
              {colleges.slice(0, 8).map((c) => (
                <div key={c.college} className="flex items-center justify-between text-xs">
                  <span className="text-[#a1a1a1] truncate pr-3">{c.college}</span>
                  <span className="text-[#e4e4e4] tabular-nums shrink-0">{c.count}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent */}
        <section className="p-6 rounded-2xl bg-[#111111] border border-white/[0.06]">
          <h2 className="text-white text-[15px] font-semibold mb-5" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
            Recent Applications
          </h2>
          {data.recentApplications?.length === 0 ? (
            <p className="text-[#6b6b6b] text-xs">No applications yet.</p>
          ) : (
            <div className="divide-y divide-white/5">
              {data.recentApplications?.map((a: any) => (
                <Link
                  key={a.id}
                  href={`/s/${code}/applications/${a.id}`}
                  className="flex items-center justify-between py-2.5 group"
                >
                  <div className="min-w-0">
                    <div className="text-[#e4e4e4] text-xs font-medium truncate group-hover:text-white transition">
                      {a.applicantName ?? "Unnamed candidate"}
                    </div>
                    <div className="text-[10px] text-[#6b6b6b] truncate">
                      {a.job?.title} · {a.applicationNo}
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded shrink-0 ml-3" style={{ background: "rgba(200,241,53,0.08)", color: "#c8f135" }}>
                    {STAGE_LABEL[a.stage] ?? a.stage}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
