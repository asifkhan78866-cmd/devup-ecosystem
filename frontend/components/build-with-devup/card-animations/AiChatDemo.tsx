"use client";

import { motion } from "framer-motion";

export function AiChatDemo() {
  return (
    <div className="w-full h-full bg-black/60 rounded-xl border border-white/10 p-3 flex flex-col gap-2 overflow-hidden justify-end">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="self-end bg-blue-600/80 text-white text-xs px-3 py-1.5 rounded-2xl rounded-tr-sm max-w-[80%]"
      >
        How do I integrate Stripe?
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="self-start bg-white/10 text-white/90 text-xs px-3 py-1.5 rounded-2xl rounded-tl-sm max-w-[90%]"
      >
        <span className="flex gap-1 items-center mb-1">
          <span className="w-2 h-2 rounded-full bg-purple-500"></span>
          <span className="font-semibold text-[10px] text-purple-400">DevUp AI</span>
        </span>
        Here is the code to create a checkout session based on your docs...
      </motion.div>
    </div>
  );
}
