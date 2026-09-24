import type { Topic } from '../api/types'

export const BATCH = 3

/**
 * Order the home feed. Sponsored questions never appear in the first batch, and at
 * most one goes in each later batch, in its last slot.
 */
export function arrangeFeed(topics: Topic[]): Topic[] {
  const organic = topics.filter((t) => !t.sponsor)
  const sponsored = topics.filter((t) => t.sponsor)
  const out = organic.slice(0, BATCH)
  let i = BATCH
  let s = 0
  while (i < organic.length || s < sponsored.length) {
    out.push(...organic.slice(i, i + BATCH - 1))
    i += BATCH - 1
    if (s < sponsored.length) out.push(sponsored[s++])
  }
  return out
}

/**
 * Show the feed in batches; answering every non-sponsored topic in a batch unlocks
 * the next. Nobody has to vote on a sponsored question to see more.
 */
export function visibleTopics(feed: Topic[], answered: Record<string, unknown>) {
  let count = 0
  while (count < feed.length) {
    const batch = feed.slice(count, count + BATCH)
    count += batch.length
    if (!batch.every((t) => t.sponsor || answered[t.id])) break
  }
  return feed.slice(0, count)
}

/** Unanswered topics to suggest next, sponsored ones last. */
export function nextTopics(topics: Topic[], answered: Record<string, unknown>, exclude?: string) {
  const open = topics.filter((t) => t.id !== exclude && !answered[t.id])
  return [...open.filter((t) => !t.sponsor), ...open.filter((t) => t.sponsor)]
}
