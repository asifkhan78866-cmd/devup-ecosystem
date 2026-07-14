'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, User as UserIcon, Settings, LayoutDashboard, ChevronDown } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthProvider'
import Link from 'next/link'

export default function LogoutButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { user } = useAuth()

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

      router.push('/')
      router.refresh()
    } catch {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="relative" ref={menuRef}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px 6px 6px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 999,
          color: '#e4e4e4',
          fontFamily: 'Inter, sans-serif',
          fontSize: 14,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(200,241,53,0.3)';
          e.currentTarget.style.background = 'rgba(200,241,53,0.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
        }}
      >
        <div style={{
          width: 28, height: 28,
          borderRadius: '50%',
          overflow: 'hidden',
          background: 'rgba(200,241,53,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(200,241,53,0.2)'
        }}>
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ color: '#c8f135', fontSize: 12, fontWeight: 700 }}>
              {user.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <span style={{ fontWeight: 500 }}>{user.name.split(' ')[0]}</span>
        <ChevronDown size={14} style={{ opacity: 0.5 }} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 8,
              width: 220,
              background: 'rgba(17,17,17,0.95)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16,
              boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 20px rgba(200,241,53,0.05)',
              overflow: 'hidden',
              zIndex: 100,
            }}
          >
            <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontFamily: 'Inter', fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>
                {user.name}
              </div>
              <div style={{ fontFamily: 'Inter', fontSize: 12, color: '#888' }}>
                {user.email}
              </div>
            </div>

            <div style={{ padding: 8 }}>
              <Link href="/profile" passHref legacyBehavior>
                <a style={menuItemStyle} onClick={() => setIsOpen(false)}>
                  <UserIcon size={16} />
                  Profile
                </a>
              </Link>
              <Link href="/dashboard" passHref legacyBehavior>
                <a style={menuItemStyle} onClick={() => setIsOpen(false)}>
                  <LayoutDashboard size={16} />
                  Dashboard
                </a>
              </Link>
              <Link href="/settings" passHref legacyBehavior>
                <a style={menuItemStyle} onClick={() => setIsOpen(false)}>
                  <Settings size={16} />
                  Settings
                </a>
              </Link>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '8px 0' }} />
              <button 
                onClick={handleLogout}
                disabled={loading}
                style={{
                  ...menuItemStyle,
                  width: '100%',
                  textAlign: 'left',
                  color: '#ef4444',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%',
                    border: '2px solid rgba(239,68,68,0.2)',
                    borderTopColor: '#ef4444',
                    animation: 'spin 0.6s linear infinite',
                  }} />
                ) : (
                  <LogOut size={16} />
                )}
                {loading ? 'Logging out...' : 'Log out'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const menuItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 12px',
  borderRadius: 8,
  fontFamily: 'Inter, sans-serif',
  fontSize: 14,
  fontWeight: 500,
  color: '#e4e4e4',
  textDecoration: 'none',
  background: 'transparent',
  border: 'none',
  transition: 'background 0.2s',
  cursor: 'pointer',
}
