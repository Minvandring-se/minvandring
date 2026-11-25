// Dagsetapperna i en tur: tolkning av formuläret, dagarna i ordning och summeringen. Rena funktioner utan databas.
import type { Boende, Etapp } from './typer'

export const BOENDEN: readonly { nyckel: Boende; etikett: string }[] = [
  { nyckel: 'stuga', etikett: 'Stuga' },
  { nyckel: 'talt', etikett: 'Tält' },
  { nyckel: 'annat', etikett: 'Annat' },
]

export const MAX_TEXT = 80
export const MAX_NOTERING = 300
export const MAX_KM = 99.9

/** Kilometer som tal, från databasens numeric (text eller tal). null när det saknas eller inte är ett tal. */
export function kmFran(varde: number | string | null | undefined): number | null {
  if (varde === null || varde === undefined || varde === '') return null
  const n = typeof varde === 'number' ? varde : Number(varde)
  return Number.isFinite(n) ? n : null
}

/** "12,5 km", "15 km". */
export function kmText(km: number): string {
  return `${km.toLocaleString('sv-SE', { maximumFractionDigits: 1 })} km`
}

/** Bara stugor och annat boende bokas. */
export function kanBokas(boende: Boende | null): boolean {
  return boende === 'stuga' || boende === 'annat'
}

export interface Etappfalt {
  fran: string
  till: string
  km: string
  natt: string
  boende: Boende | ''
  bokad: boolean
  notering: string
}

export type Etappvarden = Pick<Etapp, 'fran' | 'till' | 'natt' | 'boende' | 'bokad' | 'notering'> & { km: number | null }

function text(varde: string): string | null {
  const t = varde.trim()
  return t === '' ? null : t
}

/**
 * Formulärets fält som värden att spara, med samma gränser som databasen. Tomma fält blir tomma i databasen.
 * Kilometer får skrivas med komma eller punkt och avrundas till en decimal.
 */
export function tolkaEtapp(falt: Etappfalt): { ok: true; varden: Etappvarden } | { ok: false; fel: string } {
  const fran = text(falt.fran)
  const till = text(falt.till)
  const natt = text(falt.natt)
  const notering = text(falt.notering)
  if ([fran, till, natt].some((t) => t !== null && t.length > MAX_TEXT)) return { ok: false, fel: `Platserna får vara högst ${MAX_TEXT} tecken.` }
  if (notering !== null && notering.length > MAX_NOTERING) return { ok: false, fel: `Anteckningen får vara högst ${MAX_NOTERING} tecken.` }
  let km: number | null = null
  const kmFalt = falt.km.trim().replace(',', '.')
  if (kmFalt !== '') {
    const n = Number(kmFalt)
    if (!Number.isFinite(n) || n <= 0) return { ok: false, fel: 'Skriv sträckan som ett tal större än noll, till exempel 12,5.' }
    km = Math.round(n * 10) / 10
    if (km > MAX_KM) return { ok: false, fel: `Sträckan får vara högst ${MAX_KM.toLocaleString('sv-SE')} km.` }
    if (km === 0) return { ok: false, fel: 'Skriv sträckan som ett tal större än noll, till exempel 12,5.' }
  }
  const boende = falt.boende === '' ? null : falt.boende
  return { ok: true, varden: { fran, till, km, natt, boende, bokad: kanBokas(boende) && falt.bokad, notering } }
}

/** Fälten i formuläret för en dag, från etappen om den finns. Från-fältet fylls med gårdagens mål. */
export function etappfalt(etapp: Etapp | null, igar: Etapp | null): Etappfalt {
  const km = kmFran(etapp?.km)
  return {
    fran: etapp?.fran ?? igar?.till ?? '',
    till: etapp?.till ?? '',
    km: km === null ? '' : km.toLocaleString('sv-SE', { maximumFractionDigits: 1 }),
    natt: etapp?.natt ?? '',
    boende: etapp?.boende ?? '',
    bokad: etapp?.bokad ?? false,
    notering: etapp?.notering ?? '',
  }
}

export interface Etappdag {
  dag: number
  etapp: Etapp | null
  /** Dagen ligger efter turens sista vandringsdag, för att antalet dagar har minskats. */
  efterTuren: boolean
}

/** Turens vandringsdagar i ordning med sin etapp, och efter dem etapper för dagar som inte längre finns i turen. */
export function etappdagar(dagar: number | null, etapper: readonly Etapp[]): Etappdag[] {
  const antal = Math.max(0, dagar ?? 0)
  const perDag = new Map(etapper.map((e) => [e.dag, e]))
  const ut: Etappdag[] = []
  for (let d = 1; d <= antal; d++) ut.push({ dag: d, etapp: perDag.get(d) ?? null, efterTuren: false })
  for (const e of [...etapper].filter((e) => e.dag > antal).sort((a, b) => a.dag - b.dag)) ut.push({ dag: e.dag, etapp: e, efterTuren: true })
  return ut
}

/** En etapp har något ifyllt. */
export function arPlanerad(e: Etapp | null): boolean {
  return !!e && !!(e.fran || e.till || kmFran(e.km) !== null || e.natt || e.boende || e.notering)
}

export interface Etappsumma {
  /** Kilometer för de dagar som har en sträcka. */
  km: number
  langsta: { dag: number; km: number } | null
  /** Vandringsdagar med något ifyllt. */
  planerade: number
  /** Vandringsdagar utan sträcka. */
  utanKm: number
  /** Dagar med stuga eller annat boende som inte är bokat. */
  obokade: number[]
}

/** Summeringen överst: kilometer, längsta dagen, hur många dagar som är planerade och boenden som inte är bokade. */
export function etappsumma(dagar: readonly Etappdag[]): Etappsumma {
  const iTuren = dagar.filter((d) => !d.efterTuren)
  let km = 0
  let langsta: Etappsumma['langsta'] = null
  for (const d of iTuren) {
    const k = kmFran(d.etapp?.km)
    if (k === null) continue
    km += k
    if (!langsta || k > langsta.km) langsta = { dag: d.dag, km: k }
  }
  return {
    km: Math.round(km * 10) / 10,
    langsta,
    planerade: iTuren.filter((d) => arPlanerad(d.etapp)).length,
    utanKm: iTuren.filter((d) => kmFran(d.etapp?.km) === null).length,
    obokade: iTuren.filter((d) => d.etapp && kanBokas(d.etapp.boende) && !d.etapp.bokad).map((d) => d.dag),
  }
}

/** Rubriken för en dag: "Abisko till Abiskojaure", bara ena platsen, eller null när ingen plats är ifylld. */
export function etapprubrik(e: Etapp | null): string | null {
  if (!e) return null
  if (e.fran && e.till) return `${e.fran} till ${e.till}`
  return e.till ? `Till ${e.till}` : e.fran ? `Från ${e.fran}` : null
}

/** Övernattningen: "Natt: Alesjaure fjällstuga", eller boendet när platsen saknas, eller null. */
export function nattText(e: Etapp | null): string | null {
  if (!e) return null
  if (e.natt) return `Natt: ${e.natt}`
  if (e.boende === 'annat') return 'Natt: annat boende'
  const boende = BOENDEN.find((b) => b.nyckel === e.boende)?.etikett.toLowerCase()
  return boende ? `Natt: ${boende}` : null
}
