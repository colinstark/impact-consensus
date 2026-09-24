import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import type { Topic } from '../api/types'
import { useI18n } from '../lib/i18n'
import { useVotes } from '../lib/votes'
import { ChevronRight, MapIcon, Pin } from './Icons'
import { SponsorLabel } from './Sponsored'
import { VotePanel } from './VotePanel'

export function Eyebrow({ topic }: { topic: Topic }) {
  const { l, t } = useI18n()
  return (
    <div className="flex items-center gap-1.5 text-[13px] font-medium text-ink-3">
      <Pin />
      <span>{topic.area}</span>
      <span aria-hidden>·</span>
      <span>{l(topic.category)}</span>
      {topic.fromProposal && (
        <span className="ml-1 rounded-full bg-fill px-2 py-px text-[11px] font-semibold text-ink-2">{t('fromCommunity')}</span>
      )}
    </div>
  )
}

export function TopicCard({ topic, index = 0 }: { topic: Topic; index?: number }) {
  const { l, t } = useI18n()
  const { mine } = useVotes()
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', bounce: 0.2, duration: 0.6 }}
      className="rounded-[22px] bg-card p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_rgb(0_0_0/0.04)]"
    >
      {topic.sponsor && (
        <div className="mb-3 border-b border-hair pb-3">
          <SponsorLabel sponsor={topic.sponsor} />
        </div>
      )}
      <Link to={`/t/${topic.slug}`} className="group block">
        <Eyebrow topic={topic} />
        <h3 className="mt-2 flex items-start justify-between gap-3 text-[21px] font-semibold leading-[1.2] tracking-[-0.01em]">
          <span>{l(topic.question)}</span>
          <ChevronRight className="mt-1.5 size-4 shrink-0 text-ink-3 transition group-hover:translate-x-0.5" />
        </h3>
      </Link>
      <div className="mt-5">
        <VotePanel topic={topic} />
      </div>
      {mine[topic.id] && (
        <Link
          to={`/t/${topic.slug}/insights`}
          className="mt-4 flex items-center gap-2 border-t border-hair pt-3.5 text-[15px] font-medium text-yes"
        >
          <MapIcon className="size-[18px]" />
          <span className="flex-1">{t('insightsRow')}</span>
          <ChevronRight className="size-4" />
        </Link>
      )}
    </motion.article>
  )
}

/** Compact row used for "keep going" lists. */
export function TopicRow({ topic }: { topic: Topic }) {
  const { l, t } = useI18n()
  return (
    <Link to={`/t/${topic.slug}`} className="flex items-center gap-3 px-4 py-3.5 active:bg-fill">
      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-medium text-ink-3">
          {topic.area}
          {topic.sponsor && <> · {t('sponsoredBy', { s: topic.sponsor.name })}</>}
        </div>
        <div className="text-[16px] font-medium leading-snug">{l(topic.question)}</div>
      </div>
      <ChevronRight className="size-4 shrink-0 text-ink-3" />
    </Link>
  )
}
