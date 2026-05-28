"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import HeroBeacon from "@/components/HeroBeacon";
import Link from "next/link";

export default function FinalCTA() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    // Real implementation would POST to /api/applications/early-interest
  };

  return (
    <section 
      className="relative w-full flex flex-col items-center justify-center overflow-hidden"
      style={{
        padding: "160px 0",
        background: "#0a0a0a",
        borderTop: "1px solid rgba(255,255,255,0.05)"
      }}
    >
      {/* Background Rings */}
      <div className="absolute inset-0 z-0 opacity-50 pointer-events-none flex items-center justify-center translate-y-[-15%]">
        <HeroBeacon />
      </div>

      <div className="relative z-10 max-w-[600px] w-full px-6 flex flex-col items-center text-center">
        <span 
          style={{
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#c8f135",
            marginBottom: "24px"
          }}
        >
          JOIN THE ECOSYSTEM
        </span>

        <h2 
          className="whitespace-pre-line mb-6"
          style={{
            fontFamily: "var(--font-syne), sans-serif",
            fontSize: "clamp(40px, 6vw, 72px)",
            fontWeight: 800,
            letterSpacing: "-0.035em",
            lineHeight: 1,
            color: "#ffffff"
          }}
        >
          {"Ready to build\nwhat's next?"}
        </h2>

        <p 
          style={{
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: "16px",
            color: "#6b6b6b",
            marginBottom: "48px"
          }}
        >
          Applications reviewed within 48 hours. Always.
        </p>

        <div className="w-full max-w-[440px] h-[100px] relative">
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <form 
                  onSubmit={handleSubmit}
                  style={{
                    background: "#111111",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "12px",
                    padding: "6px",
                    display: "flex",
                    width: "100%",
                    marginBottom: "16px"
                  }}
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    style={{
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: "14px",
                      color: "#ffffff",
                      flex: 1,
                      padding: "10px 14px",
                    }}
                  />
                  <button
                    type="submit"
                    className="hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    style={{
                      background: "#c8f135",
                      color: "#000000",
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: "14px",
                      fontWeight: 700,
                      borderRadius: "8px",
                      padding: "10px 20px",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Apply Now
                  </button>
                </form>

                <div 
                  className="flex items-center justify-center gap-2"
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize: "13px",
                    color: "#6b6b6b"
                  }}
                >
                  <span>or</span>
                  <Link href="/login" className="hover:text-[#ffffff] transition-colors">
                    Already have an account? Log in →
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full h-[60px] flex items-center justify-center gap-3 bg-[rgba(200,241,53,0.05)] border border-[rgba(200,241,53,0.2)] rounded-xl px-4"
              >
                <CheckCircle2 style={{ color: "#c8f135", width: "20px", height: "20px" }} />
                <span 
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize: "14px",
                    color: "#c8f135"
                  }}
                >
                  You're on the list. We'll reach out within 48 hours.
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
