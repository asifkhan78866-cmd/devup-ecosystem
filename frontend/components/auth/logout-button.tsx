'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut } from 'lucide-react'

interface LogoutButtonProps {
  variant?: 'button' | 'icon' | 'text'
  className?: string
  showConfirmation?: boolean
}

export default function LogoutButton({
  variant = 'button',
  className,
  showConfirmation = true,
}: LogoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    if (loading) return
    setLoading(true)

    try {
      const supabase = createClient()
      await supabase.auth.signOut()

      // Clear any residual cookies
      document.cookie.split(';').forEach((c) => {
        const name = c.trim().split('=')[0]
        if (name.startsWith('sb-')) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
        }
      })

      if (showConfirmation) {
        setShowToast(true)
        setTimeout(() => {
          router.push('/')
          router.refresh()
        }, 800)
      } else {
        router.push('/')
        router.refresh()
      }
    } catch {
      setLoading(false)
    }
  }

  if (variant === 'icon') {
    return (
      <>
        <motion.button
          onClick={handleLogout}
          disabled={loading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#a1a1a1',
            cursor: loading ? 'not-allowed' : 'pointer',
            padding: 8,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Sign out"
        >
          {loading ? (
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.1)',
                borderTopColor: '#ef4444',
                animation: 'spin 0.6s linear infinite',
              }}
            />
          ) : (
            <LogOut size={16} />
          )}
        </motion.button>
        <Toast show={showToast} />
      </>
    )
  }

  if (variant === 'text') {
    return (
      <>
        <button
          onClick={handleLogout}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 12px',
            background: 'transparent',
            border: 'none',
            color: '#a1a1a1',
            fontFamily: 'Inter, sans-serif',
            fontSize: 13,
            cursor: loading ? 'not-allowed' : 'pointer',
            textAlign: 'left',
            borderRadius: 8,
            width: '100%',
          }}
        >
          {loading ? (
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.1)',
                borderTopColor: '#ef4444',
                animation: 'spin 0.6s linear infinite',
              }}
            />
          ) : (
            <LogOut size={14} />
          )}
          {loading ? 'Signing out...' : 'Sign out'}
        </button>
        <Toast show={showToast} />
      </>
    )
  }

  return (
    <>
      <motion.button
        onClick={handleLogout}
        disabled={loading}
        whileHover={!loading ? { scale: 1.02 } : undefined}
        whileTap={!loading ? { scale: 0.98 } : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '10px 20px',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.15)',
          borderRadius: 10,
          color: '#ef4444',
          fontFamily: 'Inter, sans-serif',
          fontSize: 14,
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
          transition: 'all 0.15s',
        }}
        className={className}
      >
        {loading ? (
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              border: '2px solid rgba(239,68,68,0.2)',
              borderTopColor: '#ef4444',
              animation: 'spin 0.6s linear infinite',
            }}
          />
        ) : (
          <LogOut size={16} />
        )}
        {loading ? 'Signing out...' : 'Sign Out'}
      </motion.button>
      <Toast show={showToast} />
    </>
  )
}

function Toast({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          style={{
            position: 'fixed',
            bottom: 32,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#111111',
            border: '1px solid rgba(200,241,53,0.2)',
            borderRadius: 12,
            padding: '12px 24px',
            fontFamily: 'Inter, sans-serif',
            fontSize: 14,
            fontWeight: 500,
            color: '#c8f135',
            zIndex: 9999,
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="8" fill="rgba(200,241,53,0.15)" />
            <path
              d="M5 8l2 2 4-4"
              stroke="#c8f135"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Signed out successfully
        </motion.div>
      )}
    </AnimatePresence>
  )
}
