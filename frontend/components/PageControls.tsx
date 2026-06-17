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
    <div className="flex flex-col gap-4 mb-8">
      {/* Search & Filters Row */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between w-full">
        {/* Search */}
        {search && (
          <div className="w-full md:w-auto md:shrink-0">
            {search}
          </div>
        )}

        {/* Filters */}
        {filters && (
          <div
            className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto hide-scrollbar"
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {filters}
          </div>
        )}
      </div>

      {/* Results count + sort */}
      {(resultsCount || sort) && (
        <div className="flex flex-row justify-between items-center flex-wrap gap-3 mt-2 md:mt-4">
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
            <div className="ml-auto">
              {sort}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
