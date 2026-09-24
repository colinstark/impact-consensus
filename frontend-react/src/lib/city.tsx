import { createContext, useContext, useState, type ReactNode } from 'react'

const KEY = 'placa.city'

interface CityCtx {
  city: string | null
  setCity: (id: string) => void
}

const Ctx = createContext<CityCtx | null>(null)

export function CityProvider({ children }: { children: ReactNode }) {
  const [city, set] = useState<string | null>(() => localStorage.getItem(KEY))
  const setCity = (id: string) => {
    localStorage.setItem(KEY, id)
    set(id)
  }
  return <Ctx.Provider value={{ city, setCity }}>{children}</Ctx.Provider>
}

export function useCity() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useCity outside provider')
  return v
}
