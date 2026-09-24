import { createClient } from '@supabase/supabase-js'
import { httpApi } from './http'
import { mockApi } from './mock'
import { supabaseApi } from './supabase'
import type { Api } from './types'

const base = import.meta.env.VITE_API_URL as string | undefined
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

// Supabase when configured, else a custom HTTP backend, else the in-browser mock.
export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null
export const api: Api = supabase ? supabaseApi(supabase) : base ? httpApi(base.replace(/\/$/, '')) : mockApi
export const usingMock = !supabase && !base
export type * from './types'
