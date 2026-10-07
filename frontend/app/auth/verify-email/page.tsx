'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import CheckInbox from '@/components/auth/CheckInbox'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

/**
 * The token, taken from the fragment once per page load. Wiping the fragment
 * is destructive, so the token is kept here rather than in component state:
 * the page can be re-rendered or remounted (React re-runs effects in
 * development; the site layout remounts pages behind its intro) and must still
 * have it afterwards.
 */
let capturedToken: string | null = null
function takeToken() {
  const fromHash = new URLSearchParams(window.location.hash.slice(1)).get('token')
  if (fromHash) {
    capturedToken = fromHash
    window.history.replaceState(null, '', window.location.pathname)
  }
  return capturedToken
}

/**
 * Lands from the verification email.
 *
 * The token arrives in the URL fragment, which browsers never send to a server,
 * and is wiped from the address bar the moment it is read so it does not linger
 * in history or a shared screenshot. Whoever opens the link owns the inbox, so
 * they set the password here — which is what locks out anyone who signed up
 * with this address before them.
 */
export default function VerifyEmailPage() {
  const [token, setToken] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [status, setStatus] = useState<'ready' | 'submitting' | 'done' | 'invalid'>('ready')
  const [error, setError] = useState('')
  const [resendEmail, setResendEmail] = useState('')
  const [resendTo, setResendTo] = useState('')

  useEffect(() => {
    const t = takeToken()
    if (t) setToken(t)
    else setStatus('invalid')
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) return setError('Password must be at least 8 characters')
    if (password !== confirm) return setError('Passwords do not match')

    setStatus('submitting')
    try {
      const res = await fetch(`${API}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const body = await res.json().catch(() => ({}))
      if (res.ok) {
        capturedToken = null
        setToken(null)
        setPassword('')
        setConfirm('')
        return setStatus('done')
      }
      if (body.code === 'INVALID_VERIFICATION_LINK') {
        capturedToken = null
        setToken(null)
        return setStatus('invalid')
      }
      setError(body.error || body.message || 'Something went wrong. Please try again.')
      setStatus('ready')
    } catch {
      setError('Something went wrong. Please try again.')
      setStatus('ready')
    }
  }

  const input = {
    width: '100%', background: '#111111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
    padding: '12px 16px', fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#e4e4e4', outline: 'none',
    boxSizing: 'border-box' as const,
  }
  const heading = { fontFamily: 'Syne, sans-serif', fontSize: 24, color: '#fff', margin: '0 0 8px' }
  const text = { fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9a9a9a', lineHeight: 1.6, margin: '0 0 20px' }
  const button = {
    width: '100%', background: '#c8f135', color: '#0a0a0a', border: 'none', borderRadius: 10, padding: '12px 16px',
    fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, cursor: 'pointer',
  }

  let body: React.ReactNode
  if (resendTo) {
    body = <CheckInbox email={resendTo} />
  } else if (status === 'done') {
    body = (
      <>
        <h1 style={heading}>Email confirmed</h1>
        <p style={text}>Your account is ready. Sign in with the password you just set.</p>
        <Link href="/login" style={{ ...button, display: 'block', textAlign: 'center', textDecoration: 'none' }}>
          Sign in
        </Link>
      </>
    )
  } else if (status === 'invalid') {
    body = (
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          const to = resendEmail.trim().toLowerCase()
          if (!to) return
          try {
            await fetch(`${API}/api/auth/resend-verification`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: to }),
            })
          } finally {
            // Same screen whatever the answer: the server never says whether
            // an address has an account.
            setResendTo(to)
          }
        }}
      >
        <h1 style={heading}>This link has expired</h1>
        <p style={text}>Links work once and expire after 24 hours. Enter your email and we will send a new one.</p>
        <input
          type="email" required placeholder="you@example.com" value={resendEmail}
          onChange={(e) => setResendEmail(e.target.value)} style={{ ...input, marginBottom: 12 }}
        />
        <button type="submit" style={button}>Send a new link</button>
      </form>
    )
  } else {
    body = (
      <form onSubmit={submit}>
        <h1 style={heading}>Confirm your email</h1>
        <p style={text}>Set the password for your DevUp account to finish.</p>
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <input
            type={show ? 'text' : 'password'} autoComplete="new-password" placeholder="Password (8+ characters)"
            value={password} onChange={(e) => setPassword(e.target.value)} style={input}
          />
          <button
            type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6b6b6b', cursor: 'pointer' }}
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <input
          type={show ? 'text' : 'password'} autoComplete="new-password" placeholder="Confirm password"
          value={confirm} onChange={(e) => setConfirm(e.target.value)} style={{ ...input, marginBottom: 12 }}
        />
        {error && (
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#ef4444', margin: '0 0 12px' }}>{error}</p>
        )}
        <button type="submit" disabled={status === 'submitting' || !token} style={{ ...button, opacity: status === 'submitting' ? 0.6 : 1 }}>
          {status === 'submitting' ? 'Confirming…' : 'Confirm email'}
        </button>
      </form>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>{body}</div>
    </main>
  )
}
