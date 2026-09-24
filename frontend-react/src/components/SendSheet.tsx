import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Choice, Topic } from '../api/types'
import { useFriends } from '../lib/friends'
import { useI18n } from '../lib/i18n'
import { Check } from './Icons'
import { Sheet } from './Sheet'
import { useToast } from './Toast'

/** Send a topic to one or more friends, with an optional note and, if chosen, your vote. */
export function SendSheet({ topic, mine, open, onClose }: {
  topic: Topic
  mine?: Choice
  open: boolean
  onClose: () => void
}) {
  const { t, l } = useI18n()
  const toast = useToast()
  const { available, friends, send } = useFriends()
  const [to, setTo] = useState<string[]>([])
  const [note, setNote] = useState('')
  // Off by default: your vote stays private unless you choose to show it.
  const [withVote, setWithVote] = useState(false)
  const [busy, setBusy] = useState(false)
  const mutual = friends.filter((f) => f.added && f.addedMe)

  async function submit() {
    setBusy(true)
    try {
      await send(topic.id, to, note, withVote ? mine ?? null : null)
      const names = mutual.filter((f) => to.includes(f.id)).map((f) => f.nickname).join(', ')
      toast(t('sentTo', { n: names }))
      setTo([])
      setNote('')
      setWithVote(false)
      onClose()
    } catch {
      toast(t('error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} label={t('sendToFriend')}>
      <h2 className="text-[22px] font-bold tracking-tight">{t('sendToFriend')}</h2>
      <p className="mt-1 text-[15px] leading-snug text-ink-2">{l(topic.question)}</p>

      {!available ? (
        <div className="mt-4 rounded-2xl bg-fill px-4 py-3 text-[15px] text-ink-2">
          {t('signInForFriends')}{' '}
          <Link to={`/signin?next=/t/${topic.slug}`} className="font-medium text-yes">{t('signIn')}</Link>
        </div>
      ) : !mutual.length ? (
        <div className="mt-4 rounded-2xl bg-fill px-4 py-3 text-[15px] text-ink-2">
          {t('noFriendsYet')}{' '}
          <Link to="/friends" className="font-medium text-yes">{t('friends')}</Link>
        </div>
      ) : (
        <>
          <ul className="mt-4 divide-y divide-hair overflow-hidden rounded-[18px] bg-fill/60">
            {mutual.map((f) => {
              const on = to.includes(f.id)
              return (
                <li key={f.id}>
                  <button
                    onClick={() => setTo(on ? to.filter((x) => x !== f.id) : [...to, f.id])}
                    aria-pressed={on}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-fill"
                  >
                    <span className="grid size-8 place-items-center rounded-full bg-ink text-[13px] font-semibold text-bg">
                      {f.nickname[0].toUpperCase()}
                    </span>
                    <span className="flex-1 text-[16px] font-medium">{f.nickname}</span>
                    <span className={`grid size-6 place-items-center rounded-full border ${on ? 'border-yes bg-yes text-white' : 'border-fill-2'}`}>
                      {on && <Check className="size-3.5" />}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 280))}
            placeholder={t('sendNote')}
            rows={2}
            className="mt-3 w-full resize-none rounded-2xl bg-fill px-4 py-3 text-[16px] placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-yes"
          />

          {mine && (
            <label className="mt-2 flex items-center gap-3 px-1 py-2">
              <span className="flex-1 text-[15px]">{t('includeMyVote')}</span>
              <input type="checkbox" role="switch" checked={withVote} onChange={(e) => setWithVote(e.target.checked)} className="peer sr-only" />
              <span className="relative h-[31px] w-[51px] shrink-0 rounded-full bg-fill-2 transition peer-checked:bg-yes peer-focus-visible:ring-2 peer-focus-visible:ring-yes after:absolute after:top-[2px] after:left-[2px] after:size-[27px] after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5" aria-hidden />
            </label>
          )}

          <button
            onClick={submit}
            disabled={!to.length || busy}
            className="mt-3 mb-2 h-13 w-full rounded-2xl bg-ink py-3.5 text-[17px] font-semibold text-bg transition active:scale-[0.98] disabled:opacity-40"
          >
            {busy ? '…' : t('send')}
          </button>
        </>
      )}
    </Sheet>
  )
}
