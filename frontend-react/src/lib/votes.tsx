import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from '../api'
import type { Choice, Tally } from '../api/types'
import { deviceId, entrySource } from './device'

interface Votes {
  mine: Record<string, Choice>
  ready: boolean
  cast: (topicId: string, choice: Choice) => Promise<Tally>
}

const Ctx = createContext<Votes | null>(null)

export function VotesProvider({ children }: { children: ReactNode }) {
  const [mine, setMine] = useState<Record<string, Choice>>({})
  const [ready, setReady] = useState(false)

  useEffect(() => {
    entrySource()
    api
      .getMyVotes(deviceId())
      .then(setMine)
      .finally(() => setReady(true))
  }, [])

  const cast = useCallback(async (topicId: string, choice: Choice) => {
    const prev = mine[topicId]
    setMine((m) => ({ ...m, [topicId]: choice }))
    try {
      return await api.vote(topicId, choice, deviceId(), entrySource())
    } catch (e) {
      setMine((m) => {
        const next = { ...m }
        if (prev) next[topicId] = prev
        else delete next[topicId]
        return next
      })
      throw e
    }
  }, [mine])

  return <Ctx.Provider value={{ mine, ready, cast }}>{children}</Ctx.Provider>
}

export function useVotes() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useVotes outside provider')
  return v
}
