import { motion } from 'framer-motion'
import type { DistrictResult } from '../api/types'
import { BCN_DISTRICT_SHAPES, BCN_VIEWBOX } from '../data/bcnDistricts'
import { useI18n } from '../lib/i18n'

export const yesShare = (r: { yes: number; no: number }) => r.yes / Math.max(1, r.yes + r.no)

/**
 * Diverging fill: orange (no) ← neutral grey (50/50) → blue (yes).
 * Full intensity at 30 points either side of an even split.
 */
export function shareFill(share: number) {
  const t = Math.max(-1, Math.min(1, (share - 0.5) / 0.3))
  const pole = t >= 0 ? 'var(--yes)' : 'var(--no)'
  return `color-mix(in oklab, ${pole} ${Math.round(Math.abs(t) * 100)}%, var(--map-mid))`
}

export function DistrictMap({ results, selected, home, onSelect }: {
  results: DistrictResult[]
  selected: string | null
  home: string | null
  onSelect: (id: string) => void
}) {
  const { t, n } = useI18n()
  const byId = Object.fromEntries(results.map((r) => [r.districtId, r]))

  return (
    <svg viewBox={`-10 -10 ${BCN_VIEWBOX.width + 20} ${BCN_VIEWBOX.height + 20}`} className="block w-full" role="group" aria-label={t('byBarrio')}>
      {BCN_DISTRICT_SHAPES.map((d, i) => {
        const r = byId[d.id]
        const share = r ? yesShare(r) : 0.5
        const isSel = selected === d.id
        return (
          <motion.path
            key={d.id}
            d={d.d}
            role="button"
            tabIndex={0}
            aria-label={`${d.name}: ${Math.round(share * 100)}% ${t('yes').toLowerCase()}, ${r ? n(r.yes + r.no) : 0} ${t('votes')}`}
            aria-pressed={isSel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.03 }}
            style={{ fill: shareFill(share) }}
            stroke={isSel ? 'var(--ink)' : 'var(--card)'}
            strokeWidth={isSel ? 6 : 4}
            strokeLinejoin="round"
            className="cursor-pointer outline-none transition-[stroke] focus-visible:[stroke:var(--ink)]"
            onClick={() => onSelect(d.id)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(d.id)}
          />
        )
      })}
      {/* Selected outline drawn last so neighbours don't cover it. */}
      {selected && (
        <path d={BCN_DISTRICT_SHAPES.find((d) => d.id === selected)?.d} fill="none" stroke="var(--ink)" strokeWidth={6}
          strokeLinejoin="round" pointerEvents="none" />
      )}
      {BCN_DISTRICT_SHAPES.map((d) => {
        const r = byId[d.id]
        if (!r) return null
        const isHome = home === d.id
        return (
          <g key={d.id} pointerEvents="none" transform={`translate(${d.cx} ${d.cy})`}>
            <text textAnchor="middle" dy={isHome ? 22 : 11} className="tabular"
              style={{ font: '600 34px var(--font-sans)', fill: 'var(--ink)', paintOrder: 'stroke', stroke: 'var(--card)', strokeWidth: 7, strokeLinejoin: 'round' }}>
              {Math.round(yesShare(r) * 100)}%
            </text>
            {isHome && (
              <g transform="translate(0 -26)">
                <rect x={-34} y={-18} width={68} height={32} rx={16} fill="var(--ink)" />
                <text textAnchor="middle" dy={7} style={{ font: '600 20px var(--font-sans)', fill: 'var(--card)' }}>{t('you')}</text>
              </g>
            )}
          </g>
        )
      })}
    </svg>
  )
}

export function MapLegend() {
  const { t } = useI18n()
  return (
    <div className="px-1">
      <div className="h-2 rounded-full" style={{ background: 'linear-gradient(in oklab to right, var(--no), var(--map-mid), var(--yes))' }} />
      <div className="mt-1.5 flex justify-between text-[12px] text-ink-3 tabular">
        <span>{t('moreNo')} · 20%</span>
        <span>{t('even')} · 50%</span>
        <span>80% · {t('moreYes')}</span>
      </div>
    </div>
  )
}
