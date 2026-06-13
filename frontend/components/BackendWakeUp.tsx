'use client'

import { useEffect, useState } from 'react'
import { pingBackend } from '@/lib/keepAlive'

export default function BackendWakeUp() {
  const [waking, setWaking] = useState(false)

  useEffect(() => {
    let pingInterval: NodeJS.Timeout

    async function checkBackend() {
      const alive = await pingBackend()

      if (!alive) {
        setWaking(true)
        let attempts = 0
        const retry = setInterval(async () => {
          attempts++
          const ok = await pingBackend()
          if (ok || attempts > 20) {
            clearInterval(retry)
            setWaking(false)
          }
        }, 3000)
      }

      // Keep-alive ping every 14 minutes
      pingInterval = setInterval(async () => {
        await pingBackend()
      }, 14 * 60 * 1000)
    }

    checkBackend()
    return () => clearInterval(pingInterval)
  }, [])

  if (!waking) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      background: '#111111',
      border: '1px solid rgba(200,241,53,0.2)',
      borderRadius: 100,
      padding: '10px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      fontFamily: 'Inter, sans-serif',
      fontSize: 13,
      color: '#a1a1a1',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    }}>
      <div style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: '#c8f135',
        animation: 'pulse 1s infinite',
      }} />
      Waking up server… first load takes ~30s
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
      `}</style>
    </div>
  )
}
