"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function ServiceCTA() {
  return (
    <section className="relative py-32 bg-black overflow-hidden border-t border-white/10">
      {/* Background Gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[var(--accent-primary)]/20 rounded-[100%] blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-6xl font-bold text-white font-heading mb-6"
        >
          Ready to start building?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-xl text-white/60 max-w-2xl mx-auto mb-10"
        >
          Whether you need a full engineering team or just some legal advice, DevUp is here to help you scale.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
              // Alternatively, trigger a general contact form modal here
            }}
            className="px-8 py-4 rounded-xl bg-[var(--accent-primary)] text-black font-bold text-lg hover:bg-[var(--accent-primary)]/90 transition-colors shadow-[0_0_40px_rgba(0,229,255,0.3)] flex items-center gap-2"
          >
            Request a Consultation
            <ArrowRight size={20} />
          </button>

          <Link
            href="/ecosystem"
            className="px-8 py-4 rounded-xl bg-white/5 text-white font-bold text-lg hover:bg-white/10 border border-white/10 transition-colors"
          >
            Explore the Ecosystem
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
