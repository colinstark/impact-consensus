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
  const e = encodeURIComponent
  const send = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) })

  return {
    listTopics: (city) => req(`/topics?city=${e(city)}`),
    getTopic: (slug) => req(`/topics/${e(slug)}`),
    vote: (topicId, input) => req(`/topics/${e(topicId)}/votes`, send('PUT', input)),
    getMyVotes: (deviceId) => req(`/devices/${e(deviceId)}/votes`),
    setDistrict: (deviceId, districtId) => req(`/devices/${e(deviceId)}`, send('PATCH', { districtId })),
    getInsights: (topicId) => req(`/topics/${e(topicId)}/insights`),
    saveProfile: (deviceId, profile) => req('/profile', send('PUT', { ...profile, deviceId })),
    deleteProfile: (deviceId, email) => req('/profile', send('DELETE', { deviceId, email })),
    listProposals: (city) => req(`/proposals?city=${e(city)}`),
    getProposal: (id) => req(`/proposals/${e(id)}`),
    createProposal: (input, deviceId) => req('/proposals', send('POST', { ...input, deviceId })),
    upvoteProposal: (id, answer, deviceId) => req(`/proposals/${e(id)}/upvotes`, send('PUT', { answer, deviceId })),
    getMyUpvotes: (deviceId) => req(`/devices/${e(deviceId)}/upvotes`),
    requestMagicLink: (email) => req('/auth/magic-link', send('POST', { email })),
  }
}
