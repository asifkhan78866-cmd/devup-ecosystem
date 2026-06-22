import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Hackathon on DevUp Ecosystem";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default async function HackathonOGImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let hackathon: any = null;
  try {
    const res = await fetch(`${API}/api/hackathons/${id}`);
    const data = await res.json();
    hackathon = data.success ? data.data : null;
  } catch {
    // fall through to default
  }

  const name = hackathon?.title || "Hackathon";
  const city = hackathon?.city || "Hyderabad";
  const prizePool = hackathon?.prizePool || "₹1,00,000+";
  const startDate = hackathon?.startDate
    ? new Date(hackathon.startDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  return new ImageResponse(
    (
      <div
        style={{
          background: "#0a0a0a",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "60px",
          position: "relative",
        }}
      >
        {/* Subtle gradient accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(to right, #c8f135, #a78bfa, #38bdf8)",
            display: "flex",
          }}
        />

        {/* Background gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 20% 80%, rgba(200,241,53,0.08) 0%, transparent 60%)",
            display: "flex",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* DevUp badge */}
          <div
            style={{
              background: "#c8f135",
              color: "#000",
              padding: "6px 16px",
              borderRadius: "100px",
              fontSize: 14,
              fontWeight: 700,
              width: "fit-content",
              marginBottom: 24,
            }}
          >
            DevUp Ecosystem
          </div>

          {/* Hackathon name */}
          <div
            style={{
              fontSize: 56,
              fontWeight: 900,
              color: "#ffffff",
              lineHeight: 1.05,
              marginBottom: 24,
              letterSpacing: "-0.02em",
            }}
          >
            {name}
          </div>

          {/* Meta row */}
          <div
            style={{
              display: "flex",
              gap: 32,
              fontSize: 20,
              color: "#a1a1a1",
            }}
          >
            {startDate && <span>📅 {startDate}</span>}
            <span>📍 {city}</span>
            <span>🏆 {prizePool}</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
