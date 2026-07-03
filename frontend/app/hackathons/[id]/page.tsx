"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Calendar, MapPin, Clock, Trophy, Users, Gift,
  Shield, Wifi, ChevronRight, Sparkles, Zap, Ticket, Download,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import confetti from "canvas-confetti";
import HackathonSchema, { BreadcrumbSchema } from "@/components/seo/HackathonSchema";
import HackathonFAQ from "@/components/seo/HackathonFAQ";

// Pretty-print the uppercase Prisma enum mode (ONLINE -> Online)
const prettyMode = (mode?: string) =>
  mode ? mode.charAt(0).toUpperCase() + mode.slice(1).toLowerCase() : "";

// ─── API BASE ───
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// ─── GOOGLE FORM CONFIG ───
const GOOGLE_FORM_BASE =
  "https://docs.google.com/forms/d/e/1FAIpQLSfIeZHduzGgeOBS-M2awHxkp4kk-MHIFK50sZ5pqYiOJ2vIYQ/viewform";

// ─── TIMELINE DATA ───
type TimelineSlot = { time: string; title: string; description: string; icon: string };
type TimelineDay = { date: string; label: string; subtitle: string; slots: TimelineSlot[] };

const TIMELINE: TimelineDay[] = [
  {
    date: "Jul 4, 2026",
    label: "DAY 1",
    subtitle: "The Ignition Phase",
    slots: [
      { time: "08:00–09:30", title: "Registration & Check-in", description: "ID verification, participant kits distribution, venue orientation", icon: "📋" },
      { time: "09:30–10:30", title: "Opening Ceremony", description: "Keynote address, rules overview, sponsor introductions", icon: "🎤" },
      { time: "10:30–11:30", title: "Problem Release", description: "Tracks & problem statements unveiled by industry veterans", icon: "🚀" },
      { time: "11:30–13:30", title: "Sprint Begins", description: "Architectural planning, team formation, networking lunch", icon: "🍽️" },
      { time: "13:30–18:00", title: "Development Sprint", description: "36-hour clock goes live, mentoring sessions begin", icon: "💻" },
      { time: "18:00–22:00", title: "Evening Session", description: "High tea, networking rounds, intensive coding continues", icon: "☕" },
      { time: "22:00–00:00", title: "Surprise Activity #1", description: "Mini-challenges, secret swag drops, midnight energy", icon: "🎁" },
    ],
  },
  {
    date: "Jul 5, 2026",
    label: "DAY 2",
    subtitle: "The Final Sprint",
    slots: [
      { time: "00:00–04:00", title: "Midnight Zone", description: "Founder fireside chats, product reviews, late-night coding", icon: "🌙" },
      { time: "07:00–11:00", title: "Final Sprint", description: "UI/UX refinement, code integration, bug fixing", icon: "⚡" },
      { time: "11:00–13:00", title: "Project Submission", description: "Final commits, video demos, documentation wraps", icon: "📦" },
      { time: "13:00–16:00", title: "Jury Evaluation", description: "Live pitching sessions, expert panel Q&A", icon: "👨‍⚖️" },
      { time: "16:00–18:00", title: "Grand Finale", description: "Awards ceremony, internship announcements, closing", icon: "🏆" },
    ],
  },
];

const DOMAIN_COLORS = ["#c8f135", "#a78bfa", "#38bdf8", "#fb923c", "#f472b6"];

const DOMAINS = [
  { label: "AI & ML", sub: "GenAI, Predictive Analytics", color: "#c8f135" },
  { label: "Cybersecurity & Blockchain", sub: "Smart contracts, Pen testing", color: "#a78bfa" },
  { label: "Web & Mobile Dev", sub: "Full-stack, PWA, Flutter", color: "#38bdf8" },
  { label: "Cloud & IoT", sub: "Edge computing, Serverless", color: "#fb923c" },
  { label: "Social Impact", sub: "Accessibility, GreenTech", color: "#f472b6" },
];

const PERKS = [
  { icon: "🏆", title: "₹1,00,000+ Prize Pool", desc: "Cash prizes & trophies for top teams" },
  { icon: "💼", title: "Paid Internships", desc: "3-month internships, ₹25k–₹75k/mo stipend for top performers" },
  { icon: "📜", title: "Certificates", desc: "Verified national participation & merit certificates" },
  { icon: "🎧", title: "Premium Swag", desc: "Mechanical keyboards, smartwatches, earbuds, hoodies" },
  { icon: "🤝", title: "Industry Networking", desc: "Expert mentoring & real-world problem-solving" },
  { icon: "📦", title: "Mystery Boxes", desc: "'I Survived Vynedam 2K26' merch & surprise gifts" },
];

// Logistics icons are keyed by string so they can come from the DB (Json) too.
const LOGISTICS_ICONS: Record<string, LucideIcon> = {
  shield: Shield, accommodation: Shield,
  meals: Gift, gift: Gift,
  wifi: Wifi, internet: Wifi,
  support: Users, users: Users,
  clock: Clock, calendar: Calendar, trophy: Trophy,
};

const LOGISTICS = [
  { icon: "shield", label: "Accommodation", desc: "Separate male/female dorms on campus" },
  { icon: "meals", label: "5 Meals + Refreshments", desc: "24/7 snacks, tea, coffee, energy drinks" },
  { icon: "wifi", label: "1 Gbps Internet", desc: "Dedicated fiber + power backup" },
  { icon: "support", label: "On-site Support", desc: "Paramedic, security, volunteer crew" },
];

const DEFAULT_OVERVIEW =
  "VYNEDAM Talent Hunt 2K26 is a national-level 36-hour non-stop offline innovation marathon bridging academia and industry. Students, developers, and aspiring entrepreneurs come together to solve high-impact, real-world problems curated by industry veterans across five critical technology domains. This is not just a hackathon — it's a launchpad for your career, with guaranteed internships, world-class mentorship, and a stage to prove your potential.";

const DEFAULT_SUBTITLE = "36-Hour Non-Stop Offline National Innovation Challenge";

// ─── REGISTER MODAL ───
function RegisterModal({
  isOpen,
  onClose,
  hackathonId,
  registrationLink,
}: {
  isOpen: boolean;
  onClose: () => void;
  hackathonId: string;
  registrationLink: string | null;
}) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [form, setForm] = useState({ name: "", phone: "", teamCount: 1, college: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = "Name must be at least 2 characters";
    if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = "Enter a valid 10-digit Indian phone number";
    if (form.teamCount < 1 || form.teamCount > 5) e.teamCount = "Team count must be 1–5";
    if (form.college.trim().length < 2) e.college = "College must be at least 2 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const fireConfetti = useCallback(() => {
    const colors = ["#c8f135", "#ffffff", "#FFD700", "#a78bfa", "#38bdf8"];
    const end = Date.now() + 2500;
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
    // Big center burst
    setTimeout(() => {
      confetti({ particleCount: 100, spread: 100, origin: { y: 0.6 }, colors });
    }, 300);
  }, []);

  const triggerRedirect = async (leadId: string) => {
    try {
      await fetch(`${API}/api/hackathons/${hackathonId}/lead/${leadId}/redirect`, { method: "PATCH" });
    } catch (e) {
      // Ignore errors on redirect tracking
    }
    window.open(registrationLink || GOOGLE_FORM_BASE, "_blank");
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/hackathons/${hackathonId}/lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          teamCount: form.teamCount,
          college: form.college.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.errors?.[0]?.message || data?.error || data?.message || "Registration failed");
      const newLeadId = data.data?.registrationId || null;
      setRegistrationId(newLeadId);
      setStep("success");
      fireConfetti();

      // Auto-redirect after 2.5s
      setTimeout(() => {
        if (newLeadId) triggerRedirect(newLeadId);
      }, 2500);
    } catch (err: any) {
      setErrors({ submit: err.message || "Something went wrong" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinueToForm = () => {
    if (registrationId) triggerRedirect(registrationId);
    else window.open(registrationLink || GOOGLE_FORM_BASE, "_blank");
  };

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep("form");
      setForm({ name: "", phone: "", teamCount: 1, college: "" });
      setErrors({});
      setRegistrationId(null);
    }
  }, [isOpen]);

  // text-base (16px) on mobile prevents iOS auto-zoom on focus; text-sm on desktop keeps the original look.
  const inputClass =
    "w-full px-4 py-3 bg-[#111] border border-white/10 rounded-xl text-white text-base md:text-sm outline-none focus:border-[#c8f135]/50 transition-colors placeholder:text-[#4a4a4a]";

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[300]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[300] flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-2xl overflow-y-auto overflow-x-hidden max-h-[90dvh]">
              {step === "form" ? (
                <div className="p-6">
                  <h2
                    className="text-xl font-bold text-white mb-1"
                    style={{ fontFamily: "var(--font-syne), sans-serif" }}
                  >
                    Register Now
                  </h2>
                  <p
                    className="text-sm text-[#6b6b6b] mb-6"
                    style={{ fontFamily: "var(--font-inter), sans-serif" }}
                  >
                    Secure your spot — we&apos;ll redirect you to the official form next.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-[#888] mb-1.5">Full Name *</label>
                      <input
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        className={inputClass}
                        placeholder="Your full name"
                      />
                      {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-xs text-[#888] mb-1.5">Phone Number *</label>
                      <input
                        value={form.phone}
                        onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                        className={inputClass}
                        placeholder="10-digit Indian phone number"
                        inputMode="numeric"
                      />
                      {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                    </div>
                    <div>
                      <label className="block text-xs text-[#888] mb-1.5">Team Size (max 5) *</label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, teamCount: Math.max(1, p.teamCount - 1) }))}
                          className="w-12 h-12 rounded-xl bg-[#111] border border-white/10 text-white text-xl font-bold flex items-center justify-center hover:bg-white/5 active:scale-95 transition-all"
                        >
                          −
                        </button>
                        <div
                          className="flex-1 h-12 bg-[#111] border border-white/10 rounded-xl flex items-center justify-center text-white text-lg font-bold"
                          style={{ fontFamily: "var(--font-syne), sans-serif" }}
                        >
                          {form.teamCount}
                        </div>
                        <button
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, teamCount: Math.min(5, p.teamCount + 1) }))}
                          className="w-12 h-12 rounded-xl bg-[#111] border border-white/10 text-white text-xl font-bold flex items-center justify-center hover:bg-white/5 active:scale-95 transition-all"
                        >
                          +
                        </button>
                      </div>
                      {errors.teamCount && <p className="text-red-400 text-xs mt-1">{errors.teamCount}</p>}
                    </div>
                    <div>
                      <label className="block text-xs text-[#888] mb-1.5">College / University *</label>
                      <input
                        value={form.college}
                        onChange={(e) => setForm((p) => ({ ...p, college: e.target.value }))}
                        className={inputClass}
                        placeholder="Your institution name"
                      />
                      {errors.college && <p className="text-red-400 text-xs mt-1">{errors.college}</p>}
                    </div>
                  </div>

                  {errors.submit && (
                    <p className="text-red-400 text-sm mt-4 text-center">{errors.submit}</p>
                  )}

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={onClose}
                      className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-[#888] text-sm font-medium hover:bg-white/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex-1 px-4 py-3 rounded-xl bg-[#c8f135] text-black text-sm font-bold hover:bg-[#b0d829] transition-colors disabled:opacity-50"
                    >
                      {submitting ? "Submitting..." : "Register →"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 12 }}
                    className="text-6xl mb-4"
                  >
                    🎉
                  </motion.div>
                  <h2
                    className="text-2xl font-bold text-white mb-2"
                    style={{ fontFamily: "var(--font-syne), sans-serif" }}
                  >
                    You&apos;re in!
                  </h2>
                  <p className="text-sm text-[#a1a1a1] mb-2" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
                    You will be receiving your ticket shortly after your registration is completed by DevUp Ecosystem.
                  </p>
                  <p className="text-xs text-[#6b6b6b] mb-6" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
                    One last step — complete your official registration on the form below.
                  </p>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleContinueToForm}
                      className="px-6 py-3 rounded-xl bg-[#c8f135] text-black text-sm font-bold hover:bg-[#b0d829] transition-colors"
                    >
                      Continue to Official Form →
                    </button>

                    <a
                      href="tel:+919100770398"
                      className="flex items-center justify-center px-6 py-3 rounded-xl bg-[#111] border border-white/10 text-white text-sm font-bold hover:bg-[#222] transition-colors"
                    >
                      📞 Queries? Call +91 9100770398
                    </a>
                  </div>

                  <button
                    onClick={onClose}
                    className="block mx-auto mt-4 text-xs text-[#6b6b6b] hover:text-white transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ─── MAIN PAGE ───
export default function HackathonDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [hackathon, setHackathon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    fetch(`${API}/api/hackathons/${id}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setHackathon(d.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!hackathon?.registrationDeadline) return;
    const tick = () => {
      const diff = new Date(hackathon.registrationDeadline).getTime() - Date.now();
      if (diff <= 0) return setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [hackathon?.registrationDeadline]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#c8f135]/30 border-t-[#c8f135] rounded-full animate-spin" />
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg mb-4">Hackathon not found</p>
          <Link href="/hackathons" className="text-[#c8f135] hover:underline text-sm">← Back to Hackathons</Link>
        </div>
      </div>
    );
  }

  const bannerSrc = hackathon.bannerUrl || "/images/vynedam-talent-hunt-2k26.jpeg";
  const startDate = new Date(hackathon.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const endDate = new Date(hackathon.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  // ─── DATA-DRIVEN CONTENT (falls back to built-in defaults when a field is empty) ───
  const subtitle = hackathon.subtitle || DEFAULT_SUBTITLE;
  const overview = hackathon.description || DEFAULT_OVERVIEW;
  // Prefer the rich per-event cards; fall back to the full default domain cards
  // (with their sub-lines) so existing hackathons keep all their detail.
  const domains: { label: string; sub?: string; color?: string }[] =
    hackathon.domainsDetailed?.length ? hackathon.domainsDetailed : DOMAINS;
  const timeline = hackathon.timeline?.length ? hackathon.timeline : TIMELINE;
  const perks = hackathon.perks?.length ? hackathon.perks : PERKS;
  const logistics = hackathon.logistics?.length ? hackathon.logistics : LOGISTICS;

  const isClosed = new Date(hackathon.registrationDeadline).getTime() <= Date.now();
  const openRegister = () => { if (!isClosed) setShowRegister(true); };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Back nav */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-[100px] md:pt-[120px]">
        <Link
          href="/hackathons"
          className="inline-flex items-center gap-2 text-[#6b6b6b] hover:text-white text-sm transition-colors"
          style={{ fontFamily: "var(--font-inter), sans-serif" }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Hackathons
        </Link>
      </div>

      {/* ─── HERO ─── */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-7xl mx-auto px-4 md:px-8 mt-6"
      >
        <div className="relative rounded-[20px] overflow-hidden border border-white/10">
          {/* Banner image */}
          <div className="relative w-full h-[280px] md:h-[380px]">
            <Image
              src={bannerSrc}
              alt={hackathon.title}
              fill
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
          </div>

          {/* Hero content overlay */}
          <div className="relative -mt-40 px-8 pb-8 z-10">
            <div className="flex flex-wrap gap-2 mb-4">
              <span
                className="px-3 py-1 bg-[rgba(200,241,53,0.15)] border border-[rgba(200,241,53,0.3)] text-[#c8f135] rounded-full"
                style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em" }}
              >
                {prettyMode(hackathon.mode)}
              </span>
              {hackathon.isFeatured && (
                <span
                  className="px-3 py-1 bg-[rgba(167,139,250,0.1)] border border-[rgba(167,139,250,0.3)] text-[#a78bfa] rounded-full"
                  style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", fontWeight: 600 }}
                >
                  FEATURED
                </span>
              )}
            </div>

            <h1
              className="text-3xl md:text-5xl font-bold text-white mb-2"
              style={{ fontFamily: "var(--font-syne), sans-serif", lineHeight: 1.1 }}
            >
              {hackathon.title}
            </h1>
            <p className="text-sm text-[#a1a1a1] mb-4" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
              {subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-6 text-sm text-[#888]" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
              <span className="flex items-center gap-1.5"><Trophy className="w-4 h-4 text-[#c8f135]" /> {hackathon.prizePool} Prize Pool</span>
              {hackathon.registrationFee && (
                <span className="flex items-center gap-1.5"><Ticket className="w-4 h-4 text-[#c8f135]" /> Registration Fee: {hackathon.registrationFee}</span>
              )}
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-[#c8f135]" /> {startDate} – {endDate}</span>
              {hackathon.location && (
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#c8f135]" /> {hackathon.location}</span>
              )}
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-[#c8f135]" /> 36 Hours Non-Stop</span>
            </div>

            {id === 'f40eb44c-138c-4b86-86bd-2da45ae60b3a' && (
              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="/vynedam-problem-statements.pdf"
                  download="VYNEDAM_Talent_Hunt_2K26_Problem_Statements.pdf"
                  className="inline-flex items-center gap-2 h-[48px] px-6 bg-[#c8f135]/10 border border-[#c8f135]/30 text-[#c8f135] font-bold rounded-xl hover:bg-[#c8f135]/20 transition-all"
                  style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px" }}
                >
                  <Download className="w-4 h-4" /> Official Problem Statement Book
                </a>
              </div>
            )}

            {/* Presented By Strip */}
            {hackathon.partners && hackathon.partners.length > 0 && (
              <div className="mt-8 pt-6 border-t border-white/5">
                <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "10px", color: "#6b6b6b", letterSpacing: "0.1em", marginBottom: "12px" }}>
                  PRESENTED BY
                </div>
                <div className="flex flex-wrap gap-4 items-center">
                  {hackathon.partners.map((p: any) => (
                    <div key={p.id} className="group relative flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
                      {p.logoUrl ? (
                        <img 
                          src={p.logoUrl} 
                          alt={p.name} 
                          className="w-8 h-8 object-contain filter md:grayscale md:group-hover:grayscale-0 transition-all" 
                        />
                      ) : (
                        <span className="text-xs font-bold text-gray-400 group-hover:text-white" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
                          {p.name.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                      {/* Tooltip */}
                      <div className="absolute -top-8 bg-black border border-white/10 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {p.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.section>

      {/* ─── COUNTDOWN ─── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="max-w-7xl mx-auto px-4 md:px-8 mt-8"
      >
        <div className="bg-[#111] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-xs text-[#6b6b6b] uppercase tracking-widest mb-1" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
              {isClosed ? "Registration closed" : "Registration closes in"}
            </p>
            <div className="flex items-center gap-2 sm:gap-3">
              {(["days", "hours", "minutes", "seconds"] as const).map((unit, i) => (
                <div key={unit} className="flex items-center gap-2 sm:gap-3">
                  <div className="text-center">
                    <div
                      className="w-[clamp(46px,15vw,60px)] h-[clamp(46px,15vw,60px)] bg-[#0a0a0a] border border-white/10 rounded-xl flex items-center justify-center"
                      style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "clamp(20px, 6vw, 28px)", fontWeight: 700, color: "#fff" }}
                    >
                      {countdown[unit].toString().padStart(2, "0")}
                    </div>
                    <span className="text-[10px] text-[#6b6b6b] mt-1 block uppercase">{unit}</span>
                  </div>
                  {i < 3 && <span className="text-[#4a4a4a] text-lg sm:text-xl pb-5">:</span>}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            {id === 'f40eb44c-138c-4b86-86bd-2da45ae60b3a' && (
              <a
                href="/vynedam-problem-statements.pdf"
                download="VYNEDAM_Talent_Hunt_2K26_Problem_Statements.pdf"
                className="h-[52px] px-8 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "15px" }}
              >
                <Download className="w-5 h-5" /> Problem Statements
              </a>
            )}
            <button
              onClick={openRegister}
              disabled={isClosed}
              className="h-[52px] px-10 bg-[#c8f135] text-black font-bold rounded-xl hover:bg-[#b0d829] transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-[#c8f135]"
              style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "15px" }}
            >
              {isClosed ? "Closed" : "Register Now"}
            </button>
          </div>
        </div>
      </motion.section>

      {/* ─── OVERVIEW ─── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="max-w-7xl mx-auto px-4 md:px-8 mt-12"
      >
        <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
          Overview
        </h2>
        <div className="bg-[#111] border border-white/5 rounded-2xl p-6 md:p-8">
          <p className="text-[#a1a1a1] leading-relaxed whitespace-pre-line" style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px" }}>
            {overview}
          </p>
        </div>
      </motion.section>

      {/* ─── DOMAINS ─── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5 }}
        className="max-w-7xl mx-auto px-4 md:px-8 mt-12"
      >
        <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
          Core Technical Domains
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {domains.map((d, i) => (
            <motion.div
              key={`${d.label}-${i}`}
              whileHover={{ scale: 1.03, y: -2 }}
              className="bg-[#111] border border-white/5 rounded-xl p-4 group hover:border-white/15 transition-all"
            >
              <div
                className="w-2 h-2 rounded-full mb-3"
                style={{ background: d.color || DOMAIN_COLORS[i % DOMAIN_COLORS.length] }}
              />
              <h3 className="text-sm font-semibold text-white mb-1" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
                {d.label}
              </h3>
              {d.sub && (
                <p className="text-xs text-[#6b6b6b]" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
                  {d.sub}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ─── TIMELINE ─── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="max-w-7xl mx-auto px-4 md:px-8 mt-12"
      >
        <h2 className="text-2xl font-bold text-white mb-8" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
          Event Timeline
        </h2>
        <div className="space-y-12">
          {timeline.map((day: TimelineDay) => (
            <div key={day.label}>
              <div className="flex items-center gap-3 mb-6">
                <span
                  className="px-3 py-1 bg-[rgba(200,241,53,0.1)] border border-[rgba(200,241,53,0.25)] text-[#c8f135] rounded-full text-xs font-bold"
                  style={{ fontFamily: "var(--font-inter), sans-serif" }}
                >
                  {day.label}
                </span>
                <span className="text-sm text-white font-semibold" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
                  {day.subtitle}
                </span>
                <span className="text-xs text-[#6b6b6b]" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
                  — {day.date}
                </span>
              </div>

              <div className="relative pl-8 border-l border-white/10 space-y-0">
                {day.slots.map((slot, i) => (
                  <motion.div
                    key={slot.time}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="relative pb-6 group"
                  >
                    {/* Dot */}
                    <div className="absolute -left-[13px] top-1 w-[10px] h-[10px] rounded-full bg-[#0a0a0a] border-2 border-[#c8f135]/50 group-hover:border-[#c8f135] transition-colors" />

                    <div className="bg-[#111] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors ml-4">
                      <div className="flex items-start gap-3">
                        <span className="text-xl flex-shrink-0">{slot.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-semibold text-white" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
                              {slot.title}
                            </h4>
                            <span className="text-xs text-[#c8f135] font-mono flex-shrink-0 ml-3">{slot.time}</span>
                          </div>
                          <p className="text-xs text-[#6b6b6b]" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
                            {slot.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ─── REWARDS & PERKS ─── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="max-w-7xl mx-auto px-4 md:px-8 mt-12"
      >
        <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
          Rewards, Career & Swag
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {perks.map((p: { icon?: string; title: string; desc?: string }, i: number) => (
            <motion.div
              key={`${p.title}-${i}`}
              whileHover={{ scale: 1.02 }}
              className="bg-[#111] border border-white/5 rounded-xl p-5 hover:border-[#c8f135]/20 transition-all"
            >
              <span className="text-2xl mb-3 block">{p.icon || "🎁"}</span>
              <h3 className="text-sm font-semibold text-white mb-1" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
                {p.title}
              </h3>
              <p className="text-xs text-[#6b6b6b]" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
                {p.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ─── LOGISTICS ─── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="max-w-7xl mx-auto px-4 md:px-8 mt-12"
      >
        <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
          Logistics & Facilities
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {logistics.map((l: { icon?: string; label: string; desc?: string }, i: number) => {
            const Icon = LOGISTICS_ICONS[(l.icon || "").toLowerCase()] ?? Shield;
            return (
              <div key={`${l.label}-${i}`} className="bg-[#111] border border-white/5 rounded-xl p-5">
                <Icon className="w-5 h-5 text-[#c8f135] mb-3" />
                <h3 className="text-sm font-semibold text-white mb-1" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
                  {l.label}
                </h3>
                <p className="text-xs text-[#6b6b6b]" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
                  {l.desc}
                </p>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* ─── FAQ (SEO) ─── */}
      <HackathonFAQ hackathon={hackathon} />

      {/* ─── STRUCTURED DATA ─── */}
      <HackathonSchema hackathon={hackathon} />
      <BreadcrumbSchema
        hackathonName={hackathon.title}
        hackathonId={id}
      />

      {/* ─── BOTTOM SPACER (extra room on mobile for raised CTA + bottom-nav) ─── */}
      <div className="h-44 md:h-32" />

      {/* ─── STICKY CTA (sits above the global mobile bottom-nav on small screens) ─── */}
      <div className="fixed bottom-[calc(64px+env(safe-area-inset-bottom,0px))] md:bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/95 to-transparent pb-4 pt-8 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="hidden md:block">
            <p className="text-white font-semibold text-sm" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
              {hackathon.title}
            </p>
            <p className="text-xs text-[#6b6b6b]">{startDate} – {endDate}{hackathon.location ? ` · ${hackathon.location}` : ""}</p>
          </div>
          <button
            onClick={openRegister}
            disabled={isClosed}
            className="w-full md:w-auto h-[52px] px-10 bg-[#c8f135] text-black font-bold rounded-xl hover:bg-[#b0d829] transition-all hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-[#c8f135]"
            style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "15px" }}
          >
            <Sparkles className="w-4 h-4" /> {isClosed ? "Registration Closed" : "Register Now"}
          </button>
        </div>
      </div>

      {/* ─── REGISTER MODAL ─── */}
      <RegisterModal
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
        hackathonId={id}
        registrationLink={hackathon.registrationLink}
      />
    </div>
  );
}
