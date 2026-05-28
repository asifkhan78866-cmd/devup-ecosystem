"use client";

import { motion } from "framer-motion";

export default function HeroDashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-[960px] mx-auto mt-[72px] mb-0"
    >
      {/* Outer frame */}
      <div 
        className="relative overflow-hidden flex flex-col"
        style={{
          borderRadius: "16px",
          border: "1px solid rgba(255,255,255,0.08)",
          background: "#111111",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.05), 0 32px 80px rgba(0,0,0,0.8), 0 0 120px rgba(200,241,53,0.04)",
        }}
      >
        {/* Shimmer sweep effect */}
        <motion.div 
          className="absolute inset-0 z-50 pointer-events-none"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 1.5, delay: 1.2, ease: "easeInOut" }}
          style={{
            background: "linear-gradient(to right, transparent, rgba(255,255,255,0.04) 50%, transparent)",
            width: "200px"
          }}
        />

        {/* Top browser chrome bar */}
        <div 
          className="flex items-center px-4 gap-2"
          style={{
            height: "36px",
            background: "#0a0a0a",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex gap-1.5">
            <div className="w-[10px] h-[10px] rounded-full bg-[#ff5f57]" />
            <div className="w-[10px] h-[10px] rounded-full bg-[#febc2e]" />
            <div className="w-[10px] h-[10px] rounded-full bg-[#28c840]" />
          </div>
          <div className="flex-1 flex justify-center">
            <div 
              style={{
                background: "#1a1a1a",
                borderRadius: "6px",
                padding: "4px 12px",
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: "11px",
                color: "#6b6b6b",
                width: "200px",
                textAlign: "center"
              }}
            >
              devupecosystem.in/dashboard
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex flex-row h-[480px]">
          {/* Left Sidebar */}
          <div 
            className="flex flex-col justify-between"
            style={{
              width: "200px",
              background: "#0d0d0d",
              borderRight: "1px solid rgba(255,255,255,0.05)",
              padding: "16px 12px"
            }}
          >
            <div>
              <div 
                className="mb-6 px-3"
                style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "14px", fontWeight: 700, color: "#fff" }}
              >
                DevUp
              </div>
              <div className="flex flex-col gap-1">
                {[
                  { label: "Dashboard", active: true },
                  { label: "My Startup", active: false },
                  { label: "Team", active: false },
                  { label: "Funding", active: false },
                  { label: "Documents", active: false },
                  { label: "Mentors", active: false },
                ].map((item) => (
                  <div 
                    key={item.label}
                    className="flex items-center px-3"
                    style={{
                      height: "32px",
                      borderRadius: "6px",
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: "13px",
                      background: item.active ? "rgba(200,241,53,0.1)" : "transparent",
                      color: item.active ? "#c8f135" : "#6b6b6b",
                      borderLeft: item.active ? "2px solid #c8f135" : "2px solid transparent",
                    }}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Profile */}
            <div className="flex items-center gap-2 px-2 mt-4">
              <div className="w-8 h-8 rounded-full bg-[#1a1a1a] overflow-hidden">
                <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Asif" alt="avatar" />
              </div>
              <div className="flex flex-col">
                <span style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#e4e4e4", fontWeight: 500 }}>Asif K.</span>
                <span style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", color: "#6b6b6b" }}>Founder</span>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 p-6" style={{ background: "#111111" }}>
            {/* Top Stat Cards */}
            <div className="flex gap-3 mb-8">
              {[
                { label: "Active Startups", value: "23", trend: "↑ 12%", trendColor: "#c8f135" },
                { label: "Funding Unlocked", value: "₹4Cr+", trend: "↑ 8%", trendColor: "#c8f135" },
                { label: "Student Builders", value: "1.2K", trend: "↑ 24%", trendColor: "#c8f135" },
                { label: "Cities", value: "6", trend: "↑ 2", trendColor: "#c8f135" },
              ].map((stat, i) => (
                <div 
                  key={i} 
                  className="flex-1 flex flex-col"
                  style={{
                    background: "#0d0d0d",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "10px",
                    padding: "14px 16px"
                  }}
                >
                  <span style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                    {stat.label}
                  </span>
                  <div className="flex items-end justify-between">
                    <span style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "22px", color: "#ffffff", fontWeight: 700 }}>
                      {stat.value}
                    </span>
                    <span style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", color: stat.trendColor }}>
                      {stat.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Middle Section */}
            <div className="flex gap-6">
              {/* Left Col (60%) */}
              <div className="w-[60%] flex flex-col">
                <span style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "12px", color: "#6b6b6b", marginBottom: "12px" }}>
                  Recent Applications
                </span>
                <div className="flex flex-col border border-white/5 rounded-lg overflow-hidden bg-[#0d0d0d]">
                  {[
                    { name: "Nexus AI", stage: "Pre-seed", status: "Approved", statusColor: "#c8f135", statusBg: "rgba(200,241,53,0.1)", logo: "#6366f1" },
                    { name: "BuildSpace", stage: "Idea", status: "Pending", statusColor: "#fbbf24", statusBg: "rgba(251,191,36,0.1)", logo: "#ec4899" },
                    { name: "DevFlow", stage: "Seed", status: "Approved", statusColor: "#c8f135", statusBg: "rgba(200,241,53,0.1)", logo: "#22c55e" },
                  ].map((app, i) => (
                    <div 
                      key={i}
                      className="flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: app.logo }}>
                          {app.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#e4e4e4", fontWeight: 500 }}>{app.name}</span>
                          <span style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", color: "#6b6b6b" }}>{app.stage}</span>
                        </div>
                      </div>
                      <div 
                        style={{
                          background: app.statusBg,
                          color: app.statusColor,
                          padding: "4px 10px",
                          borderRadius: "100px",
                          fontFamily: "var(--font-inter), sans-serif",
                          fontSize: "11px",
                          fontWeight: 500
                        }}
                      >
                        {app.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Col (40%) */}
              <div className="w-[40%] flex flex-col">
                <span style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "12px", color: "#6b6b6b", marginBottom: "12px" }}>
                  Live Activity
                </span>
                <div className="flex flex-col gap-4 pl-1">
                  {[
                    { text: "NexusAI submitted application", time: "2m ago", color: "#fbbf24" },
                    { text: "3 new founders joined", time: "15m ago", color: "#6366f1" },
                    { text: "GPU cluster allocated", time: "1h ago", color: "#c8f135" },
                    { text: "Funding round closed", time: "3h ago", color: "#22c55e" },
                    { text: "New mentor onboarded", time: "5h ago", color: "#ec4899" },
                  ].map((activity, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full mt-1.5" style={{ backgroundColor: activity.color, boxShadow: `0 0 8px ${activity.color}80` }} />
                      <div className="flex flex-col">
                        <span style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "13px", color: "#a1a1a1" }}>{activity.text}</span>
                        <span style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "11px", color: "#6b6b6b" }}>{activity.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
