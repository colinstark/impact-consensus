import type { SupabaseClient } from '@supabase/supabase-js'
import { DISTRICTS } from '../data/districts'
import { mockApi } from './mock'
import type { Api, Choice, DistrictResult, Localized, Source, Tally, Topic, TrendPoint } from './types'

// Real backend: each analysed article in Supabase is a topic. Its `statement` is the
// question people vote on and its `description` is the neutral context.
// Enabled by setting VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.
//
// Features without tables yet (proposals, sponsored questions, postcode → district)
// fall back to the in-browser mock, so they keep working on the live demo. Their ids
// are never numeric, so they can't collide with article ids.

type Row = {
  id: number
  url: string
  title: string | null
  statement: string
  description: string | null
  location: string | null
  created_at: string
  published_at: string | null
  votes: { stance: 'agree' | 'disagree' }[]
  article_topics: { topics: { name: string } | null }[]
}

const COLUMNS =
  'id, url, title, statement, description, location, created_at, published_at, votes(stance), article_topics(topics(name))'

const isArticle = (id: string) => /^\d+$/.test(id)

// Statements are written in one language; show the same text in every UI language.
const same = (text: string): Localized => ({ en: text, es: text, ca: text })

function tallyOf(votes: { stance: 'agree' | 'disagree' }[]): Tally {
  const yes = votes.filter((v) => v.stance === 'agree').length
  return { yes, no: votes.length - yes }
}

function outletOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function toTopic(row: Row): Topic {
  const id = String(row.id)
  const source: Source = {
    outlet: outletOf(row.url),
    title: row.title ?? row.statement,
    url: row.url,
    publishedAt: row.published_at ?? undefined,
  }
  return {
    id,
    slug: id,
    city: 'barcelona',
    area: row.location ?? 'Barcelona',
    category: same(row.article_topics.find((t) => t.topics)?.topics?.name ?? ''),
    question: same(row.statement),
    context: same(row.description ?? ''),
    tally: tallyOf(row.votes),
    sources: [source],
    createdAt: row.published_at ?? row.created_at,
  }
}

const total = (t: Tally) => t.yes + t.no

export function supabaseApi(db: SupabaseClient): Api {
  const currentUser = async () => (await db.auth.getSession()).data.session?.user ?? null

  // Voting needs a signed-in user, so a first-time voter gets a guest account.
  // Only done when someone votes, never just for visiting.
  async function voter() {
    const user = await currentUser()
    if (user) return user
    const { data, error } = await db.auth.signInAnonymously()
    if (error || !data.user) throw error ?? new Error('Could not sign in')
    return data.user
  }

  async function tally(topicId: string): Promise<Tally> {
    const { data, error } = await db.from('votes').select('stance').eq('article_id', topicId)
    if (error) throw error
    return tallyOf(data)
  }

  return {
    async listTopics(city) {
      const [{ data, error }, local] = await Promise.all([
        db.from('articles').select(COLUMNS).not('statement', 'is', null).order('created_at', { ascending: false }),
        mockApi.listTopics(city),
      ])
      if (error) throw error
      const real = (data as unknown as Row[]).map(toTopic).filter((t) => t.city === city)
      // Demo-only: sponsored questions and accepted proposals until they have tables.
      const extra = local.filter((t) => t.sponsor || t.fromProposal)
      // Most-voted first; the newest wins a tie (sort keeps the date order).
      return [...real, ...extra].sort((a, b) => total(b.tally) - total(a.tally))
    },

    async getTopic(slug) {
      if (!isArticle(slug)) return mockApi.getTopic(slug)
      const { data, error } = await db
        .from('articles')
        .select(COLUMNS)
        .eq('id', slug)
        .not('statement', 'is', null)
        .maybeSingle()
      if (error) throw error
      return data ? toTopic(data as unknown as Row) : null
    },

    async vote(topicId, input) {
      if (!isArticle(topicId)) return mockApi.vote(topicId, input)
      const user = await voter()
      const { error } = await db
        .from('votes')
        .upsert(
          { article_id: Number(topicId), user_id: user.id, stance: input.choice === 'yes' ? 'agree' : 'disagree' },
          { onConflict: 'article_id,user_id' },
        )
      if (error) throw error
      return tally(topicId)
    },

    async getMyVotes(deviceId) {
      const mine: Record<string, Choice> = { ...(await mockApi.getMyVotes(deviceId)) }
      const user = await currentUser()
      if (!user) return mine
      const { data, error } = await db.from('votes').select('article_id, stance').eq('user_id', user.id)
      if (error) throw error
      for (const v of data) mine[String(v.article_id)] = v.stance === 'agree' ? 'yes' : 'no'
      return mine
    },

    // The votes table tags places by barrio (votes.barrio_id), which the postcode
    // doesn't give us, so the district is only kept on the device for now.
    setDistrict: mockApi.setDistrict,

    async getDistrictResults(topicId) {
      if (!isArticle(topicId)) return mockApi.getDistrictResults(topicId)
      const { data, error } = await db
        .from('votes')
        .select('stance, barrios(district)')
        .eq('article_id', topicId)
        .not('barrio_id', 'is', null)
      if (error) throw error
      const rows = data as unknown as { stance: 'agree' | 'disagree'; barrios: { district: string | null } | null }[]
      return DISTRICTS.map(({ id, name }): DistrictResult => {
        const here = rows.filter((r) => r.barrios?.district === name)
        return { districtId: id, ...tallyOf(here) }
      })
    },

    async getTrend(topicId, range) {
      if (!isArticle(topicId)) return mockApi.getTrend(topicId, range)
      const { data, error } = await db
        .from('votes')
        .select('stance, created_at')
        .eq('article_id', topicId)
        .order('created_at')
      if (error) throw error
      if (!data.length) return []

      // Running totals per day, from the first vote to today.
      const byDay = new Map<string, { yes: number; no: number }>()
      for (const v of data) {
        const day = v.created_at.slice(0, 10)
        const d = byDay.get(day) ?? { yes: 0, no: 0 }
        d[v.stance === 'agree' ? 'yes' : 'no'] += 1
        byDay.set(day, d)
      }
      const points: TrendPoint[] = []
      let yes = 0
      let no = 0
      const today = new Date().toISOString().slice(0, 10)
      for (const day = new Date(data[0].created_at.slice(0, 10)); ; day.setUTCDate(day.getUTCDate() + 1)) {
        const date = day.toISOString().slice(0, 10)
        const d = byDay.get(date)
        if (d) {
          yes += d.yes
          no += d.no
        }
        points.push({ date, yesShare: yes / Math.max(1, yes + no), votes: yes + no })
        if (date >= today) break
      }
      const keep = range === '1m' ? 31 : range === '3m' ? 92 : points.length
      return points.slice(-keep)
    },

    // Demo-only until there's a proposals table.
    listProposals: mockApi.listProposals,
    createProposal: mockApi.createProposal,
    upvoteProposal: mockApi.upvoteProposal,
    getMyUpvotes: mockApi.getMyUpvotes,

    async requestMagicLink(email) {
      const { error } = await db.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: location.origin },
      })
      if (error) throw error
    },
  }
}
