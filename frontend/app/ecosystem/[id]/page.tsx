"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, ShieldCheck } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useAuth } from "@/lib/auth/AuthProvider";
import ProtectedContent from "@/components/auth/ProtectedContent";
import AuthGate from "@/components/auth/AuthGate";
import AiAnalysisSection from "@/components/startup/AiAnalysisSection";
import StartupGallery from "@/components/startup/StartupGallery";

// Dynamic import for 3D element
const StartupDNA = dynamic(
  () => import("@/components/3d/StartupDNA"),
  { ssr: false }
);

const TABS = ["Overview", "Team", "Open Roles", "Gallery", "Updates"];

const DOMAIN_MAP: Record<string, string> = {
  AI_ML: "AI/ML", FINTECH: "FinTech", HEALTHTECH: "HealthTech", DEVTOOLS: "DevTools",
  SAAS: "SaaS", EDTECH: "EdTech", WEB3: "Web3", E_COMMERCE: "E-commerce",
  CLEANTECH: "CleanTech", DEEPTECH: "DeepTech", OTHER: "Other"
};

const STAGE_MAP: Record<string, string> = {
  IDEA: "Idea", MVP: "MVP", PRE_SEED: "Pre-seed", SEED: "Seed",
  SERIES_A: "Series A", SERIES_B: "Series B", GROWTH: "Growth"
};

export default function StartupProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [activeTab, setActiveTab] = useState("Overview");
  const [startup, setStartup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  //  const [activeTab, setActiveTab] = useState("Overview");
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [connectMessage, setConnectMessage] = useState("");
  const [connectStatus, setConnectStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [connectError, setConnectError] = useState("");
  const { session } = useAuth();

  useEffect(() => {
    if (!id) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/startups/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          const s = data.data;
          setStartup({
            id: s.id,
            name: s.name,
            tagline: s.tagline,
            color: `hsl(${(s.name.codePointAt(0) ?? 0) * 10}, 70%, 50%)`,
            verified: s.isVerified,
            domain: DOMAIN_MAP[s.domain] || s.domain,
            location: s.location || s.city || "Global",
            founded: s.foundedYear?.toString() || "Unknown",
            headcount: s.headcount || "N/A",
            stage: STAGE_MAP[s.stage] || s.stage,
            funding: s.fundingAmount || "Undisclosed",
            about: s.description,
            website: s.website,
            logoUrl: s.logoUrl,
            screenshotUrls: s.screenshotUrls || [],
            aiAnalysis: s.aiAnalysis,
            github: s.githubUrl,
            linkedin: s.linkedinUrl,
            twitter: s.twitterUrl,
            team: [
              ...(s.founders?.map((f: any) => ({
                name: f.profile?.name || f.email,
                role: "Co-founder",
                bio: f.profile?.bio || "",
                seed: f.id,
                linkedin: f.profile?.linkedinUrl || "#"
              })) || []),
              ...(s.founderNames?.map((name: string) => ({
                name,
                role: "Co-founder",
                bio: "",
                seed: name,
                linkedin: "#"
              })) || [])
            ],
            roles: s.jobs || []
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">Loading...</div>;
  }
  if (!startup) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">Startup not found.</div>;
  }

  const handleConnect = async () => {
    setConnectStatus("loading");
    setConnectError("");
    try {
      // Find the primary founder (just take the first one with a seed/userId for now)
      const primaryFounder = startup.team.find((f: any) => f.seed && !f.seed.includes(' '));
      if (!primaryFounder) {
        throw new Error("No valid founder found to connect with");
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/connections/request`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}` 
        },
        body: JSON.stringify({
          toUserId: primaryFounder.seed,
          message: connectMessage
        })
      });
      const data = await res.json();
      if (data.success) {
        setConnectStatus("success");
        setTimeout(() => setIsConnectModalOpen(false), 2000);
      } else {
        throw new Error(data.error || data.message || "Failed to send request");
      }
    } catch (err: any) {
      setConnectStatus("error");
      setConnectError(err.message || "An error occurred");
    }
  };

  // Render starts here

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24">
      {/* Back Navigation */}
      <div className="w-full pt-28 pb-4 max-w-7xl mx-auto px-4 md:px-8">
        <button 
          onClick={() => router.push('/ecosystem')}
          className="group flex items-center text-[#6b6b6b] hover:text-white transition-colors"
          style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px" }}
        >
          <span className="inline-block transition-transform duration-200 group-hover:-translate-x-1">←</span>
          <span className="ml-2">Back to Ecosystem</span>
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8">
  {/* Header Banner */}
        <div className="relative w-full h-[280px] mb-16">
          {/* Inner wrapper for backgrounds with overflow-hidden for rounded corners */}
          <div className="absolute inset-0 rounded-[16px] overflow-hidden bg-[#111111]">
            {/* Banner background */}
            {startup.screenshotUrls && startup.screenshotUrls.length > 0 ? (
              <div 
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${startup.screenshotUrls[0]})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: 0.6
                }}
              />
            ) : (
              <div 
                className="absolute inset-0 opacity-20"
                style={{
                  background: `linear-gradient(135deg, ${startup.color} 0%, transparent 100%)`
                }}
              />
            )}
            {/* Grid Pattern overlay */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: "radial-gradient(circle at center, rgba(255,255,255,0.2) 1px, transparent 1px)",
                backgroundSize: "16px 16px"
              }}
            />
            {/* Ghost Watermark */}
            <div 
              className="absolute -bottom-8 -right-8 opacity-[0.06] select-none pointer-events-none whitespace-nowrap"
              style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "120px", fontWeight: 800, color: "#fff" }}
            >
              {startup.name}
            </div>
          </div>

          {/* Logo Card */}
          <div 
            className="absolute -bottom-8 left-10 w-[72px] h-[72px] bg-[#111111] rounded-[16px] flex items-center justify-center overflow-hidden"
            style={{ border: "3px solid #0a0a0a", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}
          >
            {startup.logoUrl ? (
              <img src={startup.logoUrl} alt={startup.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "28px", fontWeight: 700, color: "#fff" }}>
                {startup.name[0]}
              </span>
            )}
          </div>

          {/* Verified Badge */}
          {startup.verified && (
            <div 
              className="absolute flex items-center gap-1 z-10"
              style={{
                bottom: "-16px",
                left: "124px",
                background: "rgba(10,10,10,0.9)",
                border: "1px solid rgba(200,241,53,0.3)",
                color: "#c8f135",
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: "11px",
                padding: "4px 12px",
                borderRadius: "100px",
                backdropFilter: "blur(4px)"
              }}
            >
              <ShieldCheck className="w-[14px] h-[14px]" /> Verified Startup
            </div>
          )}
        </div>

        {/* Content Layout */}
        <div className="flex flex-col lg:flex-row gap-12 mt-12">
          
          {/* Left Column (65%) */}
          <div className="flex-[0_0_100%] lg:flex-[0_0_62%]">
            
            {/* Title & Tagline for mobile (hidden on desktop maybe, or just keep above tabs) */}
            <div className="mb-8 pl-2">
              <h1 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "36px", fontWeight: 800, color: "#fff", marginBottom: "8px" }}>
                {startup.name}
              </h1>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-1 text-[11px] uppercase tracking-wider font-semibold rounded bg-white/5 border border-white/10 text-[#c8f135] font-inter">
                  Part of DevUp Ecosystem
                </span>
              </div>
              <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "16px", color: "#a1a1a1", lineHeight: 1.5 }}>
                {startup.tagline}
              </p>
            </div>

            {/* Tab Bar */}
            <div className="flex gap-6 border-b border-white/5 mb-8 overflow-x-auto hide-scrollbar pl-2">
              {TABS.map(tab => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="pb-4 relative whitespace-nowrap transition-colors duration-200"
                    style={{
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: "14px",
                      color: isActive ? "#fff" : "#6b6b6b",
                      fontWeight: isActive ? 500 : 400
                    }}
                  >
                    {tab}
                    {isActive && (
                      <motion.div
                        layoutId="profileActiveTab"
                        className="absolute bottom-0 left-0 right-0 h-[2px]"
                        style={{ background: "#c8f135" }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="pl-2"
              >
                {activeTab === "Overview" && (
                  <div className="space-y-12">
                    <section>
                      <h3 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "20px", fontWeight: 700, color: "#fff", marginBottom: "16px" }}>
                        About {startup.name}
                      </h3>
                      <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "15px", color: "#a1a1a1", lineHeight: 1.6 }}>
                        {startup.about}
                      </p>
                      
                      {startup.aiAnalysis && (
                        <AiAnalysisSection analysis={startup.aiAnalysis} />
                      )}
                    </section>

                    {/* Stats 2x2 Grid */}
                    <div className="grid grid-cols-2 gap-y-8 gap-x-4">
                      <div>
                        <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", color: "#6b6b6b", textTransform: "uppercase", marginBottom: "4px" }}>Founded</div>
                        <div style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "18px", fontWeight: 700, color: "#fff" }}>{startup.founded}</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", color: "#6b6b6b", textTransform: "uppercase", marginBottom: "4px" }}>Headcount</div>
                        <div style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "18px", fontWeight: 700, color: "#fff" }}>{startup.headcount}</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", color: "#6b6b6b", textTransform: "uppercase", marginBottom: "4px" }}>Location</div>
                        <div style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "18px", fontWeight: 700, color: "#fff" }}>{startup.location}</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", color: "#6b6b6b", textTransform: "uppercase", marginBottom: "4px" }}>Stage</div>
                        <div style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "18px", fontWeight: 700, color: "#fff" }}>{startup.stage}</div>
                      </div>
                    </div>

                    <div className="pt-8 border-t border-white/5">
                      <div className="flex flex-wrap gap-2 mb-8">
                        <span 
                          className="px-3 py-1.5 rounded-full"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "#e4e4e4", fontSize: "13px" }}
                        >
                          {startup.domain}
                        </span>
                        <span 
                          className="px-3 py-1.5 rounded-full"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "#e4e4e4", fontSize: "13px" }}
                        >
                          B2B SaaS
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-6">
                        {startup.website && (
                          <a href={startup.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group">
                            <ExternalLink className="w-4 h-4 text-[#6b6b6b] group-hover:text-white transition-colors" />
                            <span className="text-[#6b6b6b] group-hover:text-white group-hover:underline transition-colors" style={{ fontSize: "13px" }}>Website</span>
                          </a>
                        )}
                        {startup.github && (
                          <a href={startup.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group">
                            <svg className="w-4 h-4 text-[#6b6b6b] group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                            <span className="text-[#6b6b6b] group-hover:text-white group-hover:underline transition-colors" style={{ fontSize: "13px" }}>GitHub</span>
                          </a>
                        )}
                        {startup.linkedin && (
                          <a href={startup.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group">
                            <svg className="w-4 h-4 text-[#6b6b6b] group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                            <span className="text-[#6b6b6b] group-hover:text-white group-hover:underline transition-colors" style={{ fontSize: "13px" }}>LinkedIn</span>
                          </a>
                        )}
                        {startup.twitter && (
                          <a href={startup.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group">
                            <svg className="w-4 h-4 text-[#6b6b6b] group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                            <span className="text-[#6b6b6b] group-hover:text-white group-hover:underline transition-colors" style={{ fontSize: "13px" }}>Twitter</span>
                          </a>
                        )}
                      </div>

                      {startup.website && (
                        <div className="mt-12">
                          <h3 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "20px", fontWeight: 700, color: "#fff", marginBottom: "16px" }}>
                            Glimpse into {startup.name}
                          </h3>
                          <div className="relative w-full h-[320px] rounded-[16px] overflow-hidden border border-white/10 group bg-black shadow-2xl">
                            {/* Scaled Iframe */}
                            <iframe 
                              src={startup.website.startsWith('http') ? startup.website : `https://${startup.website}`} 
                              title={`${startup.name} Website`}
                              className="w-[200%] h-[200%] border-none absolute top-0 left-0 origin-top-left pointer-events-none"
                              style={{ transform: "scale(0.5)", background: "#fff" }}
                              loading="lazy"
                            />
                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
                            
                            {/* Overlay Content */}
                            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                              <div>
                                <h4 className="text-white text-lg font-bold mb-1">{startup.name}</h4>
                                <p className="text-[#a1a1a1] text-sm">{startup.website}</p>
                              </div>
                              <a 
                                href={startup.website.startsWith('http') ? startup.website : `https://${startup.website}`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 pointer-events-auto border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                              >
                                Visit Live Website <ExternalLink className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "Team" && (
                  <ProtectedContent blurRadius={12} message="Unlock to view Team Details">
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                        {startup.team.length > 0 ? startup.team.map((founder: any) => (
                          <div 
                            key={founder.seed}
                            className="bg-[#111111] border border-white/5 rounded-[16px] p-5 flex flex-col gap-4"
                          >
                            <div className="flex items-start justify-between">
                              <img 
                                src={`https://api.dicebear.com/7.x/notionists/svg?seed=${founder.seed}&backgroundColor=0a0a0a`}
                                alt={founder.name} 
                                className="w-[56px] h-[56px] rounded-[12px] border border-white/10"
                              />
                              {founder.linkedin !== '#' && (
                                <a href={founder.linkedin} target="_blank" rel="noopener noreferrer" className="text-[#6b6b6b] hover:text-[#c8f135] transition-colors p-2">
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                                </a>
                              )}
                            </div>
                            <div>
                              <h4 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "16px", fontWeight: 700, color: "#fff" }}>
                                {founder.name}
                              </h4>
                              <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#c8f135", marginBottom: "8px" }}>
                                {founder.role}
                              </p>
                              <p 
                                className="line-clamp-3"
                                style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#a1a1a1", lineHeight: 1.5 }}
                              >
                                {founder.bio}
                              </p>
                            </div>
                          </div>
                        )) : (
                          <div className="col-span-full py-10 text-center text-[#6b6b6b]">
                            Team information not available.
                          </div>
                        )}
                      </div>
                      
                      {/* Inline DNA element */}
                      <div className="mt-8 border-t border-white/5 pt-8">
                        <h3 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "16px", color: "#6b6b6b", marginBottom: "16px" }}>Startup DNA</h3>
                        <div className="w-full bg-[#0a0a0a] rounded-[16px] border border-white/5 overflow-hidden">
                          <ErrorBoundary>
                            <StartupDNA color={startup.color} />
                          </ErrorBoundary>
                        </div>
                      </div>
                    </div>
                  </ProtectedContent>
                )}

                {activeTab === "Open Roles" && (
                  <div className="space-y-3">
                    {startup.roles.length > 0 ? startup.roles.map((role: any) => (
                      <div 
                        key={role.id || `${role.title}-${role.location}`}
                        className="group bg-[#111111] border border-white/5 rounded-[12px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:border-white/20"
                      >
                        <div>
                          <h4 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "16px", fontWeight: 700, color: "#fff", marginBottom: "8px" }}>
                            {role.title}
                          </h4>
                          <div className="flex items-center gap-3">
                            <span 
                              className="px-2 py-1 rounded-[4px]"
                              style={{ 
                                fontFamily: "var(--font-inter), sans-serif", 
                                fontSize: "11px", 
                                background: "rgba(255,255,255,0.04)", 
                                border: "1px solid rgba(255,255,255,0.06)",
                                color: role.type === "INTERNSHIP" ? "#fb923c" : "#c8f135" 
                              }}
                            >
                              {role.type}
                            </span>
                            <span style={{ fontSize: "13px", color: "#6b6b6b", fontFamily: "var(--font-inter), sans-serif" }}>
                              {role.location}
                            </span>
                            {role.isRemote && (
                              <>
                                <span style={{ color: "#333" }}>·</span>
                                <span style={{ fontSize: "13px", color: "#6b6b6b", fontFamily: "var(--font-inter), sans-serif" }}>
                                  Remote OK
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <AuthGate>
                          <button 
                            className="whitespace-nowrap px-4 py-2 bg-[#c8f135] text-black font-semibold rounded-[8px] transition-transform duration-200 hover:scale-[1.02]"
                            style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px" }}
                          >
                            <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">Apply →</span>
                          </button>
                        </AuthGate>
                      </div>
                    )) : (
                      <div className="py-16 text-center text-[#6b6b6b]">
                        No open roles currently.
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "Gallery" && (
                  <div className="space-y-4">
                    <StartupGallery images={startup.screenshotUrls} />
                  </div>
                )}

                {activeTab === "Updates" && (
                  <div className="w-full py-16 flex flex-col items-center justify-center text-center">
                    <span className="text-[120px] opacity-[0.02] select-none mb-4" style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 800 }}>0</span>
                    <h3 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "20px", color: "#fff", marginBottom: "8px" }}>No updates yet</h3>
                    <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px", color: "#6b6b6b" }}>Check back later for news and milestones.</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

          </div>

          {/* Right Sidebar (35%) */}
          <div className="flex-[0_0_100%] lg:flex-[0_0_35%]">
            <div className="sticky top-[100px]">
              <div 
                className="bg-[#111111] border border-white/5 rounded-[16px] p-6"
              >
                <h3 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "16px", fontWeight: 700, color: "#fff", marginBottom: "16px" }}>
                  Connect with Founders
                </h3>
                
                {/* Overlapping avatars */}
                <div className="flex mb-6">
                  {startup.team.map((f: any, index: number) => (
                    <div 
                      key={`${f.name}-${f.seed}`} 
                      className="w-10 h-10 rounded-full border-2 border-[#111111] bg-[#0a0a0a] overflow-hidden flex items-center justify-center"
                      style={{ marginLeft: index > 0 ? "-12px" : "0", zIndex: 10 - index }}
                      title={f.name}
                    >
                      <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${f.seed}&backgroundColor=0a0a0a`} alt={f.name} className="w-full h-full" />
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => setIsConnectModalOpen(true)}
                  className="w-full py-3 bg-[#c8f135] text-black font-semibold rounded-[8px] hover:bg-[#b0d829] transition-colors mb-2"
                  style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px" }}
                >
                  Connect with Founders
                </button>
                {startup.website && (
                  <a 
                    href={startup.website.startsWith('http') ? startup.website : `https://${startup.website}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex justify-center w-full py-3 bg-transparent border border-white/10 text-[#e4e4e4] font-medium rounded-[8px] hover:bg-white/5 transition-colors"
                    style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px" }}
                  >
                    Visit Website
                  </a>
                )}

                <div className="w-full h-px bg-white/5 my-6" />

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: "11px", color: "#6b6b6b", fontFamily: "var(--font-inter), sans-serif", textTransform: "uppercase" }}>Open Roles</span>
                    <span style={{ fontSize: "14px", color: "#fff", fontFamily: "var(--font-inter), sans-serif", fontWeight: 500 }}>{startup.roles.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: "11px", color: "#6b6b6b", fontFamily: "var(--font-inter), sans-serif", textTransform: "uppercase" }}>Founded</span>
                    <span style={{ fontSize: "14px", color: "#fff", fontFamily: "var(--font-inter), sans-serif", fontWeight: 500 }}>{startup.founded}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: "11px", color: "#6b6b6b", fontFamily: "var(--font-inter), sans-serif", textTransform: "uppercase" }}>Stage</span>
                    <span style={{ fontSize: "14px", color: "#fff", fontFamily: "var(--font-inter), sans-serif", fontWeight: 500 }}>{startup.stage}</span>
                  </div>
                </div>

                <div className="mb-6 p-4 bg-[#0a0a0a] rounded-[8px] border border-white/5">
                  <div style={{ fontSize: "11px", color: "#6b6b6b", fontFamily: "var(--font-inter), sans-serif", textTransform: "uppercase", marginBottom: "4px" }}>Total Funding</div>
                  <div style={{ fontSize: "18px", color: "#c8f135", fontFamily: "var(--font-syne), sans-serif", fontWeight: 700 }}>{startup.funding}</div>
                </div>

                <button 
                  className="flex items-center gap-2 text-[#6b6b6b] hover:text-[#e4e4e4] transition-colors"
                  style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px" }}
                >
                  Share profile <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl text-white font-bold" style={{ fontFamily: "var(--font-syne)" }}>Connect with Founder</h2>
              <button 
                onClick={() => setIsConnectModalOpen(false)} 
                className="text-[#6b6b6b] hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {connectStatus === "success" ? (
              <div className="text-center py-8">
                <ShieldCheck className="w-16 h-16 text-[#c8f135] mx-auto mb-4" />
                <h3 className="text-white font-bold mb-2">Request Sent!</h3>
                <p className="text-[#a1a1a1] text-sm">They will be notified of your request.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {connectStatus === "error" && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
                    {connectError}
                  </div>
                )}
                <div>
                  <label className="block text-sm text-[#a1a1a1] mb-1.5" style={{ fontFamily: "var(--font-inter)" }}>Message (Optional)</label>
                  <textarea 
                    value={connectMessage} 
                    onChange={(e) => setConnectMessage(e.target.value)}
                    className="w-full h-32 bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#c8f135]/50 transition-colors resize-none"
                    placeholder="Add a personal note..."
                  />
                </div>
                <button 
                  onClick={handleConnect}
                  disabled={connectStatus === "loading"}
                  className="w-full bg-[#c8f135] text-black font-semibold rounded-lg py-3 hover:bg-[#b0d829] transition-colors mt-2 disabled:opacity-50"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  {connectStatus === "loading" ? "Sending..." : "Send Connection Request"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
