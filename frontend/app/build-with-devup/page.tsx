"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { services } from "@/data/services";
import type { Service } from "@/data/services";
import PageHeader from "@/components/PageHeader";
import FloatingSymbols from "@/components/FloatingSymbols";
import ErrorBoundary from "@/components/ErrorBoundary";

const ServiceOrbit3D = dynamic(
  () => import("@/components/build-with-devup/ServiceOrbit3D"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[500px] flex items-center justify-center">
        <div
          style={{
            width: 200,
            height: 200,
            borderRadius: "50%",
            border: "1px solid rgba(200,241,53,0.1)",
            animation: "pulse 2s infinite",
          }}
        />
      </div>
    ),
  }
);

/* ───────────────────────────────────────────────────────── */
/*  Lucide icon lookup                                       */
/* ───────────────────────────────────────────────────────── */
import {
  Cpu, Server, Cloud, Database, Globe, Smartphone, Plug,
  Brain, MessageSquare, BarChart, Eye,
  Palette, Layout, Camera, Film, Presentation,
  TrendingUp, Share2, Search, Newspaper, Users,
  Scale, FileCheck, Lock,
  Compass, Trophy, Handshake, DollarSign, Calendar, Network,
  LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Cpu, Server, Cloud, Database, Globe, Smartphone, Plug,
  Brain, MessageSquare, BarChart, Eye,
  Palette, Layout, Camera, Film, Presentation,
  TrendingUp, Share2, Search, Newspaper, Users,
  Scale, FileCheck, Lock,
  Compass, Trophy, Handshake, DollarSign, Calendar, Network,
};

function getLucideIcon(name: string): LucideIcon {
  return ICON_MAP[name] || Compass;
}

/* ───────────────────────────────────────────────────────── */
/*  StatsStrip                                               */
/* ───────────────────────────────────────────────────────── */
function StatsStrip() {
  const stats = [
    { value: "30+", label: "Services Available" },
    { value: "15+", label: "Service Categories" },
    { value: "48hr", label: "Average Response" },
    { value: "100%", label: "Ecosystem Support" },
  ];
  return (
    <div className="stats-strip-container">
      {stats.map((s, i) => (
        <div key={i} className="stats-strip-item">
          <div
            style={{
              fontFamily: "var(--font-syne), Syne, sans-serif",
              fontSize: 40,
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1,
            }}
          >
            {s.value}
          </div>
          <div
            style={{
              fontFamily: "var(--font-inter), Inter, sans-serif",
              fontSize: 13,
              color: "#6b6b6b",
              marginTop: 8,
            }}
          >
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────────────────────────────────────── */
/*  FilterTabs                                               */
/* ───────────────────────────────────────────────────────── */
function FilterTabs({
  active,
  onChange,
  onExplore,
}: {
  active: string;
  onChange: (id: string) => void;
  onExplore: () => void;
}) {
  const tabs = [
    { id: "all", label: "All Services" },
    { id: "tech", label: "Tech & Infra" },
    { id: "ai", label: "AI & Data" },
    { id: "creative", label: "Creative" },
    { id: "marketing", label: "Marketing" },
    { id: "legal", label: "Legal" },
    { id: "mission", label: "Mission" },
  ];

  return (
    <div
      style={{
        position: "sticky",
        top: 56,
        zIndex: 50,
        background: "rgba(10,10,10,0.95)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
      className="px-4 md:px-8 py-3"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center gap-4">
        {/* Scrollable Tabs */}
        <div
          className="hide-scrollbar flex gap-2 overflow-x-auto"
          style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              style={{
                padding: "7px 16px",
                borderRadius: 100,
                border: "1px solid",
                borderColor:
                  active === tab.id
                    ? "rgba(200,241,53,0.3)"
                    : "rgba(255,255,255,0.08)",
                background:
                  active === tab.id ? "rgba(200,241,53,0.08)" : "transparent",
                color: active === tab.id ? "#c8f135" : "#6b6b6b",
                fontFamily: "var(--font-inter), Inter, sans-serif",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s",
                flexShrink: 0,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Spacer for desktop */}
        <div className="hidden md:block flex-1" />

        {/* Explore All Button */}
        <button
          onClick={onExplore}
          className="w-full md:w-auto"
          style={{
            padding: "9px 16px",
            borderRadius: 8,
            border: "none",
            background: "#c8f135",
            color: "#000000",
            fontFamily: "var(--font-inter), Inter, sans-serif",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          Explore All ↓
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────── */
/*  CardAnimation sub-components                             */
/* ───────────────────────────────────────────────────────── */
function GpuTerminal() {
  const [usage, setUsage] = useState(84);
  const [vram, setVram] = useState(67.2);

  useEffect(() => {
    const i = setInterval(() => {
      setUsage(Math.floor(75 + Math.random() * 20));
      setVram(Math.round((60 + Math.random() * 18) * 10) / 10);
    }, 2000);
    return () => clearInterval(i);
  }, []);

  const bar = (pct: number) => {
    const filled = Math.round(pct / 10);
    return "█".repeat(filled) + "░".repeat(10 - filled);
  };

  return (
    <div
      style={{
        background: "#0a0a0a",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 8,
        padding: "12px 14px",
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 12,
        lineHeight: 1.8,
      }}
    >
      <div style={{ color: "#6b6b6b" }}>$ devup gpu status</div>
      <div>
        <span style={{ color: "#6b6b6b" }}>GPU </span>
        <span style={{ color: "#c8f135" }}>{bar(usage)}</span>
        <span style={{ color: "#a1a1a1" }}> {usage}%</span>
      </div>
      <div>
        <span style={{ color: "#6b6b6b" }}>VRAM </span>
        <span style={{ color: "#a1a1a1" }}>{vram} / 80 GB</span>
      </div>
      <div>
        <span style={{ color: "#6b6b6b" }}>Jobs </span>
        <span style={{ color: "#c8f135" }}>2 running</span>
      </div>
    </div>
  );
}

function GrowthSparkline() {
  const points = [20, 35, 28, 55, 48, 72, 65, 88, 82, 100];
  const w = 200,
    h = 60;
  const max = Math.max(...points);
  const coords = points.map((p, i) => ({
    x: (i / (points.length - 1)) * w,
    y: h - (p / max) * h,
  }));
  const d = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`)
    .join(" ");

  return (
    <div>
      <div
        style={{
          color: "#c8f135",
          fontFamily: "var(--font-syne), Syne, sans-serif",
          fontSize: 20,
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        ↑ 143% MoM
      </div>
      <svg width={w} height={h} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="sparkGrad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#c8f135" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#c8f135" stopOpacity={1} />
          </linearGradient>
        </defs>
        <path
          d={d}
          fill="none"
          stroke="url(#sparkGrad)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx={coords[coords.length - 1].x}
          cy={coords[coords.length - 1].y}
          r={4}
          fill="#c8f135"
        />
      </svg>
    </div>
  );
}

function CardAnimation({ type }: { type: string }) {
  if (type === "GpuTerminal") return <GpuTerminal />;
  if (type === "GrowthChart") return <GrowthSparkline />;
  if (type === "AiChatDemo")
    return (
      <div
        style={{
          background: "#0a0a0a",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 8,
          padding: "12px 14px",
          fontFamily: "var(--font-inter), Inter, sans-serif",
          fontSize: 13,
        }}
      >
        <div
          style={{
            color: "#6b6b6b",
            marginBottom: 8,
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          AI Assistant
        </div>
        <div
          style={{
            background: "rgba(200,241,53,0.06)",
            border: "1px solid rgba(200,241,53,0.12)",
            borderRadius: 6,
            padding: "8px 12px",
            color: "#a1a1a1",
            lineHeight: 1.5,
          }}
        >
          Based on your codebase, I recommend using a RAG pipeline with
          pgvector for semantic search…
        </div>
      </div>
    );
  if (type === "DocumentStamp")
    return (
      <div
        style={{
          background: "#0a0a0a",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 8,
          padding: "16px",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-syne), Syne, sans-serif",
            fontSize: 14,
            fontWeight: 700,
            color: "#fff",
            marginBottom: 8,
          }}
        >
          Co-Founder Agreement
        </div>
        <div style={{ fontSize: 12, color: "#6b6b6b", marginBottom: 12 }}>
          Drafted · 2 signatures pending
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
          }}
        >
          <div
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: "#c8f135",
            }}
          />
          <div
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: "rgba(255,255,255,0.06)",
            }}
          />
        </div>
      </div>
    );
  if (type === "MentorAvatars")
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex" }}>
          {["Felix", "Aneka", "Alex", "Sam"].map((seed, i) => (
            <img
              key={seed}
              src={`https://api.dicebear.com/7.x/notionists/svg?seed=${seed}&backgroundColor=0a0a0a`}
              alt=""
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "2px solid #0a0a0a",
                marginLeft: i > 0 ? -10 : 0,
              }}
            />
          ))}
        </div>
        <div>
          <div
            style={{
              fontFamily: "var(--font-syne), Syne, sans-serif",
              fontSize: 14,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            12 mentors
          </div>
          <div style={{ fontSize: 12, color: "#6b6b6b" }}>
            Available this week
          </div>
        </div>
      </div>
    );
  if (type === "ColorSwatches")
    return (
      <div style={{ display: "flex", gap: 6 }}>
        {["#c8f135", "#0a0a0a", "#111111", "#ffffff", "#a1a1a1"].map((c) => (
          <div
            key={c}
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: c,
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          />
        ))}
      </div>
    );
  return null;
}

/* ───────────────────────────────────────────────────────── */
/*  ServiceCard                                              */
/* ───────────────────────────────────────────────────────── */
function ServiceCard({
  service,
  onSelect,
}: {
  service: Service;
  onSelect: (s: Service) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const Icon = getLucideIcon(service.icon);

  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={() => onSelect(service)}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      style={{
        gridColumn:
          service.size === "large" ? "span 2" : "span 1",
        gridRow: service.size === "large" ? "span 2" : "span 1",
        background: "#111111",
        border: `1px solid ${
          hovered ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.07)"
        }`,
        borderRadius: 14,
        padding: 24,
        cursor: "pointer",
        transition: "border-color 0.2s",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-inter), Inter, sans-serif",
          fontSize: 10,
          color: "#6b6b6b",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: 16,
        }}
      >
        {service.categoryLabel}
      </span>

      <div
        style={{
          width: 40,
          height: 40,
          background: "rgba(200,241,53,0.08)",
          border: "1px solid rgba(200,241,53,0.15)",
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
          color: "#c8f135",
          flexShrink: 0,
        }}
      >
        <Icon size={18} />
      </div>

      <h3
        style={{
          fontFamily: "var(--font-syne), Syne, sans-serif",
          fontSize: service.size === "large" ? 24 : 17,
          fontWeight: 700,
          color: "#ffffff",
          lineHeight: 1.2,
          marginBottom: 8,
        }}
      >
        {service.name}
      </h3>

      <p
        style={{
          fontFamily: "var(--font-inter), Inter, sans-serif",
          fontSize: 13,
          color: "#6b6b6b",
          lineHeight: 1.6,
          flex: 1,
        }}
      >
        {service.short}
      </p>

      {service.size === "large" && (
        <div style={{ marginTop: 24 }}>
          <CardAnimation type={service.animationType} />
        </div>
      )}

      <div
        style={{
          marginTop: 20,
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontFamily: "var(--font-inter), Inter, sans-serif",
          fontSize: 12,
          color: hovered ? "#c8f135" : "#3d3d3d",
          transition: "color 0.15s",
        }}
      >
        Explore
        <span
          style={{
            transform: hovered ? "translateX(4px)" : "translateX(0)",
            transition: "transform 0.2s",
            display: "inline-block",
          }}
        >
          →
        </span>
      </div>
    </motion.div>
  );
}

/* ───────────────────────────────────────────────────────── */
/*  ServiceDetailPanel                                       */
/* ───────────────────────────────────────────────────────── */
function ServiceRequestForm({ service }: { service: Service }) {
  const [timeline, setTimeline] = useState("ASAP");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const timelines = ["ASAP", "1-2 weeks", "1 month+"];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    // Simulate submission since no API route exists yet
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitted(true);
    setLoading(false);
  }

  if (submitted) {
    return (
      <div style={{ textAlign: "center", padding: "32px 0" }}>
        <div
          style={{
            width: 48,
            height: 48,
            background: "rgba(200,241,53,0.1)",
            border: "1px solid rgba(200,241,53,0.3)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            fontSize: 20,
            color: "#c8f135",
          }}
        >
          ✓
        </div>
        <h3
          style={{
            fontFamily: "var(--font-syne), Syne, sans-serif",
            fontSize: 20,
            fontWeight: 700,
            color: "#ffffff",
            marginBottom: 8,
          }}
        >
          Request Sent
        </h3>
        <p
          style={{
            fontFamily: "var(--font-inter), Inter, sans-serif",
            fontSize: 14,
            color: "#6b6b6b",
          }}
        >
          We&apos;ll reach out within 48 hours about {service.name}.
        </p>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#111111",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10,
    padding: "14px 16px",
    fontFamily: "var(--font-inter), Inter, sans-serif",
    fontSize: 16,
    color: "#e4e4e4",
    outline: "none",
    marginBottom: 16,
    transition: "border-color 0.15s",
    boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--font-inter), Inter, sans-serif",
    fontSize: 12,
    color: "#6b6b6b",
    marginBottom: 6,
    display: "block",
  };

  return (
    <div>
      <h3
        style={{
          fontFamily: "var(--font-syne), Syne, sans-serif",
          fontSize: 16,
          fontWeight: 700,
          color: "#ffffff",
          marginBottom: 20,
        }}
      >
        Request This Service
      </h3>
      <form onSubmit={handleSubmit}>
        <label style={labelStyle}>Your Name</label>
        <input name="name" required placeholder="Asif Khan" style={inputStyle} autoComplete="name" />

        <label style={labelStyle}>Startup Name</label>
        <input
          name="startupName"
          required
          placeholder="NexusAI"
          style={inputStyle}
          autoComplete="organization"
        />

        <label style={labelStyle}>Email</label>
        <input
          name="email"
          type="email"
          required
          placeholder="you@startup.com"
          style={inputStyle}
          autoComplete="email"
          inputMode="email"
        />

        <label style={labelStyle}>What do you need?</label>
        <textarea
          name="description"
          required
          rows={3}
          placeholder="Describe your requirements..."
          style={{ ...inputStyle, resize: "vertical" }}
        />

        <label style={labelStyle}>Timeline</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {timelines.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTimeline(t)}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "1px solid",
                borderColor:
                  timeline === t
                    ? "rgba(200,241,53,0.3)"
                    : "rgba(255,255,255,0.08)",
                background:
                  timeline === t ? "rgba(200,241,53,0.08)" : "transparent",
                color: timeline === t ? "#c8f135" : "#6b6b6b",
                fontFamily: "var(--font-inter), Inter, sans-serif",
                fontSize: 14,
                cursor: "pointer",
                flexGrow: 1,
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px 0",
            minHeight: 48,
            background: loading ? "#6b6b6b" : "#c8f135",
            color: "#000000",
            border: "none",
            borderRadius: 10,
            fontFamily: "var(--font-inter), Inter, sans-serif",
            fontSize: 16,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "opacity 0.15s",
            marginTop: 8,
          }}
        >
          {loading ? "Sending..." : "Send Request"}
        </button>
      </form>
    </div>
  );
}

function ServiceDetailPanel({
  service,
  onClose,
}: {
  service: Service;
  onClose: () => void;
}) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const Icon = getLucideIcon(service.icon);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          zIndex: 200,
        }}
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="max-lg:!bottom-[calc(64px+env(safe-area-inset-bottom,0px))]"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(560px, 100vw)",
          background: "#0a0a0a",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          zIndex: 201,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            padding: "20px 28px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            background: "#0a0a0a",
            zIndex: 1,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-inter), Inter, sans-serif",
              fontSize: 11,
              color: "#c8f135",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            {service.categoryLabel}
          </span>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              color: "#a1a1a1",
              cursor: "pointer",
              padding: "6px 12px",
              fontFamily: "var(--font-inter), Inter, sans-serif",
              fontSize: 13,
            }}
          >
            Close ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 28, flex: 1 }}>
          <div
            style={{
              width: 56,
              height: 56,
              background: "rgba(200,241,53,0.08)",
              border: "1px solid rgba(200,241,53,0.15)",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#c8f135",
              marginBottom: 20,
            }}
          >
            <Icon size={24} />
          </div>

          <h2
            style={{
              fontFamily: "var(--font-syne), Syne, sans-serif",
              fontSize: 28,
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.1,
              marginBottom: 8,
            }}
          >
            {service.name}
          </h2>
          <p
            style={{
              fontFamily: "var(--font-inter), Inter, sans-serif",
              fontSize: 15,
              color: "#a1a1a1",
              lineHeight: 1.6,
              marginBottom: 32,
            }}
          >
            {service.tagline}
          </p>

          {/* Why DevUp card */}
          <div
            style={{
              background: "#111111",
              border: "1px solid rgba(200,241,53,0.12)",
              borderRadius: 12,
              padding: 24,
              marginBottom: 28,
            }}
          >
            <h3
              style={{
                fontFamily: "var(--font-syne), Syne, sans-serif",
                fontSize: 16,
                fontWeight: 700,
                color: "#c8f135",
                marginBottom: 16,
              }}
            >
              Why DevUp for {service.name}?
            </h3>
            {service.whyDevUp.map((reason, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <span
                  style={{
                    color: "#c8f135",
                    fontSize: 14,
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  ✦
                </span>
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-inter), Inter, sans-serif",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#ffffff",
                      marginBottom: 2,
                    }}
                  >
                    {reason.title}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-inter), Inter, sans-serif",
                      fontSize: 13,
                      color: "#6b6b6b",
                      lineHeight: 1.5,
                    }}
                  >
                    {reason.description}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* What's included */}
          <div style={{ marginBottom: 28 }}>
            <h3
              style={{
                fontFamily: "var(--font-syne), Syne, sans-serif",
                fontSize: 16,
                fontWeight: 700,
                color: "#ffffff",
                marginBottom: 14,
              }}
            >
              What&apos;s Included
            </h3>
            {service.whatsIncluded.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    color: "#c8f135",
                    fontSize: 12,
                    marginTop: 2,
                    flexShrink: 0,
                  }}
                >
                  ✓
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-inter), Inter, sans-serif",
                    fontSize: 14,
                    color: "#a1a1a1",
                    lineHeight: 1.5,
                  }}
                >
                  {item}
                </span>
              </div>
            ))}
          </div>

          {/* How it works */}
          <div style={{ marginBottom: 28 }}>
            <h3
              style={{
                fontFamily: "var(--font-syne), Syne, sans-serif",
                fontSize: 16,
                fontWeight: 700,
                color: "#ffffff",
                marginBottom: 16,
              }}
            >
              How It Works
            </h3>
            {service.howItWorks.map((step, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 16,
                  marginBottom: 16,
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "rgba(200,241,53,0.1)",
                    border: "1px solid rgba(200,241,53,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-syne), Syne, sans-serif",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#c8f135",
                    flexShrink: 0,
                  }}
                >
                  {step.step}
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-inter), Inter, sans-serif",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#ffffff",
                      marginBottom: 2,
                    }}
                  >
                    {step.title}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-inter), Inter, sans-serif",
                      fontSize: 13,
                      color: "#6b6b6b",
                      lineHeight: 1.5,
                    }}
                  >
                    {step.description}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Engagement info */}
          <div
            className="engagement-grid"
            style={{
              background: "#111111",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 12,
              padding: 20,
              marginBottom: 28,
            }}
          >
            {[
              { label: "Engagement", value: service.engagementType },
              { label: "Timeline", value: service.timeline },
              { label: "Support", value: service.supportLevel },
            ].map((item, i) => (
              <div key={i}>
                <div
                  style={{
                    fontFamily: "var(--font-inter), Inter, sans-serif",
                    fontSize: 10,
                    color: "#6b6b6b",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 4,
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-syne), Syne, sans-serif",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#ffffff",
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          <ServiceRequestForm service={service} />
        </div>
      </motion.div>
    </>
  );
}

/* ───────────────────────────────────────────────────────── */
/*  PartnerCredits                                           */
/* ───────────────────────────────────────────────────────── */
function PartnerCredits() {
  const partners = [
    { name: "AWS Activate", letter: "A", credit: "$100,000 Credits", desc: "Cloud computing resources for 1 year." },
    { name: "Notion", letter: "N", credit: "$1,000 Credits", desc: "Workspace for your startup for 1 year." },
    { name: "OpenAI", letter: "O", credit: "$2,500 Credits", desc: "API credits for GPT-4 and other models." },
    { name: "Stripe", letter: "S", credit: "Fee-free processing", desc: "First $50,000 in volume fee-free." },
    { name: "Vercel", letter: "V", credit: "Pro Plan Free", desc: "Frontend deployment for 1 year." },
    { name: "Supabase", letter: "S", credit: "$300 Credits", desc: "Database and auth infrastructure." },
  ];

  return (
    <section style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 32px" }}>
      <p
        style={{
          fontFamily: "var(--font-inter), Inter, sans-serif",
          fontSize: 11,
          color: "#c8f135",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          marginBottom: 12,
        }}
      >
        ✦ PARTNER CREDITS
      </p>
      <h2
        style={{
          fontFamily: "var(--font-syne), Syne, sans-serif",
          fontSize: 36,
          fontWeight: 800,
          color: "#ffffff",
          marginBottom: 8,
          lineHeight: 1.1,
        }}
      >
        $100k+ in credits.
      </h2>
      <p
        style={{
          fontFamily: "var(--font-inter), Inter, sans-serif",
          fontSize: 16,
          color: "#a1a1a1",
          marginBottom: 48,
          maxWidth: 480,
        }}
      >
        Every startup in our ecosystem gets free credits from our
        infrastructure partners.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
        }}
        className="partner-grid"
      >
        {partners.map((p, i) => (
          <div
            key={i}
            className="group"
            style={{
              background: "#111111",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14,
              padding: 24,
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor =
                "rgba(255,255,255,0.14)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor =
                "rgba(255,255,255,0.07)";
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                background: "#1a1a1a",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-syne), Syne, sans-serif",
                fontSize: 16,
                fontWeight: 700,
                color: "#ffffff",
                marginBottom: 16,
              }}
            >
              {p.letter}
            </div>
            <div
              style={{
                fontFamily: "var(--font-syne), Syne, sans-serif",
                fontSize: 15,
                fontWeight: 700,
                color: "#ffffff",
                marginBottom: 6,
              }}
            >
              {p.name}
            </div>
            <div
              style={{
                fontFamily: "var(--font-syne), Syne, sans-serif",
                fontSize: 16,
                fontWeight: 700,
                color: "#c8f135",
                marginBottom: 8,
              }}
            >
              {p.credit}
            </div>
            <div
              style={{
                fontFamily: "var(--font-inter), Inter, sans-serif",
                fontSize: 13,
                color: "#6b6b6b",
                lineHeight: 1.5,
              }}
            >
              {p.desc}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────── */
/*  ServiceCTA                                               */
/* ───────────────────────────────────────────────────────── */
function ServiceCTA() {
  return (
    <section
      style={{
        maxWidth: 800,
        margin: "0 auto",
        padding: "80px 32px",
        textAlign: "center",
      }}
    >
      <h2
        style={{
          fontFamily: "var(--font-syne), Syne, sans-serif",
          fontSize: 40,
          fontWeight: 800,
          color: "#ffffff",
          marginBottom: 16,
          lineHeight: 1.1,
        }}
      >
        Ready to build?
      </h2>
      <p
        style={{
          fontFamily: "var(--font-inter), Inter, sans-serif",
          fontSize: 17,
          color: "#a1a1a1",
          marginBottom: 40,
          lineHeight: 1.6,
        }}
      >
        Join the DevUp ecosystem and get instant access to every service,
        credit, and mentor listed on this page.
      </p>
      <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
        <a
          href="/apply"
          style={{
            padding: "14px 32px",
            background: "#c8f135",
            color: "#000",
            fontFamily: "var(--font-inter), Inter, sans-serif",
            fontSize: 15,
            fontWeight: 700,
            borderRadius: 10,
            textDecoration: "none",
            transition: "all 0.2s",
          }}
        >
          Apply Now
        </a>
        <a
          href="/ecosystem"
          style={{
            padding: "14px 32px",
            background: "transparent",
            color: "#e4e4e4",
            border: "1px solid rgba(255,255,255,0.12)",
            fontFamily: "var(--font-inter), Inter, sans-serif",
            fontSize: 15,
            fontWeight: 500,
            borderRadius: 10,
            textDecoration: "none",
            transition: "all 0.2s",
          }}
        >
          Explore Startups
        </a>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────── */
/*  WhyDevUp comparison                                      */
/* ───────────────────────────────────────────────────────── */
function WhyDevUp() {
  const rows = [
    { feature: "GPU Hosting", devup: "40% below market", others: "Full market rate" },
    { feature: "Legal Setup", devup: "Flat-fee, startup-specific", others: "Billable hours" },
    { feature: "Mentor Access", devup: "Curated 1:1 matching", others: "Generic office hours" },
    { feature: "AI Development", devup: "Full-stack AI pods", others: "Freelancer lottery" },
    { feature: "Community", devup: "Cohort-based, accountable", others: "Passive Slack channels" },
  ];

  return (
    <section style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 32px" }}>
      <p
        style={{
          fontFamily: "var(--font-inter), Inter, sans-serif",
          fontSize: 11,
          color: "#c8f135",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          marginBottom: 12,
        }}
      >
        ✦ WHY DEVUP
      </p>
      <h2
        style={{
          fontFamily: "var(--font-syne), Syne, sans-serif",
          fontSize: 36,
          fontWeight: 800,
          color: "#ffffff",
          marginBottom: 48,
          lineHeight: 1.1,
        }}
      >
        Not another marketplace.
      </h2>

      <div
        className="why-devup-grid"
        style={{
          background: "#111111",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          className="why-devup-grid-header"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            padding: "16px 24px",
          }}
        >
          <div style={{ fontFamily: "var(--font-inter), Inter, sans-serif", fontSize: 11, color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.08em" }}>Feature</div>
          <div style={{ fontFamily: "var(--font-inter), Inter, sans-serif", fontSize: 11, color: "#c8f135", textTransform: "uppercase", letterSpacing: "0.08em" }}>DevUp</div>
          <div style={{ fontFamily: "var(--font-inter), Inter, sans-serif", fontSize: 11, color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.08em" }}>Others</div>
        </div>
        {rows.map((row, i) => (
          <div
            key={i}
            className="why-devup-row"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              padding: "16px 24px",
            }}
          >
            <div style={{ fontFamily: "var(--font-inter), Inter, sans-serif", fontSize: 14, color: "#ffffff", fontWeight: 500 }}>{row.feature}</div>
            <div style={{ fontFamily: "var(--font-inter), Inter, sans-serif", fontSize: 14, color: "#a1a1a1" }}>{row.devup}</div>
            <div style={{ fontFamily: "var(--font-inter), Inter, sans-serif", fontSize: 14, color: "#3d3d3d" }}>{row.others}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/*  PAGE                                                      */
/* ═══════════════════════════════════════════════════════════ */
export default function BuildWithDevUp() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const gridRef = useRef<HTMLElement>(null);

  const filtered =
    activeCategory === "all"
      ? services
      : services.filter((s) => s.category === activeCategory);

  return (
    <main style={{ background: "#0a0a0a", minHeight: "100vh" }}>
      <FloatingSymbols />

      <PageHeader
        label="BUILD WITH DEVUP"
        headline={"Everything your\nstartup needs."}
        accentWord="Everything"
        subtitle="Tech, creative, legal, AI, and mission support — all under one ecosystem."
        variant="beam"
      />

      {/* 3D Orbit */}
      <section className="orbit-container"
        style={{
          width: "100%",
          height: 500,
          position: "relative",
          marginBottom: 80,
        }}
      >
            <ErrorBoundary>
              <ServiceOrbit3D />
            </ErrorBoundary>

        <div className="hero-text-overlay">
          <p
            style={{
              fontFamily: "var(--font-inter), Inter, sans-serif",
              fontSize: 11,
              color: "#c8f135",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            ✦ 30+ Services
          </p>
          <h2
            style={{
              fontFamily: "var(--font-syne), Syne, sans-serif",
              fontSize: 32,
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.1,
              marginBottom: 16,
            }}
          >
            One ecosystem.
            <br />
            Every resource.
          </h2>
          <p
            style={{
              fontFamily: "var(--font-inter), Inter, sans-serif",
              fontSize: 14,
              color: "#a1a1a1",
              lineHeight: 1.6,
            }}
          >
            Hover over any node to explore what DevUp offers your startup.
          </p>
        </div>
      </section>

      <StatsStrip />

      <FilterTabs
        active={activeCategory}
        onChange={setActiveCategory}
        onExplore={() =>
          gridRef.current?.scrollIntoView({ behavior: "smooth" })
        }
      />

      {/* Service grid */}
      <section
        ref={gridRef}
        style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 32px" }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
          }}
          className="service-bento-grid"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onSelect={setSelectedService}
              />
            ))}
          </AnimatePresence>
        </div>
      </section>

      <WhyDevUp />
      <PartnerCredits />
      <ServiceCTA />

      <AnimatePresence>
        {selectedService && (
          <ServiceDetailPanel
            service={selectedService}
            onClose={() => setSelectedService(null)}
          />
        )}
      </AnimatePresence>

      {/* Responsive overrides */}
      <style jsx global>{`
        .stats-strip-container {
          display: flex;
          justify-content: center;
          border-top: 1px solid rgba(255,255,255,0.05);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          padding: 32px 0;
        }
        .stats-strip-item {
          flex: 1;
          max-width: 200px;
          text-align: center;
          padding: 0 40px;
          border-right: 1px solid rgba(255,255,255,0.06);
        }
        .stats-strip-item:last-child {
          border-right: none;
        }
        .hero-text-overlay {
          position: absolute;
          left: 8%;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
          max-width: 300px;
        }
        .engagement-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
        }
        
        @media (max-width: 1024px) {
          .service-bento-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 768px) {
          .stats-strip-container {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 24px 0 !important;
            padding: 32px 16px !important;
          }
          .stats-strip-item {
            max-width: none !important;
            padding: 0 16px !important;
          }
          .stats-strip-item:nth-child(2) {
            border-right: none !important;
          }
          .stats-strip-item:nth-child(3),
          .stats-strip-item:nth-child(4) {
            border-top: 1px solid rgba(255,255,255,0.06);
            padding-top: 24px !important;
          }
          .orbit-container {
            height: auto !important;
            display: flex;
            flex-direction: column-reverse;
          }
          .hero-text-overlay {
            position: relative !important;
            left: 0 !important;
            top: 0 !important;
            transform: none !important;
            padding: 0 32px !important;
            margin: 0 auto 40px !important;
            max-width: 100% !important;
            text-align: center;
          }
          .why-devup-grid-header {
            display: none !important;
          }
          .why-devup-row {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
            padding: 24px !important;
          }
          .why-devup-row > div:nth-child(1) {
            font-size: 18px !important;
            color: #c8f135 !important;
            margin-bottom: 8px !important;
          }
          .why-devup-row > div:nth-child(2)::before {
            content: "DevUp: ";
            color: #fff;
            font-weight: 600;
          }
          .why-devup-row > div:nth-child(3)::before {
            content: "Others: ";
            color: #6b6b6b;
            font-weight: 600;
          }
          .engagement-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 640px) {
          .service-bento-grid {
            grid-template-columns: 1fr !important;
          }
          .service-bento-grid > * {
            grid-column: span 1 !important;
            grid-row: span 1 !important;
          }
          .partner-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}
