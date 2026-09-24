import { TopBar } from '../components/TopBar'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'

export default function About() {
  const { t } = useI18n()
  const { user, signOut } = useAuth()
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
          <div className="mt-10 overflow-hidden rounded-[18px] bg-card">
            <div className="px-4 py-3.5 text-[15px] text-ink-2">{user.email}</div>
            <button onClick={signOut} className="w-full border-t border-hair px-4 py-3.5 text-left text-[16px] font-medium text-no">
              {t('signOut')}
            </button>
          </div>
        )}
      </main>
    </>
  )
}
