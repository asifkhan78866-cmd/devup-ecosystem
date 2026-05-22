"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import FloatingSymbols from "@/components/FloatingSymbols";
import HeroTypography from "@/components/HeroTypography";
import LiveStats from "@/components/LiveStats";
import HowWeHelp from "@/components/HowWeHelp";
import StartupShowcase from "@/components/StartupShowcase";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowRight, ChevronDown } from "lucide-react";

const EcosystemGlobe = dynamic(
  () => import("@/components/EcosystemGlobe"),
  {
    ssr: false,
    loading: () => (
      <div className="w-[400px] h-[400px] rounded-full 
        bg-indigo-500/5 border border-indigo-500/10 
        animate-pulse flex items-center justify-center max-w-full">
        <div className="w-32 h-32 rounded-full bg-indigo-500/10 animate-ping" />
      </div>
    ),
  }
);

function ScrollIndicator() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY < 100);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 transition-opacity duration-500"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <span className="text-zinc-500 text-xs tracking-widest uppercase">
        Scroll to explore
      </span>
      <ChevronDown className="w-5 h-5 text-zinc-500 animate-bounce" />
    </div>
  );
}

export default function Home() {
  return (
    <>
      <FloatingSymbols opacity={1} />

      {/* Background depth blobs */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "800px",
          height: "600px",
          background:
            "radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
          zIndex: 1,
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "10%",
          right: "0",
          width: "600px",
          height: "400px",
          background:
            "radial-gradient(ellipse, rgba(168,85,247,0.06) 0%, transparent 70%)",
          filter: "blur(40px)",
          zIndex: 1,
        }}
      />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 pb-12 overflow-hidden z-10">
        <div className="max-w-7xl mx-auto w-full px-4 md:px-6 flex flex-col lg:flex-row items-center gap-12">
          {/* Left side — 60% */}
          <div className="w-full lg:w-[60%]">
            <HeroTypography />
          </div>
          {/* Right side — 40% */}
          <div className="w-full lg:w-[40%] flex items-center justify-center">
            <EcosystemGlobe />
          </div>
        </div>
        <ScrollIndicator />
      </section>

      {/* Live Stats Section */}
      <div className="relative z-10">
        <LiveStats />
      </div>

      {/* How We Help Section */}
      <div className="relative z-10">
        <HowWeHelp />
      </div>

      {/* Startup Showcase Section */}
      <div className="relative z-10">
        <StartupShowcase />
      </div>

      {/* Testimonials Section */}
      <section className="py-24 px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              What Founders Say
            </h2>
            <p className="text-[var(--text-muted)] text-xl max-w-2xl mx-auto">
              Don't just take our word for it.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="h-full flex flex-col justify-between">
              <p className="text-lg mb-6 leading-relaxed">
                "The DevUp ecosystem gave us the exact environment we needed to
                turn our side project into a fully funded startup. The legal
                onboarding alone saved us weeks of headaches."
              </p>
              <div className="flex items-center gap-4 mt-auto">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
                <div>
                  <h4 className="font-bold">Rahul Sharma</h4>
                  <p className="text-sm text-[var(--text-muted)]">
                    Co-founder, NexusAI
                  </p>
                </div>
              </div>
            </Card>

            <Card className="h-full flex flex-col justify-between">
              <p className="text-lg mb-6 leading-relaxed">
                "I found my co-founder through the DevUp matching program. Two
                months later, we raised our pre-seed round directly from a VC in
                the network."
              </p>
              <div className="flex items-center gap-4 mt-auto">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500" />
                <div>
                  <h4 className="font-bold">Priya Patel</h4>
                  <p className="text-sm text-[var(--text-muted)]">
                    CEO, VoltSpace
                  </p>
                </div>
              </div>
            </Card>

            <Card className="h-full flex flex-col justify-between">
              <p className="text-lg mb-6 leading-relaxed">
                "The hackathons here aren't just for building toys. They are
                structured to build actual MVPs. The energy and talent density is
                unmatched."
              </p>
              <div className="flex items-center gap-4 mt-auto">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-pink-500" />
                <div>
                  <h4 className="font-bold">Arjun Reddy</h4>
                  <p className="text-sm text-[var(--text-muted)]">
                    Founder, Synth
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Ready to Build CTA */}
      <section className="relative py-32 px-4 z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] opacity-90" />
        <div className="absolute inset-0 bg-noise opacity-30 mix-blend-overlay" />

        <div className="max-w-4xl mx-auto text-center relative z-20">
          <h2 className="text-5xl md:text-7xl font-bold text-white mb-8">
            Ready to Build?
          </h2>
          <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-2xl mx-auto">
            Join the ecosystem today and accelerate your startup journey from
            dorm room to boardroom.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="primary"
              size="lg"
              className="bg-white text-black hover:bg-white/90 shadow-xl group"
            >
              Apply to DevUp
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/30 hover:bg-white/10 text-white"
            >
              View Startups
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
