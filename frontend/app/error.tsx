'use client'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Route error:', error)
  }, [error])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      textAlign: 'center',
    }}>
      <div style={{
        fontFamily: 'Syne, sans-serif', fontSize: 64,
        fontWeight: 800, color: 'rgba(255,255,255,0.06)',
        marginBottom: 16,
      }}>
        ⚠
      </div>
      <h2 style={{
        fontFamily: 'Syne, sans-serif', fontSize: 24,
        fontWeight: 700, color: '#ffffff',
        marginBottom: 8,
      }}>
        Something went wrong loading this page.
      </h2>
      <p style={{
        fontFamily: 'Inter, sans-serif', fontSize: 14,
        color: '#6b6b6b', marginBottom: 24,
        maxWidth: 400,
      }}>
        This usually resolves on retry. If it keeps happening,
        try refreshing the whole page.
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={() => reset()}
          style={{
            padding: '10px 24px',
            background: '#c8f135', color: '#000',
            border: 'none', borderRadius: 10,
            fontFamily: 'Inter, sans-serif', fontSize: 14,
            fontWeight: 700, cursor: 'pointer',
          }}
        >
          Try Again
        </button>
        <button
          onClick={() => window.location.href = '/'}
          style={{
            padding: '10px 24px',
            background: 'transparent', color: '#a1a1a1',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, fontFamily: 'Inter, sans-serif',
            fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}
        >
          Go Home
        </button>
      </div>
    </div>
  )
}
