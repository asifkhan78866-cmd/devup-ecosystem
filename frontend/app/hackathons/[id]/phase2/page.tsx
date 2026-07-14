"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Lock, ArrowLeft, Loader2, Sparkles, AlertTriangle } from "lucide-react";
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

      setStatus(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mt-8">
              <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/5">
                <h3 className="font-bold text-[#c8f135] mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Next Steps</h3>
                <ul className="text-sm text-[#888] space-y-2 list-disc list-inside">
                  <li>Join the private community</li>
                  <li>Review the logistics and venue map</li>
                  <li>Confirm your team's arrival time</li>
                </ul>
              </div>
              <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/5">
                <h3 className="font-bold text-[#c8f135] mb-2">Team Details</h3>
                <p className="text-sm text-[#888]">Team Size: {status.teamCount}</p>
                <p className="text-sm text-[#888]">College: {status.college}</p>
              </div>
            </div>
          </motion.div>
        </div>
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
