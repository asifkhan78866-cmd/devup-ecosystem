"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, MapPin, Users, Calendar, Coins, ExternalLink, Briefcase } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const TABS = ["Overview", "Team", "Open Roles", "Gallery"];

export default function StartupProfilePage() {
  const params = useParams();
  const id = params?.id as string;
  const [activeTab, setActiveTab] = useState("Overview");

  // Dummy data based on the route
  const startup = {
    name: id === "nexus-ai" ? "NexusAI" : "Startup Name",
    tagline: "Next-gen LLM orchestration for enterprise.",
    color: "from-blue-500 to-cyan-400",
    verified: true,
    domain: "AI/ML",
    location: "Bengaluru, India",
    founded: "2023",
    headcount: "10-50",
    stage: "Seed",
    funding: "$1.2M",
    about: "NexusAI is building the operating system for enterprise LLM applications. We help Fortune 500 companies securely orchestrate, evaluate, and deploy foundational models across their internal workflows without compromising data privacy.",
    team: [
      { name: "Rahul Sharma", role: "CEO & Co-founder", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul", linkedin: "#" },
      { name: "Sneha Reddy", role: "CTO & Co-founder", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha", linkedin: "#" },
    ],
    roles: [
      { title: "Senior AI Engineer", type: "Full-time", location: "Bengaluru / Remote" },
      { title: "Frontend Developer (React/Three.js)", type: "Full-time", location: "Bengaluru" },
      { title: "Product Marketing Intern", type: "Internship", location: "Remote" },
    ],
    gallery: [1, 2, 3, 4]
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Banner */}
      <div className={`w-full h-64 md:h-80 bg-gradient-to-r ${startup.color} relative`}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10 -mt-20">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Main Content */}
          <div className="flex-1">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 mb-8">
              <div className={`w-32 h-32 rounded-2xl bg-gradient-to-br ${startup.color} border-4 border-[var(--background)] shadow-xl flex items-center justify-center shrink-0`}>
                <span className="text-5xl font-bold text-white">{startup.name[0]}</span>
              </div>
              
              <div className="pb-2">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold">{startup.name}</h1>
                  {startup.verified && <ShieldCheck className="w-6 h-6 text-blue-400" />}
                </div>
                <p className="text-xl text-[var(--text-muted)]">{startup.tagline}</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-white/10 mb-8 overflow-x-auto hide-scrollbar">
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-4 text-lg font-medium transition-colors relative whitespace-nowrap ${activeTab === tab ? "text-white" : "text-[var(--text-muted)] hover:text-white/80"}`}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-primary)]"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="mb-20"
              >
                {activeTab === "Overview" && (
                  <div className="space-y-8">
                    <section>
                      <h3 className="text-2xl font-bold mb-4">About</h3>
                      <p className="text-lg text-[var(--text-muted)] leading-relaxed">
                        {startup.about}
                      </p>
                    </section>
                  </div>
                )}

                {activeTab === "Team" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {startup.team.map((member, i) => (
                      <Card key={i} className="flex items-center gap-4">
                        <img src={member.avatar} alt={member.name} className="w-16 h-16 rounded-full bg-white/5" />
                        <div>
                          <h4 className="font-bold text-lg">{member.name}</h4>
                          <p className="text-[var(--text-muted)] text-sm mb-2">{member.role}</p>
                          <a href={member.linkedin} className="text-blue-400 hover:text-blue-300">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {activeTab === "Open Roles" && (
                  <div className="space-y-4">
                    {startup.roles.map((role, i) => (
                      <Card key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h4 className="font-bold text-lg">{role.title}</h4>
                          <div className="flex items-center gap-3 mt-2 text-sm text-[var(--text-muted)]">
                            <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> {role.type}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {role.location}</span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">Apply Now</Button>
                      </Card>
                    ))}
                  </div>
                )}

                {activeTab === "Gallery" && (
                  <div className="grid grid-cols-2 gap-4">
                    {startup.gallery.map((img) => (
                      <div key={img} className="aspect-video bg-white/5 rounded-xl border border-white/10 flex items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                        <span className="text-[var(--text-muted)]">Image {img}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Sticky Sidebar */}
          <div className="w-full md:w-80 shrink-0">
            <div className="sticky top-24 space-y-6">
              <Card className="p-6">
                <h3 className="font-bold text-xl mb-6">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)] flex items-center gap-2"><MapPin className="w-4 h-4"/> Location</span>
                    <span className="font-medium text-right">{startup.location}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)] flex items-center gap-2"><Calendar className="w-4 h-4"/> Founded</span>
                    <span className="font-medium">{startup.founded}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)] flex items-center gap-2"><Users className="w-4 h-4"/> Headcount</span>
                    <span className="font-medium">{startup.headcount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)] flex items-center gap-2"><Coins className="w-4 h-4"/> Funding</span>
                    <span className="font-medium">{startup.funding}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)] flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> Stage</span>
                    <Badge variant="secondary">{startup.stage}</Badge>
                  </div>
                </div>
              </Card>

              <Button variant="primary" className="w-full" withShimmer>
                Connect with Founders
              </Button>
              <Button variant="outline" className="w-full group">
                Visit Website
                <ExternalLink className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform" />
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
