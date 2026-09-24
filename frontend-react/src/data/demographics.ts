import type { AgeBracket, Gender } from '../api/types'
import type { StringKey } from '../lib/i18n'

export const AGE_BRACKETS: AgeBracket[] = ['u18', '18-24', '25-34', '35-44', '45-54', '55-64', '65+']
/** Offered at sign-up; "na" (prefer not to say) is never shown as a chart group. */
export const AGE_OPTIONS: AgeBracket[] = [...AGE_BRACKETS, 'na']
export const GENDERS: Gender[] = ['female', 'male', 'nb']

export const ageLabel = (a: AgeBracket, t: (k: StringKey) => string) =>
  a === 'u18' ? t('ageU18') : a === 'na' ? t('preferNot') : a.replace('-', '–')

export const genderLabel = (g: Gender, t: (k: StringKey) => string) =>
  t(g === 'female' ? 'female' : g === 'male' ? 'male' : 'nonBinary')

/** Groups smaller than this are hidden so no individual can be picked out. */
export const MIN_GROUP = 5
