"use client";

import { motion } from "framer-motion";

const LOGOS = [
  "VJIT",
  "T-HUB",
  "StartupsIndia",
  "DevUp Community",
  "ESCI Hyderabad",
  "Nexus AI",
  "BuildSpace",
  "DevFlow"
];

export default function LogoStrip() {
  // Duplicate logos for seamless looping
  const scrollLogos = [...LOGOS, ...LOGOS, ...LOGOS];

  return (
    <section 
      className="w-full relative overflow-hidden"
      style={{
        borderTop: "1px solid rgba(255,255,255,0.05)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        padding: "28px 0",
        background: "rgba(255,255,255,0.01)"
      }}
    >
      <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row items-center gap-8">
        
        {/* Left text */}
        <div 
          className="whitespace-nowrap z-10 bg-[var(--bg-base)] md:bg-transparent pr-4"
          style={{
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: "12px",
            color: "#6b6b6b",
            textTransform: "uppercase",
            letterSpacing: "0.08em"
          }}
        >
          Trusted by builders at
        </div>

        {/* Right auto-scrolling strip */}
        <div className="relative flex-1 overflow-hidden w-full group">
          {/* Fading edges */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[var(--bg-base)] to-transparent z-10 hidden md:block" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[var(--bg-base)] to-transparent z-10 hidden md:block" />

          {/* Marquee Container */}
          <div className="flex gap-12 items-center">
            <motion.div
              className="flex gap-12 items-center shrink-0"
              animate={{ x: ["0%", "-50%"] }}
              transition={{
                duration: 30,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{ paddingRight: "3rem" }} // gap is 3rem
            >
              {scrollLogos.map((logo, i) => (
                <span
                  key={i}
                  className="whitespace-nowrap group-hover:opacity-100 transition-opacity"
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    fontWeight: 600,
                    color: "#3d3d3d",
                    fontSize: "16px"
                  }}
                >
                  {logo}
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
