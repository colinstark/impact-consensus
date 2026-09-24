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
  voteToSee: { en: 'Vote to see results', es: 'Vota para ver resultados', ca: 'Vota per veure’n els resultats' },
  votes: { en: 'votes', es: 'votos', ca: 'vots' },
  sayYes: { en: 'say yes', es: 'dicen sí', ca: 'diuen sí' },
  sayNo: { en: 'say no', es: 'dicen no', ca: 'diuen no' },
  youSaid: { en: 'You said', es: 'Dijiste', ca: 'Vas dir' },
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
    en: 'Share of the community saying yes.',
    es: 'Porcentaje de la comunidad que dice sí.',
    ca: 'Percentatge de la comunitat que diu sí.',
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
  tellMore: {
    en: 'I don’t know — tell me more',
    es: 'No lo sé — cuéntame más',
    ca: 'No ho sé — explica-m’ho',
  },
  readUpTitle: {
    en: 'Read up before you vote',
    es: 'Infórmate antes de votar',
    ca: 'Informa’t abans de votar',
  },
  readUpBody: {
    en: 'Coverage from the outlets we used to frame this question. Links open the outlet’s site.',
    es: 'Cobertura de los medios que usamos para plantear esta pregunta. Los enlaces abren la web del medio.',
    ca: 'Cobertura dels mitjans que hem fet servir per plantejar aquesta pregunta. Els enllaços obren el web del mitjà.',
  },
  backToVote: {
    en: 'Back to vote',
    es: 'Volver a votar',
    ca: 'Tornar a votar',
  },
  noSources: {
    en: 'No stories linked yet.',
    es: 'Aún no hay noticias enlazadas.',
    ca: 'Encara no hi ha notícies enllaçades.',
  },
  coverageIn: {
    en: 'Coverage in {o}',
    es: 'Cobertura en {o}',
    ca: 'Cobertura a {o}',
  },
  cityTitle: {
    en: 'Which city do you live in?',
    es: '¿En qué ciudad vives?',
    ca: 'En quina ciutat vius?',
  },
  cityBody: {
    en: 'We’ll show you the questions your community is voting on.',
    es: 'Te mostraremos las preguntas que vota tu comunidad.',
    ca: 'Et mostrarem les preguntes que vota la teva comunitat.',
  },
  cityLabel: {
    en: 'Your city',
    es: 'Tu ciudad',
    ca: 'La teva ciutat',
  },
  comingSoon: {
    en: 'coming soon',
    es: 'próximamente',
    ca: 'aviat',
  },
  continue: {
    en: 'Continue',
    es: 'Continuar',
    ca: 'Continuar',
  },
  changeCity: {
    en: 'Change city',
    es: 'Cambiar ciudad',
    ca: 'Canviar de ciutat',
  },
  byBarrio: {
    en: 'Opinions by barrio',
    es: 'Opiniones por barrio',
    ca: 'Opinions per barri',
  },
  byBarrioSub: {
    en: 'How each of {c}’s districts voted.',
    es: 'Cómo ha votado cada distrito de {c}.',
    ca: 'Com ha votat cada districte de {c}.',
  },
  postcodeTitle: {
    en: 'Where do you live?',
    es: '¿Dónde vives?',
    ca: 'On vius?',
  },
  postcodeBody: {
    en: 'Enter your postcode once to see opinions by barrio. We place your votes in your district — we never store your address.',
    es: 'Introduce tu código postal una vez para ver opiniones por barrio. Situamos tus votos en tu distrito; nunca guardamos tu dirección.',
    ca: 'Introdueix el teu codi postal un cop per veure opinions per barri. Situem els teus vots al teu districte; mai no guardem la teva adreça.',
  },
  postcode: {
    en: 'Postcode',
    es: 'Código postal',
    ca: 'Codi postal',
  },
  postcodeInvalid: {
    en: 'That isn’t a Barcelona postcode. Try one from 08001 to 08042.',
    es: 'Ese no es un código postal de Barcelona. Prueba uno entre 08001 y 08042.',
    ca: 'Aquest no és un codi postal de Barcelona. Prova’n un entre 08001 i 08042.',
  },
  showMap: {
    en: 'Show the map',
    es: 'Ver el mapa',
    ca: 'Veure el mapa',
  },
  yourDistrict: {
    en: 'Your district',
    es: 'Tu distrito',
    ca: 'El teu districte',
  },
  you: {
    en: 'You',
    es: 'Tú',
    ca: 'Tu',
  },
  changePostcode: {
    en: 'Change postcode',
    es: 'Cambiar código postal',
    ca: 'Canviar el codi postal',
  },
  moreNo: {
    en: 'More no',
    es: 'Más no',
    ca: 'Més no',
  },
  moreYes: {
    en: 'More yes',
    es: 'Más sí',
    ca: 'Més sí',
  },
  even: {
    en: 'Split',
    es: 'Empate',
    ca: 'Empat',
  },
  tapDistrict: {
    en: 'Tap a district for details.',
    es: 'Toca un distrito para ver detalles.',
    ca: 'Toca un districte per veure’n els detalls.',
  },
  allDistricts: {
    en: 'All districts',
    es: 'Todos los distritos',
    ca: 'Tots els districtes',
  },
  proposals: {
    en: 'Proposed questions',
    es: 'Preguntas propuestas',
    ca: 'Preguntes proposades',
  },
  proposalsSub: {
    en: 'Questions from the community. {n} upvotes within 48 hours puts a question on the main list.',
    es: 'Preguntas de la comunidad. Con {n} apoyos en 48 horas, una pregunta entra en la lista principal.',
    ca: 'Preguntes de la comunitat. Amb {n} suports en 48 hores, una pregunta entra a la llista principal.',
  },
  propose: {
    en: 'Propose a question',
    es: 'Proponer una pregunta',
    ca: 'Proposar una pregunta',
  },
  proposeCta: {
    en: 'Got a question for {c}?',
    es: '¿Tienes una pregunta para {c}?',
    ca: 'Tens una pregunta per a {c}?',
  },
  seeAll: {
    en: 'See all',
    es: 'Ver todas',
    ca: 'Veure-les totes',
  },
  upvoteWith: {
    en: 'Upvote with your answer',
    es: 'Apóyala con tu respuesta',
    ca: 'Dona-hi suport amb la teva resposta',
  },
  upvoted: {
    en: 'Upvoted · you said {a}',
    es: 'Apoyada · dijiste {a}',
    ca: 'Suport donat · vas dir {a}',
  },
  upvotesOf: {
    en: '{n} of {t} upvotes',
    es: '{n} de {t} apoyos',
    ca: '{n} de {t} suports',
  },
  hoursLeft: {
    en: '{h}h left',
    es: 'quedan {h} h',
    ca: 'queden {h} h',
  },
  minutesLeft: {
    en: '{m} min left',
    es: 'quedan {m} min',
    ca: 'queden {m} min',
  },
  accepted: {
    en: 'Added to the list',
    es: 'Añadida a la lista',
    ca: 'Afegida a la llista',
  },
  expired: {
    en: 'Didn’t make it in time',
    es: 'No llegó a tiempo',
    ca: 'No hi ha arribat a temps',
  },
  acceptedToast: {
    en: 'It reached 100 — now on the main list!',
    es: '¡Ha llegado a 100! Ya está en la lista principal.',
    ca: 'Ha arribat a 100! Ja és a la llista principal.',
  },
  openTopic: {
    en: 'Vote on it',
    es: 'Votar',
    ca: 'Votar',
  },
  newBody: {
    en: 'Ask a yes-or-no question about {c}. If {n} people upvote it within 48 hours, everyone gets to vote on it.',
    es: 'Haz una pregunta de sí o no sobre {c}. Si {n} personas la apoyan en 48 horas, todo el mundo podrá votarla.',
    ca: 'Fes una pregunta de sí o no sobre {c}. Si {n} persones hi donen suport en 48 hores, tothom la podrà votar.',
  },
  qLabel: {
    en: 'Your question',
    es: 'Tu pregunta',
    ca: 'La teva pregunta',
  },
  qPlaceholder: {
    en: 'Should…?',
    es: '¿Debería…?',
    ca: 'Hauria…?',
  },
  areaLabel: {
    en: 'Where does it apply?',
    es: '¿Dónde se aplica?',
    ca: 'On s’aplica?',
  },
  wholeCity: {
    en: 'The whole city',
    es: 'Toda la ciudad',
    ca: 'Tota la ciutat',
  },
  contextLabel: {
    en: 'Background (optional)',
    es: 'Contexto (opcional)',
    ca: 'Context (opcional)',
  },
  contextPlaceholder: {
    en: 'A sentence or two of neutral facts.',
    es: 'Una o dos frases con datos neutrales.',
    ca: 'Una o dues frases amb dades neutrals.',
  },
  yourAnswer: {
    en: 'Your answer',
    es: 'Tu respuesta',
    ca: 'La teva resposta',
  },
  answerNote: {
    en: 'Your answer counts as the first upvote.',
    es: 'Tu respuesta cuenta como el primer apoyo.',
    ca: 'La teva resposta compta com el primer suport.',
  },
  submit: {
    en: 'Submit question',
    es: 'Enviar pregunta',
    ca: 'Enviar la pregunta',
  },
  guidelines: {
    en: 'Keep it neutral and about one issue. Questions naming private individuals are removed.',
    es: 'Que sea neutral y sobre un solo tema. Se eliminan las preguntas que mencionan a particulares.',
    ca: 'Que sigui neutral i sobre un sol tema. S’eliminen les preguntes que esmenten particulars.',
  },
  proposalLive: {
    en: 'Your question is live for 48 hours',
    es: 'Tu pregunta está activa 48 horas',
    ca: 'La teva pregunta és activa 48 hores',
  },
  tooShort: {
    en: 'Write a question of at least 15 characters.',
    es: 'Escribe una pregunta de al menos 15 caracteres.',
    ca: 'Escriu una pregunta d’almenys 15 caràcters.',
  },
  fromCommunity: {
    en: 'From the community',
    es: 'De la comunidad',
    ca: 'De la comunitat',
  },
  sponsored: {
    en: 'Sponsored',
    es: 'Patrocinada',
    ca: 'Patrocinada',
  },
  sponsoredBy: {
    en: 'Sponsored by {s}',
    es: 'Patrocinada por {s}',
    ca: 'Patrocinada per {s}',
  },
  whySponsored: {
    en: 'Why am I seeing this?',
    es: '¿Por qué veo esto?',
    ca: 'Per què veig això?',
  },
  sponsorTitle: {
    en: 'About sponsored questions',
    es: 'Sobre las preguntas patrocinadas',
    ca: 'Sobre les preguntes patrocinades',
  },
  sponsorRule1: {
    en: 'Local businesses can pay to ask the community a question. It helps keep Plaça free and independent.',
    es: 'Los comercios locales pueden pagar para hacer una pregunta a la comunidad. Así Plaça sigue siendo gratuita e independiente.',
    ca: 'Els comerços locals poden pagar per fer una pregunta a la comunitat. Així Plaça continua sent gratuïta i independent.',
  },
  sponsorRule2: {
    en: 'Sponsored questions are always labelled, never shown first, and you never have to answer them to unlock more.',
    es: 'Las preguntas patrocinadas siempre están señaladas, nunca aparecen primero y nunca tienes que responderlas para desbloquear más.',
    ca: 'Les preguntes patrocinades sempre estan indicades, mai no apareixen primer i mai no les has de respondre per desbloquejar-ne més.',
  },
  sponsorRule3: {
    en: 'Sponsors can’t see who voted or how. They get the same public results as everyone else.',
    es: 'Los patrocinadores no pueden ver quién ha votado ni qué. Ven los mismos resultados públicos que todo el mundo.',
    ca: 'Els patrocinadors no poden veure qui ha votat ni què. Veuen els mateixos resultats públics que tothom.',
  },
  sponsorRule4: {
    en: 'We check every sponsored question is neutral before it goes live.',
    es: 'Revisamos que cada pregunta patrocinada sea neutral antes de publicarla.',
    ca: 'Revisem que cada pregunta patrocinada sigui neutral abans de publicar-la.',
  },
  visitSponsor: {
    en: 'Visit {s}',
    es: 'Visitar {s}',
    ca: 'Visitar {s}',
  },
  gotIt: {
    en: 'Got it',
    es: 'Entendido',
    ca: 'Entesos',
  },
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
