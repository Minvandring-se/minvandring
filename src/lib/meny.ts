// Menyns delar, samlade på ett ställe. Sidomenyn på dator visar Hem och grupperna, och bottenmenyn i mobil visar Hem
// och de viktigaste sidorna som flikar och resten i bladet Mer, med samma grupper och i samma ordning som sidomenyn.
// Sidor som inte är byggda ligger i gruppen Kommer snart.

export type Sida =
  | 'hem'
  | 'turer'
  | 'matplanering'
  | 'packlistor'
  | 'forrad'
  | 'utrustning'
  | 'dagbok'
  | 'kom-ihag'
  | 'statistik'
  | 'vanner'
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
  hem: { sida: 'hem', namn: 'Hem', till: '/hem', byggd: true, beskrivning: 'Nästa tur och det som är kvar att göra', blir: '' },
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
  vanner: { sida: 'vanner', namn: 'Vänner', till: '/vanner', byggd: true, beskrivning: 'Dem du vandrar med', blir: '' },
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

export type Gruppnyckel = 'planera' | 'utrustning' | 'vandrare' | 'minnen' | 'snart'

export interface Menygrupp {
  nyckel: Gruppnyckel
  rubrik: string
  sidor: readonly Sida[]
}

/** Grupperna i sidomenyn på dator, i ordning, under Hem. Kommer snart samlar sidorna som inte är byggda. */
export const MENYGRUPPER: readonly Menygrupp[] = [
  { nyckel: 'planera', rubrik: 'Planera', sidor: ['turer', 'matplanering'] },
  { nyckel: 'utrustning', rubrik: 'Utrustning', sidor: ['forrad', 'utrustning'] },
  { nyckel: 'vandrare', rubrik: 'Vandrare', sidor: ['vanner'] },
  { nyckel: 'minnen', rubrik: 'Minnen', sidor: ['kom-ihag'] },
  { nyckel: 'snart', rubrik: 'Kommer snart', sidor: ['packlistor', 'dagbok', 'statistik'] },
]

/** Gruppen som en sida ligger i. null för Hem, Profil och Inställningar. */
export function gruppFor(sida: Sida | null): Gruppnyckel | null {
  return MENYGRUPPER.find((g) => sida !== null && g.sidor.includes(sida))?.nyckel ?? null
}

/** Grupperna som är öppna när sidan visas: gruppen med den aktiva sidan. Kommer snart är stängd om den inte är aktiv. */
export function oppnaGrupper(aktiv: Sida | null): Set<Gruppnyckel> {
  const grupp = gruppFor(aktiv)
  return new Set(grupp ? [grupp] : [])
}

/** Bladen som öppnas nerifrån i mobil. */
export type Blad = 'mer'

/** Flikarna i bottenmenyn i mobil. Mer öppnar ett blad i stället för en sida. */
export type Flik = { typ: 'sida'; sida: Sida; namn: string } | { typ: 'blad'; blad: Blad; namn: string }

export const FLIKAR: readonly Flik[] = [
  { typ: 'sida', sida: 'hem', namn: 'Hem' },
  { typ: 'sida', sida: 'turer', namn: 'Mina turer' },
  { typ: 'sida', sida: 'matplanering', namn: 'Matplanering' },
  { typ: 'sida', sida: 'forrad', namn: 'Mitt förråd' },
  { typ: 'blad', blad: 'mer', namn: 'Mer' },
]

const FLIKSIDOR = new Set(FLIKAR.flatMap((f) => (f.typ === 'sida' ? [f.sida] : [])))

/**
 * Bladet Mer i mobil: sidorna som inte är flikar, med samma grupper och i samma ordning som sidomenyn, och sist
 * Inställningar (Profil nås från bilden överst).
 */
export const MER: readonly { rubrik: string; sidor: readonly Sida[] }[] = [
  ...MENYGRUPPER.map((g) => ({ rubrik: g.rubrik, sidor: g.sidor.filter((s) => !FLIKSIDOR.has(s)) })).filter((g) => g.sidor.length > 0),
  { rubrik: 'Konto', sidor: ['installningar'] },
]

/** Innehållet i bladen i mobil, i ordning. */
export const BLAD: Record<Blad, readonly Sida[]> = {
  mer: MER.flatMap((g) => g.sidor),
}

/**
 * Det öppna bladet i mobil står i historikens state, så att tillbaka-knappen stänger det.
 * steg är true när bladet öppnades i appen: då är posten före samma sida utan blad, och stängning är ett steg bakåt.
 */
export function bladIState(state: unknown): { blad: Blad; steg: boolean } | null {
  const s = state as { blad?: unknown; steg?: unknown } | null
  if (s?.blad !== 'mer') return null
  return { blad: s.blad, steg: s.steg === true }
}

/** Vilken sida en adress hör till, för att markera rätt rad i menyn. Turens sidor hör till Mina turer, och delarna till sin sida. */
export function aktivSida(pathname: string): Sida | null {
  const sokvag = pathname.replace(/\/+$/, '') || '/'
  if (sokvag === '/turer' || sokvag.startsWith('/tur/')) return 'turer'
  const sida = Object.values(SIDOR).find((s) => s.till === sokvag)?.sida
  if (sida) return sida
  const del = aktivUndersida(sokvag)
  const med = del ? (Object.keys(UNDERSIDOR) as Sida[]).find((s) => UNDERSIDOR[s]!.some((u) => u.till === del)) : undefined
  return med ?? null
}

/** Vilken del av en sida en adress är. null när adressen inte är en av delarna. */
export function aktivUndersida(pathname: string): string | null {
  const sokvag = pathname.replace(/\/+$/, '') || '/'
  const delar = Object.values(UNDERSIDOR).flatMap((d) => d!.map((u) => u.till))
  if (delar.includes(sokvag)) return sokvag
  // En sida under en del, till exempel en artikel under Tips, hör till delen. Inte under sidan själv (/matplanering).
  const sidor = new Set(Object.values(SIDOR).map((s) => s.till))
  return delar.find((till) => !sidor.has(till) && sokvag.startsWith(`${till}/`)) ?? null
}

/** Är fliken aktiv? En sida när adressen hör till den, ett blad när en av dess sidor är öppen. */
export function flikAktiv(flik: Flik, aktiv: Sida | null): boolean {
  if (!aktiv) return false
  return flik.typ === 'sida' ? flik.sida === aktiv : BLAD[flik.blad].includes(aktiv)
}
