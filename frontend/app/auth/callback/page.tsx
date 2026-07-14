'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Suspense } from 'react'

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const processed = useRef(false)
  const [status, setStatus] = useState<'loading' | 'syncing' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (processed.current) return
    processed.current = true

    const handleCallback = async () => {
      try {
        const supabase = createClient()

        // Wait for session from the OAuth redirect
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !session) {
          // Try exchanging code from URL if session isn't ready yet
          const { data: { session: refreshedSession }, error: refreshError } =
            await supabase.auth.refreshSession()

          if (refreshError || !refreshedSession) {
            setStatus('error')
            setErrorMsg('Authentication failed. Please try again.')
            setTimeout(() => router.push('/login'), 2000)
            return
          }

          // Use refreshed session
          await syncUser(refreshedSession.access_token)
          return
        }

        await syncUser(session.access_token)
      } catch {
        setStatus('error')
        setErrorMsg('Something went wrong. Please try again.')
        setTimeout(() => router.push('/login'), 2000)
      }
    }

    const syncUser = async (accessToken: string) => {
      setStatus('syncing')

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
        const res = await fetch(`${apiUrl}/api/auth/google/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Failed to sync user')
        }

        // Success — redirect to intended page or dashboard
        const redirect = searchParams.get('redirect') || '/dashboard'
        router.push(redirect)
        router.refresh()
      } catch (err: any) {
        setStatus('error')
        setErrorMsg(err.message || 'Failed to complete sign in')
        setTimeout(() => router.push('/login'), 2500)
      }
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      {/* Beacon */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 600,
          height: '60vh',
          background:
            'radial-gradient(ellipse, rgba(200,241,53,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
          position: 'relative',
          zIndex: 10,
        }}
      >
        {status === 'error' ? (
          <>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(239,68,68,0.1)',
                border: '2px solid rgba(239,68,68,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
              }}
            >
              ✕
            </div>
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 15,
                color: '#ef4444',
                textAlign: 'center',
              }}
            >
              {errorMsg}
            </p>
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 13,
                color: '#6b6b6b',
              }}
            >
              Redirecting to login...
            </p>
          </>
        ) : (
          <>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                border: '3px solid rgba(200,241,53,0.15)',
                borderTopColor: '#c8f135',
                animation: 'spin 0.7s linear infinite',
              }}
            />
            <div style={{ textAlign: 'center' }}>
              <p
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#ffffff',
                  marginBottom: 6,
                }}
              >
                {status === 'syncing' ? 'Setting up your account...' : 'Signing you in...'}
              </p>
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 13,
                  color: '#6b6b6b',
                }}
              >
                Please wait a moment
              </p>
            </div>
          </>
        )}
      </motion.div>
    </main>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            background: '#0a0a0a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: '2px solid rgba(200,241,53,0.2)',
              borderTopColor: '#c8f135',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  )
}
