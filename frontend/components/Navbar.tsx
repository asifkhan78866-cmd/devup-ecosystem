"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

const NAV_LINKS = [
  { name: "Ecosystem", path: "/ecosystem" },
  { name: "Careers", path: "/careers" },
  { name: "Hackathons", path: "/hackathons" },
  { name: "Co-Founders", path: "/cofounders" },
  { name: "Build With Us", path: "/build-with-devup", hasMegaMenu: true },
  { name: "Apply", path: "/apply" },
];

const MEGA_MENU_CATEGORIES = [
  { title: "Tech & Infra", desc: "GPUs, Backend, Cloud", icon: "Cpu" },
  { title: "AI & Data", desc: "Agents, RAG, Analytics", icon: "Brain" },
  { title: "Creative", desc: "UI/UX, Video, Decks", icon: "Palette" },
  { title: "Marketing", desc: "Ads, Social, SEO", icon: "TrendingUp" },
  { title: "Legal", desc: "Incorporation, Patents", icon: "Scale" },
  { title: "Mission", desc: "Mentors, VCs, Events", icon: "Compass" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled
          ? "bg-black/40 backdrop-blur-xl border-b border-white/5 py-3"
          : "bg-transparent border-transparent py-5"
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="font-heading text-2xl font-bold tracking-tight z-50">
          Dev<span className="text-gradient">Up</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.path;

            return (
              <div key={link.name} className="relative group">
                <Link
                  href={link.path}
                  className="relative text-sm font-medium text-[var(--text-primary)] transition-colors hover:text-white flex items-center gap-1 py-4"
                >
                  {link.name}
                  {/* Hover underline */}
                  <span className="absolute bottom-3 left-0 w-full h-[2px] bg-[var(--accent-primary)] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out" />
                  {/* Active dot */}
                  {isActive && (
                    <span className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
                  )}
                </Link>

                {/* Mega Menu Dropdown */}
                {link.hasMegaMenu && (
                  <div className="absolute top-[100%] left-1/2 -translate-x-1/2 w-[600px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                    <div className="mt-2 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl p-6">
                      <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                        {MEGA_MENU_CATEGORIES.map((cat, idx) => (
                          <Link href="/build-with-devup" key={idx} className="group/item flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/60 group-hover/item:bg-[var(--accent-primary)]/20 group-hover/item:text-[var(--accent-primary)] transition-colors">
                              {/* Using simple div placeholders if dynamic icons aren't perfectly aligned, but we know these categories map directly to our design */}
                              <span className="text-xl">✨</span>
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-white group-hover/item:text-[var(--accent-primary)] transition-colors">{cat.title}</h4>
                              <p className="text-xs text-white/50 mt-1">{cat.desc}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                      <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center">
                        <p className="text-xs text-white/50">Everything your startup needs.</p>
                        <Link href="/build-with-devup" className="text-xs text-[var(--accent-primary)] font-bold flex items-center gap-1 hover:underline">
                          View all 30+ services <Menu size={12} />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* CTA Button */}
        <div className="hidden md:block">
          <Link href="/apply">
            <Button variant="primary" size="sm" withShimmer>
              Join Ecosystem
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden z-50 p-2 -mr-2 text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Mobile Fullscreen Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-40 flex flex-col items-center justify-center gap-8"
            >
              {NAV_LINKS.map((link, idx) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * idx }}
                >
                  <Link
                    href={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-3xl font-heading font-bold hover:text-[var(--accent-primary)] transition-colors"
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-4"
              >
                <Button variant="primary" size="lg" withShimmer onClick={() => setMobileMenuOpen(false)}>
                  Join Ecosystem
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
