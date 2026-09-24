import { Link, useNavigate } from 'react-router-dom'
import { LANGS, langLabels, useI18n } from '../lib/i18n'
import { useAuth } from '../lib/auth'
import { ChevronLeft, Person } from './Icons'

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight text-[17px]" aria-label="Plaça home">
      <span className="relative grid size-7 place-items-center rounded-[8px] bg-ink">
        <span className="flex w-4 gap-[2px]">
          <span className="h-1.5 flex-[3] rounded-full bg-yes" />
          <span className="h-1.5 flex-[2] rounded-full bg-no" />
        </span>
      </span>
      Plaça
    </Link>
  )
}

export function TopBar({ back, title }: { back?: boolean; title?: string }) {
  const { lang, setLang } = useI18n()
  const { user } = useAuth()
  const nav = useNavigate()

  return (
    <header className="safe-top sticky top-0 z-30 bg-glass backdrop-blur-xl backdrop-saturate-150 border-b border-hair/60">
      <div className="mx-auto flex h-12 max-w-xl items-center gap-2 px-4">
        {back ? (
          <button
            onClick={() => (history.length > 1 ? nav(-1) : nav('/'))}
            className="-ml-2 flex items-center gap-0.5 rounded-full px-2 py-1 text-yes text-[17px]"
          >
            <ChevronLeft />
            <span className="sr-only sm:not-sr-only">Plaça</span>
          </button>
        ) : (
          <Logo />
        )}
        {title && (
          <span className="absolute left-1/2 -translate-x-1/2 truncate max-w-[50%] text-[15px] font-semibold">{title}</span>
        )}
        <div className="ml-auto flex items-center gap-1">
          <label className="relative flex items-center rounded-full bg-fill px-2.5 py-1 text-[13px] font-medium text-ink-2">
            <span className="uppercase">{lang}</span>
            <select
              aria-label="Language"
              value={lang}
              onChange={(e) => setLang(e.target.value as typeof lang)}
              className="absolute inset-0 opacity-0"
            >
              {LANGS.map((l) => (
                <option key={l} value={l}>{langLabels[l]}</option>
              ))}
            </select>
          </label>
          <Link
            to={user ? '/about' : '/signin'}
            aria-label={user ? user.email : 'Sign in'}
            className={`grid size-8 place-items-center rounded-full ${user ? 'bg-yes text-white text-[13px] font-semibold' : 'text-ink-2'}`}
          >
            {user ? user.email[0].toUpperCase() : <Person />}
          </Link>
        </div>
      </div>
    </header>
  )
}
