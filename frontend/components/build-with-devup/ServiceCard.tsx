"use client";

import { motion } from "framer-motion";
import { Service } from "@/data/services";
import { CardAnimation } from "./card-animations/CardAnimationIndex";
import * as Icons from "lucide-react";

interface ServiceCardProps {
  service: Service;
  onClick: () => void;
}

export function ServiceCard({ service, onClick }: ServiceCardProps) {
  const IconComponent = (Icons as any)[service.icon] || Icons.Box;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -5 }}
      onClick={onClick}
      className={`group relative flex flex-col rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all cursor-pointer overflow-hidden p-6 gap-6 ${service.size === "large" ? "md:col-span-2 lg:col-span-2 xl:col-span-2" : "col-span-1"
        }`}
    >
      {/* Background glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/0 group-hover:from-white/5 group-hover:to-transparent transition-all duration-500 z-0" />

      {/* Animation Slot (Top) */}
      <div className={`relative z-10 w-full rounded-2xl overflow-hidden ${service.size === "large" ? "h-64" : "h-48"}`}>
        <CardAnimation type={service.animationType} />
      </div>

      {/* Content (Bottom) */}
      <div className="relative z-10 flex flex-col gap-3 flex-grow">
        <div className="flex items-center gap-2 text-[var(--accent-primary)] mb-1">
          <IconComponent size={20} />
          <span className="text-xs font-semibold uppercase tracking-wider">{service.categoryLabel}</span>
        </div>
        <h3 className="text-2xl font-bold text-white group-hover:text-[var(--accent-primary)] transition-colors">
          {service.name}
        </h3>
        <p className="text-white/60 text-sm leading-relaxed">
          {service.short}
        </p>
      </div>

      {/* CTA Button */}
      <div className="relative z-10 mt-auto pt-4 flex items-center justify-between border-t border-white/5 group-hover:border-white/10">
        <span className="text-xs text-white/40 group-hover:text-white/60 transition-colors">
          Click to learn more
        </span>
        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[var(--accent-primary)] group-hover:text-black transition-colors">
          <Icons.ArrowRight size={16} />
        </div>
      </div>
    </motion.div>
  );
}
