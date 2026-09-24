import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from '../api'
import type { Choice, Tally } from '../api/types'
import { deviceId, entrySource } from './device'
import { useProfile } from './profile'

interface Votes {
  mine: Record<string, Choice>
  ready: boolean
  cast: (topicId: string, choice: Choice) => Promise<Tally>
  /** Re-read this device's votes, e.g. after an upvoted proposal becomes a topic. */
  refresh: () => Promise<void>
}

const Ctx = createContext<Votes | null>(null)

export function VotesProvider({ children }: { children: ReactNode }) {
  const [mine, setMine] = useState<Record<string, Choice>>({})
  const [ready, setReady] = useState(false)
  const { home } = useProfile()

  useEffect(() => {
    entrySource()
    api
      .getMyVotes(deviceId())
      .then(setMine)
      .finally(() => setReady(true))
  }, [])

  const cast = useCallback(
    async (topicId: string, choice: Choice) => {
      const prev = mine[topicId]
      setMine((m) => ({ ...m, [topicId]: choice }))
      try {
        return await api.vote(topicId, {
          choice,
          deviceId: deviceId(),
          source: entrySource(),
          districtId: home?.districtId,
        })
      } catch (e) {
        setMine((m) => {
          const next = { ...m }
          if (prev) next[topicId] = prev
          else delete next[topicId]
          return next
        })
        throw e
      }
    },
    [mine, home],
  )

  const refresh = useCallback(async () => setMine(await api.getMyVotes(deviceId())), [])

  const value = { mine, ready, cast, refresh }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useVotes() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useVotes outside provider')
  return v
}
