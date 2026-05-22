"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";
import { Providers } from "@/components/providers/QueryProvider";

const IntroAnimation = dynamic(
  () => import("@/components/IntroAnimation"),
  { ssr: false }
);

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem("devup_intro_seen");
    if (!seen) setShowIntro(true);
  }, []);

  return (
    <Providers>
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
    </Providers>
  );
}
