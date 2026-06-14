"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function IntroAnimation() {
  const [phase, setPhase] = useState<"hidden" | "playing" | "done">("hidden");

  useEffect(() => {
    const seen = sessionStorage.getItem("devup_intro_seen");
    const overlay = document.getElementById("intro-overlay");

    if (seen) {
      // Returning visitor — remove the static overlay immediately
      if (overlay) overlay.remove();
      setPhase("done");
      return;
    }

    // First visit — remove the static overlay
    // (this component renders its own animated version)
    if (overlay) overlay.remove();
    setPhase("playing");

    const timers = [
      setTimeout(() => setPhase("playing"), 0),
    ];

    const completeTimer = setTimeout(() => {
      sessionStorage.setItem("devup_intro_seen", "true");
      setPhase("done");
    }, 5000); // matches existing 5s animation

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(completeTimer);
    };
  }, []);

  if (phase !== "playing") return null;

  return (
    <AnimatePresence>
      <IntroSequence
        onComplete={() => {
          sessionStorage.setItem("devup_intro_seen", "true");
          setPhase("done");
        }}
      />
    </AnimatePresence>
  );
}

function IntroSequence({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    setTimeout(() => setPhase(1), 500);
    setTimeout(() => setPhase(2), 1500);
    setTimeout(() => setPhase(3), 2500);
    setTimeout(() => setPhase(4), 4000);
    setTimeout(() => onComplete(), 5000);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      {/* Phase 1 & 2: Dot to Line */}
      {(phase === 1 || phase === 2) && (
        <motion.div
          className="bg-white rounded-full"
          initial={{ width: 0, height: 0, opacity: 0 }}
          animate={
            phase === 1
              ? { width: 8, height: 8, opacity: 1 }
              : { width: "100%", height: 2, opacity: 1 }
          }
          transition={{
            duration: phase === 1 ? 0.5 : 0.8,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Phase 3 & 4: Text Reveal and Scale */}
      {(phase === 3 || phase === 4) && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-white"
          initial={{ scaleY: 0 }}
          animate={
            phase === 3
              ? { scaleY: 1 }
              : { scale: 100, opacity: 0 }
          }
          transition={{
            duration: phase === 3 ? 0.8 : 1.2,
            ease: phase === 3 ? "easeOut" : "easeInOut",
          }}
          style={{ transformOrigin: "center center" }}
        >
          <motion.h1
            className="text-black text-6xl md:text-8xl lg:text-[10rem] font-bold tracking-tighter"
            style={{ fontFamily: "var(--font-syne)" }}
            initial={{ opacity: 0, y: 50 }}
            animate={
              phase === 3
                ? { opacity: 1, y: 0 }
                : { opacity: 0, scale: 2 }
            }
            transition={{
              duration: 0.8,
              ease: "easeOut",
              delay: phase === 3 ? 0.2 : 0,
            }}
          >
            DevUp
          </motion.h1>
        </motion.div>
      )}
    </motion.div>
  );
}
