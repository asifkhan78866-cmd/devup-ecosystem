'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { motion } from 'framer-motion'

/**
 * Social sign-in for Google, GitHub and LinkedIn.
 *
 * Talks to Supabase directly rather than through useAuth(), so the component
 * stays usable anywhere — including surfaces rendered outside AuthProvider.
 *
 * Still exported as GoogleLogin so the existing imports in the login page and
 * AuthModal keep working without changes.
 */

type Provider = 'google' | 'github' | 'linkedin_oidc'

interface SocialLoginProps {
  redirectTo?: string
  className?: string
}

const PROVIDER_OPTIONS: Record<Provider, Record<string, unknown>> = {
  google: { queryParams: { access_type: 'offline', prompt: 'consent' } },
  github: { scopes: 'read:user user:email' },
  linkedin_oidc: { scopes: 'openid profile email' },
}

const GoogleMark = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
)

const GithubMark = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="#e4e4e4" aria-hidden>
    <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3z" />
  </svg>
)

const LinkedInMark = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="#0A66C2" aria-hidden>
    <path d="M20.5 2h-17A1.5 1.5 0 0 0 2 3.5v17A1.5 1.5 0 0 0 3.5 22h17a1.5 1.5 0 0 0 1.5-1.5v-17A1.5 1.5 0 0 0 20.5 2zM8 19H5v-9h3v9zM6.5 8.7a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6zM19 19h-3v-4.4c0-1.1 0-2.5-1.5-2.5s-1.8 1.2-1.8 2.4V19h-3v-9h2.9v1.2h.05a3.2 3.2 0 0 1 2.9-1.6c3.1 0 3.65 2 3.65 4.7V19z" />
  </svg>
)

const Spinner = () => (
  <div
    style={{
      width: 18, height: 18, borderRadius: '50%',
      border: '2px solid rgba(255,255,255,0.1)',
      borderTopColor: '#c8f135',
      animation: 'spin 0.6s linear infinite',
    }}
  />
)

export default function GoogleLogin({ redirectTo, className }: SocialLoginProps) {
  const [pending, setPending] = useState<Provider | null>(null)
  const [error, setError] = useState('')

  const signIn = async (provider: Provider) => {
    if (pending) return
    setPending(provider)
    setError('')

    try {
      const supabase = createClient()
      const callbackUrl = `${window.location.origin}/auth/callback${
        redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ''
      }`

      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: callbackUrl, ...PROVIDER_OPTIONS[provider] },
      })

      if (authError) {
        // Most often the provider is not enabled in the Supabase dashboard.
        setError(
          /provider is not enabled/i.test(authError.message)
            ? `${labelFor(provider)} sign-in is not enabled yet. Enable it in Supabase → Authentication → Providers.`
            : authError.message
        )
        setPending(null)
      }
      // On success the browser is already navigating away.
    } catch {
      setError('Something went wrong. Please try again.')
      setPending(null)
    }
  }

  const baseButton = {
    height: 48,
    background: '#111111',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    fontFamily: 'Inter, sans-serif',
    fontSize: 15,
    fontWeight: 600,
    color: '#e4e4e4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    transition: 'border-color 0.15s, background 0.15s',
  } as const

  const hover = (e: React.MouseEvent<HTMLButtonElement>, on: boolean) => {
    if (pending) return
    e.currentTarget.style.borderColor = on ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)'
    e.currentTarget.style.background = on ? '#161616' : '#111111'
  }

  return (
    <div className={className}>
      {/* Google stays primary and full width — it is the most used path. */}
      <motion.button
        onClick={() => signIn('google')}
        disabled={pending !== null}
        whileHover={!pending ? { scale: 1.01 } : undefined}
        whileTap={!pending ? { scale: 0.98 } : undefined}
        onMouseEnter={(e) => hover(e, true)}
        onMouseLeave={(e) => hover(e, false)}
        style={{
          ...baseButton,
          width: '100%',
          cursor: pending ? 'not-allowed' : 'pointer',
          opacity: pending && pending !== 'google' ? 0.5 : 1,
        }}
      >
        {pending === 'google' ? <Spinner /> : <GoogleMark />}
        {pending === 'google' ? 'Connecting...' : 'Continue with Google'}
      </motion.button>

      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        {([
          ['github', 'GitHub', <GithubMark key="g" />],
          ['linkedin_oidc', 'LinkedIn', <LinkedInMark key="l" />],
        ] as const).map(([provider, label, icon]) => (
          <motion.button
            key={provider}
            onClick={() => signIn(provider as Provider)}
            disabled={pending !== null}
            whileHover={!pending ? { scale: 1.01 } : undefined}
            whileTap={!pending ? { scale: 0.98 } : undefined}
            onMouseEnter={(e) => hover(e, true)}
            onMouseLeave={(e) => hover(e, false)}
            aria-label={`Continue with ${label}`}
            style={{
              ...baseButton,
              flex: 1,
              fontSize: 14,
              cursor: pending ? 'not-allowed' : 'pointer',
              opacity: pending && pending !== provider ? 0.5 : 1,
            }}
          >
            {pending === provider ? <Spinner /> : icon}
            {pending === provider ? '...' : label}
          </motion.button>
        ))}
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: 12,
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 8,
            padding: '10px 14px',
            fontFamily: 'Inter, sans-serif',
            fontSize: 13,
            color: '#ef4444',
          }}
        >
          {error}
        </motion.div>
      )}
    </div>
  )
}

function labelFor(p: Provider) {
  return p === 'linkedin_oidc' ? 'LinkedIn' : p === 'github' ? 'GitHub' : 'Google'
}
