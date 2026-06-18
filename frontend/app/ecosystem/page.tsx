"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShieldCheck, MapPin, Briefcase, FilterX } from "lucide-react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import ErrorBoundary from "@/components/ErrorBoundary";
import PageControls from "@/components/PageControls";

// Dynamically import 3D element with ssr: false
const EcosystemConstellation = dynamic(
  () => import("@/components/3d/EcosystemConstellation"),
  { ssr: false }
);

const CATEGORIES = ["All", "AI/ML", "FinTech", "HealthTech", "DevTools", "SaaS", "EdTech", "Web3", "E-commerce", "CleanTech", "DeepTech", "Other"];

const DOMAIN_MAP: Record<string, string> = {
  AI_ML: "AI/ML",
  FINTECH: "FinTech",
  HEALTHTECH: "HealthTech",
  DEVTOOLS: "DevTools",
  SAAS: "SaaS",
  EDTECH: "EdTech",
  WEB3: "Web3",
  E_COMMERCE: "E-commerce",
  CLEANTECH: "CleanTech",
  DEEPTECH: "DeepTech",
  OTHER: "Other"
};

const STAGE_MAP: Record<string, string> = {
  IDEA: "Idea",
  MVP: "MVP",
  PRE_SEED: "Pre-seed",
  SEED: "Seed",
  SERIES_A: "Series A",
  SERIES_B: "Series B",
  GROWTH: "Growth"
};

export default function EcosystemPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [startups, setStartups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/startups`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          const formatted = data.data.map((s: any) => ({
            id: s.id,
            name: s.name,
            tagline: s.tagline || s.description || "",
            stage: STAGE_MAP[s.stage] || s.stage || "Seed",
            domain: DOMAIN_MAP[s.domain] || s.domain || "Tech",
            roles: s._count?.jobs || 0,
            verified: s.isVerified || false,
            location: s.location || s.city || "Global",
            logoUrl: s.logoUrl,
            bannerUrl: s.bannerUrl,
          }));
          setStartups(formatted);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredStartups = startups.filter((s) => {
    const matchesCategory = activeCategory === "All" || s.domain === activeCategory;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tagline.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <PageHeader
        label="THE ECOSYSTEM"
        headline="Every startup\nbuilding with us."
        accentWord="building"
        subtitle="Browse verified startups, explore open roles, and connect with the founders behind them."
        variant="rings"
      />

      <ErrorBoundary>
        <EcosystemConstellation />
      </ErrorBoundary>

      {/* Search & Filter Bar */}
      <div 
        className="sticky top-[76px] z-40 w-full border-b border-white/5 px-4 py-4 md:px-8"
        style={{
          background: "rgba(10,10,10,0.9)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="max-w-7xl mx-auto">
          <PageControls
            search={
              <div className="relative w-full md:w-[320px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b6b6b]" />
                <input
                  type="text"
                  placeholder="Search startups, founders, domains..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#111111] border border-white/10 rounded-lg py-2.5 pl-10 pr-4 outline-none transition-all focus:border-[#c8f135]/40 focus:shadow-[0_0_0_3px_rgba(200,241,53,0.08)]"
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize: "14px",
                    color: "#e4e4e4"
                  }}
                />
              </div>
            }
            filters={
              <>
                {CATEGORIES.map((cat) => {
                  const isActive = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className="whitespace-nowrap rounded-full transition-all duration-150 flex-shrink-0"
                      style={{
                        padding: "6px 14px",
                        fontFamily: "var(--font-inter), sans-serif",
                        fontSize: "13px",
                        border: `1px solid ${isActive ? 'rgba(200,241,53,0.3)' : 'rgba(255,255,255,0.08)'}`,
                        background: isActive ? 'rgba(200,241,53,0.1)' : 'transparent',
                        color: isActive ? '#c8f135' : '#6b6b6b',
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </>
            }
            resultsCount={`Showing ${filteredStartups.length} startups · ${new Set(filteredStartups.map(s => s.domain)).size} domains · ${filteredStartups.reduce((acc, curr) => acc + curr.roles, 0)} open roles`}
            sort={
              <select 
                className="bg-transparent border-none text-[#6b6b6b] text-[13px] outline-none cursor-pointer"
                style={{ fontFamily: "var(--font-inter), sans-serif" }}
              >
                <option>Latest</option>
                <option>Stage</option>
                <option>Most roles</option>
              </select>
            }
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">

        {/* Grid */}
        {filteredStartups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredStartups.map((startup, idx) => (
                <motion.div
                  key={startup.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, delay: Math.min(idx * 0.05, 0.5), ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link href={`/ecosystem/${startup.id}`} className="block h-full group">
                    <div 
                      className="h-full bg-[#111111] border border-white/5 rounded-[16px] overflow-hidden transition-all duration-300 group-hover:border-white/15 group-hover:translate-y-[-4px]"
                    >
                      {/* Background Banner */}
                      {startup.bannerUrl ? (
                        <div 
                          className="h-24 w-full bg-cover bg-center opacity-80"
                          style={{ backgroundImage: `url(${startup.bannerUrl})` }}
                        />
                      ) : (
                        <div 
                          className="h-24 w-full opacity-80" 
                          style={{
                            background: `linear-gradient(135deg, hsl(${(startup.name.codePointAt(0) ?? 0) * 10}, 70%, 20%), hsl(${(startup.name.codePointAt(startup.name.length - 1) ?? 0) * 10}, 70%, 10%))`
                          }} 
                        />
                      )}

                      <div className="p-6 relative">
                        {/* Logo */}
                        <div 
                          className="absolute -top-10 left-6 w-[56px] h-[56px] bg-[#0a0a0a] flex items-center justify-center border border-white/10 rounded-[12px] shadow-2xl overflow-hidden"
                        >
                          {startup.logoUrl ? (
                            <img src={startup.logoUrl} alt={startup.name} className="w-full h-full object-cover" />
                          ) : (
                            <span style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "20px", fontWeight: 700, color: "#fff" }}>
                              {startup.name[0]}
                            </span>
                          )}
                        </div>

                        <div className="mt-4">
                          <h3 
                            className="flex items-center gap-2 mb-1"
                            style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "20px", fontWeight: 700, color: "#fff" }}
                          >
                            {startup.name}
                            {startup.verified && (
                              <ShieldCheck className="w-[14px] h-[14px]" style={{ color: "#c8f135" }} />
                            )}
                          </h3>
                          
                          <p 
                            className="mb-6 h-12"
                            style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px", color: "#a1a1a1", lineHeight: 1.5 }}
                          >
                            {startup.tagline}
                          </p>

                          <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <div className="flex items-center gap-3">
                              <span 
                                className="px-2 py-1 rounded-[4px]"
                                style={{ 
                                  fontFamily: "var(--font-inter), sans-serif", 
                                  fontSize: "11px", 
                                  background: "rgba(255,255,255,0.04)", 
                                  border: "1px solid rgba(255,255,255,0.06)",
                                  color: "#e4e4e4" 
                                }}
                              >
                                {startup.domain}
                              </span>
                              <div className="flex items-center gap-1" style={{ fontSize: "11px", color: "#6b6b6b", fontFamily: "var(--font-inter), sans-serif" }}>
                                <MapPin className="w-3 h-3" />
                                {startup.location}
                              </div>
                            </div>

                            {startup.roles > 0 && (
                              <div className="flex items-center gap-1" style={{ fontSize: "11px", color: "#c8f135", fontFamily: "var(--font-inter), sans-serif" }}>
                                <Briefcase className="w-3 h-3" />
                                {startup.roles} Roles
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="w-full h-[200px] flex flex-col items-center justify-center text-center mt-10">
            <FilterX className="w-20 h-20 mb-4" style={{ color: "rgba(255,255,255,0.04)" }} />
            <h3 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "18px", color: "#fff", marginBottom: "4px" }}>
              No startups found
            </h3>
            <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px", color: "#6b6b6b", marginBottom: "16px" }}>
              Try a different filter or search term.
            </p>
            <button
              onClick={() => { setActiveCategory("All"); setSearchQuery(""); }}
              className="px-4 py-2 rounded-[8px] transition-colors"
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: "13px",
                background: "rgba(255,255,255,0.05)",
                color: "#e4e4e4",
                border: "1px solid rgba(255,255,255,0.1)"
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
