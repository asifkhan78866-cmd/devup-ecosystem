"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Compass } from "lucide-react";

const WORDS = ["Think", "Build", "Ship", "Raise", "Scale", "Lead", "Create", "Grow"];
const SUBTITLE_1 = "India's first startup ecosystem where students become founders.";
const SUBTITLE_2 = "Apply. Build. Scale. Get funded.";

export default function HeroTypography() {
  const [wordIndex, setWordIndex] = useState(0);

  // Typewriter state
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [isErasing, setIsErasing] = useState(false);
  const [lineIndex, setLineIndex] = useState(0);

  // Word morphing effect
  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % WORDS.length);
    }, 2600);
    return () => clearInterval(interval);
  }, []);

  // Typewriter effect
  useEffect(() => {
    const currentFullText = lineIndex === 0 ? SUBTITLE_1 : SUBTITLE_2;

    let timeout: NodeJS.Timeout;

    if (isTyping) {
      if (displayText.length < currentFullText.length) {
        timeout = setTimeout(() => {
          setDisplayText(currentFullText.slice(0, displayText.length + 1));
        }, 40);
      } else {
        setIsTyping(false);
        if (lineIndex === 0) {
          timeout = setTimeout(() => {
            setIsErasing(true);
          }, 1500);
        }
      }
    } else if (isErasing) {
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, 20);
      } else {
        setIsErasing(false);
        setLineIndex(1);
        setIsTyping(true);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayText, isTyping, isErasing, lineIndex]);

  const showButtons = !isTyping && !isErasing && lineIndex === 1;

  return (
    <div className="flex flex-col items-start justify-center z-10 relative px-4">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm mb-6">
        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
        Now Accepting Cohort 4 Applications
      </div>

      <h1 className="text-5xl md:text-7xl lg:text-[96px] font-bold tracking-tight mb-8 leading-tight flex flex-col gap-3">
        <span>Built for those who</span>
        <div className="relative inline-block w-[240px] md:w-[360px] h-[1.2em] text-left">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={wordIndex}
              initial={{ filter: "blur(8px)", opacity: 0, y: 8 }}
              animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
              exit={{ filter: "blur(8px)", opacity: 0, y: -8 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="absolute left-0 top-0"
              style={{
                background: "linear-gradient(135deg, #6366f1, #a855f7, #ec4899)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {WORDS[wordIndex]}
            </motion.span>
          </AnimatePresence>
        </div>
      </h1>

      <div className="h-16 flex items-center mb-12">
        <p className="text-lg md:text-2xl text-[var(--text-muted)] font-mono max-w-3xl">
          {displayText}
          <span className="inline-block w-[2px] h-[1.1em] bg-[var(--accent-primary)] ml-1 align-middle animate-pulse" />
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start h-16">
        <AnimatePresence>
          {showButtons && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                <Button variant="primary" size="lg" withShimmer className="group">
                  Apply to Ecosystem
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <Button variant="outline" size="lg" className="group">
                  <Compass className="w-5 h-5 mr-2 group-hover:rotate-45 transition-transform" />
                  Explore Startups
                </Button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
