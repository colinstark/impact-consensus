import { Link } from 'react-router-dom'
import { Plus } from '../components/Icons'
import { ProposalCard } from '../components/ProposalCard'
import { TopBar } from '../components/TopBar'
import { useCity } from '../lib/city'
import { useI18n } from '../lib/i18n'
import { UPVOTE_THRESHOLD, useProposals } from '../lib/useProposals'

export default function ProposalsPage() {
  const { t } = useI18n()
  const { city } = useCity()
  const { proposals, mine, upvote } = useProposals(city ?? 'barcelona')

  return (
    <>
      <TopBar back />
      <main className="mx-auto max-w-xl px-4 pb-16 safe-bottom">
        <section className="pt-7">
          <h1 className="text-[28px] font-bold tracking-[-0.02em]">{t('proposals')}</h1>
          <p className="mt-1 text-[16px] leading-snug text-ink-2">{t('proposalsSub', { n: UPVOTE_THRESHOLD })}</p>
          <Link
            to="/proposals/new"
            className="mt-5 flex h-12 items-center justify-center gap-2 rounded-2xl bg-ink text-[16px] font-semibold text-bg active:scale-[0.98]"
          >
            <Plus className="size-5" /> {t('propose')}
          </Link>
        </section>
        <div className="mt-6 space-y-3">
          {!proposals && [0, 1].map((i) => <div key={i} className="h-48 animate-pulse rounded-[22px] bg-card" />)}
          {proposals?.map((p) => <ProposalCard key={p.id} proposal={p} myAnswer={mine[p.id]} onUpvote={upvote} />)}
        </div>
      </main>
    </>
  )
}
