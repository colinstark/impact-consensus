import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import type { TrendPoint, TrendRange } from '../api/types'
import { Lock } from '../components/Icons'
import { Segmented } from '../components/Segmented'
import { TopBar } from '../components/TopBar'
import { TrendChart } from '../components/TrendChart'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { useTopic } from '../lib/useTopics'
import NotFound from './NotFound'

export default function TrendPage() {
  const { slug } = useParams()
  const topic = useTopic(slug)
  const { user } = useAuth()
  const { t, l, lang } = useI18n()
  const [range, setRange] = useState<TrendRange>('3m')
  const [points, setPoints] = useState<TrendPoint[] | null>(null)
  const [table, setTable] = useState(false)

  useEffect(() => {
    if (!topic || !user) return
    setPoints(null)
    api.getTrend(topic.id, range).then(setPoints)
  }, [topic, user, range])

  if (topic === null) return <NotFound />

  const fmt = new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : `${lang}-ES`, { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <>
      <TopBar back />
      <main className="mx-auto max-w-xl px-4 pb-16 safe-bottom">
        <section className="pt-7">
          <h1 className="text-[28px] font-bold tracking-[-0.02em]">{t('trendTitle')}</h1>
          {topic && <p className="mt-1 text-[17px] leading-snug text-ink-2">{l(topic.question)}</p>}
        </section>

        {!user ? (
          <div className="relative mt-6 overflow-hidden rounded-[22px] bg-card p-5">
            <svg viewBox="0 0 300 140" className="w-full opacity-40 blur-[3px]" aria-hidden>
              <path d="M0,90 C40,70 60,100 100,80 S160,40 200,60 S260,50 300,45" fill="none" stroke="var(--yes)" strokeWidth="3" />
            </svg>
            <div className="absolute inset-0 grid place-items-center bg-card/40 p-6 text-center backdrop-blur-[1px]">
              <div>
                <div className="mx-auto mb-3 grid size-11 place-items-center rounded-full bg-fill"><Lock className="size-5" /></div>
                <p className="text-[16px] leading-snug text-ink-2">{t('signInToSee')}</p>
                <Link
                  to={`/signin?next=${encodeURIComponent(location.pathname)}`}
                  className="mt-4 inline-block rounded-full bg-ink px-6 py-3 text-[16px] font-semibold text-bg active:scale-95"
                >
                  {t('signIn')}
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-6">
              <Segmented
                value={range}
                onChange={setRange}
                options={[
                  { value: '1m', label: t('range1m') },
                  { value: '3m', label: t('range3m') },
                  { value: 'all', label: t('rangeAll') },
                ]}
              />
            </div>
            <motion.div layout className="mt-4 rounded-[22px] bg-card p-4 pt-5">
              <p className="mb-3 px-1 text-[13px] text-ink-3">{t('trendSub')}</p>
              {points ? <TrendChart points={points} /> : <div className="h-[220px] animate-pulse rounded-xl bg-fill" />}
            </motion.div>
            <button onClick={() => setTable((x) => !x)} className="mt-3 px-1 text-[15px] font-medium text-yes">
              {table ? t('hideTable') : t('showTable')}
            </button>
            {table && points && (
              <div className="mt-2 max-h-80 overflow-auto rounded-[18px] bg-card">
                <table className="w-full text-[14px] tabular">
                  <thead className="sticky top-0 bg-card text-left text-ink-3">
                    <tr><th className="px-4 py-2 font-medium">{t('date')}</th><th className="px-4 py-2 text-right font-medium">{t('yes')}</th><th className="px-4 py-2 text-right font-medium">{t('votes')}</th></tr>
                  </thead>
                  <tbody className="divide-y divide-hair">
                    {[...points].reverse().filter((_, i) => i % 7 === 0).map((p) => (
                      <tr key={p.date}>
                        <td className="px-4 py-2">{fmt.format(new Date(p.date))}</td>
                        <td className="px-4 py-2 text-right">{Math.round(p.yesShare * 100)}%</td>
                        <td className="px-4 py-2 text-right text-ink-2">{p.votes.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </>
  )
}
