"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useIsMobile } from "@/lib/hooks/useIsMobile";

const WORDS = ["Founders.", "Builders.", "Dreamers.", "Students.", "Creators.", "Makers."];

const AVATARS = [
  "https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=c8f135",
  "https://api.dicebear.com/7.x/notionists/svg?seed=Aneka&backgroundColor=c8f135",
  "https://api.dicebear.com/7.x/notionists/svg?seed=Alex&backgroundColor=c8f135",
  "https://api.dicebear.com/7.x/notionists/svg?seed=Sam&backgroundColor=c8f135",
];

export default function HeroTypography() {
  const [wordIndex, setWordIndex] = useState(0);
  const isMobile = useIsMobile();

  // Word morphing effect (Slot machine)
  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % WORDS.length);
    }, 2650); // 2.2s hold + 0.45s animation
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center text-center z-10 relative px-4 max-w-[800px] mx-auto ${isMobile ? 'pt-[100px]' : 'pt-[140px]'}`}>
      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="inline-flex items-center gap-2 rounded-full mb-7"
        style={{
          background: "rgba(200,241,53,0.08)",
          border: "1px solid rgba(200,241,53,0.2)",
          padding: "6px 14px",
          fontFamily: "var(--font-inter), sans-serif",
          fontSize: "12px",
          fontWeight: 500,
          color: "#c8f135",
        }}
      >
        <motion.span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: "#c8f135" }}
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
        Cohort 4 Applications Open
      </motion.div>

      {/* Main Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col mb-6"
        style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontWeight: 800,
          fontSize: isMobile ? "clamp(32px, 10vw, 40px)" : "clamp(34px, 8vw, 80px)",
          lineHeight: isMobile ? 1.2 : 1.05,
          letterSpacing: "-0.035em",
          color: "#ffffff",
        }}
      >
        <span>India's Startup</span>
        <span>Ecosystem for</span>
        
        {/* Morphing Word Container */}
        <div className="relative inline-block h-[1.2em] overflow-hidden text-[#c8f135] flex-shrink-0">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={wordIndex}
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              exit={{ y: "-100%", opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-0 right-0"
            >
              {WORDS[wordIndex]}
            </motion.span>
          </AnimatePresence>
          {/* Invisible placeholder to maintain width */}
          <span className="invisible px-1">{WORDS.reduce((a, b) => a.length > b.length ? a : b)}</span>
        </div>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-[520px] mx-auto mb-9 text-center"
        style={{
          fontFamily: "var(--font-inter), sans-serif",
          fontSize: "17px",
          fontWeight: 400,
          lineHeight: 1.65,
          color: "#a1a1a1",
        }}
      >
        From your first idea to your first funding round.
        DevUp gives student founders everything they need to build,
        ship, and scale — inside one ecosystem.
      </motion.p>

      {/* CTA Row */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className={`flex ${isMobile ? 'flex-col w-full' : 'flex-row'} gap-4 items-center justify-center mb-5`}
      >
        <Link 
          href="/apply"
          className="flex items-center justify-center"
          style={{
            width: isMobile ? '100%' : 'auto',
            background: "#c8f135",
            color: "#000000",
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: "15px",
            fontWeight: 700,
            padding: "12px 24px",
            borderRadius: "10px",
            height: "52px",
            transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#d4f53f";
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 32px rgba(200,241,53,0.25)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#c8f135";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          Apply to Cohort 4
        </Link>
        <Link 
          href="/ecosystem"
          className="flex items-center justify-center"
          style={{
            width: isMobile ? '100%' : 'auto',
            background: "transparent",
            color: "#e4e4e4",
            border: "1px solid rgba(255,255,255,0.12)",
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: "15px",
            fontWeight: 500,
            padding: "12px 24px",
            borderRadius: "10px",
            height: "52px",
            transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
            e.currentTarget.style.color = "#ffffff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#e4e4e4";
          }}
        >
          Explore Startups →
        </Link>
      </motion.div>

      {/* Social Proof */}
      {!isMobile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-center gap-3"
        >
          <div className="flex -space-x-2">
            {AVATARS.map((avatar, i) => (
              <img
                key={i}
                src={avatar}
                alt="Founder Avatar"
                className="w-7 h-7 rounded-full border border-[#0a0a0a]"
              />
            ))}
          </div>
          <span 
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: "13px",
              color: "#6b6b6b"
            }}
          >
            Trusted by 23+ startups across Hyderabad, Bangalore & Delhi
          </span>
        </motion.div>
      )}
    </div>
  );
}
