"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function HackathonFAQ({ hackathon }: { hackathon: any }) {
  const city = hackathon.city || "Hyderabad";
  let location = hackathon.location || "Vidya Jyothi Institute Of Technology(VJIT)";
  if (location === "Hyderabad,India" || location === "Hyderabad, India") {
    location = "Vidya Jyothi Institute Of Technology(VJIT)";
  }
  const startDateStr = hackathon.startDate
    ? new Date(hackathon.startDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "TBD";
  const endDateStr = hackathon.endDate
    ? new Date(hackathon.endDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "TBD";
  const deadlineStr = hackathon.registrationDeadline
    ? new Date(hackathon.registrationDeadline).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "TBD";

  const name = hackathon.title || hackathon.name || "this hackathon";

  const faqs = [
    {
      q: `When is ${name}?`,
      a: `${name} is scheduled from ${startDateStr} to ${endDateStr}. It is a 36-hour non-stop hackathon taking place at ${location}.`,
    },
    {
      q: `Where is ${name} located?`,
      a: `${name} is an offline event held at ${location}, ${city}, Telangana, India. It is easily accessible from all parts of ${city}.`,
    },
    {
      q: `How do I register for ${name}?`,
      a: `Registration is free. Click the "Register Now" button on this page to secure your spot. Registration closes on ${deadlineStr}. Teams of up to 4 members can participate.`,
    },
    {
      q: `What is the prize pool for ${name}?`,
      a: `${name} offers a prize pool of ${hackathon.prizePool || "₹1,00,000+"} and above. Top performers also receive paid internship opportunities with monthly stipends ranging from ₹25,000 to ₹75,000.`,
    },
    {
      q: `What are the domains or tracks in ${name}?`,
      a: `The hackathon covers 5 technical domains: AI & Machine Learning (Generative AI & Predictive Analytics), Cybersecurity & Blockchain, Web & Mobile Development, Cloud & IoT, and Social Impact technology.`,
    },
    {
      q: `Is accommodation provided at ${name}?`,
      a: `Yes. Dedicated hostel facilities with separate arrangements for male and female participants are provided. Five full meals, 24/7 refreshment stations, 1 Gbps high-speed internet, and on-site paramedic support are all included.`,
    },
    {
      q: "Who can participate in this hackathon?",
      a: "Students from any college or university across India can participate. Developers, designers, and aspiring entrepreneurs are all welcome. The hackathon is open to both beginners and experienced participants.",
    },
    {
      q: "What makes DevUp Ecosystem hackathons different from others?",
      a: "DevUp Ecosystem hackathons are part of a wider startup ecosystem that includes co-founder matching, mentorship, funding guidance, and career opportunities. Winning teams can receive incubation support, investor introductions, and community resources beyond just the prize money.",
    },
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <section
        className="max-w-[800px] mx-auto mt-16 px-4 md:px-8 pb-20"
      >
        <h2
          style={{
            fontFamily: "var(--font-syne), sans-serif",
            fontSize: 28,
            fontWeight: 800,
            color: "#ffffff",
            marginBottom: 32,
          }}
        >
          Frequently Asked Questions
        </h2>
        <div className="space-y-0">
          {faqs.map((faq, i) => (
            <FAQItem key={i} question={faq.q} answer={faq.a} />
          ))}
        </div>
      </section>
    </>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="border-b border-white/[0.07] pb-5 mb-5 cursor-pointer"
      onClick={() => setOpen(!open)}
    >
      <div
        className="flex items-center justify-between"
        style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontSize: 17,
          fontWeight: 700,
          color: "#ffffff",
          paddingBottom: 4,
        }}
      >
        <span>{question}</span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ color: "#c8f135", fontSize: 22, flexShrink: 0, marginLeft: 16 }}
        >
          +
        </motion.span>
      </div>
      <AnimatePresence>
        {open && (
          <motion.p
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: 15,
              color: "#a1a1a1",
              lineHeight: 1.7,
              marginTop: 8,
              overflow: "hidden",
            }}
          >
            {answer}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
