"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import FloatingSymbols from "@/components/FloatingSymbols";
import HeroBeacon from "@/components/HeroBeacon";
import HeroTypography from "@/components/HeroTypography";
import HeroDashboardPreview from "@/components/HeroDashboardPreview";
import LogoStrip from "@/components/LogoStrip";
import LiveStats from "@/components/LiveStats";
import HowItWorks from "@/components/HowItWorks";
import StartupShowcase from "@/components/StartupShowcase";
import BentoServices from "@/components/BentoServices";
import Testimonials from "@/components/Testimonials";
import FinalCTA from "@/components/FinalCTA";
import ErrorBoundary from "@/components/ErrorBoundary";

import HeroStatChips from "@/components/HeroStatChips";

// Dynamically import HeroSignalNetwork
const HeroSignalNetwork = dynamic(
  () => import("@/components/HeroSignalNetwork"),
  { ssr: false }
);

// Dynamically import EcosystemOrbit3D with no SSR
const EcosystemOrbit3D = dynamic(
  () => import("@/components/EcosystemOrbit3D"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[700px] flex items-center justify-center relative">
         <div className="w-32 h-32 rounded-full border border-[rgba(200,241,53,0.1)] animate-ping" />
      </div>
    ),
  }
);

export default function Home() {
  return (
    <>
      {/* 1. Ambient Background Layer */}
      <FloatingSymbols />
      <div className="fixed inset-0 bg-noise pointer-events-none z-50 mix-blend-overlay" />

      {/* 2. Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center pt-20 overflow-hidden z-10 pb-24">
        <HeroBeacon />
        <HeroTypography />
        
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-[960px] mx-auto mt-[72px] mb-0"
        >
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: 680,
            height: 440,
            margin: '0 auto',
          }}>
            <HeroSignalNetwork />
            <HeroStatChips />
          </div>
        </motion.div>
      </section>

      {/* 3. Social Proof Strip */}
      <LogoStrip />

      {/* 4. Stats Section */}
      <div className="relative z-10">
        <LiveStats />
      </div>

      {/* 5. How It Works (Process) */}
      <div className="relative z-10">
        <HowItWorks />
      </div>

      {/* 6. Orbital Ecosystem 3D */}
      <section className="relative w-full z-10 flex flex-col xl:flex-row items-center max-w-[1400px] mx-auto min-h-[700px] overflow-hidden">
        {/* Left Text content */}
        <div className="w-full xl:w-[40%] px-6 xl:pl-16 xl:pr-0 pt-24 xl:pt-0 z-20 flex flex-col pointer-events-none">
          <span 
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#6b6b6b",
              marginBottom: "16px"
            }}
          >
            THE ECOSYSTEM
          </span>
          <h2 
            className="whitespace-pre-line mb-6"
            style={{
              fontFamily: "var(--font-syne), sans-serif",
              fontSize: "clamp(32px, 4vw, 52px)",
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1.1,
              color: "#ffffff"
            }}
          >
            {"One signal.\nEvery resource\nyou need."}
          </h2>
          <p 
            className="mb-8"
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: "16px",
              lineHeight: 1.65,
              color: "#a1a1a1",
              maxWidth: "480px"
            }}
          >
            DevUp connects student founders with mentors, investors, compute, legal, design, and a community that moves fast.
          </p>
          
          {/* Categories Pills */}
          <div className="flex flex-wrap gap-2 pointer-events-auto max-w-[480px]">
            {[
              { label: "Tech", color: "#6366f1" },
              { label: "AI", color: "#c8f135" },
              { label: "Design", color: "#ec4899" },
              { label: "Marketing", color: "#22c55e" },
              { label: "Legal", color: "#94a3b8" },
              { label: "Mission", color: "#f97316" }
            ].map((cat) => (
              <button
                key={cat.label}
                type="button"
                className="group flex items-center gap-2 hover:text-[#c8f135] hover:border-[rgba(200,241,53,0.3)]"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "100px",
                  padding: "6px 12px",
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: "12px",
                  color: "#a1a1a1",
                  transition: "all 0.2s ease",
                  cursor: "default"
                }}
              >
                <span className="w-[10px] h-[10px] rounded-full" style={{ backgroundColor: cat.color }} />
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right 3D Scene */}
        <div className="w-full xl:w-[60%] h-[500px] xl:h-[700px] absolute xl:relative top-0 left-0 xl:left-auto opacity-30 xl:opacity-100 -z-10 xl:z-10">
          <ErrorBoundary>
            <EcosystemOrbit3D />
          </ErrorBoundary>
        </div>
      </section>

      {/* 7. Startup Showcase */}
      <div className="relative z-10">
        <StartupShowcase />
      </div>

      {/* 8. Bento Services Preview */}
      <div className="relative z-10">
        <BentoServices />
      </div>
      
      {/* 9. Testimonials */}
      <div className="relative z-10">
        <Testimonials />
      </div>
      
      {/* 10. Final CTA */}
      <div className="relative z-10">
        <FinalCTA />
      </div>
      
    </>
  );
}
