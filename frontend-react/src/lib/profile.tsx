import { createContext, useContext, useState, type ReactNode } from 'react'
import { api } from '../api'
import { useAuth } from './auth'
import { deviceId } from './device'

// Home district from a postcode, asked for once. Only the district is shared
// with the backend; the postcode stays on the device.
const KEY = 'placa.home'

interface Home {
  postcode: string
  districtId: string
}

interface ProfileCtx {
  home: Home | null
  setHome: (h: Home) => Promise<void>
}

const Ctx = createContext<ProfileCtx | null>(null)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [home, set] = useState<Home | null>(() => {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  })
  const setHome = async (h: Home) => {
    await api.setDistrict(deviceId(), h.districtId)
    localStorage.setItem(KEY, JSON.stringify(h))
    set(h)
  }
  // A signed-up account's postcode counts as home too.
  const { user } = useAuth()
  const effective = home ?? (user?.postcode && user.districtId ? { postcode: user.postcode, districtId: user.districtId } : null)
  return <Ctx.Provider value={{ home: effective, setHome }}>{children}</Ctx.Provider>
}

export function useProfile() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useProfile outside provider')
  return v
}
