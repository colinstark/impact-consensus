import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { Choice, Tally, Topic } from '../api/types'
import { useI18n } from '../lib/i18n'
import { useVotes } from '../lib/votes'
import { Check, Lock } from './Icons'
import { LockedResult, ResultBar } from './ResultBar'
import { useToast } from './Toast'

const fade = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.25 },
}

export function VotePanel({ topic, size = 'card' }: { topic: Topic; size?: 'card' | 'page' }) {
  const { t, n } = useI18n()
  const { mine, cast } = useVotes()
  const toast = useToast()
  const [tally, setTally] = useState<Tally>(topic.tally)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const choice = mine[topic.id]
  const big = size === 'page'

  useEffect(() => {
    setTally(topic.tally)
  }, [topic.tally])

  async function vote(c: Choice) {
    if (busy) return
    setBusy(true)
    navigator.vibrate?.(8)
    try {
      setTally(await cast(topic.id, c))
      setEditing(false)
    } catch {
      toast(t('error'))
    } finally {
      setBusy(false)
    }
  }

  const showButtons = !choice || editing
  const showResults = !!choice

  return (
    <div>
      <AnimatePresence mode="wait" initial={false}>
        {showButtons ? (
          <motion.div key="buttons" {...fade} className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <VoteButton label={t('yes')} dot="bg-yes" active={choice === 'yes'} big={big} disabled={busy} onClick={() => vote('yes')} />
              <VoteButton label={t('no')} dot="bg-no" active={choice === 'no'} big={big} disabled={busy} onClick={() => vote('no')} />
            </div>
            {choice !== 'skip' && (
              <button
                disabled={busy}
                onClick={() => vote('skip')}
                className={`w-full rounded-2xl py-2.5 font-medium text-ink-2 transition active:scale-[0.98] active:bg-fill ${big ? 'text-[16px]' : 'text-[14px]'}`}
              >
                {t('skip')}
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div key="status" {...fade} className="flex items-center justify-between gap-3">
            <span className={`flex items-center gap-2 font-medium ${big ? 'text-[16px]' : 'text-[14px]'}`}>
              {choice === 'skip' ? (
                <span className="text-ink-2">{t('youSkipped')}</span>
              ) : (
                <>
                  <span className={`grid size-5 place-items-center rounded-full text-white ${choice === 'yes' ? 'bg-yes' : 'bg-no'}`}>
                    <Check className="size-3" />
                  </span>
                  {t('youSaid')} <b>{choice === 'yes' ? t('yes') : t('no')}</b>
                </>
              )}
            </span>
            <button
              onClick={() => setEditing(true)}
              className={`shrink-0 rounded-full bg-fill px-3 py-1.5 font-medium text-yes ${big ? 'text-[15px]' : 'text-[13px]'}`}
            >
              {choice === 'skip' ? t('haveAView') : t('changeVote')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {showResults ? (
        <div className={big ? 'mt-8' : 'mt-5'}>
          <ResultBar tally={tally} headlineYesShare={topic.headlineYesShare} size={size} />
        </div>
      ) : big ? (
        <p className="mt-3 flex items-center justify-center gap-1.5 text-[13px] text-ink-3 tabular">
          <Lock className="size-3.5" /> {n(tally.yes + tally.no + tally.skip)} {t('votes')} · {t('voteToSee')}
        </p>
      ) : (
        <div className="mt-5">
          <LockedResult />
        </div>
      )}
    </div>
  )
}

function VoteButton({ label, dot, active, big, disabled, onClick }: {
  label: string; dot: string; active: boolean; big: boolean; disabled: boolean; onClick: () => void
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      disabled={disabled}
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center justify-center gap-2 rounded-2xl bg-fill font-semibold transition-colors hover:bg-fill-2 disabled:opacity-60
        ${big ? 'h-16 text-[19px]' : 'h-12 text-[17px]'}
        ${active ? 'ring-2 ring-inset ring-ink/80' : ''}`}
    >
      <span className={`size-3 rounded-full ${dot}`} aria-hidden />
      {label}
    </motion.button>
  )
}
