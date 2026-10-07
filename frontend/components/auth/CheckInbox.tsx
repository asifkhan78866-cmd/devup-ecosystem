'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MailCheck } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

/**
 * Shown after signup. The account is unusable until the owner of the address
 * follows the emailed link, so there is nothing to sign in to yet — only a way
 * to ask for the link again.
 */
export default function CheckInbox({ email }: { email: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')

  const resend = async () => {
    setState('sending')
    try {
      await fetch(`${API}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
    } finally {
      // Same answer whatever happened: the server never says whether an
      // address has an account.
      setState('sent')
    }
  }

  return (
    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div
        style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'rgba(200,241,53,0.08)', border: '1px solid rgba(200,241,53,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <MailCheck size={26} color="#c8f135" />
      </div>
      <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, color: '#fff', margin: 0 }}>
        Check your inbox
      </h1>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9a9a9a', lineHeight: 1.6, margin: 0 }}>
        We sent a link to <strong style={{ color: '#e4e4e4' }}>{email}</strong>. Open it to confirm
        your email and set your password. The link expires in 24 hours.
      </p>
      <button
        type="button"
        onClick={resend}
        disabled={state !== 'idle'}
        style={{
          background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
          padding: '10px 16px', color: state === 'idle' ? '#e4e4e4' : '#6b6b6b',
          fontFamily: 'Inter, sans-serif', fontSize: 14, cursor: state === 'idle' ? 'pointer' : 'default',
        }}
      >
        {state === 'idle' ? 'Send the link again' : state === 'sending' ? 'Sending…' : 'If the address needs one, a new link is on its way'}
      </button>
      <Link href="/login" style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#6b6b6b' }}>
        Back to sign in
      </Link>
    </div>
  )
}
