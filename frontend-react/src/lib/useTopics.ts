import { useCallback, useEffect, useState } from 'react'
import { api, supabase } from '../api'
import type { Topic } from '../api/types'

let channels = 0

const ARTICLE_TABLES: [table: string, idColumn: string][] = [['articles', 'id'], ['votes', 'article_id'], ['article_analysis', 'article_id']]

/**
 * Call `reload` when any of `tables` change in Supabase (articles, votes and analyses by
 * default), at most every half second so a burst of votes is one refetch. Pass `id` to
 * only listen to that row, or null to not listen at all. Does nothing without Supabase.
 */
export function useLive(reload: () => void, id?: string | null, tables = ARTICLE_TABLES) {
  useEffect(() => {
    if (!supabase || id === null) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const later = () => {
      timer ??= setTimeout(() => {
        timer = undefined
        reload()
      }, 500)
    }
    const on = (table: string, column: string) => ({
      event: '*' as const,
      schema: 'public',
      table,
      ...(id && { filter: `${column}=eq.${id}` }),
    })
    // A unique name per mount, so a quick remount never reuses a channel that is still closing.
    const channel = supabase.channel(`live-${++channels}`)
    for (const [table, column] of tables) channel.on('postgres_changes', on(table, column), later)
    channel.subscribe()
    return () => {
      clearTimeout(timer)
      supabase?.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `tables` is a constant per caller
  }, [reload, id])
}

/** `next` in the order of `prev`, new topics last, so live updates don't reshuffle the feed. */
function keepOrder(prev: Topic[] | null, next: Topic[]) {
  if (!prev) return next
  const rank = new Map(prev.map((t, i) => [t.id, i]))
  return [...next].sort((a, b) => (rank.get(a.id) ?? prev.length) - (rank.get(b.id) ?? prev.length))
}

export function useTopics(city: string | null) {
  const [topics, setTopics] = useState<Topic[] | null>(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    if (!city) return
    api.listTopics(city).then(setTopics).catch(() => setError(true))
  }, [city])
  const reload = useCallback(() => {
    if (city) api.listTopics(city).then((next) => setTopics((prev) => keepOrder(prev, next)), () => {})
  }, [city])
  useLive(reload)
  return { topics, error }
}

export function useTopic(slug: string | undefined) {
  const [topic, setTopic] = useState<Topic | null | undefined>(undefined)
  useEffect(() => {
    setTopic(undefined)
    if (slug) api.getTopic(slug).then(setTopic).catch(() => setTopic(null))
  }, [slug])
  const reload = useCallback(() => {
    if (slug) api.getTopic(slug).then(setTopic, () => {})
  }, [slug])
  useLive(reload, slug && /^\d+$/.test(slug) ? slug : null) // Demo topics aren't in Supabase
  return topic
}
