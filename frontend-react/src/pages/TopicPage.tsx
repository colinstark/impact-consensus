import { motion } from 'framer-motion'
import { Link, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { Chart, ChevronRight, Lock, MapIcon, Share } from '../components/Icons'
import { useToast } from '../components/Toast'
import { TopBar } from '../components/TopBar'
import { Eyebrow, TopicRow } from '../components/TopicCard'
import { VotePanel } from '../components/VotePanel'
import { useAuth } from '../lib/auth'
import { useCity } from '../lib/city'
import { useI18n } from '../lib/i18n'
import { shareTopic } from '../lib/share'
import { useTopic, useTopics } from '../lib/useTopics'
import { useVotes } from '../lib/votes'
import NotFound from './NotFound'

export default function TopicPage() {
  const { slug } = useParams()
  const topic = useTopic(slug)
  const { city, setCity } = useCity()
  const { topics } = useTopics(topic?.city ?? null)
  const { mine } = useVotes()
  const { user } = useAuth()
  const { t, l } = useI18n()
  const toast = useToast()

  // Arriving from a QR code counts as choosing the topic's city.
  useEffect(() => {
    if (topic && !city) setCity(topic.city)
  }, [topic, city, setCity])

  if (topic === null) return <NotFound />

  const voted = topic ? !!mine[topic.id] : false
  const next = (topics ?? []).filter((x) => x.id !== topic?.id && !mine[x.id]).slice(0, 3)

  return (
    <>
      <TopBar back />
      <main className="mx-auto max-w-xl px-4 pb-16 safe-bottom">
        {!topic ? (
          <div className="mt-8 space-y-4">
            <div className="h-4 w-32 animate-pulse rounded bg-fill" />
            <div className="h-20 animate-pulse rounded-xl bg-fill" />
            <div className="h-48 animate-pulse rounded-[22px] bg-card" />
          </div>
        ) : (
          <>
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-7">
              <Eyebrow topic={topic} />
              <h1 className="mt-3 text-[30px] font-bold leading-[1.12] tracking-[-0.02em]">{l(topic.question)}</h1>
              <p className="mt-3 text-[17px] leading-relaxed text-ink-2">{l(topic.context)}</p>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="mt-6 rounded-[26px] bg-card p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_rgb(0_0_0/0.05)]"
            >
              <VotePanel topic={topic} size="page" />
            </motion.section>

            {voted && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-4 divide-y divide-hair overflow-hidden rounded-[18px] bg-card"
              >
                <Link to={`/t/${topic.slug}/barrios`} className="flex items-center gap-3 px-4 py-3.5 active:bg-fill">
                  <span className="grid size-8 place-items-center rounded-[9px] bg-no text-white"><MapIcon className="size-[18px]" /></span>
                  <span className="flex-1 text-[16px] font-medium">{t('byBarrio')}</span>
                  <ChevronRight className="size-4 text-ink-3" />
                </Link>
                <Link to={`/t/${topic.slug}/trend`} className="flex items-center gap-3 px-4 py-3.5 active:bg-fill">
                  <span className="grid size-8 place-items-center rounded-[9px] bg-yes text-white"><Chart className="size-[18px]" /></span>
                  <span className="flex-1 text-[16px] font-medium">{t('seeTrend')}</span>
                  {!user && <Lock className="size-4 text-ink-3" />}
                  <ChevronRight className="size-4 text-ink-3" />
                </Link>
                <button
                  onClick={async () => {
                    if ((await shareTopic(l(topic.question), topic.slug)) === 'copied') toast(t('copied'))
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-fill"
                >
                  <span className="grid size-8 place-items-center rounded-[9px] bg-ink text-bg"><Share className="size-[18px]" /></span>
                  <span className="flex-1 text-[16px] font-medium">{t('share')}</span>
                  <ChevronRight className="size-4 text-ink-3" />
                </button>
              </motion.div>
            )}

            {voted && (
              <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-10">
                <h2 className="mb-2 px-1 text-[22px] font-bold tracking-tight">{t('keepGoing')}</h2>
                {next.length ? (
                  <div className="divide-y divide-hair overflow-hidden rounded-[18px] bg-card">
                    {next.map((x) => <TopicRow key={x.id} topic={x} />)}
                  </div>
                ) : (
                  <p className="px-1 text-[15px] text-ink-2">{t('allDone')}</p>
                )}
                <Link to="/" className="mt-4 block px-1 text-[16px] font-medium text-yes">{t('backHome')}</Link>
              </motion.section>
            )}
          </>
        )}
      </main>
    </>
  )
}
