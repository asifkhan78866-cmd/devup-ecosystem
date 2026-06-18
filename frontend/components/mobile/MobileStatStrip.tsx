'use client'
import { motion } from 'framer-motion'
import { useIsMobile } from '@/lib/hooks/useIsMobile'

const STATS = [
  { value: '23+', label: 'Startups' },
  { value: '₹4Cr+', label: 'Raised' },
  { value: '1.2K', label: 'Builders' },
  { value: '48hr', label: 'Response' },
]

export default function MobileStatStrip() {
  const isMobile = useIsMobile()
  if (!isMobile) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      style={{
        display: 'flex',
        gap: 0,
        marginTop: 32,
        background: '#111111',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      {STATS.map((stat, i) => (
        <div key={i} style={{
          flex: 1,
          padding: '14px 0',
          textAlign: 'center',
          borderRight: i < STATS.length - 1 
            ? '1px solid rgba(255,255,255,0.06)' : 'none',
        }}>
          <div style={{
            fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800,
            fontSize: 20, color: '#ffffff',
            lineHeight: 1,
          }}>
            {stat.value}
          </div>
          <div style={{
            fontFamily: 'var(--font-inter), sans-serif', fontSize: 10,
            color: '#6b6b6b', marginTop: 4,
            letterSpacing: '0.04em',
          }}>
            {stat.label}
          </div>
        </div>
      ))}
    </motion.div>
  )
}
