'use client'
import { 
  createContext, useContext, useEffect, 
  useState, useCallback 
} from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { User, Session } from '@supabase/supabase-js'

export type UserRole = 
  | 'ADMIN' 
  | 'SUPER_ADMIN' 
  | 'FOUNDER' 
  | 'STARTUP_MEMBER' 
  | 'STUDENT' 
  | 'INVESTOR' 
  | 'MENTOR' 
  | 'JUDGE'

export interface UserProfile {
  id: string
  email: string
  name: string
  role: UserRole
  avatarUrl?: string
  college?: string
  city?: string
  provider?: string
  lastLoginAt?: string
  startups?: any[]
}

interface AuthContextType {
  user: UserProfile | null
  session: Session | null
  loading: boolean
  signUp: (data: SignUpData) => Promise<{ error?: string }>
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signInWithGoogle: (redirectTo?: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<UserProfile>) => Promise<void>
}

interface SignUpData {
  email: string
  password: string
  name: string
  role: 'FOUNDER' | 'STUDENT' | 'INVESTOR'
  college?: string
  city?: string
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession())
              .data.session?.access_token}`
          }
        }
      )
      if (response.ok) {
        const { data: userData } = await response.json()
        // Map Prisma User + Profile to the UserProfile interface expected by frontend
        const mappedUser: UserProfile = {
          id: userData.id,
          email: userData.email,
          role: userData.role,
          name: userData.profile?.name || 'User',
          avatarUrl: userData.avatarUrl || userData.profile?.avatarUrl,
          college: userData.profile?.college,
          city: userData.profile?.city,
          provider: userData.authProvider,
          lastLoginAt: userData.lastLoginAt,
          startups: userData.startupMemberships?.map((m: any) => m.startup) || [],
        }
        setUser(mappedUser)
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
    }
  }, [supabase])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        } else {
          setUser(null)
        }
        setLoading(false)
        
        if (event === 'SIGNED_OUT') {
          router.push('/')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchUserProfile, router, supabase.auth])

  const signUp = async (data: SignUpData) => {
    try {
      // Register via backend (creates Supabase user + DB profile)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/auth/register`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      )
      
      const result = await response.json()
      
      if (!response.ok) {
        return { error: result.error || result.message || 'Registration failed' }
      }

      // Sign in with Supabase after registration
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) return { error: error.message }
      
      router.push('/dashboard')
      return {}
    } catch {
      return { error: 'Something went wrong. Please try again.' }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) return { error: error.message }
      
      router.push('/dashboard')
      return {}
    } catch {
      return { error: 'Something went wrong. Please try again.' }
    }
  }

  const signInWithGoogle = async (redirectTo?: string) => {
    const callbackUrl = `${window.location.origin}/auth/callback${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`
    
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)

    // Clear Supabase cookies
    document.cookie.split(';').forEach((c) => {
      const name = c.trim().split('=')[0]
      if (name.startsWith('sb-')) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
      }
    })
  }

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user || !session) return
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/users/${user.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data),
      }
    )
    
    if (response.ok) {
      const result = await response.json()
      setUser(result.data)
    }
  }

  return (
    <AuthContext.Provider value={{
      user, session, loading,
      signUp, signIn, signInWithGoogle, signOut, updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
