"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { FileText, Shield, TrendingUp } from "lucide-react";
import { useIsMobile } from "@/lib/hooks/useIsMobile";

const STEPS = [
  {
    title: "Apply",
    icon: FileText,
    body: "Submit your startup details. Our team reviews within 48 hours and responds personally.",
  },
  {
    title: "Get Verified",
    icon: Shield,
    body: "Sign your ecosystem agreements digitally. Your startup gets a verified badge and goes live.",
  },
  {
    title: "Build & Scale",
    icon: TrendingUp,
    body: "Access mentors, GPU compute, talent, legal support, funding connections — everything in one place.",
  },
];

export default function HowItWorks() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <section style={{ padding: '48px 20px' }}>
        <p style={{ fontFamily: 'var(--font-inter), sans-serif', fontSize: 11,
          color: '#c8f135', textTransform: 'uppercase',
          letterSpacing: '0.12em', marginBottom: 8 }}>
          THE PROCESS
        </p>
        <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 28,
          fontWeight: 800, color: '#ffffff',
          lineHeight: 1.1, marginBottom: 40 }}>
          From application<br/>to ecosystem.
        </h2>
        
        {STEPS.map((step, i) => (
          <div key={i} style={{
            display: 'flex', gap: 16,
            marginBottom: i < STEPS.length - 1 ? 0 : 0,
            position: 'relative',
          }}>
            {/* Timeline line + dot */}
            <div style={{ display: 'flex', flexDirection: 'column',
              alignItems: 'center', width: 32, flexShrink: 0 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(200,241,53,0.1)',
                border: '1px solid rgba(200,241,53,0.3)',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-syne), sans-serif', fontSize: 14,
                fontWeight: 700, color: '#c8f135',
                flexShrink: 0,
              }}>
                {i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  width: 1, flex: 1,
                  background: 'rgba(200,241,53,0.15)',
                  margin: '8px 0', minHeight: 40,
                }} />
              )}
            </div>
            
            {/* Content */}
            <div style={{ 
              paddingBottom: i < STEPS.length - 1 ? 32 : 0,
              flex: 1,
            }}>
              <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 17,
                fontWeight: 700, color: '#ffffff', marginBottom: 6 }}>
                {step.title}
              </div>
              <div style={{ fontFamily: 'var(--font-inter), sans-serif', fontSize: 13,
                color: '#6b6b6b', lineHeight: 1.6 }}>
                {step.body}
              </div>
            </div>
          </div>
        ))}
      </section>
    );
  }

  return (
    <section ref={containerRef} className="py-24 px-6 max-w-[1200px] mx-auto w-full relative z-10">
      <div className="mb-16">
        <span 
          style={{
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#6b6b6b"
          }}
        >
          THE PROCESS
        </span>
        <h2 
          className="mt-4 whitespace-pre-line"
          style={{
            fontFamily: "var(--font-syne), sans-serif",
            fontSize: "clamp(32px, 4vw, 52px)",
            fontWeight: 700,
            letterSpacing: "-0.025em",
            lineHeight: 1.1,
            color: "#ffffff"
          }}
        >
          {"From application\nto ecosystem."}
        </h2>
      </div>

      <div className="relative">
        {/* Animated Connecting Line (Desktop only) */}
        <div className="hidden md:block absolute top-[44px] left-[15%] right-[15%] z-0 h-[2px]">
          <svg width="100%" height="2" preserveAspectRatio="none">
            <motion.line
              x1="0"
              y1="1"
              x2="100%"
              y2="1"
              stroke="rgba(200,241,53,0.3)"
              strokeWidth="2"
              strokeDasharray="8 4"
              initial={{ pathLength: 0 }}
              animate={isInView ? { pathLength: 1 } : { pathLength: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
          </svg>
        </div>

        {/* Vertical Connecting Line (Mobile only) */}
        <div className="md:hidden absolute top-[10%] bottom-[10%] left-[38px] z-0 w-[2px]">
          <svg width="2" height="100%" preserveAspectRatio="none">
            <motion.line
              x1="1"
              y1="0"
              x2="1"
              y2="100%"
              stroke="rgba(200,241,53,0.3)"
              strokeWidth="2"
              strokeDasharray="8 4"
              initial={{ pathLength: 0 }}
              animate={isInView ? { pathLength: 1 } : { pathLength: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
          </svg>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            // Delay based on index so they appear sequentially
            const delay = 0.3 + index * 0.4;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
                className="group relative flex flex-col"
                style={{
                  background: "#111111",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "14px",
                  padding: "28px",
                  transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
                }}
                whileHover={{
                  borderColor: "rgba(200,241,53,0.3)",
                  boxShadow: "0 0 40px rgba(200,241,53,0.06)"
                }}
              >
                {/* Step number */}
                <div 
                  className="absolute top-4 right-5 pointer-events-none"
                  style={{
                    fontFamily: "var(--font-syne), sans-serif",
                    fontSize: "48px",
                    fontWeight: 800,
                    color: "rgba(255,255,255,0.06)",
                    lineHeight: 1
                  }}
                >
                  {index + 1}
                </div>

                {/* Icon */}
                <div 
                  className="flex items-center justify-center mb-4"
                  style={{
                    width: "44px",
                    height: "44px",
                    background: "rgba(200,241,53,0.08)",
                    borderRadius: "8px",
                    color: "#c8f135"
                  }}
                >
                  <Icon size={24} strokeWidth={2} />
                </div>

                <h3 
                  className="mb-2"
                  style={{
                    fontFamily: "var(--font-syne), sans-serif",
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#ffffff"
                  }}
                >
                  {step.title}
                </h3>
                
                <p 
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize: "14px",
                    lineHeight: 1.6,
                    color: "#a1a1a1"
                  }}
                >
                  {step.body}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
