"use client";

import { useAuth } from "@/lib/auth/AuthProvider";
import ProtectedContent from "@/components/auth/ProtectedContent";
import Link from "next/link";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <ProtectedContent blurRadius={12} message="Login to View Profile">
      <div className="min-h-screen bg-[#0a0a0a] pt-32 pb-24">
        <div className="max-w-3xl mx-auto px-6 md:px-8">
          <Link href="/dashboard" className="text-[#c8f135] text-sm hover:underline mb-8 inline-block">
            &larr; Back to Dashboard
          </Link>
          
          <h1 style={{ fontFamily: "var(--font-syne)", fontWeight: 800 }} className="text-3xl text-white mb-2">
            Your Profile
          </h1>
          <p style={{ fontFamily: "var(--font-inter)" }} className="text-[#a1a1a1] mb-10">
            Manage your personal information and developer identity.
          </p>

          <div className="bg-[#111111] border border-white/5 rounded-2xl p-8">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-24 h-24 rounded-full bg-[#1a1a1a] border border-white/10 overflow-hidden flex items-center justify-center text-3xl font-bold text-[#c8f135]">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user?.name?.[0]?.toUpperCase() || 'U'
                )}
              </div>
              <div>
                <h2 className="text-2xl text-white font-bold">{user?.name}</h2>
                <p className="text-[#a1a1a1]">{user?.email}</p>
                <span className="inline-block mt-3 px-3 py-1 bg-[#c8f135]/10 text-[#c8f135] rounded-full text-xs font-semibold tracking-wider uppercase border border-[#c8f135]/20">
                  {user?.role}
                </span>
              </div>
            </div>

            <hr className="border-white/5 mb-8" />

            <div className="text-center p-8 bg-[#0a0a0a] rounded-xl border border-white/5">
              <p className="text-[#a1a1a1] text-sm">Full profile editing and portfolio management are coming soon!</p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedContent>
  );
}
