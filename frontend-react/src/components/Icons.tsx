// Minimal SF-Symbols-style icons, stroke-based so they inherit text colour.
type P = { className?: string }
const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
  'aria-hidden': true,
}
export const ChevronLeft = ({ className = 'size-5' }: P) => (
  <svg {...base} className={className}><path d="M15 18l-6-6 6-6" /></svg>
)
export const ChevronRight = ({ className = 'size-4' }: P) => (
  <svg {...base} className={className}><path d="M9 18l6-6-6-6" /></svg>
)
export const Lock = ({ className = 'size-4' }: P) => (
  <svg {...base} className={className}><rect x="5" y="11" width="14" height="10" rx="2.5" /><path d="M8 11V8a4 4 0 118 0v3" /></svg>
)
export const Share = ({ className = 'size-5' }: P) => (
  <svg {...base} className={className}><path d="M12 3v12M8 7l4-4 4 4" /><path d="M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>
)
export const Person = ({ className = 'size-5' }: P) => (
  <svg {...base} className={className}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0116 0" /></svg>
)
export const Globe = ({ className = 'size-4' }: P) => (
  <svg {...base} className={className}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" /></svg>
)
export const Chart = ({ className = 'size-5' }: P) => (
  <svg {...base} className={className}><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></svg>
)
export const Check = ({ className = 'size-4' }: P) => (
  <svg {...base} className={className}><path d="M5 12l5 5L20 7" /></svg>
)
export const Pin = ({ className = 'size-3.5' }: P) => (
  <svg {...base} className={className}><path d="M12 21s-7-6.2-7-11.5a7 7 0 0114 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
)
export const Sparkle = ({ className = 'size-4' }: P) => (
  <svg {...base} className={className}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6" /></svg>
)
