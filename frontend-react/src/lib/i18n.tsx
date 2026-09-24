import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Lang, Localized } from '../api/types'

const strings = {
  tagline: {
    en: 'What your community really thinks.',
    es: 'Lo que tu comunidad piensa de verdad.',
    ca: 'El que la teva comunitat pensa de debò.',
  },
  intro: {
    en: 'Headlines shout. The community votes. Have your say on the issues shaping Barcelona — then see where the city really stands.',
    es: 'Los titulares gritan. La comunidad vota. Opina sobre los temas que marcan Barcelona y descubre dónde está realmente la ciudad.',
    ca: 'Els titulars criden. La comunitat vota. Opina sobre els temes que marquen Barcelona i descobreix on és realment la ciutat.',
  },
  trending: { en: 'Trending now', es: 'Tendencias', ca: 'Tendències' },
  yes: { en: 'Yes', es: 'Sí', ca: 'Sí' },
  no: { en: 'No', es: 'No', ca: 'No' },
  skip: {
    en: 'Don’t mind — show results',
    es: 'Me da igual — ver resultados',
    ca: 'M’és igual — veure resultats',
  },
  voteToSee: { en: 'Vote to see results', es: 'Vota para ver resultados', ca: 'Vota per veure’n els resultats' },
  votes: { en: 'votes', es: 'votos', ca: 'vots' },
  dontMind: { en: 'don’t mind', es: 'les da igual', ca: 'els és igual' },
  sayYes: { en: 'say yes', es: 'dicen sí', ca: 'diuen sí' },
  sayNo: { en: 'say no', es: 'dicen no', ca: 'diuen no' },
  youSaid: { en: 'You said', es: 'Dijiste', ca: 'Vas dir' },
  youSkipped: { en: 'You’re just looking', es: 'Solo estás mirando', ca: 'Només estàs mirant' },
  haveAView: { en: 'Actually, I have a view', es: 'En realidad, tengo opinión', ca: 'De fet, tinc opinió' },
  changeVote: { en: 'Change vote', es: 'Cambiar voto', ca: 'Canviar el vot' },
  headlines: { en: 'Headlines suggest', es: 'Los titulares sugieren', ca: 'Els titulars suggereixen' },
  gapNote: {
    en: 'Media coverage implies {h}% support. The community here says {n}%.',
    es: 'La cobertura mediática sugiere un {h}% de apoyo. Aquí la comunidad dice {n}%.',
    ca: 'La cobertura mediàtica suggereix un {h}% de suport. Aquí la comunitat diu {n}%.',
  },
  unlockTitle: { en: '3 more topics waiting', es: '3 temas más esperando', ca: '3 temes més t’esperen' },
  unlockBody: {
    en: 'Answer the ones above to unlock them.',
    es: 'Responde los de arriba para desbloquearlos.',
    ca: 'Respon els de dalt per desbloquejar-los.',
  },
  unlocked: { en: 'New topics unlocked', es: 'Nuevos temas desbloqueados', ca: 'Nous temes desbloquejats' },
  allDone: {
    en: 'You’ve had your say on everything. New topics arrive each week.',
    es: 'Ya has opinado sobre todo. Cada semana llegan temas nuevos.',
    ca: 'Ja has opinat sobre tot. Cada setmana arriben temes nous.',
  },
  keepGoing: { en: 'Keep going', es: 'Sigue votando', ca: 'Continua votant' },
  moreTopics: { en: 'More topics', es: 'Más temas', ca: 'Més temes' },
  seeTrend: { en: 'How opinion has shifted', es: 'Cómo ha cambiado la opinión', ca: 'Com ha canviat l’opinió' },
  trendTitle: { en: 'Opinion over time', es: 'Opinión en el tiempo', ca: 'Opinió en el temps' },
  trendSub: {
    en: 'Share of the community saying yes (excluding “don’t mind”).',
    es: 'Porcentaje de la comunidad que dice sí (sin contar “me da igual”).',
    ca: 'Percentatge de la comunitat que diu sí (sense comptar “m’és igual”).',
  },
  range1m: { en: '1M', es: '1M', ca: '1M' },
  range3m: { en: '3M', es: '3M', ca: '3M' },
  rangeAll: { en: 'All', es: 'Todo', ca: 'Tot' },
  showTable: { en: 'Show as table', es: 'Ver como tabla', ca: 'Veure com a taula' },
  hideTable: { en: 'Hide table', es: 'Ocultar tabla', ca: 'Amagar taula' },
  date: { en: 'Date', es: 'Fecha', ca: 'Data' },
  signInToSee: {
    en: 'Sign in with your email to see how opinion has changed over time.',
    es: 'Entra con tu email para ver cómo ha cambiado la opinión.',
    ca: 'Entra amb el teu correu per veure com ha canviat l’opinió.',
  },
  signIn: { en: 'Sign in', es: 'Entrar', ca: 'Entrar' },
  signOut: { en: 'Sign out', es: 'Salir', ca: 'Sortir' },
  email: { en: 'Email', es: 'Email', ca: 'Correu' },
  sendLink: { en: 'Send me a link', es: 'Envíame un enlace', ca: 'Envia’m un enllaç' },
  checkInbox: { en: 'Check your inbox', es: 'Revisa tu correo', ca: 'Revisa el teu correu' },
  linkSent: {
    en: 'We sent a sign-in link to {e}. No passwords, ever.',
    es: 'Hemos enviado un enlace a {e}. Nunca pedimos contraseñas.',
    ca: 'Hem enviat un enllaç a {e}. Mai no demanem contrasenyes.',
  },
  demoContinue: { en: 'Continue (demo)', es: 'Continuar (demo)', ca: 'Continuar (demo)' },
  signInWhy: {
    en: 'Voting is always anonymous and open. Signing in only unlocks trends — we never show who voted what.',
    es: 'Votar siempre es anónimo y abierto. Entrar solo desbloquea las tendencias: nunca mostramos quién votó qué.',
    ca: 'Votar sempre és anònim i obert. Entrar només desbloqueja les tendències: mai no mostrem qui ha votat què.',
  },
  share: { en: 'Share', es: 'Compartir', ca: 'Compartir' },
  copied: { en: 'Link copied', es: 'Enlace copiado', ca: 'Enllaç copiat' },
  about: { en: 'About', es: 'Acerca de', ca: 'Sobre' },
  notFound: { en: 'We couldn’t find that topic.', es: 'No encontramos ese tema.', ca: 'No trobem aquest tema.' },
  backHome: { en: 'See all topics', es: 'Ver todos los temas', ca: 'Veure tots els temes' },
  error: { en: 'Something went wrong. Try again.', es: 'Algo salió mal. Inténtalo de nuevo.', ca: 'Alguna cosa ha fallat. Torna-ho a provar.' },
} satisfies Record<string, Localized>

export type StringKey = keyof typeof strings

const LANGS: Lang[] = ['ca', 'es', 'en']
export const langLabels: Record<Lang, string> = { ca: 'Català', es: 'Español', en: 'English' }

function initialLang(): Lang {
  const saved = localStorage.getItem('placa.lang') as Lang | null
  if (saved && LANGS.includes(saved)) return saved
  const nav = navigator.language.slice(0, 2) as Lang
  return LANGS.includes(nav) ? nav : 'en'
}

interface I18n {
  lang: Lang
  setLang: (l: Lang) => void
  t: (k: StringKey, vars?: Record<string, string | number>) => string
  l: (x: Localized) => string
  n: (x: number) => string
}

const Ctx = createContext<I18n | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const value: I18n = {
    lang,
    setLang: (l) => {
      localStorage.setItem('placa.lang', l)
      setLangState(l)
    },
    t: (k, vars) =>
      strings[k][lang].replace(/\{(\w+)\}/g, (_, v) => String(vars?.[v] ?? '')),
    l: (x) => x[lang] ?? x.en,
    n: (x) => x.toLocaleString(lang === 'en' ? 'en-GB' : `${lang}-ES`),
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useI18n() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useI18n outside provider')
  return v
}

export { LANGS }
