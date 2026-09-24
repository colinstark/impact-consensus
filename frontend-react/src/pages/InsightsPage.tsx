import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api'
import type { DistrictResult, Insights, Tally, TrendPoint, TrendRange } from '../api/types'
import { AccountForm } from '../components/AccountForm'
import { Donut } from '../components/Donut'
import { DistrictMap, MapLegend, shareFill, yesShare } from '../components/DistrictMap'
import { GroupBars, type Group } from '../components/GroupBars'
import { ChevronDown, Lock } from '../components/Icons'
import { Segmented } from '../components/Segmented'
import { Timeline } from '../components/Timeline'
import { TopBar } from '../components/TopBar'
import { TrendChart } from '../components/TrendChart'
import { AGE_BRACKETS, ageLabel, GENDERS, genderLabel, MIN_GROUP } from '../data/demographics'
import { DISTRICTS } from '../data/districts'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { useProfile } from '../lib/profile'
import { useTopic } from '../lib/useTopics'
import NotFound from './NotFound'

type Tab = 'district' | 'age' | 'gender'
const PLAY_MS = 6000

export default function InsightsPage() {
  const { slug } = useParams()
  const topic = useTopic(slug)
  const { user, complete } = useAuth()
  const { t, l } = useI18n()

  if (topic === null) return <NotFound />

  return (
    <>
      <TopBar back />
      <main className="mx-auto max-w-xl px-4 pb-16 safe-bottom">
        <section className="pt-7">
          <h1 className="text-[28px] font-bold tracking-[-0.02em]">{t('insights')}</h1>
          {topic && <p className="mt-1 text-[17px] leading-snug text-ink-2">{l(topic.question)}</p>}
        </section>
        {user && complete ? (
          topic && <InsightsView topicId={topic.id} />
        ) : (
          <SignUpWall />
        )}
      </main>
    </>
  )
}

function SignUpWall() {
  const { t } = useI18n()
  return (
    <>
      {/* Blurred preview so people can see what they're signing up for. */}
      <div className="relative mt-6 overflow-hidden rounded-[22px] bg-card p-5" aria-hidden>
        <div className="flex items-center gap-5 opacity-50 blur-[3px]">
          <svg viewBox="0 0 100 100" className="size-24 -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--yes)" strokeWidth="14" strokeDasharray="140 252" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--no)" strokeWidth="14" strokeDasharray="108 252" strokeDashoffset="-142" />
          </svg>
          <div className="flex-1 space-y-2.5">
            {[70, 45, 60, 35].map((w, i) => (
              <div key={i} className="flex h-2.5 gap-[2px]">
                <div className="rounded-l-full bg-yes" style={{ width: `${w}%` }} />
                <div className="flex-1 rounded-r-full bg-no" />
              </div>
            ))}
          </div>
        </div>
        <div className="absolute inset-0 grid place-items-center">
          <span className="flex items-center gap-1.5 rounded-full bg-elevated px-3 py-1.5 text-[13px] font-semibold shadow-sm">
            <Lock className="size-3.5" /> {t('signUpTitle')}
          </span>
        </div>
      </div>
      <div className="mt-4 rounded-[22px] bg-card p-5">
        <AccountForm />
      </div>
    </>
  )
}

function InsightsView({ topicId }: { topicId: string }) {
  const { t, n } = useI18n()
  const { home } = useProfile()
  const [data, setData] = useState<Insights | null>(null)
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [tab, setTab] = useState<Tab>('district')
  const [selected, setSelected] = useState<string | null>(null)
  const [showTrend, setShowTrend] = useState(false)
  const [range, setRange] = useState<TrendRange>('all')

  useEffect(() => {
    api.getInsights(topicId).then((d) => {
      setData(d)
      setIndex(Math.max(0, d.dates.length - 1)) // start on "All time"
    })
  }, [topicId])

  const last = data ? data.dates.length - 1 : 0

  // Play from the day the question went up to today in about six seconds.
  useEffect(() => {
    if (!playing || !data) return
    const step = Math.max(1, Math.ceil(data.dates.length / 120))
    const id = setInterval(() => {
      setIndex((i) => {
        const next = Math.min(last, i + step)
        if (next >= last) setPlaying(false)
        return next
      })
    }, PLAY_MS / Math.min(120, Math.max(1, data.dates.length)))
    return () => clearInterval(id)
  }, [playing, data, last])

  const togglePlay = () => {
    if (playing) return setPlaying(false)
    if (index >= last) setIndex(0)
    setPlaying(true)
  }

  const at = (series?: Tally[]): Tally => series?.[Math.min(index, series.length - 1)] ?? { yes: 0, no: 0 }

  const trend = useMemo<TrendPoint[]>(() => {
    if (!data) return []
    const pts = data.dates.map((date, i) => {
      const o = data.overall[i]
      return { date, yesShare: o.yes / Math.max(1, o.yes + o.no), votes: o.yes + o.no }
    })
    const keep = range === '1m' ? 31 : range === '3m' ? 92 : pts.length
    return pts.filter((p) => p.votes > 0).slice(-keep)
  }, [data, range])

  if (!data) {
    return (
      <div className="mt-6 space-y-4">
        <div className="h-24 animate-pulse rounded-[22px] bg-card" />
        <div className="h-64 animate-pulse rounded-[22px] bg-card" />
      </div>
    )
  }
  if (!data.dates.length) return <p className="mt-8 rounded-[22px] bg-card p-5 text-[15px] text-ink-2">{t('noVotesYet')}</p>

  const districtResults: DistrictResult[] = DISTRICTS.map(({ id }) => ({ districtId: id, ...at(data.byDistrict[id]) }))
  // Small districts are left uncoloured on the map, like the hidden rows below.
  const mappable = districtResults.filter((r) => r.yes + r.no >= MIN_GROUP)
  const districtGroups: Group[] = [...districtResults]
    .sort((a, b) => yesShare(b) - yesShare(a))
    .map((r) => ({
      key: r.districtId,
      swatch: r.yes + r.no >= MIN_GROUP ? shareFill(yesShare(r)) : 'var(--fill-2)',
      tally: r,
      label: (
        <>
          {DISTRICTS.find((d) => d.id === r.districtId)?.name}
          {r.districtId === home?.districtId && (
            <span className="ml-1.5 rounded-full bg-ink px-1.5 py-px text-[11px] font-semibold text-bg">{t('you')}</span>
          )}
        </>
      ),
    }))
  const ageGroups: Group[] = AGE_BRACKETS.filter((a) => data.byAge[a]).map((a) => ({ key: a, label: ageLabel(a, t), tally: at(data.byAge[a]) }))
  const genderGroups: Group[] = GENDERS.filter((g) => data.byGender[g]).map((g) => ({ key: g, label: genderLabel(g, t), tally: at(data.byGender[g]) }))
  const overall = at(data.overall)

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-[22px] bg-card p-5">
        <Timeline dates={data.dates} index={index} playing={playing} onChange={(i) => { setPlaying(false); setIndex(i) }} onTogglePlay={togglePlay} />
      </div>

      <div className="rounded-[22px] bg-card p-5">
        <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-wide text-ink-3">{t('overall')}</h2>
        <Donut tally={overall} />
        <div className="mt-5 flex justify-center gap-6 text-[14px] tabular">
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-yes" /> <b>{t('yes')}</b> <span className="text-ink-2">{n(overall.yes)}</span></span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-no" /> <b>{t('no')}</b> <span className="text-ink-2">{n(overall.no)}</span></span>
        </div>
      </div>

      <div>
        <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-ink-3">{t('viewBy')}</h2>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'district', label: t('tabDistrict') },
            { value: 'age', label: t('tabAge') },
            { value: 'gender', label: t('tabGender') },
          ]}
        />
      </div>

      <div className="rounded-[22px] bg-card p-5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {tab === 'district' && (
              <>
                <DistrictMap results={mappable} selected={selected} home={home?.districtId ?? null} onSelect={setSelected} />
                <div className="mt-4"><MapLegend /></div>
                <div className="mt-6"><GroupBars groups={districtGroups} /></div>
              </>
            )}
            {tab === 'age' && (ageGroups.length ? <GroupBars groups={ageGroups} /> : <Empty />)}
            {tab === 'gender' && (genderGroups.length ? <GroupBars groups={genderGroups} /> : <Empty />)}
          </motion.div>
        </AnimatePresence>
        <p className="mt-5 text-[12px] leading-snug text-ink-3">% {t('sayYes')} · {t('aggregateNote')}</p>
      </div>

      <button
        onClick={() => setShowTrend((x) => !x)}
        aria-expanded={showTrend}
        className="flex w-full items-center justify-between rounded-[18px] bg-card px-5 py-4 text-[16px] font-medium"
      >
        {showTrend ? t('hideTrend') : t('showTrend')}
        <ChevronDown className={`size-4 text-ink-3 transition-transform ${showTrend ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {showTrend && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="rounded-[22px] bg-card p-4 pt-5">
              <div className="mb-4">
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
              <p className="mb-3 px-1 text-[13px] text-ink-3">{t('trendSub')}</p>
              <TrendChart points={trend} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Empty() {
  const { t } = useI18n()
  return <p className="py-6 text-center text-[15px] text-ink-3">{t('noDemographics')}</p>
}
