import type { Metadata } from "next";
import { Inter, Syne, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import LayoutClient from "@/components/LayoutClient";
import BackendWakeUp from "@/components/BackendWakeUp";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DevUp Ecosystem",
  description: "The premier ecosystem for the next generation of visionary founders.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth" className={`${inter.variable} ${syne.variable} ${jetbrainsMono.variable} h-full antialiased dark`}>
      <head>
        {/* Synchronous script — runs BEFORE paint, before React hydrates.
            Tags <html> with data-skip-intro for returning visitors so CSS
            can instantly hide the overlay with zero flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var seen = sessionStorage.getItem('devup_intro_seen');
                  if (seen) {
                    document.documentElement.setAttribute('data-skip-intro', 'true');
                  }
                } catch (e) {}
              })();
            `
          }}
        />
      </head>
      <body className="min-h-full flex flex-col selection:bg-white/20">
        {/* Static overlay — in the initial server HTML, covers everything
            from byte one. CSS rule hides it instantly for returning visitors. */}
        <div
          id="intro-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: '#0a0a0a',
            zIndex: 9999,
          }}
          suppressHydrationWarning
        />
        <LayoutClient>{children}</LayoutClient>
        <BackendWakeUp />
      </body>
    </html>
  );
}
