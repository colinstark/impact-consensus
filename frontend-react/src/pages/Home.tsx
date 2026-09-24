import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { Lock, Sparkle } from '../components/Icons'
import { TopBar } from '../components/TopBar'
import { TopicCard } from '../components/TopicCard'
import { useToast } from '../components/Toast'
import type { Topic } from '../api/types'
import { useI18n } from '../lib/i18n'
import { useTopics } from '../lib/useTopics'
import { useVotes } from '../lib/votes'

const BATCH = 3

/** Show topics in batches of three; answering every topic in a batch unlocks the next. */
function visibleTopics(topics: Topic[], answered: Record<string, unknown>) {
  let count = 0
  while (count < topics.length) {
    const batch = topics.slice(count, count + BATCH)
    count += batch.length
    if (!batch.every((t) => answered[t.id])) break
  }
  return topics.slice(0, count)
}

export default function Home() {
  const { t } = useI18n()
  const { topics, error } = useTopics()
  const { mine, ready } = useVotes()
  const toast = useToast()

  // Keep the original order stable while people vote; tallies change but cards shouldn't jump.
  const visible = topics && ready ? visibleTopics(topics, mine) : null
  const remaining = topics && visible ? topics.length - visible.length : 0
  const prevCount = useRef<number | null>(null)

  useEffect(() => {
    if (!visible) return
    if (prevCount.current != null && visible.length > prevCount.current) toast(t('unlocked'))
    prevCount.current = visible.length
  }, [visible?.length]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-xl px-4 pb-16 safe-bottom">
        <section className="pt-8 pb-6">
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[34px] font-bold leading-[1.1] tracking-[-0.02em]"
          >
            {t('tagline')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mt-3 text-[17px] leading-relaxed text-ink-2"
          >
            {t('intro')}
          </motion.p>
        </section>

        <h2 className="mb-3 px-1 text-[13px] font-semibold uppercase tracking-wide text-ink-3">{t('trending')}</h2>

        {error && <p className="text-ink-2">{t('error')}</p>}
        {!visible && !error && <Skeletons />}

        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {visible?.map((topic, i) => (
              <TopicCard key={topic.id} topic={topic} index={i % BATCH} />
            ))}
          </AnimatePresence>

          {visible && remaining > 0 && (
            <motion.div layout className="relative overflow-hidden rounded-[22px] border border-dashed border-hair p-5 text-center">
              <div className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-fill text-ink-2">
                <Lock className="size-5" />
              </div>
              <div className="text-[17px] font-semibold">{t('unlockTitle')}</div>
              <p className="mt-1 text-[15px] text-ink-2">{t('unlockBody')}</p>
            </motion.div>
          )}
          {visible && remaining === 0 && (
            <motion.div layout className="flex items-center gap-3 rounded-[22px] bg-card p-5 text-[15px] text-ink-2">
              <Sparkle className="size-5 shrink-0 text-yes" /> {t('allDone')}
            </motion.div>
          )}
        </div>
      </main>
    </>
  )
}

function Skeletons() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-64 animate-pulse rounded-[22px] bg-card" />
      ))}
    </div>
  )
}
