import type { Api } from './types'

// Real backend client. Enabled by setting VITE_API_URL (see API.md).
export function httpApi(base: string): Api {
  const req = async <T>(path: string, init?: RequestInit): Promise<T> => {
    const res = await fetch(base + path, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
    if (res.status === 404) return null as T
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    return res.status === 204 ? (undefined as T) : res.json()
  }

  return {
    listTopics: () => req('/topics'),
    getTopic: (slug) => req(`/topics/${encodeURIComponent(slug)}`),
    vote: (topicId, choice, deviceId, source) =>
      req(`/topics/${encodeURIComponent(topicId)}/votes`, {
        method: 'PUT',
        body: JSON.stringify({ choice, deviceId, source }),
      }),
    getMyVotes: (deviceId) => req(`/devices/${encodeURIComponent(deviceId)}/votes`),
    getTrend: (topicId, range) => req(`/topics/${encodeURIComponent(topicId)}/trend?range=${range}`),
    requestMagicLink: (email) =>
      req('/auth/magic-link', { method: 'POST', body: JSON.stringify({ email }) }),
  }
}
