"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Globe,
  MapPin,
  Building,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Network,
  Rocket,
  Handshake,
  Landmark,
  Briefcase,
  Mic,
  BrainCircuit,
  UserCheck,
  Trophy,
  Gift,
  Coins,
  Compass,
  Zap,
  Target,
  Users,
  Send,
  Star,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  X,
  Flame,
  Award,
  Film,
  Video,
  ChevronLeft,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Navbar } from "@/components/Navbar";
import { getMediaUrl } from "@/lib/mediaMap";

// All 18 Real WhatsApp Video Reels from public/showcase_reels
const SHOWCASE_REELS = [
  { id: 1, title: "DevUp Flagship Hackathon", src: getMediaUrl("/showcase_reels/WhatsApp Video 2026-08-18 at 12.26.31 AM.mp4") },
  { id: 2, title: "Campus Founder Meetup", src: getMediaUrl("/showcase_reels/WhatsApp Video 2026-08-18 at 12.26.32 AM.mp4") },
  { id: 3, title: "Student Innovation Summit", src: getMediaUrl("/showcase_reels/WhatsApp Video 2026-08-18 at 12.27.13 AM (1).mp4") },
  { id: 4, title: "Territory Leadership Onboarding", src: getMediaUrl("/showcase_reels/WhatsApp Video 2026-08-18 at 12.27.13 AM.mp4") },
  { id: 5, title: "National Builder Community", src: getMediaUrl("/showcase_reels/WhatsApp Video 2026-08-18 at 12.27.14 AM (1).mp4") },
  { id: 6, title: "Startup Keynote & Teardown", src: getMediaUrl("/showcase_reels/WhatsApp Video 2026-08-18 at 12.27.14 AM (2).mp4") },
  { id: 7, title: "City Tech Mixer", src: getMediaUrl("/showcase_reels/WhatsApp Video 2026-08-18 at 12.27.14 AM.mp4") },
  { id: 8, title: "Code & Build Sprint", src: getMediaUrl("/showcase_reels/WhatsApp Video 2026-08-18 at 12.27.15 AM (1).mp4") },
  { id: 9, title: "Regional Campus Chapter", src: getMediaUrl("/showcase_reels/WhatsApp Video 2026-08-18 at 12.27.15 AM.mp4") },
  { id: 10, title: "Product Pitch Competition", src: getMediaUrl("/showcase_reels/WhatsApp Video 2026-08-18 at 12.27.16 AM (1).mp4") },
  { id: 11, title: "DevUp Community Awards", src: getMediaUrl("/showcase_reels/WhatsApp Video 2026-08-18 at 12.27.16 AM (2).mp4") },
  { id: 12, title: "State Director Briefing", src: getMediaUrl("/showcase_reels/WhatsApp Video 2026-08-18 at 12.27.16 AM (3).mp4") },
  { id: 13, title: "Innovation Mentorship Circle", src: getMediaUrl("/showcase_reels/WhatsApp Video 2026-08-18 at 12.27.16 AM.mp4") },
  { id: 14, title: "Cross-College Network Hub", src: getMediaUrl("/showcase_reels/WhatsApp Video 2026-08-18 at 12.27.17 AM (1).mp4") },
  { id: 15, title: "Campus Leader Showcase", src: getMediaUrl("/showcase_reels/WhatsApp Video 2026-08-18 at 12.27.17 AM (2).mp4") },
  { id: 16, title: "DevUp Tech Workshop", src: getMediaUrl("/showcase_reels/WhatsApp Video 2026-08-18 at 12.27.17 AM.mp4") },
  { id: 17, title: "Founders & Students Connect", src: getMediaUrl("/showcase_reels/WhatsApp Video 2026-08-18 at 12.27.18 AM (1).mp4") },
  { id: 18, title: "DevUp Community Celebration", src: getMediaUrl("/showcase_reels/WhatsApp Video 2026-08-18 at 12.27.18 AM.mp4") },
];

// All 36 Real Photos array from public/showcase_photos_videos
const SHOWCASE_PHOTOS = [
  getMediaUrl("/showcase_photos_videos/WhatsApp Image 2026-08-18 at 12.13.16 AM.jpeg"),
  getMediaUrl("/showcase_photos_videos/WhatsApp Image 2026-08-18 at 12.13.17 AM (1).jpeg"),
  getMediaUrl("/showcase_photos_videos/WhatsApp Image 2026-08-18 at 12.13.17 AM (2).jpeg"),
  getMediaUrl("/showcase_photos_videos/WhatsApp Image 2026-08-18 at 12.13.17 AM.jpeg"),
  getMediaUrl("/showcase_photos_videos/WhatsApp Image 2026-08-18 at 12.13.18 AM (1).jpeg"),
  getMediaUrl("/showcase_photos_videos/WhatsApp Image 2026-08-18 at 12.13.18 AM.jpeg"),
  getMediaUrl("/showcase_photos_videos/WhatsApp Image 2026-08-18 at 12.13.20 AM.jpeg"),
  getMediaUrl("/showcase_photos_videos/WhatsApp Image 2026-08-18 at 12.13.23 AM (1).jpeg"),
  getMediaUrl("/showcase_photos_videos/WhatsApp Image 2026-08-18 at 12.13.23 AM.jpeg"),
  getMediaUrl("/showcase_photos_videos/WhatsApp Image 2026-08-18 at 12.13.24 AM (1).jpeg"),
  getMediaUrl("/showcase_photos_videos/WhatsApp Image 2026-08-18 at 12.13.24 AM (2).jpeg"),
  getMediaUrl("/showcase_photos_videos/WhatsApp Image 2026-08-18 at 12.13.24 AM.jpeg"),
  getMediaUrl("/showcase_photos_videos/WhatsApp Image 2026-08-18 at 12.13.25 AM (1).jpeg"),
  getMediaUrl("/showcase_photos_videos/WhatsApp Image 2026-08-18 at 12.13.25 AM (2).jpeg"),
  getMediaUrl("/showcase_photos_videos/WhatsApp Image 2026-08-18 at 12.13.25 AM.jpeg"),
  getMediaUrl("/showcase_photos_videos/WhatsApp Image 2026-08-18 at 12.13.26 AM.jpeg"),
  getMediaUrl("/showcase_photos_videos/WhatsApp Image 2026-08-18 at 12.13.30 AM.jpeg"),
  getMediaUrl("/showcase_photos_videos/WhatsApp Image 2026-08-18 at 12.13.31 AM (1).jpeg"),
  getMediaUrl("/showcase_photos_videos/WhatsApp Image 2026-08-18 at 12.13.31 AM (2).jpeg"),
  getMediaUrl("/showcase_photos_videos/WhatsApp Image 2026-08-18 at 12.13.31 AM.jpeg"),
  getMediaUrl("/showcase_photos_videos/WhatsApp Image 2026-08-18 at 12.13.32 AM (1).jpeg"),
  getMediaUrl("/showcase_photos_videos/WhatsApp Image 2026-08-18 at 12.13.32 AM.jpeg"),
  getMediaUrl("/showcase_photos_videos/WhatsApp Image 2026-08-18 at 12.13.33 AM (1).jpeg"),
  getMediaUrl("/showcase_photos_videos/WhatsApp Image 2026-08-18 at 12.13.33 AM (2).jpeg"),
  getMediaUrl("/showcase_photos_videos/WhatsApp Image 2026-08-18 at 12.13.33 AM.jpeg"),
  getMediaUrl("/showcase_photos_videos/WhatsApp Image 2026-08-18 at 12.13.34 AM (1).jpeg"),
  getMediaUrl("/showcase_photos_videos/WhatsApp Image 2026-08-18 at 12.13.34 AM (2).jpeg"),
  getMediaUrl("/showcase_photos_videos/WhatsApp Image 2026-08-18 at 12.13.34 AM.jpeg"),
  getMediaUrl("/showcase_photos_videos/WhatsApp Image 2026-08-18 at 12.13.35 AM (1).jpeg"),
  getMediaUrl("/showcase_photos_videos/WhatsApp Image 2026-08-18 at 12.13.35 AM (2).jpeg"),
  getMediaUrl("/showcase_photos_videos/WhatsApp Image 2026-08-18 at 12.13.35 AM.jpeg"),
  getMediaUrl("/showcase_photos_videos/WhatsApp Image 2026-08-18 at 12.13.36 AM (1).jpeg"),
  getMediaUrl("/showcase_photos_videos/WhatsApp Image 2026-08-18 at 12.13.36 AM (2).jpeg"),
  getMediaUrl("/showcase_photos_videos/WhatsApp Image 2026-08-18 at 12.13.36 AM.jpeg"),
  getMediaUrl("/showcase_photos_videos/WhatsApp Image 2026-08-18 at 12.13.37 AM (1).jpeg"),
  getMediaUrl("/showcase_photos_videos/WhatsApp Image 2026-08-18 at 12.13.37 AM.jpeg"),
];

// Every video gets a still poster so a slot is never an empty black box while the
// source loads (or when the viewer has reduced motion turned on).
const reelPoster = (index: number) =>
  SHOWCASE_PHOTOS[(index * 2) % SHOWCASE_PHOTOS.length];

// Roles & Territory data with assigned video reel preview & cover photo
const LEADERSHIP_POSITIONS = [
  {
    id: "STATE_DIRECTOR",
    title: "State Director",
    scope: "State Level",
    coverVideo: SHOWCASE_REELS[0].src,
    coverPhoto: SHOWCASE_PHOTOS[0],
    badgeColor: "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30",
    icon: Globe,
    shortDesc: "Build and lead the DevUp network across an entire state.",
    fullDesc:
      "Own state-level growth, leadership and ecosystem activities. Coordinate regional & city directors, forge top-tier institutional partnerships, and scale DevUp across the state.",
    perks: [
      "State-wide leadership authority & verified title",
      "Direct channel with DevUp Founders & Core Team",
      "Represent state at national summits & government initiatives",
      "Oversee state innovation funds & flagship summits",
    ],
  },
  {
    id: "REGIONAL_DIRECTOR",
    title: "Regional Director",
    scope: "Regional Network",
    coverVideo: SHOWCASE_REELS[1].src,
    coverPhoto: SHOWCASE_PHOTOS[10],
    badgeColor: "from-purple-500/20 to-indigo-500/20 text-purple-400 border-purple-500/30",
    icon: MapPin,
    shortDesc: "Develop and coordinate communities across a regional network.",
    fullDesc:
      "Build the regional network. Coordinate cities, leaders, hackathons, and multi-city initiatives across your assigned region.",
    perks: [
      "Multi-city network command & regional event oversight",
      "Priority access to incubation & startup mentorship programs",
      "Lead cross-campus hackathons & founder bootcamps",
      "Verified recommendation letters & executive perks",
    ],
  },
  {
    id: "CITY_DIRECTOR",
    title: "City Director",
    scope: "City Ecosystem",
    coverVideo: SHOWCASE_REELS[2].src,
    coverPhoto: SHOWCASE_PHOTOS[20],
    badgeColor: "from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30",
    icon: Building,
    shortDesc: "Build the DevUp presence across colleges and communities in your city.",
    fullDesc:
      "Own the city network. Connect colleges, tech communities, local startups, and city-level activities into one vibrant tech ecosystem.",
    perks: [
      "Unite student communities across all colleges in your city",
      "Host local meetup hubs, tech mixers & startup teardowns",
      "Direct access to local founders & startup hiring pipelines",
      "Exclusive city leader merchandise & event VIP passes",
    ],
  },
  {
    id: "CAMPUS_DIRECTOR",
    title: "Campus Director",
    scope: "College / Campus",
    coverVideo: SHOWCASE_REELS[3].src,
    coverPhoto: SHOWCASE_PHOTOS[30],
    badgeColor: "from-lime-500/20 to-emerald-500/20 text-lime-400 border-lime-500/30",
    icon: GraduationCap,
    shortDesc: "Lead DevUp inside your college and build the next generation of student leaders.",
    fullDesc:
      "Own your campus. Build the community, team, events, and student network inside your college. Inspire fellow students to build real products.",
    perks: [
      "Establish official DevUp Student Chapter inside your college",
      "Build your own core team of domain leads & organizers",
      "Exclusive access to DevUp learning resources & sponsor credits",
      "Certificate of Excellence & official campus director kit",
    ],
  },
];

// Benefits data with assigned photos
const BENEFITS = [
  {
    icon: Network,
    title: "Build Your Own Network",
    description: "Lead students, communities and campus teams while building a real professional network across colleges.",
    color: "#38bdf8",
    photo: SHOWCASE_PHOTOS[0],
  },
  {
    icon: Rocket,
    title: "Exclusive Opportunities",
    description: "Get priority access to selected internships, startup opportunities, projects, hackathons, founder meets and ecosystem programs.",
    color: "#c8f135",
    photo: SHOWCASE_PHOTOS[3],
  },
  {
    icon: Handshake,
    title: "Founder & Industry Access",
    description: "Connect directly with founders, industry professionals, mentors and ecosystem leaders through selected DevUp programs.",
    color: "#a855f7",
    photo: SHOWCASE_PHOTOS[6],
  },
  {
    icon: Landmark,
    title: "Institutional & Government Exposure",
    description: "Opportunities to represent DevUp at appropriate institutional, government and ecosystem programs.",
    color: "#f59e0b",
    photo: SHOWCASE_PHOTOS[9],
  },
  {
    icon: Briefcase,
    title: "Startup & Entrepreneurship Exposure",
    description: "Get closer to startups, innovation programs, incubation initiatives and real-world product building.",
    color: "#ec4899",
    photo: SHOWCASE_PHOTOS[12],
  },
  {
    icon: Mic,
    title: "Lead Major Events",
    description: "Take responsibility for organizing flagship events, hackathons, founder meets and community initiatives.",
    color: "#3b82f6",
    photo: SHOWCASE_PHOTOS[15],
  },
  {
    icon: BrainCircuit,
    title: "Leadership Development",
    description: "Develop practical experience in People Management • Operations • Partnerships • Strategy • Growth.",
    color: "#10b981",
    photo: SHOWCASE_PHOTOS[18],
  },
  {
    icon: UserCheck,
    title: "Build Your Professional Profile",
    description: "Your verified DevUp contributions, leadership roles, projects and achievements become part of your profile.",
    color: "#8b5cf6",
    photo: SHOWCASE_PHOTOS[21],
  },
  {
    icon: Trophy,
    title: "Recognition",
    description: "Outstanding leaders receive Leadership certificates, Awards, Featured profiles & VIP access.",
    color: "#eab308",
    photo: SHOWCASE_PHOTOS[24],
  },
  {
    icon: Gift,
    title: "Exclusive DevUp Perks",
    description: "Official merchandise, Swags, Event passes, Gifts, Partner perks and special access.",
    color: "#f43f5e",
    photo: SHOWCASE_PHOTOS[27],
  },
  {
    icon: Coins,
    title: "Funding & Innovation Opportunities",
    description: "Selected leaders get access to relevant DevUp innovation programs and startup initiatives.",
    color: "#14b8a6",
    photo: SHOWCASE_PHOTOS[30],
  },
  {
    icon: Compass,
    title: "National Network",
    description: "Your work isn't limited to your college. Connect with leaders and builders across the DevUp network.",
    color: "#6366f1",
    photo: SHOWCASE_PHOTOS[33],
  },
];

// Journey steps
const JOURNEY_STEPS = [
  { step: 1, title: "APPLY", sub: "Submit Leadership Vision" },
  { step: 2, title: "SELECTION", sub: "Review & Interview" },
  { step: 3, title: "LEADERSHIP ONBOARDING", sub: "Toolkit & Strategy Brief" },
  { step: 4, title: "BUILD YOUR TEAM", sub: "Recruit Core Leads" },
  { step: 5, title: "LAUNCH YOUR COMMUNITY", sub: "Official Announcement" },
  { step: 6, title: "LEAD EVENTS & INITIATIVES", sub: "Host Hackathons & Meets" },
  { step: 7, title: "GROW YOUR NETWORK", sub: "Connect Across Territory" },
  { step: 8, title: "CREATE IMPACT", sub: "Empower Student Builders" },
  { step: 9, title: "GET RECOGNIZED", sub: "Badges & Certificates" },
  { step: 10, title: "GROW WITH DEVUP", sub: "Ecosystem Advancement" },
];

// Persona traits checklist (No emojis)
const TRAITS = [
  "Takes initiative without waiting to be told",
  "Can bring people together effortlessly",
  "Enjoys building tech & student communities",
  "Wants real-world leadership experience",
  "Can communicate confidently with peers & leaders",
  "Wants to work with startups & industry mentors",
  "Wants to organize impactful programs & hackathons",
  "Is willing to take end-to-end ownership",
  "Wants to create opportunities for others",
];

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * This page renders ~26 videos out of a 57MB reel library. Attaching every source
 * eagerly downloaded ~38MB before first paint and blew past the browser's limit on
 * concurrent video decoders, so cards further down the page rendered as black boxes.
 *
 * LazyVideo attaches the source — and plays — only while the element is near the
 * viewport, and falls back to a still poster for reduced-motion users.
 */
function LazyVideo({
  src,
  poster,
  className,
  style,
  rootMargin = "300px 0px",
}: {
  src: string;
  poster?: string;
  className?: string;
  style?: React.CSSProperties;
  rootMargin?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || prefersReducedMotion()) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { rootMargin, threshold: 0.01 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [rootMargin]);

  // Kick off playback the first time a source is actually attached.
  useEffect(() => {
    if (!shouldLoad) return;
    videoRef.current?.play().catch(() => {});
  }, [shouldLoad]);

  return (
    <video
      ref={videoRef}
      src={shouldLoad ? src : undefined}
      poster={poster}
      preload={shouldLoad ? "auto" : "none"}
      autoPlay
      loop
      muted
      playsInline
      aria-hidden="true"
      tabIndex={-1}
      className={className}
      style={style}
    />
  );
}

// Mobile Backdrop Video Component
function VideoBackdrop({
  src,
  poster,
  opacity = 0.5,
}: {
  src: string;
  poster?: string;
  opacity?: number;
}) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 rounded-2xl sm:rounded-3xl">
      <LazyVideo
        src={src}
        poster={poster}
        className="w-full h-full object-cover"
        style={{
          filter: "brightness(0.65) saturate(0.9) contrast(1.05)",
          opacity,
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 100% 100% at 50% 0%, transparent 0%, transparent 40%, rgba(7,7,9,0.9) 100%),
            linear-gradient(to bottom, transparent 0%, transparent 50%, rgba(7,7,9,0.98) 100%)
          `,
        }}
      />
    </div>
  );
}

// Single Video Reel Card Component
function ReelCard({
  reel,
  poster,
  onClick,
}: {
  reel: { id: number; title: string; src: string };
  poster: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Play reel: ${reel.title}`}
      className="w-44 sm:w-64 h-64 sm:h-80 shrink-0 rounded-2xl overflow-hidden border border-white/[0.15] relative group cursor-pointer bg-black/60 shadow-lg hover:border-[#c8f135] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8f135] transition-all text-left"
    >
      <LazyVideo
        src={reel.src}
        poster={poster}
        rootMargin="150px"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent flex flex-col justify-end p-3 sm:p-4">
        <div className="flex items-center justify-between text-white">
          <div className="truncate">
            <span className="text-xs font-bold truncate block">{reel.title}</span>
            <span className="text-[10px] text-[#c8f135] font-semibold flex items-center gap-1 mt-0.5">
              <Film className="w-3 h-3" /> Reel #{reel.id}
            </span>
          </div>
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#c8f135] text-black flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform">
            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current translate-x-0.5" />
          </div>
        </div>
      </div>
    </button>
  );
}

// `githubUrl` / `twitterUrl` used to live here but no input ever wrote to them, so
// they were posted as empty strings on every application. The one link field on the
// form maps to `portfolioUrl`.
const EMPTY_FORM = {
  fullName: "",
  email: "",
  phone: "",
  state: "",
  city: "",
  college: "",
  branch: "",
  yearOfStudy: "3rd Year",
  linkedinUrl: "",
  portfolioUrl: "",
  whyLead: "",
  pastExperience: "",
  first30DaysPlan: "",
};

type FormData = typeof EMPTY_FORM;

type SubmittedApplication = {
  applicationNo: string;
  fullName: string;
  college: string;
};

const STEP_2_FIELDS: { key: keyof FormData; label: string }[] = [
  { key: "fullName", label: "Full Name" },
  { key: "email", label: "Email Address" },
  { key: "phone", label: "Phone / WhatsApp Number" },
  { key: "state", label: "State" },
  { key: "city", label: "City" },
  { key: "college", label: "College / University Name" },
];

function validateStep2(data: FormData): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of STEP_2_FIELDS) {
    if (!data[field.key].trim()) errors[field.key] = `${field.label} is required`;
  }

  if (data.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email.trim())) {
    errors.email = "Enter a valid email address";
  }

  const digits = data.phone.replace(/\D/g, "");
  if (data.phone.trim() && (digits.length < 10 || digits.length > 15)) {
    errors.phone = "Enter a valid phone number";
  }

  return errors;
}

function validateStep3(data: FormData): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.whyLead.trim()) {
    errors.whyLead = "Tell us why you want to lead — this field is required";
  }
  return errors;
}

// Applicants paste "linkedin.com/in/me" far more often than a full URL, and a bare
// type="url" input silently rejects it with a native browser tooltip.
function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || /^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export default function LeadDevUpPage() {
  const formRef = useRef<HTMLElement>(null);
  const showcaseVideoRef = useRef<HTMLVideoElement>(null);
  const reelStripRef = useRef<HTMLDivElement>(null);

  const [selectedRole, setSelectedRole] = useState<string>("CAMPUS_DIRECTOR");
  const [activeReelIndex, setActiveReelIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  // Lightbox States
  const [activeLightBoxPhoto, setActiveLightBoxPhoto] = useState<string | null>(null);
  const [activeLightBoxReel, setActiveLightBoxReel] = useState<
    { id: number; title: string; src: string } | null
  >(null);

  // Form state
  const [formStep, setFormStep] = useState<number>(1);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const [submitting, setSubmitting] = useState(false);
  const [submittedApp, setSubmittedApp] = useState<SubmittedApplication | null>(null);
  // The role is frozen at submit time — the confirmation card used to read the live
  // `selectedRole`, so picking a different position card afterwards silently rewrote
  // which role the applicant was told they had applied for.
  const [submittedRole, setSubmittedRole] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Only mirror the mute state onto the element here. Calling play() from this
  // effect used to restart a video the viewer had deliberately paused (and, after
  // an unmute, restart it with sound) while the button still showed the play icon.
  useEffect(() => {
    const video = showcaseVideoRef.current;
    if (video) video.muted = isMuted;
  }, [isMuted, activeReelIndex]);

  const lightboxOpen = Boolean(activeLightBoxPhoto || activeLightBoxReel);

  // A modal that leaves the page scrollable behind it, and that can only be closed
  // with the mouse, is broken for keyboard and touch users alike.
  useEffect(() => {
    if (!lightboxOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveLightBoxPhoto(null);
        setActiveLightBoxReel(null);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [lightboxOpen]);

  const scrollStrip = (direction: 1 | -1) => {
    const strip = reelStripRef.current;
    if (!strip) return;
    strip.scrollBy({ left: direction * strip.clientWidth * 0.8, behavior: "smooth" });
  };

  const scrollToForm = (roleId?: string) => {
    if (roleId) {
      setSelectedRole(roleId);
    }
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Drive the toggle off the element's real state rather than off `isPlaying`, so a
  // pause/play triggered elsewhere (autoplay policy, remount) can't invert it.
  const toggleVideoPlay = () => {
    const video = showcaseVideoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  const toggleVideoMute = () => {
    if (showcaseVideoRef.current) {
      showcaseVideoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Changing reel remounts the <video> (keyed on src) which autoplays, so the
  // play/pause button has to be put back in sync or it lies about the state.
  const nextReel = () => {
    setActiveReelIndex((prev) => (prev + 1) % SHOWCASE_REELS.length);
    setIsPlaying(true);
  };

  const prevReel = () => {
    setActiveReelIndex((prev) => (prev - 1 + SHOWCASE_REELS.length) % SHOWCASE_REELS.length);
    setIsPlaying(true);
  };

  // Calculate leadership match score
  const calculateMatchScore = () => {
    let score = 30;
    if (selectedRole) score += 15;
    if (formData.fullName.length > 2) score += 10;
    if (formData.email.includes("@")) score += 10;
    if (formData.phone.length >= 10) score += 5;
    if (formData.college.length > 3) score += 10;
    if (formData.whyLead.length > 20) score += 10;
    if (formData.pastExperience.length > 15) score += 5;
    if (formData.first30DaysPlan.length > 15) score += 5;
    return Math.min(score, 100);
  };

  // Advancing a step used to be unconditional, so an applicant could reach step 3
  // with every required field on step 2 still blank and only find out at submit —
  // via a generic message pointing at inputs that were no longer on screen.
  const goToStep = (target: number) => {
    setErrorMsg("");

    if (target > 2) {
      const errors = validateStep2(formData);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setFormStep(2);
        setErrorMsg("Please complete the highlighted fields before continuing.");
        return;
      }
    }

    setFieldErrors({});
    setFormStep(target);
  };

  const updateField = (key: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const resetForm = () => {
    setSubmittedApp(null);
    setSubmittedRole("");
    setFormData(EMPTY_FORM);
    setFieldErrors({});
    setErrorMsg("");
    setFormStep(1);
  };

  // End-to-End Real Backend Submission Handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const errors = { ...validateStep2(formData), ...validateStep3(formData) };
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      // Send the applicant back to the step that actually holds the problem.
      const onStep2 = STEP_2_FIELDS.some((f) => errors[f.key]);
      setFormStep(onStep2 ? 2 : 3);
      setErrorMsg("Please complete the highlighted fields before submitting.");
      return;
    }

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const roleAtSubmit = selectedRole;

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/api/lead-applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: roleAtSubmit,
          ...formData,
          linkedinUrl: normalizeUrl(formData.linkedinUrl),
          portfolioUrl: normalizeUrl(formData.portfolioUrl),
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(
          typeof json?.error === "string"
            ? json.error
            : "We could not submit your application. Please try again."
        );
      }

      setSubmittedRole(roleAtSubmit);
      setSubmittedApp(json.data);
      setFieldErrors({});
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#c8f135", "#38bdf8", "#a855f7", "#ffffff"],
      });
    } catch (err: unknown) {
      // Only show the confirmation once the API has stored the application.
      // A generated reference number here would look successful but could not
      // be found by the admin team later.
      //
      // A failed fetch surfaces as "Failed to fetch", which means nothing to an
      // applicant — replace transport-level errors with something actionable.
      const isNetworkError = err instanceof TypeError;
      setErrorMsg(
        isNetworkError
          ? "We couldn't reach the DevUp servers. Check your connection and try again — your answers are still here."
          : err instanceof Error
            ? err.message
            : "We could not submit your application. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const currentRoleInfo = LEADERSHIP_POSITIONS.find((p) => p.id === selectedRole) || LEADERSHIP_POSITIONS[3];
  const submittedRoleInfo =
    LEADERSHIP_POSITIONS.find((p) => p.id === submittedRole) || currentRoleInfo;
  const activeReel = SHOWCASE_REELS[activeReelIndex];

  return (
    <div className="min-h-screen bg-[#070709] text-white selection:bg-[#c8f135] selection:text-black font-sans relative overflow-x-hidden">
      <Navbar />

      {/* HERO SECTION - CLEAN BACKDROP CARD TO PREVENT TEXT COLLISION WITH VIDEO CAPTIONS */}
      <section className="relative z-10 pt-24 pb-14 sm:pt-32 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center overflow-hidden rounded-2xl sm:rounded-3xl my-2 sm:my-4">
        {/* Continuous Video Backdrop */}
        <VideoBackdrop
          src={SHOWCASE_REELS[0].src}
          poster={getMediaUrl("/video/hero-space-poster.jpg")}
          opacity={0.45}
        />

        {/* Content Card with dark blur container so overlay text contrasts sharply */}
        <div className="relative z-10 max-w-4xl mx-auto p-6 sm:p-12 rounded-3xl bg-black/60 sm:bg-black/40 backdrop-blur-md border border-white/[0.1] shadow-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/[0.08] border border-white/[0.15] backdrop-blur-md mb-4 sm:mb-6"
          >
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#c8f135]" />
            <span className="text-[11px] sm:text-sm font-semibold tracking-wide text-zinc-200">
              DevUp Leadership Program 2026
            </span>
            <span className="w-2 h-2 rounded-full bg-[#c8f135] animate-pulse" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-6xl md:text-7xl font-extrabold tracking-tight font-syne text-white max-w-5xl mx-auto leading-[1.15] sm:leading-[1.1] drop-shadow-md"
          >
            DevUp Community is building a connected network of{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c8f135] via-emerald-400 to-cyan-400">
              students, colleges, innovators & startups.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 sm:mt-6 text-sm sm:text-xl text-zinc-300 max-w-3xl mx-auto font-medium drop-shadow-sm px-2"
          >
            Choose your territory. Build your community. Lead people. Create opportunities. Represent DevUp.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-6 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-2"
          >
            <button
              onClick={() => scrollToForm()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 sm:px-8 sm:py-4 rounded-xl bg-[#c8f135] text-black font-extrabold text-xs sm:text-base shadow-[0_0_35px_rgba(200,241,53,0.4)] hover:shadow-[0_0_50px_rgba(200,241,53,0.6)] transition-all duration-300 cursor-pointer"
            >
              <span>APPLY TO LEAD DEVUP →</span>
            </button>

            <a
              href="#positions"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 sm:py-4 rounded-xl bg-white/[0.08] border border-white/[0.2] text-white font-semibold text-xs sm:text-base hover:bg-white/[0.15] backdrop-blur-md transition-all"
            >
              Explore Positions
            </a>
          </motion.div>
        </div>
      </section>

      {/* CONTINUOUS VIDEO REEL CAROUSEL STRIP */}
      <section className="relative z-10 py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <div className="text-[11px] sm:text-xs font-bold tracking-widest text-[#c8f135] uppercase flex items-center gap-1.5 sm:gap-2">
              <Film className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Live Video Reel Showcase
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold font-syne text-white mt-1">
              Explore 18 Live DevUp Reels
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[11px] sm:text-xs text-zinc-400 mr-1">
              Scroll for more
            </span>
            <button
              type="button"
              onClick={() => scrollStrip(-1)}
              aria-label="Scroll reels left"
              className="p-2 rounded-lg bg-white/[0.06] border border-white/[0.12] text-white hover:bg-white/[0.14] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollStrip(1)}
              aria-label="Scroll reels right"
              className="p-2 rounded-lg bg-white/[0.06] border border-white/[0.12] text-white hover:bg-white/[0.14] transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          ref={reelStripRef}
          className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-none select-none touch-pan-x scroll-smooth"
        >
          {SHOWCASE_REELS.map((reel, idx) => (
            <ReelCard
              key={reel.id}
              reel={reel}
              poster={reelPoster(idx)}
              onClick={() => setActiveLightBoxReel(reel)}
            />
          ))}
        </div>
      </section>

      {/* CONTINUOUS RUNNING IMAGE MARQUEE / TICKER (~29px/s — see --marquee-duration) */}
      <section className="relative z-10 py-6 sm:py-8 overflow-hidden bg-black/50 border-y border-white/[0.08]">
        <div className="mb-3 sm:mb-4 text-center px-4">
          <span className="text-[11px] sm:text-xs font-bold tracking-widest text-[#c8f135] uppercase flex items-center justify-center gap-2">
            <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Live Community Atmosphere Across Campuses
          </span>
        </div>

        {/* Row 1 Marquee */}
        <div className="flex w-full overflow-hidden select-none py-1.5 sm:py-2">
          {/* w-max is load-bearing: the track must size to its content, otherwise the
              keyframes' translateX(-50%) is 50% of the *container* (~636px) instead of
              half the strip, and the marquee crawls a short distance then snaps back. */}
          <div className="flex w-max animate-marquee-fast">
            {SHOWCASE_PHOTOS.slice(0, 18).concat(SHOWCASE_PHOTOS.slice(0, 18)).map((src, i) => (
              <button
                type="button"
                key={i}
                onClick={() => setActiveLightBoxPhoto(src)}
                aria-hidden={i >= 18}
                tabIndex={i >= 18 ? -1 : 0}
                aria-label="Open community photo"
                className="w-48 sm:w-80 h-32 sm:h-44 mr-3 sm:mr-4 shrink-0 rounded-xl sm:rounded-2xl overflow-hidden border border-white/[0.1] relative group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8f135]"
              >
                <img
                  src={src}
                  alt=""
                  loading={i < 3 ? "eager" : "lazy"}
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5 sm:p-3">
                  <span className="text-[10px] sm:text-xs text-white font-medium flex items-center gap-1">
                    <Maximize2 className="w-3 h-3 text-[#c8f135]" /> View photo
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Row 2 Marquee (reverse) */}
        <div className="flex w-full overflow-hidden select-none py-1.5 sm:py-2 mt-1 sm:mt-2">
          <div className="flex w-max animate-marquee-reverse-fast">
            {SHOWCASE_PHOTOS.slice(18, 36).concat(SHOWCASE_PHOTOS.slice(18, 36)).map((src, i) => (
              <button
                type="button"
                key={i}
                onClick={() => setActiveLightBoxPhoto(src)}
                aria-hidden={i >= 18}
                tabIndex={i >= 18 ? -1 : 0}
                aria-label="Open community photo"
                className="w-48 sm:w-80 h-32 sm:h-44 mr-3 sm:mr-4 shrink-0 rounded-xl sm:rounded-2xl overflow-hidden border border-white/[0.1] relative group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8f135]"
              >
                <img
                  src={src}
                  alt=""
                  loading={i < 3 ? "eager" : "lazy"}
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5 sm:p-3">
                  <span className="text-[10px] sm:text-xs text-white font-medium flex items-center gap-1">
                    <Maximize2 className="w-3 h-3 text-[#c8f135]" /> View photo
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* OPEN LEADERSHIP POSITIONS CARDS */}
      {/* scroll-mt clears the 72px fixed navbar, which otherwise covers the section heading */}
      <section id="positions" className="relative z-10 scroll-mt-20 sm:scroll-mt-24 py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <div className="text-[#c8f135] font-semibold text-xs tracking-wider uppercase mb-2 flex items-center justify-center gap-1.5">
            <Award className="w-4 h-4" /> Territory Roles & Scope
          </div>
          <h2 className="text-2xl sm:text-5xl font-extrabold font-syne">OPEN LEADERSHIP POSITIONS</h2>
          <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto mt-2 sm:mt-3">
            Select the leadership scope where you can make the biggest impact.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {LEADERSHIP_POSITIONS.map((pos, idx) => {
            const Icon = pos.icon;
            const isSelected = selectedRole === pos.id;
            return (
              <motion.div
                key={pos.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className={`relative group rounded-2xl sm:rounded-3xl overflow-hidden border transition-all duration-300 flex flex-col justify-between ${
                  isSelected
                    ? "bg-white/[0.07] border-[#c8f135] shadow-[0_0_30px_rgba(200,241,53,0.15)]"
                    : "bg-white/[0.02] border-white/[0.08] hover:border-white/[0.2]"
                }`}
              >
                {/* Real Live Video Reel Header */}
                <div className="relative h-40 sm:h-52 w-full overflow-hidden border-b border-white/[0.08] bg-black">
                  <LazyVideo
                    src={pos.coverVideo}
                    poster={pos.coverPhoto}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-black/30 to-transparent" />

                  <span
                    className={`absolute top-3 right-3 text-[11px] sm:text-xs font-semibold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border bg-gradient-to-r ${pos.badgeColor}`}
                  >
                    {pos.scope}
                  </span>

                  <div className="absolute bottom-3 left-3 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-black/70 border border-white/[0.2] backdrop-blur-md flex items-center justify-center">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#c8f135]" />
                  </div>
                </div>

                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5 sm:mb-2">{pos.title}</h3>
                    <p className="text-xs sm:text-sm text-zinc-400 mb-4 line-clamp-3 leading-relaxed">{pos.shortDesc}</p>

                    <div className="space-y-2 mb-6">
                      {pos.perks.slice(0, 2).map((perk, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                          <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#c8f135] shrink-0 mt-0.5" />
                          <span>{perk}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => scrollToForm(pos.id)}
                    className={`w-full py-3 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#c8f135] text-black font-bold"
                        : "bg-white/[0.06] text-white hover:bg-white/[0.12]"
                    }`}
                  >
                    <span>Apply for {pos.title}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* FEATURED DEVUP REEL PLAYER & PLAYLIST */}
      <section className="relative z-10 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/[0.1] p-4 sm:p-10 relative overflow-hidden backdrop-blur-2xl">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c8f135]/10 border border-[#c8f135]/30 text-[#c8f135] text-xs font-semibold mb-2">
              <Video className="w-3.5 h-3.5" /> Live Community Reel Player
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold font-syne text-white">
              SEE DEVUP BUILDERS & EVENTS IN ACTION
            </h2>
            <p className="text-zinc-400 text-xs sm:text-base mt-2">
              Select and play real WhatsApp community reels from hackathons, founder meets, and campus chapters.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-center max-w-5xl mx-auto">
            {/* Main Active Reel Display */}
            <div className="lg:col-span-2 relative rounded-xl sm:rounded-2xl overflow-hidden border border-white/[0.2] aspect-[9/16] sm:aspect-video group shadow-2xl bg-black">
              <video
                ref={showcaseVideoRef}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                preload="metadata"
                poster={reelPoster(activeReelIndex)}
                key={activeReel.src}
                src={activeReel.src}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                aria-label={`DevUp community reel: ${activeReel.title}`}
                className="w-full h-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 pointer-events-none" />

              <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 flex items-center justify-between pointer-events-auto z-10">
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={toggleVideoPlay}
                    aria-label={isPlaying ? "Pause reel" : "Play reel"}
                    className="p-2.5 sm:p-3 rounded-xl bg-black/70 border border-white/[0.2] text-white hover:bg-black transition-all cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5 text-[#c8f135]" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5 text-[#c8f135] fill-current" />}
                  </button>
                  <button
                    type="button"
                    onClick={toggleVideoMute}
                    aria-label={isMuted ? "Unmute reel" : "Mute reel"}
                    className="p-2.5 sm:p-3 rounded-xl bg-black/70 border border-white/[0.2] text-white hover:bg-black transition-all cursor-pointer"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#c8f135]" />}
                  </button>
                  <div className="text-xs font-medium text-zinc-300 truncate max-w-[140px] sm:max-w-none">
                    <div className="font-bold text-white truncate text-xs sm:text-sm">{activeReel.title}</div>
                    <div className="text-[10px] sm:text-xs text-zinc-400">Reel #{activeReel.id} of {SHOWCASE_REELS.length}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={prevReel}
                    aria-label="Previous reel"
                    className="p-2 rounded-lg bg-black/60 border border-white/[0.2] text-white hover:bg-black"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={nextReel}
                    aria-label="Next reel"
                    className="p-2 rounded-lg bg-black/60 border border-white/[0.2] text-white hover:bg-black"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Playlist Sidebar */}
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto max-h-[300px] lg:max-h-[420px] pr-1 pb-2 lg:pb-0 scrollbar-none">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 hidden lg:block mb-2">
                Reel Playlist ({SHOWCASE_REELS.length})
              </div>
              {SHOWCASE_REELS.map((reel, idx) => (
                <div
                  key={reel.id}
                  onClick={() => {
                    setActiveReelIndex(idx);
                    setIsPlaying(true);
                  }}
                  className={`p-2.5 sm:p-3 rounded-xl border flex items-center gap-2.5 shrink-0 lg:shrink cursor-pointer transition-all min-w-[160px] lg:min-w-0 ${
                    idx === activeReelIndex
                      ? "bg-[#c8f135]/15 border-[#c8f135] text-white"
                      : "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.08] text-zinc-400"
                  }`}
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-black/60 flex items-center justify-center shrink-0 border border-white/[0.1]">
                    {idx === activeReelIndex ? (
                      <Film className="w-3.5 h-3.5 text-[#c8f135]" />
                    ) : (
                      <Play className="w-3 h-3 text-zinc-400 fill-current" />
                    )}
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-white truncate">{reel.title}</div>
                    <div className="text-[10px] text-zinc-400">Reel #{reel.id}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WHAT DO YOU GET? (BENEFITS GRID WITH ATTACHED REAL PHOTOS & CAROUSEL ON MOBILE) */}
      <section className="relative z-10 py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <div className="text-[#c8f135] font-semibold text-xs tracking-wider uppercase mb-2 flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4" /> Leadership Perks & Privileges
          </div>
          <h2 className="text-2xl sm:text-5xl font-extrabold font-syne">
            LEADERSHIP THAT GOES BEYOND A TITLE
          </h2>
          <p className="text-zinc-400 text-sm sm:text-lg max-w-2xl mx-auto mt-2 sm:mt-3">
            What do you get when you step up as a DevUp Director?
          </p>
        </div>

        {/* Mobile Swipeable 2-Row Benefit Carousel / Desktop Grid */}
        <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex sm:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 overflow-x-auto sm:overflow-visible pb-4 sm:pb-0 scrollbar-none touch-pan-x">
          {BENEFITS.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: (index % 3) * 0.05 }}
                className="w-72 sm:w-auto shrink-0 sm:shrink rounded-2xl sm:rounded-3xl bg-white/[0.02] border border-white/[0.07] hover:border-white/[0.2] overflow-hidden flex flex-col justify-between group"
              >
                {/* Photo Header for Benefit Card */}
                <div className="h-36 w-full relative overflow-hidden border-b border-white/[0.08] bg-black">
                  <img
                    src={item.photo}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-black/30 to-transparent" />

                  <div
                    className="absolute top-3 left-3 w-9 h-9 rounded-xl flex items-center justify-center backdrop-blur-md shadow-md"
                    style={{
                      backgroundColor: `${item.color}25`,
                      border: `1px solid ${item.color}40`,
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                </div>

                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 sm:mb-2">{item.title}</h3>
                    <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* WHY BECOME A DEVUP LEADER - CLEAN CARD LAYOUT (VIDEO TOP, CONTENT DOWN) */}
      <section className="relative z-10 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="rounded-2xl sm:rounded-3xl bg-white/[0.03] border border-white/[0.1] overflow-hidden shadow-2xl">
          {/* Top Video Header */}
          <div className="relative h-56 sm:h-80 w-full overflow-hidden bg-black">
            <LazyVideo
              src={SHOWCASE_REELS[4].src}
              poster={reelPoster(4)}
              className="w-full h-full object-cover filter brightness-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-transparent to-black/30" />
            <div className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 border border-white/[0.2] text-[#c8f135] text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" /> DevUp Leadership Vision
            </div>
          </div>

          {/* Bottom Content Body */}
          <div className="p-6 sm:p-12 text-center bg-[#070709]">
            <h2 className="text-2xl sm:text-4xl font-extrabold font-syne text-white mb-4">
              Why become a DevUp Leader?
            </h2>
            <blockquote className="text-base sm:text-2xl text-zinc-200 font-medium leading-relaxed italic max-w-3xl mx-auto mb-8">
              “Because the next opportunity shouldn&apos;t have to find you.”
            </blockquote>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-left max-w-2xl mx-auto">
              <div className="p-3.5 sm:p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center gap-3">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-[#c8f135] shrink-0" />
                <span className="text-xs sm:text-sm text-zinc-200">You don&apos;t just attend events — <strong>You create them.</strong></span>
              </div>
              <div className="p-3.5 sm:p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center gap-3">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 shrink-0" />
                <span className="text-xs sm:text-sm text-zinc-200">You don&apos;t just join communities — <strong>You build them.</strong></span>
              </div>
              <div className="p-3.5 sm:p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center gap-3">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 shrink-0" />
                <span className="text-xs sm:text-sm text-zinc-200">You don&apos;t just look for opportunities — <strong>You create access for others.</strong></span>
              </div>
              <div className="p-3.5 sm:p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center gap-3">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
                <span className="text-xs sm:text-sm text-zinc-200">You don&apos;t just put a title on your profile — <strong>You build a track record.</strong></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* YOUR JOURNEY FLOWCHART */}
      <section className="relative z-10 py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <div className="text-[#c8f135] font-semibold text-xs tracking-wider uppercase mb-2 flex items-center justify-center gap-1.5">
            <Compass className="w-4 h-4" /> Trajectory & Milestones
          </div>
          <h2 className="text-2xl sm:text-5xl font-extrabold font-syne">YOUR LEADERSHIP JOURNEY</h2>
          <p className="text-zinc-400 text-xs sm:text-base max-w-xl mx-auto mt-2 sm:mt-3">
            From application to ecosystem leadership — step by step.
          </p>
        </div>

        <div className="relative">
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[#c8f135]/20 via-cyan-500/30 to-[#c8f135]/20 -translate-y-1/2 z-0" />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 relative z-10">
            {JOURNEY_STEPS.map((step) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: step.step * 0.05 }}
                className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-[#c8f135]/50 hover:bg-white/[0.06] transition-all text-center group"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#c8f135]/10 border border-[#c8f135]/30 text-[#c8f135] font-bold text-xs sm:text-sm flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                  {step.step}
                </div>
                <div className="text-xs sm:text-sm font-bold text-white mb-1 group-hover:text-[#c8f135] transition-colors leading-tight">
                  {step.title}
                </div>
                <div className="text-[10px] sm:text-xs text-zinc-400 leading-tight">{step.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO SHOULD APPLY? */}
      <section className="relative z-10 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="p-6 sm:p-12 rounded-2xl sm:rounded-3xl bg-white/[0.02] border border-white/[0.08]">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-4xl font-extrabold font-syne text-white">
              Who should apply?
            </h2>
            <p className="text-zinc-400 text-xs sm:text-base mt-2">
              You should apply if you are someone who aligns with these qualities:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {TRAITS.map((trait, i) => (
              <div
                key={i}
                className="p-3.5 sm:p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-3 hover:border-white/[0.15] transition-all"
              >
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#c8f135] shrink-0" />
                <span className="text-xs sm:text-sm text-zinc-200">{trait}</span>
              </div>
            ))}
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#c8f135]/15 via-emerald-500/10 to-cyan-500/15 border border-[#c8f135]/30 text-center flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-sm sm:text-lg text-white font-semibold">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#c8f135]" />
              <span className="text-[#c8f135]">You don&apos;t need to be the best coder.</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300">
              We need builders, organizers, communicators, creators, strategists and people who take ownership.
            </p>
          </div>
        </div>
      </section>

      {/* INTERACTIVE APPLICATION FORM SECTION */}
      <section
        ref={formRef}
        id="apply"
        className="relative z-10 scroll-mt-20 sm:scroll-mt-24 py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto"
      >
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c8f135]/10 border border-[#c8f135]/30 text-[#c8f135] font-semibold text-xs mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Official Application Form
          </div>
          <h2 className="text-2xl sm:text-5xl font-extrabold font-syne">APPLY TO LEAD DEVUP</h2>
          <p className="text-zinc-400 text-xs sm:text-base mt-2">
            Applications are reviewed based on leadership potential, ownership, communication, and ability to execute.
          </p>
        </div>

        <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-b from-white/[0.05] to-white/[0.02] border border-white/[0.1] backdrop-blur-2xl p-5 sm:p-10 shadow-2xl">
          {submittedApp ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6 sm:py-10"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#c8f135]/20 border-2 border-[#c8f135] text-[#c8f135] flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-[0_0_40px_rgba(200,241,53,0.4)]">
                <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold font-syne text-white mb-2">
                APPLICATION SUBMITTED!
              </h3>
              <p className="text-zinc-300 text-sm sm:text-base max-w-md mx-auto mb-6 px-2">
                Congratulations <span className="text-[#c8f135] font-bold">{submittedApp.fullName}</span>! Your leadership application has been received by the DevUp Core Team.
              </p>

              <div className="p-4 sm:p-6 rounded-2xl bg-black/60 border border-white/[0.1] max-w-md mx-auto text-left space-y-3 mb-6 sm:mb-8 text-xs sm:text-sm">
                <div className="flex justify-between items-center text-zinc-400 border-b border-white/[0.06] pb-2">
                  <span>Application Number</span>
                  <span className="font-mono text-[#c8f135] font-bold">{submittedApp.applicationNo}</span>
                </div>
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Position Applied</span>
                  <span className="text-white font-semibold">{submittedRoleInfo.title}</span>
                </div>
                <div className="flex justify-between items-center text-zinc-400">
                  <span>College / Institution</span>
                  <span className="text-white truncate max-w-[180px]">{submittedApp.college}</span>
                </div>
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Review Status</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium">UNDER REVIEW</span>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/[0.08] text-white font-semibold text-xs sm:text-sm hover:bg-white/[0.15] transition-all cursor-pointer"
                >
                  Submit Another Application
                </button>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleFormSubmit} className="space-y-6 sm:space-y-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/[0.08] pb-4 sm:pb-6 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#c8f135] text-black font-bold flex items-center justify-center text-sm shrink-0">
                    {formStep}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      {formStep === 1 && "Step 1: Choose Leadership Scope"}
                      {formStep === 2 && "Step 2: Personal & Campus Details"}
                      {formStep === 3 && "Step 3: Vision & Ownership"}
                    </h3>
                    <p className="text-xs text-zinc-400">
                      {formStep === 1 && "Select territory level"}
                      {formStep === 2 && "Personal and educational details"}
                      {formStep === 3 && "Territory vision & 30-day plan"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className="text-xs text-zinc-400">Match Score:</span>
                  <div className="w-20 sm:w-28 h-2 bg-white/[0.1] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-[#c8f135] transition-all duration-500"
                      style={{ width: `${calculateMatchScore()}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-[#c8f135]">
                    {calculateMatchScore()}%
                  </span>
                </div>
              </div>

              {errorMsg && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs sm:text-sm"
                >
                  {errorMsg}
                </div>
              )}

              {/* STEP 1: ROLE SELECTION */}
              {formStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <label className="block text-xs sm:text-sm font-semibold text-zinc-300">
                    Select Role Level *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {LEADERSHIP_POSITIONS.map((pos) => {
                      const Icon = pos.icon;
                      const active = selectedRole === pos.id;
                      return (
                        <div
                          key={pos.id}
                          onClick={() => setSelectedRole(pos.id)}
                          className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                            active
                              ? "bg-[#c8f135]/10 border-[#c8f135] shadow-[0_0_20px_rgba(200,241,53,0.15)]"
                              : "bg-white/[0.03] border-white/[0.08] hover:border-white/[0.2]"
                          }`}
                        >
                          <div className={`p-2 rounded-xl border shrink-0 ${active ? "bg-[#c8f135] text-black border-[#c8f135]" : "bg-white/[0.05] text-zinc-400 border-white/[0.1]"}`}>
                            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                          <div>
                            <div className="text-xs sm:text-sm font-bold text-white">{pos.title}</div>
                            <div className="text-[11px] text-[#c8f135] font-semibold">{pos.scope}</div>
                            <div className="text-[11px] sm:text-xs text-zinc-400 mt-1 line-clamp-2">{pos.shortDesc}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-4 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/[0.08] mt-4 sm:mt-6">
                    <div className="text-[11px] sm:text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">Selected Role Highlights</div>
                    <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-3">{currentRoleInfo.fullDesc}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {currentRoleInfo.perks.map((p, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-zinc-400">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#c8f135] shrink-0" />
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => goToStep(2)}
                      className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#c8f135] text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-lime-400 transition-all cursor-pointer"
                    >
                      <span>Continue to Personal Details</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: PERSONAL & CAMPUS INFO */}
              {formStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {(
                      [
                        { key: "fullName", label: "Full Name", required: true, type: "text", placeholder: "e.g. Alex Sharma", autoComplete: "name" },
                        { key: "email", label: "Email Address", required: true, type: "email", placeholder: "alex@college.edu", autoComplete: "email" },
                        { key: "phone", label: "Phone / WhatsApp Number", required: true, type: "tel", placeholder: "+91 9876543210", autoComplete: "tel" },
                        { key: "state", label: "State", required: true, type: "text", placeholder: "e.g. Maharashtra, Karnataka", autoComplete: "address-level1" },
                        { key: "city", label: "City", required: true, type: "text", placeholder: "e.g. Mumbai, Bengaluru", autoComplete: "address-level2" },
                        { key: "college", label: "College / University Name", required: true, type: "text", placeholder: "e.g. IIT Bombay / VJTI", autoComplete: "organization" },
                        { key: "branch", label: "Branch / Major", required: false, type: "text", placeholder: "e.g. Computer Science, AI, Management", autoComplete: "off" },
                      ] as const
                    ).map((field) => {
                      const error = fieldErrors[field.key];
                      return (
                        <div key={field.key}>
                          <label
                            htmlFor={`lead-${field.key}`}
                            className="block text-xs font-semibold text-zinc-300 mb-1"
                          >
                            {field.label} {field.required && "*"}
                          </label>
                          <input
                            id={`lead-${field.key}`}
                            type={field.type}
                            placeholder={field.placeholder}
                            autoComplete={field.autoComplete}
                            required={field.required}
                            aria-invalid={Boolean(error)}
                            aria-describedby={error ? `lead-${field.key}-error` : undefined}
                            value={formData[field.key]}
                            onChange={(e) => updateField(field.key, e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl bg-black/40 border text-white text-base sm:text-sm focus:outline-none transition-colors ${
                              error
                                ? "border-red-500/70 focus:border-red-400"
                                : "border-white/[0.1] focus:border-[#c8f135]"
                            }`}
                          />
                          {error && (
                            <p
                              id={`lead-${field.key}-error`}
                              className="mt-1 text-[11px] text-red-400"
                            >
                              {error}
                            </p>
                          )}
                        </div>
                      );
                    })}

                    <div>
                      <label
                        htmlFor="lead-yearOfStudy"
                        className="block text-xs font-semibold text-zinc-300 mb-1"
                      >
                        Year of Study
                      </label>
                      <select
                        id="lead-yearOfStudy"
                        value={formData.yearOfStudy}
                        onChange={(e) => updateField("yearOfStudy", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/[0.1] text-white text-base sm:text-sm focus:border-[#c8f135] focus:outline-none transition-colors"
                      >
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                        <option value="Postgraduate / Recent Grad">Postgraduate / Recent Grad</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row justify-between gap-2.5 pt-4 sm:pt-6 border-t border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => goToStep(1)}
                      className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/[0.05] text-zinc-300 font-semibold text-xs sm:text-sm hover:bg-white/[0.1] transition-all cursor-pointer text-center"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => goToStep(3)}
                      className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#c8f135] text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-lime-400 transition-all cursor-pointer"
                    >
                      <span>Continue to Vision & Plan</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: LEADERSHIP VISION & PROPOSAL */}
              {formStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <label
                      htmlFor="lead-whyLead"
                      className="block text-xs font-semibold text-zinc-300 mb-1"
                    >
                      Why do you want to lead DevUp in your territory? *
                    </label>
                    <textarea
                      id="lead-whyLead"
                      rows={3}
                      required
                      placeholder="Share your drive, what motivates you to build community..."
                      aria-invalid={Boolean(fieldErrors.whyLead)}
                      aria-describedby={fieldErrors.whyLead ? "lead-whyLead-error" : undefined}
                      value={formData.whyLead}
                      onChange={(e) => updateField("whyLead", e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl bg-black/40 border text-white text-base sm:text-sm focus:outline-none transition-colors ${
                        fieldErrors.whyLead
                          ? "border-red-500/70 focus:border-red-400"
                          : "border-white/[0.1] focus:border-[#c8f135]"
                      }`}
                    />
                    {fieldErrors.whyLead && (
                      <p id="lead-whyLead-error" className="mt-1 text-[11px] text-red-400">
                        {fieldErrors.whyLead}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="lead-pastExperience"
                      className="block text-xs font-semibold text-zinc-300 mb-1"
                    >
                      Past Leadership / Community / Event Experience
                    </label>
                    <textarea
                      id="lead-pastExperience"
                      rows={2}
                      placeholder="Mention any tech clubs, hackathons, or projects you led..."
                      value={formData.pastExperience}
                      onChange={(e) => updateField("pastExperience", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/[0.1] text-white text-base sm:text-sm focus:border-[#c8f135] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="lead-first30DaysPlan"
                      className="block text-xs font-semibold text-zinc-300 mb-1"
                    >
                      First 30 Days Action Plan for your territory
                    </label>
                    <textarea
                      id="lead-first30DaysPlan"
                      rows={2}
                      placeholder="Briefly describe your strategy to recruit your team and launch your first event..."
                      value={formData.first30DaysPlan}
                      onChange={(e) => updateField("first30DaysPlan", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/[0.1] text-white text-base sm:text-sm focus:border-[#c8f135] focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label
                        htmlFor="lead-linkedinUrl"
                        className="block text-xs font-semibold text-zinc-300 mb-1"
                      >
                        LinkedIn Profile URL
                      </label>
                      {/* type="text" + inputMode: a bare type="url" input rejects
                          "linkedin.com/in/me" with a native tooltip; normalizeUrl adds
                          the scheme on submit instead. */}
                      <input
                        id="lead-linkedinUrl"
                        type="text"
                        inputMode="url"
                        autoComplete="url"
                        placeholder="linkedin.com/in/username"
                        value={formData.linkedinUrl}
                        onChange={(e) => updateField("linkedinUrl", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/[0.1] text-white text-base sm:text-sm focus:border-[#c8f135] focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="lead-portfolioUrl"
                        className="block text-xs font-semibold text-zinc-300 mb-1"
                      >
                        GitHub / Portfolio URL
                      </label>
                      <input
                        id="lead-portfolioUrl"
                        type="text"
                        inputMode="url"
                        placeholder="github.com/username"
                        value={formData.portfolioUrl}
                        onChange={(e) => updateField("portfolioUrl", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/[0.1] text-white text-base sm:text-sm focus:border-[#c8f135] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row justify-between gap-2.5 pt-4 sm:pt-6 border-t border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => goToStep(2)}
                      className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/[0.05] text-zinc-300 font-semibold text-xs sm:text-sm hover:bg-white/[0.1] transition-all cursor-pointer text-center"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#c8f135] text-black font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-lime-400 shadow-[0_0_30px_rgba(200,241,53,0.3)] transition-all cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? (
                        <span>Submitting Application...</span>
                      ) : (
                        <>
                          <span>SUBMIT APPLICATION NOW</span>
                          <Send className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </form>
          )}
        </div>
      </section>

      {/* FINAL CALL TO ACTION FOOTER BANNER - SPLIT CARD (TOP VIDEO, BOTTOM CONTENT) */}
      <section className="relative z-10 py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="rounded-2xl sm:rounded-3xl bg-white/[0.03] border border-[#c8f135]/40 overflow-hidden shadow-2xl my-2 sm:my-4">
          {/* Top Video Header */}
          <div className="relative h-64 sm:h-96 w-full overflow-hidden bg-black">
            <LazyVideo
              src={SHOWCASE_REELS[11].src}
              poster={reelPoster(11)}
              className="w-full h-full object-cover filter brightness-95"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-transparent to-black/30" />
            <div className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/70 border border-[#c8f135]/40 text-[#c8f135] text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" /> DevUp Leadership Call to Action
            </div>
          </div>

          {/* Bottom Content Body */}
          <div className="p-6 sm:p-12 bg-[#070709]">
            <h2 className="text-2xl sm:text-5xl font-extrabold font-syne text-white tracking-tight leading-tight mb-4 sm:mb-6">
              YOUR CAMPUS NEEDS A LEADER.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c8f135] via-emerald-300 to-cyan-300">
                YOUR CITY NEEDS A NETWORK.
              </span>
              <br />
              YOUR STATE NEEDS BUILDERS.
            </h2>

            <p className="text-lg sm:text-2xl font-bold text-[#c8f135] mb-6 sm:mb-8 font-syne">
              Will you be one of them?
            </p>

            <button
              onClick={() => scrollToForm()}
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3 sm:px-10 sm:py-4 rounded-xl sm:rounded-2xl bg-[#c8f135] text-black font-extrabold text-xs sm:text-base shadow-[0_0_40px_rgba(200,241,53,0.4)] hover:shadow-[0_0_60px_rgba(200,241,53,0.6)] hover:bg-lime-300 transition-all duration-300 cursor-pointer"
            >
              <span>APPLY TO LEAD DEVUP →</span>
            </button>
          </div>
        </div>
      </section>

      {/* LIGHTBOX MODAL FOR REAL COMMUNITY REELS WITH SOUND */}
      <AnimatePresence>
        {activeLightBoxReel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            role="dialog"
            aria-modal="true"
            aria-label={activeLightBoxReel.title}
            onClick={() => setActiveLightBoxReel(null)}
            className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-3 sm:p-4 cursor-pointer"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-md w-full aspect-[9/16] max-h-[85vh] rounded-2xl sm:rounded-3xl overflow-hidden border border-white/[0.2] bg-black shadow-2xl"
            >
              <video
                autoPlay
                controls
                playsInline
                className="w-full h-full object-cover"
                src={activeLightBoxReel.src}
              />
              <button
                type="button"
                autoFocus
                onClick={() => setActiveLightBoxReel(null)}
                aria-label="Close reel"
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2.5 sm:p-3 rounded-full bg-black/70 text-white hover:bg-black border border-white/[0.2] cursor-pointer"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LIGHTBOX MODAL FOR REAL COMMUNITY PHOTOS */}
      <AnimatePresence>
        {activeLightBoxPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            role="dialog"
            aria-modal="true"
            aria-label="DevUp community photo"
            onClick={() => setActiveLightBoxPhoto(null)}
            className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 cursor-pointer"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden border border-white/[0.2]"
            >
              <img
                src={activeLightBoxPhoto}
                alt="DevUp Real Community Atmosphere"
                className="w-full h-full object-contain max-h-[85vh]"
              />
              <button
                type="button"
                autoFocus
                onClick={() => setActiveLightBoxPhoto(null)}
                aria-label="Close photo"
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2.5 sm:p-3 rounded-full bg-black/70 text-white hover:bg-black border border-white/[0.2] cursor-pointer"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONTINUOUS MARQUEES — a calm ~29px/s drift.
          Duration is per-breakpoint because one loop covers a different distance at
          each card size (18 x 204px on mobile, 18 x 336px from sm up), and a single
          fixed duration would make the strip crawl on phones and race on desktop.
          To retune, change --marquee-duration only. */}
      <style jsx global>{`
        @keyframes marquee-fast {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-reverse-fast {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0%); }
        }
        .animate-marquee-fast, .animate-marquee-reverse-fast {
          --marquee-duration: 127s;
        }
        @media (min-width: 640px) {
          .animate-marquee-fast, .animate-marquee-reverse-fast {
            --marquee-duration: 209s;
          }
        }
        .animate-marquee-fast {
          animation: marquee-fast var(--marquee-duration) linear infinite;
        }
        .animate-marquee-reverse-fast {
          animation: marquee-reverse-fast var(--marquee-duration) linear infinite;
        }
        .animate-marquee-fast:hover, .animate-marquee-reverse-fast:hover {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-marquee-fast, .animate-marquee-reverse-fast {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
