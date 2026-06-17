"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Loader2, Search, Filter } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ErrorBoundary from "@/components/ErrorBoundary";
import PageControls from "@/components/PageControls";
import MobileBottomSheet from "@/components/MobileBottomSheet";

const CareerNetworkGraph = dynamic(
  () => import("@/components/3d/CareerNetworkGraph"),
  { ssr: false }
);

const TABS = ["Internships", "Full-time Jobs", "Remote Only"];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

export default function CareersPage() {
  const [activeTab, setActiveTab] = useState("Full-time Jobs");
  const [stipendValue, setStipendValue] = useState(50);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/jobs`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          const formatted = data.data.map((j: any) => ({
            id: j.id,
            role: j.title,
            company: j.startup?.name || "DevUp",
            type: j.type || "Full-time",
            location: j.location || "Remote",
            stipend: j.salary || "",
            date: timeAgo(j.createdAt),
            logo: (j.startup?.name || "D")[0],
            description: j.description,
          }));
          setJobs(formatted);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <PageHeader
        label="OPPORTUNITIES"
        headline="Find your next\nrole."
        accentWord="role"
        subtitle="Internships, full-time positions, and remote roles across the DevUp ecosystem and partner companies."
        variant="grid"
      />

      <ErrorBoundary>
        <CareerNetworkGraph />
      </ErrorBoundary>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12 pb-24">
        
        {/* Mobile Page Controls (Search, Tabs, Filter Button) */}
        <div className="md:hidden block mb-6">
          <PageControls
            search={
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b6b6b]" />
                <input
                  type="text"
                  placeholder="Search roles or companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#111111] border border-white/10 rounded-lg py-3 pl-10 pr-4 outline-none transition-all focus:border-[#c8f135]/40"
                  style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px", color: "#e4e4e4" }}
                />
              </div>
            }
            filters={
              <>
                {TABS.map((tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
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
                      {tab}
                    </button>
                  )
                })}
              </>
            }
            sort={
              <button
                onClick={() => setBottomSheetOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#111111] border border-white/10 rounded-lg text-[#e4e4e4] transition-colors hover:bg-white/5"
                style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px" }}
              >
                Filters <Filter size={14} />
              </button>
            }
          />
        </div>

        {/* Desktop Prominent Tabs (Hidden on mobile) */}
        <div className="hidden md:flex flex-col sm:flex-row justify-center gap-4 mb-16">
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="transition-all duration-200"
                style={{
                  background: isActive ? "rgba(200,241,53,0.06)" : "#111111",
                  border: `1px solid ${isActive ? 'rgba(200,241,53,0.3)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: "10px",
                  padding: "12px 24px",
                  fontFamily: "var(--font-syne), sans-serif",
                  fontSize: "15px",
                  fontWeight: 600,
                  color: isActive ? "#c8f135" : "#6b6b6b",
                  cursor: "pointer"
                }}
              >
                {tab}
              </button>
            )
          })}
        </div>

        {/* Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Left Sidebar Filters (Desktop only) */}
          <div className="hidden lg:block w-[260px] shrink-0 space-y-8">
            <div>
              <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", color: "#6b6b6b", textTransform: "uppercase", marginBottom: "12px", letterSpacing: "0.05em" }}>Domain</div>
              <div className="space-y-3">
                {["AI/ML", "Fintech", "HealthTech", "DevTools", "SaaS"].map(d => (
                  <label key={d} className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center w-4 h-4 border border-white/20 rounded-[4px] bg-transparent group-hover:border-white/40 transition-colors">
                      <input type="checkbox" className="opacity-0 absolute inset-0 cursor-pointer peer" />
                      <div className="hidden peer-checked:block w-2 h-2 bg-[#c8f135] rounded-[2px]" />
                    </div>
                    <span style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px", color: "#a1a1a1" }} className="group-hover:text-white transition-colors">{d}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", color: "#6b6b6b", textTransform: "uppercase", marginBottom: "12px", letterSpacing: "0.05em" }}>Location</div>
              <input
                type="text"
                placeholder="e.g. Bengaluru, Remote"
                className="w-full bg-[#111111] border border-white/10 rounded-[8px] px-3 py-2 outline-none focus:border-[#c8f135]/40 focus:shadow-[0_0_0_3px_rgba(200,241,53,0.08)] transition-all"
                style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px", color: "#e4e4e4" }}
              />
            </div>
            
            <div>
              <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", color: "#6b6b6b", textTransform: "uppercase", marginBottom: "12px", letterSpacing: "0.05em" }}>Type</div>
              <div className="flex flex-wrap gap-2">
                {["In-office", "Hybrid", "Remote"].map(t => (
                  <button 
                    key={t}
                    className="px-3 py-1.5 rounded-full"
                    style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)", color: "#a1a1a1", fontSize: "13px", fontFamily: "var(--font-inter), sans-serif" }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-12">
                <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Min Stipend/Salary</div>
                <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "12px", color: "#c8f135" }}>₹{stipendValue}k+</div>
              </div>
              <div className="relative w-full h-1 bg-white/10 rounded-full">
                <div className="absolute top-0 left-0 h-full bg-[#c8f135] rounded-full" style={{ width: `${stipendValue}%` }} />
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={stipendValue} 
                  onChange={(e) => setStipendValue(Number.parseInt(e.target.value, 10))}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer"
                />
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full pointer-events-none shadow-md"
                  style={{ left: `calc(${stipendValue}% - 8px)` }}
                />
              </div>
            </div>

            <button 
              className="mt-4 bg-transparent border-none text-[#6b6b6b] hover:text-[#e4e4e4] transition-colors cursor-pointer"
              style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px" }}
            >
              Clear All Filters
            </button>
          </div>

          {/* Right Content */}
          <div className="flex-1 flex flex-col gap-4">
            <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px", color: "#6b6b6b", marginBottom: "8px" }}>
              {loading ? "Loading..." : `${jobs.length} opportunities found`}
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#c8f135]" />
              </div>
            )}

            {/* Empty State */}
            {!loading && jobs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "18px", color: "#fff", marginBottom: "8px" }}>No jobs posted yet</p>
                <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px", color: "#6b6b6b" }}>Check back soon — startups are always hiring.</p>
              </div>
            )}

            {/* Job List */}
            {jobs.map((job) => {
              const isInternship = job.type === "Internship";
              const isRemote = job.location === "Remote";
              let badgeColor = "#c8f135";
              if (isInternship) {
                badgeColor = "#fb923c";
              } else if (isRemote) {
                badgeColor = "#38bdf8";
              }

              return (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => setSelectedJob(job)}
                  className="group relative flex flex-col sm:flex-row sm:items-center gap-4 bg-[#111111] border border-white/5 rounded-[12px] p-5 cursor-pointer transition-all duration-200 hover:border-white/15 hover:translate-x-1"
                >
                  <div className="absolute left-[-1px] top-4 bottom-4 w-[4px] bg-[#c8f135] rounded-r-md opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="w-[40px] h-[40px] bg-[#0a0a0a] rounded-[10px] flex items-center justify-center shrink-0 border border-white/10">
                    <span style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "16px", fontWeight: 700, color: "#fff" }}>{job.logo}</span>
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h4 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "15px", fontWeight: 700, color: "#fff" }}>
                        {job.role}
                      </h4>
                      <span 
                        className="px-2 py-0.5 rounded-[4px]"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: badgeColor, fontSize: "11px", fontFamily: "var(--font-inter), sans-serif" }}
                      >
                        {job.type}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2" style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#6b6b6b" }}>
                      <span>{job.company}</span>
                      <span>·</span>
                      <span>{job.location}</span>
                      <span>·</span>
                      <span style={{ color: "#a1a1a1" }}>{job.stipend}</span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 mt-4 sm:mt-0">
                    <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "12px", color: "#3d3d3d" }}>
                      {job.date}
                    </div>
                    <span
                      className="px-3.5 py-1.5 bg-[#c8f135] text-black font-semibold rounded-[6px]"
                      style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px" }}
                    >
                      Quick Apply
                    </span>
                  </div>
                </button>
              );
            })}

            {/* Resume Upload bottom card */}
            <div className="mt-16 bg-[#0f0f0f] border border-dashed rounded-[16px] p-12 text-center flex flex-col items-center" style={{ borderColor: "rgba(200,241,53,0.2)" }}>
              <Upload className="w-8 h-8 mb-4" style={{ color: "#c8f135" }} />
              <h3 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "22px", color: "#fff", marginBottom: "8px" }}>
                Let startups find you
              </h3>
              <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "15px", color: "#6b6b6b", marginBottom: "24px", maxWidth: "400px" }}>
                Upload your resume and get discovered by ecosystem founders actively hiring.
              </p>
              <button 
                className="px-6 py-3 bg-[#c8f135] text-black font-semibold rounded-[8px] mb-3"
                style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px" }}
              >
                Upload Resume
              </button>
              <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "12px", color: "#3d3d3d" }}>
                PDF, up to 5MB
              </div>
            </div>
            
          </div>
      </div>

      <MobileBottomSheet
        isOpen={bottomSheetOpen}
        onClose={() => setBottomSheetOpen(false)}
        title="Filters"
        footer={
          <button
            onClick={() => setBottomSheetOpen(false)}
            className="w-full py-3 bg-[#c8f135] text-black font-bold rounded-xl"
            style={{ fontFamily: 'var(--font-inter), sans-serif', fontSize: '15px' }}
          >
            Apply Filters
          </button>
        }
      >
        <div className="space-y-8">
          <div>
            <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", color: "#6b6b6b", textTransform: "uppercase", marginBottom: "12px", letterSpacing: "0.05em" }}>Domain</div>
            <div className="space-y-3">
              {["AI/ML", "Fintech", "HealthTech", "DevTools", "SaaS"].map(d => (
                <label key={d} className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-4 h-4 border border-white/20 rounded-[4px] bg-transparent group-hover:border-white/40 transition-colors">
                    <input type="checkbox" className="opacity-0 absolute inset-0 cursor-pointer peer" />
                    <div className="hidden peer-checked:block w-2 h-2 bg-[#c8f135] rounded-[2px]" />
                  </div>
                  <span style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px", color: "#a1a1a1" }} className="group-hover:text-white transition-colors">{d}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", color: "#6b6b6b", textTransform: "uppercase", marginBottom: "12px", letterSpacing: "0.05em" }}>Location</div>
            <input
              type="text"
              placeholder="e.g. Bengaluru, Remote"
              className="w-full bg-[#111111] border border-white/10 rounded-[8px] px-3 py-2 outline-none focus:border-[#c8f135]/40 transition-all"
              style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px", color: "#e4e4e4" }}
            />
          </div>
          
          <div>
            <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", color: "#6b6b6b", textTransform: "uppercase", marginBottom: "12px", letterSpacing: "0.05em" }}>Type</div>
            <div className="flex flex-wrap gap-2">
              {["In-office", "Hybrid", "Remote"].map(t => (
                <button 
                  key={t}
                  className="px-3 py-1.5 rounded-full"
                  style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)", color: "#a1a1a1", fontSize: "13px", fontFamily: "var(--font-inter), sans-serif" }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-12">
              <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Min Stipend/Salary</div>
              <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "12px", color: "#c8f135" }}>₹{stipendValue}k+</div>
            </div>
            <div className="relative w-full h-1 bg-white/10 rounded-full">
              <div className="absolute top-0 left-0 h-full bg-[#c8f135] rounded-full" style={{ width: `${stipendValue}%` }} />
              <input 
                type="range" 
                min="0" max="100" 
                value={stipendValue} 
                onChange={(e) => setStipendValue(Number.parseInt(e.target.value, 10))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full pointer-events-none shadow-md"
                style={{ left: `calc(${stipendValue}% - 8px)` }}
              />
            </div>
          </div>

          <button 
            className="mt-4 bg-transparent border-none text-[#6b6b6b] hover:text-[#e4e4e4] transition-colors cursor-pointer"
            style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px" }}
          >
            Clear All Filters
          </button>
        </div>
      </MobileBottomSheet>
    </div>

      {/* Job Slide-up Panel */}
      <AnimatePresence>
        {selectedJob && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setSelectedJob(null)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed max-lg:bottom-[calc(64px+env(safe-area-inset-bottom,0px))] lg:bottom-0 left-0 right-0 max-h-[85vh] bg-[#0a0a0a] border-t border-white/10 rounded-t-[24px] z-50 overflow-y-auto"
              style={{ boxShadow: "0 -20px 40px rgba(0,0,0,0.5)" }}
            >
              <div className="max-w-3xl mx-auto p-6 md:p-10 relative">
                <button 
                  onClick={() => setSelectedJob(null)}
                  className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-[#6b6b6b] hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-[56px] h-[56px] bg-[#111111] rounded-[12px] flex items-center justify-center shrink-0 border border-white/10">
                    <span style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "24px", fontWeight: 700, color: "#fff" }}>{selectedJob.logo}</span>
                  </div>
                  <div>
                    <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "24px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>
                      {selectedJob.role}
                    </h2>
                    <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px", color: "#a1a1a1" }}>
                      {selectedJob.company} · {selectedJob.location}
                    </div>
                  </div>
                </div>

                <div className="prose prose-invert max-w-none mb-10" style={{ fontFamily: "var(--font-inter), sans-serif", color: "#a1a1a1" }}>
                  <h3 style={{ color: "#fff", fontFamily: "var(--font-syne), sans-serif" }}>About the role</h3>
                  <p>
                    We are looking for an experienced engineer to join our core team. You will be responsible for building the foundation of our application, optimizing performance, and ensuring a seamless user experience.
                  </p>
                  <h3 style={{ color: "#fff", fontFamily: "var(--font-syne), sans-serif" }}>Requirements</h3>
                  <ul className="text-[14px]">
                    <li>Strong proficiency in React and modern TypeScript.</li>
                    <li>Experience with WebGL or Three.js is a huge plus.</li>
                    <li>Ability to write clean, maintainable, and performant code.</li>
                  </ul>
                </div>
                
                <div className="bg-[#111111] border border-white/5 rounded-[16px] p-6 mb-6">
                  <h3 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "18px", color: "#fff", marginBottom: 16 }}>Apply for this role</h3>
                  
                  <div className="space-y-4 mt-4">
                    <div>
                      <label htmlFor="coverNote" style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#a1a1a1", display: "block", marginBottom: "8px" }}>Cover Note (Optional)</label>
                      <textarea 
                        id="coverNote"
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-[10px] p-4 outline-none text-[#e4e4e4] focus:border-[#c8f135]/50 transition-colors resize-none h-[100px]"
                        placeholder="Why are you a good fit?"
                      />
                    </div>
                    
                    <button className="w-full py-3 bg-[#c8f135] text-black font-semibold rounded-[10px] transition-transform hover:scale-[1.01]">
                      Submit Application (Uses profile resume)
                    </button>
                  </div>
                </div>
                
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
