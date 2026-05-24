"use client";

import { useRef, useLayoutEffect } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowRight, Box, Cpu, Zap, Activity } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

gsap.registerPlugin(ScrollTrigger);

const STARTUPS = [
  {
    id: 1,
    name: "NexusAI",
    pitch: "Next-gen LLM orchestration for enterprise.",
    stage: "Seed",
    icon: Cpu,
    color: "from-blue-500 to-cyan-400"
  },
  {
    id: 2,
    name: "VoltSpace",
    pitch: "Decentralized energy trading protocol.",
    stage: "Series A",
    icon: Zap,
    color: "from-amber-400 to-orange-500"
  },
  {
    id: 3,
    name: "Synth",
    pitch: "Generative audio synthesis engine.",
    stage: "Pre-seed",
    icon: Activity,
    color: "from-purple-500 to-pink-500"
  },
  {
    id: 4,
    name: "BlockChainX",
    pitch: "Zero-knowledge proof infrastructure.",
    stage: "Seed",
    icon: Box,
    color: "from-emerald-400 to-green-600"
  },
  {
    id: 5,
    name: "AeroDynamics",
    pitch: "Drone fleet management software.",
    stage: "Series A",
    icon: RocketIcon, // Assuming RocketIcon as fallback if needed, but we'll use a generic one or map it
    color: "from-indigo-500 to-blue-600"
  }
];

// Fallback icon for 5
function RocketIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" /></svg>
  );
}

export default function StartupShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(() => {
    if (!scrollWrapperRef.current || !containerRef.current) return;

    const cards = gsap.utils.toArray(cardsRef.current);
    const scrollWidth = scrollWrapperRef.current.scrollWidth;
    const viewportWidth = window.innerWidth;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        pin: true,
        scrub: 1,
        start: "top top",
        end: () => `+=${scrollWidth - viewportWidth}`,
        invalidateOnRefresh: true,
      }
    });

    tl.to(scrollWrapperRef.current, {
      x: () => -(scrollWidth - viewportWidth),
      ease: "none"
    });

    // Animate cards on enter
    cards.forEach((card: any) => {
      gsap.fromTo(card,
        { scale: 0.8, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          scrollTrigger: {
            trigger: card,
            containerAnimation: tl,
            start: "left center+=200",
            toggleActions: "play none none reverse"
          }
        }
      );
    });
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="h-screen bg-black overflow-hidden flex flex-col justify-center relative z-10 py-12">
      <div className="absolute top-12 left-0 w-full px-8 md:px-24">
        <h2 className="text-4xl md:text-6xl font-bold mb-4 relative inline-block">
          Meet Our Ecosystem
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="absolute -bottom-2 left-0 w-full h-1 bg-[var(--accent-primary)] origin-left"
          />
        </h2>
        <p className="text-[var(--text-muted)] text-xl">
          The next generation of unicorns, building from dorm rooms to boardrooms.
        </p>
      </div>

      <div ref={scrollWrapperRef} className="flex gap-8 px-8 md:px-24 mt-32 w-max items-center h-[520px]">
        {STARTUPS.map((startup, index) => (
          <div
            key={startup.id}
            ref={(el) => { cardsRef.current[index] = el; }}
            className="w-[340px] md:w-[380px] h-[480px] shrink-0"
          >
            <Card className="w-full h-full flex flex-col relative group overflow-hidden border-white/10 hover:border-white/20 transition-colors">
              {/* Decorative top gradient */}
              <div className={`absolute top-0 left-0 w-full h-32 bg-gradient-to-br ${startup.color} opacity-20 group-hover:opacity-30 transition-opacity`} />

              <div className="relative z-10 flex-1 flex flex-col">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${startup.color} flex items-center justify-center shadow-lg mb-8 group-hover:scale-110 transition-transform`}>
                  <startup.icon className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-3xl font-bold mb-2">{startup.name}</h3>
                <p className="text-[var(--text-muted)] text-lg mb-6 flex-1">
                  {startup.pitch}
                </p>

                <div className="mb-8">
                  <Badge variant="secondary">{startup.stage}</Badge>
                </div>

                <Button variant="ghost" className="w-full justify-between group/btn border border-white/5 hover:border-white/10">
                  View Profile
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>
            </Card>
          </div>
        ))}
        {/* Empty space at the end to allow the last card to scroll to the center */}
        <div className="w-[10vw] shrink-0" />
      </div>
    </section>
  );
}
