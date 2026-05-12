"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Menu, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { name: "Ecosystem", href: "/ecosystem" },
  { name: "About", href: "/about" },
  { name: "Careers", href: "/careers" },
  { name: "Events", href: "/events" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent",
        isScrolled ? "glass border-white/10 py-3" : "bg-transparent py-5"
      )}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-bold text-xl group-hover:scale-105 transition-transform">
              D
            </div>
            <span className="font-bold text-xl tracking-tight text-white">
              DevUp
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-white/70 hover:text-white transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-white hover:text-white/80 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/apply"
              className="group relative inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-medium text-black bg-white rounded-full overflow-hidden transition-transform hover:scale-105"
            >
              <span>Join Ecosystem</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute top-full left-0 right-0 glass border-b border-white/10 p-4 md:hidden flex flex-col gap-4 shadow-2xl"
        >
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-lg font-medium text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          <div className="h-px bg-white/10 w-full my-2" />
          <Link
            href="/login"
            className="text-lg font-medium text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            Log in
          </Link>
          <Link
            href="/apply"
            className="flex items-center justify-center w-full py-3 mt-2 text-black bg-white rounded-xl font-medium"
            onClick={() => setMobileMenuOpen(false)}
          >
            Join Ecosystem
          </Link>
        </motion.div>
      )}
    </header>
  );
}
