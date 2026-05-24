"use client";

import { motion } from "framer-motion";

export function DocumentStamp() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-white/5 rounded-xl border border-white/10 relative overflow-hidden">
      {/* Fake Document Lines */}
      <div className="absolute top-4 left-4 w-3/4 h-2 bg-white/10 rounded-full" />
      <div className="absolute top-8 left-4 w-1/2 h-2 bg-white/10 rounded-full" />
      <div className="absolute top-12 left-4 w-2/3 h-2 bg-white/10 rounded-full" />

      {/* Stamp */}
      <motion.div
        initial={{ scale: 3, opacity: 0, rotate: -20 }}
        animate={{ scale: 1, opacity: 1, rotate: -10 }}
        transition={{ duration: 0.5, delay: 0.5, type: "spring", stiffness: 200 }}
        className="border-4 border-green-500 text-green-500 font-bold text-xl px-4 py-1 rounded-md rotate-[-10deg]"
      >
        APPROVED
      </motion.div>
    </div>
  );
}
