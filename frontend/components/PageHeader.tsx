"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import HeroBeacon from "@/components/HeroBeacon";

interface PageHeaderProps {
  label: string;
  headline: string;
  subtitle: string;
  accentWord?: string;
  variant?: "rings" | "grid" | "beam" | "none";
  children?: ReactNode;
}

export default function PageHeader({
  label,
  headline,
  subtitle,
  accentWord,
  variant = "none",
  children,
}: PageHeaderProps) {
  
  // Helper to format headline: split on \n or literal '\n' for line breaks, highlight accentWord
  const renderHeadline = () => {
    return headline.split(/\\n|\n/).map((line, i) => (
      <span key={i} style={{ display: 'block' }}>
        {accentWord
          ? line.split(accentWord).map((part, j, pArr) => (
              <span key={j}>
                {part}
                {j < pArr.length - 1 && (
                  <span style={{ color: '#c8f135' }}>{accentWord}</span>
                )}
              </span>
            ))
          : line}
      </span>
    ));
  };

  return (
    <section 
      className="relative w-full flex flex-col items-center overflow-hidden z-10"
      style={{
        paddingTop: "140px",
        paddingBottom: "80px",
        background: "#0a0a0a"
      }}
    >
      {/* Background variants */}
      {variant === "rings" && (
        <div className="absolute inset-0 z-0 opacity-40 pointer-events-none flex items-center justify-center translate-y-[-20%]">
          <HeroBeacon />
        </div>
      )}
      
      {variant === "grid" && (
        <div 
          className="absolute inset-0 z-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle at center, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "24px 24px"
          }}
        />
      )}
      
      {variant === "beam" && (
        <div 
          className="absolute inset-0 z-0 pointer-events-none flex justify-center"
        >
          <div 
            className="w-[1px] h-[500px]"
            style={{
              background: "linear-gradient(to bottom, rgba(200,241,53,0.5), transparent)",
              boxShadow: "0 0 40px 10px rgba(200,241,53,0.1)"
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 max-w-[720px] w-full px-6 flex flex-col items-center text-center mx-auto">
        
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-2 mb-6"
        >
          <span style={{ color: "#c8f135", fontSize: "14px" }}>✦</span>
          <span 
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#c8f135",
            }}
          >
            {label}
          </span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="whitespace-pre-line mb-6"
          style={{
            fontFamily: "var(--font-syne), sans-serif",
            fontSize: "clamp(40px, 6vw, 72px)",
            fontWeight: 800,
            letterSpacing: "-0.035em",
            lineHeight: 0.97,
            color: "#ffffff"
          }}
        >
          {renderHeadline()}
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: "17px",
            color: "#a1a1a1",
            lineHeight: 1.6,
            maxWidth: "520px"
          }}
        >
          {subtitle}
        </motion.p>

        {children && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{ marginTop: "32px", width: "100%" }}
          >
            {children}
          </motion.div>
        )}
      </div>
    </section>
  );
}
