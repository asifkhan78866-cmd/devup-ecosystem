"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { UploadCloud, CheckCircle, Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StepForm } from "@/components/ui/StepForm";
import FloatingSymbols from "@/components/FloatingSymbols";

export default function ApplyPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [foundersCount, setFoundersCount] = useState(1);

  const handleComplete = () => {
    setIsSubmitted(true);

    // Trigger confetti
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#6366f1', '#a855f7', '#ec4899']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#6366f1', '#a855f7', '#ec4899']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  const steps = [
    {
      title: "Startup Basics",
      content: (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold mb-8 text-center">Tell us about your startup</h2>
          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-2">Startup Name</label>
            <input type="text" placeholder="NexusAI" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-[var(--accent-primary)] text-white" />
          </div>
          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-2">Domain</label>
            <select className="w-full bg-black border border-white/10 rounded-xl p-3 outline-none focus:border-[var(--accent-primary)] text-white appearance-none">
              <option>AI/ML</option>
              <option>Fintech</option>
              <option>Web3</option>
              <option>SaaS</option>
              <option>Consumer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-2">One-liner Pitch (150 chars max)</label>
            <input type="text" placeholder="Next-gen LLM orchestration for enterprise" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-[var(--accent-primary)] text-white" />
          </div>
          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-2">Website / Demo Link (Optional)</label>
            <input type="url" placeholder="https://" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-[var(--accent-primary)] text-white" />
          </div>
        </div>
      )
    },
    {
      title: "Founding Team",
      content: (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold mb-8 text-center">Who is building this?</h2>

          <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {Array.from({ length: foundersCount }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-[var(--text-muted)]">Founder {i + 1}</h4>
                  {i > 0 && (
                    <button onClick={() => setFoundersCount(c => c - 1)} className="text-red-400 text-sm hover:text-red-300">Remove</button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input type="text" placeholder="Full Name" className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 outline-none focus:border-[var(--accent-primary)] text-white text-sm" />
                  </div>
                  <div>
                    <input type="text" placeholder="Role (e.g. CEO)" className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 outline-none focus:border-[var(--accent-primary)] text-white text-sm" />
                  </div>
                </div>
                <div>
                  <input type="url" placeholder="LinkedIn Profile" className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 outline-none focus:border-[var(--accent-primary)] text-white text-sm" />
                </div>
              </div>
            ))}
          </div>

          {foundersCount < 4 && (
            <Button variant="outline" className="w-full border-dashed border-white/20" onClick={() => setFoundersCount(c => c + 1)}>
              <Plus className="w-4 h-4 mr-2" /> Add Co-founder
            </Button>
          )}
        </div>
      )
    },
    {
      title: "Traction",
      content: (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold mb-8 text-center">Where are you at?</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-2">Current Stage</label>
              <select className="w-full bg-black border border-white/10 rounded-xl p-3 outline-none focus:border-[var(--accent-primary)] text-white appearance-none">
                <option>Idea Stage</option>
                <option>Building MVP</option>
                <option>Beta / Pre-revenue</option>
                <option>Revenue Generating</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-2">Current MRR (Optional)</label>
              <input type="text" placeholder="$0" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-[var(--accent-primary)] text-white" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-2">Active Users / Customers</label>
            <input type="text" placeholder="e.g. 100 beta testers" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-[var(--accent-primary)] text-white" />
          </div>

          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-2">Pitch Deck (PDF max 10MB)</label>
            <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:bg-white/5 transition-colors cursor-pointer group">
              <UploadCloud className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2 group-hover:text-white transition-colors" />
              <span className="text-sm text-[var(--text-muted)] group-hover:text-white transition-colors">Click to upload or drag and drop</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Needs",
      content: (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold mb-8 text-center">How can DevUp help?</h2>
          <p className="text-center text-[var(--text-muted)] mb-8">Select all that apply.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {["Pre-seed Funding", "Mentorship / Advisors", "Talent Acquisition", "Legal / Compliance", "Cloud Credits", "Workspace (Offline)"].map(need => (
              <label key={need} className="flex items-center gap-3 p-4 rounded-xl border border-white/10 hover:bg-white/5 cursor-pointer">
                <input type="checkbox" className="rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] bg-transparent border-white/20" />
                <span className="font-medium">{need}</span>
              </label>
            ))}
          </div>
        </div>
      )
    },
    {
      title: "Agreements",
      content: (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold mb-8 text-center">Final Details</h2>
          <div className="space-y-4 bg-white/5 p-6 rounded-xl border border-white/10">
            <label className="flex items-start gap-4 cursor-pointer">
              <input type="checkbox" className="mt-1 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] bg-transparent border-white/20" />
              <span className="text-sm text-[var(--text-muted)] leading-relaxed">
                I confirm that all information provided is accurate and that I have the authority to submit this application on behalf of the startup.
              </span>
            </label>
            <label className="flex items-start gap-4 cursor-pointer">
              <input type="checkbox" className="mt-1 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] bg-transparent border-white/20" />
              <span className="text-sm text-[var(--text-muted)] leading-relaxed">
                I agree to the DevUp <a href="#" className="text-[var(--accent-primary)] hover:underline">Terms of Service</a> and <a href="#" className="text-[var(--accent-primary)] hover:underline">Privacy Policy</a>.
              </span>
            </label>
            <label className="flex items-start gap-4 cursor-pointer">
              <input type="checkbox" className="mt-1 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] bg-transparent border-white/20" />
              <span className="text-sm text-[var(--text-muted)] leading-relaxed">
                I consent to signing a mutual NDA before proceeding to the partner interview stage.
              </span>
            </label>
          </div>
        </div>
      )
    }
  ];

  return (
    <>
      <div className="fixed inset-0 opacity-20 z-0 pointer-events-none">
        <FloatingSymbols />
      </div>

      <div className="min-h-screen flex items-center justify-center pt-24 pb-12 px-4 relative z-10">
        <div className="w-full max-w-3xl">
          <AnimatePresence mode="wait">
            {!isSubmitted ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="p-6 md:p-12 border-white/10 shadow-2xl bg-black/60 backdrop-blur-2xl">
                  <StepForm steps={steps} onComplete={handleComplete} />
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20"
              >
                <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-8 border border-green-500/30">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <h2 className="text-4xl md:text-6xl font-bold mb-6">Application Submitted!</h2>
                <p className="text-[var(--text-muted)] text-xl mb-10 max-w-lg mx-auto">
                  Welcome to the first step of your journey. Our partner team will review your application and get back to you within 48 hours.
                </p>
                <Button variant="primary" size="lg" onClick={() => window.location.href = '/'}>
                  Return to Home
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
