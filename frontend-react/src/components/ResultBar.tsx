import { motion } from 'framer-motion'
import type { Tally } from '../api/types'
import { useI18n } from '../lib/i18n'
import { Lock } from './Icons'

const pct = (x: number) => Math.round(x * 100)

export function shares(t: Tally) {
  const decided = t.yes + t.no
  const yes = decided ? t.yes / decided : 0.5
  return { yes, no: 1 - yes, decided, total: decided + t.skip }
}

/** Yes vs No split. Yes/No are two identities of one question; "don't mind" is reported, not plotted. */
export function ResultBar({
  tally,
  headlineYesShare,
  size = 'card',
}: {
  tally: Tally
  headlineYesShare?: number
  size?: 'card' | 'page'
}) {
  const { t, n } = useI18n()
  const s = shares(tally)
  const lead = s.yes >= s.no ? 'yes' : 'no'
  const leadShare = lead === 'yes' ? s.yes : s.no
  const big = size === 'page'
  const spring = { type: 'spring' as const, bounce: 0.15, duration: 0.9 }

  return (
    <div>
      <div className="flex items-baseline gap-2">
        <motion.span
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`tabular font-semibold tracking-tight ${big ? 'text-[56px] leading-none' : 'text-[34px] leading-none'}`}
        >
          {pct(leadShare)}%
        </motion.span>
        <span className={`font-medium text-ink-2 ${big ? 'text-[20px]' : 'text-[15px]'}`}>
          {lead === 'yes' ? t('sayYes') : t('sayNo')}
        </span>
      </div>

      <div className={`relative ${big ? 'mt-5' : 'mt-3'} ${headlineYesShare != null ? 'pt-7' : ''}`}>
        {headlineYesShare != null && (
          <motion.div
            className="absolute top-0 h-7 w-0"
            initial={{ left: '50%', opacity: 0 }}
            animate={{ left: `${headlineYesShare * 100}%`, opacity: 1 }}
            transition={{ ...spring, delay: 0.3 }}
          >
            {/* Keep the label inside the card near either edge; the tick marks the exact spot. */}
            <span
              className={`absolute top-0 whitespace-nowrap rounded-full bg-fill px-2 py-0.5 text-[11px] font-medium text-ink-2 ${
                headlineYesShare > 0.7 ? 'right-0 -mr-2' : headlineYesShare < 0.3 ? 'left-0 -ml-2' : 'left-0 -translate-x-1/2'
              }`}
            >
              {t('headlines')} {pct(headlineYesShare)}% {t('yes').toLowerCase()}
            </span>
            <span className="absolute bottom-0 left-0 h-2.5 w-px -translate-x-1/2 bg-ink-2" />
          </motion.div>
        )}
        <div className={`flex w-full gap-[2px] ${big ? 'h-4' : 'h-3'}`} role="img"
          aria-label={`${t('yes')} ${pct(s.yes)}%, ${t('no')} ${pct(s.no)}%`}>
          <motion.div
            title={`${t('yes')} · ${pct(s.yes)}% · ${n(tally.yes)} ${t('votes')}`}
            className="h-full rounded-l-full rounded-r-[4px] bg-yes"
            initial={{ width: '50%' }}
            animate={{ width: `calc(${s.yes * 100}% - 1px)` }}
            transition={spring}
          />
          <motion.div
            title={`${t('no')} · ${pct(s.no)}% · ${n(tally.no)} ${t('votes')}`}
            className="h-full rounded-r-full rounded-l-[4px] bg-no"
            initial={{ width: '50%' }}
            animate={{ width: `calc(${s.no * 100}% - 1px)` }}
            transition={spring}
          />
        </div>
      </div>

      <div className={`mt-3 flex justify-between ${big ? 'text-[15px]' : 'text-[13px]'}`}>
        <Legend color="bg-yes" label={t('yes')} share={s.yes} count={n(tally.yes)} />
        <Legend color="bg-no" label={t('no')} share={s.no} count={n(tally.no)} align="right" />
      </div>
      <p className={`mt-2 text-ink-3 tabular ${big ? 'text-[13px]' : 'text-[12px]'}`}>
        {n(s.total)} {t('votes')} · {n(tally.skip)} {t('dontMind')}
      </p>
      {big && headlineYesShare != null && (
        <p className="mt-4 rounded-2xl bg-fill px-4 py-3 text-[15px] leading-snug text-ink-2">
          {t('gapNote', { h: pct(headlineYesShare), n: pct(s.yes) })}
        </p>
      )}
    </div>
  )
}

function Legend({ color, label, share, count, align }: {
  color: string; label: string; share: number; count: string; align?: 'right'
}) {
  return (
    <div className={`flex items-center gap-1.5 ${align === 'right' ? 'flex-row-reverse text-right' : ''}`}>
      <span className={`size-2.5 rounded-full ${color}`} aria-hidden />
      <span className="font-semibold text-ink">{label}</span>
      <span className="tabular text-ink-2">{pct(share)}%</span>
      <span className="tabular text-ink-3">{align === 'right' ? `${count} ·` : `· ${count}`}</span>
    </div>
  )
}

export function LockedResult() {
  const { t } = useI18n()
  return (
    <div aria-label={t('voteToSee')}>
      <div className="flex items-center gap-2">
        <div className="h-[34px] w-20 rounded-lg bg-fill" />
        <div className="h-4 w-14 rounded bg-fill" />
      </div>
      <div className="relative mt-3">
        <div className="flex h-3 gap-[2px]">
          <div className="h-full w-[55%] rounded-l-full rounded-r-[4px] bg-fill-2" />
          <div className="h-full flex-1 rounded-r-full rounded-l-[4px] bg-fill-2" />
        </div>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-[13px] font-medium text-ink-3">
        <Lock className="size-3.5" /> {t('voteToSee')}
      </p>
    </div>
  )
}
