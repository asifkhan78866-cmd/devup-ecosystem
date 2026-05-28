
"use client";

import { useEffect, useRef, useState } from "react";

const SYMBOLS = [
  "$", "€", "↗", "→", "∞", "+", "×", "%", "#",
  "@", "&", "01", "{}", "//", "<>", "=>", "::",
  "△", "○", "□", "◇", "✦"
];

const SYMBOL_COUNT = 55;

interface SymbolProps {
  x: number;
  y: number;
  symbol: string;
  size: number;
  opacity: number;
  speedY: number;
  speedX: number;
}

export default function FloatingSymbols() {
  const [symbols, setSymbols] = useState<SymbolProps[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);

  // Initialize symbols
  useEffect(() => {
    if (typeof window === "undefined") return;

    const initialSymbols: SymbolProps[] = Array.from({ length: SYMBOL_COUNT }).map(() => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      size: 9 + Math.random() * 4, // 9px to 13px
      opacity: 0.035 + Math.random() * 0.035, // 0.035 to 0.07
      speedY: -(0.15 + Math.random() * 0.25), // -0.15 to -0.40
      speedX: (Math.random() - 0.5) * 0.2, // very slight horizontal drift
    }));

    setSymbols(initialSymbols);

    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Animation loop
  useEffect(() => {
    if (symbols.length === 0 || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Store symbols in a ref to mutate without re-triggering effect
    const symbolsData = [...symbols];

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      symbolsData.forEach((symbol) => {
        // Move symbol
        symbol.y += symbol.speedY;
        symbol.x += symbol.speedX;

        // Reset if it goes off screen
        if (symbol.y < -20) {
          symbol.y = canvas.height + 20;
          symbol.x = Math.random() * canvas.width;
          symbol.symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        }
        if (symbol.x < -20) symbol.x = canvas.width + 20;
        if (symbol.x > canvas.width + 20) symbol.x = -20;

        // Draw symbol
        ctx.font = `${symbol.size}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = `rgba(255, 255, 255, ${symbol.opacity})`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(symbol.symbol, symbol.x, symbol.y);
      });

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [symbols]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}
