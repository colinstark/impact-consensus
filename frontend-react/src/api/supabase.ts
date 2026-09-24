import type { SupabaseClient } from '@supabase/supabase-js'
import { DISTRICTS } from '../data/districts'
import { mockApi } from './mock'
import type { AgeBracket, Analysis, Api, Choice, Gender, Insights, Localized, Proposal, Source, Tally, Topic } from './types'

// Real backend: each analysed article in Supabase is a topic. Its `statement` is the
// question people vote on and its `description` is the neutral context.
// Enabled by setting VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.
//
// Features without tables yet (sponsored questions, postcode → district)
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
  // One analysis per article; PostgREST may return it as an object or a one-item list.
  article_analysis?: { status: string; analysis: Analysis | null } | { status: string; analysis: Analysis | null }[] | null
}

const COLUMNS =
  'id, url, title, statement, description, location, created_at, published_at, votes(stance), article_topics(topics(name))'

const isArticle = (id: string) => /^\d+$/.test(id)

// Accepted community proposals become articles with a placeholder url (see the proposals migration).
const fromProposal = (url: string) => url.startsWith('placa:proposal/')

type ProposalRow = {
  id: string
  city: string
  question: string
  context: string | null
  area: string
  created_at: string
  expires_at: string
  article_id: number | null
  upvotes: number
  yes: number
  no: number
  status: Proposal['status']
}

function toProposal(r: ProposalRow): Proposal {
  return {
    id: r.id,
    city: r.city,
    question: r.question,
    context: r.context ?? undefined,
    area: r.area,
    upvotes: r.upvotes,
    tally: { yes: r.yes, no: r.no },
    createdAt: r.created_at,
    expiresAt: r.expires_at,
    status: r.status,
    topicSlug: r.article_id ? String(r.article_id) : undefined,
  }
}

const answerOf = (stance: 'agree' | 'disagree'): Choice => (stance === 'agree' ? 'yes' : 'no')
const stanceOf = (answer: Choice) => (answer === 'yes' ? 'agree' : 'disagree')

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
    sources: fromProposal(row.url) ? [] : [source],
    fromProposal: fromProposal(row.url) || undefined,
    analysis: analysisOf(row) ?? undefined,
    createdAt: row.published_at ?? row.created_at,
  }
}

function analysisOf(row: Row) {
  const a = Array.isArray(row.article_analysis) ? row.article_analysis[0] : row.article_analysis
  return a?.status === 'ok' ? a.analysis : null
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

  async function getProposal(id: string) {
    const { data, error } = await db.from('proposal_tallies').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return data ? toProposal(data as ProposalRow) : null
  }

  async function upvoteProposal(id: string, answer: Choice) {
    await voter()
    // One upvote per person; a repeat is ignored rather than an error.
    const { error } = await db
      .from('proposal_upvotes')
      .upsert({ proposal_id: id, answer: stanceOf(answer) }, { onConflict: 'proposal_id,user_id', ignoreDuplicates: true })
    if (error) throw error
    const p = await getProposal(id)
    if (!p) throw new Error('Unknown proposal')
    return p
  }

  return {
    async listTopics(city) {
      const [{ data, error }, local] = await Promise.all([
        db.from('articles').select(COLUMNS).not('statement', 'is', null).order('created_at', { ascending: false }),
        mockApi.listTopics(city),
      ])
      if (error) throw error
      const real = (data as unknown as Row[]).map(toTopic).filter((t) => t.city === city)
      // Demo-only: sponsored questions until they have a table.
      const extra = local.filter((t) => t.sponsor)
      // Most-voted first; the newest wins a tie (sort keeps the date order).
      return [...real, ...extra].sort((a, b) => total(b.tally) - total(a.tally))
    },

    async getTopic(slug) {
      if (!isArticle(slug)) return mockApi.getTopic(slug)
      const { data, error } = await db
        .from('articles')
        .select(`${COLUMNS}, article_analysis(status, analysis)`)
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

    async getInsights(topicId) {
      if (!isArticle(topicId)) return mockApi.getInsights(topicId)
      const { data, error } = await db
        .from('votes')
        .select('stance, created_at, age_bracket, gender, barrios(district)')
        .eq('article_id', topicId)
        .order('created_at')
      if (error) throw error
      const rows = data as unknown as {
        stance: 'agree' | 'disagree'
        created_at: string
        age_bracket: AgeBracket | null
        gender: Gender | null
        barrios: { district: string | null } | null
      }[]
      const empty: Insights = { dates: [], overall: [], byDistrict: {}, byAge: {}, byGender: {} }
      if (!rows.length) return empty

      // One entry per day from the first vote to today, with running totals.
      const today = new Date().toISOString().slice(0, 10)
      const dates: string[] = []
      for (const d = new Date(rows[0].created_at.slice(0, 10)); ; d.setUTCDate(d.getUTCDate() + 1)) {
        const date = d.toISOString().slice(0, 10)
        dates.push(date)
        if (date >= today) break
      }
      const idOf = Object.fromEntries(DISTRICTS.map((x) => [x.name, x.id]))
      const running = (filter: (r: (typeof rows)[number]) => boolean): Tally[] => {
        let i = 0
        const t = { yes: 0, no: 0 }
        const matching = rows.filter(filter)
        return dates.map((date) => {
          while (i < matching.length && matching[i].created_at.slice(0, 10) <= date) {
            t[matching[i].stance === 'agree' ? 'yes' : 'no'] += 1
            i++
          }
          return { ...t }
        })
      }
      const byDistrict: Insights['byDistrict'] = {}
      for (const { id } of DISTRICTS) byDistrict[id] = running((r) => idOf[r.barrios?.district ?? ''] === id)
      // Only groups that have votes, so the page doesn't show empty bars.
      const byAge: Insights['byAge'] = {}
      for (const age of new Set(rows.map((r) => r.age_bracket))) if (age) byAge[age] = running((r) => r.age_bracket === age)
      const byGender: Insights['byGender'] = {}
      for (const g of new Set(rows.map((r) => r.gender))) if (g) byGender[g] = running((r) => r.gender === g)
      return { ...empty, dates, overall: running(() => true), byDistrict, byAge, byGender }
    },

    // Stored in the browser until profiles gain the sign-up fields (see API.md).
    saveProfile: mockApi.saveProfile,
    deleteProfile: mockApi.deleteProfile,

    async listProposals(city) {
      const { data, error } = await db.from('proposal_tallies').select('*').eq('city', city)
      if (error) throw error
      const order = { open: 0, accepted: 1, expired: 2 }
      return (data as ProposalRow[])
        .map(toProposal)
        .sort((a, b) => order[a.status] - order[b.status] || b.upvotes - a.upvotes)
    },

    getProposal,

    async createProposal(input) {
      await voter()
      const { data, error } = await db
        .from('proposals')
        .insert({ city: input.city, question: input.question, context: input.context || null, area: input.area })
        .select('id')
        .single()
      if (error) throw error
      return upvoteProposal(data.id, input.answer)
    },

    upvoteProposal,

    async getMyUpvotes() {
      const user = await currentUser()
      if (!user) return {}
      const { data, error } = await db.from('proposal_upvotes').select('proposal_id, answer').eq('user_id', user.id)
      if (error) throw error
      return Object.fromEntries(data.map((u) => [u.proposal_id, answerOf(u.answer)]))
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
