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
      q: "What is DEVTHON?",
      a: "DEVTHON is Building Asia's Largest Innovation Hackathon, organized by DevUp Ecosystem. It is a national-level innovation platform that brings together developers, designers, entrepreneurs, startups, mentors, recruiters, investors, and innovators to compete across 36 innovation domains — spanning Artificial Intelligence, Cybersecurity, Blockchain, HealthTech, SpaceTech, ClimateTech, and more. DEVTHON goes beyond a traditional hackathon by offering startup incubation, internship and placement opportunities, and industry mentorship.",
    },
    {
      q: `When is ${name}?`,
      a: `${name} is scheduled from ${startDateStr} to ${endDateStr}. It is a 36-hour non-stop offline hackathon taking place at ${location}, ${city}, India.`,
    },
    {
      q: `Where is ${name} located?`,
      a: `${name} is an offline event held at ${location}, ${city}, Telangana, India. The venue is easily accessible from all parts of ${city} with ample parking, accommodation facilities, and public transport connectivity.`,
    },
    {
      q: `How do I register for ${name}?`,
      a: `Registration is open now. Click the "Register Now" button on this page to secure your spot. Registration closes on ${deadlineStr}. Teams of up to 4 members can participate. Both individual registrations and team registrations are accepted.`,
    },
    {
      q: `What is the prize pool for ${name}?`,
      a: `${name} offers a prize pool of ${hackathon.prizePool || "₹1,50,000+"} and above. Top performers also receive paid internship opportunities with monthly stipends ranging from ₹25,000 to ₹75,000, startup incubation support, and exclusive networking opportunities with industry leaders and investors.`,
    },
    {
      q: `What are the innovation domains in ${name}?`,
      a: "DEVTHON 2026 covers 36 innovation domains: Artificial Intelligence & Machine Learning, Generative AI, Cybersecurity & Ethical Hacking, Cloud Computing & DevOps, Web Development, Mobile App Development, Software Engineering, Data Science & Big Data Analytics, Internet of Things (IoT), Robotics & Automation, Drone Technology, Blockchain & Web3, HealthTech, AgriTech, FinTech, EdTech, Smart Cities, Transportation & Mobility, ClimateTech & Sustainability, Renewable Energy, Industry 4.0 & Smart Manufacturing, GovTech, SpaceTech, Defence Technology, AR/VR & Extended Reality, UI/UX & Product Design, Social Impact & Smart Communities, Startup Innovation & Entrepreneurship, Open Innovation, Quantum Computing, BioTech & Life Sciences, Supply Chain & Logistics, E-Commerce & Retail Technology, Digital Media & Content Technology, LegalTech & Compliance, and Smart Infrastructure & Construction Technology.",
    },
    {
      q: "How is DEVTHON different from other hackathons in India?",
      a: "DEVTHON is not just a coding competition — it is a complete innovation ecosystem. Unlike typical hackathons, DEVTHON offers 36 innovation domains (the widest in any Indian hackathon), startup incubation for winning teams, direct placement and internship opportunities with stipends up to ₹75,000/month, mentorship from startup founders and industry CTOs, investor introductions, and post-hackathon community support. It is designed to be Asia's largest innovation hackathon.",
    },
    {
      q: "What internship and placement opportunities are available at DEVTHON?",
      a: "Top performers at DEVTHON receive paid internship offers with monthly stipends ranging from ₹25,000 to ₹75,000. Companies and startups from the DevUp Ecosystem participate as recruiters, offering live placement drives during the event. Additionally, all participants gain access to the DevUp career network for ongoing opportunities.",
    },
    {
      q: "What startup incubation support does DEVTHON provide?",
      a: "Winning teams at DEVTHON are eligible for startup incubation through DevUp Ecosystem. This includes mentorship from experienced founders, access to investors and funding guidance, business development support, legal assistance, cloud computing credits, and a community of like-minded entrepreneurs to help scale their ideas into real startups.",
    },
    {
      q: `Is accommodation provided at ${name}?`,
      a: "Yes. Dedicated hostel facilities with separate arrangements for male and female participants are provided. Five full meals, 24/7 refreshment stations, 1 Gbps high-speed internet, on-site paramedic support, and round-the-clock security are all included at no extra cost.",
    },
    {
      q: "Who can participate in DEVTHON?",
      a: "Students from any college or university across India can participate. Developers, designers, and aspiring entrepreneurs at all skill levels are welcome — from complete beginners to experienced programmers. Teams can have up to 4 members, and cross-college teams are encouraged.",
    },
    {
      q: "Can beginners participate in DEVTHON?",
      a: "Absolutely! DEVTHON is designed to be inclusive for all skill levels. Beginners benefit from mentorship sessions, guided workshops, and the opportunity to work alongside experienced developers. The hackathon covers 36 diverse domains, so participants can choose tracks that align with their interests and skill level.",
    },
    {
      q: "Who organizes DEVTHON?",
      a: "DEVTHON is organized by DevUp Ecosystem, India's student-driven innovation and startup ecosystem. DevUp Ecosystem was co-founded by Syed Asif (CEO) and Faizan Mohammed (CTO) with the mission of empowering the next generation of innovators and entrepreneurs through hackathons, co-founder matching, mentorship, and startup incubation.",
    },
    {
      q: "How can I become a sponsor, mentor, or judge at DEVTHON?",
      a: "Companies, startups, and industry professionals interested in sponsoring, mentoring, or judging at DEVTHON can reach out through the DevUp Ecosystem website. Sponsors get branding visibility, access to top talent, and direct engagement with innovative student teams. Mentors and judges contribute their expertise and gain exposure to cutting-edge student innovations.",
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
        aria-labelledby="faq-heading"
      >
        <h2
          id="faq-heading"
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
