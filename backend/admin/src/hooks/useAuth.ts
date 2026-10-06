import { useState, useEffect, useCallback } from 'react'
import api, { TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY, clearSession } from '@/config/api'
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
    const token = localStorage.getItem(TOKEN_KEY)
    const userStr = localStorage.getItem(USER_KEY)
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        if (user.role === 'ADMIN') {
          setState({ user, token, isLoading: false })
        } else {
          clearSession()
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
    const { user, token, refreshToken } = res.data.data

    if (user.role !== 'ADMIN') {
      throw new Error('Access denied. Admin privileges required.')
    }

    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    setState({ user, token, isLoading: false })
    return user
  }, [])

  const logout = useCallback(() => {
    clearSession()
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
