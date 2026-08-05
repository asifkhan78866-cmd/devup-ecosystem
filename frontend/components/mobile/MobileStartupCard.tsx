'use client'

import StartupTypeBadge, { isPartner } from '@/components/StartupTypeBadge'
import StartupLogo from '@/components/StartupLogo'

export default function MobileStartupCard({ startup }: { startup: any }) {
  return (
    <div style={{
      display: 'flex', gap: 14, padding: '16px 0',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      alignItems: 'flex-start',
    }}>
      {/* Logo */}
      <StartupLogo
        src={startup.logoUrl}
        name={startup.name}
        rounded="rounded-xl"
        className="w-14 h-14 shrink-0 border border-white/[0.08] text-xl"
      />
      
      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 15,
            fontWeight: 700, color: '#ffffff' }}>
            {startup.name}
          </span>
          {startup.isVerified && (
            <span style={{ color: '#c8f135', fontSize: 12 }}>✓</span>
          )}
          {isPartner(startup) && <StartupTypeBadge compact />}
        </div>
        <p style={{ fontFamily: 'var(--font-inter), sans-serif', fontSize: 13,
          color: '#a1a1a1', lineHeight: 1.4, marginTop: 2,
          // Truncate to 2 lines
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {startup.tagline}
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 8,
          alignItems: 'center' }}>
          <span style={{
            fontFamily: 'var(--font-inter), sans-serif', fontSize: 10,
            color: '#c8f135', textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>
            {startup.domain?.replace('_', '/')}
          </span>
          <span style={{ color: '#3d3d3d', fontSize: 10 }}>·</span>
          <span style={{ fontFamily: 'var(--font-inter), sans-serif', fontSize: 10,
            color: '#6b6b6b' }}>
            {startup.stage}
          </span>
        </div>
      </div>
      
      {/* Arrow */}
      <span style={{ color: '#3d3d3d', fontSize: 16, marginTop: 4 }}>
        →
      </span>
    </div>
  )
}
