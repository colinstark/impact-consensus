import type { Tally } from '../api/types'
import { useI18n } from '../lib/i18n'

const SIZE = 184
const STROKE = 22
const R = (SIZE - STROKE) / 2
const C = 2 * Math.PI * R
const GAP = 3 // surface gap between the two arcs, in px along the ring

/** Overall yes vs no. The lead share sits in the middle. */
export function Donut({ tally }: { tally: Tally }) {
  const { t, n } = useI18n()
  const total = tally.yes + tally.no
  const yes = total ? tally.yes / total : 0
  const lead = yes >= 0.5 ? 'yes' : 'no'
  const yesLen = Math.max(0, C * yes - GAP)
  const noLen = Math.max(0, C * (1 - yes) - GAP)
  const arc = { fill: 'none', strokeWidth: STROKE, style: { transition: 'stroke-dasharray 180ms linear, stroke-dashoffset 180ms linear' } }

  return (
    <div className="relative mx-auto" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} className="-rotate-90" role="img"
        aria-label={total ? `${t('yes')} ${Math.round(yes * 100)}%, ${t('no')} ${Math.round((1 - yes) * 100)}%` : t('noVotesYet')}>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke="var(--fill)" {...arc} />
        {total > 0 && (
          <>
            {yes > 0 && (
              <circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke="var(--yes)" {...arc}
                strokeDasharray={`${yesLen} ${C}`} strokeDashoffset={-GAP / 2} />
            )}
            {yes < 1 && (
              <circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke="var(--no)" {...arc}
                strokeDasharray={`${noLen} ${C}`} strokeDashoffset={-(C * yes + GAP / 2)} />
            )}
          </>
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {total ? (
          <>
            <span className="text-[40px] font-semibold leading-none tracking-tight tabular">
              {Math.round((lead === 'yes' ? yes : 1 - yes) * 100)}%
            </span>
            <span className="mt-1 text-[14px] font-medium text-ink-2">{lead === 'yes' ? t('sayYes') : t('sayNo')}</span>
            <span className="mt-1 text-[12px] text-ink-3 tabular">{n(total)} {t('votes')}</span>
          </>
        ) : (
          <span className="px-8 text-[13px] text-ink-3">{t('noVotesYet')}</span>
        )}
      </div>
    </div>
  )
}
