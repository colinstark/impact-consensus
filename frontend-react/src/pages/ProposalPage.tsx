import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { api } from '../api'
import type { Choice, Proposal } from '../api/types'
import { ChevronRight, Share } from '../components/Icons'
import { ProposalCard } from '../components/ProposalCard'
import { QrFloat } from '../components/QrFloat'
import { useToast } from '../components/Toast'
import { TopBar } from '../components/TopBar'
import { useCity } from '../lib/city'
import { deviceId } from '../lib/device'
import { useI18n } from '../lib/i18n'
import { shareLink } from '../lib/share'
import NotFound from './NotFound'

export default function ProposalPage() {
  const { id = '' } = useParams()
  const { city, setCity } = useCity()
  const { t } = useI18n()
  const toast = useToast()
  const [proposal, setProposal] = useState<Proposal | null>()
  const [mine, setMine] = useState<Choice>()

  useEffect(() => {
    api.getProposal(id).then(setProposal)
    api.getMyUpvotes(deviceId()).then((m) => setMine(m[id]))
  }, [id])

  // Arriving from a QR code counts as choosing the proposal's city.
  useEffect(() => {
    if (proposal && !city) setCity(proposal.city)
  }, [proposal, city, setCity])

  if (proposal === null) return <NotFound />
  // Once accepted, the question lives on as a topic; old QR codes follow it there.
  if (proposal?.status === 'accepted' && proposal.topicSlug) return <Navigate to={`/t/${proposal.topicSlug}`} replace />

  async function upvote(pid: string, answer: Choice) {
    setMine(answer)
    try {
      const updated = await api.upvoteProposal(pid, answer, deviceId())
      setProposal(updated)
      return updated
    } catch (e) {
      setMine(undefined)
      throw e
    }
  }

  return (
    <>
      <TopBar back />
      <main className="mx-auto max-w-xl px-4 pb-16 safe-bottom">
        {!proposal ? (
          <div className="mt-7 h-48 animate-pulse rounded-[22px] bg-card" />
        ) : (
          <>
            <div className="pt-7">
              <ProposalCard proposal={proposal} myAnswer={mine} onUpvote={upvote} linked={false} />
            </div>
            <div className="mt-4 overflow-hidden rounded-[18px] bg-card">
              <button
                onClick={async () => {
                  if ((await shareLink(proposal.question, `/p/${proposal.id}`)) === 'copied') toast(t('copied'))
                }}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-fill"
              >
                <span className="grid size-8 place-items-center rounded-[9px] bg-ink text-bg"><Share className="size-[18px]" /></span>
                <span className="flex-1 text-[16px] font-medium">{t('share')}</span>
                <ChevronRight className="size-4 text-ink-3" />
              </button>
            </div>
            <Link to="/proposals" className="mt-6 block px-1 text-[16px] font-medium text-yes">{t('proposals')}</Link>
            {proposal.status === 'open' && <QrFloat path={`/p/${proposal.id}`} title={proposal.question} />}
          </>
        )}
      </main>
    </>
  )
}
