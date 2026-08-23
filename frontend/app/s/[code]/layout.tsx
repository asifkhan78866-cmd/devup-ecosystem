"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  LayoutDashboard, Briefcase, Users, CalendarDays, FileText,
  UserCheck, GraduationCap, Settings, ChevronDown, AlertCircle,
  CalendarCheck, Star, FileCheck, ArrowLeft, ClipboardCheck, IndianRupee, ListChecks,
} from "lucide-react";
import { workspaceApi, Workspace } from "@/lib/api/workspace";
import StartupLogo from "@/components/StartupLogo";

const NAV = [
  { href: "", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/applications", label: "Applicants", icon: Users },
  { href: "/interviews", label: "Interviews", icon: CalendarDays },
  { href: "/offers", label: "Offers", icon: FileText },
  { href: "/onboarding", label: "Onboarding", icon: ClipboardCheck },
  { href: "/employees", label: "Employees", icon: UserCheck },
  { href: "/interns", label: "Interns", icon: GraduationCap },
  { href: "/attendance", label: "Attendance", icon: CalendarCheck },
  // Founder-only: what people did with the time, not just that they were here.
  { href: "/worklog", label: "Work Updates", icon: ListChecks, founderOnly: true },
  { href: "/performance", label: "Performance", icon: Star },
  { href: "/documents", label: "Documents", icon: FileCheck },
  // Stipend figures are the founder's business. Hidden here as well as blocked
  // server-side, so nobody is shown a door they cannot open.
  { href: "/finance", label: "Stipends", icon: IndianRupee, founderOnly: true },
  { href: "/settings", label: "Settings", icon: Settings },
];

const FOUNDER_ROLES = ["SUPER_ADMIN", "FOUNDER", "OWNER"];

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { code } = useParams<{ code: string }>();
  const pathname = usePathname();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    workspaceApi
      .myWorkspaces()
      .then(setWorkspaces)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const current = workspaces.find((w) => w.code === code);
  const base = `/s/${code}`;

  if (!loading && workspaces.length > 0 && !current) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
          <AlertCircle className="w-12 h-12 text-[#3d3d3d] mb-4" />
          <h2 className="text-white text-xl font-semibold mb-2" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
            Workspace not available
          </h2>
          <p className="text-[#6b6b6b] text-sm max-w-md">
            You do not have access to <span className="text-[#a1a1a1]">{code}</span>, or it does not exist.
          </p>
          <Link href="/dashboard" className="mt-6 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[#e4e4e4] text-sm hover:bg-white/10 transition">
            Back to dashboard
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-[252px] shrink-0 border-r border-white/5 bg-[#0d0d0d] sticky top-0 self-start h-screen overflow-y-auto">
          <div className="p-3.5 border-b border-white/5 relative">
            <button
              onClick={() => setSwitcherOpen((o) => !o)}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition text-left"
            >
              <StartupLogo
                src={current?.logoUrl}
                name={current?.name ?? code}
                className="w-9 h-9 border border-white/10 shrink-0 text-sm"
              />
              <div className="min-w-0 flex-1">
                <div className="text-white text-sm font-semibold truncate" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
                  {current?.name ?? code}
                </div>
                <div className="text-[10px] text-[#6b6b6b] uppercase tracking-wider">
                  {current?.role?.replace(/_/g, " ") ?? "—"}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-[#6b6b6b] shrink-0" />
            </button>

            {switcherOpen && workspaces.length > 0 && (
              <div className="absolute left-4 right-4 top-[70px] z-50 rounded-lg border border-white/10 bg-[#141414] shadow-2xl overflow-hidden">
                {workspaces.map((ws) => (
                  <Link
                    key={ws.id}
                    href={`/s/${ws.code}`}
                    onClick={() => setSwitcherOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 text-sm transition ${
                      ws.code === code ? "bg-white/5 text-[#c8f135]" : "text-[#a1a1a1] hover:bg-white/5"
                    }`}
                  >
                    <span className="w-6 h-6 rounded bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-[10px] font-bold shrink-0">
                      {ws.code}
                    </span>
                    <span className="truncate">{ws.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1">
            {NAV.filter((i) => !i.founderOnly || FOUNDER_ROLES.includes(current?.role ?? "")).map(({ href, label, icon: Icon }) => {
              const full = `${base}${href}`;
              const active = href === "" ? pathname === base : pathname.startsWith(full);
              return (
                <Link
                  key={href}
                  href={full}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] transition ${
                    active ? "bg-[#c8f135]/10 text-[#c8f135]" : "text-[#8b8b8b] hover:bg-white/5 hover:text-[#e4e4e4]"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* The site navbar is hidden in here, so this is the only way out. */}
          <div className="p-3 border-t border-white/5">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-[12.5px] text-[#8b8b8b] transition hover:bg-white/5 hover:text-[#e4e4e4]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to DevUp
            </Link>
          </div>
        </aside>

        {/* Mobile nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex overflow-x-auto border-t border-white/10 bg-[#0d0d0d] pb-[env(safe-area-inset-bottom)]">
          {NAV.slice(0, 5).map(({ href, label, icon: Icon }) => {
            const full = `${base}${href}`;
            const active = href === "" ? pathname === base : pathname.startsWith(full);
            return (
              <Link key={href} href={full} className={`flex-1 min-w-[64px] flex flex-col items-center gap-1 py-3 text-[9px] ${active ? "text-[#c8f135]" : "text-[#6b6b6b]"}`}>
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </div>

        <main className="flex-1 min-w-0 pb-24 md:pb-10">
          {error && (
            <div className="m-4 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-300 text-sm">
              {error}
            </div>
          )}
          {children}
        </main>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  // LayoutClient hides the site navbar and footer on /s/*, so the workspace
  // owns the full viewport and needs no offset.
  return <div className="min-h-screen bg-[#0a0a0a]">{children}</div>;
}
