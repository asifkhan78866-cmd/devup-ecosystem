"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Service } from "@/data/services";
import * as Icons from "lucide-react";

interface ServiceDetailPanelProps {
  service: Service;
  onClose: () => void;
}

export function ServiceDetailPanel({ service, onClose }: ServiceDetailPanelProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    details: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("http://localhost:4000/api/services/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service.id,
          serviceName: service.name,
          ...formData,
        }),
      });

      if (response.ok) {
        setIsSuccess(true);
      } else {
        alert("Failed to submit request. Please try again.");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const IconComponent = (Icons as any)[service.icon] || Icons.Box;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
      />

      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", bounce: 0, duration: 0.5 }}
        className="fixed top-0 right-0 w-full md:w-[600px] h-full bg-[#0a0a0a] border-l border-white/10 shadow-2xl z-50 flex flex-col"
      >
        <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col gap-8 pb-32">

          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 text-[var(--accent-primary)] mb-4">
                <IconComponent size={24} />
                <span className="text-sm font-semibold uppercase tracking-wider">{service.categoryLabel}</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">{service.name}</h2>
              <p className="text-white/60 text-lg">{service.tagline}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
            >
              <Icons.X size={24} />
            </button>
          </div>

          <hr className="border-white/5" />

          {/* Why DevUp */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Icons.Zap size={20} className="text-[var(--accent-primary)]" />
              Why Choose DevUp?
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {service.whyDevUp.map((reason, idx) => (
                <div key={idx} className="bg-white/5 rounded-lg p-4 border border-white/5">
                  <h4 className="font-semibold text-white mb-1">{reason.title}</h4>
                  <p className="text-sm text-white/60">{reason.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* What's Included */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Icons.CheckCircle size={20} className="text-[var(--accent-primary)]" />
              What's Included
            </h3>
            <ul className="space-y-3">
              {service.whatsIncluded.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-white/80">
                  <Icons.Check size={18} className="text-green-500 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* How It Works */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Icons.GitBranch size={20} className="text-[var(--accent-primary)]" />
              How It Works
            </h3>
            <div className="space-y-6">
              {service.howItWorks.map((step) => (
                <div key={step.step} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] flex items-center justify-center font-bold text-sm">
                      {step.step}
                    </div>
                    {step.step !== service.howItWorks.length && (
                      <div className="w-px h-full bg-white/10 mt-2" />
                    )}
                  </div>
                  <div className="pb-2">
                    <h4 className="font-semibold text-white mb-1">{step.title}</h4>
                    <p className="text-sm text-white/60">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Logistics */}
          <div className="grid grid-cols-2 gap-4 bg-white/5 rounded-xl p-4 border border-white/10">
            <div>
              <span className="block text-xs text-white/40 mb-1 uppercase tracking-wider">Engagement</span>
              <span className="text-sm text-white font-medium">{service.engagementType}</span>
            </div>
            <div>
              <span className="block text-xs text-white/40 mb-1 uppercase tracking-wider">Timeline</span>
              <span className="text-sm text-white font-medium">{service.timeline}</span>
            </div>
          </div>

          <hr className="border-white/5" />

          {/* Form */}
          <div id="request-form" className="bg-[#111111] border border-white/10 rounded-2xl p-6 scroll-mt-24">
            <h3 className="text-xl font-semibold text-white mb-6">Request This Service</h3>

            {isSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icons.Check size={32} />
                </div>
                <h4 className="text-xl font-bold text-white mb-2">Request Received</h4>
                <p className="text-white/60 text-sm">
                  Our team will review your request and get back to you within 24 hours to schedule a kickoff call.
                </p>
                <button
                  onClick={onClose}
                  className="mt-6 px-6 py-2 bg-white text-black font-semibold rounded-lg hover:bg-white/90"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-white/60">Name</label>
                    <input
                      required
                      type="text"
                      className="bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[var(--accent-primary)]"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-white/60">Company / Startup</label>
                    <input
                      required
                      type="text"
                      className="bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[var(--accent-primary)]"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-white/60">Work Email</label>
                  <input
                    required
                    type="email"
                    className="bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[var(--accent-primary)]"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-white/60">Project Details / Goals</label>
                  <textarea
                    required
                    rows={4}
                    className="bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[var(--accent-primary)] resize-none"
                    placeholder="Tell us a bit about what you're trying to build..."
                    value={formData.details}
                    onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 bg-[var(--accent-primary)] text-black font-bold py-3 rounded-lg hover:bg-[var(--accent-primary)]/90 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </button>
              </form>
            )}
          </div>

        </div>

        {/* Sticky Footer CTA */}
        <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/95 to-transparent pt-12 pointer-events-none">
          <button
            onClick={() => document.getElementById("request-form")?.scrollIntoView({ behavior: "smooth" })}
            className="w-full bg-[var(--accent-primary)] text-black font-bold py-4 rounded-xl hover:bg-[var(--accent-primary)]/90 transition-colors shadow-[0_0_30px_rgba(0,229,255,0.2)] pointer-events-auto flex items-center justify-center gap-2"
          >
            <span>Request Service</span>
            <Icons.ArrowRight size={20} />
          </button>
        </div>
      </motion.div>
    </>
  );
}
