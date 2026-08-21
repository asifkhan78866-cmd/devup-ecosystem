"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Users, Briefcase, CalendarDays, FileText } from "lucide-react";
import { workspaceApi, candidateApi, Workspace } from "@/lib/api/workspace";
import StartupLogo from "@/components/StartupLogo";

/**
 * Entry point into the hiring workspace.
 *
 * The workspace lives at /s/[code] and previously had no link anywhere outside
 * the super-admin page, so founders had no way to reach it. This surfaces every
 * workspace the signed-in user belongs to.
 */
export default function WorkspaceBanner() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [onboarding, setOnboarding] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      workspaceApi.myWorkspaces().catch(() => []),
      candidateApi.myOnboarding().catch(() => []),
      candidateApi.myAttendance().catch(() => []),
      candidateApi.myTickets().catch(() => []),
    ])
      .then(([w, o, a, t]) => {
        setWorkspaces(w);
        // Only surface onboarding that still needs something from them.
        setOnboarding((o ?? []).filter((x: any) => !x.progress?.complete));
        // Only when there is actually something to do today.
        setAttendance((a ?? []).filter((x: any) => x.today?.canCheckIn || x.today?.canCheckOut));
        // Only passes they can still use — a spent ticket is not a prompt.
        setTickets((t ?? []).filter((x: any) => x.status === "ISSUED"));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || (workspaces.length === 0 && onboarding.length === 0 && attendance.length === 0 && tickets.length === 0)) return null;

  return (
    <div className="mb-8 space-y-3">
      {tickets.length > 0 && (
        <Link
          href="/dashboard/tickets"
          className="group block rounded-2xl border p-5 transition-all hover:border-white/25"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))",
            borderColor: "rgba(255,255,255,0.12)",
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-white" style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 16, fontWeight: 700 }}>
                {tickets.length === 1
                  ? `Your ${tickets[0].partner?.name} pass is ready`
                  : `${tickets.length} partner passes ready to use`}
              </h3>
              <p className="mt-0.5 text-[12px] text-[#a1a1a1]">
                {tickets.length === 1
                  ? tickets[0].perk?.title
                  : "Discounts and access from DevUp partners"}
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/15 px-4 py-2 text-[13px] font-semibold text-white transition-transform group-hover:translate-x-0.5">
              View passes
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </Link>
      )}

      {attendance.map((a) => (
        <Link
          key={a.internId}
          href="/dashboard/internship"
          className="group block rounded-2xl border p-5 transition-all hover:border-[#c8f135]/40"
          style={{
            background: "linear-gradient(135deg, rgba(200,241,53,0.07), rgba(200,241,53,0.02))",
            borderColor: "rgba(200,241,53,0.22)",
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-white" style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 16, fontWeight: 700 }}>
                {a.today.canCheckIn ? "Check in for today" : "You are checked in"}
              </h3>
              <p className="mt-0.5 text-[12px] text-[#a1a1a1]">
                {a.startup?.name} · {a.today.mode === "OFFICE"
                  ? `Office day, ${a.today.officeStart}–${a.today.officeEnd}`
                  : "Remote day"}
              </p>
            </div>
            <span
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-semibold transition-transform group-hover:translate-x-0.5"
              style={{ background: "#c8f135", color: "#0a0a0a" }}
            >
              {a.today.canCheckIn ? "Check in" : "Check out"}
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </Link>
      ))}

      {onboarding.map((o) => (
        <Link
          key={o.person.id}
          href="/dashboard/internship"
          className="group block rounded-2xl border p-5 transition-all hover:border-[#facc15]/40"
          style={{
            background: "linear-gradient(135deg, rgba(250,204,21,0.07), rgba(250,204,21,0.02))",
            borderColor: "rgba(250,204,21,0.22)",
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-white" style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 16, fontWeight: 700 }}>
                {o.startup?.name} needs your documents
              </h3>
              <p className="mt-0.5 text-[12px] text-[#a1a1a1]">
                {o.progress.requiredApproved} of {o.progress.requiredTotal} approved
                {o.progress.rejected > 0 && <span className="text-[#f87171]"> · {o.progress.rejected} need re-uploading</span>}
              </p>
            </div>
            <span
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-semibold transition-transform group-hover:translate-x-0.5"
              style={{ background: "#facc15", color: "#0a0a0a" }}
            >
              Upload documents <ArrowRight className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
            <div className="h-full rounded-full transition-all" style={{ width: `${o.progress.percent}%`, background: "#facc15" }} />
          </div>
        </Link>
      ))}

      {workspaces.map((w) => (
        <Link
          key={w.id}
          href={`/s/${w.code}`}
          className="group block rounded-2xl border p-5 transition-all hover:border-[#c8f135]/40"
          style={{
            background: "linear-gradient(135deg, rgba(200,241,53,0.07), rgba(200,241,53,0.02))",
            borderColor: "rgba(200,241,53,0.22)",
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <StartupLogo
                src={w.logoUrl}
                name={w.name}
                rounded="rounded-xl"
                className="h-11 w-11 shrink-0 border border-white/10 text-sm"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3
                    className="truncate text-white"
                    style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 17, fontWeight: 700 }}
                  >
                    {w.name} Hiring Workspace
                  </h3>
                  <span
                    className="shrink-0 rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wider"
                    style={{ background: "rgba(200,241,53,0.12)", color: "#c8f135" }}
                  >
                    {String(w.role).replace(/_/g, " ")}
                  </span>
                </div>
                <p className="mt-0.5 text-[12px] text-[#a1a1a1]">
                  Applicants, interview pipeline, offers, employees and documents
                </p>
              </div>
            </div>

            <span
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-semibold transition-transform group-hover:translate-x-0.5"
              style={{ background: "#c8f135", color: "#0a0a0a" }}
            >
              Open workspace <ArrowRight className="h-4 w-4" />
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/[0.06] pt-3">
            {[
              [Users, "Applicants & pipeline"],
              [Briefcase, "Jobs"],
              [CalendarDays, "Interviews"],
              [FileText, "Offers & documents"],
            ].map(([Icon, label]) => {
              const I = Icon as typeof Users;
              return (
                <span key={label as string} className="flex items-center gap-1.5 text-[11px] text-[#8b8b8b]">
                  <I className="h-3.5 w-3.5" />
                  {label as string}
                </span>
              );
            })}
          </div>
        </Link>
      ))}
    </div>
  );
}
