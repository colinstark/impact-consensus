import type { SupabaseClient } from '@supabase/supabase-js'
import type { Api, Choice, Localized, Tally, Topic, TrendPoint } from './types'

// Real backend: each analysed article in Supabase is a topic. Its `statement` is the
// question people vote on and its `description` is the neutral context.
// Enabled by setting VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.

type Row = {
  id: number
  statement: string
  description: string | null
  location: string | null
  created_at: string
  published_at: string | null
  votes: { stance: 'agree' | 'disagree' }[]
  article_topics: { topics: { name: string } | null }[]
}

const COLUMNS =
  'id, statement, description, location, created_at, published_at, votes(stance), article_topics(topics(name))'

// The database has no "don't mind" vote, so skips are remembered in this browser only.
const SKIPS = 'placa.skips'
const skips = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(SKIPS) ?? '[]')
  } catch {
    return []
  }
}
const setSkip = (topicId: string, on: boolean) => {
  const rest = skips().filter((id) => id !== topicId)
  localStorage.setItem(SKIPS, JSON.stringify(on ? [...rest, topicId] : rest))
}

// Statements are written in one language; show the same text in every UI language.
const same = (text: string): Localized => ({ en: text, es: text, ca: text })

function tallyOf(topicId: string, votes: Row['votes']): Tally {
  const yes = votes.filter((v) => v.stance === 'agree').length
  return { yes, no: votes.length - yes, skip: skips().includes(topicId) ? 1 : 0 }
}

function toTopic(row: Row): Topic {
  const id = String(row.id)
  return {
    id,
    slug: id,
    area: row.location ?? 'Barcelona',
    category: same(row.article_topics.find((t) => t.topics)?.topics?.name ?? ''),
    question: same(row.statement),
    context: same(row.description ?? ''),
    tally: tallyOf(id, row.votes),
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
    return tallyOf(topicId, data)
  }

  return {
    async listTopics() {
      const { data, error } = await db
        .from('articles')
        .select(COLUMNS)
        .not('statement', 'is', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      // Most-voted first; the newest wins a tie (sort keeps the date order).
      return (data as unknown as Row[]).map(toTopic).sort((a, b) => total(b.tally) - total(a.tally))
    },

    async getTopic(slug) {
      if (!/^\d+$/.test(slug)) return null
      const { data, error } = await db
        .from('articles')
        .select(COLUMNS)
        .eq('id', slug)
        .not('statement', 'is', null)
        .maybeSingle()
      if (error) throw error
      return data ? toTopic(data as unknown as Row) : null
    },

    async vote(topicId, choice) {
      const user = await voter()
      const { error } =
        choice === 'skip'
          ? await db.from('votes').delete().eq('article_id', topicId).eq('user_id', user.id)
          : await db
              .from('votes')
              .upsert(
                { article_id: Number(topicId), user_id: user.id, stance: choice === 'yes' ? 'agree' : 'disagree' },
                { onConflict: 'article_id,user_id' },
              )
      if (error) throw error
      setSkip(topicId, choice === 'skip')
      return tally(topicId)
    },

    async getMyVotes() {
      const mine: Record<string, Choice> = {}
      for (const id of skips()) mine[id] = 'skip'
      const user = await currentUser()
      if (!user) return mine
      const { data, error } = await db.from('votes').select('article_id, stance').eq('user_id', user.id)
      if (error) throw error
      for (const v of data) mine[String(v.article_id)] = v.stance === 'agree' ? 'yes' : 'no'
      return mine
    },

    async getTrend(topicId, range) {
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

    async requestMagicLink(email) {
      const { error } = await db.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: location.origin },
      })
      if (error) throw error
    },
  }
}
