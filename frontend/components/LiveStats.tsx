"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, animate } from "framer-motion";
import { Rocket, IndianRupee, Users, Code, MapPin, GraduationCap } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface StatItemProps {
  icon: React.ComponentType<any>;
  value: number;
  suffix: string;
  prefix?: string;
  label: string;
  delay: number;
}

function StatItem({ icon: Icon, value, suffix, prefix = "", label, delay }: StatItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isInView) {
      const controls = animate(0, value, {
        duration: 2,
        ease: "easeOut",
        onUpdate: (v) => setDisplayValue(Math.floor(v)),
      });
      return controls.stop;
    }
  }, [isInView, value]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -20 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      <Card className="flex flex-col items-center text-center group h-full">
        <div className="w-12 h-12 rounded-full bg-[rgba(99,102,241,0.1)] text-[var(--accent-primary)] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="text-3xl md:text-4xl font-mono font-bold mb-2">
          {prefix}{displayValue}{suffix}
        </h3>
        <p className="text-[var(--text-muted)] font-medium text-sm md:text-base">
          {label}
        </p>
      </Card>
    </motion.div>
  );
}

export default function LiveStats() {
  const stats = [
    { icon: Rocket, value: 23, suffix: "+", label: "Startups in Ecosystem" },
    { icon: IndianRupee, value: 4, suffix: "Cr+", label: "Funding Unlocked" },
    { icon: Users, value: 1200, suffix: "+", label: "Student Builders" },
    { icon: Code, value: 38, suffix: "+", label: "Projects Shipped" },
    { icon: MapPin, value: 6, suffix: "", label: "Cities Represented" },
    { icon: GraduationCap, value: 3, suffix: "", label: "Cohorts Completed" },
  ];

  return (
    <section className="py-24 px-4 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          {stats.map((stat, index) => (
            <StatItem
              key={index}
              {...stat}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
