import { BCN_DISTRICT_SHAPES } from './bcnDistricts'

// Barcelona's 10 districts. Names match the `barrios.district` column in Supabase.
export const DISTRICTS = BCN_DISTRICT_SHAPES.map(({ id, name }) => ({ id, name }))
export type DistrictId = (typeof BCN_DISTRICT_SHAPES)[number]['id']

export const districtName = (id: string) => DISTRICTS.find((d) => d.id === id)?.name ?? id

// Rough relative population, used to size the demo data.
export const DISTRICT_WEIGHT: Record<string, number> = {
  '01': 0.066, '02': 0.163, '03': 0.113, '04': 0.051, '05': 0.09,
  '06': 0.075, '07': 0.103, '08': 0.103, '09': 0.093, '10': 0.143,
}

// Postcode -> district. Some postcodes straddle two districts; each is mapped to
// the district that covers most of it.
const POSTCODES: Record<string, string> = {
  '08001': '01', '08002': '01', '08003': '01', '08039': '01',
  '08007': '02', '08008': '02', '08009': '02', '08010': '02', '08011': '02',
  '08013': '02', '08015': '02', '08036': '02', '08037': '02',
  '08004': '03', '08014': '03', '08038': '03', '08040': '03',
  '08028': '04', '08029': '04', '08034': '04',
  '08006': '05', '08017': '05', '08021': '05', '08022': '05',
  '08012': '06', '08023': '06', '08024': '06',
  '08025': '07', '08032': '07', '08035': '07', '08041': '07',
  '08016': '08', '08031': '08', '08033': '08', '08042': '08',
  '08027': '09', '08030': '09',
  '08005': '10', '08018': '10', '08019': '10', '08020': '10', '08026': '10',
}

export function districtForPostcode(raw: string): string | null {
  return POSTCODES[raw.replace(/\s/g, '')] ?? null
}
