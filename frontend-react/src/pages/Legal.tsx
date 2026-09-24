import type { ReactNode } from 'react'
import { TopBar } from '../components/TopBar'
import { CONSENT_VERSION } from '../lib/auth'
import { useI18n } from '../lib/i18n'

// DRAFT legal text for the hackathon. Must be reviewed by a qualified lawyer, and the
// [bracketed] placeholders filled in, before collecting real personal data.
const CONTROLLER = '[Organisation legal name, address and tax ID]'
const CONTACT = '[privacy contact email]'

function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  const { t, lang } = useI18n()
  return (
    <>
      <TopBar back />
      <main className="mx-auto max-w-xl px-5 pt-8 pb-16 safe-bottom">
        <h1 className="text-[30px] font-bold tracking-[-0.02em]">{title}</h1>
        <p className="mt-1 text-[13px] text-ink-3">Last updated {CONSENT_VERSION} · Draft</p>
        {lang !== 'en' && <p className="mt-4 rounded-2xl bg-fill px-4 py-3 text-[14px] text-ink-2">{t('legalDraftNote')}</p>}
        <div className="legal mt-6 space-y-4 text-[15px] leading-relaxed text-ink-2 [&_h2]:mt-8 [&_h2]:text-[18px] [&_h2]:font-semibold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-ink">
          {children}
        </div>
      </main>
    </>
  )
}

export function Privacy() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        Plaça lets residents vote on local questions and see where their community stands. This policy explains what
        personal data we collect, why, and your rights under the EU General Data Protection Regulation (GDPR) and
        Spain’s Organic Law 3/2018 on Data Protection (LOPDGDD).
      </p>

      <h2>Who is responsible</h2>
      <p>The data controller is {CONTROLLER}. Contact us about your data at {CONTACT}.</p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Votes without an account:</strong> your yes/no answers, linked to a random ID stored in your browser. No name or email.</li>
        <li><strong>If you create an account:</strong> your name, email address, postcode, age range and gender.</li>
        <li><strong>Where you found us:</strong> if you arrive from a poster or QR code, which one, so we know which locations work.</li>
      </ul>
      <p>We turn your postcode into your district. We never ask for your address.</p>

      <h2>Why we use it, and our legal basis</h2>
      <ul>
        <li><strong>Showing results</strong> (overall and by district, age range and gender): to run the service you signed up for (Art. 6(1)(b) GDPR). These are only ever shown in aggregate, and any group with fewer than 5 votes is hidden.</li>
        <li><strong>Sending you a sign-in link:</strong> to run the service (Art. 6(1)(b)).</li>
        <li><strong>Sharing with third parties:</strong> only if you tick the box to opt in (consent, Art. 6(1)(a)). See below.</li>
      </ul>

      <h2>Sharing with third parties</h2>
      <p>
        <strong>We never sell your data, and never share your name or email.</strong>
      </p>
      <ul>
        <li><strong>If you haven’t opted in</strong>, your answers are only ever shared as totals across many people (for example, “52% of Gràcia said no”).</li>
        <li>
          <strong>If you opt in</strong>, we may share your individual answers with researchers, public bodies such as the
          Ajuntament, or community organisations. They are linked only to your postcode area, age range and gender, never
          to your name, email or account.
        </li>
      </ul>
      <p>You can withdraw this consent at any time in “Your data”. Withdrawing doesn’t affect sharing that already happened.</p>

      <h2>Sponsored questions</h2>
      <p>Businesses that sponsor a question get the same public, aggregate results as everyone else. They never receive personal data.</p>

      <h2>How long we keep it</h2>
      <p>
        We keep account details until you delete your account. When you delete it, your details are erased. Your past votes
        stay in the totals but are no longer linked to you.
      </p>

      <h2>Where it’s stored</h2>
      <p>Data is stored with our hosting and database providers [provider names and locations]. Where data leaves the EU, we rely on appropriate safeguards such as the European Commission’s Standard Contractual Clauses.</p>

      <h2>Your rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>access your data</li>
        <li>correct it</li>
        <li>erase it</li>
        <li>restrict or object to its processing</li>
        <li>take it with you (portability)</li>
        <li>withdraw consent at any time</li>
      </ul>
      <p>
        You can download or delete your data yourself in “Your data”, or email {CONTACT}. If you’re unhappy with how we
        handle your data, you can complain to the Agencia Española de Protección de Datos (aepd.es) or the Autoritat
        Catalana de Protecció de Dades (apdcat.gencat.cat).
      </p>

      <h2>Age</h2>
      <p>You must be at least 14 to create an account, in line with Spanish law.</p>
    </LegalPage>
  )
}

export function Terms() {
  return (
    <LegalPage title="Terms of use">
      <p>By using Plaça you agree to these terms. They are provided by {CONTROLLER}.</p>
      <h2>Voting</h2>
      <p>One vote per person per question. You can change your vote. Don’t use automated tools or multiple accounts to influence results.</p>
      <h2>Proposed questions</h2>
      <p>
        Proposed questions must be yes/no, neutral, about a local issue, and must not name private individuals. We may
        edit or remove questions that break these rules.
      </p>
      <h2>Results</h2>
      <p>
        Results reflect the people who chose to vote on Plaça. They are not a scientific poll or an official consultation,
        and shouldn’t be presented as one.
      </p>
      <h2>Sponsored questions</h2>
      <p>Sponsored questions are always labelled. Sponsors can’t see who voted or how.</p>
      <h2>Accounts</h2>
      <p>
        You can delete your account at any time. We may suspend accounts that abuse the service. Our handling of personal
        data is described in the Privacy Policy.
      </p>
      <h2>Liability</h2>
      <p>Plaça is provided as-is, free of charge, as a community project. Nothing in these terms limits rights you have under consumer law.</p>
      <h2>Law</h2>
      <p>These terms are governed by Spanish law.</p>
    </LegalPage>
  )
}
