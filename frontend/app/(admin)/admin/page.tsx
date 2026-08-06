"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import Link from "next/link";
import { Activity, Users, Briefcase, FileText, Rocket, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminDashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["adminStats"],
    queryFn: () => apiClient<any>("/admin/stats"),
  });

  if (isLoading) {
    return <div className="p-8 text-white">Loading stats...</div>;
  }

  if (isError) {
    return <div className="p-8 text-red-500">Failed to load stats. Ensure backend is running.</div>;
  }

  const stats = data || {};

  const statCards = [
    { label: "Total Users", value: stats.totalUsers || 0, icon: Users, color: "text-blue-500" },
    { label: "Active Startups", value: stats.totalStartups || 0, icon: Rocket, color: "text-purple-500" },
    { label: "Applications", value: stats.totalApplications || 0, icon: FileText, color: "text-green-500" },
    { label: "Open Jobs", value: stats.totalJobs || 0, icon: Briefcase, color: "text-orange-500" },
    { label: "Hackathons", value: stats.activeHackathons || 0, icon: Activity, color: "text-pink-500" },
  ];

  return (
    <div className="p-8 min-h-screen bg-[#0a0a0a] text-white pt-32">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-syne text-4xl font-bold mb-8">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col items-center justify-center text-center"
            >
              <stat.icon className={`w-10 h-10 mb-4 ${stat.color}`} />
              <div className="text-3xl font-bold font-jetbrains-mono mb-2">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/admin/hiring"
            className="group bg-white/5 border border-white/10 p-5 rounded-2xl transition hover:border-[#c8f135]/40"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-syne font-bold text-white">Hiring across the ecosystem</h3>
                <p className="text-sm text-gray-400 mt-1">Funnel, colleges and per-startup comparison.</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-500 transition group-hover:translate-x-0.5 group-hover:text-[#c8f135]" />
            </div>
          </Link>

          <Link
            href="/admin/founders"
            className="group bg-white/5 border border-white/10 p-5 rounded-2xl transition hover:border-[#c8f135]/40"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-syne font-bold text-white">Founder letters</h3>
                <p className="text-sm text-gray-400 mt-1">Issue appointment letters to founders at any startup.</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-500 transition group-hover:translate-x-0.5 group-hover:text-[#c8f135]" />
            </div>
          </Link>
        </div>

        <div className="mt-8 bg-white/5 border border-white/10 p-6 rounded-2xl">
          <h2 className="text-xl font-bold mb-4 font-syne">Recent Audit Logs</h2>
          <div className="text-gray-400 font-jetbrains-mono text-sm">
            {/* Real implementation would fetch and map over audit logs */}
            [2026-05-23] admin@devup.in approved Startup: NexusAI <br />
            [2026-05-23] admin@devup.in created Job: Senior Engineer <br />
            [2026-05-22] admin@devup.in rejected Application: RandomApp <br />
          </div>
        </div>
      </div>
    </div>
  );
}
