// Importen av baslivsmedlen från Livsmedelsverkets livsmedelsdatabas (CC BY 4.0).
// Rena funktioner: från API:ets svar till CSV-rader, och från CSV:n till kontrollerade rader och seed-SQL.
// Skriptet scripts/livsmedel.mjs hämtar och skriver filerna. Formatet beskrivs i docs/katalog/livsmedel.md.
import { lasCsv } from './katalogimport'
import { allergenerForLivsmedel } from './livsmedelsgrupper'
import { tillstandFranNamn, type Livsmedel, type Tillstand } from './livsmedel'

/**
 * Näringsvärdena per 100 g som hämtas: kolumnen i CSV:n, kolumnen i tabellen, namnet och enheten exakt som i API:t,
 * antal decimaler och största tillåtna värde. Appen använder kcal och protein. Resten sparas för senare.
 * Samma lista står i docs/katalog/livsmedel.md.
 */
export const NARINGSVARDEN = [
  { csv: 'kcal', db: 'kcal_per_100g', api: 'Energi (kcal)', enhet: 'kcal', decimaler: 0, max: 900 },
  { csv: 'protein_g', db: 'protein_per_100g', api: 'Protein', enhet: 'g', decimaler: 1, max: 100 },
  { csv: 'fett_g', db: 'fett_per_100g', api: 'Fett, totalt', enhet: 'g', decimaler: 1, max: 100 },
  { csv: 'kolhydrater_g', db: 'kolhydrater_per_100g', api: 'Kolhydrater, tillgängliga', enhet: 'g', decimaler: 1, max: 100 },
  { csv: 'fiber_g', db: 'fiber_per_100g', api: 'Fiber', enhet: 'g', decimaler: 1, max: 100 },
  { csv: 'sockerarter_g', db: 'sockerarter_per_100g', api: 'Sockerarter, totalt', enhet: 'g', decimaler: 1, max: 100 },
  { csv: 'salt_g', db: 'salt_per_100g', api: 'Salt, NaCl', enhet: 'g', decimaler: 2, max: 100 },
  { csv: 'vatten_g', db: 'vatten_per_100g', api: 'Vatten', enhet: 'g', decimaler: 1, max: 100 },
] as const

type Naringsvarde = (typeof NARINGSVARDEN)[number]
type Naringskolumn = Naringsvarde['db']

export const LIVSMEDELSKOLUMNER = ['nummer', 'namn', 'grupp', 'tillstand', ...NARINGSVARDEN.map((n) => n.csv), 'version'] as const

/**
 * Ett livsmedel som det sparas i tabellen livsmedel, med datumet för Livsmedelsverkets version. Ett värde som
 * saknas är null, aldrig 0. En 0 betyder att Livsmedelsverket anger 0, till exempel en logisk nolla.
 */
export type Livsmedelsrad = Pick<Livsmedel, 'nummer' | 'namn' | 'grupp' | 'tillstand'> & Record<Naringskolumn, number | null> & { version: string | null }

/** Ett näringsvärde i API:ets svar. Bara fälten som används. */
export interface ApiNaringsvarde {
  namn: string
  varde: number | null
  enhet: string
}

/** En klassificering i API:ets svar. Bara fälten som används. */
export interface ApiKlassificering {
  typ: string
  fasett: string
  namn: string
}

const avrunda = (v: number, decimaler: number) => Math.round(v * 10 ** decimaler) / 10 ** decimaler

function apiVarde(naring: readonly ApiNaringsvarde[], n: Naringsvarde): number | null {
  const v = naring.find((x) => x.namn === n.api && x.enhet === n.enhet)?.varde
  return typeof v === 'number' && Number.isFinite(v) ? avrunda(v, n.decimaler) : null
}

/**
 * Ett livsmedel ur API:et som en rad: näringsvärdena per 100 g enligt NARINGSVARDEN, gruppen ur Livsmedelsverkets
 * gruppindelning (LanguaL A) och tillståndet ur namnet, med tillagningen (LanguaL G) som reserv.
 */
export function radFranApi(
  livsmedel: { nummer: number; namn: string; version?: string | null },
  naring: readonly ApiNaringsvarde[],
  klassificeringar: readonly ApiKlassificering[],
): Livsmedelsrad {
  const fasett = (borjan: string) => klassificeringar.find((k) => k.typ === 'LanguaL' && k.fasett.startsWith(borjan))?.namn ?? null
  const namn = livsmedel.namn.trim()
  const varden = Object.fromEntries(NARINGSVARDEN.map((n) => [n.db, apiVarde(naring, n)])) as Record<Naringskolumn, number | null>
  return {
    nummer: livsmedel.nummer,
    namn,
    grupp: fasett('A ')?.trim() || null,
    tillstand: tillstandFranNamn(namn, fasett('G ')),
    ...varden,
    version: livsmedel.version ? livsmedel.version.slice(0, 10) : null,
  }
}

const tal = (v: number | null) => (v === null ? '' : String(v).replace('.', ','))
/** Ett fält med semikolon eller citattecken sätts inom citattecken. */
const falt = (v: string | null) => (v === null ? '' : /[;"\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v)

/** CSV:n med semikolon och decimalkomma, sorterad på nummer. */
export function livsmedelCsv(rader: readonly Livsmedelsrad[]): string {
  const ut = [...rader]
    .sort((a, b) => a.nummer - b.nummer)
    .map((r) => [String(r.nummer), falt(r.namn), falt(r.grupp), r.tillstand ?? '', ...NARINGSVARDEN.map((n) => tal(r[n.db])), r.version ?? ''].join(';'))
  return [LIVSMEDELSKOLUMNER.join(';'), ...ut, ''].join('\n')
}

export interface Livsmedelsresultat {
  rader: { rad: number; livsmedel: Livsmedelsrad | null; fel: string[] }[]
  filfel: string[]
}

function lasVarde(text: string, n: Naringsvarde, fel: string[]): number | null {
  if (!text) return null
  const v = Number(text.replace(',', '.'))
  if (!Number.isFinite(v) || v < 0 || v > n.max || (n.decimaler === 0 && !Number.isInteger(v))) {
    fel.push(`${n.csv} ska vara ${n.decimaler === 0 ? 'ett heltal' : 'ett tal'} mellan 0 och ${n.max}, inte "${text}"`)
    return null
  }
  return avrunda(v, n.decimaler)
}

const TILLSTAND: readonly Tillstand[] = ['torr', 'ra', 'tillagad']

/** Läser och kontrollerar CSV:n. En rad med fel kommer inte med, och samma nummer två gånger är ett fel för filen. */
export function importeraLivsmedel(text: string): Livsmedelsresultat {
  const { kolumner, rader } = lasCsv(text)
  if (kolumner.join(';') !== LIVSMEDELSKOLUMNER.join(';')) return { rader: [], filfel: [`Rubrikraden ska vara ${LIVSMEDELSKOLUMNER.join(';')}`] }
  const filfel: string[] = []
  const sedda = new Set<number>()
  const ut = rader.map(({ rad, falt: f }) => {
    const fel: string[] = []
    const nummer = /^\d+$/.test(f.nummer) && Number(f.nummer) > 0 ? Number(f.nummer) : null
    if (nummer === null) fel.push(`nummer ska vara ett positivt heltal, inte "${f.nummer}"`)
    else if (sedda.has(nummer)) filfel.push(`Nummer ${nummer} finns två gånger (rad ${rad})`)
    else sedda.add(nummer)
    const namn = f.namn.trim()
    if (!namn || namn.length > 200) fel.push('namn saknas eller är längre än 200 tecken')
    const grupp = f.grupp.trim() || null
    if (grupp && grupp.length > 200) fel.push('grupp är längre än 200 tecken')
    const tillstand = f.tillstand ? (TILLSTAND.find((t) => t === f.tillstand) ?? null) : null
    if (f.tillstand && !tillstand) fel.push(`tillstand ska vara torr, ra, tillagad eller tomt, inte "${f.tillstand}"`)
    const varden = Object.fromEntries(NARINGSVARDEN.map((n) => [n.db, lasVarde(f[n.csv], n, fel)])) as Record<Naringskolumn, number | null>
    const version = f.version || null
    if (version && !/^\d{4}-\d{2}-\d{2}$/.test(version)) fel.push(`version ska vara ett datum (ÅÅÅÅ-MM-DD), inte "${version}"`)
    const livsmedel: Livsmedelsrad | null = fel.length === 0 && nummer !== null ? { nummer, namn, grupp, tillstand, ...varden, version } : null
    return { rad, livsmedel, fel }
  })
  return { rader: ut, filfel }
}

export function godkandaLivsmedel(resultat: Livsmedelsresultat): Livsmedelsrad[] {
  return resultat.rader.flatMap((r) => (r.livsmedel ? [r.livsmedel] : []))
}

const sql = (v: string | number | null) => (v === null ? 'null' : typeof v === 'number' ? String(v) : `'${v.replaceAll("'", "''")}'`)
const DB_KOLUMNER = ['nummer', 'namn', 'grupp', 'tillstand', ...NARINGSVARDEN.map((n) => n.db), 'version'] as const

/** Allergenerna som SQL: en lista, en tom lista eller null för okänt. Räknas ut ur namn och grupp. */
function allergenSql(r: Livsmedelsrad): string {
  const a = allergenerForLivsmedel(r.namn, r.grupp)
  if (a === null) return 'null'
  return a.length === 0 ? "'{}'" : `array[${a.map((x) => `'${x}'`).join(', ')}]`
}

/** Seed-SQL för livsmedlen. Ett livsmedel som redan finns (samma nummer) uppdateras, så filen kan köras om. */
export function livsmedelSeedSql(rader: readonly Livsmedelsrad[], kallfil: string): string {
  const huvud = [
    `-- Baslivsmedel från Livsmedelsverkets livsmedelsdatabas (CC BY 4.0), ur ${kallfil}.`,
    '-- Skapad med "npm run livsmedel". Ändra inte filen för hand: hämta om CSV:n och skapa en ny migrering.',
    '-- Allergenerna räknas ut ur namn och grupp med reglerna i src/lib/livsmedelsgrupper.ts, bara för enkla råvaror.',
    '',
  ]
  if (rader.length === 0) return [...huvud, '-- Inga livsmedel.', ''].join('\n')
  return [
    ...huvud,
    `insert into public.livsmedel (${[...DB_KOLUMNER, 'allergener'].join(', ')}) values`,
    rader.map((r) => `  (${[...DB_KOLUMNER.map((k) => sql(r[k])), allergenSql(r)].join(', ')})`).join(',\n'),
    'on conflict (nummer) do update set',
    `${[...DB_KOLUMNER, 'allergener']
      .filter((k) => k !== 'nummer')
      .map((k) => `  ${k} = excluded.${k}`)
      .join(',\n')};`,
    '',
  ].join('\n')
}

/** Det som skriptet skriver ut: rader med fel, antal och hur många som har ett tillstånd eller saknar värden. */
export function livsmedelRapport(resultat: Livsmedelsresultat): string {
  const godkanda = godkandaLivsmedel(resultat)
  const antal = (f: (r: Livsmedelsrad) => boolean) => godkanda.filter(f).length
  return [
    ...resultat.filfel.map((f) => `FEL: ${f}`),
    ...resultat.rader.flatMap((r) => r.fel.map((f) => `Rad ${r.rad}: ${f}`)),
    `${godkanda.length} livsmedel godkända av ${resultat.rader.length}.`,
    `Tillstånd: ${antal((r) => r.tillstand === 'torr')} torra, ${antal((r) => r.tillstand === 'ra')} råa, ${antal((r) => r.tillstand === 'tillagad')} tillagade och ${antal((r) => !r.tillstand)} okända.`,
    `Saknar värde: ${NARINGSVARDEN.map((n) => `${n.csv} ${antal((r) => r[n.db] === null)}`).join(', ')}.`,
    `Allergener: ${antal((r) => (allergenerForLivsmedel(r.namn, r.grupp)?.length ?? 0) > 0)} med, ${antal((r) => allergenerForLivsmedel(r.namn, r.grupp)?.length === 0)} utan och ${antal((r) => allergenerForLivsmedel(r.namn, r.grupp) === null)} okända.`,
  ].join('\n')
}
