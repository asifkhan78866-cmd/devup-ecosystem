"use client";

import { motion } from "framer-motion";

export type Category = "all" | "tech" | "ai" | "creative" | "marketing" | "legal" | "mission";

const CATEGORIES: { id: Category; label: string }[] = [
  { id: "all", label: "All Services" },
  { id: "tech", label: "Tech & Infra" },
  { id: "ai", label: "AI & Data" },
  { id: "creative", label: "Creative" },
  { id: "marketing", label: "Growth" },
  { id: "legal", label: "Legal" },
  { id: "mission", label: "Community" },
];

interface ServiceFilterTabsProps {
  activeCategory: Category;
  onChange: (category: Category) => void;
}

export function ServiceFilterTabs({ activeCategory, onChange }: ServiceFilterTabsProps) {
  return (
    <div className="sticky top-[72px] z-30 w-full py-4 bg-black/80 backdrop-blur-xl border-b border-white/5 shadow-2xl overflow-x-auto no-scrollbar mb-12">
      <div className="container mx-auto px-4 flex items-center justify-start md:justify-center gap-2 min-w-max">
        {CATEGORIES.map((category) => {
          const isActive = activeCategory === category.id;
          return (
            <button
              key={category.id}
              onClick={() => onChange(category.id)}
              className={`relative px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${isActive ? "text-black" : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white rounded-full z-0"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{category.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
