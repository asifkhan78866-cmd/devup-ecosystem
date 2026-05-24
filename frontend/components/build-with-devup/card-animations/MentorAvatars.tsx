"use client";

import { motion } from "framer-motion";

export function MentorAvatars() {
  return (
    <div className="w-full h-full relative flex items-center justify-center bg-white/5 rounded-xl border border-white/10">
      <div className="flex -space-x-4">
        {[
          "https://i.pravatar.cc/150?u=1",
          "https://i.pravatar.cc/150?u=2",
          "https://i.pravatar.cc/150?u=3",
        ].map((url, i) => (
          <motion.img
            key={i}
            src={url}
            alt="Mentor"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.2 }}
            className="w-12 h-12 rounded-full border-2 border-black object-cover relative"
            style={{ zIndex: 10 - i }}
          />
        ))}
      </div>
    </div>
  );
}
