'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

export type AuthProfile = {
  id: string
  company_id?: string | null
  first_name?: string
  last_name?: string
  email?: string
  role?: string
}

type AuthUser = {
  id: string
  email: string
  user_metadata: {
    full_name?: string
    role?: string
    avatar_url?: string | null
  }
}

type UserRole = 'admin' | 'architect' | 'assistant' | 'accountant' | 'client' | undefined

interface AuthContextType {
  user: AuthUser | null
  profile: AuthProfile | null
  loading: boolean
  // Helpers d'authentification
  role: UserRole
  isAdmin: boolean
  isArchitect: boolean
  isAssistant: boolean
  isAccountant: boolean
  isClient: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  role: undefined,
  isAdmin: false,
  isArchitect: false,
  isAssistant: false,
  isAccountant: false,
  isClient: false,
  signIn: async () => {},
  signOut: async () => {},
})

function mapUser(u: User | null): AuthUser | null {
  if (!u) return null
  return {
    id: u.id,
    email: u.email ?? '',
    user_metadata: {
      full_name: u.user_metadata?.full_name,
      role: u.user_metadata?.role,
      avatar_url: u.user_metadata?.avatar_url ?? null,
    },
  }
}

async function fetchProfile(userId: string): Promise<AuthProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, user_id, company_id, first_name, last_name, email, role')
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data) return null
  // id exposé = auth user id pour created_by (référence auth.users)
  return {
    id: data.user_id ?? data.id,
    company_id: data.company_id ?? null,
    first_name: data.first_name ?? undefined,
    last_name: data.last_name ?? undefined,
    email: data.email ?? undefined,
    role: data.role ?? undefined,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<AuthProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadSessionAndProfile = useCallback(async (session: Session | null) => {
    if (!session?.user) {
      setUser(null)
      setProfile(null)
      setLoading(false)
      return
    }
    setUser(mapUser(session.user))
    const p = await fetchProfile(session.user.id)
    setProfile(p)
    setLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadSessionAndProfile(session)
    }).catch((err) => {
      const msg = err?.message ?? ''
      if (msg.includes('Refresh Token') || msg.includes('refresh_token') || msg.includes('invalid') || err?.name === 'AuthApiError') {
        supabase.auth.signOut().catch(() => {})
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await loadSessionAndProfile(session)
    })

    return () => subscription.unsubscribe()
  }, [loadSessionAndProfile])

  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setLoading(false)
        throw new Error(error.message)
      }
      await loadSessionAndProfile(data.session)
      router.push('/dashboard')
    },
    [loadSessionAndProfile, router]
  )

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    router.push('/login')
  }, [router])

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        role: (profile?.role as UserRole) ?? (user?.user_metadata?.role as UserRole) ?? undefined,
        isAdmin: profile?.role === 'admin',
        isArchitect: profile?.role === 'architect',
        isAssistant: profile?.role === 'assistant',
        isAccountant: profile?.role === 'accountant',
        isClient: profile?.role === 'client',
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
