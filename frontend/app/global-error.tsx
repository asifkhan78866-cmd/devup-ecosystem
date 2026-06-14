'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body style={{
        background: '#0a0a0a', margin: 0,
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh',
        fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <h2 style={{ marginBottom: 16 }}>
            Something went wrong.
          </h2>
          <button
            onClick={() => reset()}
            style={{
              padding: '10px 24px', background: '#c8f135',
              color: '#000', border: 'none', borderRadius: 10,
              fontWeight: 700, cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  )
}
