"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";
import { Providers } from "@/lib/providers";

const IntroAnimation = dynamic(
  () => import("@/components/IntroAnimation"),
  { ssr: false }
);

import { AuthProvider } from "@/lib/auth/AuthProvider";

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    // Check if intro has been seen
    const seen = sessionStorage.getItem("devup_intro_seen");
    if (!seen) setShowIntro(true);

    // Suppress THREE.Clock deprecation warning caused by @react-three/fiber internals
    const originalWarn = console.warn;
    console.warn = (...args) => {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('THREE.Clock: This module has been deprecated')) {
        return;
      }
      originalWarn(...args);
    };

    return () => {
      console.warn = originalWarn;
    };
  }, []);

  return (
    <Providers>
      <AuthProvider>
        {showIntro && (
          <IntroAnimation
            onComplete={() => {
              setShowIntro(false);
              sessionStorage.setItem("devup_intro_seen", "true");
            }}
          />
        )}
        <SmoothScrollProvider>
          <Navbar />
          <main className="flex-1 relative z-10">{children}</main>
          <Footer />
        </SmoothScrollProvider>
      </AuthProvider>
    </Providers>
  );
}
