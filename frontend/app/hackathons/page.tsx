"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Users } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ErrorBoundary from "@/components/ErrorBoundary";
import PageControls from "@/components/PageControls";

const HackathonArena = dynamic(
  () => import("@/components/3d/HackathonArena"),
  { ssr: false }
);

const FILTERS = ["All", "Online", "Offline", "Hybrid", "Ecosystem-hosted", "External"];

const COLORS = ["#c8f135", "#a78bfa", "#22c55e", "#38bdf8", "#fb923c", "#f472b6"];

function getDaysLeft(dateStr: string): number {
  const end = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.ceil((end - now) / 86400000);
}

export default function HackathonsPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [timeLeft, setTimeLeft] = useState({ days: 14, hours: 23, minutes: 59, seconds: 59 });

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/hackathons`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          const formatted = data.data.map((h: any, i: number) => ({
            id: h.id,
            name: h.title || h.name,
            org: h.organizer || "DevUp",
            prize: h.prizePool || "TBD",
            mode: h.mode || "Online",
            type: h.type || "Ecosystem-hosted",
            date: h.startDate && h.endDate
              ? `${new Date(h.startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} - ${new Date(h.endDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`
              : "TBD",
            daysLeft: h.registrationDeadline ? getDaysLeft(h.registrationDeadline) : (h.endDate ? getDaysLeft(h.endDate) : 30),
            color: COLORS[i % COLORS.length],
          }));
          setHackathons(formatted);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { days, hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) { hours = 23; days--; }
        return { days, hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredHackathons = hackathons.filter(h => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Online") return h.mode === "Online";
    if (activeFilter === "Offline") return h.mode === "Offline";
    if (activeFilter === "Hybrid") return h.mode === "Hybrid";
    if (activeFilter === "Ecosystem-hosted") return h.type === "Ecosystem-hosted";
    if (activeFilter === "External") return h.type === "External";
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
      <div className="max-w-7xl mx-auto px-4 md:px-8 mb-4 relative z-10">
        <div className="bg-[#111111] border border-white/10 rounded-[20px] overflow-hidden flex flex-col md:flex-row">
          
          {/* Left section */}
          <div className="p-10 flex-1 border-b md:border-b-0 md:border-r border-white/5">
            <div 
              className="inline-block px-3 py-1 bg-[rgba(200,241,53,0.1)] border border-[rgba(200,241,53,0.2)] text-[#c8f135] rounded-full mb-6"
              style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em" }}
            >
              FEATURED
            </div>
            
            <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "36px", fontWeight: 800, color: "#fff", marginBottom: "8px", lineHeight: 1.1 }}>
              Global Hackathon '26
            </h2>
            <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#6b6b6b", marginBottom: "24px" }}>
              Hosted by DevUp Ecosystem
            </div>
            
            <div className="mb-6">
              <div style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "48px", fontWeight: 700, color: "#c8f135", lineHeight: 1 }}>
                ₹2,00,000
              </div>
              <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", color: "#6b6b6b", marginTop: "4px", letterSpacing: "0.05em" }}>
                PRIZE POOL
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {["Online", "AI / Web3", "500+ Participants"].map(tag => (
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
              Starts: June 15 &nbsp;·&nbsp; Ends: June 30
            </div>

            <div className="flex flex-wrap gap-4">
              <button 
                className="h-[52px] px-8 bg-[#c8f135] text-black font-bold rounded-[10px] hover:bg-[#b0d829] transition-colors"
                style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "15px" }}
              >
                Register Now
              </button>
              <button 
                className="h-[52px] px-8 bg-transparent text-[#e4e4e4] border border-white/10 font-semibold rounded-[10px] hover:bg-white/5 transition-colors group"
                style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "15px" }}
              >
                Learn More <span className="inline-block transition-transform group-hover:translate-x-1 ml-1">→</span>
              </button>
            </div>
          </div>
          
          {/* Right section (Timer) */}
          <div className="p-10 md:w-[400px] bg-[#0a0a0a] flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[#c8f135] opacity-[0.02]" />
            <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "12px", color: "#6b6b6b", letterSpacing: "0.1em", marginBottom: "24px", zIndex: 10 }}>
              REGISTRATION CLOSES IN
            </div>

            <div className="flex items-center gap-4 z-10">
              {[
                { label: "DAYS", value: timeLeft.days },
                { label: "HOURS", value: timeLeft.hours },
                { label: "MINUTES", value: timeLeft.minutes },
                { label: "SECONDS", value: timeLeft.seconds }
              ].map((item, i, arr) => (
                <div key={item.label} className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <div 
                      className="w-[72px] h-[72px] sm:w-[80px] sm:h-[80px] bg-[#0a0a0a] border border-white/10 rounded-[12px] flex items-center justify-center overflow-hidden relative shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
                    >
                      {/* Using framer motion to create a flip effect */}
                      <AnimatePresence mode="popLayout">
                        <motion.div
                          key={item.value}
                          initial={{ y: "50%", opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: "-50%", opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "36px", fontWeight: 700, color: "#fff", position: "absolute" }}
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
                    <div style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "24px", color: "#6b6b6b", paddingBottom: "24px" }}>:</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

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
              if (hackathon.mode === "Offline") modeColor = "#fb923c";
              if (hackathon.mode === "Hybrid") modeColor = "#a78bfa";
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
                  <div 
                    className="h-full bg-[#111111] border border-white/5 rounded-[14px] overflow-hidden flex flex-col group transition-all duration-300 hover:border-white/20 hover:translate-y-[-4px]"
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
                          {hackathon.mode}
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
                        
                        <button 
                          disabled={isClosed}
                          className="px-4 py-2 font-semibold rounded-[6px] transition-colors"
                          style={{ 
                            background: isClosed ? "rgba(255,255,255,0.05)" : "#c8f135",
                            color: isClosed ? "#6b6b6b" : "#000",
                            fontFamily: "var(--font-inter), sans-serif", 
                            fontSize: "13px",
                            cursor: isClosed ? "not-allowed" : "pointer"
                          }}
                        >
                          {isClosed ? "Closed" : "Register"}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
