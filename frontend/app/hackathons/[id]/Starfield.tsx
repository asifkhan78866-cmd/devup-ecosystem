"use client";
import { useEffect, useState } from "react";

export function Starfield() {
  const [stars, setStars] = useState<{ id: number, x: number, y: number, r: number, delay: number }[]>([]);

  useEffect(() => {
    // Generate 50 random stars
    const newStars = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      r: Math.random() * 2 + 0.5,
      delay: Math.random() * 5
    }));
    setStars(newStars);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full bg-white animate-pulse"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.r}px`,
            height: `${s.r}px`,
            opacity: Math.random() * 0.5 + 0.1,
            animationDelay: `${s.delay}s`,
            animationDuration: `${Math.random() * 3 + 2}s`
          }}
        />
      ))}
    </div>
  );
}
