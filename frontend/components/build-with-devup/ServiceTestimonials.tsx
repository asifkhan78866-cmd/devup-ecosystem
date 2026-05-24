"use client";

const TESTIMONIALS = [
  {
    quote: "DevUp's engineering pod scaled our backend to 1M users in 3 months. Absolutely incredible execution speed.",
    author: "Sarah Jenkins",
    role: "CEO, FinTech Scale",
    company: "FinTech Scale",
  },
  {
    quote: "We were stuck trying to integrate a custom RAG pipeline for 6 months. DevUp came in and shipped it in 3 weeks.",
    author: "David Chen",
    role: "CTO, LegalAI",
    company: "LegalAI",
  },
  {
    quote: "Their design team didn't just give us a logo, they completely reimagined our user experience. Conversion is up 40%.",
    author: "Elena Rodriguez",
    role: "Founder, HealthSync",
    company: "HealthSync",
  },
  {
    quote: "The PR push they orchestrated got us featured in TechCrunch, leading directly to closing our seed round.",
    author: "Michael Ross",
    role: "Co-Founder, DataStream",
    company: "DataStream",
  },
];

export function ServiceTestimonials() {
  return (
    <section className="py-24 bg-black overflow-hidden border-t border-white/5">
      <div className="container mx-auto px-4 text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-white font-heading">
          Trusted by <span className="text-[var(--accent-primary)]">Founders</span>
        </h2>
      </div>

      <div className="relative flex w-full overflow-hidden group">
        <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-black to-transparent z-10" />
        <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-black to-transparent z-10" />

        <div className="flex w-max animate-infinite-scroll group-hover:[animation-play-state:paused]">
          {[...TESTIMONIALS, ...TESTIMONIALS].map((testimonial, idx) => (
            <div
              key={idx}
              className="w-[400px] flex-shrink-0 mx-4 bg-white/5 border border-white/10 rounded-2xl p-8"
            >
              <div className="text-[var(--accent-primary)] text-4xl font-serif mb-4">"</div>
              <p className="text-white/80 text-lg mb-6 leading-relaxed">
                {testimonial.quote}
              </p>
              <div className="flex items-center gap-4 mt-auto">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white font-bold">
                  {testimonial.author.charAt(0)}
                </div>
                <div>
                  <h4 className="text-white font-bold">{testimonial.author}</h4>
                  <p className="text-white/60 text-sm">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
