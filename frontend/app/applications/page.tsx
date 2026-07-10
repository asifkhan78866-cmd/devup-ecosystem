"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Download, FileText, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function ApplicationsPage() {
  const { user, session, loading: authLoading } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    if (user?.startups?.[0] && session?.access_token) {
      fetchApplications(user.startups[0].id, session.access_token);
    } else {
      setLoading(false);
    }
  }, [user, session, authLoading]);

  const fetchApplications = async (startupId: string, token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/startups/${startupId}/job-applications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setApplications(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) return <div className="p-8 text-white min-h-screen bg-[#0a0a0a]">Loading applications...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-28 pb-24">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <Link href="/dashboard" className="text-[#c8f135] text-sm hover:underline mb-4 inline-block">
              &larr; Back to Dashboard
            </Link>
            <h1 style={{ fontFamily: "var(--font-syne)", fontWeight: 800 }} className="text-3xl text-white mb-2">
              Job Applications
            </h1>
            <p style={{ fontFamily: "var(--font-inter)" }} className="text-[#a1a1a1]">
              Review candidates applying to your startup.
            </p>
          </div>
          <div className="text-[#6b6b6b] text-sm bg-[#111111] px-4 py-2 rounded-lg border border-white/10">
            {applications.length} total
          </div>
        </div>

        <div className="bg-[#111111] border border-white/5 rounded-xl overflow-hidden">
          {applications.length === 0 ? (
            <div className="p-16 text-center">
              <FileText className="w-12 h-12 text-[#333] mx-auto mb-4" />
              <p className="text-[#a1a1a1]">No job applications received yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#0a0a0a] border-b border-white/5 text-[#6b6b6b] text-sm uppercase" style={{ fontFamily: "var(--font-inter)" }}>
                  <tr>
                    <th className="px-6 py-4 font-medium">Candidate</th>
                    <th className="px-6 py-4 font-medium">Role</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {applications.map((app) => (
                    <tr key={app.id} className="group hover:bg-white/[0.02] transition-colors align-top">
                      <td className="px-6 py-4">
                        <div className="text-white font-medium mb-1">
                          {app.applicantName || app.user?.profile?.name || "Unknown"}
                        </div>
                        <div className="text-[#a1a1a1] text-sm mb-1">
                          {app.applicantEmail || app.user?.email}
                        </div>
                        {app.applicantPhone && (
                          <div className="text-[#6b6b6b] text-xs">
                            {app.applicantPhone}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white text-sm">{app.job?.title}</div>
                        <div className="text-[#6b6b6b] text-xs mt-1">{app.job?.type}</div>
                      </td>
                      <td className="px-6 py-4 text-[#a1a1a1] text-sm">
                        {new Date(app.appliedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 text-xs border rounded-full text-blue-400 bg-blue-400/10 border-blue-400/20 uppercase tracking-wider">
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3 flex-wrap">
                          {app.coverLetter && (
                            <button 
                              onClick={() => alert(app.coverLetter)}
                              className="text-sm text-[#a1a1a1] hover:text-white transition-colors"
                            >
                              View Cover Note
                            </button>
                          )}
                          {app.resumeUrl && (
                            <a 
                              href={app.resumeUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="flex items-center gap-1.5 bg-[#c8f135]/10 text-[#c8f135] px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-[#c8f135]/20 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" /> Resume
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
