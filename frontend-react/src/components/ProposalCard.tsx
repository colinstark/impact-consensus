import { motion } from 'framer-motion'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Choice, Proposal } from '../api/types'
import { useI18n } from '../lib/i18n'
import { timeLeft, UPVOTE_THRESHOLD } from '../lib/useProposals'
import { useVotes } from '../lib/votes'
import { ArrowUp, Check, Clock, Pin } from './Icons'
import { useToast } from './Toast'

export function ProposalCard({ proposal: p, myAnswer, onUpvote }: {
  proposal: Proposal
  myAnswer?: Choice
  onUpvote: (id: string, a: Choice) => Promise<Proposal>
}) {
  const { t, n } = useI18n()
  const toast = useToast()
  const { refresh } = useVotes()
  const [busy, setBusy] = useState(false)
  const progress = Math.min(1, p.upvotes / UPVOTE_THRESHOLD)
  const left = timeLeft(p.expiresAt)

  async function upvote(a: Choice) {
    setBusy(true)
    navigator.vibrate?.(8)
    try {
      const updated = await onUpvote(p.id, a)
      if (updated.status === 'accepted') {
        toast(t('acceptedToast'))
        await refresh()
      }
    } catch {
      toast(t('error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-[22px] bg-card p-5 ${p.status === 'expired' ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center justify-between gap-2 text-[13px] font-medium text-ink-3">
        <span className="flex items-center gap-1.5"><Pin /> {p.area}</span>
        {p.status === 'open' && (
          <span className="flex items-center gap-1 tabular">
            <Clock /> {left.hours >= 1 ? t('hoursLeft', { h: left.hours }) : t('minutesLeft', { m: left.minutes })}
          </span>
        )}
        {p.status === 'accepted' && (
          <span className="flex items-center gap-1 rounded-full bg-yes px-2 py-0.5 text-[12px] font-semibold text-white">
            <Check className="size-3" /> {t('accepted')}
          </span>
        )}
        {p.status === 'expired' && <span>{t('expired')}</span>}
      </div>

      <h3 className="mt-2 text-[19px] font-semibold leading-snug tracking-[-0.01em]">{p.question}</h3>
      {p.context && <p className="mt-1.5 text-[14px] leading-snug text-ink-2">{p.context}</p>}

      <div className="mt-4">
        <div className="h-2 overflow-hidden rounded-full bg-fill" role="progressbar"
          aria-valuemin={0} aria-valuemax={UPVOTE_THRESHOLD} aria-valuenow={p.upvotes}>
          <motion.div
            className="h-full rounded-full bg-ink"
            initial={false}
            animate={{ width: `${progress * 100}%` }}
            transition={{ type: 'spring', bounce: 0.15, duration: 0.7 }}
          />
        </div>
        <div className="mt-1.5 text-[13px] font-medium text-ink-2 tabular">
          {t('upvotesOf', { n: n(p.upvotes), t: UPVOTE_THRESHOLD })}
        </div>
      </div>

      {p.status === 'accepted' && p.topicSlug ? (
        <Link to={`/t/${p.topicSlug}`} className="mt-4 flex h-12 items-center justify-center rounded-2xl bg-ink text-[16px] font-semibold text-bg">
          {t('openTopic')}
        </Link>
      ) : myAnswer ? (
        <p className="mt-4 flex items-center gap-2 text-[14px] font-medium">
          <span className={`grid size-5 place-items-center rounded-full text-white ${myAnswer === 'yes' ? 'bg-yes' : 'bg-no'}`}>
            <Check className="size-3" />
          </span>
          {t('upvoted', { a: myAnswer === 'yes' ? t('yes') : t('no') })}
        </p>
      ) : p.status === 'open' ? (
        <div className="mt-4">
          <p className="mb-2 flex items-center gap-1.5 text-[13px] font-medium text-ink-3">
            <ArrowUp className="size-3.5" /> {t('upvoteWith')}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(['yes', 'no'] as const).map((a) => (
              <motion.button
                key={a}
                whileTap={{ scale: 0.96 }}
                disabled={busy}
                onClick={() => upvote(a)}
                className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-fill text-[16px] font-semibold hover:bg-fill-2 disabled:opacity-60"
              >
                <span className={`size-2.5 rounded-full ${a === 'yes' ? 'bg-yes' : 'bg-no'}`} aria-hidden />
                {a === 'yes' ? t('yes') : t('no')}
              </motion.button>
            ))}
          </div>
        </div>
      ) : null}
    </motion.article>
  )
}
