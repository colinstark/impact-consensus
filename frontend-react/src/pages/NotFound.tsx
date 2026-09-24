import { Link } from 'react-router-dom'
import { TopBar } from '../components/TopBar'
import { useI18n } from '../lib/i18n'

export default function NotFound() {
  const { t } = useI18n()
  return (
    <>
      <TopBar back />
      <main className="mx-auto max-w-xl px-4 pt-24 text-center">
        <p className="text-[20px] font-semibold">{t('notFound')}</p>
        <Link to="/" className="mt-4 inline-block rounded-full bg-ink px-5 py-2.5 font-medium text-bg">{t('backHome')}</Link>
      </main>
    </>
  )
}
