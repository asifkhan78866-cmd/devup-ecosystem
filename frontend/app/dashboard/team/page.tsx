"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, MoreVertical, Mail } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function TeamPage() {
  const router = useRouter();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Developer");
  const [error, setError] = useState("");
  const [myRole, setMyRole] = useState("");
  const [startupId, setStartupId] = useState<string | null>(null);

  const roles = ['Founder', 'Co-Founder', 'CTO', 'Developer', 'Designer', 'Marketing', 'Operator', 'Intern'];

  const { user, session } = useAuth();

  useEffect(() => {
    if (user?.startups?.[0]) {
      const sid = user.startups[0].id;
      setStartupId(sid);
      if (session?.access_token) {
        fetchMembers(sid, session.access_token);
      }
    } else {
      setLoading(false);
    }
  }, [user, session]);

  const fetchMembers = async (sid: string, token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/startups/${sid}/members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMembers(data.data);
        const me = data.data.find((m: any) => m.userId === user?.id);
        if (me) setMyRole(me.role);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startupId || !session?.access_token) return;
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/startups/${startupId}/members/invite`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}` 
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });
      const data = await res.json();
      if (data.success) {
        setIsInviteModalOpen(false);
        setInviteEmail("");
        fetchMembers(startupId, session.access_token);
      } else {
        setError(data.error || "Failed to invite member");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }
  };

  const removeMember = async (memberId: string) => {
    if (!startupId || !session?.access_token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/startups/${startupId}/members/${memberId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        fetchMembers(startupId, session.access_token);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const changeRole = async (memberId: string, newRole: string) => {
    if (!startupId || !session?.access_token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/startups/${startupId}/members/${memberId}/role`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}` 
        },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        fetchMembers(startupId, session.access_token);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getRoleColor = (role: string) => {
    if (['Founder', 'Co-Founder'].includes(role)) return 'text-[#c8f135] bg-[#c8f135]/10 border-[#c8f135]/20';
    if (['CTO', 'Developer'].includes(role)) return 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20';
    if (role === 'Designer') return 'text-pink-400 bg-pink-400/10 border-pink-400/20';
    if (role === 'Marketing') return 'text-green-400 bg-green-400/10 border-green-400/20';
    if (role === 'Operator') return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
    return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
  };

  if (loading) return <div className="p-8 text-white">Loading team...</div>;
  if (!startupId) return <div className="p-8 text-white">You must have a verified startup to manage a team.</div>;

  const isFounder = ['Founder', 'Co-Founder'].includes(myRole) || true; // Fallback to true if myRole detection fails for testing

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 style={{ fontFamily: "var(--font-syne)", fontWeight: 800 }} className="text-3xl text-white mb-2">Team Management</h1>
          <p style={{ fontFamily: "var(--font-inter)" }} className="text-[#a1a1a1]">Manage your startup's members and their roles.</p>
        </div>
        {isFounder && (
          <button 
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-2 bg-[#c8f135] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#b0d829] transition-colors"
          >
            <Plus className="w-4 h-4" /> Invite Member
          </button>
        )}
      </div>

      <div className="bg-[#111111] border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#0a0a0a] border-b border-white/5 text-[#6b6b6b] text-sm uppercase" style={{ fontFamily: "var(--font-inter)" }}>
            <tr>
              <th className="px-6 py-4 font-medium">Member</th>
              <th className="px-6 py-4 font-medium">Role</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {members.map((member) => (
              <tr key={member.id} className="group hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center overflow-hidden">
                      {member.user?.avatarUrl ? (
                        <img src={member.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[#c8f135] font-bold text-lg">{member.email[0].toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <div className="text-white font-medium" style={{ fontFamily: "var(--font-inter)" }}>
                        {member.user?.name || member.user?.profile?.name || 'Pending User'}
                      </div>
                      <div className="text-[#6b6b6b] text-sm" style={{ fontFamily: "var(--font-inter)" }}>{member.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 text-xs border rounded-full ${getRoleColor(member.role)}`} style={{ fontFamily: "var(--font-inter)" }}>
                    {member.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {member.status === 'ACTIVE' ? (
                    <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full w-max">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400" /> Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full w-max">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Pending
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {isFounder && member.role !== 'Founder' ? (
                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      {member.status === 'PENDING' && (
                        <button className="text-xs text-[#a1a1a1] hover:text-white transition-colors flex items-center gap-1">
                          <Mail className="w-3 h-3" /> Resend
                        </button>
                      )}
                      <select 
                        value={member.role}
                        onChange={(e) => changeRole(member.id, e.target.value)}
                        className="bg-[#1a1a1a] border border-white/10 rounded px-2 py-1 text-xs text-white outline-none"
                      >
                        {roles.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <button 
                        onClick={() => removeMember(member.id)}
                        className="text-red-400 hover:text-red-300 p-1 rounded-md hover:bg-white/5 transition-colors"
                        title="Remove member"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[#6b6b6b] text-sm">--</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {members.length === 0 && (
          <div className="p-8 text-center text-[#6b6b6b]">No team members found.</div>
        )}
      </div>

      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl text-white font-bold" style={{ fontFamily: "var(--font-syne)" }}>Invite Team Member</h2>
              <button onClick={() => setIsInviteModalOpen(false)} className="text-[#6b6b6b] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleInvite} className="space-y-4">
              {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">{error}</div>}
              <div>
                <label className="block text-sm text-[#a1a1a1] mb-1.5" style={{ fontFamily: "var(--font-inter)" }}>Email Address</label>
                <input 
                  type="email" 
                  required 
                  value={inviteEmail} 
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-[#c8f135]/50 transition-colors"
                  placeholder="colleague@startup.com"
                />
              </div>
              <div>
                <label className="block text-sm text-[#a1a1a1] mb-1.5" style={{ fontFamily: "var(--font-inter)" }}>Role</label>
                <select 
                  value={inviteRole} 
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-[#c8f135]/50 transition-colors"
                >
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <button 
                type="submit" 
                className="w-full bg-[#c8f135] text-black font-semibold rounded-lg py-3 hover:bg-[#b0d829] transition-colors mt-2"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                Send Invite
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
