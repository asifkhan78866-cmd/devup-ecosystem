"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Search, UserPlus, X } from "lucide-react";
import PageHeader from "@/components/PageHeader";

const CofounderField = dynamic(
  () => import("@/components/3d/CofounderField"),
  { ssr: false }
);

const PROFILES = [
  { id: 1, name: "Arjun Mehta", college: "IIT Bombay", city: "Bengaluru", role: { label: "Developer", color: "#a78bfa", bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.2)" }, stage: "Idea Phase", stageClass: "idea", idea: "An AI-powered devtool for automatic API generation.", needs: "Marketing / Sales", time: "Weekends", active: true, seed: "Arjun" },
  { id: 2, name: "Priya Singh", college: "BITS Pilani", city: "Delhi NCR", role: { label: "Designer", color: "#f472b6", bg: "rgba(236,72,153,0.1)", border: "rgba(236,72,153,0.2)" }, stage: "Building MVP", stageClass: "mvp", idea: "A unified platform for managing decentralized identities.", needs: "Technical Lead", time: "Full-time", active: false, seed: "Priya" },
  { id: 3, name: "Karan Patel", college: "IIM Ahmedabad", city: "Mumbai", role: { label: "Operator", color: "#fb923c", bg: "rgba(251,146,60,0.1)", border: "rgba(251,146,60,0.2)" }, stage: "Launched", stageClass: "launched", idea: "B2B procurement SaaS for restaurants.", needs: "Technical Co-founder", time: "Full-time", active: true, seed: "Karan" },
  { id: 4, name: "Sneha Reddy", college: "NIT Warangal", city: "Hyderabad", role: { label: "Developer", color: "#a78bfa", bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.2)" }, stage: "Building MVP", stageClass: "mvp", idea: "Zero-knowledge proof infrastructure layer.", needs: "Design / Ops", time: "Part-time", active: true, seed: "Sneha" },
];

export default function CoFoundersPage() {
  const [showForm, setShowForm] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [formDirection, setFormDirection] = useState(1); // 1 = forward, -1 = backward

  const goToStep = (step: number) => {
    setFormDirection(step > formStep ? 1 : -1);
    setFormStep(step);
  };

  const handleNext = () => {
    if (formStep < 4) goToStep(formStep + 1);
    else {
      // Submit logic
      setShowForm(false);
      setFormStep(1);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <PageHeader
        label="FIND YOUR CO-FOUNDER"
        headline="The right partner\nchanges everything."
        accentWord="everything"
        subtitle="Meet builders, designers, marketers, and operators who are ready to build something real."
        variant="rings"
      />

      <CofounderField />

      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-8 relative z-10">
        
        {/* Two Hero Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <div className="bg-[#111111] border border-white/10 rounded-[16px] p-8 md:p-10 flex flex-col items-start h-[320px]">
            <Search className="w-6 h-6 mb-6" style={{ color: "#c8f135" }} />
            <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "24px", fontWeight: 700, color: "#fff", marginBottom: "8px", lineHeight: 1.2 }}>
              Find your<br/>co-founder
            </h2>
            <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "15px", color: "#a1a1a1", marginBottom: "auto", maxWidth: "280px", lineHeight: 1.5 }}>
              Browse profiles filtered by skill, stage, city, and availability.
            </p>
            <button 
              className="w-full py-3.5 bg-[#c8f135] text-black font-semibold rounded-[10px] hover:bg-[#b0d829] transition-colors mt-6"
              style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px" }}
              onClick={() => document.getElementById('profiles-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Browse Profiles
            </button>
          </div>

          <div className="bg-[#0f0f0f] border border-dashed rounded-[16px] p-8 md:p-10 flex flex-col items-start h-[320px]" style={{ borderColor: "rgba(200,241,53,0.2)" }}>
            <UserPlus className="w-6 h-6 mb-6 text-white/40" />
            <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "24px", fontWeight: 700, color: "#fff", marginBottom: "8px", lineHeight: 1.2 }}>
              Add yourself<br/>to the network
            </h2>
            <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "15px", color: "#a1a1a1", marginBottom: "auto", maxWidth: "280px", lineHeight: 1.5 }}>
              Tell us what you're building and what kind of co-founder you need.
            </p>
            <button 
              className="w-full py-3.5 bg-transparent border border-white/10 text-[#e4e4e4] font-semibold rounded-[10px] hover:bg-white/5 transition-colors mt-6"
              style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px" }}
              onClick={() => setShowForm(true)}
            >
              Create Profile
            </button>
          </div>
        </div>

        <div id="profiles-section" className="pb-24">
          
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 mb-8">
            <div className="flex flex-col w-full md:w-auto">
              <label style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "10px", color: "#6b6b6b", textTransform: "uppercase", marginBottom: "6px" }}>Role</label>
              <select className="bg-[#111111] border border-white/10 rounded-[8px] px-3 py-2 text-[#e4e4e4] outline-none text-[13px] font-medium" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
                <option>All Roles</option>
                <option>Developer</option>
                <option>Designer</option>
                <option>Marketer</option>
                <option>Operator</option>
                <option>Sales</option>
              </select>
            </div>
            <div className="flex flex-col w-full md:w-auto">
              <label style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "10px", color: "#6b6b6b", textTransform: "uppercase", marginBottom: "6px" }}>Stage</label>
              <select className="bg-[#111111] border border-white/10 rounded-[8px] px-3 py-2 text-[#e4e4e4] outline-none text-[13px] font-medium" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
                <option>All Stages</option>
                <option>Idea</option>
                <option>MVP</option>
                <option>Launched</option>
              </select>
            </div>
            <div className="flex flex-col w-full md:w-auto">
              <label style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "10px", color: "#6b6b6b", textTransform: "uppercase", marginBottom: "6px" }}>Availability</label>
              <select className="bg-[#111111] border border-white/10 rounded-[8px] px-3 py-2 text-[#e4e4e4] outline-none text-[13px] font-medium" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
                <option>Any</option>
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Weekends</option>
              </select>
            </div>
            <div className="flex flex-col w-full md:flex-1 max-w-[240px]">
              <label style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "10px", color: "#6b6b6b", textTransform: "uppercase", marginBottom: "6px" }}>Location</label>
              <input type="text" placeholder="e.g. Bengaluru" className="w-full bg-[#111111] border border-white/10 rounded-[8px] px-3 py-2 text-[#e4e4e4] outline-none text-[13px]" style={{ fontFamily: "var(--font-inter), sans-serif" }} />
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PROFILES.map((p) => (
              <div 
                key={p.id}
                className="group bg-[#111111] border border-white/5 rounded-[16px] p-6 flex flex-col transition-all duration-300 hover:border-white/15 hover:translate-y-[-4px]"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative">
                    <img 
                      src={`https://api.dicebear.com/7.x/notionists/svg?seed=${p.seed}&backgroundColor=0a0a0a`} 
                      alt={p.name}
                      className="w-[56px] h-[56px] rounded-full border border-white/10 transition-all duration-300 group-hover:shadow-[0_0_0_2px_#0a0a0a,0_0_0_4px_#c8f135]"
                    />
                    {p.active && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#22c55e] border-2 border-[#111111] rounded-full" />
                    )}
                  </div>
                  <div>
                    <h3 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "17px", fontWeight: 700, color: "#fff", marginTop: "4px" }}>
                      {p.name}
                    </h3>
                    <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#6b6b6b" }}>
                      {p.college} · {p.city}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "10px", color: "#6b6b6b", textTransform: "uppercase", marginBottom: "6px" }}>What I bring</div>
                  <div 
                    className="inline-block px-2 py-1 rounded-[100px]"
                    style={{ background: p.role.bg, border: `1px solid ${p.role.border}`, color: p.role.color, fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", fontWeight: 500 }}
                  >
                    {p.role.label}
                  </div>
                </div>

                <div className="mb-4">
                  <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", color: "#6b6b6b", textTransform: "uppercase", marginBottom: "4px" }}>Building</div>
                  <p className="line-clamp-2" style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#a1a1a1", lineHeight: 1.5 }}>
                    {p.idea}
                  </p>
                </div>

                <div className="flex items-center gap-2 mb-6">
                  <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", color: "#6b6b6b" }}>Looking for:</div>
                  <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", color: "#a1a1a1" }}>{p.needs}</div>
                </div>

                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between gap-4 mb-4">
                  {/* Stage badge */}
                  <div 
                    className="px-2 py-1 rounded-[4px]"
                    style={{
                      fontFamily: "var(--font-inter), sans-serif", fontSize: "10px",
                      background: p.stageClass === "idea" ? "#1a1a1a" : (p.stageClass === "mvp" ? "rgba(200,241,53,0.08)" : "rgba(34,197,94,0.08)"),
                      border: p.stageClass === "idea" ? "1px solid rgba(255,255,255,0.08)" : (p.stageClass === "mvp" ? "1px solid rgba(200,241,53,0.15)" : "1px solid rgba(34,197,94,0.15)"),
                      color: p.stageClass === "idea" ? "#a1a1a1" : (p.stageClass === "mvp" ? "#c8f135" : "#4ade80")
                    }}
                  >
                    {p.stage}
                  </div>
                  {/* Availability */}
                  <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", color: "#6b6b6b" }}>
                    {p.time}
                  </div>
                </div>

                <button 
                  className="w-full py-2.5 bg-[#c8f135] text-black font-semibold rounded-[8px] transition-transform group-hover:scale-[1.02]"
                  style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px" }}
                >
                  Connect →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* List Yourself Form Overlay */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0a0a0a] z-[9000] flex flex-col"
          >
            {/* Top Bar */}
            <div className="h-16 border-b border-white/10 flex items-center justify-between px-6">
              <div style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "16px", fontWeight: 700, color: "#fff" }}>
                Create Co-Founder Profile
              </div>
              <button onClick={() => setShowForm(false)} className="text-[#6b6b6b] hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Step Indicator */}
            <div className="w-full max-w-lg mx-auto py-8">
              <div className="flex items-center justify-between relative px-2">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 right-0 h-[2px] -translate-y-1/2 bg-white/10 z-0">
                  <div 
                    className="h-full bg-[#c8f135] transition-all duration-300"
                    style={{ width: `${((formStep - 1) / 3) * 100}%` }}
                  />
                </div>
                {/* Dots */}
                {[1, 2, 3, 4].map((step) => {
                  const isActive = step === formStep;
                  const isCompleted = step < formStep;
                  
                  return (
                    <div 
                      key={step} 
                      className="w-6 h-6 rounded-full flex items-center justify-center relative z-10 transition-colors duration-300"
                      style={{
                        background: isCompleted ? "#fff" : (isActive ? "#c8f135" : "#0a0a0a"),
                        border: isCompleted || isActive ? "none" : "2px solid rgba(255,255,255,0.15)",
                      }}
                    >
                      {isCompleted ? <span style={{ color: "#000", fontSize: "12px", fontWeight: "bold" }}>✓</span> : null}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Form Content Area */}
            <div className="flex-1 relative overflow-hidden flex justify-center">
              <AnimatePresence initial={false} custom={formDirection} mode="wait">
                <motion.div
                  key={formStep}
                  custom={formDirection}
                  initial={{ opacity: 0, x: formDirection > 0 ? 40 : -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: formDirection > 0 ? -40 : 40 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 flex flex-col items-center pt-8 px-6 overflow-y-auto pb-32"
                >
                  <div className="w-full max-w-xl">
                    
                    {formStep === 1 && (
                      <div className="space-y-8">
                        <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "32px", fontWeight: 700, color: "#fff", textAlign: "center", marginBottom: "8px" }}>
                          What do you bring?
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {["Developer", "Designer", "Marketer", "Operator", "Sales", "Product"].map(r => (
                            <div 
                              key={r}
                              className="w-full aspect-square bg-[#111111] border border-white/10 rounded-[12px] flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-white/30 transition-colors"
                            >
                              <div className="w-8 h-8 rounded-full bg-white/5" />
                              <span style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px", color: "#e4e4e4" }}>{r}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {formStep === 2 && (
                      <div className="space-y-8">
                        <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "32px", fontWeight: 700, color: "#fff", textAlign: "center", marginBottom: "8px" }}>
                          What are you building?
                        </h2>
                        <div className="flex flex-col gap-4">
                          {["I have an idea", "Building an MVP", "Already Launched"].map((s, i) => (
                            <div 
                              key={s}
                              className="w-full p-5 bg-[#111111] border border-white/10 rounded-[12px] flex items-center gap-4 cursor-pointer hover:border-white/30 transition-colors"
                              style={{ borderColor: i === 0 ? "rgba(200,241,53,0.5)" : "rgba(255,255,255,0.1)", background: i === 0 ? "rgba(200,241,53,0.04)" : "#111111" }}
                            >
                              <div className={`w-5 h-5 rounded-full border-2 ${i === 0 ? "border-[#c8f135] flex items-center justify-center" : "border-white/20"}`}>
                                {i === 0 && <div className="w-2.5 h-2.5 bg-[#c8f135] rounded-full" />}
                              </div>
                              <span style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "16px", color: "#fff" }}>{s}</span>
                            </div>
                          ))}
                        </div>
                        <div>
                          <label style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#a1a1a1", display: "block", marginBottom: "8px" }}>
                            Describe your idea in one sentence
                          </label>
                          <textarea 
                            className="w-full h-[80px] resize-none bg-[#111111] border border-white/10 rounded-[10px] p-4 text-[#e4e4e4] outline-none focus:border-[#c8f135]/50 transition-colors"
                            placeholder="e.g. A marketplace for unused compute power."
                          />
                        </div>
                      </div>
                    )}

                    {formStep === 3 && (
                      <div className="space-y-8">
                        <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "32px", fontWeight: 700, color: "#fff", textAlign: "center", marginBottom: "8px" }}>
                          What do you need?
                        </h2>
                        <div>
                          <label style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#a1a1a1", display: "block", marginBottom: "12px" }}>
                            Co-founder role (select multiple)
                          </label>
                          <div className="flex flex-wrap gap-3">
                            {["Developer", "Designer", "Marketer", "Operator", "Sales", "Product"].map((r, i) => (
                              <div 
                                key={r}
                                className="px-4 py-2 border rounded-[8px] cursor-pointer"
                                style={{ 
                                  background: i === 0 ? "rgba(200,241,53,0.04)" : "#111111", 
                                  borderColor: i === 0 ? "rgba(200,241,53,0.5)" : "rgba(255,255,255,0.1)",
                                  color: i === 0 ? "#c8f135" : "#a1a1a1",
                                  fontFamily: "var(--font-inter), sans-serif", fontSize: "14px"
                                }}
                              >
                                {r}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#a1a1a1", display: "block", marginBottom: "12px" }}>
                            Your Availability
                          </label>
                          <div className="flex flex-wrap gap-3">
                            {["Full-time", "Part-time", "Weekends"].map((t, i) => (
                              <div 
                                key={t}
                                className="px-4 py-2 border rounded-[8px] cursor-pointer"
                                style={{ 
                                  background: i === 0 ? "rgba(255,255,255,0.05)" : "#111111", 
                                  borderColor: i === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)",
                                  color: i === 0 ? "#fff" : "#a1a1a1",
                                  fontFamily: "var(--font-inter), sans-serif", fontSize: "14px"
                                }}
                              >
                                {t}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#a1a1a1", display: "block", marginBottom: "8px" }}>
                            City
                          </label>
                          <input 
                            type="text"
                            className="w-full bg-[#111111] border border-white/10 rounded-[10px] p-4 text-[#e4e4e4] outline-none focus:border-[#c8f135]/50 transition-colors"
                            placeholder="e.g. Bengaluru / Remote"
                          />
                        </div>
                      </div>
                    )}

                    {formStep === 4 && (
                      <div className="space-y-6">
                        <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "32px", fontWeight: 700, color: "#fff", textAlign: "center", marginBottom: "24px" }}>
                          Your Profile
                        </h2>
                        
                        <div>
                          <label style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#a1a1a1", display: "block", marginBottom: "8px" }}>Full Name</label>
                          <input type="text" className="w-full bg-[#111111] border border-white/10 rounded-[10px] p-3 text-[#e4e4e4] outline-none focus:border-[#c8f135]/50 transition-colors" />
                        </div>
                        
                        <div>
                          <label style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#a1a1a1", display: "block", marginBottom: "8px" }}>College / Background</label>
                          <input type="text" className="w-full bg-[#111111] border border-white/10 rounded-[10px] p-3 text-[#e4e4e4] outline-none focus:border-[#c8f135]/50 transition-colors" />
                        </div>

                        <div>
                          <label style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#a1a1a1", display: "block", marginBottom: "8px" }}>LinkedIn URL</label>
                          <input type="url" className="w-full bg-[#111111] border border-white/10 rounded-[10px] p-3 text-[#e4e4e4] outline-none focus:border-[#c8f135]/50 transition-colors" />
                        </div>

                        <div>
                          <label style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#a1a1a1", display: "block", marginBottom: "8px" }}>Short Bio</label>
                          <textarea className="w-full h-[80px] resize-none bg-[#111111] border border-white/10 rounded-[10px] p-3 text-[#e4e4e4] outline-none focus:border-[#c8f135]/50 transition-colors" />
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Nav */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-[#0a0a0a] border-t border-white/5 flex items-center justify-between z-20">
              <div className="w-full max-w-xl mx-auto flex gap-4">
                {formStep > 1 && (
                  <button 
                    className="flex-1 py-3.5 bg-transparent border border-white/10 text-[#e4e4e4] font-semibold rounded-[10px] hover:bg-white/5 transition-colors"
                    style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px" }}
                    onClick={() => goToStep(formStep - 1)}
                  >
                    Previous
                  </button>
                )}
                <button 
                  className="flex-1 py-3.5 bg-[#c8f135] text-black font-semibold rounded-[10px] hover:bg-[#b0d829] transition-colors"
                  style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px" }}
                  onClick={handleNext}
                >
                  {formStep === 4 ? "Create Profile" : "Next →"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
