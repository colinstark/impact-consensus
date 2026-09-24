import { useState } from 'react'
import type { Sponsor } from '../api/types'
import { useI18n } from '../lib/i18n'
import { External, Info } from './Icons'
import { Sheet } from './Sheet'

/** "Sponsored by X" label with a tap-through explaining the rules. */
export function SponsorLabel({ sponsor }: { sponsor: Sponsor }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen(true)
        }}
        className="flex items-center gap-1.5 text-[12px] font-medium text-ink-3"
        aria-label={`${t('sponsoredBy', { s: sponsor.name })}. ${t('whySponsored')}`}
      >
        <span className="rounded-[5px] bg-fill px-1.5 py-px font-semibold uppercase tracking-wide text-ink-2">{t('sponsored')}</span>
        <span>{sponsor.name}</span>
        <Info className="size-3.5" />
      </button>
      <SponsorSheet sponsor={sponsor} open={open} onClose={() => setOpen(false)} />
    </>
  )
}

function SponsorSheet({ sponsor, open, onClose }: { sponsor: Sponsor; open: boolean; onClose: () => void }) {
  const { t, l } = useI18n()
  const rules = [t('sponsorRule1'), t('sponsorRule2'), t('sponsorRule3'), t('sponsorRule4')]
  return (
    <Sheet open={open} onClose={onClose} label={t('sponsorTitle')}>
      <h2 className="text-[22px] font-bold tracking-tight">{t('sponsorTitle')}</h2>
      <div className="mt-4 rounded-[18px] bg-fill/60 px-4 py-3.5">
        <div className="text-[13px] font-medium text-ink-3">{t('sponsoredBy', { s: '' }).trim()}</div>
        <div className="text-[17px] font-semibold">{sponsor.name}</div>
        {sponsor.about && <p className="mt-0.5 text-[14px] text-ink-2">{l(sponsor.about)}</p>}
        {sponsor.url && (
          <a href={sponsor.url} target="_blank" rel="noopener noreferrer sponsored"
            className="mt-2 inline-flex items-center gap-1 text-[15px] font-medium text-yes">
            {t('visitSponsor', { s: sponsor.name })} <External className="size-3.5" />
          </a>
        )}
      </div>
      <ul className="mt-4 space-y-3">
        {rules.map((r) => (
          <li key={r} className="flex gap-3 text-[15px] leading-snug text-ink-2">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-ink-3" aria-hidden />
            {r}
          </li>
        ))}
      </ul>
      <button onClick={onClose} className="mt-6 mb-2 w-full rounded-2xl bg-ink py-3.5 text-[17px] font-semibold text-bg active:scale-[0.98]">
        {t('gotIt')}
      </button>
    </Sheet>
  )
}
