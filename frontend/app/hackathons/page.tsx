"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Users } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ErrorBoundary from "@/components/ErrorBoundary";
import PageControls from "@/components/PageControls";
import { HackathonListSchema } from "@/components/seo/HackathonSchema";
import HackathonsSEOContent from "@/components/seo/HackathonsSEOContent";

const HackathonArena = dynamic(
  () => import("@/components/3d/HackathonArena"),
  { ssr: false }
);

const FILTERS = ["All", "Online", "Offline", "Hybrid", "Ecosystem-hosted", "External"];

const COLORS = ["#c8f135", "#a78bfa", "#22c55e", "#38bdf8", "#fb923c", "#f472b6"];

// API returns the Prisma enum uppercase (ONLINE/OFFLINE/HYBRID) — prettify for display.
const prettyMode = (mode?: string) =>
  mode ? mode.charAt(0).toUpperCase() + mode.slice(1).toLowerCase() : "";

function getDaysLeft(dateStr: string): number {
  const end = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.ceil((end - now) / 86400000);
}

export default function HackathonsPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [featuredHackathon, setFeaturedHackathon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/hackathons`),
      fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/hackathons/featured`)
    ])
      .then(async ([listRes, featuredRes]) => {
        const listData = await listRes.json();
        const featuredData = await featuredRes.json();

        if (listData.success && listData.data) {
          const formatted = listData.data.map((h: any, i: number) => ({
            id: h.id,
            name: h.title || h.name,
            org: h.organizer || "DevUp",
            prize: h.prizePool || "TBD",
            mode: h.mode || "ONLINE",
            isEcosystemHosted: h.isEcosystemHosted ?? false,
            date: h.startDate && h.endDate
              ? `${new Date(h.startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} - ${new Date(h.endDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`
              : "TBD",
            daysLeft: h.registrationDeadline ? getDaysLeft(h.registrationDeadline) : (h.endDate ? getDaysLeft(h.endDate) : 30),
            color: COLORS[i % COLORS.length],
          }));
          setHackathons(formatted);
        }

        if (featuredData.success && featuredData.data) {
          setFeaturedHackathon(featuredData.data);
          // Set initial countdown
          const end = new Date(featuredData.data.registrationDeadline).getTime();
          const now = Date.now();
          const diff = Math.max(0, end - now);
          setTimeLeft({
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((diff / 1000 / 60) % 60),
            seconds: Math.floor((diff / 1000) % 60),
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!featuredHackathon) return;
    const end = new Date(featuredHackathon.registrationDeadline).getTime();
    
    const timer = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, end - now);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [featuredHackathon]);



  const filteredHackathons = hackathons.filter(h => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Online") return h.mode === "ONLINE";
    if (activeFilter === "Offline") return h.mode === "OFFLINE";
    if (activeFilter === "Hybrid") return h.mode === "HYBRID";
    if (activeFilter === "Ecosystem-hosted") return h.isEcosystemHosted === true;
    if (activeFilter === "External") return h.isEcosystemHosted === false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <PageHeader
        label="COMPETE & WIN"
        headline="Hackathons built\nfor builders."
        accentWord="builders"
        subtitle="From 24-hour sprints to month-long challenges. Compete solo or with a team. Win prizes, get noticed."
        variant="beam"
      />

      {/* Featured Hackathon Card (Hero Card) */}
      {loading ? (
        <div className="max-w-7xl mx-auto px-4 md:px-8 mb-4 relative z-10">
          <div className="bg-[#111111] border border-white/10 rounded-[20px] h-[320px] animate-pulse" />
        </div>
      ) : featuredHackathon ? (
        <div className="max-w-7xl mx-auto px-4 md:px-8 mb-4 relative z-10">
          <div className="bg-[#111111] border border-white/10 rounded-[20px] overflow-hidden flex flex-col md:flex-row relative">
            {featuredHackathon.bannerUrl && (
              <div 
                className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: `url(${featuredHackathon.bannerUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            )}
            {/* Left section */}
            <div className="p-6 sm:p-10 flex-1 border-b md:border-b-0 md:border-r border-white/5 relative z-10 bg-gradient-to-r from-[#111111] via-[#111111]/90 to-transparent">
              <div 
                className="inline-block px-3 py-1 bg-[rgba(200,241,53,0.1)] border border-[rgba(200,241,53,0.2)] text-[#c8f135] rounded-full mb-6"
                style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em" }}
              >
                FEATURED
              </div>
              
              <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "clamp(26px, 7vw, 36px)", fontWeight: 800, color: "#fff", marginBottom: "8px", lineHeight: 1.1 }}>
                {featuredHackathon.title}
              </h2>
              <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#6b6b6b", marginBottom: "24px" }}>
                Hosted by {featuredHackathon.organizer}
              </div>
              
              <div className="mb-6">
                <div style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "clamp(34px, 9vw, 48px)", fontWeight: 700, color: "#c8f135", lineHeight: 1 }}>
                  {featuredHackathon.prizePool}
                </div>
                <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", color: "#6b6b6b", marginTop: "4px", letterSpacing: "0.05em" }}>
                  PRIZE POOL
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3 py-1.5 bg-[#1a1a1a] border border-white/5 text-[#a1a1a1] rounded-[6px]" style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "12px" }}>
                  {prettyMode(featuredHackathon.mode)}
                </span>
                {featuredHackathon.domain?.slice(0, 3).map((tag: string) => (
                  <span 
                    key={tag}
                    className="px-3 py-1.5 bg-[#1a1a1a] border border-white/5 text-[#a1a1a1] rounded-[6px]"
                    style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "12px" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px", color: "#a1a1a1", marginBottom: "32px" }}>
                Starts: {new Date(featuredHackathon.startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} &nbsp;·&nbsp; Ends: {new Date(featuredHackathon.endDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
              </div>

              <div className="flex flex-wrap gap-4 mb-8">
                <Link href={`/hackathons/${featuredHackathon.id}`}>
                  <button 
                    className="h-[52px] px-8 bg-[#c8f135] text-black font-bold rounded-[10px] hover:bg-[#b0d829] transition-colors"
                    style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "15px" }}
                  >
                    Register Now
                  </button>
                </Link>
                <Link href={`/hackathons/${featuredHackathon.id}`}>
                  <button 
                    className="h-[52px] px-8 bg-[#111111] text-[#e4e4e4] border border-white/10 font-semibold rounded-[10px] hover:bg-white/5 transition-colors group"
                    style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "15px" }}
                  >
                    Learn More <span className="inline-block transition-transform group-hover:translate-x-1 ml-1">→</span>
                  </button>
                </Link>
              </div>

              {/* Presented By Strip */}
              {featuredHackathon.partners && featuredHackathon.partners.length > 0 && (
                <div className="pt-6 border-t border-white/5">
                  <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "10px", color: "#6b6b6b", letterSpacing: "0.1em", marginBottom: "12px" }}>
                    PRESENTED BY
                  </div>
                  <div className="flex flex-wrap gap-4 items-center">
                    {featuredHackathon.partners.map((p: any) => (
                      <div key={p.id} className="group relative flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
                        {p.logoUrl ? (
                          <img 
                            src={p.logoUrl} 
                            alt={p.name} 
                            className="w-8 h-8 object-contain filter grayscale group-hover:grayscale-0 transition-all" 
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
            
            {/* Right section (Timer) */}
            <div className="p-6 sm:p-10 md:w-[400px] bg-[#0a0a0a]/90 backdrop-blur-sm flex flex-col items-center justify-center relative overflow-hidden z-10 border-l border-white/5">
              <div className="absolute inset-0 bg-[#c8f135] opacity-[0.02]" />
              
              {new Date(featuredHackathon.registrationDeadline).getTime() < Date.now() ? (
                <div className="z-10 text-center">
                  <div style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "32px", fontWeight: 700, color: "#fff", marginBottom: "8px" }}>
                    Registration Closed
                  </div>
                  <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px", color: "#6b6b6b" }}>
                    Thanks to everyone who applied!
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "12px", color: "#6b6b6b", letterSpacing: "0.1em", marginBottom: "24px", zIndex: 10 }}>
                    REGISTRATION CLOSES IN
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 z-10">
                    {[
                      { label: "DAYS", value: timeLeft.days },
                      { label: "HOURS", value: timeLeft.hours },
                      { label: "MINUTES", value: timeLeft.minutes },
                      { label: "SECONDS", value: timeLeft.seconds }
                    ].map((item, i, arr) => (
                      <div key={item.label} className="flex items-center gap-2 sm:gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className="w-[clamp(44px,14vw,72px)] h-[clamp(44px,14vw,72px)] bg-[#0a0a0a] border border-white/10 rounded-[12px] flex items-center justify-center overflow-hidden relative shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
                          >
                            <AnimatePresence mode="popLayout">
                              <motion.div
                                key={item.value}
                                initial={{ y: "50%", opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: "-50%", opacity: 0 }}
                                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "clamp(19px, 6vw, 32px)", fontWeight: 700, color: "#fff", position: "absolute" }}
                              >
                                {item.value.toString().padStart(2, "0")}
                              </motion.div>
                            </AnimatePresence>
                          </div>
                          <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "10px", color: "#6b6b6b", marginTop: "12px", letterSpacing: "0.05em" }}>
                            {item.label}
                          </div>
                        </div>
                        {i < arr.length - 1 && (
                          <div className="pb-6" style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "clamp(16px, 5vw, 24px)", color: "#6b6b6b" }}>:</div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="max-w-7xl mx-auto px-4 md:px-8 mb-4 relative z-10">
          <div className="bg-[#111111] border border-white/10 rounded-[20px] p-16 text-center text-gray-500">
            No featured hackathon at the moment. Explore our list below!
          </div>
        </div>
      )}

      <ErrorBoundary>
        <HackathonArena />
      </ErrorBoundary>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12 pb-24">
        
        <PageControls
          filters={
            <>
              {FILTERS.map(f => {
                const isActive = activeFilter === f;
                return (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className="whitespace-nowrap rounded-full transition-all duration-150 flex-shrink-0"
                    style={{
                      padding: "8px 16px",
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: "14px",
                      border: `1px solid ${isActive ? 'rgba(200,241,53,0.3)' : 'rgba(255,255,255,0.08)'}`,
                      background: isActive ? 'rgba(200,241,53,0.1)' : 'transparent',
                      color: isActive ? '#c8f135' : '#6b6b6b',
                    }}
                  >
                    {f}
                  </button>
                )
              })}
            </>
          }
          resultsCount={`${filteredHackathons.length} hackathons found`}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredHackathons.map((hackathon, idx) => {
              const isClosed = hackathon.daysLeft < 0;
              let modeColor = "#38bdf8"; // Online
              if (hackathon.mode === "OFFLINE") modeColor = "#fb923c";
              if (hackathon.mode === "HYBRID") modeColor = "#a78bfa";
              let statusColor = "#a1a1a1";
              if (isClosed) {
                statusColor = "#6b6b6b";
              } else if (hackathon.daysLeft <= 7) {
                statusColor = "#fb923c";
              }

              return (
                <motion.div
                  key={hackathon.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, delay: Math.min(idx * 0.05, 0.5), ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link 
                    href={`/hackathons/${hackathon.id}`}
                    className="h-full bg-[#111111] border border-white/5 rounded-[14px] overflow-hidden flex flex-col group transition-all duration-300 hover:border-white/20 hover:translate-y-[-4px] no-underline"
                  >
                    {/* Top Color Strip */}
                    <div className="w-full h-[8px]" style={{ background: hackathon.color }} />
                    
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-start justify-between mb-6">
                        <div className="w-[40px] h-[40px] rounded-[8px] bg-[#0a0a0a] border border-white/10 flex items-center justify-center">
                          <span style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "18px", fontWeight: 700, color: "#fff" }}>
                            {hackathon.org[0]}
                          </span>
                        </div>
                        <div 
                          className="px-2 py-1 rounded-[4px]"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: modeColor, fontSize: "11px", fontFamily: "var(--font-inter), sans-serif" }}
                        >
                          {prettyMode(hackathon.mode)}
                        </div>
                      </div>

                      <h3 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "18px", fontWeight: 700, color: "#fff", marginBottom: "8px" }}>
                        {hackathon.name}
                      </h3>
                      
                      <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px", color: "#c8f135", marginBottom: "20px" }}>
                        {hackathon.prize} Prize Pool
                      </div>

                      <div className="flex items-center gap-2 mb-8" style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#6b6b6b" }}>
                        <Calendar className="w-4 h-4" />
                        {hackathon.date}
                      </div>

                      <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
                        <div 
                          style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "12px", color: statusColor }}
                        >
                          {isClosed ? "Registration closed" : `${hackathon.daysLeft}d left to register`}
                        </div>
                        
                        <span 
                          className="px-4 py-2 font-semibold rounded-[6px] transition-colors"
                          style={{ 
                            background: isClosed ? "rgba(255,255,255,0.05)" : "#c8f135",
                            color: isClosed ? "#6b6b6b" : "#000",
                            fontFamily: "var(--font-inter), sans-serif", 
                            fontSize: "13px",
                          }}
                        >
                          {isClosed ? "Closed" : "View & Register"}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

      </div>

      {/* Schema.org ItemList structured data */}
      {hackathons.length > 0 && (
        <HackathonListSchema
          hackathons={hackathons.map((h: any) => ({ id: h.id, name: h.name }))}
        />
      )}

      {/* SEO Content (keyword-rich, below the fold) */}
      <HackathonsSEOContent />
    </div>
  );
}
