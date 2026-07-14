"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { Footer } from "@/components/Footer";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";
import { Providers } from "@/lib/providers";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import MobilePageTransition from "@/components/mobile/MobilePageTransition";

const IntroAnimation = dynamic(
  () => import("@/components/IntroAnimation"),
  { ssr: false }
);

import { AuthGateProvider } from "@/hooks/useAuthGate";
import AuthModal from "@/components/auth/AuthModal";

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Suppress THREE.Clock deprecation warning caused by @react-three/fiber internals
    const originalWarn = console.warn;
    console.warn = (...args) => {
      if (args[0] && typeof args[0] === 'string' && (
        args[0].includes('THREE.Clock: This module has been deprecated') ||
        args[0].includes('WebGL context lost') ||
        args[0].includes('THREE.WebGLRenderer: Context Lost.')
      )) {
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
        <AuthGateProvider>
          <SmoothScrollProvider>
            <IntroAnimation />
            <Navbar />
            <MobilePageTransition>
              <main className="flex-1 relative z-10">{children}</main>
            </MobilePageTransition>
            <MobileBottomNav />
            <Footer />
            <AuthModal />
          </SmoothScrollProvider>
        </AuthGateProvider>
      </AuthProvider>
    </Providers>
  );
}
