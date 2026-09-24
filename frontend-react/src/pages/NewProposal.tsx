import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import type { Choice } from '../api/types'
import { ChevronDown } from '../components/Icons'
import { useToast } from '../components/Toast'
import { TopBar } from '../components/TopBar'
import { cityName } from '../data/cities'
import { DISTRICTS } from '../data/districts'
import { useCity } from '../lib/city'
import { deviceId } from '../lib/device'
import { useI18n } from '../lib/i18n'
import { UPVOTE_THRESHOLD } from '../lib/useProposals'

const field = 'w-full rounded-2xl bg-card px-4 text-[17px] outline-none ring-1 ring-hair placeholder:text-ink-3 focus:ring-2 focus:ring-yes'

export default function NewProposal() {
  const { t } = useI18n()
  const { city: cityId } = useCity()
  const city = cityId ?? 'barcelona'
  const nav = useNavigate()
  const toast = useToast()
  const [question, setQuestion] = useState('')
  const [area, setArea] = useState(cityName(city))
  const [context, setContext] = useState('')
  const [answer, setAnswer] = useState<Choice | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    let q = question.trim().replace(/\s+/g, ' ')
    if (q.length < 15) return setError(t('tooShort'))
    if (!answer) return
    if (!/[?？]$/.test(q)) q += '?'
    setBusy(true)
    try {
      await api.createProposal({ city, question: q, context: context.trim() || undefined, area, answer }, deviceId())
      toast(t('proposalLive'))
      nav('/proposals', { replace: true })
    } catch {
      setError(t('error'))
      setBusy(false)
    }
  }

  return (
    <>
      <TopBar back />
      <main className="mx-auto max-w-xl px-4 pb-16 safe-bottom">
        <form onSubmit={submit} className="pt-7">
          <h1 className="text-[28px] font-bold tracking-[-0.02em]">{t('propose')}</h1>
          <p className="mt-1 text-[16px] leading-snug text-ink-2">
            {t('newBody', { c: cityName(city), n: UPVOTE_THRESHOLD })}
          </p>

          <label className="mt-6 block">
            <span className="mb-1.5 block px-1 text-[13px] font-medium text-ink-3">{t('qLabel')}</span>
            <textarea
              required
              rows={3}
              maxLength={140}
              placeholder={t('qPlaceholder')}
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value)
                setError(null)
              }}
              className={`${field} resize-none py-3.5 leading-snug`}
            />
            <span className="mt-1 block px-1 text-right text-[12px] text-ink-3 tabular">{question.length}/140</span>
          </label>

          <label className="mt-3 block">
            <span className="mb-1.5 block px-1 text-[13px] font-medium text-ink-3">{t('areaLabel')}</span>
            <span className="relative block">
              <select value={area} onChange={(e) => setArea(e.target.value)} className={`${field} h-13 appearance-none py-3.5`}>
                <option value={cityName(city)}>{t('wholeCity')}</option>
                {DISTRICTS.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
            </span>
          </label>

          <label className="mt-4 block">
            <span className="mb-1.5 block px-1 text-[13px] font-medium text-ink-3">{t('contextLabel')}</span>
            <textarea
              rows={2}
              maxLength={280}
              placeholder={t('contextPlaceholder')}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className={`${field} resize-none py-3.5 leading-snug`}
            />
          </label>

          <fieldset className="mt-4">
            <legend className="mb-1.5 px-1 text-[13px] font-medium text-ink-3">{t('yourAnswer')}</legend>
            <div className="grid grid-cols-2 gap-2">
              {(['yes', 'no'] as const).map((a) => (
                <button
                  type="button"
                  key={a}
                  aria-pressed={answer === a}
                  onClick={() => setAnswer(a)}
                  className={`flex h-12 items-center justify-center gap-2 rounded-2xl bg-card text-[17px] font-semibold ring-1 ring-hair ${answer === a ? 'ring-2 ring-ink' : ''}`}
                >
                  <span className={`size-3 rounded-full ${a === 'yes' ? 'bg-yes' : 'bg-no'}`} aria-hidden />
                  {a === 'yes' ? t('yes') : t('no')}
                </button>
              ))}
            </div>
            <p className="mt-1.5 px-1 text-[12px] text-ink-3">{t('answerNote')}</p>
          </fieldset>

          {error && <p className="mt-4 px-1 text-[14px] text-no" aria-live="polite">{error}</p>}

          <button
            disabled={busy || !answer || !question.trim()}
            className="mt-6 h-14 w-full rounded-2xl bg-ink text-[17px] font-semibold text-bg transition active:scale-[0.98] disabled:opacity-40"
          >
            {busy ? '…' : t('submit')}
          </button>
          <p className="mt-4 px-1 text-[13px] leading-relaxed text-ink-3">{t('guidelines')}</p>
        </form>
      </main>
    </>
  )
}
