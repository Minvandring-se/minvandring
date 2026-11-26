// Menyns delar, samlade på ett ställe. Sidomenyn på dator visar grupperna, och bottenmenyn i mobil visar de
// viktigaste som flikar och resten i bladen Minnen och Mer. Sidor som inte är byggda visar "Kommer snart".

export type Sida =
  | 'turer'
  | 'matplanering'
  | 'packlistor'
  | 'forrad'
  | 'utrustning'
  | 'dagbok'
  | 'kom-ihag'
  | 'statistik'
  | 'kompisar'
  | 'installningar'
  | 'profil'

export interface Menysida {
  sida: Sida
  namn: string
  /** Sidans rubrik, när den är längre än namnet i menyn. */
  rubrik?: string
  /** Sökvägen, utan å, ä och ö. */
  till: string
  /** false tills sidan är byggd. Då får den etiketten "Snart" i menyn och "Kommer snart" på sidan. */
  byggd: boolean
  /** En kort rad under namnet i mobilens blad. */
  beskrivning: string
  /** En mening om vad sidan blir, för sidor som inte är byggda. */
  blir: string
}

export const SIDOR: Record<Sida, Menysida> = {
  turer: { sida: 'turer', namn: 'Mina turer', till: '/turer', byggd: true, beskrivning: 'Alla dina turer', blir: '' },
  matplanering: {
    sida: 'matplanering',
    namn: 'Matplanering',
    till: '/matplanering',
    byggd: true,
    beskrivning: 'Matplaner, katalog, recept och tips',
    blir: '',
  },
  packlistor: {
    sida: 'packlistor',
    namn: 'Packlistor och mallar',
    till: '/packlistor',
    byggd: false,
    beskrivning: 'Färdiga listor att starta från',
    blir: 'Färdiga packlistor att starta en tur från, och era egna mallar från tidigare turer.',
  },
  forrad: { sida: 'forrad', namn: 'Mitt förråd', till: '/forrad', byggd: true, beskrivning: 'Dina egna saker', blir: '' },
  utrustning: {
    sida: 'utrustning',
    namn: 'Utrustningskatalog',
    till: '/utrustning',
    byggd: true,
    beskrivning: 'Sök bland produkterna och se vikten',
    blir: '',
  },
  dagbok: {
    sida: 'dagbok',
    namn: 'Dagbok',
    till: '/dagbok',
    byggd: false,
    beskrivning: 'Anteckningar och bilder per tur',
    blir: 'En tidslinje per tur med anteckningar och bilder från varje dag.',
  },
  'kom-ihag': {
    sida: 'kom-ihag',
    namn: 'Kom ihåg till nästa tur',
    rubrik: 'Kom ihåg till nästa tur',
    till: '/kom-ihag',
    byggd: true,
    beskrivning: 'Alla lärdomar samlade',
    blir: 'Lärdomarna från alla turer, sorterade efter ämne, så att de kommer med nästa gång.',
  },
  statistik: {
    sida: 'statistik',
    namn: 'Statistik',
    till: '/statistik',
    byggd: false,
    beskrivning: 'Kilometer, nätter och utrustning',
    blir: 'Era turer och er utrustning över tid: kilometer, nätter ute och vad som faktiskt används.',
  },
  kompisar: {
    sida: 'kompisar',
    namn: 'Vandringskompisar',
    till: '/kompisar',
    byggd: false,
    beskrivning: 'Bjud in samma grupp igen',
    blir: 'Personerna ni har vandrat med, så att det går snabbt att bjuda in samma grupp igen.',
  },
  installningar: {
    sida: 'installningar',
    namn: 'Inställningar',
    till: '/installningar',
    byggd: true,
    beskrivning: 'Ljust, mörkt och konto',
    blir: '',
  },
  profil: { sida: 'profil', namn: 'Profil', till: '/profil', byggd: true, beskrivning: 'Ditt namn och din bild', blir: '' },
}

/** En del av en sida i menyn, till exempel Matkatalog under Matplanering. */
export interface Undersida {
  namn: string
  /** Sökvägen, utan å, ä och ö. Den första delen har samma sökväg som sidan. */
  till: string
}

/** Sidor som har flera delar. De står indragna under sidan i sidomenyn och som en flikrad överst på delarna. */
export const UNDERSIDOR: Partial<Record<Sida, readonly Undersida[]>> = {
  matplanering: [
    { namn: 'Mina matplaner', till: '/matplanering' },
    { namn: 'Matkatalog', till: '/matplanering/katalog' },
    { namn: 'Recept', till: '/matplanering/recept' },
    { namn: 'Skafferi', till: '/matplanering/skafferi' },
    { namn: 'Tips', till: '/matplanering/tips' },
  ],
}

/** Grupperna i sidomenyn på dator, i ordning. */
export const MENYGRUPPER: readonly { rubrik: string; sidor: readonly Sida[] }[] = [
  { rubrik: 'Planera', sidor: ['turer', 'matplanering', 'packlistor'] },
  { rubrik: 'Utrustning', sidor: ['forrad', 'utrustning'] },
  { rubrik: 'Minnen', sidor: ['dagbok', 'kom-ihag', 'statistik'] },
  { rubrik: 'Folk', sidor: ['kompisar'] },
]

/** Bladen som öppnas nerifrån i mobil. */
export type Blad = 'minnen' | 'mer'

/** Flikarna i bottenmenyn i mobil. Minnen och Mer öppnar ett blad i stället för en sida. */
export type Flik = { typ: 'sida'; sida: Sida; namn: string } | { typ: 'blad'; blad: Blad; namn: string }

export const FLIKAR: readonly Flik[] = [
  { typ: 'sida', sida: 'turer', namn: 'Turer' },
  { typ: 'sida', sida: 'matplanering', namn: 'Mat' },
  { typ: 'sida', sida: 'forrad', namn: 'Förråd' },
  { typ: 'blad', blad: 'minnen', namn: 'Minnen' },
  { typ: 'blad', blad: 'mer', namn: 'Mer' },
]

/** Innehållet i bladen i mobil. */
export const BLAD: Record<Blad, readonly Sida[]> = {
  minnen: ['dagbok', 'kom-ihag', 'statistik'],
  mer: ['packlistor', 'utrustning', 'kompisar', 'installningar'],
}

/**
 * Det öppna bladet i mobil står i historikens state, så att tillbaka-knappen stänger det.
 * steg är true när bladet öppnades i appen: då är posten före samma sida utan blad, och stängning är ett steg bakåt.
 */
export function bladIState(state: unknown): { blad: Blad; steg: boolean } | null {
  const s = state as { blad?: unknown; steg?: unknown } | null
  if (s?.blad !== 'minnen' && s?.blad !== 'mer') return null
  return { blad: s.blad, steg: s.steg === true }
}

/** Vilken sida en adress hör till, för att markera rätt rad i menyn. Turens sidor hör till Mina turer, och delarna till sin sida. */
export function aktivSida(pathname: string): Sida | null {
  const sokvag = pathname.replace(/\/+$/, '') || '/'
  if (sokvag === '/turer' || sokvag.startsWith('/tur/')) return 'turer'
  const sida = Object.values(SIDOR).find((s) => s.till === sokvag)?.sida
  if (sida) return sida
  const med = (Object.keys(UNDERSIDOR) as Sida[]).find((s) => UNDERSIDOR[s]!.some((u) => u.till === sokvag))
  return med ?? null
}

/** Vilken del av en sida en adress är. null när adressen inte är en av delarna. */
export function aktivUndersida(pathname: string): string | null {
  const sokvag = pathname.replace(/\/+$/, '') || '/'
  return Object.values(UNDERSIDOR).some((delar) => delar!.some((u) => u.till === sokvag)) ? sokvag : null
}

/** Är fliken aktiv? En sida när adressen hör till den, ett blad när en av dess sidor är öppen. */
export function flikAktiv(flik: Flik, aktiv: Sida | null): boolean {
  if (!aktiv) return false
  return flik.typ === 'sida' ? flik.sida === aktiv : BLAD[flik.blad].includes(aktiv)
}
