import { motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronDown, Pin } from '../components/Icons'
import { CITIES } from '../data/cities'
import { useCity } from '../lib/city'
import { LANGS, langLabels, useI18n } from '../lib/i18n'

export default function CityPicker() {
  const { t, lang, setLang } = useI18n()
  const { city, setCity } = useCity()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const [choice, setChoice] = useState(city ?? 'barcelona')

  return (
    <main className="safe-top mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-8 safe-bottom">
      <div className="flex justify-end pt-4">
        <label className="relative rounded-full bg-fill px-3 py-1 text-[13px] font-medium uppercase text-ink-2">
          {lang}
          <select aria-label="Language" value={lang} onChange={(e) => setLang(e.target.value as typeof lang)} className="absolute inset-0 opacity-0">
            {LANGS.map((l) => <option key={l} value={l}>{langLabels[l]}</option>)}
          </select>
        </label>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', bounce: 0.2 }}
        className="flex flex-1 flex-col justify-center">
        <span className="grid size-16 place-items-center rounded-[18px] bg-ink shadow-lg">
          <span className="flex w-8 gap-[3px]">
            <span className="h-3 flex-[3] rounded-full bg-yes" />
            <span className="h-3 flex-[2] rounded-full bg-no" />
          </span>
        </span>
        <h1 className="mt-8 text-[34px] font-bold leading-[1.1] tracking-[-0.02em]">{t('tagline')}</h1>
        <p className="mt-3 text-[17px] leading-relaxed text-ink-2">{t('cityBody')}</p>

        <label className="mt-10 block">
          <span className="mb-2 block text-[15px] font-semibold">{t('cityTitle')}</span>
          <span className="relative block">
            <Pin className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-3" />
            <select
              aria-label={t('cityLabel')}
              value={choice}
              onChange={(e) => setChoice(e.target.value)}
              className="h-14 w-full appearance-none rounded-2xl bg-card pl-12 pr-10 text-[17px] font-medium outline-none ring-1 ring-hair focus:ring-2 focus:ring-yes"
            >
              {CITIES.map((c) => (
                <option key={c.id} value={c.id} disabled={!c.available}>
                  {c.name}{c.available ? '' : ` — ${t('comingSoon')}`}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
          </span>
        </label>
      </motion.div>

      <button
        onClick={() => {
          setCity(choice)
          nav(params.get('next') || '/', { replace: true })
        }}
        className="h-14 w-full rounded-2xl bg-ink text-[17px] font-semibold text-bg transition active:scale-[0.98]"
      >
        {t('continue')}
      </button>
    </main>
  )
}
