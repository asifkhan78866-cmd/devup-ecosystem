"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Clock, MapPin, IndianRupee, Zap } from "lucide-react";
import FloatingSymbols from "@/components/FloatingSymbols";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const FILTERS = ["All", "Online", "Offline", "Ecosystem-hosted", "External"];

const HACKATHONS = [
  { id: 1, name: "GenAI Builders Week", org: "DevUp", prize: "₹5,000,000", mode: "Online", type: "Ecosystem-hosted", date: "Oct 15 - Oct 22", tags: ["AI/ML", "LLM", "Agents"], color: "from-blue-500 to-cyan-400" },
  { id: 2, name: "Web3 Protocol Hack", org: "Polygon", prize: "$50,000", mode: "Offline", type: "External", date: "Nov 2 - Nov 4", tags: ["DeFi", "ZK", "Smart Contracts"], color: "from-purple-500 to-indigo-500" },
  { id: 3, name: "Fintech Disrupt", org: "DevUp", prize: "₹2,500,000", mode: "Offline", type: "Ecosystem-hosted", date: "Dec 10 - Dec 12", tags: ["Payments", "DeFi", "B2B"], color: "from-emerald-400 to-green-500" },
  { id: 4, name: "HealthTech Sprint", org: "MedSync", prize: "₹1,000,000", mode: "Online", type: "External", date: "Jan 5 - Jan 15", tags: ["Healthcare", "AI", "Data"], color: "from-rose-400 to-red-500" },
];

export default function HackathonsPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [timeLeft, setTimeLeft] = useState({ days: 14, hours: 23, minutes: 59, seconds: 59 });

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

  const filteredHackathons = HACKATHONS.filter(h => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Online") return h.mode === "Online";
    if (activeFilter === "Offline") return h.mode === "Offline";
    if (activeFilter === "Ecosystem-hosted") return h.type === "Ecosystem-hosted";
    if (activeFilter === "External") return h.type === "External";
    return true;
  });

  return (
    <>
      <div className="fixed inset-0 opacity-40 z-0 pointer-events-none">
        <FloatingSymbols />
      </div>

      <div className="pt-32 pb-24 px-4 relative z-10 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-16">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-bold mb-4"
            >
              Build. Compete. <span className="text-gradient">Win.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-[var(--text-muted)] max-w-2xl mx-auto"
            >
              Join the most intense hackathons in the ecosystem. Turn your weekend projects into funded startups.
            </motion.p>
          </div>

          {/* Featured Hackathon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-20"
          >
            <Card className="p-0 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 pointer-events-none" />
              <div className="absolute -right-20 -top-20 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />

              <div className="flex flex-col md:flex-row items-center p-8 md:p-12 gap-12 relative z-10">
                <div className="flex-1">
                  <Badge variant="secondary" className="mb-4 border-blue-400 text-blue-400 bg-blue-400/10">Featured</Badge>
                  <h2 className="text-4xl md:text-5xl font-bold mb-4">India AI Agents Summit Hackathon</h2>
                  <p className="text-xl text-[var(--text-muted)] mb-8">
                    Build autonomous agents that solve real-world problems. The winning team gets guaranteed pre-seed funding and direct entry into DevUp Cohort 4.
                  </p>
                  <div className="flex flex-wrap gap-6 mb-8">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      <span className="font-bold text-lg">₹10,000,000 Pool</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-[var(--text-muted)]" />
                      <span className="text-[var(--text-muted)]">Bengaluru (Offline)</span>
                    </div>
                  </div>
                  <Button variant="primary" size="lg" withShimmer>
                    Register Now
                  </Button>
                </div>

                <div className="w-full md:w-auto">
                  <div className="glass-card p-6 rounded-2xl border-white/10">
                    <div className="text-[var(--text-muted)] text-sm mb-4 text-center font-medium uppercase tracking-wider">Starting In</div>
                    <div className="flex gap-4">
                      {[
                        { label: "Days", value: timeLeft.days },
                        { label: "Hours", value: timeLeft.hours },
                        { label: "Mins", value: timeLeft.minutes },
                        { label: "Secs", value: timeLeft.seconds }
                      ].map((item, i) => (
                        <div key={item.label} className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-black/50 rounded-xl flex items-center justify-center text-3xl font-mono font-bold border border-white/5 shadow-inner">
                            {item.value.toString().padStart(2, "0")}
                          </div>
                          <span className="text-xs text-[var(--text-muted)] mt-2">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Filters */}
          <div className="flex overflow-x-auto pb-4 mb-8 gap-3 hide-scrollbar">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`shrink-0 px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${activeFilter === f
                    ? "bg-white text-black"
                    : "glass text-[var(--text-muted)] hover:text-white hover:bg-white/10"
                  }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredHackathons.map((hackathon, idx) => (
                <motion.div
                  key={hackathon.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                >
                  <Card className="h-full flex flex-col group border-white/5 hover:border-white/20">
                    <div className="flex items-start justify-between mb-6">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${hackathon.color} flex items-center justify-center font-bold text-xl text-white shadow-lg`}>
                        {hackathon.org[0]}
                      </div>
                      <Badge variant="outline">{hackathon.mode}</Badge>
                    </div>

                    <h3 className="text-2xl font-bold mb-2 group-hover:text-[var(--accent-primary)] transition-colors">{hackathon.name}</h3>
                    <p className="text-[var(--text-muted)] text-sm mb-6">by {hackathon.org}</p>

                    <div className="space-y-3 mb-8 flex-1">
                      <div className="flex items-center gap-3 text-sm">
                        <IndianRupee className="w-4 h-4 text-yellow-500" />
                        <span className="font-semibold">{hackathon.prize} Pool</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
                        <Clock className="w-4 h-4" />
                        <span>{hackathon.date}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {hackathon.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="bg-white/5 text-[10px]">{tag}</Badge>
                        ))}
                      </div>
                    </div>

                    <Button variant="outline" className="w-full group/btn">
                      Register
                      <Zap className="w-4 h-4 ml-2 group-hover/btn:text-yellow-400 transition-colors" />
                    </Button>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}
