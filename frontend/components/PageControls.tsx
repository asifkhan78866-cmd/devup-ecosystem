'use client'
import { ReactNode } from 'react'

interface PageControlsProps {
  search?: ReactNode
  filters?: ReactNode
  sort?: ReactNode
  resultsCount?: ReactNode
}

export default function PageControls({
  search, filters, sort, resultsCount
}: PageControlsProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      marginBottom: 32,
    }}>
      {/* Row 1: Search — always full width */}
      {search && (
        <div style={{ width: '100%' }}>
          {search}
        </div>
      )}

      {/* Row 2: Filters — horizontal scroll on mobile,
          wraps naturally on desktop */}
      {filters && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: 4,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          } as React.CSSProperties}
          className="hide-scrollbar"
        >
          {filters}
        </div>
      )}

      {/* Row 3: Results count + sort —
          side by side on desktop, stacked on mobile */}
      {(resultsCount || sort) && (
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          {resultsCount && (
            <span style={{
              fontFamily: 'var(--font-inter), Inter, sans-serif',
              fontSize: 13,
              color: '#6b6b6b',
            }}>
              {resultsCount}
            </span>
          )}
          {sort && (
            <div style={{ marginLeft: 'auto' }}>
              {sort}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
