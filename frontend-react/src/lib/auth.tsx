import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, supabase } from '../api'
import type { User, UserProfile } from '../api/types'
import { deviceId } from './device'

const KEY = 'placa.user'
// Sign-up details by email, so they're still there after the emailed link brings someone back.
const ACCOUNTS = 'placa.accounts'
export const CONSENT_VERSION = '2026-09-24'

const accounts = (): Record<string, UserProfile> => {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS) ?? '{}')
  } catch {
    return {}
  }
}

interface Auth {
  user: User | null
  /** Has the sign-up details insights need (postcode, age, gender). */
  complete: boolean
  /** Saves sign-up details; they apply once the email link is confirmed. */
  register: (profile: UserProfile) => Promise<void>
  signIn: (email: string) => void
  update: (patch: Partial<UserProfile>) => Promise<void>
  deleteAccount: () => Promise<void>
  signOut: () => void
}

const Ctx = createContext<Auth | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  })

  const persist = (u: User | null) => {
    if (u) localStorage.setItem(KEY, JSON.stringify(u))
    else localStorage.removeItem(KEY)
    setUser(u)
  }
  const withProfile = (email: string): User => ({ ...accounts()[email], email })

  const value: Auth = {
    user,
    complete: !!(user?.postcode && user.ageBracket && user.gender && user.acceptedTermsAt),
    register: async (profile) => {
      localStorage.setItem(ACCOUNTS, JSON.stringify({ ...accounts(), [profile.email]: profile }))
      await api.saveProfile(deviceId(), profile)
    },
    signIn: (email) => persist(withProfile(email)),
    update: async (patch) => {
      if (!user?.email) return
      const next = { ...accounts()[user.email], ...patch, email: user.email } as UserProfile
      localStorage.setItem(ACCOUNTS, JSON.stringify({ ...accounts(), [user.email]: next }))
      await api.saveProfile(deviceId(), next)
      persist(next)
    },
    deleteAccount: async () => {
      if (!user?.email) return
      await api.deleteProfile(deviceId(), user.email)
      const rest = accounts()
      delete rest[user.email]
      localStorage.setItem(ACCOUNTS, JSON.stringify(rest))
      localStorage.removeItem('placa.home')
      persist(null)
      supabase?.auth.signOut()
    },
    signOut: () => {
      persist(null)
      supabase?.auth.signOut()
    },
  }

  // With Supabase, someone is signed in once they come back from the emailed link.
  // Guest (anonymous) sessions used for voting don't count as signed in.
  useEffect(() => {
    if (!supabase) return
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const email = session?.user.is_anonymous ? undefined : session?.user.email
      persist(email ? withProfile(email) : null)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth outside provider')
  return v
}
