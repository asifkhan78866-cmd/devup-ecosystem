"use client";

import { GpuTerminal } from "./GpuTerminal";
import { AiChatDemo } from "./AiChatDemo";
import { GrowthChart } from "./GrowthChart";
import { DocumentStamp } from "./DocumentStamp";
import { MentorAvatars } from "./MentorAvatars";
import { motion } from "framer-motion";

export function CardAnimation({ type }: { type: string }) {
  switch (type) {
    case "GpuTerminal":
      return <GpuTerminal />;
    case "AiChatDemo":
      return <AiChatDemo />;
    case "GrowthChart":
      return <GrowthChart />;
    case "DocumentStamp":
      return <DocumentStamp />;
    case "MentorAvatars":
      return <MentorAvatars />;
    default:
      return (
        <div className="w-full h-full flex items-center justify-center bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 rounded-full border-t-2 border-[var(--accent-primary)] border-r-2"
          />
        </div>
      );
  }
}
