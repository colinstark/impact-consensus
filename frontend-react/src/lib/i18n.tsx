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
  insights: {
    en: 'Insights',
    es: 'Análisis',
    ca: 'Anàlisi',
  },
  insightsRow: {
    en: 'Insights: barrio, age, gender & time',
    es: 'Análisis: barrio, edad, género y tiempo',
    ca: 'Anàlisi: barri, edat, gènere i temps',
  },
  viewBy: {
    en: 'View results by',
    es: 'Ver resultados por',
    ca: 'Veure resultats per',
  },
  tabDistrict: {
    en: 'Barrio',
    es: 'Barrio',
    ca: 'Barri',
  },
  tabAge: {
    en: 'Age',
    es: 'Edad',
    ca: 'Edat',
  },
  tabGender: {
    en: 'Gender',
    es: 'Género',
    ca: 'Gènere',
  },
  allTime: {
    en: 'All time',
    es: 'Todo el periodo',
    ca: 'Tot el període',
  },
  asOf: {
    en: 'As of {d}',
    es: 'A fecha de {d}',
    ca: 'A data de {d}',
  },
  play: {
    en: 'Play',
    es: 'Reproducir',
    ca: 'Reproduir',
  },
  pause: {
    en: 'Pause',
    es: 'Pausa',
    ca: 'Pausa',
  },
  questionAsked: {
    en: 'Question asked',
    es: 'Pregunta publicada',
    ca: 'Pregunta publicada',
  },
  today: {
    en: 'Today',
    es: 'Hoy',
    ca: 'Avui',
  },
  overall: {
    en: 'Overall',
    es: 'En total',
    ca: 'En total',
  },
  showTrend: {
    en: 'Show opinion over time',
    es: 'Ver la opinión en el tiempo',
    ca: 'Veure l’opinió en el temps',
  },
  hideTrend: {
    en: 'Hide opinion over time',
    es: 'Ocultar la opinión en el tiempo',
    ca: 'Amagar l’opinió en el temps',
  },
  hiddenSmall: {
    en: 'Fewer than 5 votes — hidden for privacy',
    es: 'Menos de 5 votos: oculto por privacidad',
    ca: 'Menys de 5 vots: amagat per privacitat',
  },
  noDemographics: {
    en: 'No age or gender data for this question yet.',
    es: 'Aún no hay datos de edad o género para esta pregunta.',
    ca: 'Encara no hi ha dades d’edat o gènere per a aquesta pregunta.',
  },
  noVotesYet: {
    en: 'No votes yet at this point.',
    es: 'Aún no hay votos en este momento.',
    ca: 'Encara no hi ha vots en aquest moment.',
  },
  aggregateNote: {
    en: 'Only ever shown in aggregate. Groups with fewer than 5 votes are hidden.',
    es: 'Siempre se muestra en conjunto. Se ocultan los grupos con menos de 5 votos.',
    ca: 'Sempre es mostra en conjunt. S’amaguen els grups amb menys de 5 vots.',
  },
  ageU18: {
    en: 'Under 18',
    es: 'Menos de 18',
    ca: 'Menys de 18',
  },
  preferNot: {
    en: 'Prefer not to say',
    es: 'Prefiero no decirlo',
    ca: 'Prefereixo no dir-ho',
  },
  female: {
    en: 'Female',
    es: 'Mujer',
    ca: 'Dona',
  },
  male: {
    en: 'Male',
    es: 'Hombre',
    ca: 'Home',
  },
  nonBinary: {
    en: 'Non-binary / prefer not to say',
    es: 'No binario / prefiero no decirlo',
    ca: 'No binari / prefereixo no dir-ho',
  },
  signUpTitle: {
    en: 'Unlock insights',
    es: 'Desbloquea el análisis',
    ca: 'Desbloqueja l’anàlisi',
  },
  signUpBody: {
    en: 'See how opinion splits by barrio, age and gender, and how it’s changed over time. Create a free account — your votes stay anonymous.',
    es: 'Mira cómo se reparte la opinión por barrio, edad y género, y cómo ha cambiado con el tiempo. Crea una cuenta gratuita: tus votos siguen siendo anónimos.',
    ca: 'Mira com es reparteix l’opinió per barri, edat i gènere, i com ha canviat amb el temps. Crea un compte gratuït: els teus vots continuen sent anònims.',
  },
  name: {
    en: 'Name',
    es: 'Nombre',
    ca: 'Nom',
  },
  ageLabel: {
    en: 'Age range',
    es: 'Franja de edad',
    ca: 'Franja d’edat',
  },
  genderLabel: {
    en: 'Gender',
    es: 'Género',
    ca: 'Gènere',
  },
  choose: {
    en: 'Choose…',
    es: 'Elige…',
    ca: 'Tria…',
  },
  agreeTerms: {
    en: 'I agree to the {terms} and the {privacy}.',
    es: 'Acepto las {terms} y la {privacy}.',
    ca: 'Accepto les {terms} i la {privacy}.',
  },
  termsLink: {
    en: 'Terms of use',
    es: 'Condiciones de uso',
    ca: 'Condicions d’ús',
  },
  privacyLink: {
    en: 'Privacy Policy',
    es: 'Política de privacidad',
    ca: 'Política de privacitat',
  },
  shareLabel: {
    en: 'Share my anonymised answers with third parties',
    es: 'Compartir mis respuestas anonimizadas con terceros',
    ca: 'Compartir les meves respostes anonimitzades amb tercers',
  },
  shareHelp: {
    en: 'Optional. Researchers or the city council could see your answers linked only to your postcode area, age range and gender — never your name or email. Leave it unticked and your answers are only used in overall totals.',
    es: 'Opcional. Investigadores o el Ayuntamiento podrían ver tus respuestas vinculadas solo a tu zona postal, franja de edad y género, nunca a tu nombre ni email. Si no lo marcas, tus respuestas solo se usan en los totales.',
    ca: 'Opcional. Investigadors o l’Ajuntament podrien veure les teves respostes vinculades només a la teva zona postal, franja d’edat i gènere, mai al teu nom ni correu. Si no ho marques, les teves respostes només s’usen en els totals.',
  },
  createAccount: {
    en: 'Create account',
    es: 'Crear cuenta',
    ca: 'Crear compte',
  },
  haveAccount: {
    en: 'Already have an account? Sign in',
    es: '¿Ya tienes cuenta? Entra',
    ca: 'Ja tens compte? Entra',
  },
  newAccount: {
    en: 'New here? Create an account',
    es: '¿Eres nuevo? Crea una cuenta',
    ca: 'Ets nou? Crea un compte',
  },
  fillAll: {
    en: 'Please fill in every field.',
    es: 'Rellena todos los campos.',
    ca: 'Omple tots els camps.',
  },
  mustAgree: {
    en: 'You need to agree to the terms to continue.',
    es: 'Debes aceptar las condiciones para continuar.',
    ca: 'Has d’acceptar les condicions per continuar.',
  },
  completeProfile: {
    en: 'Finish setting up your account',
    es: 'Completa tu cuenta',
    ca: 'Completa el teu compte',
  },
  save: {
    en: 'Save',
    es: 'Guardar',
    ca: 'Desar',
  },
  saved: {
    en: 'Saved',
    es: 'Guardado',
    ca: 'Desat',
  },
  yourData: {
    en: 'Your data',
    es: 'Tus datos',
    ca: 'Les teves dades',
  },
  shareToggle: {
    en: 'Share anonymised answers with third parties',
    es: 'Compartir respuestas anonimizadas con terceros',
    ca: 'Compartir respostes anonimitzades amb tercers',
  },
  downloadData: {
    en: 'Download my data',
    es: 'Descargar mis datos',
    ca: 'Baixar les meves dades',
  },
  deleteAccount: {
    en: 'Delete my account and data',
    es: 'Eliminar mi cuenta y mis datos',
    ca: 'Eliminar el meu compte i les meves dades',
  },
  deleteConfirm: {
    en: 'Delete your account? Your details are erased. Your past votes stay in the totals but are no longer linked to you.',
    es: '¿Eliminar tu cuenta? Se borran tus datos. Tus votos pasados siguen en los totales, pero ya no están vinculados a ti.',
    ca: 'Eliminar el teu compte? S’esborren les teves dades. Els teus vots anteriors continuen als totals, però ja no estan vinculats a tu.',
  },
  deleted: {
    en: 'Account deleted',
    es: 'Cuenta eliminada',
    ca: 'Compte eliminat',
  },
  legalDraftNote: {
    en: 'This policy is in English for now. Catalan and Spanish versions are coming.',
    es: 'Por ahora esta política está en inglés. Pronto estará en catalán y castellano.',
    ca: 'De moment aquesta política és en anglès. Aviat estarà en català i castellà.',
  },
  fullAnalysis: { en: 'Full analysis', es: 'Análisis completo', ca: 'Anàlisi completa' },
  fullAnalysisNote: { en: 'Written by AI from the source article, before anyone voted. Tags show where each point comes from: reported by the article, attributed to someone, or inferred.', es: 'Escrito por IA a partir del artículo original, antes de cualquier voto. Las etiquetas indican de dónde sale cada punto: lo dice el artículo, lo atribuye a alguien o es una inferencia.', ca: 'Escrit per IA a partir de l’article original, abans de cap vot. Les etiquetes indiquen d’on surt cada punt: ho diu l’article, ho atribueix a algú o és una inferència.' },
  noAnalysis: { en: 'No analysis for this topic yet.', es: 'Todavía no hay análisis de este tema.', ca: 'Encara no hi ha anàlisi d’aquest tema.' },
  anSummary: { en: 'What happened', es: 'Qué ha pasado', ca: 'Què ha passat' },
  anHow: { en: 'How it is meant to work', es: 'Cómo se supone que funciona', ca: 'Com se suposa que funciona' },
  anFacts: { en: 'Key facts', es: 'Datos clave', ca: 'Dades clau' },
  anWho: { en: 'Who is involved', es: 'Quién participa', ca: 'Qui hi participa' },
  anWhen: { en: 'Timeline', es: 'Cronología', ca: 'Cronologia' },
  anFigures: { en: 'Figures', es: 'Cifras', ca: 'Xifres' },
  anOutOf: { en: 'out of', es: 'de', ca: 'de' },
  anDecision: { en: 'The decision', es: 'La decisión', ca: 'La decisió' },
  anStatus: { en: 'Status', es: 'Estado', ca: 'Estat' },
  anUpsides: { en: 'Possible upsides', es: 'Posibles ventajas', ca: 'Possibles avantatges' },
  anDownsides: { en: 'Possible downsides', es: 'Posibles inconvenientes', ca: 'Possibles inconvenients' },
  anFor: { en: 'for', es: 'para', ca: 'per a' },
  anContested: { en: 'Where people disagree', es: 'Dónde hay desacuerdo', ca: 'On hi ha desacord' },
  anDepends: { en: 'Depends on', es: 'Depende de', ca: 'Depèn de' },
  anIf: { en: 'If', es: 'Si', ca: 'Si' },
  anBalance: { en: 'Balance note', es: 'Nota de equilibrio', ca: 'Nota d’equilibri' },
  anMoney: { en: 'Money and wider effects', es: 'Dinero y efectos más amplios', ca: 'Diners i efectes més amplis' },
  anWhoPays: { en: 'Who pays', es: 'Quién paga', ca: 'Qui paga' },
  anBorneBy: { en: 'in practice', es: 'en la práctica', ca: 'a la pràctica' },
  anCosts: { en: 'Costs and revenue', es: 'Costes e ingresos', ca: 'Costos i ingressos' },
  anWhoGains: { en: 'Who gains, who loses', es: 'Quién gana, quién pierde', ca: 'Qui hi guanya, qui hi perd' },
  anTiming: { en: 'Over time', es: 'Con el tiempo', ca: 'Amb el temps' },
  anNow: { en: 'Now', es: 'Ahora', ca: 'Ara' },
  anMedium: { en: '1–3 years', es: '1–3 años', ca: '1–3 anys' },
  anLong: { en: '5+ years', es: '5+ años', ca: '5+ anys' },
  anKnockOn: { en: 'Knock-on effects', es: 'Efectos indirectos', ca: 'Efectes indirectes' },
  anAlternative: { en: 'What else the money could do', es: 'Qué más se podría hacer con el dinero', ca: 'Què més es podria fer amb els diners' },
  anUnknowns: { en: 'Biggest unknowns', es: 'Mayores incógnitas', ca: 'Incògnites principals' },
  anCoverage: { en: 'How the article covers it', es: 'Cómo lo cubre el artículo', ca: 'Com ho cobreix l’article' },
  anLeaning: { en: 'Overall leaning', es: 'Tendencia general', ca: 'Tendència general' },
  anNoneDetected: { en: 'None detected', es: 'No se detecta', ca: 'No se’n detecta' },
  anConfidence: { en: 'Confidence', es: 'Confianza', ca: 'Confiança' },
  anHowCovered: { en: 'What we noticed', es: 'Lo que hemos observado', ca: 'El que hem observat' },
  anFavours: { en: 'Leans towards', es: 'Se inclina hacia', ca: 'S’inclina cap a' },
  anVoicesHeard: { en: 'Voices heard', es: 'Voces presentes', ca: 'Veus presents' },
  anVoicesMissing: { en: 'Voices missing', es: 'Voces ausentes', ca: 'Veus absents' },
  anMissing: { en: 'What the article doesn’t say', es: 'Lo que el artículo no dice', ca: 'El que l’article no diu' },
  anCaveats: { en: 'Caveats', es: 'Advertencias', ca: 'Advertiments' },
  anSource: { en: 'About the source', es: 'Sobre la fuente', ca: 'Sobre la font' },
  anDepth: { en: 'Analysis depth', es: 'Profundidad del análisis', ca: 'Profunditat de l’anàlisi' },
  sendToFriend: { en: 'Send to a friend', es: 'Enviar a un amigo', ca: 'Enviar a un amic' },
  sendNote: { en: 'Add a note (optional)', es: 'Añade una nota (opcional)', ca: 'Afegeix una nota (opcional)' },
  includeMyVote: { en: 'Show them how I voted', es: 'Mostrar cómo he votado', ca: 'Mostrar com he votat' },
  send: { en: 'Send', es: 'Enviar', ca: 'Enviar' },
  sentTo: { en: 'Sent to {n}', es: 'Enviado a {n}', ca: 'Enviat a {n}' },
  noFriendsYet: { en: 'Add friends to send them topics.', es: 'Añade amigos para enviarles temas.', ca: 'Afegeix amics per enviar-los temes.' },
  friends: { en: 'Friends', es: 'Amigos', ca: 'Amics' },
  inbox: { en: 'Sent to you', es: 'Te han enviado', ca: 'T’han enviat' },
  inboxEmpty: { en: 'Nothing yet. When a friend sends you a topic, it shows up here.', es: 'Nada todavía. Cuando un amigo te envíe un tema, aparecerá aquí.', ca: 'Res encara. Quan un amic t’enviï un tema, apareixerà aquí.' },
  pickNickname: { en: 'Pick a nickname so friends can find you', es: 'Elige un apodo para que tus amigos te encuentren', ca: 'Tria un sobrenom perquè els amics et trobin' },
  nicknameHint: { en: '2–24 letters, numbers, dots, dashes or underscores.', es: '2–24 letras, números, puntos, guiones o guiones bajos.', ca: '2–24 lletres, números, punts, guions o guions baixos.' },
  yourNickname: { en: 'Your nickname', es: 'Tu apodo', ca: 'El teu sobrenom' },
  nicknameTaken: { en: 'That nickname is taken.', es: 'Ese apodo ya existe.', ca: 'Aquest sobrenom ja existeix.' },
  friendNickname: { en: 'Friend’s nickname', es: 'Apodo de tu amigo', ca: 'Sobrenom del teu amic' },
  add: { en: 'Add', es: 'Añadir', ca: 'Afegir' },
  noSuchNickname: { en: 'Nobody has that nickname.', es: 'Nadie tiene ese apodo.', ca: 'Ningú no té aquest sobrenom.' },
  waitingForThem: { en: 'Waiting for them to add you back', es: 'Esperando a que te añada', ca: 'Esperant que t’afegeixi' },
  addedYou: { en: 'Added you', es: 'Te ha añadido', ca: 'T’ha afegit' },
  addBack: { en: 'Add back', es: 'Añadir', ca: 'Afegir' },
  remove: { en: 'Remove', es: 'Quitar', ca: 'Treure' },
  friendsHowItWorks: { en: 'You can send topics to each other once you have both added each other.', es: 'Podéis enviaros temas cuando os hayáis añadido mutuamente.', ca: 'Podeu enviar-vos temes quan us hàgiu afegit mútuament.' },
  signInForFriends: { en: 'Sign in to add friends and send them topics.', es: 'Inicia sesión para añadir amigos y enviarles temas.', ca: 'Inicia la sessió per afegir amics i enviar-los temes.' },
  friendSent: { en: '{n} sent you this', es: '{n} te ha enviado esto', ca: '{n} t’ha enviat això' },
  friendVoted: { en: '{n} voted {v}', es: '{n} votó {v}', ca: '{n} va votar {v}' },
  scanToVote: { en: 'Scan to vote', es: 'Escanea para votar', ca: 'Escaneja per votar' },
  hideQr: { en: 'Minimise QR code', es: 'Minimizar código QR', ca: 'Minimitzar el codi QR' },
  showQr: { en: 'Show QR code', es: 'Mostrar código QR', ca: 'Mostrar el codi QR' },
  enlargeQr: { en: 'Show QR code full screen', es: 'Mostrar el código QR a pantalla completa', ca: 'Mostrar el codi QR a pantalla completa' },
  tapToClose: { en: 'Tap anywhere to close', es: 'Toca en cualquier sitio para cerrar', ca: 'Toca a qualsevol lloc per tancar' },
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
