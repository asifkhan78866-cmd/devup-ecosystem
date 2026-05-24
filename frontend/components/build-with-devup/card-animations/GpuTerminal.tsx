"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function GpuTerminal() {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const lines = [
      "init gpu cluster...",
      "allocating 4x NVIDIA A100...",
      "loading CUDA drivers 12.2...",
      "mounting volume /dev/nvme0n1...",
      "pulling docker image ml-base:latest...",
      "starting sshd on port 2222...",
      "cluster ready. IP: 192.168.1.144"
    ];

    let index = 0;
    const interval = setInterval(() => {
      setLogs(prev => [...prev.slice(-4), lines[index]]);
      index = (index + 1) % lines.length;
    }, 800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full bg-black/80 rounded-xl border border-white/10 p-4 font-mono text-xs text-green-500 overflow-hidden flex flex-col justify-end">
      {logs.map((log, i) => (
        <motion.div
          key={i + log}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="whitespace-nowrap"
        >
          $ {log}
        </motion.div>
      ))}
      <motion.div
        animate={{ opacity: [1, 0, 1] }}
        transition={{ repeat: Infinity, duration: 0.8 }}
        className="w-2 h-3 bg-green-500 mt-1"
      />
    </div>
  );
}
