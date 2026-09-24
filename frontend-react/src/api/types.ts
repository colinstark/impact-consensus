// Shared contract between the front end and the backend team.
// See API.md at the repo root for the HTTP shape of each call.

export type Lang = 'en' | 'es' | 'ca'
export type Localized = Record<Lang, string>

/** yes / no, or "don't care, just show me the results". */
export type Choice = 'yes' | 'no' | 'skip'

export interface Tally {
  yes: number
  no: number
  skip: number
}

export interface Topic {
  id: string
  /** URL-safe id used in deep links / QR codes: /t/:slug */
  slug: string
  /** Neighbourhood or "Barcelona" for city-wide issues. */
  area: string
  category: Localized
  question: Localized
  /** One or two sentences of neutral context. */
  context: Localized
  tally: Tally
  /**
   * Optional: what media coverage implies the city thinks, as a share of "yes"
   * (0–1). Rendered as a marker on the results bar so people can see the gap
   * between headlines and the community.
   */
  headlineYesShare?: number
  createdAt: string
}

export interface TrendPoint {
  /** ISO date (day resolution). */
  date: string
  /** Share of yes among yes+no votes cast up to that day, 0–1. */
  yesShare: number
  /** Cumulative yes+no votes up to that day. */
  votes: number
}

export type TrendRange = '1m' | '3m' | 'all'

export interface User {
  email: string
}

export interface Api {
  /** Topics ordered by recent activity (most-voted first). */
  listTopics(): Promise<Topic[]>
  getTopic(slug: string): Promise<Topic | null>
  /**
   * Records (or replaces) this device's vote. `source` is the ?src= param from
   * the entry URL, e.g. a QR code id, so the team can measure which posters work.
   */
  vote(topicId: string, choice: Choice, deviceId: string, source?: string): Promise<Tally>
  getMyVotes(deviceId: string): Promise<Record<string, Choice>>
  getTrend(topicId: string, range: TrendRange): Promise<TrendPoint[]>
  requestMagicLink(email: string): Promise<void>
}
