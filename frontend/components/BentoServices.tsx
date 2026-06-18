"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Cpu, Palette, Shield, TrendingUp, Users, Handshake } from "lucide-react";
import { useIsMobile } from "@/lib/hooks/useIsMobile";

const SERVICE_PREVIEW_ITEMS = [
  { name: "AI & Compute", shortDesc: "H100s on demand.", Icon: Cpu },
  { name: "Brand Identity", shortDesc: "Logo, colors, design system.", Icon: Palette },
  { name: "Legal Cover", shortDesc: "Incorporated and protected.", Icon: Shield },
  { name: "Growth Marketing", shortDesc: "Scale your startup.", Icon: TrendingUp },
  { name: "Mentor Network", shortDesc: "Founders who've done it.", Icon: Users },
  { name: "Co-Founder Match", shortDesc: "Meet your builder.", Icon: Handshake },
];

function GpuTerminal() {
  const [usage, setUsage] = useState(84);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setUsage(prev => {
        const delta = Math.floor(Math.random() * 5) - 2;
        return Math.min(Math.max(prev + delta, 70), 98);
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const vram = (usage / 100) * 80;
  
  return (
    <div 
      className="mt-6 p-4 rounded-xl flex flex-col gap-2 font-mono"
      style={{
        background: "#050505",
        border: "1px solid rgba(255,255,255,0.05)",
        fontSize: "12px",
        color: "#a1a1a1"
      }}
    >
      <div className="flex justify-between">
        <span>GPU_0 [H100]</span>
        <span style={{ color: "#c8f135" }}>{usage}%</span>
      </div>
      <div className="w-full h-2 bg-[#1a1a1a] rounded overflow-hidden">
        <div className="h-full bg-[#c8f135]" style={{ width: `${usage}%`, transition: "width 1s ease" }} />
      </div>
      <div className="flex justify-between mt-2">
        <span>VRAM</span>
        <span>{vram.toFixed(1)} / 80 GB</span>
      </div>
      <div className="flex justify-between">
        <span>Jobs</span>
        <span className="text-white">2 running</span>
      </div>
    </div>
  );
}

export default function BentoServices() {
  const isMobile = useIsMobile();

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
            BUILD WITH DEVUP
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
            {"Every resource.\nOne ecosystem."}
          </h2>
          <p 
            className="mt-4"
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: "16px",
              color: "#a1a1a1"
            }}
          >
            Tech, creative, legal, AI — whatever your startup needs.
          </p>
        </div>
        
        <Link 
          href="/build-with-devup"
          className="group flex items-center mt-6 md:mt-0"
          style={{
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: "14px",
            fontWeight: 500,
            color: "#c8f135",
            transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)"
          }}
        >
          Explore all services 
          <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {isMobile ? (
        <div style={{
          display: 'flex', gap: 12,
          overflowX: 'auto', scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
          padding: '0 0px 16px',
        }} className="hide-scrollbar">
          {SERVICE_PREVIEW_ITEMS.map((service, i) => (
            <div key={i} style={{
              width: 200, flexShrink: 0,
              scrollSnapAlign: 'start',
              background: '#111111',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16, padding: 20,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(200,241,53,0.08)',
                border: '1px solid rgba(200,241,53,0.15)',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center',
                color: '#c8f135', marginBottom: 14,
              }}>
                <service.Icon size={16} />
              </div>
              <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 15,
                fontWeight: 700, color: '#ffffff', marginBottom: 6 }}>
                {service.name}
              </div>
              <div style={{ fontFamily: 'var(--font-inter), sans-serif', fontSize: 12,
                color: '#6b6b6b', lineHeight: 1.5 }}>
                {service.shortDesc}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-[220px] gap-4">
          
          {/* Large 2x2: AI & Compute */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="md:col-span-2 md:row-span-2 group flex flex-col justify-between"
          style={{
            background: "#0f0f0f",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "16px",
            padding: "28px",
            transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
            e.currentTarget.style.transform = "translateY(-3px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Cpu className="w-5 h-5" style={{ color: "#c8f135" }} />
              <span style={{ fontFamily: "var(--font-inter)", fontSize: "12px", color: "#a1a1a1" }}>AI & Compute</span>
            </div>
            <h3 style={{ fontFamily: "var(--font-syne)", fontSize: "32px", fontWeight: 700, color: "#fff", lineHeight: 1.1, whiteSpace: "pre-line" }}>
              {"H100s on\ndemand."}
            </h3>
            <p style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#a1a1a1", marginTop: "12px" }}>
              Train and deploy AI models with zero setup.
            </p>
          </div>
          <GpuTerminal />
        </motion.div>

        {/* Small 1x1: Brand & Design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="group relative flex flex-col justify-between overflow-hidden"
          style={{
            background: "#111111",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "16px",
            padding: "24px",
            transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
            e.currentTarget.style.transform = "translateY(-3px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <div>
            <Palette className="w-6 h-6 mb-4" style={{ color: "#ec4899" }} />
            <h3 style={{ fontFamily: "var(--font-syne)", fontSize: "20px", fontWeight: 700, color: "#fff", lineHeight: 1.2, whiteSpace: "pre-line" }}>
              {"Brand\nIdentity"}
            </h3>
            <p style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#a1a1a1", marginTop: "8px" }}>
              Logo, colors, design system.
            </p>
          </div>
          
          <div className="absolute -bottom-4 -right-4 flex gap-2 rotate-12 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:-translate-y-2">
            <div className="w-8 h-16 rounded-full bg-[#ec4899]" />
            <div className="w-8 h-20 rounded-full bg-[#c8f135]" />
            <div className="w-8 h-12 rounded-full bg-[#6366f1]" />
          </div>
        </motion.div>

        {/* Small 1x1: Legal Docs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="group relative flex flex-col justify-between overflow-hidden"
          style={{
            background: "#0f0f0f",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "16px",
            padding: "24px",
            transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
            e.currentTarget.style.transform = "translateY(-3px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <div>
            <Shield className="w-6 h-6 mb-4" style={{ color: "#6366f1" }} />
            <h3 style={{ fontFamily: "var(--font-syne)", fontSize: "20px", fontWeight: 700, color: "#fff", lineHeight: 1.2, whiteSpace: "pre-line" }}>
              {"Legal\nCover"}
            </h3>
            <p style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#a1a1a1", marginTop: "8px" }}>
              Incorporated and protected.
            </p>
          </div>
          
          <div className="absolute -bottom-6 -right-2 opacity-50 group-hover:opacity-100 transition-opacity duration-300">
            <svg width="80" height="100" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <path className="stroke-dasharray-100 stroke-dashoffset-100 group-hover:stroke-dashoffset-0 transition-all duration-700 ease-out" d="M9 15l2 2 4-4" stroke="#c8f135" strokeWidth="2" />
            </svg>
          </div>
        </motion.div>

        {/* Medium 2x1: Growth Marketing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="md:col-span-2 group relative flex flex-row items-center justify-between overflow-hidden"
          style={{
            background: "#111111",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "16px",
            padding: "28px",
            transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
            e.currentTarget.style.transform = "translateY(-3px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <div className="z-10">
            <TrendingUp className="w-6 h-6 mb-4" style={{ color: "#22c55e" }} />
            <h3 style={{ fontFamily: "var(--font-syne)", fontSize: "24px", fontWeight: 700, color: "#fff", lineHeight: 1.2, whiteSpace: "pre-line" }}>
              {"Growth\nMarketing"}
            </h3>
          </div>
          
          <div className="absolute right-0 bottom-0 w-[60%] h-full flex items-end">
             <svg width="100%" height="60%" viewBox="0 0 100 40" preserveAspectRatio="none">
               <path 
                 className="stroke-dasharray-100 stroke-dashoffset-100 group-hover:stroke-dashoffset-0 transition-all duration-1000 ease-out"
                 d="M0,35 Q10,35 20,25 T40,15 T60,20 T80,5 T100,0" 
                 fill="none" 
                 stroke="#22c55e" 
                 strokeWidth="2" 
               />
               <path 
                 className="opacity-0 group-hover:opacity-10 transition-opacity duration-1000 delay-300"
                 d="M0,35 Q10,35 20,25 T40,15 T60,20 T80,5 T100,0 L100,40 L0,40 Z" 
                 fill="#22c55e" 
               />
             </svg>
          </div>
        </motion.div>

        {/* Small 1x1: Mentorship */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="group relative flex flex-col justify-between overflow-hidden"
          style={{
            background: "#0f0f0f",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "16px",
            padding: "24px",
            transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
            e.currentTarget.style.transform = "translateY(-3px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <div>
            <Users className="w-6 h-6 mb-4" style={{ color: "#f97316" }} />
            <h3 style={{ fontFamily: "var(--font-syne)", fontSize: "20px", fontWeight: 700, color: "#fff", lineHeight: 1.2, whiteSpace: "pre-line" }}>
              {"Mentor\nNetwork"}
            </h3>
            <p style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#a1a1a1", marginTop: "8px" }}>
              Founders who've done it.
            </p>
          </div>
          
          <div className="absolute -bottom-2 right-4 flex -space-x-3 opacity-80 group-hover:opacity-100 transition-opacity">
            {["Aneka", "Felix", "Sam"].map((seed, i) => (
              <img 
                key={seed}
                src={`https://api.dicebear.com/7.x/notionists/svg?seed=${seed}&backgroundColor=f97316`}
                className="w-12 h-12 rounded-full border-2 border-[#0f0f0f] relative group-hover:-translate-y-2 transition-transform"
                style={{ zIndex: 3 - i, transitionDelay: `${i * 50}ms` }}
                alt="Avatar"
              />
            ))}
          </div>
        </motion.div>

        {/* Small 1x1: Co-Founder Match */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="group relative flex flex-col justify-between overflow-hidden"
          style={{
            background: "#111111",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "16px",
            padding: "24px",
            transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
            e.currentTarget.style.transform = "translateY(-3px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <div>
            <Handshake className="w-6 h-6 mb-4" style={{ color: "#6366f1" }} />
            <h3 style={{ fontFamily: "var(--font-syne)", fontSize: "20px", fontWeight: 700, color: "#fff", lineHeight: 1.2, whiteSpace: "pre-line" }}>
              {"Find Your\nCo-Founder"}
            </h3>
            <p style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#a1a1a1", marginTop: "8px" }}>
              Meet your builder.
            </p>
          </div>
          <div className="absolute -bottom-4 right-2 text-[#6366f1] opacity-20 group-hover:opacity-40 transition-opacity duration-300">
             <Handshake className="w-24 h-24" />
          </div>
        </motion.div>

        </div>
      )}
    </section>
  );
}
