import type { Source, Topic } from './types'

// Outlets whose coverage frames these topics. Until the backend serves the real
// articles (see the articles table in Supabase), each link opens that outlet's
// coverage of the topic via a news search, so every link works.
const OUTLETS = [
  { outlet: 'La Vanguardia', site: 'lavanguardia.com' },
  { outlet: 'El Periódico', site: 'elperiodico.com' },
  { outlet: 'Ara', site: 'ara.cat' },
  { outlet: 'betevé', site: 'beteve.cat' },
  { outlet: 'El País', site: 'elpais.com' },
]

export function coverage(query: string): Source[] {
  return OUTLETS.map(({ outlet, site }) => ({
    outlet,
    title: query,
    kind: 'search' as const,
    url: `https://news.google.com/search?q=${encodeURIComponent(`${query} site:${site}`)}&hl=es&gl=ES&ceid=ES:es`,
  }))
}

// Demo topics for the Barcelona MVP. Tallies are illustrative, not real data.
export const seedTopics: Topic[] = [
  {
    id: 'tourism-cap',
    city: 'barcelona',
    slug: 'tourists-go-home',
    area: 'Barcelona',
    category: { en: 'Tourism', es: 'Turismo', ca: 'Turisme' },
    question: {
      en: 'Should Barcelona cap the number of tourists?',
      es: '¿Debería Barcelona limitar el número de turistas?',
      ca: 'Hauria Barcelona de limitar el nombre de turistes?',
    },
    context: {
      en: 'Around 15 million people visited in 2025. "Tourists go home" protests made headlines worldwide. But what do the people who live here actually think?',
      es: 'Unos 15 millones de personas visitaron la ciudad en 2025. Las protestas de "tourists go home" dieron la vuelta al mundo. Pero ¿qué piensan realmente quienes viven aquí?',
      ca: 'Uns 15 milions de persones van visitar la ciutat el 2025. Les protestes de "tourists go home" van fer la volta al món. Però què en pensen realment els qui hi viuen?',
    },
    tally: { yes: 1842, no: 2011 },
    headlineYesShare: 0.82,
    sources: coverage('límite turistas Barcelona'),
    createdAt: '2026-06-02',
  },
  {
    id: 'tourist-flats',
    city: 'barcelona',
    slug: 'tourist-flats-2028',
    area: 'Barcelona',
    category: { en: 'Housing', es: 'Vivienda', ca: 'Habitatge' },
    question: {
      en: 'Should all tourist flats be phased out by 2028?',
      es: '¿Deberían eliminarse todos los pisos turísticos en 2028?',
      ca: 'S’haurien d’eliminar tots els pisos turístics el 2028?',
    },
    context: {
      en: 'The city plans to withdraw around 10,000 tourist-flat licences to free up homes for residents.',
      es: 'El Ayuntamiento prevé retirar unas 10.000 licencias de pisos turísticos para liberar viviendas.',
      ca: 'L’Ajuntament preveu retirar unes 10.000 llicències de pisos turístics per alliberar habitatges.',
    },
    tally: { yes: 2630, no: 1104 },
    headlineYesShare: 0.9,
    sources: coverage('pisos turísticos Barcelona 2028'),
    createdAt: '2026-05-14',
  },
  {
    id: 'superilles',
    city: 'barcelona',
    slug: 'more-superilles',
    area: 'Eixample',
    category: { en: 'Streets', es: 'Calles', ca: 'Carrers' },
    question: {
      en: 'Should more streets become superilles (superblocks)?',
      es: '¿Deberían más calles convertirse en superilles?',
      ca: 'Haurien més carrers de convertir-se en superilles?',
    },
    context: {
      en: 'Superblocks close streets to through-traffic and turn junctions into squares. Loved by some, blamed for displaced traffic by others.',
      es: 'Las superilles cierran calles al tráfico de paso y convierten cruces en plazas. Unos las adoran; otros las culpan de desviar el tráfico.',
      ca: 'Les superilles tanquen carrers al trànsit de pas i converteixen cruïlles en places. Uns les estimen; d’altres les culpen de desviar el trànsit.',
    },
    tally: { yes: 1320, no: 1188 },
    headlineYesShare: 0.35,
    sources: coverage('superilles Barcelona'),
    createdAt: '2026-04-20',
  },
  {
    id: 'cruise-ships',
    city: 'barcelona',
    slug: 'limit-cruise-ships',
    area: 'Port',
    category: { en: 'Tourism', es: 'Turismo', ca: 'Turisme' },
    question: {
      en: 'Should cruise ship arrivals at the port be limited?',
      es: '¿Deberían limitarse las llegadas de cruceros al puerto?',
      ca: 'S’haurien de limitar les arribades de creuers al port?',
    },
    context: {
      en: 'Barcelona is Europe’s busiest cruise port. Day visitors spend less but concentrate in the old town.',
      es: 'Barcelona es el primer puerto de cruceros de Europa. Los visitantes de un día gastan menos y se concentran en Ciutat Vella.',
      ca: 'Barcelona és el primer port de creuers d’Europa. Els visitants d’un dia gasten menys i es concentren a Ciutat Vella.',
    },
    tally: { yes: 1980, no: 612 },
    sources: coverage('cruceros puerto Barcelona límite'),
    createdAt: '2026-05-30',
  },
  {
    id: 'terraces',
    city: 'barcelona',
    slug: 'terraces-close-11pm',
    area: 'Gràcia',
    category: { en: 'Nightlife', es: 'Ocio nocturno', ca: 'Oci nocturn' },
    question: {
      en: 'Should bar terraces on residential streets close at 11pm?',
      es: '¿Deberían cerrar a las 23h las terrazas en calles residenciales?',
      ca: 'Haurien de tancar a les 23h les terrasses als carrers residencials?',
    },
    context: {
      en: 'Neighbours complain about noise; bar owners say terraces keep small businesses alive.',
      es: 'Los vecinos se quejan del ruido; los bares dicen que las terrazas mantienen vivo el pequeño comercio.',
      ca: 'Els veïns es queixen del soroll; els bars diuen que les terrasses mantenen viu el petit comerç.',
    },
    tally: { yes: 904, no: 1077 },
    sources: coverage('terrazas horario Gràcia vecinos'),
    createdAt: '2026-07-08',
  },
  {
    id: 'door-to-door',
    city: 'barcelona',
    slug: 'door-to-door-waste',
    area: 'Sant Andreu',
    category: { en: 'Waste', es: 'Residuos', ca: 'Residus' },
    question: {
      en: 'Should your street switch to door-to-door waste collection?',
      es: '¿Debería tu calle pasar a la recogida de residuos puerta a puerta?',
      ca: 'Hauria el teu carrer de passar a la recollida porta a porta?',
    },
    context: {
      en: 'Street bins are removed and each type of waste is collected on set days. Recycling rates rise, but so do complaints about bags on doorsteps.',
      es: 'Se retiran los contenedores y cada residuo se recoge en días fijos. El reciclaje sube, pero también las quejas por bolsas en los portales.',
      ca: 'Es retiren els contenidors i cada residu es recull en dies fixos. El reciclatge puja, però també les queixes per bosses als portals.',
    },
    tally: { yes: 402, no: 655 },
    sources: coverage('recogida puerta a puerta Barcelona'),
    createdAt: '2026-08-01',
  },
  {
    id: 'via-laietana',
    city: 'barcelona',
    slug: 'via-laietana-cars',
    area: 'Ciutat Vella',
    category: { en: 'Streets', es: 'Calles', ca: 'Carrers' },
    question: {
      en: 'Should Via Laietana be closed to private cars?',
      es: '¿Debería cerrarse Via Laietana a los coches privados?',
      ca: 'S’hauria de tancar la Via Laietana als cotxes privats?',
    },
    context: {
      en: 'The avenue has already been narrowed to one lane each way, with buses, bikes and wider pavements.',
      es: 'La avenida ya se ha reducido a un carril por sentido, con autobuses, bicis y aceras más anchas.',
      ca: 'L’avinguda ja s’ha reduït a un carril per sentit, amb autobusos, bicis i voreres més amples.',
    },
    tally: { yes: 713, no: 690 },
    sources: coverage('Via Laietana coches'),
    createdAt: '2026-06-18',
  },
  {
    id: 'sagrada-stairs',
    city: 'barcelona',
    slug: 'sagrada-familia-stairway',
    area: 'Sagrada Família',
    category: { en: 'Housing', es: 'Vivienda', ca: 'Habitatge' },
    question: {
      en: 'Should homes be demolished to build the Sagrada Família’s main stairway?',
      es: '¿Deberían derribarse viviendas para construir la escalinata de la Sagrada Família?',
      ca: 'S’haurien d’enderrocar habitatges per construir l’escalinata de la Sagrada Família?',
    },
    context: {
      en: 'Gaudí’s plans include a grand stairway across Carrer de Mallorca, where around 1,000 people currently live.',
      es: 'Los planos de Gaudí incluyen una gran escalinata sobre el carrer de Mallorca, donde hoy viven unas 1.000 personas.',
      ca: 'Els plànols de Gaudí inclouen una gran escalinata sobre el carrer de Mallorca, on avui viuen unes 1.000 persones.',
    },
    tally: { yes: 288, no: 1540 },
    sources: coverage('escalinata Sagrada Família afectados'),
    createdAt: '2026-07-22',
  },
  {
    id: 'bunkers',
    city: 'barcelona',
    slug: 'bunkers-night-access',
    area: 'Horta-Guinardó',
    category: { en: 'Public space', es: 'Espacio público', ca: 'Espai públic' },
    question: {
      en: 'Should the Bunkers del Carmel close to visitors at night?',
      es: '¿Deberían cerrarse de noche los Búnkers del Carmel a los visitantes?',
      ca: 'S’haurien de tancar de nit els Búnquers del Carmel als visitants?',
    },
    context: {
      en: 'The viewpoint went viral on social media. Neighbours report crowds and noise late into the night.',
      es: 'El mirador se hizo viral en redes. Los vecinos denuncian aglomeraciones y ruido hasta altas horas.',
      ca: 'El mirador es va fer viral a les xarxes. Els veïns denuncien aglomeracions i soroll fins a altes hores.',
    },
    tally: { yes: 822, no: 541 },
    sources: coverage('Búnkers del Carmel cierre noche'),
    createdAt: '2026-08-12',
  },
]

// Sponsored questions from local businesses. These businesses are fictional, for the demo.
export const sponsoredTopics: Topic[] = [
  {
    id: 'sp-bike-parking',
    slug: 'sponsored-bike-parking',
    city: 'barcelona',
    area: 'Sant Martí',
    category: { en: 'Streets', es: 'Calles', ca: 'Carrers' },
    question: {
      en: 'Should every metro station in Sant Martí get secure bike parking?',
      es: '¿Debería cada estación de metro de Sant Martí tener aparcamiento seguro para bicis?',
      ca: 'Hauria de tenir cada estació de metro de Sant Martí aparcament segur per a bicis?',
    },
    context: {
      en: 'Cyclists say fear of theft stops them riding to the metro. Secure parking would take space from pavements or car parking.',
      es: 'Los ciclistas dicen que el miedo a los robos les impide ir en bici al metro. El aparcamiento seguro quitaría espacio a aceras o plazas de coche.',
      ca: 'Els ciclistes diuen que la por als robatoris els impedeix anar en bici al metro. L’aparcament segur trauria espai a voreres o places de cotxe.',
    },
    tally: { yes: 412, no: 198 },
    sponsor: {
      name: 'Bicis Poblenou',
      about: {
        en: 'Family bike repair shop in Poblenou.',
        es: 'Taller familiar de bicis en el Poblenou.',
        ca: 'Taller familiar de bicis al Poblenou.',
      },
    },
    sources: coverage('aparcamiento bicis metro Barcelona'),
    createdAt: '2026-09-10',
  },
  {
    id: 'sp-loading-bays',
    slug: 'sponsored-loading-bays',
    city: 'barcelona',
    area: 'Gràcia',
    category: { en: 'Local business', es: 'Comercio local', ca: 'Comerç local' },
    question: {
      en: 'Should small shops get free morning loading bays on narrow streets?',
      es: '¿Deberían los pequeños comercios tener zonas de carga gratuitas por la mañana en calles estrechas?',
      ca: 'Haurien de tenir els petits comerços zones de càrrega gratuïtes al matí als carrers estrets?',
    },
    context: {
      en: 'Deliveries on narrow streets often block traffic. Free morning slots would help shops but take space from residents’ parking.',
      es: 'Las entregas en calles estrechas a menudo bloquean el tráfico. Las franjas gratuitas ayudarían a las tiendas, pero quitarían plazas a los vecinos.',
      ca: 'Els lliuraments als carrers estrets sovint bloquegen el trànsit. Les franges gratuïtes ajudarien les botigues, però traurien places als veïns.',
    },
    tally: { yes: 287, no: 231 },
    sponsor: {
      name: 'Forn de la Vila',
      about: {
        en: 'Neighbourhood bakery in Gràcia.',
        es: 'Panadería de barrio en Gràcia.',
        ca: 'Forn de barri a Gràcia.',
      },
    },
    sources: coverage('zonas carga descarga comercio Gràcia'),
    createdAt: '2026-09-12',
  },
  {
    id: 'sp-car-free-sunday',
    slug: 'sponsored-car-free-sunday',
    city: 'barcelona',
    area: 'Eixample',
    category: { en: 'Streets', es: 'Calles', ca: 'Carrers' },
    question: {
      en: 'Should the Eixample go car-free one Sunday a month?',
      es: '¿Debería el Eixample cerrarse a los coches un domingo al mes?',
      ca: 'Hauria l’Eixample de tancar-se als cotxes un diumenge al mes?',
    },
    context: {
      en: 'Some European cities close central streets to cars on set Sundays for walking, cycling and street events.',
      es: 'Algunas ciudades europeas cierran calles céntricas a los coches ciertos domingos para pasear, ir en bici y hacer actividades.',
      ca: 'Algunes ciutats europees tanquen carrers cèntrics als cotxes alguns diumenges per passejar, anar en bici i fer activitats.',
    },
    tally: { yes: 530, no: 470 },
    sponsor: {
      name: 'Llibreria Nautilus',
      about: {
        en: 'Independent bookshop in the Eixample.',
        es: 'Librería independiente en el Eixample.',
        ca: 'Llibreria independent a l’Eixample.',
      },
    },
    sources: coverage('domingo sin coches Barcelona'),
    createdAt: '2026-09-15',
  },
]
