import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../api'
import type { User } from '../api/types'

const KEY = 'placa.user'

interface Auth {
  user: User | null
  signIn: (email: string) => void
  signOut: () => void
}

const Ctx = createContext<Auth | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  })
  const value: Auth = {
    user,
    signIn: (email) => {
      const u = { email }
      localStorage.setItem(KEY, JSON.stringify(u))
      setUser(u)
    },
    signOut: () => {
      localStorage.removeItem(KEY)
      setUser(null)
      supabase?.auth.signOut()
    },
  }

  // With Supabase, someone is signed in once they come back from the emailed link.
  // Guest (anonymous) sessions used for voting don't count as signed in.
  useEffect(() => {
    if (!supabase) return
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const email = session?.user.is_anonymous ? undefined : session?.user.email
      if (email) {
        localStorage.setItem(KEY, JSON.stringify({ email }))
        setUser({ email })
      } else {
        localStorage.removeItem(KEY)
        setUser(null)
      }
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
