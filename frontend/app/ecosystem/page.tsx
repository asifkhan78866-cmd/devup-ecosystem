"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShieldCheck, Briefcase, MapPin } from "lucide-react";
import Link from "next/link";
import FloatingSymbols from "@/components/FloatingSymbols";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const CATEGORIES = ["All", "AI/ML", "Fintech", "HealthTech", "DevTools", "SaaS", "EdTech", "Web3"];
const PLACEHOLDERS = ["Search startups...", "Find by domain...", "Explore AI startups..."];

const STARTUPS = [
  {
    id: "nexus-ai",
    name: "NexusAI",
    tagline: "Next-gen LLM orchestration for enterprise.",
    stage: "Seed",
    domain: "AI/ML",
    roles: 3,
    verified: true,
    location: "Bengaluru",
    color: "from-blue-500 to-cyan-400"
  },
  {
    id: "volt-space",
    name: "VoltSpace",
    tagline: "Decentralized energy trading protocol.",
    stage: "Series A",
    domain: "Web3",
    roles: 5,
    verified: true,
    location: "Delhi NCR",
    color: "from-amber-400 to-orange-500"
  },
  {
    id: "synth",
    name: "Synth",
    tagline: "Generative audio synthesis engine.",
    stage: "Pre-seed",
    domain: "AI/ML",
    roles: 1,
    verified: false,
    location: "Remote",
    color: "from-purple-500 to-pink-500"
  },
  {
    id: "blockchain-x",
    name: "BlockChainX",
    tagline: "Zero-knowledge proof infrastructure.",
    stage: "Seed",
    domain: "Web3",
    roles: 2,
    verified: true,
    location: "Pune",
    color: "from-emerald-400 to-green-600"
  },
  {
    id: "med-sync",
    name: "MedSync",
    tagline: "Unified patient record platform.",
    stage: "Seed",
    domain: "HealthTech",
    roles: 4,
    verified: true,
    location: "Hyderabad",
    color: "from-rose-400 to-red-500"
  },
  {
    id: "dev-flow",
    name: "DevFlow",
    tagline: "Automated CI/CD pipeline generator.",
    stage: "Pre-seed",
    domain: "DevTools",
    roles: 2,
    verified: false,
    location: "Remote",
    color: "from-gray-600 to-gray-400"
  }
];

export default function EcosystemPage() {
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredStartups = STARTUPS.filter((s) => {
    const matchesCategory = activeCategory === "All" || s.domain === activeCategory;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.tagline.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      <div className="fixed inset-0 opacity-50 z-0 pointer-events-none">
        <FloatingSymbols />
      </div>

      <div className="pt-32 pb-24 px-4 relative z-10 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-bold mb-6"
            >
              Our Ecosystem
            </motion.h1>
            
            {/* Search Bar */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="max-w-2xl mx-auto relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative glass-card rounded-2xl p-2 flex items-center">
                <Search className="w-6 h-6 text-[var(--text-muted)] ml-4" />
                <div className="relative flex-1 h-12 ml-4">
                  <AnimatePresence mode="wait">
                    {!searchQuery && (
                      <motion.div
                        key={placeholderIdx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 flex items-center text-[var(--text-muted)] pointer-events-none text-lg"
                      >
                        {PLACEHOLDERS[placeholderIdx]}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <input 
                    type="text" 
                    className="absolute inset-0 w-full h-full bg-transparent outline-none text-lg text-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Categories */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex overflow-x-auto pb-4 mb-12 gap-3 hide-scrollbar w-full"
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeCategory === cat 
                    ? "bg-[var(--accent-primary)] text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
                    : "glass text-[var(--text-muted)] hover:text-white hover:bg-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </motion.div>

          {/* Startup Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredStartups.map((startup, idx) => (
                <motion.div
                  key={startup.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                >
                  <Link href={`/ecosystem/${startup.id}`}>
                    <Card className="h-full p-0 overflow-hidden group cursor-pointer border-white/5 hover:border-white/20">
                      <div className={`h-24 w-full bg-gradient-to-r ${startup.color} opacity-30 group-hover:opacity-50 transition-opacity`} />
                      
                      <div className="p-6 relative">
                        <div className={`absolute -top-12 left-6 w-16 h-16 rounded-xl bg-gradient-to-br ${startup.color} flex items-center justify-center shadow-lg border border-white/10`}>
                          <span className="text-2xl font-bold text-white">{startup.name[0]}</span>
                        </div>
                        
                        <div className="mt-6">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-2xl font-bold flex items-center gap-2">
                              {startup.name}
                              {startup.verified && (
                                <ShieldCheck className="w-5 h-5 text-blue-400" />
                              )}
                            </h3>
                            <Badge variant="secondary">{startup.stage}</Badge>
                          </div>
                          
                          <p className="text-[var(--text-muted)] mb-6 h-12">
                            {startup.tagline}
                          </p>
                          
                          <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <div className="flex items-center gap-4">
                              <Badge variant="outline" className="border-white/10">{startup.domain}</Badge>
                              <div className="flex items-center text-xs text-[var(--text-muted)] gap-1">
                                <MapPin className="w-3 h-3" />
                                {startup.location}
                              </div>
                            </div>
                            
                            {startup.roles > 0 && (
                              <div className="flex items-center gap-1 text-xs font-medium text-[var(--accent-green)] bg-[var(--accent-green)]/10 px-2 py-1 rounded-full">
                                <Briefcase className="w-3 h-3" />
                                {startup.roles} Roles
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {filteredStartups.length === 0 && (
              <div className="col-span-full py-20 text-center text-[var(--text-muted)]">
                <p className="text-xl">No startups found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
