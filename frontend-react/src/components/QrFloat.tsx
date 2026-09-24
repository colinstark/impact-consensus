import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { encode } from 'uqr'
import type { Topic } from '../api/types'
import { useI18n } from '../lib/i18n'

// A QR code for the current question, floating bottom right, so a screen or a laptop at an
// event can invite the room to vote. Scans land on the question with ?src=qr, which the app
// already records as the entry source. It can be minimised to a small button, and enlarged
// to fill the screen for presenting with the maximise button.

const KEY = 'placa.qr'

function initialOpen() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved) return saved === 'open'
  } catch {
    // Storage blocked: fall through to the default.
  }
  // Open on laptops and tablets; on a phone it would cover the question, so start small.
  return window.matchMedia('(min-width: 640px)').matches
}

export function QrFloat({ topic }: { topic: Topic }) {
  const { t, l } = useI18n()
  const [open, setOpenState] = useState(initialOpen)
  const [big, setBig] = useState(false)
  const screen = useRef<HTMLDivElement>(null)
  const url = `${location.origin}/t/${topic.slug}?src=qr`

  const setOpen = (v: boolean) => {
    setOpenState(v)
    try {
      localStorage.setItem(KEY, v ? 'open' : 'min')
    } catch {
      // Not remembered, but still works for this visit.
    }
  }

  // While enlarged, also ask the browser for real full screen (hides its bars on a projector).
  // Leaving full screen with Esc closes the enlarged view too.
  useEffect(() => {
    if (!big) return
    const el = screen.current
    el?.requestFullscreen?.().catch(() => {})
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setBig(false)
    const onExit = () => !document.fullscreenElement && setBig(false)
    window.addEventListener('keydown', onKey)
    document.addEventListener('fullscreenchange', onExit)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('fullscreenchange', onExit)
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    }
  }, [big])

  return (
    <>
      <div className="fixed right-4 bottom-4 z-30 mb-[env(safe-area-inset-bottom)] print:hidden">
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.div
              key="card"
              initial={{ opacity: 0, scale: 0.9, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 12 }}
              transition={{ type: 'spring', bounce: 0.18, duration: 0.35 }}
              // A quarter of the screen width, never smaller than a comfortable scan size.
              className="w-[max(200px,25vw)] origin-bottom-right rounded-[24px] bg-card p-3 shadow-[0_1px_2px_rgb(0_0_0/0.06),0_12px_32px_rgb(0_0_0/0.16)]"
            >
              <div className="flex items-center gap-2 pb-2.5 pl-1">
                <span className="flex-1 text-[clamp(14px,1.3vw,20px)] font-semibold">{t('scanToVote')}</span>
                <button
                  onClick={() => setOpen(false)}
                  aria-label={t('hideQr')}
                  title={t('hideQr')}
                  className="grid size-8 place-items-center rounded-full bg-fill text-ink-2 active:scale-95"
                >
                  <Minus />
                </button>
                <button
                  onClick={() => setBig(true)}
                  aria-label={t('enlargeQr')}
                  title={t('enlargeQr')}
                  className="grid size-8 place-items-center rounded-full bg-fill text-ink-2 active:scale-95"
                >
                  <Maximize />
                </button>
              </div>
              <button onClick={() => setBig(true)} aria-label={t('enlargeQr')} className="block w-full rounded-[16px] bg-white p-2 active:scale-[0.98]">
                <Code url={url} />
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="pill"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setOpen(true)}
              aria-label={t('showQr')}
              className="flex items-center gap-2 rounded-full bg-ink py-2.5 pr-4 pl-3 text-[14px] font-semibold text-bg shadow-[0_8px_24px_rgb(0_0_0/0.2)] active:scale-95"
            >
              <QrIcon />
              {t('scanToVote')}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {createPortal(
        <AnimatePresence>
          {big && (
            <motion.div
              ref={screen}
              className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-white p-6 text-center text-black"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBig(false)}
              role="dialog"
              aria-modal="true"
              aria-label={t('scanToVote')}
            >
              <button
                onClick={() => setBig(false)}
                aria-label={t('exitFullScreen')}
                title={t('exitFullScreen')}
                className="absolute top-5 right-5 grid size-11 place-items-center rounded-full bg-neutral-100 text-neutral-700 active:scale-95"
              >
                <Minimize />
              </button>
              <p className="max-w-3xl text-[clamp(22px,4vw,44px)] font-bold leading-tight tracking-tight">{l(topic.question)}</p>
              <div className="w-[min(68vh,85vw)]">
                <Code url={url} />
              </div>
              <p className="text-[clamp(16px,2.4vw,24px)] font-semibold">{t('scanToVote')}</p>
              <p className="text-[14px] text-neutral-500">{t('tapToClose')}</p>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}

/** The QR code as an SVG: one square per dark module, black on white so any camera reads it. */
function Code({ url }: { url: string }) {
  const { path, size } = useMemo(() => {
    const qr = encode(url, { ecc: 'M', border: 0 })
    let d = ''
    qr.data.forEach((row, y) => row.forEach((dark, x) => dark && (d += `M${x} ${y}h1v1h-1z`)))
    return { path: d, size: qr.size }
  }, [url])
  return (
    <svg viewBox={`-2 -2 ${size + 4} ${size + 4}`} className="block h-auto w-full" shapeRendering="crispEdges" role="img" aria-label={url}>
      <rect x="-2" y="-2" width={size + 4} height={size + 4} fill="#fff" />
      <path d={path} fill="#000" />
    </svg>
  )
}

const Minus = () => (
  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden>
    <path d="M6 12h12" />
  </svg>
)

const Maximize = () => (
  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" />
  </svg>
)

const Minimize = () => (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 10h-6V4M4 14h6v6M14 10l7-7M10 14l-7 7" />
  </svg>
)

const QrIcon = () => (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" aria-hidden>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 20h2M20 14v2" />
  </svg>
)
