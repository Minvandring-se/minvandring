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

/** Exempel på turens längd och svårighet, som i skissen. Visas inte förrän etapperna finns. */
export const HOJDPROFIL = 'Importera en GPX-fil så visas leden, etapperna, stugor och vatten längs vägen.'
