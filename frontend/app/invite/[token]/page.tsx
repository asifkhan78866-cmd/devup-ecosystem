"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { createClient } from "@/lib/supabase";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const inputClass =
  "w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-[#c8f135]/50 transition-colors";

export default function InviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;
  const { user, session, loading: authLoading } = useAuth();

  const [invite, setInvite] = useState<any>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [fatalError, setFatalError] = useState("");
  const [success, setSuccess] = useState(false);

  const [accepting, setAccepting] = useState(false);
  const [actionError, setActionError] = useState("");

  // new-account form
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load invite details so we can show the startup and pick the right flow.
  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/startups/invites/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setInvite(d.data);
        else setFatalError(d.error || "This invite is invalid.");
      })
      .catch(() => setFatalError("Could not load this invite."))
      .finally(() => setLoadingInvite(false));
  }, [token]);

  // Existing account: accept using the current session (or send to login first).
  const handleAcceptExisting = useCallback(async () => {
    const authToken = session?.access_token;
    if (!authToken) {
      localStorage.setItem("pending_invite_token", token);
      router.push("/login");
      return;
    }
    setAccepting(true);
    setActionError("");
    try {
      const res = await fetch(`${API}/api/startups/invites/${token}/accept`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success) {
        localStorage.removeItem("pending_invite_token");
        setSuccess(true);
        setTimeout(() => router.push("/dashboard/startup"), 1500);
      } else {
        setActionError(data.error || "Failed to accept invite");
      }
    } catch (err: any) {
      setActionError(err?.message || "Something went wrong");
    } finally {
      setAccepting(false);
    }
  }, [session, token, router]);

  // New account: set password, create the account, then sign in and land on the dashboard.
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setActionError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setActionError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    setActionError("");
    try {
      const res = await fetch(`${API}/api/startups/invites/${token}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, name }),
      });
      const data = await res.json();
      if (!data.success) {
        setActionError(data.error || "Failed to create your account");
        setSubmitting(false);
        return;
      }
      const supabase = createClient();
      await supabase.auth.signInWithPassword({ email: invite.email, password });
      localStorage.removeItem("pending_invite_token");
      setSuccess(true);
      setTimeout(() => router.push("/dashboard/startup"), 1500);
    } catch (err: any) {
      setActionError(err?.message || "Something went wrong");
      setSubmitting(false);
    }
  };

  const emailMatches =
    Boolean(session) && user?.email?.toLowerCase() === invite?.email?.toLowerCase();

  const shellClass = "min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4";
  const cardClass = "bg-[#111111] border border-white/5 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl";

  if (loadingInvite || authLoading) {
    return (
      <div className={shellClass}>
        <div className={cardClass}>
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-[#c8f135] animate-spin mb-4" />
            <p className="text-white" style={{ fontFamily: "var(--font-inter)" }}>Verifying invitation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className={shellClass}>
        <div className={cardClass}>
          <CheckCircle className="w-16 h-16 text-[#c8f135] mb-4 mx-auto" />
          <h1 className="text-2xl text-white font-bold mb-2" style={{ fontFamily: "var(--font-syne)" }}>You&apos;re in! 🎉</h1>
          <p className="text-[#a1a1a1]" style={{ fontFamily: "var(--font-inter)" }}>Taking you to your startup dashboard...</p>
        </div>
      </div>
    );
  }

  if (fatalError || !invite || invite.consumed) {
    return (
      <div className={shellClass}>
        <div className={cardClass}>
          <AlertTriangle className="w-16 h-16 text-red-500 mb-4 mx-auto" />
          <h1 className="text-2xl text-white font-bold mb-2" style={{ fontFamily: "var(--font-syne)" }}>Invitation unavailable</h1>
          <p className="text-[#a1a1a1] mb-6" style={{ fontFamily: "var(--font-inter)" }}>
            {fatalError || (invite?.consumed ? "This invite has already been used." : "This invite is invalid.")}
          </p>
          <Link href="/dashboard" className="w-full inline-block py-3 border border-white/10 text-white rounded-lg hover:bg-white/5 transition-colors font-medium">Go to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <div className={cardClass}>
        <h1 className="text-2xl text-white font-bold mb-2" style={{ fontFamily: "var(--font-syne)" }}>
          Join {invite.startupName || "the team"}
        </h1>
        <p className="text-[#a1a1a1] mb-6" style={{ fontFamily: "var(--font-inter)" }}>
          You&apos;ve been invited as a founder ({invite.email}).
        </p>

        {actionError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm text-left">{actionError}</div>
        )}

        {invite.hasAccount ? (
          Boolean(session) && !emailMatches ? (
            <p className="text-[#a1a1a1] text-sm" style={{ fontFamily: "var(--font-inter)" }}>
              This invite is for <span className="text-white">{invite.email}</span>, but you&apos;re logged in as someone else. Log out and sign in with the invited email to accept.
            </p>
          ) : (
            <button
              onClick={handleAcceptExisting}
              disabled={accepting}
              className="w-full bg-[#c8f135] text-black font-semibold rounded-lg py-3 hover:bg-[#b0d829] transition-colors disabled:opacity-60"
            >
              {accepting ? "Accepting..." : session ? "Accept invite" : "Log in to accept"}
            </button>
          )
        ) : (
          <form onSubmit={handleRegister} className="space-y-4 text-left">
            <div>
              <label className="block text-sm text-[#a1a1a1] mb-1.5">Your name</label>
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Founder" />
            </div>
            <div>
              <label className="block text-sm text-[#a1a1a1] mb-1.5">Password</label>
              <input type="password" required className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
            </div>
            <div>
              <label className="block text-sm text-[#a1a1a1] mb-1.5">Confirm password</label>
              <input type="password" required className={inputClass} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#c8f135] text-black font-semibold rounded-lg py-3 hover:bg-[#b0d829] transition-colors disabled:opacity-60"
            >
              {submitting ? "Setting up..." : "Set password & join"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
