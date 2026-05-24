"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileText, MapPin, Clock, IndianRupee, Search } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const TYPES = ["Jobs", "Internships", "Hackathons"];

const JOBS = [
  { id: 1, role: "Senior Frontend Engineer", company: "NexusAI", type: "Full-time", location: "Bengaluru", remote: true, stipend: "₹30-45 LPA", date: "2d ago", logo: "N", color: "from-blue-500 to-cyan-400" },
  { id: 2, content: "Product Marketing Intern", company: "VoltSpace", type: "Internship", location: "Delhi NCR", remote: false, stipend: "₹40k/mo", date: "5h ago", logo: "V", color: "from-amber-400 to-orange-500" },
  { id: 3, role: "Smart Contract Dev", company: "BlockChainX", type: "Contract", location: "Remote", remote: true, stipend: "$5k/mo", date: "1w ago", logo: "B", color: "from-emerald-400 to-green-600" },
  { id: 4, role: "UX Researcher", company: "Synth", type: "Full-time", location: "Remote", remote: true, stipend: "₹18-25 LPA", date: "3d ago", logo: "S", color: "from-purple-500 to-pink-500" },
];

export default function CareersPage() {
  const [activeType, setActiveType] = useState("Jobs");
  const [typewriterText, setTypewriterText] = useState("");
  const fullText = "Find Your Next Opportunity.";

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setTypewriterText(fullText.slice(0, i + 1));
      i++;
      if (i > fullText.length) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-20">
      {/* Split Hero */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 min-h-[150px] lg:min-h-0">
              {typewriterText}
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                className="inline-block w-[3px] h-[1em] bg-[var(--accent-primary)] ml-2 align-middle"
              />
            </h1>
            <p className="text-xl text-[var(--text-muted)] max-w-lg">
              Join the fastest-growing startups in India. From early-stage internships to founding engineer roles.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="glass-card p-2 rounded-3xl flex flex-col sm:flex-row relative">
              {TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveType(type)}
                  className={`flex-1 py-4 px-6 rounded-2xl text-lg font-bold transition-colors relative z-10 ${activeType === type ? "text-white" : "text-[var(--text-muted)] hover:text-white/80"
                    }`}
                >
                  {activeType === type && (
                    <motion.div
                      layoutId="activeTypeBg"
                      className="absolute inset-0 bg-white/10 rounded-2xl -z-10 border border-white/10"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Filters Sidebar */}
          <div className="w-full lg:w-64 shrink-0 space-y-6">
            <div className="sticky top-24 space-y-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search roles..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-[var(--accent-primary)] transition-colors text-white"
                />
              </div>

              <div>
                <h3 className="font-semibold mb-3">Domain</h3>
                <div className="space-y-2">
                  {["Engineering", "Design", "Product", "Marketing", "Sales"].map(d => (
                    <label key={d} className="flex items-center gap-3 text-sm text-[var(--text-muted)] hover:text-white cursor-pointer">
                      <input type="checkbox" className="rounded border-white/20 bg-transparent text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]" />
                      {d}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Location</h3>
                <div className="space-y-2">
                  {["Remote Only", "Bengaluru", "Delhi NCR", "Mumbai"].map(l => (
                    <label key={l} className="flex items-center gap-3 text-sm text-[var(--text-muted)] hover:text-white cursor-pointer">
                      <input type="checkbox" className="rounded border-white/20 bg-transparent text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]" />
                      {l}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Job Listings & Resume Drop */}
          <div className="flex-1 space-y-6">

            {/* Resume Dropzone */}
            <div className="border-2 border-dashed border-white/20 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors p-8 flex flex-col items-center justify-center text-center group cursor-pointer relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] opacity-0 group-hover:opacity-5 transition-opacity" />
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-8 h-8 text-[var(--text-muted)] group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold mb-2">Drop your resume here</h3>
              <p className="text-[var(--text-muted)] mb-4">Let top startups in the ecosystem find you.</p>
              <Button variant="outline" size="sm">Browse Files</Button>
            </div>

            {/* Job Cards */}
            <div className="space-y-4">
              <AnimatePresence>
                {JOBS.map((job) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 group hover:border-[var(--accent-primary)]/50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${job.color} flex items-center justify-center font-bold text-xl text-white shrink-0`}>
                          {job.logo}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold group-hover:text-[var(--accent-primary)] transition-colors">
                            {job.role || job.content}
                          </h3>
                          <div className="text-[var(--text-muted)] text-sm mb-3">{job.company}</div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
                            <span className="flex items-center gap-1"><IndianRupee className="w-3 h-3" /> {job.stipend}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {job.date}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-4">
                        <Badge variant="secondary">{job.type}</Badge>
                        <Button variant="primary" size="sm">Quick Apply</Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
