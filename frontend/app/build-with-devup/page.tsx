import type { Metadata } from "next";
import { ServiceHero } from "@/components/build-with-devup/ServiceHero";
import { ServiceGrid } from "@/components/build-with-devup/ServiceGrid";
import { WhyDevUp } from "@/components/build-with-devup/WhyDevUp";
import { ServiceTestimonials } from "@/components/build-with-devup/ServiceTestimonials";
import { ServiceCTA } from "@/components/build-with-devup/ServiceCTA";

export const metadata: Metadata = {
  title: "Build With DevUp | Services Marketplace",
  description: "Everything your startup needs. Under one ecosystem.",
};

import { ServiceOrbitWrapper } from "@/components/build-with-devup/ServiceOrbitWrapper";

export default function BuildWithDevUpPage() {
  return (
    <main className="min-h-screen bg-black w-full overflow-x-hidden">
      <ServiceHero />

      {/* 3D Orbit section placed right after hero before grid */}
      <section className="py-12 bg-black relative border-t border-white/5">
        <div className="container mx-auto px-4 text-center mb-8">
          <h2 className="text-3xl md:text-5xl font-bold font-heading text-white">
            The DevUp <span className="text-gradient">Orbit</span>
          </h2>
          <p className="text-white/60 mt-4 max-w-2xl mx-auto">
            A fully integrated ecosystem designed to surround your startup with everything it needs to reach escape velocity.
          </p>
        </div>
        <ServiceOrbitWrapper />
      </section>

      <ServiceGrid />
      <WhyDevUp />
      <ServiceTestimonials />
      <ServiceCTA />
    </main>
  );
}
