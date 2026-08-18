"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { Crown, Search, Filter, ShieldCheck, Mail, Phone, MapPin, Building, Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";
import Link from "next/link";

export default function AdminLeadApplicationsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedApp, setSelectedApp] = useState<any>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["leadApplications", roleFilter, statusFilter, search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (roleFilter) params.append("role", roleFilter);
      if (statusFilter) params.append("status", statusFilter);
      if (search) params.append("search", search);
      return apiClient<any>(`/lead-applications?${params.toString()}`);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, reviewNotes }: { id: string; status: string; reviewNotes?: string }) => {
      return apiClient<any>(`/lead-applications/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, reviewNotes }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leadApplications"] });
      setSelectedApp(null);
    },
  });

  const applications = data?.data || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SELECTED":
        return <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">SELECTED</span>;
      case "SHORTLISTED":
        return <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold">SHORTLISTED</span>;
      case "INTERVIEWING":
        return <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs font-semibold">INTERVIEWING</span>;
      case "REJECTED":
        return <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold">REJECTED</span>;
      default:
        return <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold">PENDING</span>;
    }
  };

  return (
    <div className="p-8 min-h-screen bg-[#070709] text-white pt-28">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c8f135]/10 border border-[#c8f135]/30 text-[#c8f135] text-xs font-semibold mb-2">
              <Crown className="w-3.5 h-3.5" /> DevUp Leadership Governance
            </div>
            <h1 className="font-syne text-3xl font-extrabold">Lead DevUp Applications</h1>
            <p className="text-zinc-400 text-sm mt-1">
              Review territory director candidates for State, Regional, City and Campus roles.
            </p>
          </div>

          <Link
            href="/admin"
            className="px-4 py-2 rounded-xl bg-white/[0.06] text-zinc-300 hover:text-white border border-white/[0.1] text-xs font-semibold"
          >
            ← Back to Admin
          </Link>
        </div>

        {/* Filters bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, college, city, state..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white text-sm focus:border-[#c8f135] focus:outline-none"
            />
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white text-sm focus:border-[#c8f135] focus:outline-none"
            >
              <option value="">All Roles (State, Regional, City, Campus)</option>
              <option value="STATE_DIRECTOR">State Director</option>
              <option value="REGIONAL_DIRECTOR">Regional Director</option>
              <option value="CITY_DIRECTOR">City Director</option>
              <option value="CAMPUS_DIRECTOR">Campus Director</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white text-sm focus:border-[#c8f135] focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="INTERVIEWING">Interviewing</option>
              <option value="SELECTED">Selected</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Applications List */}
        {isLoading ? (
          <div className="p-12 text-center text-zinc-400">Loading applications...</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-400 bg-red-500/10 border border-red-500/20 rounded-2xl">
            Could not fetch lead applications. Make sure the backend server is running.
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center text-zinc-400 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
            No leadership applications found matching filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {applications.map((app: any) => (
              <div
                key={app.id}
                className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.2] transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-[#c8f135] font-bold">{app.applicationNo}</span>
                    {getStatusBadge(app.status)}
                    <span className="text-xs px-2.5 py-0.5 rounded bg-white/[0.08] text-zinc-300 font-semibold">
                      {app.role?.replace("_", " ")}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white">{app.fullName}</h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-zinc-500" />
                      {app.college}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                      {app.city}, {app.state}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-zinc-500" />
                      {app.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-zinc-500" />
                      {app.phone}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedApp(app)}
                    className="px-4 py-2 rounded-xl bg-white/[0.08] text-white hover:bg-white/[0.15] text-xs font-semibold transition-all"
                  >
                    View Details & Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal for App Review */}
        {selectedApp && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0f0f13] border border-white/[0.1] rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6">
              <div className="flex justify-between items-start border-b border-white/[0.08] pb-4">
                <div>
                  <div className="font-mono text-xs text-[#c8f135] font-bold">{selectedApp.applicationNo}</div>
                  <h2 className="text-xl font-bold text-white mt-1">{selectedApp.fullName}</h2>
                  <p className="text-xs text-zinc-400">{selectedApp.role?.replace("_", " ")} Candidate</p>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="p-2 rounded-lg bg-white/[0.06] text-zinc-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-sm text-zinc-300">
                <div className="grid grid-cols-2 gap-3 bg-white/[0.03] p-4 rounded-xl border border-white/[0.06]">
                  <div>
                    <span className="text-xs text-zinc-400 block">College</span>
                    <span className="font-semibold text-white">{selectedApp.college}</span>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 block">Location</span>
                    <span className="font-semibold text-white">{selectedApp.city}, {selectedApp.state}</span>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 block">Branch & Year</span>
                    <span className="text-white">{selectedApp.branch || "N/A"} ({selectedApp.yearOfStudy || "N/A"})</span>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 block">Contact</span>
                    <span className="text-white">{selectedApp.phone}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">Why Lead DevUp?</h4>
                  <p className="p-3 rounded-xl bg-black/40 border border-white/[0.06] text-xs leading-relaxed text-zinc-200">
                    {selectedApp.whyLead}
                  </p>
                </div>

                {selectedApp.pastExperience && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">Past Experience</h4>
                    <p className="p-3 rounded-xl bg-black/40 border border-white/[0.06] text-xs leading-relaxed text-zinc-200">
                      {selectedApp.pastExperience}
                    </p>
                  </div>
                )}

                {selectedApp.first30DaysPlan && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">30-Day Territory Action Plan</h4>
                    <p className="p-3 rounded-xl bg-black/40 border border-white/[0.06] text-xs leading-relaxed text-zinc-200">
                      {selectedApp.first30DaysPlan}
                    </p>
                  </div>
                )}
              </div>

              {/* Status Action Buttons */}
              <div className="border-t border-white/[0.08] pt-4 space-y-3">
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Update Application Status</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => updateStatusMutation.mutate({ id: selectedApp.id, status: "SHORTLISTED" })}
                    className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold hover:bg-cyan-500/30"
                  >
                    Shortlist
                  </button>
                  <button
                    onClick={() => updateStatusMutation.mutate({ id: selectedApp.id, status: "INTERVIEWING" })}
                    className="px-4 py-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold hover:bg-purple-500/30"
                  >
                    Interview
                  </button>
                  <button
                    onClick={() => updateStatusMutation.mutate({ id: selectedApp.id, status: "SELECTED" })}
                    className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold hover:bg-emerald-500/30"
                  >
                    Select Lead
                  </button>
                  <button
                    onClick={() => updateStatusMutation.mutate({ id: selectedApp.id, status: "REJECTED" })}
                    className="px-4 py-2 rounded-xl bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-bold hover:bg-red-500/30"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
