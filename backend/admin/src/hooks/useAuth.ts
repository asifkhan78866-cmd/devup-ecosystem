import { useState, useEffect, useCallback } from 'react'
import api from '@/config/api'
import { supabase } from '@/config/supabase'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
  })

  useEffect(() => {
    const token = localStorage.getItem('devup_admin_token')
    const userStr = localStorage.getItem('devup_admin_user')
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        if (user.role === 'ADMIN') {
          setState({ user, token, isLoading: false })
        } else {
          localStorage.removeItem('devup_admin_token')
          localStorage.removeItem('devup_admin_user')
          setState({ user: null, token: null, isLoading: false })
        }
      } catch {
        setState({ user: null, token: null, isLoading: false })
      }
    } else {
      setState({ user: null, token: null, isLoading: false })
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post('/api/auth/login', { email, password })
    const { user, token } = res.data.data

    if (user.role !== 'ADMIN') {
      throw new Error('Access denied. Admin privileges required.')
    }

    localStorage.setItem('devup_admin_token', token)
    localStorage.setItem('devup_admin_user', JSON.stringify(user))
    setState({ user, token, isLoading: false })
    return user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('devup_admin_token')
    localStorage.removeItem('devup_admin_user')
    setState({ user: null, token: null, isLoading: false })
  }, [])

  return {
    user: state.user,
    token: state.token,
    isLoading: state.isLoading,
    isAuthenticated: !!state.token && state.user?.role === 'ADMIN',
    login,
    logout,
  }
}
