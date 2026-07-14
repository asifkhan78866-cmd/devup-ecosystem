'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, ArrowRight } from 'lucide-react'
import { useAuthGate } from '@/hooks/useAuthGate'
import { useAuth } from '@/lib/auth/AuthProvider'
import GoogleLogin from './google-login'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

export default function AuthModal() {
  const { isOpen, closeAuthGate } = useAuthGate()
  const { user } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  // Close modal when authenticated
  useEffect(() => {
    if (user && isOpen) {
      closeAuthGate()
    }
  }, [user, isOpen, closeAuthGate])

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen || user) return null

  const benefits = [
    'Connect with Founders',
    'Apply to Startups',
    'AI Startup Analysis',
    'Founder Messaging',
    'Internship Opportunities',
    'Exclusive Community'
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={closeAuthGate}
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
            }}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '850px',
              background: 'rgba(17,17,17,0.85)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '32px',
              boxShadow: '0 40px 100px -20px rgba(0,0,0,0.8), 0 0 40px rgba(200,241,53,0.05)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'row',
              maxHeight: '90vh',
            }}
            className="flex-col md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={closeAuthGate}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.05)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#888',
                cursor: 'pointer',
                zIndex: 10,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.color = '#888';
              }}
            >
              <X size={20} />
            </button>

            {/* Left side - Login options */}
            <div style={{
              flex: '1.2',
              padding: '48px 40px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              borderRight: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{ marginBottom: 32 }}>
                <span style={{
                  fontFamily: 'var(--font-syne), sans-serif',
                  fontSize: 28, fontWeight: 800,
                  display: 'inline-block', marginBottom: 16
                }}>
                  <span style={{ color: '#ffffff' }}>Dev</span>
                  <span style={{ color: '#c8f135' }}>Up</span>
                </span>
                <h2 style={{
                  fontFamily: 'var(--font-syne), sans-serif',
                  fontSize: 32, fontWeight: 800,
                  color: '#ffffff', marginBottom: 12,
                  lineHeight: 1.1
                }}>
                  Join the DevUp Ecosystem
                </h2>
                <p style={{
                  fontFamily: 'var(--font-inter), sans-serif',
                  fontSize: 15, color: '#888888',
                  lineHeight: 1.5
                }}>
                  Connect with founders, startups, mentors and unlock exclusive ecosystem features.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <GoogleLogin redirectTo={pathname} className="w-full" />
                
                <button
                  onClick={() => {
                    closeAuthGate();
                    router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
                  }}
                  style={{
                    width: '100%',
                    height: 48,
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 10,
                    fontFamily: 'var(--font-inter), sans-serif',
                    fontSize: 15,
                    fontWeight: 600,
                    color: '#e4e4e4',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                  }}
                >
                  Continue with Email
                </button>
              </div>

              <div style={{
                marginTop: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontFamily: 'var(--font-inter), sans-serif',
                fontSize: 14,
                color: '#6b6b6b'
              }}>
                <span>Don't have an account?</span>
                <button
                  onClick={() => {
                    closeAuthGate();
                    router.push('/signup');
                  }}
                  style={{
                    background: 'none', border: 'none',
                    color: '#c8f135', fontWeight: 600,
                    cursor: 'pointer', padding: 0
                  }}
                >
                  Create Account
                </button>
              </div>

              <div style={{
                marginTop: 'auto',
                paddingTop: 32,
                fontFamily: 'var(--font-inter), sans-serif',
                fontSize: 12,
                color: '#555',
                textAlign: 'center'
              }}>
                By joining, you agree to our <a href="#" style={{ color: '#888', textDecoration: 'none' }}>Terms</a> and <a href="#" style={{ color: '#888', textDecoration: 'none' }}>Privacy Policy</a>.
              </div>
            </div>

            {/* Right side - Benefits */}
            <div className="hidden md:flex" style={{
              flex: '1',
              background: 'linear-gradient(135deg, rgba(200,241,53,0.03) 0%, rgba(200,241,53,0.08) 100%)',
              padding: '48px 40px',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Background accent */}
              <div style={{
                position: 'absolute',
                top: '-50%', left: '50%',
                width: '200%', height: '200%',
                background: 'radial-gradient(circle at center, rgba(200,241,53,0.1) 0%, transparent 60%)',
                transform: 'translateX(-50%)',
                pointerEvents: 'none'
              }} />

              <h3 style={{
                fontFamily: 'var(--font-syne), sans-serif',
                fontSize: 20, fontWeight: 700,
                color: '#ffffff', marginBottom: 24,
                position: 'relative'
              }}>
                Unlock Premium Features
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'relative' }}>
                {benefits.map((benefit, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + (i * 0.1) }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12
                    }}
                  >
                    <div style={{
                      width: 24, height: 24,
                      borderRadius: '50%',
                      background: 'rgba(200,241,53,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#c8f135'
                    }}>
                      <CheckCircle2 size={14} />
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-inter), sans-serif',
                      fontSize: 15, fontWeight: 500,
                      color: '#e4e4e4'
                    }}>
                      {benefit}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
