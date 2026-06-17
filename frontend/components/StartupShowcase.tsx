"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Simple hash function to generate a unique HSL hue from string
function getHueFromString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash * 37) % 360;
}

export default function StartupShowcase() {
  const [startups, setStartups] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/startups`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          const formatted = data.data.map((s: any) => ({
            name: s.name,
            domain: s.domain || "Tech",
            tagline: s.tagline || s.description || "Innovating the future.",
            stage: s.stage || "Seed",
            roles: s._count?.jobs || 0,
            logoSeed: s.slug || s.name,
          }));
          setStartups(formatted);
        }
      })
      .catch((err) => {
        console.warn('Backend unavailable (fetch failed):', err.message);
        // Fallback or ignore quietly so Next.js doesn't throw a dev overlay
      });
  }, []);

  return (
    <section className="py-24 px-6 max-w-[1200px] mx-auto w-full relative z-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
        <div>
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
            OUR ECOSYSTEM
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
            {"Startups building\nwith DevUp."}
          </h2>
        </div>
        
        <Link 
          href="/ecosystem"
          className="group flex items-center mt-6 md:mt-0"
          style={{
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: "14px",
            fontWeight: 500,
            color: "#c8f135",
            transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)"
          }}
        >
          View all 
          <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[16px]">
        {startups.map((startup, index) => {
          const hue = getHueFromString(startup.name);
          const bannerBg = `hsl(${hue}, 70%, 12%)`;
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div
                className="group flex flex-col relative cursor-pointer"
                style={{
                  background: "#111111",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "14px",
                  overflow: "hidden",
                  transition: "all 0.25s cubic-bezier(0.16,1,0.3,1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 20px 60px rgba(0,0,0,0.6)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Banner Area */}
                <div 
                  className="relative w-full"
                  style={{
                    height: "140px",
                    background: bannerBg,
                    backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
                    backgroundSize: "20px 20px"
                  }}
                >
                  <div 
                    className="absolute top-4 right-4"
                    style={{
                      background: "rgba(0,0,0,0.7)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "4px",
                      padding: "3px 8px",
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: "10px",
                      color: "#ffffff",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em"
                    }}
                  >
                    {startup.stage}
                  </div>

                  {/* Logo */}
                  <div 
                    className="absolute z-10 flex items-center justify-center"
                    style={{
                      width: "44px",
                      height: "44px",
                      bottom: "-22px",
                      left: "20px",
                      background: "#1a1a1a",
                      border: "2px solid #111111",
                      borderRadius: "10px",
                      fontFamily: "var(--font-syne), sans-serif",
                      fontSize: "16px",
                      fontWeight: 700,
                      color: `hsl(${hue}, 80%, 70%)`
                    }}
                  >
                    {startup.name.charAt(0)}
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: "32px 20px 20px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <div 
                    style={{
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: "11px",
                      color: "#c8f135",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: "8px"
                    }}
                  >
                    {startup.domain}
                  </div>
                  <h3 
                    style={{
                      fontFamily: "var(--font-syne), sans-serif",
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "#ffffff",
                      marginBottom: "6px"
                    }}
                  >
                    {startup.name}
                  </h3>
                  <p 
                    className="line-clamp-2"
                    style={{
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: "13px",
                      lineHeight: 1.5,
                      color: "#a1a1a1",
                      marginBottom: "24px",
                      flex: 1
                    }}
                  >
                    {startup.tagline}
                  </p>

                  <div className="flex items-center justify-between border-t border-[rgba(255,255,255,0.05)] pt-4 mt-auto">
                    <span 
                      style={{
                        fontFamily: "var(--font-inter), sans-serif",
                        fontSize: "12px",
                        color: "#6b6b6b"
                      }}
                    >
                      {startup.roles > 0 ? `${startup.roles} open roles` : "No open roles"}
                    </span>
                    <ArrowRight 
                      className="w-4 h-4 text-[#6b6b6b] group-hover:text-[#ffffff] group-hover:translate-x-1 transition-all duration-200" 
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
