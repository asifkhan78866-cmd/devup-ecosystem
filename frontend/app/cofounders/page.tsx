"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Target, Zap, Rocket, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StepForm } from "@/components/ui/StepForm";

const PROFILES = [
  { id: 1, name: "Arjun Mehta", college: "IIT Bombay", role: "Tech", skills: ["React", "Node", "AI"], stage: "Idea", needs: "Marketing/Sales", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun" },
  { id: 2, name: "Priya Singh", college: "BITS Pilani", role: "Design", skills: ["UI/UX", "Figma", "Branding"], stage: "MVP", needs: "Tech Lead", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya" },
  { id: 3, name: "Karan Patel", college: "IIM Ahmedabad", role: "Business", skills: ["Sales", "GTM", "Ops"], stage: "Looking to join", needs: "Technical Founder", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Karan" },
  { id: 4, name: "Sneha Reddy", college: "NIT Warangal", role: "Tech", skills: ["Web3", "Solidity", "Rust"], stage: "MVP", needs: "Design & Ops", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha1" },
];

export default function CoFoundersPage() {
  const [view, setView] = useState<"browse" | "list" | "success">("browse");

  const formSteps = [
    {
      title: "Your Profile",
      content: (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold">What's your primary role?</h3>
          <div className="grid grid-cols-2 gap-4">
            {["Developer", "Designer", "Marketer", "Operations", "Sales", "Product"].map(role => (
              <label key={role} className="flex items-center gap-3 p-4 rounded-xl border border-white/10 hover:bg-white/5 cursor-pointer">
                <input type="radio" name="role" className="text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] bg-transparent border-white/20" />
                <span className="font-medium">{role}</span>
              </label>
            ))}
          </div>
          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-2">Top 3 Skills</label>
            <input type="text" placeholder="e.g. React, Next.js, UI Design" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-[var(--accent-primary)] text-white" />
          </div>
        </div>
      )
    },
    {
      title: "Current Status",
      content: (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold">What are you working on?</h3>
          <div className="space-y-4">
            {[
              { id: "idea", label: "I have an idea", desc: "Looking for someone to build it with." },
              { id: "mvp", label: "Building an MVP", desc: "Need help taking it to market." },
              { id: "launched", label: "Already Launched", desc: "Looking to scale and raise funds." },
              { id: "join", label: "Looking to join", desc: "I want to join an exciting project." },
            ].map(stage => (
              <label key={stage.id} className="flex items-start gap-4 p-4 rounded-xl border border-white/10 hover:bg-white/5 cursor-pointer">
                <input type="radio" name="stage" className="mt-1 text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] bg-transparent border-white/20" />
                <div>
                  <div className="font-medium">{stage.label}</div>
                  <div className="text-sm text-[var(--text-muted)]">{stage.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )
    },
    {
      title: "Co-Founder Needs",
      content: (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold">What do you need in a co-founder?</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {["Developer", "Designer", "Marketer", "Operations", "Sales", "Product"].map(role => (
              <label key={role} className="flex items-center gap-3 p-4 rounded-xl border border-white/10 hover:bg-white/5 cursor-pointer">
                <input type="checkbox" className="rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] bg-transparent border-white/20" />
                <span className="font-medium">{role}</span>
              </label>
            ))}
          </div>
          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-2">Anything specific?</label>
            <textarea rows={3} placeholder="Looking for someone who understands B2B SaaS..." className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-[var(--accent-primary)] text-white resize-none" />
          </div>
        </div>
      )
    },
    {
      title: "Logistics",
      content: (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold">Location & Availability</h3>
          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-2">Location</label>
            <input type="text" placeholder="e.g. Bengaluru / Remote" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-[var(--accent-primary)] text-white mb-6" />
          </div>
          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-2">Time Commitment</label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 rounded-xl border border-white/10 hover:bg-white/5 cursor-pointer">
                <input type="radio" name="time" className="text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] bg-transparent border-white/20" />
                <span className="font-medium">Full-time (40+ hrs/week)</span>
              </label>
              <label className="flex items-center gap-3 p-4 rounded-xl border border-white/10 hover:bg-white/5 cursor-pointer">
                <input type="radio" name="time" className="text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] bg-transparent border-white/20" />
                <span className="font-medium">Part-time (10-20 hrs/week)</span>
              </label>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6">

        {/* Hero */}
        <div className="text-center mb-16 pt-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold mb-4"
          >
            Find Your Co-Founder
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-[var(--text-muted)] max-w-2xl mx-auto mb-10"
          >
            The right partner changes everything. Connect with builders who complement your skills.
          </motion.p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              variant={view === "browse" ? "primary" : "outline"}
              size="lg"
              onClick={() => setView("browse")}
            >
              Browse Co-Founders
            </Button>
            <Button
              variant={view === "list" ? "primary" : "outline"}
              size="lg"
              onClick={() => setView("list")}
            >
              List Myself as Co-Founder
            </Button>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {view === "browse" && (
            <motion.div
              key="browse"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {PROFILES.map((profile) => (
                  <Card key={profile.id} className="flex flex-col h-full group hover:border-[var(--accent-primary)]/50 transition-colors">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 overflow-hidden shrink-0">
                        <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{profile.name}</h3>
                        <div className="text-[var(--text-muted)] text-sm flex items-center gap-1 mt-1">
                          <Target className="w-3 h-3" /> {profile.college}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 flex-1">
                      <div>
                        <div className="text-sm text-[var(--text-muted)] mb-2 font-medium">Brings: {profile.role}</div>
                        <div className="flex flex-wrap gap-2">
                          {profile.skills.map(skill => (
                            <Badge key={skill} variant="secondary" className="bg-white/5">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2">
                        <div className="flex items-start gap-2">
                          <Rocket className="w-4 h-4 text-[var(--accent-primary)] mt-0.5" />
                          <div>
                            <div className="text-xs text-[var(--text-muted)]">Current Stage</div>
                            <div className="text-sm font-medium">{profile.stage}</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Zap className="w-4 h-4 text-yellow-500 mt-0.5" />
                          <div>
                            <div className="text-xs text-[var(--text-muted)]">Looking For</div>
                            <div className="text-sm font-medium">{profile.needs}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/5">
                      <Button variant="primary" className="w-full">Connect</Button>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {view === "list" && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-3xl mx-auto"
            >
              <Card className="p-8 md:p-12 border-white/10">
                <StepForm
                  steps={formSteps}
                  onComplete={() => setView("success")}
                  onCancel={() => setView("browse")}
                />
              </Card>
            </motion.div>
          )}

          {view === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-xl mx-auto text-center py-20"
            >
              <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-8 border border-green-500/30">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <h2 className="text-4xl font-bold mb-4">Profile Listed!</h2>
              <p className="text-[var(--text-muted)] text-lg mb-8">
                Your profile is now visible to other builders in the DevUp ecosystem. We'll notify you when someone wants to connect.
              </p>
              <Button variant="primary" onClick={() => setView("browse")}>Browse Others</Button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
