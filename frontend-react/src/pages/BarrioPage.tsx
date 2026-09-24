import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api'
import type { DistrictResult } from '../api/types'
import { DistrictMap, MapLegend, shareFill, yesShare } from '../components/DistrictMap'
import { MapIcon, Pin } from '../components/Icons'
import { TopBar } from '../components/TopBar'
import { cityName } from '../data/cities'
import { districtForPostcode, districtName } from '../data/districts'
import { useI18n } from '../lib/i18n'
import { useProfile } from '../lib/profile'
import { useTopic } from '../lib/useTopics'
import NotFound from './NotFound'

const pct = (x: number) => Math.round(x * 100)

export default function BarrioPage() {
  const { slug } = useParams()
  const topic = useTopic(slug)
  const { home } = useProfile()
  const { t, l, n } = useI18n()
  const [editing, setEditing] = useState(false)
  const [results, setResults] = useState<DistrictResult[] | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  const needsPostcode = !home || editing

  useEffect(() => {
    if (!topic || needsPostcode) return
    api.getDistrictResults(topic.id).then(setResults)
  }, [topic, needsPostcode])

  useEffect(() => {
    if (home) setSelected((s) => s ?? home.districtId)
  }, [home])

  if (topic === null) return <NotFound />

  const sel = results?.find((r) => r.districtId === selected)
  const sorted = results ? [...results].sort((a, b) => yesShare(b) - yesShare(a)) : []

  return (
    <>
      <TopBar back />
      <main className="mx-auto max-w-xl px-4 pb-16 safe-bottom">
        <section className="pt-7">
          <h1 className="text-[28px] font-bold tracking-[-0.02em]">{t('byBarrio')}</h1>
          {topic && <p className="mt-1 text-[17px] leading-snug text-ink-2">{l(topic.question)}</p>}
        </section>

        <AnimatePresence mode="wait">
          {needsPostcode ? (
            <PostcodeForm key="form" initial={home?.postcode} onDone={() => setEditing(false)} />
          ) : (
            <motion.div key="map" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <p className="mt-2 text-[15px] text-ink-3">{t('byBarrioSub', { c: cityName(topic?.city ?? 'barcelona') })}</p>

              <div className="mt-5 rounded-[22px] bg-card p-4">
                {results ? (
                  <DistrictMap results={results} selected={selected} home={home?.districtId ?? null} onSelect={setSelected} />
                ) : (
                  <div className="aspect-[1000/1147] animate-pulse rounded-xl bg-fill" />
                )}
                <div className="mt-4">
                  <MapLegend />
                </div>
                <p className="mt-2 px-1 text-[12px] text-ink-3">{t('tapDistrict')}</p>
              </div>

              <AnimatePresence mode="wait">
                {sel && (
                  <motion.div
                    key={sel.districtId}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="mt-3 rounded-[22px] bg-card p-5"
                    aria-live="polite"
                  >
                    <div className="flex items-center gap-2 text-[13px] font-medium text-ink-3">
                      <Pin />
                      {sel.districtId === home?.districtId ? t('yourDistrict') : cityName(topic?.city ?? 'barcelona')}
                    </div>
                    <div className="mt-1 text-[20px] font-semibold">{districtName(sel.districtId)}</div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-[34px] font-semibold leading-none tracking-tight tabular">
                        {pct(Math.max(yesShare(sel), 1 - yesShare(sel)))}%
                      </span>
                      <span className="text-[15px] font-medium text-ink-2">{yesShare(sel) >= 0.5 ? t('sayYes') : t('sayNo')}</span>
                    </div>
                    <div className="mt-3 flex h-3 gap-[2px]">
                      <div className="h-full rounded-l-full rounded-r-[4px] bg-yes" style={{ width: `calc(${yesShare(sel) * 100}% - 1px)` }} />
                      <div className="h-full flex-1 rounded-r-full rounded-l-[4px] bg-no" />
                    </div>
                    <div className="mt-2 flex justify-between text-[13px] tabular">
                      <span><b>{t('yes')}</b> <span className="text-ink-2">{pct(yesShare(sel))}% · {n(sel.yes)}</span></span>
                      <span><span className="text-ink-2">{n(sel.no)} · {pct(1 - yesShare(sel))}%</span> <b>{t('no')}</b></span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <h2 className="mt-8 mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-ink-3">{t('allDistricts')}</h2>
              <ul className="divide-y divide-hair overflow-hidden rounded-[18px] bg-card">
                {sorted.map((r) => (
                  <li key={r.districtId}>
                    <button
                      onClick={() => {
                        setSelected(r.districtId)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-fill"
                    >
                      <span className="size-3.5 shrink-0 rounded-[4px]" style={{ background: shareFill(yesShare(r)) }} aria-hidden />
                      <span className="min-w-0 flex-1 truncate text-[15px] font-medium">
                        {districtName(r.districtId)}
                        {r.districtId === home?.districtId && <span className="ml-1.5 rounded-full bg-ink px-1.5 py-px text-[11px] font-semibold text-bg">{t('you')}</span>}
                      </span>
                      <span className="text-[13px] text-ink-3 tabular">{n(r.yes + r.no)}</span>
                      <span className="w-11 text-right text-[15px] font-semibold tabular">{pct(yesShare(r))}%</span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-2 px-1 text-[12px] text-ink-3">% {t('sayYes')} · {t('votes')}</p>

              {home && (
                <button onClick={() => setEditing(true)} className="mt-6 px-1 text-[15px] font-medium text-yes">
                  {t('changePostcode')} ({home.postcode})
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  )
}

function PostcodeForm({ initial, onDone }: { initial?: string; onDone: () => void }) {
  const { t } = useI18n()
  const { setHome } = useProfile()
  const [code, setCode] = useState(initial ?? '')
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)
  const district = districtForPostcode(code)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!district) return setError(true)
    setBusy(true)
    try {
      await setHome({ postcode: code.trim(), districtId: district })
      onDone()
    } finally {
      setBusy(false)
    }
  }

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="mt-6 rounded-[22px] bg-card p-5"
    >
      <div className="grid size-11 place-items-center rounded-[12px] bg-yes text-white"><MapIcon /></div>
      <h2 className="mt-4 text-[20px] font-semibold">{t('postcodeTitle')}</h2>
      <p className="mt-1 text-[15px] leading-relaxed text-ink-2">{t('postcodeBody')}</p>
      <label className="mt-5 block">
        <span className="mb-1.5 block text-[13px] font-medium text-ink-3">{t('postcode')}</span>
        <input
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={5}
          placeholder="08012"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.replace(/\D/g, ''))
            setError(false)
          }}
          aria-invalid={error}
          className="h-14 w-full rounded-2xl bg-fill px-4 text-[20px] font-semibold tracking-[0.15em] tabular outline-none placeholder:font-normal placeholder:tracking-normal placeholder:text-ink-3 focus:ring-2 focus:ring-yes"
        />
      </label>
      <p className="mt-2 min-h-5 text-[14px]" aria-live="polite">
        {error ? (
          <span className="text-no">{t('postcodeInvalid')}</span>
        ) : district ? (
          <span className="flex items-center gap-1 text-ink-2"><Pin /> {districtName(district)}</span>
        ) : null}
      </p>
      <button
        disabled={busy || code.length !== 5}
        className="mt-3 h-14 w-full rounded-2xl bg-ink text-[17px] font-semibold text-bg transition active:scale-[0.98] disabled:opacity-40"
      >
        {t('showMap')}
      </button>
    </motion.form>
  )
}
