import { motion } from 'framer-motion'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { TrendPoint } from '../api/types'
import { useI18n } from '../lib/i18n'

const H = 220
const M = { top: 16, right: 40, bottom: 26, left: 34 }
const TICKS = [0, 0.25, 0.5, 0.75, 1]

/** Single-series line: share saying yes over time. Crosshair + tooltip on hover/touch. */
export function TrendChart({ points }: { points: TrendPoint[] }) {
  const { lang, t, n } = useI18n()
  const wrap = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(340)
  const [hover, setHover] = useState<number | null>(null)

  useLayoutEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const locale = lang === 'en' ? 'en-GB' : `${lang}-ES`
  const fmt = useMemo(() => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }), [locale])

  const iw = w - M.left - M.right
  const ih = H - M.top - M.bottom
  const x = (i: number) => M.left + (points.length < 2 ? iw / 2 : (i / (points.length - 1)) * iw)
  const y = (v: number) => M.top + (1 - v) * ih

  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.yesShare).toFixed(1)}`).join('')
  const area = points.length ? `${line}L${x(points.length - 1)},${y(0)}L${x(0)},${y(0)}Z` : ''
  const xTicks = points.length > 1 ? [0, Math.round((points.length - 1) / 2), points.length - 1] : [0]
  const last = points.length - 1
  const hp = hover != null ? points[hover] : null

  function onMove(e: React.PointerEvent<SVGRectElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    const rel = (e.clientX - r.left) / r.width
    setHover(Math.max(0, Math.min(last, Math.round(rel * last))))
  }

  if (!points.length) return <div className="h-[220px]" />

  return (
    <div ref={wrap} className="relative select-none">
      <svg width={w} height={H} className="block overflow-visible" role="img"
        aria-label={`${t('trendTitle')}: ${Math.round(points[0].yesShare * 100)}% → ${Math.round(points[last].yesShare * 100)}%`}>
        {TICKS.map((v) => (
          <g key={v}>
            <line x1={M.left} x2={w - M.right} y1={y(v)} y2={y(v)}
              stroke="var(--hair)" strokeWidth={1} />
            <text x={M.left - 8} y={y(v)} dy="0.32em" textAnchor="end" className="fill-ink-3 text-[11px] tabular">
              {v * 100}%
            </text>
          </g>
        ))}
        {xTicks.map((i, k) => (
          <text key={i} x={x(i)} y={H - 6} textAnchor={k === 0 ? 'start' : k === xTicks.length - 1 ? 'end' : 'middle'}
            className="fill-ink-3 text-[11px]">
            {fmt.format(new Date(points[i].date))}
          </text>
        ))}
        <motion.path d={area} fill="var(--yes)" fillOpacity={0.1}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} />
        <motion.path d={line} fill="none" stroke="var(--yes)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: 'easeOut' }} />

        {hp && hover != null ? (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={M.top} y2={y(0)} stroke="var(--ink-3)" strokeWidth={1} />
            <circle cx={x(hover)} cy={y(hp.yesShare)} r={5} fill="var(--yes)" stroke="var(--card)" strokeWidth={2} />
          </g>
        ) : (
          <g>
            <circle cx={x(last)} cy={y(points[last].yesShare)} r={5} fill="var(--yes)" stroke="var(--card)" strokeWidth={2} />
            <text x={x(last) + 9} y={y(points[last].yesShare)} dy="0.32em" className="fill-ink text-[13px] font-semibold tabular">
              {Math.round(points[last].yesShare * 100)}%
            </text>
          </g>
        )}
        <rect x={M.left} y={0} width={iw} height={H} fill="transparent" style={{ touchAction: 'pan-y' }}
          onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setHover(null)} />
      </svg>

      {hp && hover != null && (
        <div
          className="pointer-events-none absolute top-0 rounded-xl bg-elevated px-3 py-2 text-[12px] shadow-[0_4px_20px_rgb(0_0_0/0.14)] ring-1 ring-hair"
          style={{ left: Math.min(Math.max(x(hover) - 70, 0), w - 140), width: 140 }}
        >
          <div className="text-ink-3">{fmt.format(new Date(hp.date))}</div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-yes" />
            <span className="font-semibold text-ink tabular">{Math.round(hp.yesShare * 100)}% {t('yes').toLowerCase()}</span>
          </div>
          <div className="text-ink-3 tabular">{n(hp.votes)} {t('votes')}</div>
        </div>
      )}
    </div>
  )
}
