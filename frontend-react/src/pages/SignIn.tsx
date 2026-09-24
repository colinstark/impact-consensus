import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api, usingMock } from '../api'
import { TopBar } from '../components/TopBar'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'

export default function SignIn() {
  const { t } = useI18n()
  const { signIn } = useAuth()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next') || '/'
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setState('sending')
    try {
      await api.requestMagicLink(email.trim())
      setState('sent')
    } catch {
      setState('error')
    }
  }

  return (
    <>
      <TopBar back />
      <main className="mx-auto max-w-md px-5 pt-12 pb-16 safe-bottom">
        <AnimatePresence mode="wait">
          {state !== 'sent' ? (
            <motion.form key="form" onSubmit={submit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -8 }}>
              <h1 className="text-[34px] font-bold tracking-[-0.02em]">{t('signIn')}</h1>
              <p className="mt-2 text-[17px] leading-relaxed text-ink-2">{t('signInToSee')}</p>
              <label className="mt-8 block">
                <span className="sr-only">{t('email')}</span>
                <input
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  inputMode="email"
                  placeholder="nom@exemple.cat"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 w-full rounded-2xl bg-card px-4 text-[17px] outline-none ring-1 ring-hair placeholder:text-ink-3 focus:ring-2 focus:ring-yes"
                />
              </label>
              <button
                disabled={state === 'sending'}
                className="mt-3 h-14 w-full rounded-2xl bg-ink text-[17px] font-semibold text-bg transition active:scale-[0.98] disabled:opacity-60"
              >
                {state === 'sending' ? '…' : t('sendLink')}
              </button>
              {state === 'error' && <p className="mt-3 text-[15px] text-ink-2">{t('error')}</p>}
              <p className="mt-6 text-[13px] leading-relaxed text-ink-3">{t('signInWhy')}</p>
            </motion.form>
          ) : (
            <motion.div key="sent" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <div className="mx-auto grid size-16 place-items-center rounded-full bg-yes/15 text-[30px]">✉️</div>
              <h1 className="mt-5 text-[28px] font-bold tracking-tight">{t('checkInbox')}</h1>
              <p className="mt-2 text-[17px] text-ink-2">{t('linkSent', { e: email })}</p>
              {usingMock && (
                <button
                  onClick={() => {
                    signIn(email.trim())
                    nav(next, { replace: true })
                  }}
                  className="mt-8 h-12 rounded-full bg-ink px-6 text-[16px] font-semibold text-bg"
                >
                  {t('demoContinue')}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  )
}
