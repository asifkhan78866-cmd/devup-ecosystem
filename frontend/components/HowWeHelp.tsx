"use client";

import { motion, Variants } from "framer-motion";
import { ShieldCheck, Trophy, Globe, FileText, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function HowWeHelp() {
  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <section className="py-24 px-4 relative z-10">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="text-center mb-16"
        >
          <motion.h2 variants={item} className="text-4xl md:text-5xl font-bold mb-4">
            How We Help
          </motion.h2>
          <motion.p variants={item} className="text-xl text-[var(--text-muted)] max-w-2xl mx-auto">
            Everything you need to go from an idea in your dorm room to a venture-backed startup.
          </motion.p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {/* 1. Legal Onboarding - 2col */}
          <motion.div variants={item} className="lg:col-span-2">
            <Card className="h-full flex flex-col justify-between overflow-hidden group relative min-h-[300px]">
              <div className="relative z-10">
                <ShieldCheck className="w-10 h-10 text-[var(--accent-primary)] mb-4" />
                <h3 className="text-2xl font-bold mb-2">Legal Onboarding</h3>
                <p className="text-[var(--text-muted)] max-w-sm">
                  We handle your paperwork. NDAs, equity agreements, partnership terms — all digital.
                </p>
              </div>
              <div className="absolute right-0 bottom-0 w-1/2 h-full flex items-end justify-end p-6 pointer-events-none">
                <div className="relative w-40 h-48 bg-white/5 border border-white/10 rounded-xl p-4 shadow-2xl transform translate-x-10 translate-y-10 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-500">
                  <div className="w-full h-2 bg-white/20 rounded mb-3"></div>
                  <div className="w-3/4 h-2 bg-white/20 rounded mb-3"></div>
                  <div className="w-full h-2 bg-white/20 rounded mb-3"></div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 delay-200">
                    <CheckCircle className="w-16 h-16 text-green-500 bg-black/50 rounded-full" />
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* 2. Co-Founder Matching - 1col */}
          <motion.div variants={item}>
            <Card className="h-full group min-h-[300px] flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">Co-Founder Matching</h3>
                <p className="text-[var(--text-muted)]">Find your person. Build together.</p>
              </div>
              <div className="relative h-32 flex items-center justify-center mt-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 absolute -translate-x-6 group-hover:-translate-x-12 transition-transform duration-500 z-10 border-2 border-black" />
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 absolute translate-x-6 group-hover:translate-x-12 transition-transform duration-500 border-2 border-black" />
              </div>
            </Card>
          </motion.div>

          {/* 3. Funding Access - 1col */}
          <motion.div variants={item}>
            <Card className="h-full group min-h-[300px] flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">Funding Access</h3>
                <p className="text-[var(--text-muted)]">Direct line to angel investors and VCs.</p>
              </div>
              <div className="h-32 flex items-end justify-center gap-3 mt-6">
                <div className="w-8 bg-indigo-500/50 rounded-t-md h-[30%] group-hover:h-[60%] transition-all duration-500" />
                <div className="w-8 bg-indigo-400/70 rounded-t-md h-[50%] group-hover:h-[80%] transition-all duration-500 delay-75" />
                <div className="w-8 bg-indigo-500 rounded-t-md h-[70%] group-hover:h-[100%] transition-all duration-500 delay-150" />
              </div>
            </Card>
          </motion.div>

          {/* 4. Talent Pipeline - 2col */}
          <motion.div variants={item} className="lg:col-span-2">
            <Card className="h-full group relative overflow-hidden min-h-[300px]">
              <div className="relative z-10 w-full lg:w-1/2">
                <h3 className="text-2xl font-bold mb-2">Talent Pipeline</h3>
                <p className="text-[var(--text-muted)]">
                  Students find you. You find builders. Top tier engineering, design, and product talent.
                </p>
              </div>
              <div className="absolute right-0 top-0 w-1/2 h-full flex flex-col gap-3 p-6 justify-center pointer-events-none">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 flex items-center gap-3 transform translate-x-[120%] group-hover:translate-x-0 transition-transform duration-500"
                    style={{ transitionDelay: `${i * 100}ms` }}
                  >
                    <div className="w-8 h-8 rounded-full bg-white/20 shrink-0" />
                    <div className="space-y-2 w-full">
                      <div className="h-2 bg-white/20 rounded w-1/2" />
                      <div className="h-2 bg-white/10 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* 5. Hackathons - 1col */}
          <motion.div variants={item}>
            <Card className="h-full group min-h-[300px] flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">Hackathons</h3>
                <p className="text-[var(--text-muted)]">Run or join ecosystem hackathons.</p>
              </div>
              <div className="h-32 flex items-center justify-center mt-6 perspective-1000">
                <Trophy className="w-20 h-20 text-yellow-500 group-hover:rotate-y-360 transition-transform duration-700 ease-in-out" style={{ transformStyle: 'preserve-3d' }} />
              </div>
            </Card>
          </motion.div>

          {/* 6. Global Network - 1col */}
          <motion.div variants={item}>
            <Card className="h-full group min-h-[300px] flex flex-col justify-between overflow-hidden relative">
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2">Global Network</h3>
                <p className="text-[var(--text-muted)]">Connect beyond borders.</p>
              </div>
              <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full border border-white/10 flex items-center justify-center animate-[spin_10s_linear_infinite] group-hover:animate-[spin_4s_linear_infinite]">
                <div className="w-full h-full rounded-full border border-white/5 absolute rotate-45" />
                <div className="w-full h-full rounded-full border border-white/5 absolute -rotate-45" />
                <Globe className="w-16 h-16 text-[var(--accent-secondary)]" />
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
