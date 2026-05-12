import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { UserSchema } from '@insforge/sdk'
import { appOrigin, getInsforge } from '../lib/insforge'

type AuthState = {
  user: UserSchema | null
  loading: boolean
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSchema | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const insforge = getInsforge()
    const { data, error } = await insforge.auth.getCurrentUser()
    if (error) setUser(null)
    else setUser(data?.user ?? null)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const insforge = getInsforge()
        const { data, error } = await insforge.auth.getCurrentUser()
        if (cancelled) return
        if (error) setUser(null)
        else setUser(data?.user ?? null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const signOut = useCallback(async () => {
    const insforge = getInsforge()
    await insforge.auth.signOut()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      refresh,
      signOut,
    }),
    [user, loading, refresh, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export async function signInWithPassword(email: string, password: string) {
  const insforge = getInsforge()
  return insforge.auth.signInWithPassword({ email, password })
}

export async function signUp(email: string, password: string, name: string) {
  const insforge = getInsforge()
  return insforge.auth.signUp({
    email,
    password,
    name,
    redirectTo: `${appOrigin()}/`,
  })
}

export async function verifyEmail(email: string, otp: string) {
  const insforge = getInsforge()
  return insforge.auth.verifyEmail({ email, otp })
}

export async function resendVerification(email: string) {
  const insforge = getInsforge()
  return insforge.auth.resendVerificationEmail({
    email,
    redirectTo: `${appOrigin()}/`,
  })
}
