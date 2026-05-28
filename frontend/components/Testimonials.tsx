"use client";

import { motion } from "framer-motion";

const TESTIMONIALS = [
  {
    quote: "The DevUp ecosystem gave us the exact environment we needed to turn our side project into a fully funded startup. The legal onboarding alone saved us weeks of headaches.",
    name: "Rahul Sharma",
    role: "Co-founder, NexusAI",
    service: "via AI & Compute",
    seed: "Rahul",
  },
  {
    quote: "I found my co-founder through the DevUp matching program. Two months later, we raised our pre-seed round directly from a VC in the network.",
    name: "Priya Patel",
    role: "CEO, VoltSpace",
    service: "via Mentor Network",
    seed: "Priya",
  },
  {
    quote: "The hackathons here aren't just for building toys. They are structured to build actual MVPs. The energy and talent density is unmatched.",
    name: "Arjun Reddy",
    role: "Founder, Synth",
    service: "via Ecosystem Events",
    seed: "Arjun",
  },
  {
    quote: "We were struggling with our brand identity for months. The DevUp design network helped us lock it down in two weeks. Incredible support system.",
    name: "Sneha Rao",
    role: "CMO, AeroDynamics",
    service: "via Brand & Design",
    seed: "Sneha",
  },
  {
    quote: "Having access to H100s when you're just starting out is a game-changer. It allowed us to train our models without worrying about massive cloud bills.",
    name: "Vikram Singh",
    role: "CTO, DeepFlow",
    service: "via AI & Compute",
    seed: "Vikram",
  },
  {
    quote: "The growth marketing mentors completely overhauled our GTM strategy. We saw a 3x increase in waitlist signups in the first month.",
    name: "Ananya Desai",
    role: "Founder, FinEdge",
    service: "via Growth Marketing",
    seed: "Ananya",
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 px-6 max-w-[1200px] mx-auto w-full relative z-10">
      <div className="mb-16">
        <span 
          style={{
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#6b6b6b"
          }}
        >
          FOUNDER STORIES
        </span>
        <h2 
          className="mt-4 whitespace-pre-line"
          style={{
            fontFamily: "var(--font-syne), sans-serif",
            fontSize: "clamp(32px, 4vw, 52px)",
            fontWeight: 700,
            letterSpacing: "-0.025em",
            lineHeight: 1.1,
            color: "#ffffff"
          }}
        >
          {"Built different.\nBy real founders."}
        </h2>
      </div>

      <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
        {TESTIMONIALS.map((testimonial, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: (index % 3) * 0.15, ease: [0.16, 1, 0.3, 1] }}
            style={{
              background: "#111111",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "14px",
              padding: "24px",
              breakInside: "avoid",
              marginBottom: "16px",
            }}
          >
            <div 
              style={{
                fontFamily: "var(--font-syne), sans-serif",
                fontSize: "64px",
                color: "#c8f135",
                opacity: 0.4,
                lineHeight: 0,
                marginTop: "20px",
                marginBottom: "20px"
              }}
            >
              "
            </div>
            <p
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: "15px",
                color: "#e4e4e4",
                lineHeight: 1.65,
                fontStyle: "italic",
                marginBottom: "24px"
              }}
            >
              {testimonial.quote}
            </p>
            
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <img 
                  src={`https://api.dicebear.com/7.x/notionists/svg?seed=${testimonial.seed}&backgroundColor=c8f135`}
                  className="w-9 h-9 rounded-full bg-[#1a1a1a]"
                  alt={testimonial.name}
                />
                <div className="flex flex-col">
                  <span 
                    style={{
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#ffffff"
                    }}
                  >
                    {testimonial.name}
                  </span>
                  <span 
                    style={{
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: "12px",
                      color: "#6b6b6b"
                    }}
                  >
                    {testimonial.role}
                  </span>
                </div>
              </div>
              <span 
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: "11px",
                  color: "#c8f135"
                }}
              >
                {testimonial.service}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
