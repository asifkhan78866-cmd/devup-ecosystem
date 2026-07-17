"use client";

import { useAuth } from "@/lib/auth/AuthProvider";
import ProtectedContent from "@/components/auth/ProtectedContent";
import Link from "next/link";
import { Settings, Bell, Shield, Key } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <ProtectedContent blurRadius={12} message="Login to View Settings">
      <div className="min-h-screen bg-[#0a0a0a] pt-32 pb-24">
        <div className="max-w-3xl mx-auto px-6 md:px-8">
          <Link href="/dashboard" className="text-[#c8f135] text-sm hover:underline mb-8 inline-block">
            &larr; Back to Dashboard
          </Link>
          
          <h1 style={{ fontFamily: "var(--font-syne)", fontWeight: 800 }} className="text-3xl text-white mb-2">
            Account Settings
          </h1>
          <p style={{ fontFamily: "var(--font-inter)" }} className="text-[#a1a1a1] mb-10">
            Manage your account preferences and security.
          </p>

          <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden">
            
            <div className="p-6 border-b border-white/5 hover:bg-white/[0.02] cursor-not-allowed transition-colors flex items-center justify-between opacity-60">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center text-[#c8f135]">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Notifications</h3>
                  <p className="text-[#a1a1a1] text-sm mt-0.5">Manage email and push notifications</p>
                </div>
              </div>
              <span className="text-xs border border-white/10 px-2 py-1 rounded bg-[#1a1a1a] text-[#888]">Soon</span>
            </div>

            <div className="p-6 border-b border-white/5 hover:bg-white/[0.02] cursor-not-allowed transition-colors flex items-center justify-between opacity-60">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center text-[#c8f135]">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Privacy</h3>
                  <p className="text-[#a1a1a1] text-sm mt-0.5">Control what others can see</p>
                </div>
              </div>
              <span className="text-xs border border-white/10 px-2 py-1 rounded bg-[#1a1a1a] text-[#888]">Soon</span>
            </div>

            <div className="p-6 hover:bg-white/[0.02] cursor-not-allowed transition-colors flex items-center justify-between opacity-60">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center text-[#c8f135]">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Security</h3>
                  <p className="text-[#a1a1a1] text-sm mt-0.5">Update password and 2FA</p>
                </div>
              </div>
              <span className="text-xs border border-white/10 px-2 py-1 rounded bg-[#1a1a1a] text-[#888]">Soon</span>
            </div>
            
          </div>
        </div>
      </div>
    </ProtectedContent>
  );
}
