import { useCallback, useEffect, useState } from 'react'
import { api, supabase } from '../api'
import type { Topic } from '../api/types'

let channels = 0

/**
 * Call `reload` when articles, votes or analyses change in Supabase, at most every
 * half second so a burst of votes is one refetch. Pass `articleId` to only listen to
 * that article, or null to not listen at all. Does nothing without Supabase.
 */
function useLive(reload: () => void, articleId?: string | null) {
  useEffect(() => {
    if (!supabase || articleId === null) return
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
      ...(articleId && { filter: `${column}=eq.${articleId}` }),
    })
    // A unique name per mount, so a quick remount never reuses a channel that is still closing.
    const channel = supabase
      .channel(`live-${++channels}`)
      .on('postgres_changes', on('articles', 'id'), later)
      .on('postgres_changes', on('votes', 'article_id'), later)
      .on('postgres_changes', on('article_analysis', 'article_id'), later)
      .subscribe()
    return () => {
      clearTimeout(timer)
      supabase?.removeChannel(channel)
    }
  }, [reload, articleId])
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
