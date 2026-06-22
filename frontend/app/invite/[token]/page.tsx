"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function InviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { session } = useAuth();

  const handleAccept = useCallback(async (authToken: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/startups/invites/${token}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setSuccess(true);
        localStorage.removeItem('pending_invite_token');
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setError(data.error || "Failed to accept invite");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [token, router]);

  useEffect(() => {
    if (!token) return;

    const tokenFromStorage = session?.access_token;
    
    if (!tokenFromStorage) {
      // Not logged in.
      // Store intended invite token so after login/signup they are redirected back here or it's handled automatically
      localStorage.setItem('pending_invite_token', token);
      setError("You must be logged in to accept this invite. If you don't have an account, please sign up.");
      setLoading(false);
      return;
    }

    handleAccept(tokenFromStorage);
  }, [token, session, handleAccept]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="bg-[#111111] border border-white/5 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
        {loading ? (
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-[#c8f135] animate-spin mb-4" />
            <p className="text-white" style={{ fontFamily: "var(--font-inter)" }}>Verifying invitation...</p>
          </div>
        ) : success ? (
          <div className="flex flex-col items-center">
            <CheckCircle className="w-16 h-16 text-[#c8f135] mb-4" />
            <h1 className="text-2xl text-white font-bold mb-2" style={{ fontFamily: "var(--font-syne)" }}>Invite Accepted!</h1>
            <p className="text-[#a1a1a1] mb-6" style={{ fontFamily: "var(--font-inter)" }}>You've successfully joined the team. Redirecting you to your dashboard...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
            <h1 className="text-2xl text-white font-bold mb-2" style={{ fontFamily: "var(--font-syne)" }}>Invalid Invitation</h1>
            <p className="text-[#a1a1a1] mb-6" style={{ fontFamily: "var(--font-inter)" }}>{error}</p>
            {!session?.access_token ? (
              <div className="flex gap-4 w-full">
                <Link href="/login" className="flex-1 py-3 border border-white/10 text-white rounded-lg hover:bg-white/5 transition-colors font-medium">Log In</Link>
                <Link href="/signup" className="flex-1 py-3 bg-[#c8f135] text-black rounded-lg hover:bg-[#b0d829] transition-colors font-medium">Sign Up</Link>
              </div>
            ) : (
              <Link href="/dashboard" className="w-full inline-block py-3 border border-white/10 text-white rounded-lg hover:bg-white/5 transition-colors font-medium">Go to Dashboard</Link>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
