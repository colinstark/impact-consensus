import { DISTRICTS, DISTRICT_WEIGHT } from '../data/districts'
import { coverage, seedTopics, sponsoredTopics } from './seed'
import type { Api, Choice, DistrictResult, Proposal, Tally, Topic, TrendPoint } from './types'

// In-browser stand-in for the backend. Everything persists in localStorage so
// the demo behaves like the real thing on a single device.
const KEY = 'placa.mock.v2'
const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms))

const THRESHOLD = 100
const WINDOW_MS = 48 * 3600e3

interface StoredProposal extends Omit<Proposal, 'upvotes' | 'tally' | 'status' | 'expiresAt'> {
  seedUpvotes: number
  seedTally: Tally
}

interface Store {
  votes: Record<string, Record<string, Choice>> // deviceId -> topicId -> choice
  districts: Record<string, string> // deviceId -> districtId
  upvotes: Record<string, Record<string, Choice>> // deviceId -> proposalId -> answer
  proposals: StoredProposal[] // created on this device
  accepted: string[] // proposal ids promoted to topics
  epoch: number // when this demo store was created; seed proposals are timed from here
}

function load(): Store {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? '')
    if (s && s.epoch) return s
  } catch {
    /* fall through */
  }
  const fresh: Store = { votes: {}, districts: {}, upvotes: {}, proposals: [], accepted: [], epoch: Date.now() }
  save(fresh)
  return fresh
}
const save = (s: Store) => localStorage.setItem(KEY, JSON.stringify(s))

// ---------- proposals ----------

const hoursAgo = (epoch: number, h: number) => new Date(epoch - h * 3600e3).toISOString()

function seedProposals(epoch: number): StoredProposal[] {
  return [
    {
      id: 'bicing-24h', city: 'barcelona', area: 'Barcelona',
      question: 'Should Bicing run 24 hours a day?',
      context: 'Bicing currently has reduced service overnight. Night-shift workers say they have no good way home.',
      seedUpvotes: 99, seedTally: { yes: 71, no: 28 }, createdAt: hoursAgo(epoch, 30),
    },
    {
      id: 'rambla-catalunya', city: 'barcelona', area: 'Eixample',
      question: 'Should Rambla de Catalunya be fully pedestrianised?',
      seedUpvotes: 64, seedTally: { yes: 40, no: 24 }, createdAt: hoursAgo(epoch, 12),
    },
    {
      id: 'sunday-shops', city: 'barcelona', area: 'Barcelona',
      question: 'Should local shops be allowed to open on Sundays in every district?',
      seedUpvotes: 23, seedTally: { yes: 9, no: 14 }, createdAt: hoursAgo(epoch, 4),
    },
    {
      id: 'port-pool', city: 'barcelona', area: 'Sant Martí',
      question: 'Should the Port Olímpic get a public sea-water pool?',
      seedUpvotes: 38, seedTally: { yes: 30, no: 8 }, createdAt: hoursAgo(epoch, 60),
    },
  ]
}

function materialise(p: StoredProposal, s: Store): Proposal {
  const tally = { ...p.seedTally }
  let upvotes = p.seedUpvotes
  for (const ups of Object.values(s.upvotes)) {
    const a = ups[p.id]
    if (a) {
      tally[a] += 1
      upvotes += 1
    }
  }
  const expiresAt = new Date(+new Date(p.createdAt) + WINDOW_MS).toISOString()
  const accepted = s.accepted.includes(p.id)
  const status = accepted ? 'accepted' : Date.now() > +new Date(expiresAt) ? 'expired' : 'open'
  const { seedUpvotes: _u, seedTally: _t, ...rest } = p
  return { ...rest, upvotes, tally, expiresAt, status, topicSlug: accepted ? `proposed-${p.id}` : undefined }
}

const allStoredProposals = (s: Store) => [...seedProposals(s.epoch), ...s.proposals]

function proposalTopic(p: StoredProposal, s: Store): Topic {
  const q = { en: p.question, es: p.question, ca: p.question }
  return {
    id: `prop-${p.id}`,
    slug: `proposed-${p.id}`,
    city: p.city,
    area: p.area,
    category: { en: 'Community', es: 'Comunidad', ca: 'Comunitat' },
    question: q,
    context: p.context
      ? { en: p.context, es: p.context, ca: p.context }
      : {
          en: 'Proposed by the community and accepted with 100 upvotes in 48 hours.',
          es: 'Propuesta por la comunidad y aceptada con 100 votos en 48 horas.',
          ca: 'Proposada per la comunitat i acceptada amb 100 vots en 48 hores.',
        },
    tally: { ...p.seedTally },
    sources: coverage(p.question),
    fromProposal: true,
    createdAt: new Date(s.epoch).toISOString().slice(0, 10),
  }
}

// ---------- topics & votes ----------

function allTopics(s: Store): Topic[] {
  const promoted = allStoredProposals(s).filter((p) => s.accepted.includes(p.id)).map((p) => proposalTopic(p, s))
  return [...seedTopics, ...sponsoredTopics, ...promoted]
}

function withLocalVotes(topic: Topic, s: Store): Topic {
  const tally: Tally = { ...topic.tally }
  for (const votes of Object.values(s.votes)) {
    const c = votes[topic.id]
    if (c) tally[c] += 1
  }
  return { ...topic, tally }
}

const total = (t: Tally) => t.yes + t.no

// Deterministic PRNG so demo data is stable between reloads.
function rng(seed: string) {
  let h = 2166136261
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

// Plausible local skews so the demo map tells a story (e.g. Ciutat Vella feels tourism most).
const DISTRICT_BIAS: Record<string, Record<string, number>> = {
  'tourism-cap': { '01': 0.22, '02': 0.08, '08': -0.12, '09': -0.1 },
  'tourist-flats': { '01': 0.12, '02': 0.08, '05': -0.1 },
  superilles: { '02': 0.12, '08': -0.14, '05': -0.08 },
  'cruise-ships': { '01': 0.12, '10': 0.06 },
  terraces: { '06': 0.16, '01': 0.1, '10': -0.08 },
  'door-to-door': { '09': 0.1, '05': -0.12 },
  'via-laietana': { '01': 0.14, '05': -0.12 },
  'sagrada-stairs': { '02': -0.1, '05': 0.08 },
  bunkers: { '07': 0.2, '06': 0.06 },
}

function seededDistricts(topic: Topic): DistrictResult[] {
  const rand = rng(`${topic.id}:districts`)
  const n = total(topic.tally)
  const share = topic.tally.yes / Math.max(1, n)
  return DISTRICTS.map(({ id }) => {
    const bias = DISTRICT_BIAS[topic.id]?.[id] ?? 0
    const s = Math.min(0.95, Math.max(0.05, share + bias + (rand() - 0.5) * 0.14))
    const votes = Math.max(3, Math.round(n * DISTRICT_WEIGHT[id] * (0.75 + rand() * 0.5)))
    const yes = Math.round(votes * s)
    return { districtId: id, yes, no: votes - yes }
  })
}

function history(topic: Topic): TrendPoint[] {
  const rand = rng(topic.id)
  const start = new Date(topic.createdAt)
  const days = Math.max(2, Math.round((Date.now() - +start) / 864e5))
  const finalVotes = total(topic.tally)
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

const findTopic = (s: Store, id: string) => allTopics(s).find((t) => t.id === id)

export const mockApi: Api = {
  async listTopics(city) {
    await delay()
    const s = load()
    return allTopics(s)
      .filter((t) => t.city === city)
      .map((t) => withLocalVotes(t, s))
      .sort((a, b) => total(b.tally) - total(a.tally))
  },

  async getTopic(slug) {
    await delay()
    const s = load()
    const t = allTopics(s).find((x) => x.slug === slug)
    return t ? withLocalVotes(t, s) : null
  },

  async vote(topicId, { choice, deviceId, districtId }) {
    await delay(350)
    const s = load()
    const t = findTopic(s, topicId)
    if (!t) throw new Error('Unknown topic')
    s.votes[deviceId] = { ...s.votes[deviceId], [topicId]: choice }
    if (districtId) s.districts[deviceId] = districtId
    save(s)
    return withLocalVotes(t, s).tally
  },

  async getMyVotes(deviceId) {
    return load().votes[deviceId] ?? {}
  },

  async setDistrict(deviceId, districtId) {
    await delay(200)
    const s = load()
    s.districts[deviceId] = districtId
    save(s)
  },

  async getDistrictResults(topicId) {
    await delay()
    const s = load()
    const t = findTopic(s, topicId)
    if (!t) return []
    const rows = seededDistricts(t)
    for (const [device, votes] of Object.entries(s.votes)) {
      const c = votes[topicId]
      const row = rows.find((r) => r.districtId === s.districts[device])
      if (c && row) row[c] += 1
    }
    return rows
  },

  async getTrend(topicId, range) {
    await delay()
    const s = load()
    const t = findTopic(s, topicId)
    if (!t) return []
    const pts = history(withLocalVotes(t, s))
    const keep = range === '1m' ? 31 : range === '3m' ? 92 : pts.length
    return pts.slice(-keep)
  },

  async listProposals(city) {
    await delay()
    const s = load()
    const order = { open: 0, accepted: 1, expired: 2 }
    return allStoredProposals(s)
      .filter((p) => p.city === city)
      .map((p) => materialise(p, s))
      .sort((a, b) => order[a.status] - order[b.status] || b.upvotes - a.upvotes)
  },

  async createProposal(input, deviceId) {
    await delay(400)
    const s = load()
    const p: StoredProposal = {
      id: `u${Date.now().toString(36)}`,
      city: input.city,
      area: input.area,
      question: input.question,
      context: input.context || undefined,
      seedUpvotes: 0,
      seedTally: { yes: 0, no: 0 },
      createdAt: new Date().toISOString(),
    }
    s.proposals.push(p)
    s.upvotes[deviceId] = { ...s.upvotes[deviceId], [p.id]: input.answer }
    save(s)
    return materialise(p, s)
  },

  async upvoteProposal(proposalId, answer, deviceId) {
    await delay(300)
    const s = load()
    const stored = allStoredProposals(s).find((p) => p.id === proposalId)
    if (!stored) throw new Error('Unknown proposal')
    if (materialise(stored, s).status !== 'open') throw new Error('Voting has closed')
    if (s.upvotes[deviceId]?.[proposalId]) return materialise(stored, s)
    s.upvotes[deviceId] = { ...s.upvotes[deviceId], [proposalId]: answer }
    const p = materialise(stored, s)
    if (p.upvotes >= THRESHOLD) {
      // Promote to a topic, carrying this device's answer over as its vote.
      s.accepted.push(proposalId)
      for (const [device, ups] of Object.entries(s.upvotes)) {
        if (ups[proposalId]) s.votes[device] = { ...s.votes[device], [`prop-${proposalId}`]: ups[proposalId] }
      }
    }
    save(s)
    return materialise(stored, s)
  },

  async getMyUpvotes(deviceId) {
    return load().upvotes[deviceId] ?? {}
  },

  async requestMagicLink() {
    await delay(600)
  },
}
