import type { Topic } from '../api/types'
import { useI18n } from '../lib/i18n'
import { External } from './Icons'
import { Sheet } from './Sheet'

export function SourcesSheet({ topic, open, onClose }: { topic: Topic; open: boolean; onClose: () => void }) {
  const { t, l, lang } = useI18n()
  const fmt = new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : `${lang}-ES`, { day: 'numeric', month: 'short' })

  return (
    <Sheet open={open} onClose={onClose} label={t('readUpTitle')}>
      <h2 className="text-[22px] font-bold tracking-tight">{t('readUpTitle')}</h2>
      <p className="mt-1 text-[15px] leading-snug text-ink-2">{l(topic.question)}</p>
      <p className="mt-3 text-[13px] leading-snug text-ink-3">{t('readUpBody')}</p>

      {topic.sources.length ? (
        <ul className="mt-4 divide-y divide-hair overflow-hidden rounded-[18px] bg-fill/60">
          {topic.sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3.5 active:bg-fill">
                <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-ink text-[15px] font-bold text-bg" aria-hidden>
                  {s.outlet.replace(/^(El|La|The)\s+/i, '')[0].toUpperCase()}
                </span>
                {s.kind === 'search' ? (
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] font-medium">{t('coverageIn', { o: s.outlet })}</span>
                    <span className="block truncate text-[13px] text-ink-3">“{s.title}”</span>
                  </span>
                ) : (
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold text-ink-2">
                      {s.outlet}
                      {s.publishedAt && <span className="font-normal text-ink-3"> · {fmt.format(new Date(s.publishedAt))}</span>}
                    </span>
                    <span className="line-clamp-2 block text-[16px] font-medium leading-snug">{s.title}</span>
                  </span>
                )}
                <External className="size-4 shrink-0 text-ink-3" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-2xl bg-fill px-4 py-3 text-[15px] text-ink-2">{t('noSources')}</p>
      )}

      <button
        onClick={onClose}
        className="mt-5 mb-2 h-13 w-full rounded-2xl bg-ink py-3.5 text-[17px] font-semibold text-bg active:scale-[0.98]"
      >
        {t('backToVote')}
      </button>
    </Sheet>
  )
}
