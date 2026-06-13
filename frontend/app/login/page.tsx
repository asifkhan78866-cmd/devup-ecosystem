'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

import { Suspense } from 'react'

function LoginContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    const result = await signIn(email, password)
    
    if (result.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    background: '#111111',
    border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: 10,
    padding: '12px 16px',
    fontFamily: 'Inter, sans-serif',
    fontSize: 15,
    color: '#e4e4e4',
    outline: 'none',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box' as const,
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      {/* Beacon background */}
      <div style={{
        position: 'fixed',
        top: 0, left: '50%',
        transform: 'translateX(-50%)',
        width: 600, height: '60vh',
        background: 'radial-gradient(ellipse, rgba(200,241,53,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16,1,0.3,1] }}
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#111111',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          padding: 40,
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 24, fontWeight: 800,
            }}>
              <span style={{ color: '#ffffff' }}>Dev</span>
              <span style={{ color: '#c8f135' }}>Up</span>
            </span>
          </Link>
        </div>

        {/* Header */}
        <h1 style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 28, fontWeight: 800,
          color: '#ffffff', marginBottom: 8,
          textAlign: 'center',
        }}>
          Welcome back.
        </h1>
        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 14, color: '#6b6b6b',
          textAlign: 'center', marginBottom: 32,
        }}>
          Sign in to your DevUp account.
        </p>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 10, padding: '12px 16px',
            marginBottom: 20,
            fontFamily: 'Inter', fontSize: 13,
            color: '#ef4444',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={{
              fontFamily: 'Inter', fontSize: 12,
              color: '#6b6b6b', marginBottom: 6,
              display: 'block',
            }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@startup.com"
              required
              style={inputStyle}
              onFocus={e => {
                e.target.style.borderColor = 'rgba(200,241,53,0.4)'
                e.target.style.boxShadow = '0 0 0 3px rgba(200,241,53,0.08)'
              }}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(255,255,255,0.08)'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24, position: 'relative' }}>
            <label style={{
              fontFamily: 'Inter', fontSize: 12,
              color: '#6b6b6b', marginBottom: 6,
              display: 'block',
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ ...inputStyle, paddingRight: 48 }}
                onFocus={e => {
                  e.target.style.borderColor = 'rgba(200,241,53,0.4)'
                  e.target.style.boxShadow = '0 0 0 3px rgba(200,241,53,0.08)'
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.08)'
                  e.target.style.boxShadow = 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 14,
                  top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  color: '#6b6b6b', cursor: 'pointer',
                  padding: 4,
                }}
              >
                {showPassword
                  ? <EyeOff size={16} />
                  : <Eye size={16} />
                }
              </button>
            </div>
            <Link
              href="/forgot-password"
              style={{
                fontFamily: 'Inter', fontSize: 12,
                color: '#6b6b6b', textDecoration: 'none',
                float: 'right', marginTop: 6,
              }}
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', height: 48,
              background: loading ? '#6b6b6b' : '#c8f135',
              color: '#000000', border: 'none',
              borderRadius: 10,
              fontFamily: 'Inter', fontSize: 15,
              fontWeight: 700, cursor: loading
                ? 'not-allowed'
                : 'pointer',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8,
              transition: 'opacity 0.15s',
              clear: 'both',
            }}
          >
            {loading ? 'Signing in...' : (
              <>
                Sign In
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: 12, margin: '24px 0',
        }}>
          <div style={{ flex: 1, height: 1,
            background: 'rgba(255,255,255,0.06)' }} />
          <span style={{ fontFamily: 'Inter',
            fontSize: 12, color: '#3d3d3d' }}>
            OR
          </span>
          <div style={{ flex: 1, height: 1,
            background: 'rgba(255,255,255,0.06)' }} />
        </div>

        {/* Sign up link */}
        <p style={{
          textAlign: 'center',
          fontFamily: 'Inter', fontSize: 14,
          color: '#6b6b6b',
        }}>
          Don't have an account?{' '}
          <Link
            href="/signup"
            style={{ color: '#c8f135', textDecoration: 'none',
              fontWeight: 600 }}
          >
            Sign up free
          </Link>
        </p>
      </motion.div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0a0a0a' }}></div>}>
      <LoginContent />
    </Suspense>
  )
}
