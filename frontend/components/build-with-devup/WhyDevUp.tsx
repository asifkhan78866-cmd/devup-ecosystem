"use client";

import { motion } from "framer-motion";
import { Check, X, Building, User, Code2 } from "lucide-react";

export function WhyDevUp() {
  return (
    <section className="py-24 bg-black relative border-t border-white/10">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold font-heading text-white mb-4">
            Why partner with <span className="text-[var(--accent-primary)]">DevUp?</span>
          </h2>
          <p className="text-white/60 text-lg">
            Stop juggling six different freelancers and three expensive agencies.
            We provide everything under one cohesive ecosystem designed for startups.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Traditional Agency */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col gap-6 opacity-60"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500/20 text-red-500 rounded-xl">
                <Building size={24} />
              </div>
              <h3 className="text-xl font-bold text-white">Traditional Agency</h3>
            </div>
            <ul className="space-y-4">
              <li className="flex gap-3 text-white/70">
                <X className="text-red-500 shrink-0" /> Very high upfront costs
              </li>
              <li className="flex gap-3 text-white/70">
                <X className="text-red-500 shrink-0" /> Slow corporate processes
              </li>
              <li className="flex gap-3 text-white/70">
                <X className="text-red-500 shrink-0" /> Handed off to junior devs
              </li>
              <li className="flex gap-3 text-white/70">
                <X className="text-red-500 shrink-0" /> They don't understand startups
              </li>
            </ul>
          </motion.div>

          {/* DevUp Ecosystem */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gradient-to-b from-white/10 to-transparent border-2 border-[var(--accent-primary)]/50 rounded-2xl p-8 flex flex-col gap-6 relative"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--accent-primary)] text-black px-4 py-1 text-xs font-bold uppercase rounded-full">
              The DevUp Way
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] rounded-xl">
                <Code2 size={24} />
              </div>
              <h3 className="text-xl font-bold text-white">DevUp Ecosystem</h3>
            </div>
            <ul className="space-y-4">
              <li className="flex gap-3 text-white">
                <Check className="text-[var(--accent-primary)] shrink-0" /> Startup-friendly pricing & equity options
              </li>
              <li className="flex gap-3 text-white">
                <Check className="text-[var(--accent-primary)] shrink-0" /> Agile sprints & rapid iteration
              </li>
              <li className="flex gap-3 text-white">
                <Check className="text-[var(--accent-primary)] shrink-0" /> Built by serial founders for founders
              </li>
              <li className="flex gap-3 text-white">
                <Check className="text-[var(--accent-primary)] shrink-0" /> Integrated ecosystem (Tech, Legal, Marketing)
              </li>
            </ul>
          </motion.div>

          {/* Freelancers */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col gap-6 opacity-60"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500/20 text-red-500 rounded-xl">
                <User size={24} />
              </div>
              <h3 className="text-xl font-bold text-white">Solo Freelancers</h3>
            </div>
            <ul className="space-y-4">
              <li className="flex gap-3 text-white/70">
                <X className="text-red-500 shrink-0" /> Unreliable availability
              </li>
              <li className="flex gap-3 text-white/70">
                <X className="text-red-500 shrink-0" /> Single domain expertise only
              </li>
              <li className="flex gap-3 text-white/70">
                <X className="text-red-500 shrink-0" /> Communication overhead
              </li>
              <li className="flex gap-3 text-white/70">
                <X className="text-red-500 shrink-0" /> Quality varies wildly
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
