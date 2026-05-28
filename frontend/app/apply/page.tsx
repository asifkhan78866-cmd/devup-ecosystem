"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, UploadCloud, CheckCircle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import confetti from "canvas-confetti";

const ApplicationRocket = dynamic(
  () => import("@/components/3d/ApplicationRocket"),
  { ssr: false }
);

const FAQS = [
  { q: "What is DevUp Cohort 4?", a: "A 12-week intensive accelerator program for student founders in India. We provide capital, workspace, and direct mentorship from unicorn founders." },
  { q: "How much funding do we get?", a: "Selected startups receive up to ₹50 Lakhs in pre-seed funding for 5% equity, plus over $100k in partner credits (AWS, Notion, OpenAI, etc)." },
  { q: "Do I need a technical co-founder?", a: "Not necessarily, but you must have the ability to build and launch an MVP within the 12 weeks. If you are non-technical, you should ideally have a strong track record of operations or sales." },
  { q: "Is this program remote or in-person?", a: "The first 4 weeks are remote. The final 8 weeks are in-person at our Bengaluru HQ. We cover flights and accommodation for up to 3 co-founders." }
];

export default function ApplyPage() {
  const [formStep, setFormStep] = useState(1);
  const [formDirection, setFormDirection] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const goToStep = (step: number) => {
    setFormDirection(step > formStep ? 1 : -1);
    setFormStep(step);
  };

  const handleNext = () => {
    if (formStep < 3) goToStep(formStep + 1);
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    // trigger confetti
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#c8f135', '#ffffff']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#c8f135', '#ffffff']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <PageHeader
        label="JOIN COHORT 4"
        headline="Ready to\nlaunch?"
        accentWord="launch"
        subtitle="We back student founders with capital, credits, and community. Applications for Cohort 4 close in 14 days."
        variant="grid"
      />

      <ApplicationRocket isLaunched={isSubmitted} />

      <div className="max-w-4xl mx-auto px-4 md:px-8 mt-12 pb-24 relative z-10">
        
        {!isSubmitted ? (
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-[16px] overflow-hidden shadow-2xl mb-16">
            
            {/* Top Progress Bar */}
            <div className="w-full h-[2px] bg-white/5 relative">
              <div 
                className="absolute top-0 left-0 h-full bg-[#c8f135] transition-all duration-300"
                style={{ width: `${(formStep / 3) * 100}%` }}
              />
            </div>

            <div className="p-8 md:p-12">
              <div className="flex items-center justify-between mb-10">
                <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "24px", fontWeight: 700, color: "#fff" }}>
                  {formStep === 1 && "01. Founder Details"}
                  {formStep === 2 && "02. Startup Details"}
                  {formStep === 3 && "03. The Pitch"}
                </h2>
                <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px", color: "#6b6b6b" }}>
                  Step {formStep} of 3
                </div>
              </div>

              <div className="relative overflow-hidden min-h-[360px]">
                <AnimatePresence initial={false} custom={formDirection} mode="wait">
                  <motion.div
                    key={formStep}
                    custom={formDirection}
                    initial={{ opacity: 0, x: formDirection > 0 ? 40 : -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: formDirection > 0 ? -40 : 40 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0"
                  >
                    
                    {formStep === 1 && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#a1a1a1", display: "block", marginBottom: "8px" }}>Primary Founder Name</label>
                            <input type="text" className="w-full bg-[#0a0a0a] border border-white/10 rounded-[10px] p-3.5 text-[#e4e4e4] outline-none focus:border-[#c8f135]/50 transition-colors" placeholder="John Doe" />
                          </div>
                          <div>
                            <label style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#a1a1a1", display: "block", marginBottom: "8px" }}>Email Address</label>
                            <input type="email" className="w-full bg-[#0a0a0a] border border-white/10 rounded-[10px] p-3.5 text-[#e4e4e4] outline-none focus:border-[#c8f135]/50 transition-colors" placeholder="john@example.com" />
                          </div>
                        </div>

                        <div>
                          <label style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#a1a1a1", display: "block", marginBottom: "8px" }}>LinkedIn Profile</label>
                          <input type="url" className="w-full bg-[#0a0a0a] border border-white/10 rounded-[10px] p-3.5 text-[#e4e4e4] outline-none focus:border-[#c8f135]/50 transition-colors" placeholder="https://linkedin.com/in/..." />
                        </div>

                        <div>
                          <label style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#a1a1a1", display: "block", marginBottom: "8px" }}>Do you have co-founders?</label>
                          <select className="w-full bg-[#0a0a0a] border border-white/10 rounded-[10px] p-3.5 text-[#e4e4e4] outline-none focus:border-[#c8f135]/50 transition-colors">
                            <option>No, I am a solo founder</option>
                            <option>Yes, 1 co-founder</option>
                            <option>Yes, 2+ co-founders</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {formStep === 2 && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#a1a1a1", display: "block", marginBottom: "8px" }}>Startup Name</label>
                            <input type="text" className="w-full bg-[#0a0a0a] border border-white/10 rounded-[10px] p-3.5 text-[#e4e4e4] outline-none focus:border-[#c8f135]/50 transition-colors" placeholder="e.g. Acme Corp" />
                          </div>
                          <div>
                            <label style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#a1a1a1", display: "block", marginBottom: "8px" }}>Primary Domain</label>
                            <select className="w-full bg-[#0a0a0a] border border-white/10 rounded-[10px] p-3.5 text-[#e4e4e4] outline-none focus:border-[#c8f135]/50 transition-colors">
                              <option>AI / Machine Learning</option>
                              <option>Fintech</option>
                              <option>Developer Tools</option>
                              <option>SaaS</option>
                              <option>Consumer / Social</option>
                              <option>Web3 / Crypto</option>
                              <option>Other</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#a1a1a1", display: "block", marginBottom: "8px" }}>One-sentence Pitch</label>
                          <input type="text" className="w-full bg-[#0a0a0a] border border-white/10 rounded-[10px] p-3.5 text-[#e4e4e4] outline-none focus:border-[#c8f135]/50 transition-colors" placeholder="We are building X for Y to solve Z." />
                        </div>

                        <div>
                          <label style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#a1a1a1", display: "block", marginBottom: "8px" }}>Current Stage</label>
                          <select className="w-full bg-[#0a0a0a] border border-white/10 rounded-[10px] p-3.5 text-[#e4e4e4] outline-none focus:border-[#c8f135]/50 transition-colors">
                            <option>Idea (No code yet)</option>
                            <option>Building MVP (Pre-launch)</option>
                            <option>Launched (Beta users)</option>
                            <option>Generating Revenue</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {formStep === 3 && (
                      <div className="space-y-6">
                        <div>
                          <label style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#a1a1a1", display: "block", marginBottom: "8px" }}>Why are you building this? (The Problem)</label>
                          <textarea className="w-full h-[100px] resize-none bg-[#0a0a0a] border border-white/10 rounded-[10px] p-4 text-[#e4e4e4] outline-none focus:border-[#c8f135]/50 transition-colors" placeholder="What specific problem are you solving and how do you know it's a real problem?" />
                        </div>

                        <div>
                          <label style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#a1a1a1", display: "block", marginBottom: "8px" }}>Pitch Deck (Optional)</label>
                          <div className="w-full border-2 border-dashed border-white/10 rounded-[10px] p-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#c8f135]/40 hover:bg-[#c8f135]/5 transition-colors">
                            <UploadCloud className="w-6 h-6 mb-2 text-[#6b6b6b]" />
                            <span style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#a1a1a1" }}>Click to upload PDF (Max 10MB)</span>
                          </div>
                        </div>
                      </div>
                    )}

                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Form Navigation */}
              <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between">
                {formStep > 1 ? (
                  <button 
                    onClick={() => goToStep(formStep - 1)}
                    className="px-6 py-3 bg-transparent text-[#a1a1a1] hover:text-white transition-colors"
                    style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px" }}
                  >
                    Back
                  </button>
                ) : <div />}

                {formStep < 3 ? (
                  <button 
                    onClick={handleNext}
                    className="px-8 py-3 bg-[#c8f135] text-black font-semibold rounded-[8px] hover:bg-[#b0d829] transition-colors"
                    style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px" }}
                  >
                    Next Step →
                  </button>
                ) : (
                  <button 
                    onClick={handleSubmit}
                    className="px-8 py-3 bg-[#c8f135] text-black font-bold rounded-[8px] hover:bg-[#b0d829] transition-colors shadow-[0_0_20px_rgba(200,241,53,0.3)] hover:shadow-[0_0_30px_rgba(200,241,53,0.5)]"
                    style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px" }}
                  >
                    Submit Application
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-[16px] p-12 text-center mb-16 shadow-2xl">
            <CheckCircle className="w-16 h-16 mx-auto mb-6 text-[#c8f135]" />
            <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "36px", fontWeight: 800, color: "#fff", marginBottom: "16px" }}>
              Application Received.
            </h2>
            <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "16px", color: "#a1a1a1", maxWidth: "480px", margin: "0 auto", lineHeight: 1.6, marginBottom: "32px" }}>
              Your application for Cohort 4 has been successfully submitted. Our partner team will review your profile and get back to you within 48 hours. Keep building.
            </p>
            <button 
              onClick={() => window.location.href = '/'}
              className="px-8 py-3 bg-transparent border border-white/10 text-white font-semibold rounded-[8px] hover:bg-white/5 transition-colors"
              style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px" }}
            >
              Return to Home
            </button>
          </div>
        )}

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <h3 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "24px", fontWeight: 700, color: "#fff", marginBottom: "24px", textAlign: "center" }}>
            Frequently Asked Questions
          </h3>
          
          <div className="space-y-0">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="border-b border-white/5">
                  <button 
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full py-6 flex items-center justify-between text-left group"
                  >
                    <span style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "16px", color: isOpen ? "#c8f135" : "#e4e4e4", fontWeight: 500 }} className="group-hover:text-[#c8f135] transition-colors">
                      {faq.q}
                    </span>
                    <motion.div
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-[#6b6b6b] group-hover:text-[#c8f135] transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "15px", color: "#a1a1a1", lineHeight: 1.6, paddingBottom: "24px" }}>
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
