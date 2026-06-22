'use client'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, Globe2, Briefcase, Trophy, Grid2x2,
  Users, Hammer, Rocket, LayoutDashboard,
  LogIn, LogOut, X
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/AuthProvider'

const PRIMARY_TABS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/ecosystem', label: 'Ecosystem', icon: Globe2 },
  { href: '/careers', label: 'Careers', icon: Briefcase },
  { href: '/hackathons', label: 'Events', icon: Trophy },
]

const MORE_ITEMS = [
  { href: '/cofounders', label: 'Co-Founders', icon: Users, 
    desc: 'Find your match' },
  { href: '/build-with-devup', label: 'Build With Us', icon: Hammer,
    desc: '30+ services' },
  { href: '/apply', label: 'Apply', icon: Rocket,
    desc: 'Join Cohort 4' },
]

export default function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [moreOpen, setMoreOpen] = useState(false)

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  const isMoreActive = MORE_ITEMS.some(item => isActive(item.href))
    || pathname.startsWith('/dashboard')

  return (
    <>
      {/* Spacer so page content never sits behind the bar */}
      <div style={{ 
        height: 'calc(64px + env(safe-area-inset-bottom, 0px))',
      }} className="mobile-nav-spacer md:hidden" />

      {/* Bottom tab bar */}
      <nav style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        zIndex: 200,
        background: 'rgba(10,10,10,0.92)',
        backdropFilter: 'blur(24px) saturate(180%)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      className="mobile-bottom-nav md:hidden flex"
      >
        {PRIMARY_TABS.map(tab => {
          const active = isActive(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                padding: '10px 0 8px',
                textDecoration: 'none',
                position: 'relative',
              }}
            >
              {active && (
                <motion.div
                  layoutId="bottomNavActiveDot"
                  style={{
                    position: 'absolute', top: 4,
                    width: 4, height: 4, borderRadius: '50%',
                    background: '#c8f135',
                  }}
                  transition={{ duration: 0.25, ease: [0.16,1,0.3,1] }}
                />
              )}
              <tab.icon
                size={22}
                strokeWidth={1.75}
                color={active ? '#c8f135' : '#6b6b6b'}
              />
              <span style={{
                fontFamily: 'Inter',
                fontSize: 10.5,
                fontWeight: active ? 600 : 500,
                color: active ? '#ffffff' : '#6b6b6b',
                letterSpacing: '-0.01em',
              }}>
                {tab.label}
              </span>
            </Link>
          )
        })}

        {/* More tab */}
        <button
          onClick={() => setMoreOpen(true)}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            padding: '10px 0 8px',
            background: 'none',
            border: 'none',
            position: 'relative',
          }}
        >
          {isMoreActive && (
            <div style={{
              position: 'absolute', top: 4,
              width: 4, height: 4, borderRadius: '50%',
              background: '#c8f135',
            }} />
          )}
          <Grid2x2
            size={22}
            strokeWidth={1.75}
            color={isMoreActive ? '#c8f135' : '#6b6b6b'}
          />
          <span style={{
            fontFamily: 'Inter',
            fontSize: 10.5,
            fontWeight: isMoreActive ? 600 : 500,
            color: isMoreActive ? '#ffffff' : '#6b6b6b',
          }}>
            More
          </span>
        </button>
      </nav>

      {/* More sheet */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.6)',
                zIndex: 250,
              }}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.35, ease: [0.16,1,0.3,1] }}
              style={{
                position: 'fixed',
                bottom: 0, left: 0, right: 0,
                zIndex: 251,
                background: '#111111',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px 20px 0 0',
                padding: '20px 20px calc(24px + env(safe-area-inset-bottom, 0px))',
              }}
            >
              {/* Drag handle + close */}
              <div style={{
                display: 'flex', justifyContent: 'center',
                marginBottom: 16,
              }}>
                <div style={{
                  width: 36, height: 4, borderRadius: 2,
                  background: 'rgba(255,255,255,0.15)',
                }} />
              </div>

              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 20,
              }}>
                <span style={{
                  fontFamily: 'Syne', fontSize: 18,
                  fontWeight: 700, color: '#ffffff',
                }}>
                  More
                </span>
                <button
                  onClick={() => setMoreOpen(false)}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: 'none', borderRadius: 8,
                    width: 32, height: 32,
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', cursor: 'pointer',
                  }}
                >
                  <X size={16} color="#a1a1a1" />
                </button>
              </div>

              {/* Page links grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 10, marginBottom: 20,
              }}>
                {MORE_ITEMS.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    style={{
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', textAlign: 'center',
                      gap: 8, padding: '16px 8px',
                      background: '#0a0a0a',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 12,
                      textDecoration: 'none',
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: 'rgba(200,241,53,0.08)',
                      border: '1px solid rgba(200,241,53,0.15)',
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <item.icon size={17} color="#c8f135" strokeWidth={1.75} />
                    </div>
                    <span style={{
                      fontFamily: 'Inter', fontSize: 12,
                      fontWeight: 600, color: '#ffffff',
                    }}>
                      {item.label}
                    </span>
                    <span style={{
                      fontFamily: 'Inter', fontSize: 10,
                      color: '#6b6b6b',
                    }}>
                      {item.desc}
                    </span>
                  </Link>
                ))}
              </div>

              <div style={{
                height: 1, background: 'rgba(255,255,255,0.06)',
                marginBottom: 16,
              }} />

              {/* Account row */}
              {user ? (
                <div style={{ display: 'flex', gap: 10 }}>
                  <Link
                    href="/dashboard"
                    onClick={() => setMoreOpen(false)}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: 8,
                      padding: '12px 0',
                      background: 'rgba(200,241,53,0.1)',
                      border: '1px solid rgba(200,241,53,0.2)',
                      borderRadius: 10,
                      fontFamily: 'Inter', fontSize: 13,
                      fontWeight: 600, color: '#c8f135',
                      textDecoration: 'none',
                    }}
                  >
                    <LayoutDashboard size={15} />
                    Dashboard
                  </Link>
                  <button
                    onClick={() => { signOut(); setMoreOpen(false) }}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: 8,
                      padding: '12px 0',
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 10,
                      fontFamily: 'Inter', fontSize: 13,
                      fontWeight: 500, color: '#a1a1a1',
                    }}
                  >
                    <LogOut size={15} />
                    Sign out
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMoreOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 8,
                    padding: '12px 0', width: '100%',
                    background: '#c8f135', color: '#000',
                    borderRadius: 10, fontFamily: 'Inter',
                    fontSize: 14, fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  <LogIn size={15} />
                  Sign in
                </Link>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
