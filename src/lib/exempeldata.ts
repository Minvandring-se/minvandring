// Exempelinnehåll för delarna av turen som inte är byggda än. De visas med etiketten "Kommer snart",
// så att vi ser hur de kommer att se ut. Inget av det här ligger i databasen eller hör till en riktig tur.
// När en del byggs på riktigt tas dess exempel bort härifrån. När filen är tom kan den tas bort.
// Namnen är samma exempelnamn som på startsidan (Anna och Erik), inte deltagarna i turen.

export const REDO_FOR_AVFARD = {
  andel: 0.64,
  kvar: '3 saker kvar innan ni går',
  klart: ['Rutt och etapper', 'Nattåget bokat', 'Gemensam utrustning fördelad'],
  ejKlart: ['Packning, 68 % klart', 'Middag dag 3 och 4', 'Färdplan till någon hemma'],
}

export const KOM_IHAG = {
  fran: 'Från Jämtlandstriangeln 2026',
  rader: ['En extra gaspatron räckte inte till fyra dagar', 'Myggnät till alla, även hunden', 'Torrsäck till sovsäcken'],
}

export const ATT_GORA: { text: string; vem: string; nar: string; klar: boolean; bradskar?: boolean }[] = [
  { text: 'Boka nattåg till Abisko', vem: 'Erik', nar: 'Klart', klar: true },
  { text: 'Boka STF-stugor, natt 1, 2 och 4', vem: 'Anna', nar: 'Senast 1 aug', klar: false, bradskar: true },
  { text: 'Köp två gaspatroner i Abisko', vem: 'Erik', nar: 'På plats', klar: false },
  { text: 'Skriv ut fjällkartan', vem: 'Anna', nar: 'Senast 10 aug', klar: false },
]

export const RESAN = [
  { riktning: 'dit' as const, rubrik: 'Dit: nattåg till Abisko', nar: 'Ons 11 aug, kväll' },
  { riktning: 'hem' as const, rubrik: 'Hem: buss från Nikkaluokta', nar: 'Ons 18 aug, eftermiddag' },
]

export const ETAPPER: { fran: string; till: string; dag: string; natt: string; bokad?: boolean; km: number }[] = [
  { fran: 'Abisko', till: 'Abiskojaure', dag: 'Tor 12 aug', natt: 'Abiskojaure fjällstuga', bokad: true, km: 15 },
  { fran: 'Abiskojaure', till: 'Alesjaure', dag: 'Fre 13 aug', natt: 'Alesjaure fjällstuga', bokad: false, km: 20 },
  { fran: 'Alesjaure', till: 'Tjäktja', dag: 'Lör 14 aug', natt: 'tält vid Tjäktja', km: 13 },
  { fran: 'Tjäktja', till: 'Sälka', dag: 'Sön 15 aug', natt: 'Sälka fjällstuga', bokad: false, km: 12 },
]

/** Vikten per kategori i kg. Färgen är en färgvariabel, så att stapeln följer ljust och mörkt läge. */
export const DIN_VIKT = {
  total: '12,1 kg',
  mal: 'Under målet 13 kg',
  kategorier: [
    { namn: 'Ryggsäck', kg: 2.2, farg: 'bg-primary' },
    { namn: 'Sova', kg: 1.9, farg: 'bg-illustration' },
    { namn: 'Tält', kg: 1.5, farg: 'bg-illustration/70' },
    { namn: 'Kök', kg: 0.9, farg: 'bg-illustration/40' },
    { namn: 'Övrigt', kg: 0.9, farg: 'bg-illustration/20' },
    { namn: 'Mat', kg: 4.7, farg: 'bg-accent' },
  ],
  nyckeltal: [
    { etikett: 'Basvikt', varde: '7,4 kg' },
    { etikett: 'Förbrukas', varde: '4,7 kg' },
    { etikett: 'Bärs på dig', varde: '1,1 kg' },
  ],
}

export const MAT_PER_DAG = {
  mal: 'Mål: 3 000 kcal och 650 g per person och dag',
  maltider: ['Frukost', 'Lunch', 'Middag'] as const,
  /** Dagar där middagen saknas. */
  saknas: { Middag: [3, 4] } as Partial<Record<'Frukost' | 'Lunch' | 'Middag', number[]>>,
  kcal: [3100, 2950, 2100, 2200, 3050, 2900, 2400],
  /** Under målet. */
  lagt: 2500,
}

export const VIKT_PER_PERSON = {
  personer: [
    { namn: 'Anna', kg: '12,1 kg', andel: 0.78 },
    { namn: 'Erik', kg: '10,4 kg', andel: 0.67 },
    { namn: 'Hunden', kg: '2,8 kg', andel: 0.18 },
  ],
  tips: 'Inklusive gemensam utrustning. Flytta tältet till Erik så blir det jämnare.',
}

export const GEMENSAM_UTRUSTNING = [
  { sak: 'Tält, Hilleberg Nallo 2', vem: 'Anna', kg: '2,4 kg' },
  { sak: 'Kök, kastrull och gas', vem: 'Erik', kg: '0,9 kg' },
  { sak: 'Vattenfilter', vem: 'Anna', kg: '0,1 kg' },
  { sak: 'Första hjälpen', vem: 'Erik', kg: '0,3 kg' },
]

export const KOSTNADER = {
  rader: [
    { text: 'Nattåg, Erik betalade', belopp: '2 480 kr' },
    { text: 'Stugor, Anna betalade', belopp: '1 960 kr' },
    { text: 'Mat, Anna betalade', belopp: '1 140 kr' },
  ],
  slutsats: 'Erik ska swisha Anna',
  efter: 'när allt är inlagt.',
}

export const FARDPLAN = {
  kontakt: 'Namn och telefon',
  hemkomst: 'Ons 18 aug, kväll',
  nod: 'Nödläge: 112. Mobiltäckning saknas på stora delar av leden.',
}

export const SENASTE_I_GRUPPEN = [
  { vem: 'Erik', vad: 'bockade av nattåget', nar: 'i går' },
  { vem: 'Anna', vad: 'lade till tältet i gemensam utrustning', nar: 'i förrgår' },
  { vem: 'Erik', vad: 'röstade på 12–18 aug', nar: '3 dagar sedan' },
]

export const OMROSTNING = {
  fraga: 'Rösta om datum, led eller om ni ska sova i stuga eller tält.',
  alternativ: [
    { text: '12–18 aug', roster: '2 röster', vald: true },
    { text: '19–25 aug', roster: '0 röster', vald: false },
  ],
}

export const PACKLAGE = {
  text: 'Stora rutor att bocka av kvällen före, även utan nät.',
  saker: [
    { sak: 'Sovsäck', packad: true },
    { sak: 'Pannlampa', packad: false },
  ],
}

export const DELA_OCH_SPARA = ['Dela packlistan med en länk', 'Spara som mall till nästa tur', 'Importera från LighterPack eller CSV', 'Kopiera hela turen']

export const EFTER_TUREN = [
  { rubrik: 'Dagbok och bilder', text: 'Några rader och bilder per dag.', accent: false },
  { rubrik: 'Vad användes?', text: 'Bocka av det ni inte använde. Det blir lättare nästa gång.', accent: false },
  { rubrik: 'Kom ihåg till nästa vandring', text: 'Lärdomarna följer med till nästa vandring.', accent: true },
  { rubrik: 'Statistik', text: 'Kilometer, nätter och turer genom åren.', accent: false },
]

// Exempel för sidorna i menyn som inte är byggda än (src/lib/meny.ts). Samma regler som ovan.

/** Statistik, enligt skissen Sidomeny-dator. Kilometer per månad, januari till december. Summan är 312. */
export const STATISTIK = {
  ar: ['2025', '2026', 'Alla år'],
  valtAr: '2026',
  nyckeltal: [
    { etikett: 'Turer', varde: '5' },
    { etikett: 'Kilometer', varde: '312' },
    { etikett: 'Nätter ute', varde: '19' },
    { etikett: 'Snitt startvikt', varde: '11,8 kg' },
  ],
  manader: ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'],
  kmPerManad: [0, 0, 12, 0, 29, 47, 89, 106, 29, 0, 0, 0],
  mestAnvand: [
    { namn: 'Tält för två', varde: '19 nätter' },
    { namn: 'Sovsäck, dun −5 °C', varde: '19 nätter' },
    { namn: 'Ryggsäck 58 liter', varde: '5 turer' },
  ],
  aldrigAnvand: [
    { namn: 'Extra fleecetröja', varde: '420 g' },
    { namn: 'Ett andra vattenfilter', varde: '90 g' },
  ],
}

/** Matplanering: era egna rätter med energi och vikt per portion. */
export const RATTER: { namn: string; maltid: string; kcal: number; gram: number; kcalPer100g: number }[] = [
  { namn: 'Havregrynsgröt med nötter och russin', maltid: 'Frukost', kcal: 620, gram: 140, kcalPer100g: 443 },
  { namn: 'Wraps med ost och salami', maltid: 'Lunch', kcal: 650, gram: 160, kcalPer100g: 406 },
  { namn: 'Pasta med soltorkade tomater', maltid: 'Middag', kcal: 780, gram: 180, kcalPer100g: 433 },
  { namn: 'Linsgryta med kokosmjölk', maltid: 'Middag', kcal: 710, gram: 170, kcalPer100g: 418 },
  { namn: 'Chokladmousse', maltid: 'Efterrätt', kcal: 420, gram: 90, kcalPer100g: 467 },
]

/** Packlistor och mallar: färdiga mallar och era egna från tidigare turer. */
export const MALLAR: { namn: string; fran: string; saker: number; basvikt: string }[] = [
  { namn: 'Fjälltur sommar', fran: 'Färdig mall', saker: 46, basvikt: '7,8 kg' },
  { namn: 'Fjälltur vinter', fran: 'Färdig mall', saker: 58, basvikt: '11,2 kg' },
  { namn: 'Helg i skogen med hund', fran: 'Er mall, från Sörmlandsleden 2025', saker: 34, basvikt: '6,1 kg' },
  { namn: 'Stugtur i fjällen', fran: 'Färdig mall', saker: 31, basvikt: '4,9 kg' },
]

/** Dagbok: en tidslinje för en tur. */
export const DAGBOK = {
  tur: 'Jämtlandstriangeln 2026',
  dagar: [
    { dag: 'Dag 1, fredag 3 juli', rubrik: 'Storulvån till Sylarna', text: 'Regn hela förmiddagen och sol vid stugan. Erik hittade de första hjortronen.', bilder: 4 },
    { dag: 'Dag 2, lördag 4 juli', rubrik: 'Sylarna till Blåhammaren', text: 'Blåsigt över fjället. Anna lagade linsgryta, den bästa middagen på hela turen.', bilder: 7 },
    { dag: 'Dag 3, söndag 5 juli', rubrik: 'Blåhammaren till Storulvån', text: 'Kort sista dag. Bad i bäcken innan bussen hem.', bilder: 2 },
  ],
}

/** Kom ihåg till nästa: lärdomarna från alla turer, grupperade efter ämne. */
export const LARDOMAR: { amne: string; rader: { text: string; tur: string }[] }[] = [
  {
    amne: 'Kök och mat',
    rader: [
      { text: 'En extra gaspatron räckte inte till fyra dagar', tur: 'Jämtlandstriangeln 2026' },
      { text: 'Packa frukosten i en egen påse per dag', tur: 'Sörmlandsleden 2025' },
    ],
  },
  {
    amne: 'Sova',
    rader: [{ text: 'Torrsäck till sovsäcken, även när det inte ska regna', tur: 'Jämtlandstriangeln 2026' }],
  },
  {
    amne: 'Hund',
    rader: [
      { text: 'Myggnät till alla, även hunden', tur: 'Jämtlandstriangeln 2026' },
      { text: 'Tassvax för steniga stigar', tur: 'Sörmlandsleden 2025' },
    ],
  },
]

/** Vandringskompisar: personer ni har vandrat med. */
export const KOMPISAR: { namn: string; turer: number; senast: string }[] = [
  { namn: 'Anna', turer: 4, senast: 'Jämtlandstriangeln 2026' },
  { namn: 'Erik', turer: 3, senast: 'Jämtlandstriangeln 2026' },
]

/**
 * Mitt förråd, enligt skissen Forrad-dator. Det som kräver databasen eller packlistorna visas som exempel med Kommer snart.
 * Ingen av sakerna här är en riktig sak i någons förråd.
 */
export const FORRAD_EXEMPEL = {
  flikar: [
    { namn: 'Önskelista', antal: 2 },
    { namn: 'Utlånat', antal: 1 },
    { namn: 'Pensionerat', antal: 0 },
  ],
  etiketter: ['Delas med Anna', 'Utlånat till Erik', 'Pensioneras?'],
  detaljer: [
    { etikett: 'Köpt', varde: 'maj 2024' },
    { etikett: 'Skick', varde: 'Bra' },
    { etikett: 'Följt med på', varde: '6 turer, 23 nätter' },
    { etikett: 'Pris per natt', varde: '38 kr' },
  ],
  lattare: { text: '7 liknande produkter i katalogen väger mindre.', spara: 'Jämför och spara upp till 1,2 kg' },
  knappar: ['Lägg i en packlista', 'Låna ut', 'Pensionera'],
  onskelista: [
    { namn: 'Uppblåsbart liggunderlag', not: 'Fyller Grunden' },
    { namn: 'Lättare ryggsäck, 60 liter', not: '−1,2 kg' },
  ],
}

/** Exempel på turens längd och svårighet, som i skissen. Visas inte förrän etapperna finns. */
export const HOJDPROFIL = 'Importera en GPX-fil så visas leden, etapperna, stugor och vatten längs vägen.'
