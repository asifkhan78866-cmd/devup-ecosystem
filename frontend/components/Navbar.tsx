"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useAuth } from '@/lib/auth/AuthProvider';
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe2, Briefcase, Trophy, Users, Sparkles, Rocket,
  LayoutDashboard, LogIn, LogOut
} from "lucide-react";

const navLinks = [
  { href: '/ecosystem', label: 'Ecosystem', icon: Globe2 },
  { href: '/careers', label: 'Careers', icon: Briefcase },
  { href: '/hackathons', label: 'Hackathons', icon: Trophy },
  { href: '/cofounders', label: 'Co-Founders', icon: Users },
  { href: '/build-with-devup', label: 'Build With Us', icon: Sparkles },
  { href: '/apply', label: 'Apply', icon: Rocket },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { user, signOut, loading } = useAuth();
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className="desktop-navbar"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: 72, width: '100%', zIndex: 100,
        background: scrolled ? 'rgba(10,10,10,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px'
      }}
    >
      {/* Left: Logo */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
        <Link href="/" style={{
          textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <div className="nav-logo-image" style={{ position: 'relative' }}>
            <Image 
              src="/images/devup-logo.png" 
              alt="DevUp Logo" 
              width={896} 
              height={558} 
              priority
              style={{ objectFit: 'contain', width: 'auto', height: '100%' }}
            />
          </div>
          <div style={{
            fontFamily: 'var(--font-syne), Syne, sans-serif',
            fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em',
            display: 'flex', alignItems: 'center'
          }}>
            <span style={{ color: '#ffffff' }}>Dev</span>
            <span style={{ color: '#c8f135' }}>Up</span>
          </div>
        </Link>
      </div>

      {/* Middle: Desktop Nav Links */}
      <nav className="desktop-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 32, justifyContent: 'center' }}>
        {navLinks.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
          return (
            <Link key={link.href} href={link.href} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 0',
              fontFamily: 'var(--font-inter), Inter, sans-serif', fontSize: 14, fontWeight: 500,
              color: isActive ? '#ffffff' : '#888888',
              textDecoration: 'none',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = '#e4e4e4';
                const iconElement = e.currentTarget.querySelector('svg');
                if (iconElement) iconElement.style.color = '#e4e4e4';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = '#888888';
                const iconElement = e.currentTarget.querySelector('svg');
                if (iconElement) iconElement.style.color = '#888888';
              }
            }}
            >
              <link.icon size={16} 
                color={isActive ? '#c8f135' : 'currentColor'} 
                strokeWidth={1.75} 
                style={{ transition: 'color 0.2s ease, transform 0.2s ease' }}
              />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Right: Auth */}
      <div className="desktop-nav-links" style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16 }}>
        {loading ? null : user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontFamily: 'var(--font-inter), sans-serif', fontSize: 13, fontWeight: 500, color: '#888888' }}>
              {user.name.split(' ')[0]}
            </span>
            <Link href="/dashboard" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 18px', background: 'rgba(200,241,53,0.08)',
              border: '1px solid rgba(200,241,53,0.2)', borderRadius: 10,
              color: '#c8f135', fontFamily: 'var(--font-inter), sans-serif', fontSize: 13,
              fontWeight: 600, textDecoration: 'none',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(200,241,53,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(200,241,53,0.08)';
            }}
            >
              <LayoutDashboard size={14} strokeWidth={2} />
              Dashboard
            </Link>
            <button onClick={signOut} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 18px', background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
              color: '#888888', fontFamily: 'var(--font-inter), sans-serif', fontSize: 13,
              fontWeight: 500, cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#888888';
            }}
            >
              <LogOut size={14} strokeWidth={2} />
              Sign out
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 18px', background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
              color: '#a1a1a1', fontFamily: 'var(--font-inter), sans-serif', fontSize: 13,
              fontWeight: 500, textDecoration: 'none',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#a1a1a1';
            }}
            >
              <LogIn size={14} strokeWidth={2} />
              Sign in
            </Link>
            <Link href="/signup" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 20px', background: '#c8f135', color: '#000000',
              borderRadius: 10, fontFamily: 'var(--font-inter), sans-serif', fontSize: 13,
              fontWeight: 700, textDecoration: 'none',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#d4f53f';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#c8f135';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            >
              Join Ecosystem
            </Link>
          </div>
        )}
      </div>

      {/* Mobile Auth CTA (visible only below 1024px) */}
      <div className="mobile-nav-auth">
        {loading ? null : user ? (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}
              style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'rgba(200,241,53,0.15)', border: '1px solid rgba(200,241,53,0.3)',
                color: '#c8f135', fontFamily: 'Inter', fontSize: 12, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', padding: 0
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </button>
            <AnimatePresence>
              {mobileDropdownOpen && (
                <>
                  <div
                    onClick={() => setMobileDropdownOpen(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 101 }}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: 'absolute', top: 36, right: 0,
                      background: '#111111', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 12, padding: 8, minWidth: 160, zIndex: 102,
                      display: 'flex', flexDirection: 'column', gap: 4,
                      boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                    }}
                  >
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileDropdownOpen(false)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '10px 12px', borderRadius: 8,
                        background: 'rgba(200,241,53,0.1)', color: '#c8f135',
                        fontFamily: 'Inter', fontSize: 13, fontWeight: 600,
                        textDecoration: 'none'
                      }}
                    >
                      <LayoutDashboard size={14} /> Dashboard
                    </Link>
                    <button
                      onClick={() => { signOut(); setMobileDropdownOpen(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '10px 12px', background: 'transparent', border: 'none',
                        color: '#a1a1a1', fontFamily: 'Inter', fontSize: 13,
                        cursor: 'pointer', textAlign: 'left', borderRadius: 8
                      }}
                    >
                      <LogOut size={14} /> Sign out
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <Link href="/signup" style={{
            padding: '6px 12px', background: '#c8f135', color: '#000000',
            borderRadius: 999, fontFamily: 'Inter', fontSize: 12,
            fontWeight: 700, textDecoration: 'none'
          }}>
            Join
          </Link>
        )}
      </div>

      <style jsx>{`
        .mobile-nav-auth {
          display: none;
        }
        .nav-logo-image {
          height: 36px;
        }
        @media (max-width: 1023px) {
          .nav-logo-image {
            height: 28px;
          }
          .desktop-nav-links {
            display: none !important;
          }
          .mobile-nav-auth {
            display: block !important;
          }
          .desktop-navbar {
            padding: 0 16px !important;
          }
        }
      `}</style>
    </header>
  );
}
