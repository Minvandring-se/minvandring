// Importen av matkatalogen. CSV-filerna i supabase/katalog/mat är huvudlistan, och härifrån skapas seed-SQL:en.
// Rena funktioner: text in, resultat ut. Skriptet scripts/matkatalog.mjs läser filerna och skriver migreringen.
// Formatet beskrivs i docs/katalog/matkatalog.md.
import { arAllergen, type Allergen } from './kost'
import { lasCsv } from './katalogimport'
import type { Katalogmaltid, Matprodukt } from './typer'

/** Kolumnerna i den ordning Astra levererar dem. */
export const MATKOLUMNER = [
  'marke',
  'namn',
  'andra_namn',
  'maltid',
  'torkning',
  'vikt_torr_g',
  'portioner',
  'kcal',
  'protein_g',
  'fett_g',
  'kolhydrater_g',
  'vatten_ml',
  'tillagning_vatten',
  'tillagning_min',
  'vegetarisk',
  'vegansk',
  'glutenfri',
  'laktosfri',
  'allergener',
  'spar',
  'pris_sek_ca',
  'pris_kalla',
  'kalla',
  'kontrollerad',
] as const

/** En påse som den sparas i tabellen matprodukter. */
export type Matkatalograd = Omit<Matprodukt, 'id'>

export interface Matradresultat {
  /** Radens nummer i filen, där rubrikraden är rad 1. */
  rad: number
  namn: string
  /** null när raden har fel och inte importeras. */
  produkt: Matkatalograd | null
  fel: string[]
  varningar: string[]
}

export interface Matimportresultat {
  /** Fel som gäller hela filen. Då importeras ingenting. */
  filfel: string[]
  rader: Matradresultat[]
}

const MALTIDER: readonly Katalogmaltid[] = ['frukost', 'lunch_middag', 'dessert', 'mellanmal']
const TORKNING = ['frystorkad', 'lufttorkad'] as const
const TILLAGNING = ['varmt', 'kallt', 'varmt_eller_kallt', 'inget'] as const
const ADRESS = /^https?:\/\//

/** Rimlig energitäthet för torr mat. Utanför spannet är kcal eller vikten troligen fel. */
const KCAL_PER_100G = { min: 100, max: 700 }

/** Allergener som en vegetarisk respektive vegansk påse inte bör innehålla. */
const INTE_VEGETARISK: readonly Allergen[] = ['fisk', 'kraftdjur', 'blotdjur']
const INTE_VEGANSK: readonly Allergen[] = [...INTE_VEGETARISK, 'mjolk', 'agg']

type Tolkat<T> = { ok: true; varde: T } | { ok: false; fel: string }

function heltal(text: string, kolumn: string, min: number, max: number): Tolkat<number | null> {
  if (text === '') return { ok: true, varde: null }
  if (!/^\d+$/.test(text) || Number(text) < min || Number(text) > max) return { ok: false, fel: `${kolumn}: heltal mellan ${min} och ${max}, inte "${text}"` }
  return { ok: true, varde: Number(text) }
}

function decimaltal(text: string, kolumn: string): Tolkat<number | null> {
  if (text === '') return { ok: true, varde: null }
  const t = text.replace(',', '.')
  if (!/^\d+(\.\d)?$/.test(t) || Number(t) > 9999.9) return { ok: false, fel: `${kolumn}: tal med högst en decimal, till exempel 24,5, inte "${text}"` }
  return { ok: true, varde: Number(t) }
}

function janej(text: string, kolumn: string): Tolkat<boolean | null> {
  const t = text.toLowerCase()
  if (t === '') return { ok: true, varde: null }
  if (t === 'ja' || t === 'nej') return { ok: true, varde: t === 'ja' }
  return { ok: false, fel: `${kolumn}: ja, nej eller tom cell, inte "${text}"` }
}

function val<T extends string>(text: string, kolumn: string, tillatna: readonly T[]): Tolkat<T | null> {
  if (text === '') return { ok: true, varde: null }
  if ((tillatna as readonly string[]).includes(text)) return { ok: true, varde: text as T }
  return { ok: false, fel: `${kolumn}: ${tillatna.join(', ')} eller tom cell, inte "${text}"` }
}

/** Butikernas storleksord, som inte är en del av namnet: "- Stort format", "– Dubbelportion", "Big Portion", "1-port". */
const STORLEKSORD = [
  // "- Stort format", "- Storformat", "- Stor portion", "– Dubbelportion", "- Dubbelportionsformat" och felstavningar som "Dubbelporton".
  /\s*[-–]\s*(stort?\s*format|litet?\s*format|(stor|liten|dubbel|enkel|doppel|einzel)\s*port\w*)\s*$/i,
  /\s*\b(big|small|double|single) portion\b/i,
  /\s*\b\d+\s*-\s*port(ion(er)?)?\b\.?/i,
  /\s*\(\d+\s*port(ion(er)?)?\)/i,
  // En tom parentes som blev kvar efter att storleken togs bort.
  /\s*\(\s*\)\s*$/,
]

/** Namn som är för allmänna för att hjälpa någon att hitta en viss påse, till exempel "Laks". */
const FOR_ALLMANNA = new Set(['laks', 'lax', 'gryta', 'gryte', 'soppa', 'suppe', 'pasta', 'curry', 'gröt', 'porridge', 'müsli', 'muesli', 'granola', 'dessert'])

/**
 * Andra namn på en påse, till exempel det svenska, separerade med semikolon. Namn som bara är siffror ("8021") eller
 * för allmänna ("Laks") tas bort, liksom butikernas storleksord ("- Stort format", "1-port") och dubbletter och namn
 * som är samma som påsens eget namn. Ordningen behålls, så det första som blir kvar är det som visas.
 * Andra namn används bara för sökningen, aldrig för allergener eller kost, även när de säger glutenfri eller vegan.
 */
export function rensaAndraNamn(namn: string, text: string): { namn: string[]; borttagna: string[] } {
  const ut: string[] = []
  const borttagna: string[] = []
  const sedda = new Set([namn.trim().toLowerCase()])
  for (const ratt of text.split(';')) {
    let n = ratt.trim()
    if (!n) continue
    for (const re of STORLEKSORD) n = n.replace(re, '').trim()
    const nyckel = n.toLowerCase()
    if (!n || /^\d+$/.test(n) || FOR_ALLMANNA.has(nyckel)) {
      borttagna.push(ratt.trim())
      continue
    }
    if (sedda.has(nyckel)) continue
    sedda.add(nyckel)
    ut.push(n.slice(0, 200))
  }
  return { namn: ut, borttagna }
}

/** Kommaseparerade nycklar. Tom cell är okänt (null), "inga" är en tom lista. */
export function tolkaAllergener(text: string, kolumn: string): Tolkat<Allergen[] | null> {
  const t = text.trim().toLowerCase()
  if (t === '') return { ok: true, varde: null }
  if (t === 'inga') return { ok: true, varde: [] }
  const nycklar = t.split(',').map((s) => s.trim()).filter(Boolean)
  const okanda = nycklar.filter((n) => !arAllergen(n))
  if (okanda.length) return { ok: false, fel: `${kolumn}: okänd nyckel ${okanda.map((o) => `"${o}"`).join(', ')}. Se listan i docs/katalog/matkatalog.md.` }
  return { ok: true, varde: [...new Set(nycklar)] as Allergen[] }
}

/** Kontrollerar en rad och gör om den till en påse. Fel stoppar raden, varningar gör det inte. */
export function tolkaMatrad(rad: number, falt: Record<string, string>): Matradresultat {
  const fel: string[] = []
  const varningar: string[] = []
  const namn = [falt.marke, falt.namn].filter(Boolean).join(' ') || '(utan namn)'

  function ta<T>(t: Tolkat<T>, reserv: T): T {
    if (t.ok) return t.varde
    fel.push(t.fel)
    return reserv
  }

  const marke = falt.marke ?? ''
  const produktnamn = falt.namn ?? ''
  if (!marke) fel.push('marke: saknas')
  if (!produktnamn) fel.push('namn: saknas')
  // Påsen sparas som en rätt med namnet "Märke Namn", och en rätt har högst 80 tecken.
  if (marke && produktnamn && marke.length + 1 + produktnamn.length > 80) fel.push('marke och namn: högst 80 tecken tillsammans')
  const maltid = ta(val(falt.maltid, 'maltid', MALTIDER), null)
  if (falt.maltid === '') fel.push('maltid: saknas')
  const vikt = ta(heltal(falt.vikt_torr_g, 'vikt_torr_g', 1, 5000), null)
  if (falt.vikt_torr_g === '') fel.push('vikt_torr_g: saknas')
  let portioner = ta(heltal(falt.portioner, 'portioner', 1, 10), null)
  if (falt.portioner === '') {
    portioner = 1
    varningar.push('portioner: tom, räknas som 1')
  }
  const kcal = ta(heltal(falt.kcal, 'kcal', 1, 20000), null)
  if (falt.kcal === '') fel.push('kcal: saknas')

  const allergener = ta(tolkaAllergener(falt.allergener, 'allergener'), null)
  const spar = ta(tolkaAllergener(falt.spar, 'spar'), null)
  const vegetarisk = ta(janej(falt.vegetarisk, 'vegetarisk'), null)
  const vegansk = ta(janej(falt.vegansk, 'vegansk'), null)
  const glutenfri = ta(janej(falt.glutenfri, 'glutenfri'), null)
  const laktosfri = ta(janej(falt.laktosfri, 'laktosfri'), null)
  if (vegansk === true && vegetarisk !== true) fel.push('vegansk: ja kräver att vegetarisk också är ja')

  const pris = ta(heltal(falt.pris_sek_ca, 'pris_sek_ca', 0, 100000), null)
  const prisKalla = falt.pris_kalla || null
  if (prisKalla && !ADRESS.test(prisKalla)) fel.push('pris_kalla: ska börja med http:// eller https://')
  if (prisKalla && pris === null) fel.push('pris_kalla: får bara vara ifylld när pris_sek_ca är ifyllt')
  const kalla = falt.kalla ?? ''
  const andraNamn = rensaAndraNamn(produktnamn, falt.andra_namn ?? '')
  if (andraNamn.borttagna.length) varningar.push(`andra_namn: tog bort ${andraNamn.borttagna.map((b) => `"${b}"`).join(', ')}`)
  if (!ADRESS.test(kalla)) fel.push('kalla: tillverkarens sida, ska börja med http:// eller https://')
  // Astras datum är när hon hämtade uppgifterna. Det sparas inte: kontrollerad sätts bara av grundarna efter
  // ett stickprov, så kolumnen läses inte alls.

  const produkt: Matkatalograd = {
    marke,
    namn: produktnamn,
    andra_namn: andraNamn.namn,
    maltid: maltid ?? 'frukost',
    torkning: ta(val(falt.torkning, 'torkning', TORKNING), null),
    vikt_torr_g: vikt ?? 0,
    portioner: portioner ?? 1,
    kcal: kcal ?? 0,
    protein_g: ta(decimaltal(falt.protein_g, 'protein_g'), null),
    fett_g: ta(decimaltal(falt.fett_g, 'fett_g'), null),
    kolhydrater_g: ta(decimaltal(falt.kolhydrater_g, 'kolhydrater_g'), null),
    vatten_ml: ta(heltal(falt.vatten_ml, 'vatten_ml', 0, 5000), null),
    tillagning_vatten: ta(val(falt.tillagning_vatten, 'tillagning_vatten', TILLAGNING), null),
    tillagning_min: ta(heltal(falt.tillagning_min, 'tillagning_min', 0, 240), null),
    vegetarisk,
    vegansk,
    glutenfri,
    laktosfri,
    allergener,
    spar,
    pris_sek_ca: pris,
    pris_kalla: prisKalla,
    kalla,
    kontrollerad: null,
  }

  if (fel.length) return { rad, namn, produkt: null, fel, varningar }

  const per100 = Math.round((produkt.kcal * 100) / produkt.vikt_torr_g)
  if (per100 < KCAL_PER_100G.min || per100 > KCAL_PER_100G.max)
    varningar.push(`${per100} kcal per 100 g, kontrollera att kcal och vikt gäller hela påsen`)
  if (allergener === null) varningar.push('allergener: okända, påsen visas inte när man filtrerar på allergener')
  if (allergener && spar) {
    const bada = spar.filter((s) => allergener.includes(s))
    if (bada.length) varningar.push(`spar: ${bada.join(', ')} står också under allergener`)
  }
  if (allergener && vegansk === true && allergener.some((a) => INTE_VEGANSK.includes(a))) varningar.push('vegansk: ja men allergenerna innehåller animaliskt')
  else if (allergener && vegetarisk === true && allergener.some((a) => INTE_VEGETARISK.includes(a)))
    varningar.push('vegetarisk: ja men allergenerna innehåller fisk, kräftdjur eller blötdjur')
  if (allergener && glutenfri === true && allergener.includes('gluten')) varningar.push('glutenfri: ja men allergenerna innehåller gluten')

  return { rad, namn, produkt, fel, varningar }
}

/** Kontrollerar en hel fil. Rubrikraden ska ha exakt kolumnerna i MATKOLUMNER, i den ordningen. */
export function importeraMatkatalog(text: string): Matimportresultat {
  const { kolumner, rader } = lasCsv(text)
  if (kolumner.join(';') !== MATKOLUMNER.join(';')) {
    const saknas = MATKOLUMNER.filter((k) => !kolumner.includes(k))
    const okanda = kolumner.filter((k) => !(MATKOLUMNER as readonly string[]).includes(k))
    const filfel = [
      ...saknas.map((k) => `Kolumnen ${k} saknas.`),
      ...okanda.map((k) => `Okänd kolumn: ${k || '(tom rubrik)'}.`),
    ]
    if (!filfel.length) filfel.push('Kolumnerna står i fel ordning.')
    return { filfel, rader: [] }
  }

  const sedda = new Map<string, number>()
  const resultat = rader.map(({ rad, falt, antalFalt }): Matradresultat => {
    if (antalFalt !== kolumner.length) {
      const namn = [falt.marke, falt.namn].filter(Boolean).join(' ') || '(utan namn)'
      return { rad, namn, produkt: null, fel: [`raden har ${antalFalt} fält, rubrikraden har ${kolumner.length}`], varningar: [] }
    }
    const r = tolkaMatrad(rad, falt)
    if (!r.produkt) return r
    const nyckel = `${r.produkt.marke.toLowerCase()}|${r.produkt.namn.toLowerCase()}`
    const forra = sedda.get(nyckel)
    if (forra !== undefined) return { ...r, produkt: null, fel: [`samma märke och namn som rad ${forra}`] }
    sedda.set(nyckel, rad)
    return r
  })
  return { filfel: [], rader: resultat }
}

export function godkandaPasar(resultat: Matimportresultat): Matkatalograd[] {
  return resultat.rader.flatMap((r) => (r.produkt ? [r.produkt] : []))
}

function sqlVarde(v: string | number | boolean | readonly string[] | null): string {
  if (v === null) return 'null'
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (Array.isArray(v)) return v.length ? `array[${v.map((x) => sqlVarde(x)).join(', ')}]::text[]` : `'{}'::text[]`
  return `'${String(v).replaceAll("'", "''")}'`
}

/**
 * Seed-SQL för påsarna. En påse som redan finns (samma märke och namn, utan hänsyn till stora och små
 * bokstäver) uppdateras, så samma lista kan köras igen i en ny migrering när CSV:n har ändrats.
 */
export function matSeedSql(pasar: readonly Matkatalograd[], kallfiler: readonly string[]): string {
  const huvud = [
    `-- Matkatalogen från ${kallfiler.join(', ')}.`,
    '-- Skapad med "npm run matkatalog". Ändra inte filen för hand: ändra CSV:n och skapa en ny migrering.',
    '',
  ]
  if (pasar.length === 0) return [...huvud, '-- Inga påsar.', ''].join('\n')
  const rader = pasar.map((p) => `  (${MATKOLUMNER.map((k) => sqlVarde(p[k])).join(', ')})`)
  const uppdatera = MATKOLUMNER.map((k) => `  ${k} = excluded.${k}`)
  return [
    ...huvud,
    `insert into public.matprodukter (${MATKOLUMNER.join(', ')}) values`,
    rader.join(',\n'),
    'on conflict (lower(marke), lower(namn)) do update set',
    `${uppdatera.join(',\n')};`,
    '',
  ].join('\n')
}

/** Det som skriptet skriver ut för en fil. */
export function matrapport(filnamn: string, resultat: Matimportresultat): string {
  const ut: string[] = [filnamn]
  for (const f of resultat.filfel) ut.push(`  FEL I FILEN: ${f}`)
  for (const r of resultat.rader) {
    const p = r.produkt
    const detaljer = p ? ` · ${p.maltid} · ${p.vikt_torr_g} g · ${p.kcal} kcal` : ''
    ut.push(`  ${p ? 'OK ' : 'FEL'} rad ${r.rad}: ${r.namn}${detaljer}`)
    for (const f of r.fel) ut.push(`        fel: ${f}`)
    for (const w of r.varningar) ut.push(`        varning: ${w}`)
  }
  const in_ = godkandaPasar(resultat)
  const medVarning = resultat.rader.filter((r) => r.produkt && r.varningar.length).length
  ut.push(`  Summa: ${in_.length} av ${resultat.rader.length} rader importeras. ${resultat.rader.length - in_.length} stoppas av fel, ${medVarning} har varningar.`)
  return ut.join('\n')
}
