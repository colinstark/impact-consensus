import { useEffect, useState } from 'react'
import { api } from '../api'
import type { Topic } from '../api/types'

export function useTopics(city: string | null) {
  const [topics, setTopics] = useState<Topic[] | null>(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    if (!city) return
    api.listTopics(city).then(setTopics).catch(() => setError(true))
  }, [city])
  return { topics, error }
}

export function useTopic(slug: string | undefined) {
  const [topic, setTopic] = useState<Topic | null | undefined>(undefined)
  useEffect(() => {
    setTopic(undefined)
    if (slug) api.getTopic(slug).then(setTopic).catch(() => setTopic(null))
  }, [slug])
  return topic
}
