import { useI18n } from '../lib/i18n'
import { PauseIcon, PlayIcon } from './Icons'

/** Scrub or play through a question's history. The far right is "All time". */
export function Timeline({ dates, index, playing, onChange, onTogglePlay }: {
  dates: string[]
  index: number
  playing: boolean
  onChange: (i: number) => void
  onTogglePlay: () => void
}) {
  const { t, lang } = useI18n()
  const fmt = new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : `${lang}-ES`, { day: 'numeric', month: 'short', year: 'numeric' })
  const last = dates.length - 1
  const atEnd = index >= last
  const p = last > 0 ? (index / last) * 100 : 100

  return (
    <div>
      <div className="flex items-center gap-3">
        <button
          onClick={onTogglePlay}
          aria-label={playing ? t('pause') : t('play')}
          className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-bg transition active:scale-95"
        >
          {playing ? <PauseIcon /> : <PlayIcon className="size-4 translate-x-px" />}
        </button>
        <div className="min-w-0">
          <div className="text-[17px] font-semibold tabular">
            {atEnd && !playing ? t('allTime') : t('asOf', { d: fmt.format(new Date(dates[index])) })}
          </div>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={Math.max(0, last)}
        value={index}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={t('insights')}
        aria-valuetext={atEnd ? t('allTime') : fmt.format(new Date(dates[index]))}
        className="timeline mt-4 w-full"
        style={{ ['--p' as string]: `${p}%` }}
      />
      <div className="mt-1 flex justify-between text-[12px] text-ink-3">
        <span>{t('questionAsked')} · {dates[0] && fmt.format(new Date(dates[0]))}</span>
        <span>{t('today')}</span>
      </div>
    </div>
  )
}
