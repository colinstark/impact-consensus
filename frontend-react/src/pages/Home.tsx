import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronRight, Lock, Pin, Plus, Sparkle } from '../components/Icons'
import { ProposalCard } from '../components/ProposalCard'
import { TopBar } from '../components/TopBar'
import { TopicCard } from '../components/TopicCard'
import { useToast } from '../components/Toast'
import { cityName } from '../data/cities'
import { useCity } from '../lib/city'
import { arrangeFeed, BATCH, visibleTopics } from '../lib/feed'
import { useI18n } from '../lib/i18n'
import { UPVOTE_THRESHOLD, useProposals } from '../lib/useProposals'
import { useTopics } from '../lib/useTopics'
import { useVotes } from '../lib/votes'

export default function Home() {
  const { t } = useI18n()
  const { city } = useCity()
  const { topics, error } = useTopics(city)
  const proposals = useProposals(city)
  const openProposals = proposals.proposals?.filter((p) => p.status === 'open').slice(0, 2) ?? []
  const { mine, ready } = useVotes()
  const toast = useToast()

  // Keep the original order stable while people vote; tallies change but cards shouldn't jump.
  const visible = topics && ready ? visibleTopics(arrangeFeed(topics), mine) : null
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
        <section className="pt-6 pb-6">
          <Link
            to="/city"
            aria-label={t('changeCity')}
            className="mb-4 inline-flex items-center gap-1 rounded-full bg-fill px-3 py-1 text-[13px] font-semibold text-ink-2"
          >
            <Pin /> {cityName(city ?? '')} <ChevronDown className="size-3.5" />
          </Link>
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

        <section className="mt-12">
          <div className="mb-3 flex items-baseline justify-between px-1">
            <h2 className="text-[22px] font-bold tracking-tight">{t('fromCommunity')}</h2>
            <Link to="/proposals" className="flex items-center text-[15px] font-medium text-yes">
              {t('seeAll')} <ChevronRight className="size-4" />
            </Link>
          </div>
          <p className="mb-4 px-1 text-[15px] leading-snug text-ink-2">{t('proposalsSub', { n: UPVOTE_THRESHOLD })}</p>
          <div className="space-y-3">
            {openProposals.map((p) => (
              <ProposalCard key={p.id} proposal={p} myAnswer={proposals.mine[p.id]} onUpvote={proposals.upvote} />
            ))}
          </div>
          <Link
            to="/proposals/new"
            className="mt-3 flex items-center gap-3 rounded-[22px] border border-dashed border-hair p-5 active:bg-fill"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-bg"><Plus /></span>
            <span className="flex-1">
              <span className="block text-[17px] font-semibold">{t('proposeCta', { c: cityName(city ?? '') })}</span>
              <span className="block text-[14px] text-ink-2">{t('propose')}</span>
            </span>
            <ChevronRight className="size-4 text-ink-3" />
          </Link>
        </section>
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
