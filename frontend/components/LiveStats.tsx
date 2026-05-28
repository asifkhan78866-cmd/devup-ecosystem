"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";

function CountUp({ end, duration = 2 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    let animationFrame: number;

    const easeOutExpo = (t: number) => {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    };

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = (timestamp - startTime) / (duration * 1000);

      if (progress < 1) {
        setCount(Math.floor(end * easeOutExpo(progress)));
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, isInView]);

  return <span ref={ref}>{count}</span>;
}

export default function LiveStats() {
  const stats = [
    { value: 23, prefix: "", suffix: "+", label: "Active Startups" },
    { value: 4, prefix: "₹", suffix: "Cr+", label: "Funding Unlocked" },
    { value: 1200, prefix: "", suffix: "+", label: "Student Builders" },
    { value: 48, prefix: "", suffix: "hr", label: "Average Response" },
  ];

  return (
    <section 
      className="w-full flex justify-center items-center overflow-hidden relative"
      style={{
        padding: "100px 0",
        background: "var(--bg-base)"
      }}
    >
      <div className="max-w-[1200px] w-full mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 relative">
          
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center justify-center text-center relative py-8 md:py-0"
              style={{
                // Add vertical lines between columns for desktop
                borderRight: index < stats.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none"
              }}
            >
              <div className="flex items-baseline mb-2">
                {stat.prefix && (
                  <span 
                    style={{
                      fontFamily: "var(--font-syne), sans-serif",
                      fontSize: "32px",
                      fontWeight: 400,
                      color: "#ffffff"
                    }}
                  >
                    {stat.prefix}
                  </span>
                )}
                <span
                  style={{
                    fontFamily: "var(--font-syne), sans-serif",
                    fontSize: "clamp(48px, 5vw, 64px)",
                    fontWeight: 800,
                    color: "#ffffff",
                    lineHeight: 1
                  }}
                >
                  <CountUp end={stat.value} duration={2} />
                </span>
                {stat.suffix && (
                  <span 
                    style={{
                      fontFamily: "var(--font-syne), sans-serif",
                      fontSize: "32px",
                      fontWeight: 400,
                      color: "#c8f135",
                      marginLeft: "2px"
                    }}
                  >
                    {stat.suffix}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: "14px",
                  color: "#6b6b6b",
                  maxWidth: "140px",
                  lineHeight: 1.4
                }}
              >
                {stat.label}
              </span>
              
              {/* Fix border logic for mobile (2x2 grid) */}
              <style jsx>{`
                @media (max-width: 768px) {
                  div {
                    border-right: ${index % 2 === 0 ? "1px solid rgba(255,255,255,0.08)" : "none"} !important;
                    border-bottom: ${index < 2 ? "1px solid rgba(255,255,255,0.08)" : "none"};
                  }
                }
              `}</style>
            </motion.div>
          ))}

        </div>
      </div>
    </section>
  );
}
