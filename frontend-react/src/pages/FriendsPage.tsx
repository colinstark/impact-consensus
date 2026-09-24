import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { TopBar } from '../components/TopBar'
import { useFriends } from '../lib/friends'
import { useI18n } from '../lib/i18n'
import { ChevronRight } from '../components/Icons'

// Topics friends sent you, your nickname, and your friend list.
export default function FriendsPage() {
  const { t, lang } = useI18n()
  const f = useFriends()
  const fmt = new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : `${lang}-ES`, { day: 'numeric', month: 'short' })

  // Opening the page counts as reading what's there.
  useEffect(() => {
    if (f.ready && f.unread) f.markRead()
  }, [f.ready, f.unread, f])

  if (!f.available) {
    return (
      <>
        <TopBar back title={t('friends')} />
        <main className="mx-auto max-w-xl px-5 pt-8 pb-16 safe-bottom">
          <p className="rounded-2xl bg-card px-4 py-4 text-[16px] text-ink-2">
            {t('signInForFriends')}{' '}
            <Link to="/signin?next=/friends" className="font-medium text-yes">{t('signIn')}</Link>
          </p>
        </main>
      </>
    )
  }

  return (
    <>
      <TopBar back title={t('friends')} />
      <main className="mx-auto max-w-xl px-4 pt-6 pb-16 safe-bottom">
        <Heading>{t('inbox')}</Heading>
        {f.inbox.length ? (
          <ul className="divide-y divide-hair overflow-hidden rounded-[18px] bg-card">
            {f.inbox.map((x) => (
              <li key={x.id}>
                <Link to={`/t/${x.topicId}`} className="flex items-center gap-3 px-4 py-3.5 active:bg-fill">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium text-ink-3">
                      {!x.read && <span className="mr-1.5 inline-block size-2 rounded-full bg-yes align-middle" aria-hidden />}
                      {t('friendSent', { n: x.from })} · {fmt.format(new Date(x.at))}
                    </span>
                    <span className="mt-0.5 block text-[16px] font-medium leading-snug">{x.question}</span>
                    {x.note && <span className="mt-1 block text-[15px] text-ink-2">“{x.note}”</span>}
                    {x.vote && (
                      <span className="mt-1 block text-[13px] text-ink-3">
                        {t('friendVoted', { n: x.from, v: x.vote === 'yes' ? t('yes') : t('no') })}
                      </span>
                    )}
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-ink-3" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-[18px] bg-card px-4 py-3.5 text-[15px] text-ink-2">{t('inboxEmpty')}</p>
        )}

        <Nickname />
        {f.nickname && <Friends />}
      </main>
    </>
  )
}

function Nickname() {
  const { t } = useI18n()
  const { nickname, setNickname } = useFriends()
  const [value, setValue] = useState(nickname ?? '')
  const [status, setStatus] = useState<'idle' | 'taken' | 'invalid' | 'saved'>('idle')
  useEffect(() => setValue(nickname ?? ''), [nickname])

  async function save(e: FormEvent) {
    e.preventDefault()
    const r = await setNickname(value)
    setStatus(r === 'ok' ? 'saved' : r)
  }

  return (
    <section className="mt-8">
      <Heading>{nickname ? t('yourNickname') : t('pickNickname')}</Heading>
      <form onSubmit={save} className="flex gap-2">
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setStatus('idle')
          }}
          maxLength={24}
          autoCapitalize="none"
          autoCorrect="off"
          className="h-12 min-w-0 flex-1 rounded-2xl bg-card px-4 text-[16px] focus:outline-none focus:ring-2 focus:ring-yes"
          aria-label={t('yourNickname')}
        />
        <button disabled={!value.trim() || value.trim() === nickname} className="h-12 rounded-2xl bg-ink px-5 text-[16px] font-semibold text-bg disabled:opacity-40">
          {t('save')}
        </button>
      </form>
      <p className={`mt-2 px-1 text-[13px] ${status === 'taken' || status === 'invalid' ? 'text-no' : 'text-ink-3'}`}>
        {status === 'taken' ? t('nicknameTaken') : t('nicknameHint')}
      </p>
    </section>
  )
}

function Friends() {
  const { t } = useI18n()
  const { friends, add, remove } = useFriends()
  const [name, setName] = useState('')
  const [problem, setProblem] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    const r = await add(name)
    if (r === 'ok') {
      setName('')
      setProblem('')
    } else setProblem(r === 'self' ? '' : t('noSuchNickname'))
  }

  return (
    <section className="mt-8">
      <Heading>{t('friends')}</Heading>
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('friendNickname')}
          autoCapitalize="none"
          autoCorrect="off"
          className="h-12 min-w-0 flex-1 rounded-2xl bg-card px-4 text-[16px] placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-yes"
        />
        <button disabled={!name.trim()} className="h-12 rounded-2xl bg-ink px-5 text-[16px] font-semibold text-bg disabled:opacity-40">
          {t('add')}
        </button>
      </form>
      <p className={`mt-2 px-1 text-[13px] ${problem ? 'text-no' : 'text-ink-3'}`}>{problem || t('friendsHowItWorks')}</p>

      {friends.length > 0 && (
        <ul className="mt-3 divide-y divide-hair overflow-hidden rounded-[18px] bg-card">
          {friends.map((x) => (
            <li key={x.id} className="flex items-center gap-3 px-4 py-3">
              <span className="grid size-8 place-items-center rounded-full bg-ink text-[13px] font-semibold text-bg">{x.nickname[0].toUpperCase()}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-medium">{x.nickname}</span>
                {!(x.added && x.addedMe) && (
                  <span className="block text-[13px] text-ink-3">{x.added ? t('waitingForThem') : t('addedYou')}</span>
                )}
              </span>
              {!x.added && (
                <button onClick={() => add(x.nickname)} className="rounded-full bg-yes px-3 py-1.5 text-[14px] font-medium text-white">
                  {t('addBack')}
                </button>
              )}
              <button onClick={() => remove(x.id)} className="rounded-full bg-fill px-3 py-1.5 text-[14px] font-medium text-ink-2">
                {t('remove')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

const Heading = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-ink-3">{children}</h2>
)
