"use client";

import { useState, useEffect } from "react";
import { UserPlus, UserCheck, MessageSquare, Clock, Check, X } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const TEAM_ROLES = ["OWNER", "ADMIN", "MEMBER"];

export default function ConnectionsPage() {
  const { session, loading: authLoading } = useAuth();
  const token = session?.access_token;

  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [acceptedConnections, setAcceptedConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // The caller's own startup, if they are an ACTIVE OWNER (from getMe.startupMemberships).
  const [myStartup, setMyStartup] = useState<{ id: string; name?: string } | null>(null);

  // "Add to team" modal state.
  const [addTarget, setAddTarget] = useState<any | null>(null);
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [inviteError, setInviteError] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteNotice, setInviteNotice] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setLoading(false);
      return;
    }
    fetchConnections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, token, user]);

  const fetchConnections = async () => {
    try {
      if (user) {
        setUserId(user.id);
        if (user.startups && user.startups.length > 0) {
          setMyStartup({ id: user.startups[0].id, name: user.startups[0].name });
        }
      }

      const res = await fetch(`${API}/api/connections`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        setPendingRequests(data.data.pendingRequests);
        setAcceptedConnections(data.data.acceptedConnections);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (requestId: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      const res = await fetch(`${API}/api/connections/${requestId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchConnections();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Reuses the existing team-invite flow (POST /api/startups/:id/members/invite),
  // pre-filled from the connection. Owner-only on the backend; sends an invite the
  // connected user accepts to join.
  const handleAddToTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myStartup || !addTarget || !token) return;
    setInviting(true);
    setInviteError("");
    try {
      const res = await fetch(`${API}/api/startups/${myStartup.id}/members/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email: addTarget.email, role: inviteRole })
      });
      const data = await res.json();
      if (data.success) {
        setAddTarget(null);
        setInviteNotice(`Invited ${addTarget.email} to ${myStartup.name || 'your team'}.`);
      } else {
        setInviteError(data.error || "Failed to add to team");
      }
    } catch (err: any) {
      setInviteError(err?.message || "Something went wrong");
    } finally {
      setInviting(false);
    }
  };

  if (loading) return <div className="p-8 text-white">Loading connections...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen">
      <div className="mb-8">
        <h1 style={{ fontFamily: "var(--font-syne)", fontWeight: 800 }} className="text-3xl text-white mb-2">My Network</h1>
        <p style={{ fontFamily: "var(--font-inter)" }} className="text-[#a1a1a1]">Manage your founder connections and requests.</p>
      </div>

      {inviteNotice && (
        <div className="mb-6 p-3 bg-[#c8f135]/10 border border-[#c8f135]/20 text-[#c8f135] rounded-lg text-sm">{inviteNotice}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl text-white font-bold" style={{ fontFamily: "var(--font-syne)" }}>Your Connections ({acceptedConnections.length})</h2>
          
          {acceptedConnections.length === 0 ? (
            <div className="bg-[#111111] border border-white/5 rounded-xl p-8 text-center">
              <UserCheck className="w-12 h-12 text-[#333] mx-auto mb-3" />
              <p className="text-[#a1a1a1]">You don't have any connections yet.</p>
              <Link href="/ecosystem" className="text-[#c8f135] hover:underline mt-2 inline-block">Explore the ecosystem to connect with founders</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {acceptedConnections.map((conn) => {
                const partner = conn.fromUserId === userId ? conn.toUser : conn.fromUser;
                return (
                  <div key={conn.id} className="bg-[#111111] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#1a1a1a] border border-white/10 overflow-hidden">
                        {partner?.avatarUrl ? (
                          <img src={partner.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#c8f135] font-bold text-xl">
                            {partner?.profile?.name?.[0] || 'U'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-medium">{partner?.profile?.name || 'Unknown User'}</h3>
                        <p className="text-sm text-[#a1a1a1] line-clamp-1">{partner?.profile?.bio || 'No bio available'}</p>
                        
                        <div className="mt-4 flex gap-2">
                          <button
                            className="flex-1 flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-[#222] text-white py-2 rounded-lg text-sm transition-colors"
                            onClick={() => alert("Messaging system to be implemented!")}
                          >
                            <MessageSquare className="w-4 h-4" /> Message
                          </button>
                          {myStartup && partner?.email && (
                            <button
                              onClick={() => { setInviteRole("MEMBER"); setInviteError(""); setAddTarget(partner); }}
                              className="flex-1 flex items-center justify-center gap-2 bg-[#c8f135] text-black py-2 rounded-lg text-sm font-semibold hover:bg-[#b0d829] transition-colors"
                            >
                              <UserPlus className="w-4 h-4" /> Add to team
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h2 className="text-xl text-white font-bold" style={{ fontFamily: "var(--font-syne)" }}>Pending Requests ({pendingRequests.length})</h2>
          
          <div className="bg-[#111111] border border-white/5 rounded-xl overflow-hidden">
            {pendingRequests.length === 0 ? (
              <div className="p-8 text-center text-[#6b6b6b]">No pending requests.</div>
            ) : (
              <div className="divide-y divide-white/5">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-white/10 overflow-hidden shrink-0">
                        {req.fromUser?.avatarUrl ? (
                          <img src={req.fromUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#c8f135] font-bold">
                            {req.fromUser?.profile?.name?.[0] || 'U'}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-white font-medium text-sm">{req.fromUser?.profile?.name || 'Unknown User'}</div>
                        <div className="text-[#6b6b6b] text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(req.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    {req.message && (
                      <div className="bg-[#1a1a1a] p-3 rounded-lg text-sm text-[#a1a1a1] mb-4 italic">
                        "{req.message}"
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleRespond(req.id, 'ACCEPTED')}
                        className="flex-1 flex items-center justify-center gap-1 bg-[#c8f135] text-black py-2 rounded-lg text-sm font-semibold hover:bg-[#b0d829] transition-colors"
                      >
                        <Check className="w-4 h-4" /> Accept
                      </button>
                      <button 
                        onClick={() => handleRespond(req.id, 'REJECTED')}
                        className="flex-1 flex items-center justify-center gap-1 bg-[#1a1a1a] text-[#a1a1a1] hover:text-white py-2 rounded-lg text-sm transition-colors"
                      >
                        <X className="w-4 h-4" /> Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {addTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl text-white font-bold" style={{ fontFamily: "var(--font-syne)" }}>
                Add to {myStartup?.name || "your team"}
              </h2>
              <button onClick={() => setAddTarget(null)} className="text-[#6b6b6b] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddToTeam} className="space-y-4">
              {inviteError && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">{inviteError}</div>}
              <p className="text-sm text-[#a1a1a1]">
                Sends a team invite to <span className="text-white">{addTarget.profile?.name || addTarget.email}</span>. They join once they accept.
              </p>
              <div>
                <label className="block text-sm text-[#a1a1a1] mb-1.5">Email</label>
                <input readOnly value={addTarget.email || ""} className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-[#a1a1a1] outline-none cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm text-[#a1a1a1] mb-1.5">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-[#c8f135]/50 transition-colors"
                >
                  {TEAM_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <button
                type="submit"
                disabled={inviting}
                className="w-full bg-[#c8f135] text-black font-semibold rounded-lg py-3 hover:bg-[#b0d829] transition-colors mt-2 disabled:opacity-60"
              >
                {inviting ? "Adding..." : "Send team invite"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
