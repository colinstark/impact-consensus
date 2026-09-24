import type { ReactNode } from 'react'
import type { Tally } from '../api/types'
import { MIN_GROUP } from '../data/demographics'
import { useI18n } from '../lib/i18n'

export interface Group {
  key: string
  label: ReactNode
  tally: Tally
  /** Optional swatch, e.g. the district's map colour. */
  swatch?: string
}

/** One 100% yes|no bar per group. Small groups are hidden to protect privacy. */
export function GroupBars({ groups }: { groups: Group[] }) {
  const { t, n } = useI18n()
  return (
    <ul className="space-y-3.5">
      {groups.map((g) => {
        const total = g.tally.yes + g.tally.no
        const hidden = total < MIN_GROUP
        const yes = total ? g.tally.yes / total : 0
        return (
          <li key={g.key}>
            <div className="mb-1.5 flex items-baseline gap-2 text-[14px]">
              {g.swatch && <span className="size-3 shrink-0 self-center rounded-[3px]" style={{ background: g.swatch }} aria-hidden />}
              <span className="min-w-0 flex-1 truncate font-medium">{g.label}</span>
              {!hidden && (
                <>
                  <span className="text-[12px] text-ink-3 tabular">{n(total)}</span>
                  <span className="w-10 text-right font-semibold tabular">{Math.round(yes * 100)}%</span>
                </>
              )}
            </div>
            {hidden ? (
              <div className="rounded-full bg-fill px-2.5 py-0.5 text-[11px] text-ink-3">{t('hiddenSmall')}</div>
            ) : (
              <div className="flex h-2.5 gap-[2px]" role="img" aria-label={`${t('yes')} ${Math.round(yes * 100)}%`}>
                {yes > 0 && (
                  <div className="h-full rounded-l-full rounded-r-[3px] bg-yes transition-[width] duration-150"
                    style={{ width: `calc(${yes * 100}% - 1px)` }} />
                )}
                {yes < 1 && <div className="h-full flex-1 rounded-r-full rounded-l-[3px] bg-no" />}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
