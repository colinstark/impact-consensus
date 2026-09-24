import type { ReactNode } from 'react'
import type { Analysis, AnalysisDecision, Tier, Topic } from '../api/types'
import { useI18n } from '../lib/i18n'
import { ChevronRight } from './Icons'
import { Sheet } from './Sheet'

// Everything the article analyser wrote about the source article. The content itself is
// English (the analyser writes it); the section labels follow the chosen language.

type T = ReturnType<typeof useI18n>['t']
const has = <X,>(xs: X[] | null | undefined): xs is X[] => !!xs && xs.length > 0
const text = (...parts: (string | null | undefined)[]) => parts.filter(Boolean).join(' · ')

export function AnalysisSheet({ topic, open, onClose }: { topic: Topic; open: boolean; onClose: () => void }) {
  const { t, l } = useI18n()
  const a = topic.analysis

  return (
    <Sheet open={open} onClose={onClose} label={t('fullAnalysis')}>
      <h2 className="text-[22px] font-bold tracking-tight">{t('fullAnalysis')}</h2>
      <p className="mt-1 text-[15px] leading-snug text-ink-2">{l(topic.question)}</p>
      <p className="mt-3 text-[13px] leading-snug text-ink-3">{t('fullAnalysisNote')}</p>

      {a ? <Sections a={a} t={t} /> : <p className="mt-4 rounded-2xl bg-fill px-4 py-3 text-[15px] text-ink-2">{t('noAnalysis')}</p>}

      <button
        onClick={onClose}
        className="mt-5 mb-2 h-13 w-full rounded-2xl bg-ink py-3.5 text-[17px] font-semibold text-bg active:scale-[0.98]"
      >
        {t('backToVote')}
      </button>
    </Sheet>
  )
}

function Sections({ a, t }: { a: Analysis; t: T }) {
  const spine = a.factual_spine
  const bias = a.bias_analysis
  const decisions = (a.decisions ?? []).filter(Boolean)
  const p = a.provenance

  return (
    <div className="mt-4 space-y-3">
      {(spine?.summary || spine?.stated_mechanism) && (
        <Section title={t('anSummary')} open>
          {spine?.summary && <P>{spine.summary}</P>}
          {spine?.stated_mechanism && <Field label={t('anHow')}>{spine.stated_mechanism}</Field>}
        </Section>
      )}

      {(has(spine?.actors) || has(spine?.timeline) || has(spine?.quantities)) && (
        <Section title={t('anFacts')}>
          {has(spine?.actors) && (
            <Group label={t('anWho')}>
              {spine.actors.map((x, i) => (
                <Item key={i}>
                  <b className="font-semibold">{x.name}</b>
                  {x.role && <> — {x.role}</>}
                  {x.authority && <Sub>{x.authority}</Sub>}
                </Item>
              ))}
            </Group>
          )}
          {has(spine?.timeline) && (
            <Group label={t('anWhen')}>
              {spine.timeline.map((x, i) => (
                <Item key={i} tier={x.tier}>
                  {x.date && <b className="font-semibold">{x.date}: </b>}
                  {x.event}
                </Item>
              ))}
            </Group>
          )}
          {has(spine?.quantities) && (
            <Group label={t('anFigures')}>
              {spine.quantities.map((x, i) => (
                <Item key={i} tier={x.tier}>
                  <b className="font-semibold">{text(x.value, x.unit)}</b>
                  <Sub>{text(x.denominator && `${t('anOutOf')} ${x.denominator}`, x.period, x.source)}</Sub>
                </Item>
              ))}
            </Group>
          )}
        </Section>
      )}

      {decisions.map((d, i) => (
        <Decision key={d.id ?? i} d={d} t={t} />
      ))}

      {bias && (
        <Section title={t('anCoverage')}>
          {(bias.overall_direction || bias.confidence) && (
            <Field label={t('anLeaning')}>
              {bias.overall_direction === 'none_detected' ? t('anNoneDetected') : bias.overall_direction}
              {bias.confidence && <Sub>{t('anConfidence')}: {bias.confidence}</Sub>}
            </Field>
          )}
          {has(bias.categories) && (
            <Group label={t('anHowCovered')}>
              {bias.categories.map((x, i) => (
                <Item key={i}>
                  <b className="font-semibold">{x.category}</b>
                  {x.strength && <Pill>{x.strength}</Pill>}
                  {x.observation && <> — {x.observation}</>}
                  {x.evidence && <Sub>“{x.evidence}”</Sub>}
                  {x.favours && x.favours !== 'none_detected' && <Sub>{t('anFavours')}: {x.favours}</Sub>}
                </Item>
              ))}
            </Group>
          )}
          {has(bias.voices_present) && <Group label={t('anVoicesHeard')}>{bias.voices_present.map((v, i) => <Item key={i}>{v}</Item>)}</Group>}
          {has(bias.voices_absent) && <Group label={t('anVoicesMissing')}>{bias.voices_absent.map((v, i) => <Item key={i}>{v}</Item>)}</Group>}
        </Section>
      )}

      {has(a.missing_information) && (
        <Section title={t('anMissing')}>
          <Group>
            {a.missing_information.map((x, i) => (
              <Item key={i}>
                <b className="font-semibold">{x.item}</b>
                {x.why_it_matters && <Sub>{x.why_it_matters}</Sub>}
              </Item>
            ))}
          </Group>
        </Section>
      )}

      {has(a.integrity_flags) && (
        <Section title={t('anCaveats')}>
          <Group>
            {a.integrity_flags.map((x, i) => (
              <Item key={i}>
                <b className="font-semibold">{x.flag?.replace(/_/g, ' ')}</b>
                {x.detail && <Sub>{x.detail}</Sub>}
              </Item>
            ))}
          </Group>
        </Section>
      )}

      {p && (
        <Section title={t('anSource')}>
          <Group>
            {p.outlet && <Item><b className="font-semibold">{p.outlet}</b>{p.author && <> — {p.author}</>}</Item>}
            {p.published && <Item>{p.published}</Item>}
            {(p.content_type || p.language || p.geographic_scope) && <Item>{text(p.content_type, p.language, p.geographic_scope)}</Item>}
            {a.analysis_viability && <Item>{t('anDepth')}: {a.analysis_viability}</Item>}
          </Group>
        </Section>
      )}
    </div>
  )
}

function Decision({ d, t }: { d: AnalysisDecision; t: T }) {
  const ledger = d.ledger
  const eco = d.economic_byproducts
  const fiscal = Object.entries(eco?.direct_fiscal ?? {}).filter(([k, v]) => k !== 'tier' && v)
  const time = eco?.time_profile
  const knock = [
    ...(eco?.second_order ?? []).map((x) => ({ head: x.byproduct, sub: x.pathway, tier: x.tier })),
    ...(eco?.behavioural_response ?? []).map((x) => ({ head: x.response, sub: text(x.actor, x.assumption), tier: null })),
    ...(eco?.market_effects ?? []).map((x) => ({ head: x.effect, sub: x.market, tier: x.tier })),
    ...(eco?.externalities ?? []).map((x) => ({ head: x.effect, sub: text(x.party, x.sign), tier: null })),
  ].filter((x) => x.head)

  return (
    <>
      <Section title={t('anDecision')}>
        {d.description && <P>{d.description}</P>}
        {(d.status || d.decision_maker) && (
          <Field label={t('anStatus')}>{text(d.status?.replace(/_/g, ' '), d.decision_maker)}</Field>
        )}
        {has(ledger?.advantages) && (
          <Group label={t('anUpsides')}>
            {ledger.advantages.map((x, i) => (
              <Item key={i} tier={x.tier}>
                {x.effect}
                <Sub>{text(x.accrues_to && `${t('anFor')} ${x.accrues_to}`, x.magnitude, x.horizon)}</Sub>
              </Item>
            ))}
          </Group>
        )}
        {has(ledger?.disadvantages) && (
          <Group label={t('anDownsides')}>
            {ledger.disadvantages.map((x, i) => (
              <Item key={i} tier={x.tier}>
                {x.effect}
                <Sub>{text(x.borne_by && `${t('anFor')} ${x.borne_by}`, x.magnitude, x.horizon)}</Sub>
              </Item>
            ))}
          </Group>
        )}
        {has(ledger?.contested) && (
          <Group label={t('anContested')}>
            {ledger.contested.map((x, i) => (
              <Item key={i}>
                <b className="font-semibold">{x.question}</b>
                {x.position_a && <Sub>A: {x.position_a}</Sub>}
                {x.position_b && <Sub>B: {x.position_b}</Sub>}
              </Item>
            ))}
          </Group>
        )}
        {has(ledger?.conditional) && (
          <Group label={t('anDepends')}>
            {ledger.conditional.map((x, i) => (
              <Item key={i}>
                {x.effect}
                {x.condition && <Sub>{t('anIf')} {x.condition}</Sub>}
              </Item>
            ))}
          </Group>
        )}
        {ledger?.symmetry_note && <Field label={t('anBalance')}>{ledger.symmetry_note}</Field>}
      </Section>

      {eco && (
        <Section title={t('anMoney')}>
          {eco.incidence && (eco.incidence.statutory_payer || eco.incidence.economic_bearer) && (
            <Field label={t('anWhoPays')}>
              {text(eco.incidence.statutory_payer, eco.incidence.economic_bearer && `${t('anBorneBy')} ${eco.incidence.economic_bearer}`)}
              {eco.incidence.shift_mechanism && <Sub>{eco.incidence.shift_mechanism}</Sub>}
            </Field>
          )}
          {fiscal.length > 0 && (
            <Group label={t('anCosts')}>
              {fiscal.map(([k, v]) => (
                <Item key={k}>
                  <b className="font-semibold">{k.replace(/_/g, ' ')}:</b> {v}
                </Item>
              ))}
            </Group>
          )}
          {has(eco.distribution) && (
            <Group label={t('anWhoGains')}>
              {eco.distribution.map((x, i) => (
                <Item key={i}>
                  <b className="font-semibold">{x.group}</b>
                  {x.direction && <Pill>{x.direction}</Pill>}
                  {x.net_effect && <> — {x.net_effect}</>}
                </Item>
              ))}
            </Group>
          )}
          {time && (time.immediate || time.medium_1_3y || time.long_5y_plus) && (
            <Group label={t('anTiming')}>
              {time.immediate && <Item><b className="font-semibold">{t('anNow')}:</b> {time.immediate}</Item>}
              {time.medium_1_3y && <Item><b className="font-semibold">{t('anMedium')}:</b> {time.medium_1_3y}</Item>}
              {time.long_5y_plus && <Item><b className="font-semibold">{t('anLong')}:</b> {time.long_5y_plus}</Item>}
              {time.mismatch_note && <Item>{time.mismatch_note}</Item>}
            </Group>
          )}
          {knock.length > 0 && (
            <Group label={t('anKnockOn')}>
              {knock.map((x, i) => (
                <Item key={i} tier={x.tier}>
                  {x.head}
                  {x.sub && <Sub>{x.sub}</Sub>}
                </Item>
              ))}
            </Group>
          )}
          {eco.opportunity_cost?.alternative_use && (
            <Field label={t('anAlternative')}>
              {text(eco.opportunity_cost.resource, eco.opportunity_cost.alternative_use)}
            </Field>
          )}
          {eco.uncertainty && (eco.uncertainty.most_load_bearing || has(eco.uncertainty.key_assumptions) || has(eco.uncertainty.data_gaps)) && (
            <Group label={t('anUnknowns')}>
              {eco.uncertainty.most_load_bearing && <Item><b className="font-semibold">{eco.uncertainty.most_load_bearing}</b></Item>}
              {(eco.uncertainty.key_assumptions ?? []).map((x, i) => <Item key={`a${i}`}>{x}</Item>)}
              {(eco.uncertainty.data_gaps ?? []).map((x, i) => <Item key={`g${i}`}>{x}</Item>)}
            </Group>
          )}
        </Section>
      )}
    </>
  )
}

function Section({ title, open, children }: { title: string; open?: boolean; children: ReactNode }) {
  return (
    <details open={open} className="group overflow-hidden rounded-[18px] bg-fill/60">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3.5 text-[17px] font-semibold [&::-webkit-details-marker]:hidden">
        <span className="flex-1">{title}</span>
        <ChevronRight className="size-4 text-ink-3 transition group-open:rotate-90" />
      </summary>
      <div className="space-y-3 px-4 pb-4 text-[15px] leading-relaxed">{children}</div>
    </details>
  )
}

function Group({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div>
      {label && <h4 className="mb-1 text-[13px] font-semibold uppercase tracking-wide text-ink-3">{label}</h4>}
      <ul className="space-y-2">{children}</ul>
    </div>
  )
}

function Item({ tier, children }: { tier?: Tier; children: ReactNode }) {
  return (
    <li className="text-ink">
      {children}
      {tier && <TierBadge tier={tier} />}
    </li>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <h4 className="mb-0.5 text-[13px] font-semibold uppercase tracking-wide text-ink-3">{label}</h4>
      <div className="text-ink">{children}</div>
    </div>
  )
}

const P = ({ children }: { children: ReactNode }) => <p className="text-ink">{children}</p>
const Sub = ({ children }: { children: ReactNode }) => <span className="block text-[13px] leading-snug text-ink-3">{children}</span>
const Pill = ({ children }: { children: ReactNode }) => (
  <span className="ml-1.5 rounded-full bg-fill px-2 py-px align-middle text-[11px] font-semibold text-ink-2">{children}</span>
)

// "[ATTRIBUTED: Ajuntament]" → a small "attributed: Ajuntament" tag showing where a point comes from.
function TierBadge({ tier }: { tier: string }) {
  const label = tier.replace(/^\[|\]$/g, '').replace(/^[A-Z]+/, (w) => w.toLowerCase())
  return <span className="ml-1.5 inline-block rounded-full bg-fill px-2 py-px align-middle text-[11px] font-medium text-ink-3">{label}</span>
}
