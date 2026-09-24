import { seedTopics } from './seed'
import type { Api, Choice, Tally, Topic, TrendPoint, TrendRange } from './types'

// In-browser stand-in for the backend. Votes persist in localStorage so the
// demo behaves like the real thing on a single device.
const KEY = 'placa.mock.votes'
const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms))

type Store = Record<string, Record<string, Choice>> // deviceId -> topicId -> choice

const load = (): Store => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}')
  } catch {
    return {}
  }
}
const save = (s: Store) => localStorage.setItem(KEY, JSON.stringify(s))

function withLocalVotes(topic: Topic): Topic {
  const tally: Tally = { ...topic.tally }
  for (const votes of Object.values(load())) {
    const c = votes[topic.id]
    if (c) tally[c] += 1
  }
  return { ...topic, tally }
}

const total = (t: Tally) => t.yes + t.no + t.skip

// Deterministic PRNG so each topic's history is stable between reloads.
function rng(seed: string) {
  let h = 2166136261
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

function history(topic: Topic): TrendPoint[] {
  const rand = rng(topic.id)
  const start = new Date(topic.createdAt)
  const today = new Date()
  const days = Math.max(2, Math.round((+today - +start) / 864e5))
  const finalVotes = topic.tally.yes + topic.tally.no
  const finalShare = topic.tally.yes / Math.max(1, finalVotes)
  // Random walk that starts noisy and settles on today's result.
  const drift = (rand() - 0.5) * 0.3
  const points: TrendPoint[] = []
  let wobble = 0
  for (let i = 0; i <= days; i++) {
    const p = i / days
    wobble = wobble * 0.85 + (rand() - 0.5) * 0.05
    const share = finalShare + drift * (1 - p) ** 1.5 + wobble * (1 - p * 0.8)
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    points.push({
      date: d.toISOString().slice(0, 10),
      yesShare: Math.min(0.97, Math.max(0.03, share)),
      votes: Math.round(finalVotes * Math.sqrt(p)),
    })
  }
  points[points.length - 1].yesShare = finalShare
  return points
}

export const mockApi: Api = {
  async listTopics() {
    await delay()
    return seedTopics.map(withLocalVotes).sort((a, b) => total(b.tally) - total(a.tally))
  },

  async getTopic(slug) {
    await delay()
    const t = seedTopics.find((x) => x.slug === slug)
    return t ? withLocalVotes(t) : null
  },

  async vote(topicId, choice, deviceId) {
    await delay(350)
    const s = load()
    s[deviceId] = { ...s[deviceId], [topicId]: choice }
    save(s)
    const t = seedTopics.find((x) => x.id === topicId)
    if (!t) throw new Error('Unknown topic')
    return withLocalVotes(t).tally
  },

  async getMyVotes(deviceId) {
    return load()[deviceId] ?? {}
  },

  async getTrend(topicId, range: TrendRange) {
    await delay()
    const t = seedTopics.find((x) => x.id === topicId)
    if (!t) return []
    const pts = history(withLocalVotes(t))
    const keep = range === '1m' ? 31 : range === '3m' ? 92 : pts.length
    return pts.slice(-keep)
  },

  async requestMagicLink() {
    await delay(600)
  },
}
