'use client'

import { useAuth } from '@/lib/auth/AuthProvider'
import { useAuthGate } from '@/hooks/useAuthGate'
import { ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { motion } from 'framer-motion'

interface ProtectedContentProps {
  children: ReactNode
  blurRadius?: number
  message?: string
}

export default function ProtectedContent({ 
  children, 
  blurRadius = 12,
  message = "Unlock to Continue" 
}: ProtectedContentProps) {
  const { user, loading } = useAuth()
  const { openAuthGate } = useAuthGate()

  if (loading) {
    return (
      <div style={{ position: 'relative', minHeight: 100 }}>
        {children}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10,10,10,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            border: '2px solid rgba(200,241,53,0.2)',
            borderTopColor: '#c8f135',
            animation: 'spin 0.8s linear infinite'
          }} />
        </div>
      </div>
    )
  }

  // Fully authenticated, show normal content
  if (user) {
    return <>{children}</>
  }

  // Unauthenticated - show blurred content with unlock overlay
  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 'inherit' }}>
      <div style={{
        filter: `blur(${blurRadius}px) brightness(0.7)`,
        userSelect: 'none',
        pointerEvents: 'none',
        transition: 'filter 0.3s ease',
      }}>
        {children}
      </div>

      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        background: 'rgba(0,0,0,0.1)'
      }}>
        <motion.button
          onClick={openAuthGate}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 24px',
            background: 'rgba(17,17,17,0.9)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '999px',
            color: '#ffffff',
            fontFamily: 'var(--font-inter), sans-serif',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 20px rgba(200,241,53,0.1)',
            backdropFilter: 'blur(8px)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(200,241,53,0.4)';
            e.currentTarget.style.color = '#c8f135';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
            e.currentTarget.style.color = '#ffffff';
          }}
        >
          <Lock size={16} />
          {message}
        </motion.button>
      </div>
    </div>
  )
}
