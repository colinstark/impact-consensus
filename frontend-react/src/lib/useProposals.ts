import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'
import type { Choice, Proposal } from '../api/types'
import { deviceId } from './device'

export const UPVOTE_THRESHOLD = 100

export function useProposals(city: string | null) {
  const [proposals, setProposals] = useState<Proposal[] | null>(null)
  const [mine, setMine] = useState<Record<string, Choice>>({})

  useEffect(() => {
    if (!city) return
    api.listProposals(city).then(setProposals)
    api.getMyUpvotes(deviceId()).then(setMine)
  }, [city])

  const upvote = useCallback(async (id: string, answer: Choice) => {
    setMine((m) => ({ ...m, [id]: answer }))
    try {
      const updated = await api.upvoteProposal(id, answer, deviceId())
      setProposals((ps) => ps?.map((p) => (p.id === id ? updated : p)) ?? null)
      return updated
    } catch (e) {
      setMine((m) => {
        const next = { ...m }
        delete next[id]
        return next
      })
      throw e
    }
  }, [])

  return { proposals, mine, upvote }
}

export function timeLeft(expiresAt: string) {
  const ms = +new Date(expiresAt) - Date.now()
  return { hours: Math.floor(ms / 3600e3), minutes: Math.max(0, Math.floor(ms / 60e3)) }
}
