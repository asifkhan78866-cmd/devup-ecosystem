'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface AuthGateContextType {
  isOpen: boolean
  openAuthGate: () => void
  closeAuthGate: () => void
}

const AuthGateContext = createContext<AuthGateContextType | undefined>(undefined)

export function AuthGateProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const openAuthGate = () => setIsOpen(true)
  const closeAuthGate = () => setIsOpen(false)

  return (
    <AuthGateContext.Provider value={{ isOpen, openAuthGate, closeAuthGate }}>
      {children}
    </AuthGateContext.Provider>
  )
}

export function useAuthGate() {
  const context = useContext(AuthGateContext)
  if (context === undefined) {
    throw new Error('useAuthGate must be used within an AuthGateProvider')
  }
  return context
}
