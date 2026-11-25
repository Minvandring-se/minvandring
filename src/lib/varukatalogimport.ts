// Importen av varukatalogen: märkesvaror från butiken (bröd, ost, korv, snabbmat och annat) med näring per 100 g och
// allergener. CSV-filerna i supabase/katalog/varor är huvudlistan, och härifrån skapas seed-SQL:en.
// Rena funktioner: text in, resultat ut. Skriptet scripts/varukatalog.mjs läser filerna och skriver migreringen.
// Formatet beskrivs i docs/katalog/varukatalog.md.
import { lasCsv } from './katalogimport'
import { tolkaAllergener } from './matkatalogimport'
import type { Varukatalogvara, Varukategori } from './typer'

/** Kolumnerna i den ordning Astra levererar dem. */
export const VARUKOLUMNER = [
  'marke',
  'namn',
  'kategori',
  'forpackning_g',
  'portion_g',
  'kcal_100g',
  'protein_100g',
  'fett_100g',
  'kolhydrater_100g',
  'fiber_100g',
  'socker_100g',
  'salt_100g',
  'vatten_ml',
  'tillagning',
  'vegetarisk',
  'vegansk',
  'glutenfri',
  'laktosfri',
  'allergener',
  'spar',
  'haller_utan_kyl',
  'ean',
  'pris_sek_ca',
  'pris_kalla',
  'kalla',
] as const

/** Kategorierna, i den ordning de visas. Nycklarna står också i migreringen varukatalog, och ett test kontrollerar det. */
export const VARUKATEGORIER: readonly { nyckel: Varukategori; etikett: string }[] = [
  { nyckel: 'brod', etikett: 'Bröd' },
  { nyckel: 'frukost', etikett: 'Frukost' },
  { nyckel: 'ost_mejeri', etikett: 'Ost och mejeri' },
  { nyckel: 'korv_chark', etikett: 'Korv och chark' },
  { nyckel: 'snabbmat', etikett: 'Snabbmat' },
  { nyckel: 'tuber_smaksattning', etikett: 'Tuber och smaksättning' },
  { nyckel: 'mellanmal', etikett: 'Mellanmål' },
  { nyckel: 'drycker', etikett: 'Drycker' },
]

/** En vara som den sparas i tabellen varukatalog. */
export type Varukatalograd = Omit<Varukatalogvara, 'id'>

export interface Varuradresultat {
  rad: number
  namn: string
  vara: Varukatalograd | null
  fel: string[]
  varningar: string[]
}

export interface Varuimportresultat {
  filfel: string[]
  rader: Varuradresultat[]
}

const ADRESS = /^https?:\/\//

type Tolkat<T> = { ok: true; varde: T } | { ok: false; fel: string }

function heltal(text: string, kolumn: string, min: number, max: number): Tolkat<number | null> {
  if (text === '') return { ok: true, varde: null }
  if (!/^\d+$/.test(text) || Number(text) < min || Number(text) > max) return { ok: false, fel: `${kolumn}: heltal mellan ${min} och ${max}, inte "${text}"` }
  return { ok: true, varde: Number(text) }
}

/**
 * Ett tal med högst två decimaler, med punkt eller komma. "<0.1" och "<0,5" (mindre än) läses som 0, eftersom
 * förpackningen säger att det är försumbart.
 */
export function tolkaVarde(text: string, kolumn: string, max: number): Tolkat<number | null> & { mindreAn?: boolean } {
  const t = text.trim().replace(',', '.')
  if (t === '') return { ok: true, varde: null }
  if (/^<\s*\d+(\.\d+)?$/.test(t)) return { ok: true, varde: 0, mindreAn: true }
  if (!/^\d+(\.\d{1,2})?$/.test(t) || Number(t) > max) return { ok: false, fel: `${kolumn}: tal mellan 0 och ${max} med högst två decimaler, inte "${text}"` }
  return { ok: true, varde: Number(t) }
}

function janej(text: string, kolumn: string): Tolkat<boolean | null> {
  const t = text.trim().toLowerCase()
  if (t === '') return { ok: true, varde: null }
  if (t === 'ja' || t === 'nej') return { ok: true, varde: t === 'ja' }
  return { ok: false, fel: `${kolumn}: ja, nej eller tom cell, inte "${text}"` }
}

/** Kontrollerar en rad och gör om den till en vara. Fel stoppar raden, varningar gör det inte. */
export function tolkaVarurad(rad: number, falt: Record<string, string>): Varuradresultat {
  const fel: string[] = []
  const varningar: string[] = []
  const namn = [falt.marke, falt.namn].filter(Boolean).join(' ') || '(utan namn)'

  function ta<T>(t: Tolkat<T>, reserv: T): T {
    if (t.ok) return t.varde
    fel.push(t.fel)
    return reserv
  }
  const mindreAn: string[] = []
  function varde(kolumn: string, max: number): number | null {
    const t = tolkaVarde(falt[kolumn] ?? '', kolumn, max)
    if (t.ok && t.mindreAn) mindreAn.push(kolumn)
    return ta(t, null)
  }

  const marke = (falt.marke ?? '').trim()
  const varunamn = (falt.namn ?? '').trim()
  if (!marke) fel.push('marke: saknas')
  if (!varunamn) fel.push('namn: saknas')
  if (marke.length > 80 || varunamn.length > 120) fel.push('marke eller namn: för långt')
  const kategori = VARUKATEGORIER.find((k) => k.nyckel === falt.kategori)?.nyckel ?? null
  if (!kategori) fel.push(`kategori: ${VARUKATEGORIER.map((k) => k.nyckel).join(', ')}, inte "${falt.kategori}"`)
  // Förpackningen kan ha decimaler, till exempel 8 × 17,8 g. Den sparas i hela gram.
  const forpackningTal = ta(tolkaVarde(falt.forpackning_g ?? '', 'forpackning_g', 20000), null)
  const forpackning = forpackningTal === null ? null : Math.max(1, Math.round(forpackningTal))
  if (!falt.forpackning_g) fel.push('forpackning_g: saknas')
  const kcal = ta(heltal(falt.kcal_100g ?? '', 'kcal_100g', 0, 900), null)
  if (!falt.kcal_100g) fel.push('kcal_100g: saknas')

  const allergener = ta(tolkaAllergener(falt.allergener ?? '', 'allergener'), null)
  const spar = ta(tolkaAllergener(falt.spar ?? '', 'spar'), null)
  const vegetarisk = ta(janej(falt.vegetarisk ?? '', 'vegetarisk'), null)
  const vegansk = ta(janej(falt.vegansk ?? '', 'vegansk'), null)
  if (vegansk === true && vegetarisk === false) fel.push('vegansk: ja men vegetarisk: nej')

  const prisKalla = falt.pris_kalla || null
  if (prisKalla && !ADRESS.test(prisKalla)) fel.push('pris_kalla: ska börja med http:// eller https://')
  const kalla = falt.kalla ?? ''
  if (!ADRESS.test(kalla)) fel.push('kalla: ska börja med http:// eller https://')
  const ean = (falt.ean ?? '').trim()
  if (ean && !/^\d{8,14}$/.test(ean)) fel.push(`ean: 8 till 14 siffror, inte "${ean}"`)

  const vara: Varukatalograd = {
    marke,
    namn: varunamn,
    kategori: kategori ?? 'brod',
    forpackning_g: forpackning ?? 0,
    portion_g: varde('portion_g', 5000),
    kcal_per_100g: kcal ?? 0,
    protein_per_100g: varde('protein_100g', 100),
    fett_per_100g: varde('fett_100g', 100),
    kolhydrater_per_100g: varde('kolhydrater_100g', 100),
    fiber_per_100g: varde('fiber_100g', 100),
    socker_per_100g: varde('socker_100g', 100),
    salt_per_100g: varde('salt_100g', 100),
    // Vattnet för hela förpackningen, till exempel 300 kaffestickor.
    vatten_ml: ta(heltal(falt.vatten_ml ?? '', 'vatten_ml', 0, 100000), null),
    tillagning: (falt.tillagning ?? '').trim().slice(0, 500) || null,
    vegetarisk,
    vegansk,
    glutenfri: ta(janej(falt.glutenfri ?? '', 'glutenfri'), null),
    laktosfri: ta(janej(falt.laktosfri ?? '', 'laktosfri'), null),
    allergener,
    spar,
    haller_utan_kyl: ta(janej(falt.haller_utan_kyl ?? '', 'haller_utan_kyl'), null),
    ean: ean || null,
    pris_sek_ca: varde('pris_sek_ca', 100000),
    pris_kalla: prisKalla,
    kalla,
  }

  if (fel.length) return { rad, namn, vara: null, fel, varningar }
  if (mindreAn.length) varningar.push(`${mindreAn.join(', ')}: "mindre än" läst som 0`)
  if (allergener === null) varningar.push('allergener: okända, varan räknas aldrig som att den passar')
  if (allergener && spar) {
    const bada = spar.filter((s) => allergener.includes(s))
    if (bada.length) varningar.push(`spar: ${bada.join(', ')} står också under allergener`)
  }
  if (allergener && vara.glutenfri === true && allergener.includes('gluten')) varningar.push('glutenfri: ja men allergenerna innehåller gluten')
  // Bröd, frukost och mellanmål har alltid mer än 100 kcal per 100 g. Lägre är troligen kcal per styck.
  if (['brod', 'frukost', 'mellanmal'].includes(vara.kategori) && vara.kcal_per_100g < 100)
    varningar.push(`kcal_100g: ${vara.kcal_per_100g} kcal är lågt för ${vara.kategori}, är det kcal per styck?`)
  // Energin räknad från fett, kolhydrater och protein ska ligga nära den angivna. Annars är något troligen fel.
  const { fett_per_100g: f, kolhydrater_per_100g: k, protein_per_100g: p } = vara
  if (f !== null && k !== null && p !== null) {
    const raknad = 9 * f + 4 * k + 4 * p
    if (raknad > 0 && Math.abs(raknad - vara.kcal_per_100g) > Math.max(40, 0.15 * raknad))
      varningar.push(`kcal_100g: ${vara.kcal_per_100g} kcal, men fett, kolhydrater och protein ger cirka ${Math.round(raknad)}`)
  }
  return { rad, namn, vara, fel, varningar }
}

/** Kontrollerar en hel fil. Rubrikraden ska ha exakt kolumnerna i VARUKOLUMNER, i den ordningen. */
export function importeraVarukatalog(text: string): Varuimportresultat {
  const { kolumner, rader } = lasCsv(text)
  if (kolumner.join(';') !== VARUKOLUMNER.join(';')) {
    const saknas = VARUKOLUMNER.filter((k) => !kolumner.includes(k))
    const okanda = kolumner.filter((k) => !(VARUKOLUMNER as readonly string[]).includes(k))
    const filfel = [...saknas.map((k) => `Kolumnen ${k} saknas.`), ...okanda.map((k) => `Okänd kolumn: ${k || '(tom rubrik)'}.`)]
    if (!filfel.length) filfel.push('Kolumnerna står i fel ordning.')
    return { filfel, rader: [] }
  }
  const sedda = new Map<string, number>()
  const seddaEan = new Map<string, number>()
  const resultat = rader.map(({ rad, falt, antalFalt }): Varuradresultat => {
    if (antalFalt !== kolumner.length) {
      const namn = [falt.marke, falt.namn].filter(Boolean).join(' ') || '(utan namn)'
      return { rad, namn, vara: null, fel: [`raden har ${antalFalt} fält, rubrikraden har ${kolumner.length}`], varningar: [] }
    }
    const r = tolkaVarurad(rad, falt)
    if (!r.vara) return r
    const nyckel = `${r.vara.marke.toLowerCase()}|${r.vara.namn.toLowerCase()}`
    const forra = sedda.get(nyckel)
    if (forra !== undefined) return { ...r, vara: null, fel: [`samma märke och namn som rad ${forra}`] }
    const forraEan = r.vara.ean ? seddaEan.get(r.vara.ean) : undefined
    if (forraEan !== undefined) return { ...r, vara: null, fel: [`samma EAN som rad ${forraEan}`] }
    sedda.set(nyckel, rad)
    if (r.vara.ean) seddaEan.set(r.vara.ean, rad)
    return r
  })
  return { filfel: [], rader: resultat }
}

export function godkandaVaror(resultat: Varuimportresultat): Varukatalograd[] {
  return resultat.rader.flatMap((r) => (r.vara ? [r.vara] : []))
}

/** Kolumnerna i tabellen varukatalog, i ordningen i seed-SQL:en. */
const TABELLKOLUMNER = [
  'marke',
  'namn',
  'kategori',
  'forpackning_g',
  'portion_g',
  'kcal_per_100g',
  'protein_per_100g',
  'fett_per_100g',
  'kolhydrater_per_100g',
  'fiber_per_100g',
  'socker_per_100g',
  'salt_per_100g',
  'vatten_ml',
  'tillagning',
  'vegetarisk',
  'vegansk',
  'glutenfri',
  'laktosfri',
  'allergener',
  'spar',
  'haller_utan_kyl',
  'ean',
  'pris_sek_ca',
  'pris_kalla',
  'kalla',
] as const satisfies readonly (keyof Varukatalograd)[]

function sqlVarde(v: string | number | boolean | readonly string[] | null): string {
  if (v === null) return 'null'
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (Array.isArray(v)) return v.length ? `array[${v.map((x) => sqlVarde(x)).join(', ')}]::text[]` : `'{}'::text[]`
  return `'${String(v).replaceAll("'", "''")}'`
}

/**
 * Seed-SQL för varorna. En vara som redan finns (samma märke och namn, utan hänsyn till stora och små bokstäver)
 * uppdateras, så samma lista kan köras igen i en ny migrering när CSV:n har ändrats.
 */
export function varuSeedSql(varor: readonly Varukatalograd[], kallfiler: readonly string[]): string {
  const huvud = [`-- Varukatalogen från ${kallfiler.join(', ')}.`, '-- Skapad med "npm run varukatalog". Ändra inte filen för hand: ändra CSV:n och skapa en ny migrering.', '']
  if (varor.length === 0) return [...huvud, '-- Inga varor.', ''].join('\n')
  const rader = varor.map((v) => `  (${TABELLKOLUMNER.map((k) => sqlVarde(v[k])).join(', ')})`)
  return [
    ...huvud,
    `insert into public.varukatalog (${TABELLKOLUMNER.join(', ')}) values`,
    rader.join(',\n'),
    'on conflict (lower(marke), lower(namn)) do update set',
    `${TABELLKOLUMNER.map((k) => `  ${k} = excluded.${k}`).join(',\n')};`,
    '',
  ].join('\n')
}

/** Det som skriptet skriver ut för en fil. */
export function varurapport(filnamn: string, resultat: Varuimportresultat): string {
  const ut: string[] = [filnamn]
  for (const f of resultat.filfel) ut.push(`  FEL I FILEN: ${f}`)
  for (const r of resultat.rader) {
    const v = r.vara
    ut.push(`  ${v ? 'OK ' : 'FEL'} rad ${r.rad}: ${r.namn}${v ? ` · ${v.kategori} · ${v.kcal_per_100g} kcal/100 g` : ''}`)
    for (const f of r.fel) ut.push(`        fel: ${f}`)
    for (const w of r.varningar) ut.push(`        varning: ${w}`)
  }
  const in_ = godkandaVaror(resultat)
  ut.push(`  Summa: ${in_.length} av ${resultat.rader.length} rader importeras.`)
  return ut.join('\n')
}
