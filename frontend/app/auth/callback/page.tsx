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

    /**
     * Nothing on this screen may wait forever.
     *
     * Every await below is a network call, and when one of them stalled the
     * page simply span under "Signing you in..." with no error, no retry and
     * no way out. A bounded wait turns a stall into something the visitor can
     * act on.
     */
    const withTimeout = <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> =>
      Promise.race([
        promise,
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error(`${label} timed out`)), ms)
        ),
      ])

    const handleCallback = async () => {
      try {
        const supabase = createClient()

        /*
         * Exchange the one-time code ourselves when one is present.
         *
         * The client library also does this on its own when it detects a code
         * in the URL, and the two used to race: getSession() was called while
         * that exchange was still in flight, so it saw no session, and the
         * refreshSession() fallback then ran against a token the exchange was
         * still rotating. Doing it explicitly means there is one exchange and
         * we know when it finished. A code can only be spent once, so an
         * "already used" error here just means the library got there first —
         * that is a success, not a failure, and getSession() below confirms it.
         */
        const code = searchParams.get('code')
        if (code) {
          try {
            await withTimeout(supabase.auth.exchangeCodeForSession(code), 15000, 'Sign in')
          } catch {
            // Fall through — getSession() is the arbiter of whether we are in.
          }
        }

        const got = await withTimeout(supabase.auth.getSession(), 15000, 'Sign in')
        let session = got.data.session

        if (!session) {
          const refreshed = await withTimeout(
            supabase.auth.refreshSession(),
            15000,
            'Sign in'
          ).catch(() => null)
          session = refreshed?.data.session ?? null
        }

        if (!session) {
          setStatus('error')
          setErrorMsg('Authentication failed. Please try again.')
          setTimeout(() => router.push('/login'), 2000)
          return
        }

        await syncUser(session.access_token)
      } catch (err: any) {
        setStatus('error')
        setErrorMsg(
          /timed out/i.test(err?.message ?? '')
            ? 'Sign in is taking too long. Please try again.'
            : 'Something went wrong. Please try again.'
        )
        setTimeout(() => router.push('/login'), 2500)
      }
    }

    const syncUser = async (accessToken: string) => {
      setStatus('syncing')

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

        // The API can be cold on a free tier, so this gets a longer budget than
        // the auth calls — but still a budget.
        const controller = new AbortController()
        const abort = setTimeout(() => controller.abort(), 25000)

        const res = await fetch(`${apiUrl}/api/auth/google/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          signal: controller.signal,
        }).finally(() => clearTimeout(abort))

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
