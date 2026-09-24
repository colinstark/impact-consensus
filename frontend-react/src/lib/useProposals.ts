import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'
import type { Choice, Proposal } from '../api/types'
import { deviceId } from './device'
import { useLive } from './useTopics'

const PROPOSAL_TABLES: [string, string][] = [['proposals', 'id'], ['proposal_upvotes', 'proposal_id']]

export const UPVOTE_THRESHOLD = 100

export function useProposals(city: string | null) {
  const [proposals, setProposals] = useState<Proposal[] | null>(null)
  const [mine, setMine] = useState<Record<string, Choice>>({})

  useEffect(() => {
    if (!city) return
    api.listProposals(city).then(setProposals)
    api.getMyUpvotes(deviceId()).then(setMine)
  }, [city])
  const reload = useCallback(() => {
    if (city) api.listProposals(city).then(setProposals, () => {})
  }, [city])
  useLive(reload, undefined, PROPOSAL_TABLES)

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

/** One proposal (undefined while loading, null if missing) with live counts and this device's upvote. */
export function useProposal(id: string) {
  const [proposal, setProposal] = useState<Proposal | null>()
  const [mine, setMine] = useState<Choice>()

  useEffect(() => {
    api.getProposal(id).then(setProposal, () => setProposal(null))
    api.getMyUpvotes(deviceId()).then((m) => setMine(m[id]))
  }, [id])
  const reload = useCallback(() => {
    api.getProposal(id).then(setProposal, () => {})
  }, [id])
  useLive(reload, id, PROPOSAL_TABLES)

  const upvote = useCallback(async (pid: string, answer: Choice) => {
    setMine(answer)
    try {
      const updated = await api.upvoteProposal(pid, answer, deviceId())
      setProposal(updated)
      return updated
    } catch (e) {
      setMine(undefined)
      throw e
    }
  }, [])

  return { proposal, mine, upvote }
}

export function timeLeft(expiresAt: string) {
  const ms = +new Date(expiresAt) - Date.now()
  return { hours: Math.floor(ms / 3600e3), minutes: Math.max(0, Math.floor(ms / 60e3)) }
}
