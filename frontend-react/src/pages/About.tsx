import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '../components/Toast'
import { TopBar } from '../components/TopBar'
import { ageLabel, genderLabel } from '../data/demographics'
import { districtName } from '../data/districts'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'

export default function About() {
  const { t } = useI18n()
  const { user, update, deleteAccount, signOut } = useAuth()
  const toast = useToast()
  const nav = useNavigate()

  function download() {
    const blob = new Blob([JSON.stringify(user, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'placa-my-data.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <>
      <TopBar back />
      <main className="mx-auto max-w-xl px-5 pt-8 pb-16 safe-bottom">
        <h1 className="text-[34px] font-bold tracking-[-0.02em]">Plaça</h1>
        <p className="mt-2 text-[17px] leading-relaxed text-ink-2">{t('intro')}</p>
        <div className="mt-8 space-y-4 text-[16px] leading-relaxed text-ink-2">
          <p>
            Inspired by the sticker boards Barcelona’s districts put up to ask the community about everything from bin days to
            bike lanes. Plaça brings that board online — scan a QR code on the street, tap yes or no, see the result.
          </p>
          <p>Votes are anonymous. No account needed. Open source and non-commercial, built for community benefit.</p>
        </div>

        {user && (
          <section className="mt-10">
            <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-ink-3">{t('yourData')}</h2>
            <div className="divide-y divide-hair overflow-hidden rounded-[18px] bg-card text-[15px]">
              <Row label={t('name')} value={user.name} />
              <Row label={t('email')} value={user.email} />
              <Row label={t('postcode')} value={user.postcode && `${user.postcode} · ${districtName(user.districtId ?? '')}`} />
              <Row label={t('ageLabel')} value={user.ageBracket && ageLabel(user.ageBracket, t)} />
              <Row label={t('genderLabel')} value={user.gender && genderLabel(user.gender, t)} />
              <label className="flex items-center gap-3 px-4 py-3.5">
                <span className="flex-1 text-ink">{t('shareToggle')}</span>
                <input
                  type="checkbox"
                  role="switch"
                  checked={!!user.shareWithThirdParties}
                  onChange={async (e) => {
                    await update({ shareWithThirdParties: e.target.checked })
                    toast(t('saved'))
                  }}
                  className="peer sr-only"
                />
                <span className="relative h-[31px] w-[51px] shrink-0 rounded-full bg-fill-2 transition peer-checked:bg-yes peer-focus-visible:ring-2 peer-focus-visible:ring-yes after:absolute after:top-[2px] after:left-[2px] after:size-[27px] after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5" aria-hidden />
              </label>
              <button onClick={download} className="w-full px-4 py-3.5 text-left font-medium text-yes">{t('downloadData')}</button>
              <button onClick={signOut} className="w-full px-4 py-3.5 text-left font-medium">{t('signOut')}</button>
              <button
                onClick={async () => {
                  if (!confirm(t('deleteConfirm'))) return
                  await deleteAccount()
                  toast(t('deleted'))
                  nav('/')
                }}
                className="w-full px-4 py-3.5 text-left font-medium text-no"
              >
                {t('deleteAccount')}
              </button>
            </div>
          </section>
        )}

        <div className="mt-8 flex gap-4 px-1 text-[14px] font-medium text-yes">
          <Link to="/privacy">{t('privacyLink')}</Link>
          <Link to="/terms">{t('termsLink')}</Link>
        </div>
      </main>
    </>
  )
}

function Row({ label, value }: { label: string; value?: string | false }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <span className="text-ink-3">{label}</span>
      <span className="truncate text-right text-ink">{value || '—'}</span>
    </div>
  )
}
