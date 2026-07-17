"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Search, UserPlus, X, Code2, Palette, Megaphone, Settings, Briefcase, Box, Loader2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ErrorBoundary from "@/components/ErrorBoundary";
import AuthGate from "@/components/auth/AuthGate";
import { useAuth } from "@/lib/auth/AuthProvider";

const CofounderField = dynamic(
  () => import("@/components/3d/CofounderField"),
  { ssr: false }
);

const ROLE_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  Developer: { color: "#a78bfa", bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.2)" },
  Designer: { color: "#f472b6", bg: "rgba(236,72,153,0.1)", border: "rgba(236,72,153,0.2)" },
  Marketer: { color: "#fb923c", bg: "rgba(251,146,60,0.1)", border: "rgba(251,146,60,0.2)" },
  Operator: { color: "#fb923c", bg: "rgba(251,146,60,0.1)", border: "rgba(251,146,60,0.2)" },
  Sales: { color: "#22c55e", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.2)" },
  Product: { color: "#38bdf8", bg: "rgba(56,189,248,0.1)", border: "rgba(56,189,248,0.2)" },
};
const DEFAULT_ROLE_STYLE = { color: "#a1a1a1", bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)" };

export default function CoFoundersPage() {
  const [showForm, setShowForm] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [formDirection, setFormDirection] = useState(1);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [bringRole, setBringRole] = useState("");
  const [buildStage, setBuildStage] = useState("I have an idea");
  const [needRoles, setNeedRoles] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string[]>([]);
  const [ideaSummary, setIdeaSummary] = useState("");
  const [founderCity, setFounderCity] = useState("");
  const [fullName, setFullName] = useState("");
  const [collegeBackground, setCollegeBackground] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [shortBio, setShortBio] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { session } = useAuth();
  
  const [connectProfile, setConnectProfile] = useState<any>(null);
  const [connectMessage, setConnectMessage] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);

  const handleConnectClick = (p: any) => {
    setConnectProfile(p);
    setConnectMessage(`Hi ${p.name.split(' ')[0]},\n\nI saw your profile on the Co-Founder Marketplace and I'd love to connect to discuss building something together!`);
  };

  const submitConnectionRequest = async () => {
    if (!connectProfile || !session?.access_token) return;
    setSendingRequest(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/cofounders/${connectProfile.userId}/request`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ message: connectMessage })
      });
      
      if (res.ok) {
        alert("Request sent successfully!");
        setConnectProfile(null);
      } else {
        const err = await res.json();
        alert(err.message || "Failed to send request");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to send request");
    } finally {
      setSendingRequest(false);
    }
  };

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/cofounders`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          const formatted = data.data.map((p: any) => {
            const roleLabel = p.role || p.skills?.[0] || "Developer";
            const roleStyle = ROLE_STYLES[roleLabel] || DEFAULT_ROLE_STYLE;
            return {
              id: p.id,
              userId: p.userId,
              name: p.user?.profile?.name || p.name || "Anonymous",
              college: p.user?.profile?.college || p.college || "",
              city: p.city || p.user?.profile?.city || "Remote",
              role: { label: roleLabel, ...roleStyle },
              stage: p.stage || "Idea Phase",
              stageClass: (p.stage || "").toLowerCase().includes("mvp") ? "mvp" : (p.stage || "").toLowerCase().includes("launch") ? "launched" : "idea",
              idea: p.idea || p.bio || "",
              needs: p.lookingFor || "Co-founder",
              time: p.availability || "Part-time",
              active: p.isActive ?? true,
              seed: p.user?.profile?.name?.split(" ")[0] || p.name?.split(" ")[0] || "User",
            };
          });
          setProfiles(formatted);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getStageStyles = (stageClass: string) => {
    if (stageClass === "idea") {
      return {
        background: "#1a1a1a",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "#a1a1a1",
      };
    }
    if (stageClass === "mvp") {
      return {
        background: "rgba(200,241,53,0.08)",
        border: "1px solid rgba(200,241,53,0.15)",
        color: "#c8f135",
      };
    }
    return {
      background: "rgba(34,197,94,0.08)",
      border: "1px solid rgba(34,197,94,0.15)",
      color: "#4ade80",
    };
  };

  const getStepStyles = (isCompleted: boolean, isActive: boolean) => {
    if (isCompleted) {
      return { background: "#fff", border: "none" };
    }
    if (isActive) {
      return { background: "#c8f135", border: "none" };
    }
    return { background: "#0a0a0a", border: "2px solid rgba(255,255,255,0.15)" };
  };

  const toggleNeedRole = (role: string) => {
    setNeedRoles((prev) => (prev.includes(role) ? prev.filter((x) => x !== role) : [...prev, role]));
  };

  const toggleAvailability = (time: string) => {
    setAvailability((prev) => (prev.includes(time) ? prev.filter((x) => x !== time) : [...prev, time]));
  };

  const goToStep = (step: number) => {
    setFormDirection(step > formStep ? 1 : -1);
    setFormStep(step);
  };

  const handleNext = async () => {
    if (formStep < 4) {
      goToStep(formStep + 1);
    } else {
      setSubmitting(true);
      try {
        const payload = {
          role: bringRole.toUpperCase(),
          stage: buildStage === "I have an idea" ? "IDEA" : buildStage === "Building an MVP" ? "MVP" : "LAUNCHED",
          seeking: needRoles.map(r => r.toUpperCase()),
          availability: availability[0]?.toUpperCase().replace("-", "_") || "PART_TIME",
          idea: ideaSummary,
          fullName,
          city: founderCity,
          collegeBackground,
          linkedinUrl,
          shortBio
        };

        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/cofounders`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`
            },
            body: JSON.stringify(payload)
          });
          
          if (res.ok) {
            setShowForm(false);
            setFormStep(1);
            window.location.reload();
          } else {
            const err = await res.json();
            alert(err.message || 'Failed to create profile');
          }
        } catch (err: any) {
          console.error(err);
          alert(err.message || 'Failed to create profile');
        }
      } catch (err: any) {
        console.error(err);
        alert('An error occurred');
      } finally {
        setSubmitting(false);
      }
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

      <ErrorBoundary>
        <CofounderField data={profiles} />
      </ErrorBoundary>

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
            <AuthGate>
              <button 
                className="w-full py-3.5 bg-transparent border border-white/10 text-[#e4e4e4] font-semibold rounded-[10px] hover:bg-white/5 transition-colors mt-6"
                style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px" }}
                onClick={() => setShowForm(true)}
              >
                Create Profile
              </button>
            </AuthGate>
          </div>
        </div>

        <div id="profiles-section" className="pb-24">
          
          {/* Filter Bar (Desktop) */}
          <div className="hidden md:flex flex-row items-center gap-6 mb-8">
            <div className="flex flex-col w-auto">
              <label htmlFor="filterRole" style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "10px", color: "#6b6b6b", textTransform: "uppercase", marginBottom: "6px" }}>Role</label>
              <select id="filterRole" className="bg-[#111111] border border-white/10 rounded-[8px] px-3 py-2 text-[#e4e4e4] outline-none text-[13px] font-medium cursor-pointer" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
                <option>All Roles</option>
                <option>Developer</option>
                <option>Designer</option>
                <option>Marketer</option>
                <option>Operator</option>
                <option>Sales</option>
              </select>
            </div>
            <div className="flex flex-col w-auto">
              <label htmlFor="filterStage" style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "10px", color: "#6b6b6b", textTransform: "uppercase", marginBottom: "6px" }}>Stage</label>
              <select id="filterStage" className="bg-[#111111] border border-white/10 rounded-[8px] px-3 py-2 text-[#e4e4e4] outline-none text-[13px] font-medium cursor-pointer" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
                <option>All Stages</option>
                <option>Idea</option>
                <option>MVP</option>
                <option>Launched</option>
              </select>
            </div>
            <div className="flex flex-col w-auto">
              <label htmlFor="filterAvailability" style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "10px", color: "#6b6b6b", textTransform: "uppercase", marginBottom: "6px" }}>Availability</label>
              <select id="filterAvailability" className="bg-[#111111] border border-white/10 rounded-[8px] px-3 py-2 text-[#e4e4e4] outline-none text-[13px] font-medium cursor-pointer" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
                <option>Any</option>
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Weekends</option>
              </select>
            </div>
            <div className="flex flex-col flex-1 max-w-[240px]">
              <label htmlFor="filterLocation" style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "10px", color: "#6b6b6b", textTransform: "uppercase", marginBottom: "6px" }}>Location</label>
              <input id="filterLocation" type="text" placeholder="e.g. Bengaluru" className="w-full bg-[#111111] border border-white/10 rounded-[8px] px-3 py-2 text-[#e4e4e4] outline-none text-[13px]" style={{ fontFamily: "var(--font-inter), sans-serif" }} />
            </div>
          </div>

          {/* Filter Bar (Mobile - Horizontal Pills) */}
          <div className="md:hidden flex flex-col gap-6 mb-8">
            <div className="flex flex-col">
              <label style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "10px", color: "#6b6b6b", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.05em" }}>Role</label>
              <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
                {["All Roles", "Developer", "Designer", "Marketer", "Operator", "Sales"].map((opt, i) => (
                  <button key={opt} className={`whitespace-nowrap rounded-full px-4 py-2 border flex-shrink-0 ${i === 0 ? 'bg-[rgba(200,241,53,0.1)] border-[rgba(200,241,53,0.3)] text-[#c8f135]' : 'bg-transparent border-white/10 text-[#6b6b6b]'}`} style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px" }}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col">
              <label style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "10px", color: "#6b6b6b", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.05em" }}>Stage</label>
              <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
                {["All Stages", "Idea", "MVP", "Launched"].map((opt, i) => (
                  <button key={opt} className={`whitespace-nowrap rounded-full px-4 py-2 border flex-shrink-0 ${i === 0 ? 'bg-[rgba(200,241,53,0.1)] border-[rgba(200,241,53,0.3)] text-[#c8f135]' : 'bg-transparent border-white/10 text-[#6b6b6b]'}`} style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px" }}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col">
              <label style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "10px", color: "#6b6b6b", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.05em" }}>Availability</label>
              <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
                {["Any", "Full-time", "Part-time", "Weekends"].map((opt, i) => (
                  <button key={opt} className={`whitespace-nowrap rounded-full px-4 py-2 border flex-shrink-0 ${i === 0 ? 'bg-[rgba(200,241,53,0.1)] border-[rgba(200,241,53,0.3)] text-[#c8f135]' : 'bg-transparent border-white/10 text-[#6b6b6b]'}`} style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px" }}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col w-full">
              <label htmlFor="filterLocationMobile" style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "10px", color: "#6b6b6b", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.05em" }}>Location</label>
              <input id="filterLocationMobile" type="text" placeholder="e.g. Bengaluru" className="w-full bg-[#111111] border border-white/10 rounded-[8px] px-3 py-3 text-[#e4e4e4] outline-none text-[14px]" style={{ fontFamily: "var(--font-inter), sans-serif" }} />
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading && (
              <div className="col-span-full flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#c8f135]" />
              </div>
            )}
            {!loading && profiles.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                <p style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "18px", color: "#fff", marginBottom: "8px" }}>No co-founder profiles yet</p>
                <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px", color: "#6b6b6b" }}>Be the first to create one!</p>
              </div>
            )}
            {profiles.map((p) => (
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
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: "10px",
                      ...getStageStyles(p.stageClass),
                    }}
                  >
                    {p.stage}
                  </div>
                  {/* Availability */}
                  <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", color: "#6b6b6b" }}>
                    {p.time}
                  </div>
                </div>

                <AuthGate>
                  <button 
                    onClick={() => handleConnectClick(p)}
                    className="w-full py-2.5 bg-[#c8f135] text-black font-semibold rounded-[8px] transition-transform group-hover:scale-[1.02]"
                    style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px" }}
                  >
                    Connect →
                  </button>
                </AuthGate>
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
                      style={getStepStyles(isCompleted, isActive)}
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
                          {[
                            { label: "Developer", icon: Code2 },
                            { label: "Designer", icon: Palette },
                            { label: "Marketer", icon: Megaphone },
                            { label: "Operator", icon: Settings },
                            { label: "Sales", icon: Briefcase },
                            { label: "Product", icon: Box }
                          ].map((r) => {
                            const isSelected = bringRole === r.label;
                            const Icon = r.icon;
                            return (
                              <button
                                key={r.label}
                                type="button"
                                onClick={() => setBringRole(r.label)}
                                className="w-full aspect-square border rounded-[12px] flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors"
                                style={{
                                  background: isSelected ? "rgba(200,241,53,0.04)" : "#111111",
                                  borderColor: isSelected ? "rgba(200,241,53,0.5)" : "rgba(255,255,255,0.1)",
                                }}
                                aria-pressed={isSelected}
                              >
                                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: isSelected ? "rgba(200,241,53,0.1)" : "rgba(255,255,255,0.05)", color: isSelected ? "#c8f135" : "#a1a1a1" }}>
                                  <Icon size={20} />
                                </div>
                                <span style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px", color: isSelected ? "#c8f135" : "#e4e4e4", fontWeight: isSelected ? 600 : 400 }}>{r.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {formStep === 2 && (
                      <div className="space-y-8">
                        <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "32px", fontWeight: 700, color: "#fff", textAlign: "center", marginBottom: "8px" }}>
                          What are you building?
                        </h2>
                        <div className="flex flex-col gap-4">
                          {["I have an idea", "Building an MVP", "Already Launched"].map((s) => {
                            const isSelected = buildStage === s;
                            return (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setBuildStage(s)}
                                className="w-full p-5 border rounded-[12px] flex items-center gap-4 cursor-pointer transition-colors"
                                style={{ 
                                  borderColor: isSelected ? "rgba(200,241,53,0.5)" : "rgba(255,255,255,0.1)", 
                                  background: isSelected ? "rgba(200,241,53,0.04)" : "#111111" 
                                }}
                                aria-pressed={isSelected}
                              >
                                <div className={`w-5 h-5 rounded-full border-2 ${isSelected ? "border-[#c8f135] flex items-center justify-center" : "border-white/20"}`}>
                                  {isSelected && <div className="w-2.5 h-2.5 bg-[#c8f135] rounded-full" />}
                                </div>
                                <span style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "16px", color: "#fff" }}>{s}</span>
                              </button>
                            );
                          })}
                        </div>
                        <div>
                          <label htmlFor="ideaSummary" style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#a1a1a1", display: "block", marginBottom: "8px" }}>
                            Describe your idea in one sentence
                          </label>
                          <textarea 
                            id="ideaSummary"
                            value={ideaSummary}
                            onChange={(e) => setIdeaSummary(e.target.value)}
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
                          <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#a1a1a1", display: "block", marginBottom: "12px" }}>
                            Co-founder role (select multiple)
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {["Developer", "Designer", "Marketer", "Operator", "Sales", "Product"].map((r) => {
                              const isSelected = needRoles.includes(r);
                              return (
                                <button
                                  key={r}
                                  type="button"
                                  onClick={() => toggleNeedRole(r)}
                                  className="px-4 py-2 border rounded-[8px] cursor-pointer select-none transition-colors"
                                  style={{ 
                                    background: isSelected ? "rgba(200,241,53,0.04)" : "#111111", 
                                    borderColor: isSelected ? "rgba(200,241,53,0.5)" : "rgba(255,255,255,0.1)",
                                    color: isSelected ? "#c8f135" : "#a1a1a1",
                                    fontFamily: "var(--font-inter), sans-serif", fontSize: "14px"
                                  }}
                                  aria-pressed={isSelected}
                                >
                                  {r}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#a1a1a1", display: "block", marginBottom: "12px" }}>
                            Your Availability
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {["Full-time", "Part-time", "Weekends"].map((t) => {
                              const isSelected = availability.includes(t);
                              return (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => toggleAvailability(t)}
                                  className="px-4 py-2 border rounded-[8px] cursor-pointer select-none transition-colors"
                                  style={{ 
                                    background: isSelected ? "rgba(255,255,255,0.05)" : "#111111", 
                                    borderColor: isSelected ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)",
                                    color: isSelected ? "#fff" : "#a1a1a1",
                                    fontFamily: "var(--font-inter), sans-serif", fontSize: "14px"
                                  }}
                                  aria-pressed={isSelected}
                                >
                                  {t}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <label htmlFor="founderCity" style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#a1a1a1", display: "block", marginBottom: "8px" }}>
                            City
                          </label>
                          <input 
                            id="founderCity"
                            type="text"
                            value={founderCity}
                            onChange={(e) => setFounderCity(e.target.value)}
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
                          <label htmlFor="fullName" style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#a1a1a1", display: "block", marginBottom: "8px" }}>Full Name</label>
                          <input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-[#111111] border border-white/10 rounded-[10px] p-3 text-[#e4e4e4] outline-none focus:border-[#c8f135]/50 transition-colors" />
                        </div>
                        
                        <div>
                          <label htmlFor="collegeBackground" style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#a1a1a1", display: "block", marginBottom: "8px" }}>College / Background</label>
                          <input id="collegeBackground" type="text" value={collegeBackground} onChange={(e) => setCollegeBackground(e.target.value)} className="w-full bg-[#111111] border border-white/10 rounded-[10px] p-3 text-[#e4e4e4] outline-none focus:border-[#c8f135]/50 transition-colors" />
                        </div>

                        <div>
                          <label htmlFor="linkedinUrl" style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#a1a1a1", display: "block", marginBottom: "8px" }}>LinkedIn URL</label>
                          <input id="linkedinUrl" type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} className="w-full bg-[#111111] border border-white/10 rounded-[10px] p-3 text-[#e4e4e4] outline-none focus:border-[#c8f135]/50 transition-colors" />
                        </div>

                        <div>
                          <label htmlFor="shortBio" style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#a1a1a1", display: "block", marginBottom: "8px" }}>Short Bio</label>
                          <textarea id="shortBio" value={shortBio} onChange={(e) => setShortBio(e.target.value)} className="w-full h-[80px] resize-none bg-[#111111] border border-white/10 rounded-[10px] p-3 text-[#e4e4e4] outline-none focus:border-[#c8f135]/50 transition-colors" />
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
                <AuthGate>
                    <button 
                      onClick={handleNext}
                      disabled={submitting}
                      className="flex-1 py-3.5 bg-[#c8f135] text-black font-semibold rounded-[10px] hover:bg-[#b0d829] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px" }}
                    >
                      {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      {formStep === 4 ? "Create Profile" : "Next →"}
                    </button>
                </AuthGate>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connect Modal */}
      <AnimatePresence>
        {connectProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0f0f0f] border border-white/10 rounded-[16px] w-full max-w-md overflow-hidden flex flex-col"
            >
              <div className="h-14 border-b border-white/10 flex items-center justify-between px-5">
                <div style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "16px", fontWeight: 700, color: "#fff" }}>
                  Connect with {connectProfile.name}
                </div>
                <button onClick={() => setConnectProfile(null)} className="text-[#6b6b6b] hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 flex flex-col gap-4">
                <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#a1a1a1" }}>
                  Send a message to introduce yourself and share why you'd be a great fit to build together.
                </p>
                <textarea 
                  value={connectMessage}
                  onChange={(e) => setConnectMessage(e.target.value)}
                  className="w-full h-[120px] resize-none bg-[#111111] border border-white/10 rounded-[10px] p-3 text-[#e4e4e4] outline-none focus:border-[#c8f135]/50 transition-colors"
                />
                <button 
                  onClick={submitConnectionRequest}
                  disabled={sendingRequest}
                  className="w-full py-3 bg-[#c8f135] text-black font-semibold rounded-[8px] hover:bg-[#b0d829] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                  style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px" }}
                >
                  {sendingRequest && <Loader2 className="w-4 h-4 animate-spin" />}
                  Send Request
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
