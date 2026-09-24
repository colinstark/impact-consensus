import { useEffect, useState } from 'react'
import { api } from '../api'
import type { Topic } from '../api/types'

export function useTopics() {
  const [topics, setTopics] = useState<Topic[] | null>(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    api.listTopics().then(setTopics).catch(() => setError(true))
  }, [])
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
