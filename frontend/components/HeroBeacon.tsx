"use client";

import { motion } from "framer-motion";

export default function HeroBeacon() {
  const rings = [
    { radius: 180, delay: 0 },
    { radius: 320, delay: 0.8 },
    { radius: 480, delay: 1.6 },
    { radius: 640, delay: 2.4 },
    { radius: 800, delay: 3.2 },
  ];

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex justify-center">
      {/* Layer 4: Radial gradient base */}
      <div 
        className="absolute inset-0" 
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(30, 30, 50, 0.8) 0%, transparent 70%)"
        }}
      />
      
      {/* Layer 1: The Beacon Cone */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[70vh]"
        style={{
          background: "radial-gradient(100% 100% at 50% 0%, rgba(200,241,53,0.07) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      
      {/* Layer 2 & 3 Container: Centered at 50%, 45% */}
      <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 flex items-center justify-center">
        
        {/* Layer 2: Concentric Rings */}
        {rings.map((ring, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-white"
            style={{
              width: ring.radius * 2,
              height: ring.radius * 2,
              opacity: 0.04,
            }}
            animate={{
              opacity: [0.04, 0.08, 0.04],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: ring.delay,
            }}
          />
        ))}

        {/* Layer 3: The Center Dot */}
        <motion.div
          className="absolute w-[6px] h-[6px] rounded-full"
          style={{
            backgroundColor: "var(--accent)",
            boxShadow: "0 0 20px rgba(200,241,53,0.6), 0 0 60px rgba(200,241,53,0.2)",
          }}
          animate={{
            opacity: [0.6, 1.0, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
    </div>
  );
}
