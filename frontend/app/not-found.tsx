import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found | DevUp Ecosystem",
  description: "The page you're looking for doesn't exist. Explore hackathons, startups, careers, and more on DevUp Ecosystem.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-syne), Syne, sans-serif",
          fontSize: 96,
          fontWeight: 800,
          color: "rgba(200,241,53,0.15)",
          lineHeight: 1,
          marginBottom: 16,
        }}
      >
        404
      </div>
      <h1
        style={{
          fontFamily: "var(--font-syne), Syne, sans-serif",
          fontSize: 28,
          fontWeight: 700,
          color: "#ffffff",
          marginBottom: 8,
        }}
      >
        Page not found
      </h1>
      <p
        style={{
          fontFamily: "var(--font-inter), Inter, sans-serif",
          fontSize: 15,
          color: "#6b6b6b",
          marginBottom: 32,
          maxWidth: 400,
          lineHeight: 1.6,
        }}
      >
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
        Try one of the links below.
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <Link
          href="/"
          style={{
            padding: "10px 24px",
            background: "#c8f135",
            color: "#000",
            border: "none",
            borderRadius: 10,
            fontFamily: "var(--font-inter), Inter, sans-serif",
            fontSize: 14,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Go Home
        </Link>
        <Link
          href="/hackathons"
          style={{
            padding: "10px 24px",
            background: "transparent",
            color: "#a1a1a1",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            fontFamily: "var(--font-inter), Inter, sans-serif",
            fontSize: 14,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Hackathons
        </Link>
        <Link
          href="/ecosystem"
          style={{
            padding: "10px 24px",
            background: "transparent",
            color: "#a1a1a1",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            fontFamily: "var(--font-inter), Inter, sans-serif",
            fontSize: 14,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Ventures
        </Link>
        <Link
          href="/careers"
          style={{
            padding: "10px 24px",
            background: "transparent",
            color: "#a1a1a1",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            fontFamily: "var(--font-inter), Inter, sans-serif",
            fontSize: 14,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Careers
        </Link>
      </div>
    </div>
  );
}
