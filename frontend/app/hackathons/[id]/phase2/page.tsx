"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Lock, ArrowLeft, Loader2, Sparkles, AlertTriangle, Gift, Edit2, X, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function Phase2Page() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<any>(null);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    teamName: "",
    college: "",
    preferences: "",
    members: [] as { name: string; email: string; phone: string }[],
  });
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");

  const checkAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError("Enter a valid 10-digit Indian phone number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API}/api/hackathons/${id}/submissions/status?phone=${phone}`);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || "Registration not found.");

      if (data.data?.submission?.status !== "SELECTED") {
        throw new Error("You have not been selected for Phase 2 yet.");
      }

      let parsedMembers = data.data.members;
      if (typeof parsedMembers === "string") {
        try { parsedMembers = JSON.parse(parsedMembers); } catch(e) { parsedMembers = []; }
      }

      setStatus({
        ...data.data,
        members: parsedMembers || []
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setUpdateError("");
    setUpdateSuccess("");

    try {
      let parsedPrefs = null;
      if (editForm.preferences) {
        try {
          parsedPrefs = JSON.parse(editForm.preferences);
        } catch (e) {
          // If not valid JSON, just pass it as a string inside an object or leave as string
          parsedPrefs = { note: editForm.preferences };
        }
      }

      const res = await fetch(`${API}/api/hackathons/${id}/leads/${status.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamName: editForm.teamName,
          college: editForm.college,
          preferences: parsedPrefs,
          members: editForm.members,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update details.");

      setStatus({
        ...status,
        teamName: editForm.teamName || status.teamName,
        college: editForm.college || status.college,
        preferences: parsedPrefs || status.preferences,
        members: editForm.members,
        teamCount: 1 + editForm.members.length,
      });
      setUpdateSuccess("Details updated successfully!");
      setTimeout(() => setIsEditing(false), 2000);
    } catch (err: any) {
      setUpdateError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const openEditModal = () => {
    setEditForm({
      teamName: status.teamName || "",
      college: status.college || "",
      preferences: status.preferences ? (typeof status.preferences === "string" ? status.preferences : status.preferences.note || JSON.stringify(status.preferences, null, 2)) : "",
      members: status.members || [],
    });
    setIsEditing(true);
    setUpdateSuccess("");
    setUpdateError("");
  };

  if (status) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col pt-24 pb-12 px-4 font-sans">
        <div className="max-w-4xl mx-auto w-full">
          <Link href={`/hackathons/${id}`} className="inline-flex items-center gap-2 text-sm text-[#888] hover:text-white transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Back to Hackathon
          </Link>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#111] border border-white/10 rounded-2xl p-8 md:p-12 text-center">
            <span className="text-6xl mb-6 inline-block">🚀</span>
            <h1 className="text-3xl md:text-5xl font-bold mb-4" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
              Welcome to Phase 2, {status.name}!
            </h1>
            <p className="text-[#a1a1a1] mb-8 max-w-xl mx-auto">
              Congratulations on making it to the offline round. This page will contain the private Discord invites, schedule, and team matching tools.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left mt-8">
              <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/5">
                <h3 className="font-bold text-[#c8f135] mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Next Steps</h3>
                <ul className="text-sm text-[#888] space-y-2 list-disc list-inside">
                  <li>Join the private community</li>
                  <li>Review the logistics and venue map</li>
                  <li>Confirm your team's arrival time</li>
                </ul>
              </div>
              <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/5 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-[#c8f135] mb-2 flex items-center gap-2"><Gift className="w-4 h-4" /> Benefits & Discounts</h3>
                  <p className="text-sm text-[#888] mb-4">
                    Official registration will open soon here with exclusive discounts only for you and other shortlisted candidates.
                  </p>
                  <div className="text-xs text-[#a1a1a1] space-y-2 mb-4 bg-white/5 p-3 rounded-lg border border-white/10">
                    <p>🔥 <strong>Stay Tuned:</strong> Registration may open by 28th or 31st of July.</p>
                    <p>📅 <strong>Hackathon Dates:</strong> Tentative dates (20th and 21st) will be announced on 30th of July.</p>
                  </div>
                </div>
                <button disabled className="w-full py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-medium transition-colors opacity-50 cursor-not-allowed">
                  Opening Soon
                </button>
              </div>
              <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/5 relative flex flex-col">
                <button 
                  onClick={openEditModal}
                  className="absolute top-4 right-4 p-2 text-[#888] hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <h3 className="font-bold text-[#c8f135] mb-4">Team Details</h3>
                <div className="space-y-2 flex-1">
                  {status.teamName && (
                    <div>
                      <p className="text-xs text-[#666] uppercase tracking-wider">Team Name</p>
                      <p className="text-sm text-white font-medium">{status.teamName}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-[#666] uppercase tracking-wider">Team Size</p>
                    <p className="text-sm text-white font-medium">{status.teamCount} Members</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#666] uppercase tracking-wider">College</p>
                    <p className="text-sm text-white font-medium">{status.college}</p>
                  </div>
                  {status.members && status.members.length > 0 && (
                    <div className="pt-3 mt-3 border-t border-white/5">
                      <p className="text-xs text-[#666] uppercase tracking-wider mb-2">Members</p>
                      <ul className="text-sm text-gray-300 space-y-2">
                        {status.members.map((m: any, idx: number) => (
                          <li key={idx} className="bg-white/5 px-3 py-2 rounded-lg border border-white/5">
                            <p className="text-white font-medium">{m.name}</p>
                            <p className="text-xs text-[#888]">{m.email} · {m.phone}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Edit Modal */}
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setIsEditing(false)}
                className="absolute top-4 right-4 text-[#888] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-xl font-bold mb-6" style={{ fontFamily: "var(--font-syne), sans-serif" }}>Edit Team Details</h2>
              
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-[#888] mb-1">Team Name</label>
                  <input 
                    type="text" 
                    value={editForm.teamName}
                    onChange={(e) => setEditForm({...editForm, teamName: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-[#c8f135]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#888] mb-1">College</label>
                  <input 
                    type="text" 
                    value={editForm.college}
                    onChange={(e) => setEditForm({...editForm, college: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-[#c8f135]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#888] mb-1">Preferences (Dietary, T-Shirt Size, etc)</label>
                  <textarea 
                    value={editForm.preferences}
                    onChange={(e) => setEditForm({...editForm, preferences: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-[#c8f135]/50 h-24 resize-none"
                    placeholder="e.g. Vegetarian, Large T-Shirt"
                  />
                </div>

                <div className="pt-4 border-t border-white/10">
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-bold text-white">Team Members</label>
                    <span className="text-xs text-[#888]">{1 + editForm.members.length}/5 Max</span>
                  </div>
                  
                  <div className="space-y-4">
                    {editForm.members.map((member, index) => (
                      <div key={index} className="bg-white/5 p-4 rounded-xl border border-white/5 relative space-y-3">
                        <button
                          type="button"
                          onClick={() => {
                            const newMembers = [...editForm.members];
                            newMembers.splice(index, 1);
                            setEditForm({ ...editForm, members: newMembers });
                          }}
                          className="absolute top-3 right-3 text-[#888] hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div>
                          <input 
                            type="text" placeholder="Name" required
                            value={member.name}
                            onChange={(e) => {
                              const newMembers = [...editForm.members];
                              newMembers[index].name = e.target.value;
                              setEditForm({ ...editForm, members: newMembers });
                            }}
                            className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#c8f135]/50"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input 
                            type="email" placeholder="Email" required
                            value={member.email}
                            onChange={(e) => {
                              const newMembers = [...editForm.members];
                              newMembers[index].email = e.target.value;
                              setEditForm({ ...editForm, members: newMembers });
                            }}
                            className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#c8f135]/50"
                          />
                          <input 
                            type="tel" placeholder="Phone" required
                            value={member.phone}
                            onChange={(e) => {
                              const newMembers = [...editForm.members];
                              newMembers[index].phone = e.target.value;
                              setEditForm({ ...editForm, members: newMembers });
                            }}
                            className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#c8f135]/50"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {1 + editForm.members.length < 5 && (
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, members: [...editForm.members, { name: "", email: "", phone: "" }] })}
                      className="mt-4 w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 border-dashed rounded-lg text-sm text-[#888] hover:text-white transition-colors flex justify-center items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Add Member
                    </button>
                  )}
                </div>

                {updateError && <p className="text-red-400 text-sm">{updateError}</p>}
                {updateSuccess && <p className="text-green-400 text-sm">{updateSuccess}</p>}

                <button 
                  type="submit"
                  disabled={updating}
                  className="w-full py-3 bg-[#c8f135] text-black font-bold rounded-lg hover:bg-[#b0d829] transition-colors disabled:opacity-50 flex justify-center items-center"
                >
                  {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Details"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4">
      <Link href={`/hackathons/${id}`} className="absolute top-8 left-8 inline-flex items-center gap-2 text-sm text-[#888] hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      
      <div className="max-w-md w-full bg-[#0d0d0d] border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="w-16 h-16 bg-[#c8f135]/10 text-[#c8f135] rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-center mb-2" style={{ fontFamily: "var(--font-syne), sans-serif" }}>Phase 2 Access</h1>
        <p className="text-sm text-center text-[#888] mb-8">
          This area is restricted to participants selected for the offline hackathon. Enter your registered phone number to verify access.
        </p>

        <form onSubmit={checkAccess} className="space-y-4">
          <div>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="10-digit Phone Number"
              className="w-full px-4 py-3 bg-[#111] border border-white/10 rounded-xl text-white outline-none focus:border-[#c8f135]/50 transition-colors placeholder:text-[#4a4a4a]"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-red-400 bg-red-400/10 p-3 rounded-lg text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !phone}
            className="w-full h-12 flex items-center justify-center bg-[#c8f135] text-black font-bold rounded-xl hover:bg-[#b0d829] transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Access"}
          </button>
        </form>
      </div>
    </div>
  );
}
