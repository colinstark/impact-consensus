import { AnimatePresence, motion } from 'framer-motion'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { api, usingMock } from '../api'
import type { AgeBracket, Gender } from '../api/types'
import { AGE_OPTIONS, ageLabel, GENDERS, genderLabel } from '../data/demographics'
import { districtForPostcode, districtName } from '../data/districts'
import { CONSENT_VERSION, useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { Check, ChevronDown, Pin } from './Icons'

const field =
  'h-13 w-full rounded-2xl bg-card px-4 py-3.5 text-[17px] outline-none ring-1 ring-hair placeholder:text-ink-3 focus:ring-2 focus:ring-yes'

/**
 * Sign-up wall for insights: name, email, postcode, age range, gender, terms, and an
 * opt-in (off by default) for sharing anonymised answers with third parties.
 */
export function AccountForm({ onDone }: { onDone?: () => void }) {
  const { t } = useI18n()
  const { user, complete, register, signIn } = useAuth()
  // Signed in but missing sign-up details (e.g. an account from before this form).
  const finishing = !!user && !complete
  const [mode, setMode] = useState<'signup' | 'signin'>('signup')
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [postcode, setPostcode] = useState(user?.postcode ?? '')
  const [age, setAge] = useState<AgeBracket | ''>(user?.ageBracket ?? '')
  const [gender, setGender] = useState<Gender | ''>(user?.gender ?? '')
  const [terms, setTerms] = useState(false)
  const [share, setShare] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const district = districtForPostcode(postcode)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const mail = email.trim().toLowerCase()
    if (mode === 'signup') {
      if (!name.trim() || !mail || !age || !gender) return setError(t('fillAll'))
      if (!district) return setError(t('postcodeInvalid'))
      if (!terms) return setError(t('mustAgree'))
    }
    setState('sending')
    try {
      if (mode === 'signup') {
        await register({
          name: name.trim(),
          email: mail,
          postcode: postcode.trim(),
          districtId: district!,
          ageBracket: age as AgeBracket,
          gender: gender as Gender,
          shareWithThirdParties: share,
          acceptedTermsAt: new Date().toISOString(),
          consentVersion: CONSENT_VERSION,
        })
      }
      if (finishing) {
        signIn(mail)
        onDone?.()
        return
      }
      await api.requestMagicLink(mail)
      setState('sent')
    } catch {
      setError(t('error'))
      setState('idle')
    }
  }

  if (state === 'sent') {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="py-6 text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-yes/15 text-[30px]">✉️</div>
        <h2 className="mt-5 text-[26px] font-bold tracking-tight">{t('checkInbox')}</h2>
        <p className="mt-2 text-[17px] text-ink-2">{t('linkSent', { e: email.trim() })}</p>
        {usingMock && (
          <button
            onClick={() => {
              signIn(email.trim().toLowerCase())
              onDone?.()
            }}
            className="mt-8 h-12 rounded-full bg-ink px-6 text-[16px] font-semibold text-bg"
          >
            {t('demoContinue')}
          </button>
        )}
      </motion.div>
    )
  }

  const signup = mode === 'signup'
  return (
    <form onSubmit={submit} noValidate>
      <h2 className="text-[28px] font-bold tracking-[-0.02em]">
        {finishing ? t('completeProfile') : signup ? t('signUpTitle') : t('signIn')}
      </h2>
      <p className="mt-2 text-[16px] leading-relaxed text-ink-2">{signup ? t('signUpBody') : t('signInToSee')}</p>

      <div className="mt-6 space-y-3">
        <AnimatePresence initial={false}>
          {signup && (
            <motion.div key="name" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <Field label={t('name')}>
                <input autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={field} />
              </Field>
            </motion.div>
          )}
        </AnimatePresence>
        <Field label={t('email')}>
          <input type="email" inputMode="email" autoComplete="email" placeholder="nom@exemple.cat" value={email}
            disabled={finishing} onChange={(e) => setEmail(e.target.value)} className={`${field} disabled:opacity-60`} />
        </Field>

        {signup && (
          <>
            <Field label={t('postcode')}>
              <input inputMode="numeric" autoComplete="postal-code" maxLength={5} placeholder="08012" value={postcode}
                onChange={(e) => setPostcode(e.target.value.replace(/\D/g, ''))} className={`${field} tabular tracking-wider`} />
              {district && (
                <span className="mt-1.5 flex items-center gap-1 px-1 text-[13px] text-ink-2"><Pin /> {districtName(district)}</span>
              )}
            </Field>

            <Field label={t('ageLabel')}>
              <span className="relative block">
                <select value={age} onChange={(e) => setAge(e.target.value as AgeBracket)} className={`${field} appearance-none ${age ? '' : 'text-ink-3'}`}>
                  <option value="" disabled>{t('choose')}</option>
                  {AGE_OPTIONS.map((a) => <option key={a} value={a}>{ageLabel(a, t)}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
              </span>
            </Field>

            <fieldset>
              <legend className="mb-1.5 px-1 text-[13px] font-medium text-ink-3">{t('genderLabel')}</legend>
              <div className="grid grid-cols-2 gap-2">
                {GENDERS.map((g) => (
                  <button
                    type="button"
                    key={g}
                    aria-pressed={gender === g}
                    onClick={() => setGender(g)}
                    className={`min-h-12 rounded-2xl bg-card px-3 py-2.5 text-[15px] font-medium ring-1 ring-hair ${g === 'nb' ? 'col-span-2' : ''} ${gender === g ? 'ring-2 ring-ink' : ''}`}
                  >
                    {genderLabel(g, t)}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="space-y-3 pt-2">
              <Checkbox checked={terms} onChange={setTerms}>
                <AgreeTerms />
              </Checkbox>
              <Checkbox checked={share} onChange={setShare}>
                <span className="font-medium text-ink">{t('shareLabel')}</span>
                <span className="mt-0.5 block text-[13px] leading-snug text-ink-3">{t('shareHelp')}</span>
              </Checkbox>
            </div>
          </>
        )}
      </div>

      {error && <p className="mt-4 px-1 text-[14px] text-no" aria-live="polite">{error}</p>}

      <button
        disabled={state === 'sending'}
        className="mt-6 h-14 w-full rounded-2xl bg-ink text-[17px] font-semibold text-bg transition active:scale-[0.98] disabled:opacity-60"
      >
        {state === 'sending' ? '…' : finishing ? t('save') : signup ? t('createAccount') : t('sendLink')}
      </button>
      {!finishing && (
        <button type="button" onClick={() => { setMode(signup ? 'signin' : 'signup'); setError(null) }}
          className="mt-4 w-full text-center text-[15px] font-medium text-yes">
          {signup ? t('haveAccount') : t('newAccount')}
        </button>
      )}
    </form>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block px-1 text-[13px] font-medium text-ink-3">{label}</span>
      {children}
    </label>
  )
}

function Checkbox({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-[15px] leading-snug text-ink-2">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        className={`mt-0.5 grid size-[22px] shrink-0 place-items-center rounded-[7px] ring-1 transition peer-focus-visible:ring-2 peer-focus-visible:ring-yes ${
          checked ? 'bg-ink text-bg ring-ink' : 'bg-card ring-hair'
        }`}
        aria-hidden
      >
        {checked && <Check className="size-3.5" />}
      </span>
      <span className="flex-1">{children}</span>
    </label>
  )
}

/** "I agree to the {terms} and the {privacy}." with both as links. */
function AgreeTerms() {
  const { t } = useI18n()
  const parts = t('agreeTerms', { terms: '{terms}', privacy: '{privacy}' }).split(/(\{terms\}|\{privacy\})/)
  return (
    <span className="text-ink">
      {parts.map((p, i) =>
        p === '{terms}' ? (
          <Link key={i} to="/terms" target="_blank" className="font-medium text-yes underline-offset-2 hover:underline">{t('termsLink')}</Link>
        ) : p === '{privacy}' ? (
          <Link key={i} to="/privacy" target="_blank" className="font-medium text-yes underline-offset-2 hover:underline">{t('privacyLink')}</Link>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </span>
  )
}
