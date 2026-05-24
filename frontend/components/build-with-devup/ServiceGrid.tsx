"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { services } from "@/data/services";
import { ServiceCard } from "./ServiceCard";
import { ServiceFilterTabs, Category } from "./ServiceFilterTabs";
import { ServiceDetailPanel } from "./ServiceDetailPanel";

export function ServiceGrid() {
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  const filteredServices = services.filter(
    (service) => activeCategory === "all" || service.category === activeCategory
  );

  const selectedService = services.find((s) => s.id === selectedServiceId);

  return (
    <section id="services-grid" className="relative w-full min-h-screen bg-black py-12">
      <ServiceFilterTabs activeCategory={activeCategory} onChange={setActiveCategory} />

      <div className="container mx-auto px-4">
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-[auto]"
        >
          <AnimatePresence mode="popLayout">
            {filteredServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onClick={() => setSelectedServiceId(service.id)}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredServices.length === 0 && (
          <div className="w-full py-20 text-center text-white/40">
            No services found in this category.
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedService && (
          <ServiceDetailPanel
            service={selectedService}
            onClose={() => setSelectedServiceId(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
