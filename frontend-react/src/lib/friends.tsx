import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../api'
import type { Choice } from '../api/types'
import { useAuth } from './auth'

// Friends and topics sent between them (tables: profiles, friends, shares).
// Only for signed-in members, and only when the app runs on Supabase.

export interface Friend {
  id: string
  nickname: string
  /** I added them. */
  added: boolean
  /** They added me. Friends once both are true. */
  addedMe: boolean
}

export interface Received {
  id: number
  topicId: string
  question: string
  from: string
  note: string | null
  /** Their vote, when they chose to show it. */
  vote: Choice | null
  at: string
  read: boolean
}

interface Friends {
  /** False for guests, or when running on the in-browser mock. */
  available: boolean
  ready: boolean
  nickname: string | null
  friends: Friend[]
  inbox: Received[]
  unread: number
  setNickname: (nickname: string) => Promise<'ok' | 'taken' | 'invalid'>
  add: (nickname: string) => Promise<'ok' | 'missing' | 'self'>
  remove: (id: string) => Promise<void>
  send: (topicId: string, to: string[], note: string, vote: Choice | null) => Promise<void>
  markRead: () => Promise<void>
}

const Ctx = createContext<Friends | null>(null)
const NICKNAME = /^[\p{L}\p{N}_.-]{2,24}$/u

export function FriendsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [me, setMe] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [nickname, setNick] = useState<string | null>(null)
  const [friends, setFriends] = useState<Friend[]>([])
  const [inbox, setInbox] = useState<Received[]>([])

  // The signed-in (non-guest) Supabase user, if any.
  useEffect(() => {
    if (!supabase || !user) {
      setMe(null)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user
      setMe(u && !u.is_anonymous ? u.id : null)
    })
  }, [user])

  const load = useCallback(async () => {
    if (!supabase || !me) return
    const db = supabase
    const [profile, rows, shares] = await Promise.all([
      db.from('profiles').select('nickname').eq('id', me).maybeSingle(),
      db.from('friends').select('user_id, friend_id'),
      db
        .from('shares')
        .select('id, sender_id, article_id, note, sender_stance, created_at, read_at, articles(statement)')
        .eq('recipient_id', me)
        .order('created_at', { ascending: false })
        .limit(100),
    ])
    setNick(profile.data?.nickname ?? null)

    // Everyone on either side of a friend row, plus everyone who sent me something.
    const others = new Set<string>()
    for (const r of rows.data ?? []) others.add(r.user_id === me ? r.friend_id : r.user_id)
    for (const s of shares.data ?? []) others.add(s.sender_id)
    const names = new Map<string, string>()
    if (others.size) {
      const { data } = await db.from('profiles').select('id, nickname').in('id', [...others])
      for (const p of data ?? []) names.set(p.id, p.nickname)
    }

    const byId = new Map<string, Friend>()
    for (const r of rows.data ?? []) {
      const id = r.user_id === me ? r.friend_id : r.user_id
      const f = byId.get(id) ?? { id, nickname: names.get(id) ?? '…', added: false, addedMe: false }
      if (r.user_id === me) f.added = true
      else f.addedMe = true
      byId.set(id, f)
    }
    setFriends([...byId.values()].sort((a, b) => a.nickname.localeCompare(b.nickname)))

    setInbox(
      (shares.data ?? []).map((s) => {
        const article = (Array.isArray(s.articles) ? s.articles[0] : s.articles) as { statement: string } | null
        return {
          id: s.id,
          topicId: String(s.article_id),
          question: article?.statement ?? '',
          from: names.get(s.sender_id) ?? '…',
          note: s.note,
          vote: s.sender_stance === 'agree' ? 'yes' : s.sender_stance === 'disagree' ? 'no' : null,
          at: s.created_at,
          read: !!s.read_at,
        }
      }),
    )
    setReady(true)
  }, [me])

  // Load, then stay live: new friend requests and new sends arrive without a reload.
  useEffect(() => {
    if (!supabase || !me) {
      setFriends([])
      setInbox([])
      setNick(null)
      setReady(!supabase || !user)
      return
    }
    load()
    const channel = supabase
      .channel(`friends-${me}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friends' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shares', filter: `recipient_id=eq.${me}` }, load)
      .subscribe()
    return () => {
      supabase?.removeChannel(channel)
    }
  }, [me, user, load])

  const value: Friends = {
    available: !!supabase && !!me,
    ready,
    nickname,
    friends,
    inbox,
    unread: inbox.filter((x) => !x.read).length,

    async setNickname(name) {
      const nick = name.trim()
      if (!supabase || !me || !NICKNAME.test(nick)) return 'invalid'
      const { error } = nickname
        ? await supabase.from('profiles').update({ nickname: nick }).eq('id', me)
        : await supabase.from('profiles').insert({ id: me, nickname: nick })
      if (error) return error.code === '23505' ? 'taken' : 'invalid'
      setNick(nick)
      return 'ok'
    },

    async add(name) {
      // Exact match, ignoring case ("_" and "%" are escaped so they aren't wildcards).
      if (!supabase || !me) return 'missing'
      const { data } = await supabase.from('profiles').select('id').ilike('nickname', name.trim().replace(/[\\%_]/g, '\\$&')).maybeSingle()
      if (!data) return 'missing'
      if (data.id === me) return 'self'
      const { error } = await supabase.from('friends').upsert({ user_id: me, friend_id: data.id }, { ignoreDuplicates: true })
      if (error) throw error
      await load()
      return 'ok'
    },

    async remove(id) {
      if (!supabase || !me) return
      // Removing ends the friendship both ways.
      await supabase.from('friends').delete().or(`and(user_id.eq.${me},friend_id.eq.${id}),and(user_id.eq.${id},friend_id.eq.${me})`)
      await load()
    },

    async send(topicId, to, note, vote) {
      if (!supabase || !me) return
      const stance = vote === 'yes' ? 'agree' : vote === 'no' ? 'disagree' : null
      const { error } = await supabase.from('shares').insert(
        to.map((recipient_id) => ({
          sender_id: me,
          recipient_id,
          article_id: Number(topicId),
          note: note.trim() || null,
          sender_stance: stance,
        })),
      )
      if (error) throw error
    },

    async markRead() {
      if (!supabase || !me || !inbox.some((x) => !x.read)) return
      await supabase.from('shares').update({ read_at: new Date().toISOString() }).eq('recipient_id', me).is('read_at', null)
      await load()
    },
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useFriends() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useFriends outside provider')
  return v
}
