import { createContext, useContext, useState, type ReactNode } from 'react'
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
    },
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth outside provider')
  return v
}
