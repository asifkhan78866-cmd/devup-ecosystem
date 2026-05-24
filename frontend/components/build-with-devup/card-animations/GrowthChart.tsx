"use client";

import { motion } from "framer-motion";

export function GrowthChart() {
  return (
    <div className="w-full h-full flex items-end justify-between p-4 gap-2">
      {[40, 60, 45, 80, 65, 100].map((height, i) => (
        <motion.div
          key={i}
          initial={{ height: "0%" }}
          animate={{ height: `${height}%` }}
          transition={{ duration: 1.5, delay: i * 0.1, ease: "easeOut" }}
          className="w-full bg-gradient-to-t from-[var(--accent-primary)]/20 to-[var(--accent-primary)] rounded-t-sm"
        />
      ))}
    </div>
  );
}
