'use client'

import { useAuth } from '@/lib/auth/AuthProvider'
import { useAuthGate } from '@/hooks/useAuthGate'
import { ReactNode } from 'react'

interface AuthGateProps {
  children: ReactNode
  action?: 'click' | 'render'
  fallback?: ReactNode
}

/**
 * AuthGate can be used to either intercept clicks on a button if the user is unauthenticated,
 * or completely hide an element if the user is unauthenticated (using action="render").
 */
export default function AuthGate({ children, action = 'click', fallback }: AuthGateProps) {
  const { user } = useAuth()
  const { openAuthGate } = useAuthGate()

  if (action === 'render') {
    if (user) return <>{children}</>
    return fallback ? <>{fallback}</> : null
  }

  // Intercept click action
  return (
    <div 
      onClickCapture={(e) => {
        if (!user) {
          e.preventDefault()
          e.stopPropagation()
          openAuthGate()
        }
      }}
      style={{ display: 'contents' }}
    >
      {children}
    </div>
  )
}
