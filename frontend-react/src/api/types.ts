// Shared contract between the front end and the backend team.
// See API.md for the HTTP shape of each call.

export type Lang = 'en' | 'es' | 'ca'
export type Localized = Record<Lang, string>

export type Choice = 'yes' | 'no'

export interface Tally {
  yes: number
  no: number
}

/** A news story behind a topic, shown under "I don't know — tell me more". */
export interface Source {
  outlet: string
  title: string
  url: string
  publishedAt?: string
  /** "search" = a link to the outlet's coverage of the topic rather than one article. Defaults to "article". */
  kind?: 'article' | 'search'
}

/** A local business that paid to put a question to the community. Always labelled in the UI. */
export interface Sponsor {
  name: string
  url?: string
  /** One line about the business, shown in the "Why am I seeing this?" sheet. */
  about?: Localized
}

export interface Topic {
  id: string
  /** URL-safe id used in deep links / QR codes: /t/:slug */
  slug: string
  /** City id, e.g. "barcelona". */
  city: string
  /** District name, or the city name for city-wide issues. */
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
  sources: Source[]
  /** The analyser's full breakdown of the source article; only loaded on the topic page. */
  analysis?: Analysis
  /** Sponsored questions are never shown in the top three and never block unlocking. */
  sponsor?: Sponsor
  /** Set when the topic came from a community proposal that reached 100 upvotes. */
  fromProposal?: boolean
  createdAt: string
}

export interface DistrictResult extends Tally {
  /** Two-digit district code, "01" (Ciutat Vella) … "10" (Sant Martí). */
  districtId: string
}

export interface TrendPoint {
  /** ISO date (day resolution). */
  date: string
  /** Share of yes among votes cast up to that day, 0–1. */
  yesShare: number
  /** Cumulative votes up to that day. */
  votes: number
}

export type TrendRange = '1m' | '3m' | 'all'

export type ProposalStatus = 'open' | 'accepted' | 'expired'

/** A community-proposed question. 100 upvotes within 48 hours adds it to the topic list. */
export interface Proposal {
  id: string
  city: string
  /** Written by a resident in their own language, so not localised. */
  question: string
  context?: string
  area: string
  upvotes: number
  /** The yes/no answers given with each upvote. Carried over if the question is accepted. */
  tally: Tally
  createdAt: string
  expiresAt: string
  status: ProposalStatus
  /** Slug of the resulting topic once accepted. */
  topicSlug?: string
}

export interface NewProposal {
  city: string
  question: string
  context?: string
  area: string
  /** The proposer's own answer, which counts as the first upvote. */
  answer: Choice
}

export interface VoteInput {
  choice: Choice
  deviceId: string
  /** The ?src= param from the entry URL, e.g. a QR poster id. */
  source?: string
  /** Voter's home district, once they've entered a postcode. */
  districtId?: string
}

export type AgeBracket = 'u18' | '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+' | 'na'
/** "nb" = non-binary / prefer not to say, one option by design. */
export type Gender = 'female' | 'male' | 'nb'

/** Collected at sign-up to unlock insights. */
export interface UserProfile {
  name: string
  email: string
  postcode: string
  districtId: string
  ageBracket: AgeBracket
  gender: Gender
  /** Opt-in only, off by default. Without it, answers are only ever used in aggregate. */
  shareWithThirdParties: boolean
  acceptedTermsAt: string
  /** Version of the terms/privacy policy they agreed to. */
  consentVersion: string
}

export type User = { email: string } & Partial<UserProfile>

/**
 * Cumulative daily tallies for a topic, overall and per group, so the insights
 * timeline can show any day. Every array lines up with `dates`.
 */
export interface Insights {
  dates: string[]
  overall: Tally[]
  byDistrict: Record<string, Tally[]>
  byAge: Partial<Record<AgeBracket, Tally[]>>
  byGender: Partial<Record<Gender, Tally[]>>
}

export interface Api {
  /** Topics for a city, ordered by activity (most-voted first). */
  listTopics(city: string): Promise<Topic[]>
  getTopic(slug: string): Promise<Topic | null>
  /** Records (or replaces) this device's vote. */
  vote(topicId: string, input: VoteInput): Promise<Tally>
  getMyVotes(deviceId: string): Promise<Record<string, Choice>>
  /** Tags this device's existing and future votes with a home district. */
  setDistrict(deviceId: string, districtId: string): Promise<void>
  /** Everything the insights page needs: overall, by district, age and gender, per day. */
  getInsights(topicId: string): Promise<Insights>

  /** Stores the sign-up profile. Demographics are only ever published in aggregate. */
  saveProfile(deviceId: string, profile: UserProfile): Promise<void>
  /** GDPR erasure: deletes the profile and unlinks this device's votes from it. */
  deleteProfile(deviceId: string, email: string): Promise<void>

  listProposals(city: string): Promise<Proposal[]>
  getProposal(id: string): Promise<Proposal | null>
  createProposal(input: NewProposal, deviceId: string): Promise<Proposal>
  /** An upvote always comes with the voter's answer. One per device. */
  upvoteProposal(proposalId: string, answer: Choice, deviceId: string): Promise<Proposal>
  getMyUpvotes(deviceId: string): Promise<Record<string, Choice>>

  requestMagicLink(email: string): Promise<void>
}

/**
 * The article analyser's output (see supabase/functions/article-analyzer/prompt.ts).
 * Written by a model, so every field may be missing or null.
 */
type Maybe<T> = T | null | undefined
export type Tier = Maybe<string>

export interface Analysis {
  analysis_viability?: Maybe<'full' | 'partial' | 'insufficient'>
  provenance?: Maybe<{
    outlet?: Maybe<string>
    author?: Maybe<string>
    published?: Maybe<string>
    language?: Maybe<string>
    content_type?: Maybe<string>
    geographic_scope?: Maybe<string>
  }>
  integrity_flags?: Maybe<{ flag?: Maybe<string>; detail?: Maybe<string> }[]>
  factual_spine?: Maybe<{
    summary?: Maybe<string>
    actors?: Maybe<{ name?: Maybe<string>; role?: Maybe<string>; authority?: Maybe<string> }[]>
    timeline?: Maybe<{ date?: Maybe<string>; event?: Maybe<string>; tier?: Tier }[]>
    quantities?: Maybe<{
      value?: Maybe<string>
      unit?: Maybe<string>
      denominator?: Maybe<string>
      period?: Maybe<string>
      source?: Maybe<string>
      tier?: Tier
    }[]>
    stated_mechanism?: Maybe<string>
  }>
  bias_analysis?: Maybe<{
    categories?: Maybe<{
      category?: Maybe<string>
      observation?: Maybe<string>
      evidence?: Maybe<string>
      favours?: Maybe<string>
      strength?: Maybe<string>
    }[]>
    voices_present?: Maybe<string[]>
    voices_absent?: Maybe<string[]>
    overall_direction?: Maybe<string>
    confidence?: Maybe<string>
  }>
  decisions?: Maybe<AnalysisDecision[]>
  missing_information?: Maybe<{ item?: Maybe<string>; why_it_matters?: Maybe<string> }[]>
}

export interface AnalysisDecision {
  id?: Maybe<string>
  description?: Maybe<string>
  status?: Maybe<string>
  decision_maker?: Maybe<string>
  ledger?: Maybe<{
    advantages?: Maybe<{ effect?: Maybe<string>; accrues_to?: Maybe<string>; magnitude?: Maybe<string>; horizon?: Maybe<string>; tier?: Tier }[]>
    disadvantages?: Maybe<{ effect?: Maybe<string>; borne_by?: Maybe<string>; magnitude?: Maybe<string>; horizon?: Maybe<string>; tier?: Tier }[]>
    contested?: Maybe<{ question?: Maybe<string>; position_a?: Maybe<string>; position_b?: Maybe<string> }[]>
    conditional?: Maybe<{ effect?: Maybe<string>; condition?: Maybe<string> }[]>
    symmetry_note?: Maybe<string>
  }>
  economic_byproducts?: Maybe<{
    direct_fiscal?: Maybe<Record<string, Maybe<string>>>
    incidence?: Maybe<{ statutory_payer?: Maybe<string>; economic_bearer?: Maybe<string>; shift_mechanism?: Maybe<string>; tier?: Tier }>
    distribution?: Maybe<{ group?: Maybe<string>; net_effect?: Maybe<string>; direction?: Maybe<string> }[]>
    behavioural_response?: Maybe<{ response?: Maybe<string>; actor?: Maybe<string>; assumption?: Maybe<string> }[]>
    market_effects?: Maybe<{ market?: Maybe<string>; effect?: Maybe<string>; tier?: Tier }[]>
    externalities?: Maybe<{ effect?: Maybe<string>; party?: Maybe<string>; sign?: Maybe<string>; priced?: Maybe<boolean> }[]>
    opportunity_cost?: Maybe<{ resource?: Maybe<string>; alternative_use?: Maybe<string>; tier?: Tier }>
    time_profile?: Maybe<{ immediate?: Maybe<string>; medium_1_3y?: Maybe<string>; long_5y_plus?: Maybe<string>; mismatch_note?: Maybe<string> }>
    second_order?: Maybe<{ byproduct?: Maybe<string>; pathway?: Maybe<string>; tier?: Tier }[]>
    uncertainty?: Maybe<{ key_assumptions?: Maybe<string[]>; most_load_bearing?: Maybe<string>; data_gaps?: Maybe<string[]> }>
  }>
}
