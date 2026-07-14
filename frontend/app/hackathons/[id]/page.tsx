"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Calendar, MapPin, Clock, Trophy, Users, Gift,
  Shield, Wifi, ChevronRight, Sparkles, Zap, Ticket, Download, Check, Target, Rocket
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import confetti from "canvas-confetti";
import HackathonSchema, { BreadcrumbSchema } from "@/components/seo/HackathonSchema";
import HackathonFAQ from "@/components/seo/HackathonFAQ";
import StatusModal from "./StatusModal";

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
    date: "Till Jul 20, 2026",
    label: "PHASE 1",
    subtitle: "Idea Submission (Live)",
    slots: [
      { time: "Live Now", title: "Registrations Open", description: "Register your team and select your track.", icon: "📝" },
      { time: "Till Jul 20", title: "Pitch Submission", description: "Submit your 1-page abstract or pitch deck.", icon: "🚀" },
      { time: "Jul 25", title: "Results Announced", description: "Selected teams invited for the offline hackathon.", icon: "🎉" },
    ],
  },
  {
    date: "Aug 20, 2026",
    label: "PHASE 2 - DAY 1",
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
    date: "Aug 21, 2026",
    label: "PHASE 2 - DAY 2",
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
  { icon: "🏆", title: "₹1,50,000+ Prize Pool", desc: "Cash prizes & trophies for top teams" },
  { icon: "💼", title: "Paid Internships", desc: "3-month internships, ₹25k–₹75k/mo stipend for top performers" },
  { icon: "📜", title: "Certificates", desc: "Verified national participation & merit certificates" },
  { icon: "🎧", title: "Premium Swag", desc: "Mechanical keyboards, smartwatches, earbuds, hoodies" },
  { icon: "🤝", title: "Industry Networking", desc: "Expert mentoring & real-world problem-solving" },
  { icon: "📦", title: "Mystery Boxes", desc: "'I Survived DEVTHON 2026' merch & surprise gifts" },
];

// Logistics icons are keyed by string so they can come from the DB (Json) too.
const LOGISTICS_ICONS: Record<string, LucideIcon> = {
  shield: Shield, accommodation: Shield,
  meals: Gift, gift: Gift,
  wifi: Wifi, internet: Wifi,
  support: Users, users: Users,
  clock: Clock, calendar: Calendar, trophy: Trophy,
  mappin: MapPin, location: MapPin
};

const LOGISTICS = [
  { icon: "location", label: "Venue", desc: "Vidya Jyothi Institute Of Technology" },
  { icon: "shield", label: "Accommodation", desc: "Separate male/female dorms on campus" },
  { icon: "meals", label: "5 Meals + Refreshments", desc: "24/7 snacks, tea, coffee, energy drinks" },
  { icon: "wifi", label: "1 Gbps Internet", desc: "Dedicated fiber + power backup" },
  { icon: "support", label: "On-site Support", desc: "Paramedic, security, volunteer crew" },
];

const DEFAULT_OVERVIEW = `DEVTHON 2026 is Asia's Largest Open Innovation Hackathon, designed to bridge academia, industry, and the startup ecosystem.

This 36-hour non-stop marathon challenges you to push the boundaries of technology across 26+ critical domains. Whether you choose to solve one of our curated problem statements or bring your own disruptive idea, DEVTHON provides a world-class platform to validate your vision. 

Top performers not only walk away with a share of the ₹1,50,000+ prize pool but will also be fast-tracked for incubation support and seed funding up to ₹4 Cr.`;

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
  const [step, setStep] = useState<"form" | "members" | "upload" | "success">("form");
  const [form, setForm] = useState({ name: "", email: "", phone: "", teamName: "", teamCount: 1, college: "" });
  const [members, setMembers] = useState<{name: string, email: string, phone: string}[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = "Name must be at least 2 characters";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
    if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = "Enter a valid 10-digit Indian phone number";
    if (form.teamCount < 1 || form.teamCount > 5) e.teamCount = "Team count must be 1–5";
    if (form.teamCount > 1 && form.teamName.trim().length < 2) e.teamName = "Team Name is required for teams";
    if (form.college.trim().length < 2) e.college = "College must be at least 2 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateMembers = () => {
    const e: Record<string, string> = {};
    members.forEach((m, i) => {
      if (m.name.trim().length < 2) e[`member_${i}_name`] = "Required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email)) e[`member_${i}_email`] = "Invalid email";
      if (!/^[6-9]\d{9}$/.test(m.phone)) e[`member_${i}_phone`] = "Invalid phone";
    });
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
    setTimeout(() => {
      confetti({ particleCount: 100, spread: 100, origin: { y: 0.6 }, colors });
    }, 300);
  }, []);

  const triggerRedirect = async (leadId: string) => {
    try {
      await fetch(`${API}/api/hackathons/${hackathonId}/lead/${leadId}/redirect`, { method: "PATCH" });
    } catch (e) {}
    window.open(registrationLink || GOOGLE_FORM_BASE, "_blank");
  };

  const handleNextToMembers = () => {
    if (!validateForm()) return;
    if (form.teamCount > 1) {
      // Initialize members array to teamCount - 1 (since lead is 1st member)
      const newMembers = [...members];
      while (newMembers.length < form.teamCount - 1) {
        newMembers.push({ name: "", email: "", phone: "" });
      }
      setMembers(newMembers.slice(0, form.teamCount - 1));
      setStep("members");
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (form.teamCount > 1 && !validateMembers()) return;
    
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/hackathons/${hackathonId}/lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          teamName: form.teamName.trim(),
          teamCount: form.teamCount,
          college: form.college.trim(),
          members: form.teamCount > 1 ? members : undefined
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.errors?.[0]?.message || data?.error || data?.message || "Registration failed");
      const newLeadId = data.data?.registrationId || null;
      setRegistrationId(newLeadId);
      setStep("upload");
    } catch (err: any) {
      setErrors({ submit: err.message || "Something went wrong" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadSubmit = async () => {
    if (!file) {
      setErrors({ upload: "Please select a file to upload" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrors({ upload: "File must be smaller than 10MB" });
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API}/api/hackathons/${hackathonId}/leads/${registrationId}/submission`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || data?.message || "Upload failed");
      
      setStep("success");
      fireConfetti();
      setTimeout(() => {
        if (registrationId) triggerRedirect(registrationId);
      }, 2500);
    } catch (err: any) {
      setErrors({ upload: err.message || "Upload failed" });
    } finally {
      setSubmitting(false);
    }
  };

  const skipUpload = () => {
    setStep("success");
    fireConfetti();
    setTimeout(() => {
      if (registrationId) triggerRedirect(registrationId);
    }, 2500);
  };

  const handleContinueToForm = () => {
    if (registrationId) triggerRedirect(registrationId);
    else window.open(registrationLink || GOOGLE_FORM_BASE, "_blank");
  };

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep("form");
      setForm({ name: "", email: "", phone: "", teamName: "", teamCount: 1, college: "" });
      setMembers([]);
      setErrors({});
      setRegistrationId(null);
    }
  }, [isOpen]);

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
            className="fixed inset-0 z-[300] overflow-y-auto pointer-events-none"
          >
            <div className="min-h-full flex items-center justify-center p-4">
              <div className="w-full max-w-lg bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-2xl pointer-events-auto my-8">
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
                    Secure your spot — {registrationLink?.includes("whatsapp") ? "we'll redirect you to the official WhatsApp group next." : "we'll redirect you to the official form next."}
                  </p>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-[#888] mb-1.5">Full Name (Lead) *</label>
                        <input
                          value={form.name}
                          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                          className={inputClass}
                          placeholder="Your full name"
                        />
                        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                      </div>
                      <div>
                        <label className="block text-xs text-[#888] mb-1.5">Email Address</label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                          className={inputClass}
                          placeholder="Lead's email"
                        />
                        {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-[#888] mb-1.5">Phone Number (WhatsApp) *</label>
                      <input
                        value={form.phone}
                        onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                        className={inputClass}
                        placeholder="10-digit Indian phone number"
                        inputMode="numeric"
                      />
                      {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      
                      {form.teamCount > 1 && (
                        <div>
                          <label className="block text-xs text-[#888] mb-1.5">Team Name *</label>
                          <input
                            value={form.teamName}
                            onChange={(e) => setForm((p) => ({ ...p, teamName: e.target.value }))}
                            className={inputClass}
                            placeholder="Awesome Team"
                          />
                          {errors.teamName && <p className="text-red-400 text-xs mt-1">{errors.teamName}</p>}
                        </div>
                      )}
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
                      onClick={handleNextToMembers}
                      disabled={submitting}
                      className="flex-1 px-4 py-3 rounded-xl bg-[#c8f135] text-black text-sm font-bold hover:bg-[#b0d829] transition-colors disabled:opacity-50"
                    >
                      {form.teamCount > 1 ? "Next: Members →" : "Register →"}
                    </button>
                  </div>
                </div>
              ) : step === "members" ? (
                <div className="p-6">
                  <h2
                    className="text-xl font-bold text-white mb-1"
                    style={{ fontFamily: "var(--font-syne), sans-serif" }}
                  >
                    Team Members
                  </h2>
                  <p
                    className="text-sm text-[#6b6b6b] mb-6"
                    style={{ fontFamily: "var(--font-inter), sans-serif" }}
                  >
                    Enter the details for the remaining {form.teamCount - 1} members.
                  </p>

                  <div className="space-y-6">
                    {members.map((m, i) => (
                      <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                        <h4 className="text-xs font-bold text-[#c8f135] uppercase">Member {i + 2}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <input
                              value={m.name}
                              onChange={(e) => {
                                const newM = [...members];
                                newM[i].name = e.target.value;
                                setMembers(newM);
                              }}
                              className={inputClass}
                              placeholder="Full Name"
                            />
                            {errors[`member_${i}_name`] && <p className="text-red-400 text-xs mt-1">{errors[`member_${i}_name`]}</p>}
                          </div>
                          <div>
                            <input
                              type="email"
                              value={m.email}
                              onChange={(e) => {
                                const newM = [...members];
                                newM[i].email = e.target.value;
                                setMembers(newM);
                              }}
                              className={inputClass}
                              placeholder="Email Address"
                            />
                            {errors[`member_${i}_email`] && <p className="text-red-400 text-xs mt-1">{errors[`member_${i}_email`]}</p>}
                          </div>
                        </div>
                        <div>
                          <input
                            value={m.phone}
                            onChange={(e) => {
                              const newM = [...members];
                              newM[i].phone = e.target.value.replace(/\D/g, "").slice(0, 10);
                              setMembers(newM);
                            }}
                            className={inputClass}
                            placeholder="Phone Number"
                            inputMode="numeric"
                          />
                          {errors[`member_${i}_phone`] && <p className="text-red-400 text-xs mt-1">{errors[`member_${i}_phone`]}</p>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {errors.submit && (
                    <p className="text-red-400 text-sm mt-4 text-center">{errors.submit}</p>
                  )}

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setStep("form")}
                      className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-[#888] text-sm font-medium hover:bg-white/5 transition-colors"
                    >
                      ← Back
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
              ) : step === "upload" ? (
                <div className="p-6">
                  <h2
                    className="text-xl font-bold text-white mb-1"
                    style={{ fontFamily: "var(--font-syne), sans-serif" }}
                  >
                    Phase 1 Submission
                  </h2>
                  <p
                    className="text-sm text-[#6b6b6b] mb-6"
                    style={{ fontFamily: "var(--font-inter), sans-serif" }}
                  >
                    Upload your 1-page PDF abstract or Pitch Deck. Max size 10MB.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <input
                        type="file"
                        accept=".pdf,.ppt,.pptx"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="w-full text-sm text-[#888] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#c8f135] file:text-black hover:file:bg-[#b0d829] transition-all cursor-pointer"
                      />
                      {errors.upload && <p className="text-red-400 text-xs mt-2">{errors.upload}</p>}
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={skipUpload}
                      className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-[#888] text-sm font-medium hover:bg-white/5 transition-colors"
                    >
                      Skip for now
                    </button>
                    <button
                      onClick={handleUploadSubmit}
                      disabled={submitting || !file}
                      className="flex-1 px-4 py-3 rounded-xl bg-[#c8f135] text-black text-sm font-bold hover:bg-[#b0d829] transition-colors disabled:opacity-50"
                    >
                      {submitting ? "Uploading..." : "Submit & Continue"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-10 text-center">
                  <div className="w-20 h-20 bg-[#c8f135]/10 text-[#c8f135] rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="w-10 h-10" />
                  </div>
                  <h2
                    className="text-2xl font-bold text-white mb-2"
                    style={{ fontFamily: "var(--font-syne), sans-serif" }}
                  >
                    Registration Complete!
                  </h2>
                  <p className="text-[#888] mb-8 max-w-sm mx-auto">
                    You're successfully registered for DEVTHON 2026. We will now redirect you to the official WhatsApp community to stay updated!
                  </p>

                  <button
                    onClick={handleContinueToForm}
                    className="w-full px-4 py-3 rounded-xl bg-[#c8f135] text-black text-sm font-bold hover:bg-[#b0d829] transition-colors"
                  >
                    Join WhatsApp Community →
                  </button>
                </div>
              )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default function HackathonDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [hackathon, setHackathon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
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

  let displayLocation = hackathon.location || "Vidya Jyothi Institute Of Technology(VJIT)";
  if (displayLocation === "Hyderabad,India" || displayLocation === "Hyderabad, India") {
    displayLocation = "Vidya Jyothi Institute Of Technology(VJIT)";
  }

  const isClosed = new Date(hackathon.registrationDeadline).getTime() <= Date.now();
  const openRegister = () => { if (!isClosed) setShowRegister(true); };

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover z-0 opacity-25 pointer-events-none"
      >
        <source src="/videos/interstellar-bg.mp4" type="video/mp4" />
      </video>
      <div className="relative z-10">
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
        className="max-w-7xl mx-auto px-4 md:px-8 mt-6 relative"
      >
        <div className="bg-[#111111] border border-white/10 rounded-[24px] overflow-hidden flex flex-col md:flex-row relative shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
          
          {/* Poster Section */}
          <div className="w-full md:w-[400px] lg:w-[480px] h-[300px] md:h-auto min-h-[400px] relative overflow-hidden shrink-0 group bg-transparent">
            <Image
              src={bannerSrc}
              alt={hackathon.title}
              fill
              sizes="(max-width: 768px) 100vw, 480px"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-l from-[#111111] via-[#111111]/20 to-transparent md:from-[#111111] md:via-[#111111]/40 md:to-transparent" />
          </div>

          {/* Hero content */}
          <div className="relative p-8 md:p-12 flex-1 flex flex-col justify-center z-10 bg-[#111111]">
            <div className="flex flex-wrap gap-2 mb-6">
              <span
                className="px-3 py-1 bg-[rgba(200,241,53,0.15)] border border-[rgba(200,241,53,0.3)] text-[#c8f135] rounded-full"
                style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "12px", fontWeight: 600, letterSpacing: "0.05em" }}
              >
                {prettyMode(hackathon.mode)}
              </span>
              {hackathon.isFeatured && (
                <span
                  className="px-3 py-1 bg-[rgba(167,139,250,0.1)] border border-[rgba(167,139,250,0.3)] text-[#a78bfa] rounded-full"
                  style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "12px", fontWeight: 600 }}
                >
                  FEATURED
                </span>
              )}
            </div>

            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4"
              style={{ fontFamily: "var(--font-syne), sans-serif", lineHeight: 1.1, letterSpacing: "-0.02em" }}
            >
              {hackathon.title}
            </h1>
            <p className="text-base md:text-lg text-[#a1a1a1] mb-8 max-w-2xl" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
              {subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-6 text-sm text-[#e4e4e4] bg-white/5 border border-white/10 rounded-2xl p-5" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
              <div className="flex flex-col gap-1"><span className="text-[#888] text-xs">Prize Pool</span><span className="flex items-center gap-1.5 font-semibold text-[#c8f135]"><Trophy className="w-4 h-4" /> {hackathon.prizePool}</span></div>
              <div className="w-px h-8 bg-white/10 hidden sm:block"></div>
              <div className="flex flex-col gap-1"><span className="text-[#888] text-xs">Dates</span><span className="flex items-center gap-1.5 font-medium"><Calendar className="w-4 h-4 text-[#c8f135]" /> {startDate} – {endDate}</span></div>
              <div className="w-px h-8 bg-white/10 hidden sm:block"></div>
              {displayLocation && (
                <div className="flex flex-col gap-1"><span className="text-[#888] text-xs">Location</span><span className="flex items-center gap-1.5 font-medium"><MapPin className="w-4 h-4 text-[#c8f135]" /> {displayLocation}</span></div>
              )}
              {hackathon.registrationFee && (
                <>
                  <div className="w-px h-8 bg-white/10 hidden sm:block"></div>
                  <div className="flex flex-col gap-1"><span className="text-[#888] text-xs">Registration Fee</span><span className="flex items-center gap-1.5 font-medium"><Ticket className="w-4 h-4 text-[#c8f135]" /> {hackathon.registrationFee}</span></div>
                </>
              )}
            </div>

            {id === 'f40eb44c-138c-4b86-86bd-2da45ae60b3a' && (
              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="/devthon-problem-statements.pdf"
                  download="DEVTHON_2026_Problem_Statements.pdf"
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
                <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "10px", color: "#6b6b6b", letterSpacing: "0.15em", marginBottom: "12px", fontWeight: 600 }}>
                  PRESENTED BY
                </div>
                <div className="flex flex-wrap gap-4 items-center">
                  {hackathon.partners.map((p: any) => (
                    <div key={p.id} className="group relative flex items-center justify-center w-12 h-12 rounded-[14px] bg-[#1a1a1a] border border-white/5 hover:border-[#c8f135]/30 hover:bg-[#222] transition-all cursor-pointer">
                      {p.logoUrl ? (
                        <img 
                          src={p.logoUrl} 
                          alt={p.name} 
                          className="w-8 h-8 object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300" 
                        />
                      ) : (
                        <span className="text-xs font-bold text-gray-500 group-hover:text-[#c8f135] transition-colors" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
                          {p.name.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                      {/* Tooltip */}
                      <div className="absolute -top-10 bg-[#222] border border-white/10 text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none text-[#e4e4e4] shadow-xl">
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
                href="/devthon-problem-statements.pdf"
                download="DEVTHON_2026_Problem_Statements.pdf"
                className="h-[52px] px-8 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "15px" }}
              >
                <Download className="w-5 h-5" /> Problem Statements
              </a>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowStatus(true)}
                className="h-[52px] px-10 border border-[#c8f135] text-[#c8f135] bg-[#c8f135]/10 font-bold rounded-xl hover:bg-[#c8f135]/20 transition-all hover:scale-105"
                style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "15px" }}
              >
                Check Phase 1 Status
              </button>
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
        </div>
      </motion.section>

            {/* ─── TWO WAYS TO COMPETE ─── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="max-w-7xl mx-auto px-4 md:px-8 mt-16 relative"
      >
        
        <div className="relative z-10 mb-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
            Your Mission
          </h2>
        </div>

        <div className="max-w-3xl mx-auto relative z-10">
          <div className="bg-[#111] border border-white/5 rounded-2xl p-6 md:p-8 group hover:border-white/15 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-2xl">
              <Rocket className="w-6 h-6 text-[#38bdf8]" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "var(--font-syne), sans-serif" }}>Pitch Your Own Problem Statement</h3>
            <p className="text-[#a1a1a1] leading-relaxed mb-6" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
              Have a disruptive idea? Pitch your own problem statement during Phase 1. If selected, you get to build your vision and compete for massive funding.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-[#e4e4e4]"><div className="w-1.5 h-1.5 rounded-full bg-[#c8f135]" /> Pre-approval required (Phase 1)</li>
              <li className="flex items-center gap-3 text-sm text-[#e4e4e4]"><div className="w-1.5 h-1.5 rounded-full bg-[#c8f135]" /> Pitch to angel investors</li>
              <li className="flex items-center gap-3 text-sm text-[#e4e4e4]"><div className="w-1.5 h-1.5 rounded-full bg-[#c8f135]" /> Up to ₹4 Cr seed funding</li>
            </ul>
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
        <div className="mt-6">
            <p className="text-xs text-[#6b6b6b] uppercase tracking-widest">+ 21 MORE DOMAINS ANNOUNCED SOON</p>
        </div>
      </motion.section>

      {/* ─── TIMELINE ─── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="max-w-7xl mx-auto px-4 md:px-8 mt-12"
      >
                <h2 className="text-xs text-[#c8f135] uppercase tracking-[0.2em] font-bold mb-2 text-center">
          Mission Log
        </h2>
        <h2 className="text-3xl font-bold text-white mb-12 text-center" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
          Event Timeline
        </h2>
        <div className="space-y-16 max-w-4xl mx-auto relative before:absolute before:inset-0 before:ml-[28px] md:before:mx-auto md:before:translate-x-0 before:h-full before:w-[1px] before:bg-gradient-to-b before:from-transparent before:via-[#c8f135]/30 before:to-transparent">
          {timeline.map((day: TimelineDay, dayIndex: number) => (
            <div key={day.label} className="relative z-10">
              <div className="flex flex-col md:flex-row items-center gap-3 mb-10 text-center">
                <div className="w-full md:w-1/2 flex justify-end md:pr-12">
                   <span className="px-4 py-1.5 bg-[#111827] border border-[#374151] text-white rounded-full text-sm font-bold tracking-[0.1em] shadow-[0_0_15px_rgba(200,241,53,0.1)]">
                     {day.label} — {day.date}
                   </span>
                </div>
                <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#c8f135] shadow-[0_0_15px_#c8f135]" />
                <div className="w-full md:w-1/2 flex justify-start md:pl-12">
                   <span className="text-lg text-[#a1a1a1]" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
                     {day.subtitle}
                   </span>
                </div>
              </div>

              <div className="space-y-6">
                {day.slots.map((slot, i) => {
                  const isLeft = i % 2 === 0;
                  return (
                  <motion.div
                    key={slot.time}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: i * 0.1 }}
                    className={`relative flex flex-col md:flex-row items-center justify-between group ${isLeft ? "md:flex-row-reverse" : ""}`}
                  >
                    <div className="w-full md:w-5/12 hidden md:block" />
                    
                    {/* Constellation Node */}
                    <div className="absolute left-[28px] md:left-1/2 -translate-x-1/2 w-[11px] h-[11px] rounded-full bg-[#0a0a0a] border-2 border-[#c8f135]/50 group-hover:border-[#c8f135] group-hover:scale-150 transition-all z-10 shadow-[0_0_10px_rgba(200,241,53,0.3)]" />
                    
                    {/* Horizontal Connector Line on Desktop */}
                    <div className={`hidden md:block absolute top-1/2 -translate-y-1/2 w-[8%] h-[1px] bg-dashed border-t border-white/20 ${isLeft ? 'right-[50%] mr-3' : 'left-[50%] ml-3'}`} />

                    <div className={`w-full md:w-5/12 pl-16 md:pl-0 ${isLeft ? 'md:pr-8 md:text-right' : 'md:pl-8 md:text-left'}`}>
                      <div className="bg-[#111] backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:border-[#c8f135]/40 transition-colors shadow-lg">
                        <div className={`flex items-start gap-4 ${isLeft ? 'md:flex-row-reverse' : ''}`}>
                          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl shadow-inner">
                            {slot.icon}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-base font-bold text-white mb-1 tracking-wide" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
                              {slot.title}
                            </h4>
                            <div className={`text-xs text-[#c8f135] font-mono mb-2 ${isLeft ? 'md:justify-end' : ''} flex`}>{slot.time}</div>
                            <p className="text-sm text-[#888] leading-relaxed" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
                              {slot.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )})}
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
          <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
            <button
              onClick={() => setShowStatus(true)}
              className="flex-1 md:flex-none h-[52px] px-6 border border-[#c8f135] text-[#c8f135] bg-[#0d0d0d] font-bold rounded-xl hover:bg-[#1a1a1a] transition-all flex items-center justify-center gap-2"
              style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "15px" }}
            >
              Check Status
            </button>
            <button
              onClick={openRegister}
              disabled={isClosed}
              className="flex-1 md:flex-none h-[52px] px-8 bg-[#c8f135] text-black font-bold rounded-xl hover:bg-[#b0d829] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#c8f135]"
              style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "15px" }}
            >
              <Sparkles className="w-4 h-4 hidden sm:block" /> {isClosed ? "Closed" : "Register Now"}
            </button>
          </div>
        </div>
      </div>

      {/* ─── REGISTER MODAL ─── */}
      <RegisterModal
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
        hackathonId={id}
        registrationLink={hackathon.registrationLink}
      />

      <StatusModal
        isOpen={showStatus}
        onClose={() => setShowStatus(false)}
        hackathonId={id}
      />
      </div>
    </div>
  );
}
