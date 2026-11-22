// Importen av produktkatalogen. CSV-filerna i supabase/katalog är huvudlistan, och härifrån skapas seed-SQL:en.
// Rena funktioner: text in, resultat ut. Skriptet scripts/katalog.mjs läser filerna och skriver migreringen.
import { kategoriForUnder } from './forrad'
import { granskning } from './granskning'
import { ALLA_EGENSKAPSNYCKLAR, egenskaperFor, tolkaEgenskap, valideraEgenskaper, type Egenskapsvarde } from './produktegenskaper'
import type { KallaTyp } from './typer'

/** En produkt som den sparas i tabellen produkter. */
export interface KatalogProdukt {
  marke: string
  modell: string
  version: string | null
  kategori: string
  underkategori: string
  packvikt_g: number
  minvikt_g: number | null
  pris_sek_ca: number | null
  ean: string | null
  kalla: string
  /** Dagen en grundare stickprovskontrollerade genomgången raden ingick i. */
  kontrollerad: string | null
  /** Dagen vikten jämfördes med tillverkarens sida. */
  granskad: string | null
  /** 'butik' när vikten kommer från butikens sida eftersom tillverkaren saknar vikt. */
  kalla_typ: KallaTyp
  /** Genomgången raden kom med, till exempel 2026-11-22-xxl-talt. Finns bara i CSV:n, inte i databasen. */
  genomgang: string | null
  egenskaper: Record<string, Egenskapsvarde>
}

export interface Radresultat {
  /** Radens nummer i filen, där rubrikraden är rad 1. */
  rad: number
  namn: string
  /** null när raden har fel och inte importeras. */
  produkt: KatalogProdukt | null
  fel: string[]
  varningar: string[]
}

export interface Importresultat {
  /** Fel som gäller hela filen, till exempel en kolumn som saknas. Då importeras ingenting. */
  filfel: string[]
  rader: Radresultat[]
}

/** Kolumner som är gemensamma för alla produkter. Övriga kolumner är egenskaper för en underkategori. */
const GEMENSAMMA = ['marke', 'modell', 'version', 'underkategori', 'packvikt_g', 'minvikt_g', 'pris_sek_ca', 'ean', 'kalla', 'kontrollerad_datum', 'granskad_datum', 'kalla_typ', 'genomgang', 'kommentar']
const MASTE_FINNAS = ['marke', 'modell', 'underkategori', 'packvikt_g', 'kalla']

/** Delar upp en rad på semikolon. Ett fält inom citattecken får innehålla semikolon, och "" är ett citattecken. */
function delaRad(rad: string): string[] {
  const falt: string[] = []
  let nu = ''
  let iCitat = false
  for (let i = 0; i < rad.length; i++) {
    const c = rad[i]
    if (iCitat) {
      if (c === '"' && rad[i + 1] === '"') {
        nu += '"'
        i++
      } else if (c === '"') iCitat = false
      else nu += c
    } else if (c === '"' && nu === '') iCitat = true
    else if (c === ';') {
      falt.push(nu)
      nu = ''
    } else nu += c
  }
  falt.push(nu)
  return falt.map((f) => f.trim())
}

/** Läser en CSV med semikolon som avgränsare. Kolumnerna hittas efter namn, så ordningen spelar ingen roll. */
export function lasCsv(text: string): { kolumner: string[]; rader: { rad: number; falt: Record<string, string>; antalFalt: number }[] } {
  const linjer = text.replace(/^﻿/, '').split(/\r?\n/)
  const kolumner = delaRad(linjer[0] ?? '').map((k) => k.toLowerCase())
  const rader = []
  for (let i = 1; i < linjer.length; i++) {
    if (!linjer[i].trim()) continue
    const delar = delaRad(linjer[i])
    const falt: Record<string, string> = {}
    kolumner.forEach((k, n) => (falt[k] = delar[n] ?? ''))
    rader.push({ rad: i + 1, falt, antalFalt: delar.length })
  }
  return { kolumner, rader }
}

function heltal(text: string): number | null {
  return /^\d+$/.test(text) ? Number(text) : null
}

/** Kommentarer som börjar så anger att vikten kommer från butikens sida. */
export const BUTIKSKOMMENTAR = 'Vikt och uppgifter från'

/** Genomgångens id: datum, butik och kategori, till exempel 2026-11-22-xxl-talt. */
const GENOMGANG = /^\d{4}-\d{2}-\d{2}-[a-z0-9]+(-[a-z0-9]+)*$/

export function arDatum(text: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false
  const d = new Date(`${text}T12:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === text
}

/** Kontrollerar en rad och gör om den till en produkt. Fel stoppar raden, varningar gör det inte. */
export function tolkaRad(rad: number, falt: Record<string, string>): Radresultat {
  const fel: string[] = []
  const varningar: string[] = []
  const v = (kolumn: string) => falt[kolumn] ?? ''

  const marke = v('marke')
  const modell = v('modell')
  const version = v('version') || null
  if (!marke) fel.push('marke: saknas')
  if (!modell) fel.push('modell: saknas')

  const underkategori = v('underkategori').toLowerCase()
  const kategori = kategoriForUnder(underkategori)
  if (!underkategori) fel.push('underkategori: saknas')
  else if (!kategori) fel.push(`underkategori: "${underkategori}" finns inte`)

  const packvikt = heltal(v('packvikt_g'))
  if (!v('packvikt_g')) fel.push('packvikt_g: saknas')
  else if (packvikt === null || packvikt <= 0) fel.push('packvikt_g: ska vara hela gram, större än 0')

  let minvikt: number | null = null
  if (v('minvikt_g')) {
    minvikt = heltal(v('minvikt_g'))
    if (minvikt === null || minvikt <= 0) fel.push('minvikt_g: ska vara hela gram, större än 0')
    else if (packvikt !== null && packvikt > 0 && minvikt > packvikt) fel.push('minvikt_g: är större än packvikt_g')
  }

  let pris: number | null = null
  if (v('pris_sek_ca')) {
    pris = heltal(v('pris_sek_ca'))
    if (pris === null) fel.push('pris_sek_ca: ska vara hela kronor')
  }

  const ean = v('ean') || null
  if (ean && !/^\d{8,14}$/.test(ean)) fel.push('ean: ska vara 8 till 14 siffror')

  const kalla = v('kalla')
  if (!kalla) fel.push('kalla: saknas')
  else if (!/^https?:\/\/\S+$/.test(kalla)) fel.push('kalla: ska vara en adress som börjar med http:// eller https://')

  const kontrollerad = v('kontrollerad_datum') || null
  if (kontrollerad && !arDatum(kontrollerad)) fel.push('kontrollerad_datum: ska vara ett datum, till exempel 2026-11-19')

  const granskad = v('granskad_datum') || null
  if (granskad && !arDatum(granskad)) fel.push('granskad_datum: ska vara ett datum, till exempel 2026-11-22')

  const kallaTypText = v('kalla_typ').toLowerCase()
  if (kallaTypText && kallaTypText !== 'tillverkare' && kallaTypText !== 'butik') fel.push('kalla_typ: ska vara tillverkare eller butik, eller vara tom')
  const kallaTyp: KallaTyp = kallaTypText === 'butik' ? 'butik' : 'tillverkare'
  const butikskommentar = v('kommentar').startsWith(BUTIKSKOMMENTAR)
  if (kallaTyp === 'butik' && !butikskommentar) fel.push(`kalla_typ: butik kräver att kommentaren börjar med "${BUTIKSKOMMENTAR}"`)
  if (kallaTyp === 'tillverkare' && butikskommentar) fel.push('kalla_typ: kommentaren säger att vikten kommer från butiken, sätt kalla_typ till butik')
  if (kallaTyp === 'butik' && granskad) fel.push('granskad_datum: en butiksrad kan inte vara granskad mot tillverkaren')
  if (kallaTyp === 'butik' && kontrollerad) fel.push('kontrollerad_datum: en butiksrad kan inte vara stickprovskontrollerad')
  if (kontrollerad && !granskad) fel.push('kontrollerad_datum: kräver granskad_datum')

  const genomgang = v('genomgang') || null
  if (genomgang && !GENOMGANG.test(genomgang)) fel.push('genomgang: ska se ut som 2026-11-22-xxl-talt (datum, butik, kategori)')

  // Egenskaperna för radens underkategori. Det som står i andra egenskapskolumner sparas inte.
  const egenskaper: Record<string, Egenskapsvarde> = {}
  const definitioner = kategori ? egenskaperFor(underkategori) : []
  for (const e of definitioner) {
    if (!v(e.nyckel)) continue
    const tolkad = tolkaEgenskap(e, v(e.nyckel))
    if ('fel' in tolkad) fel.push(`${e.nyckel}: ${tolkad.fel}`)
    else egenskaper[e.nyckel] = tolkad.varde
  }
  if (kategori) {
    const utanfor = [...ALLA_EGENSKAPSNYCKLAR].filter((n) => v(n) && !definitioner.some((e) => e.nyckel === n))
    if (utanfor.length) varningar.push(`${utanfor.join(', ')}: används inte för ${underkategori} och sparas inte`)
    const kontroll = valideraEgenskaper(underkategori, egenskaper)
    fel.push(...kontroll.fel)
    varningar.push(...kontroll.varningar)
  }

  const namn = [marke, modell, version].filter(Boolean).join(' ') || '(utan namn)'
  if (fel.length || !kategori || packvikt === null) return { rad, namn, produkt: null, fel, varningar }
  return {
    rad,
    namn,
    produkt: {
      marke,
      modell,
      version,
      kategori: kategori.nyckel,
      underkategori,
      packvikt_g: packvikt,
      minvikt_g: minvikt,
      pris_sek_ca: pris,
      ean,
      kalla,
      kontrollerad,
      granskad,
      kalla_typ: kallaTyp,
      genomgang,
      egenskaper,
    },
    fel,
    varningar,
  }
}

/** Samma nyckel som det unika indexet i databasen: märke, modell och version utan hänsyn till stora och små bokstäver. */
function produktnyckel(p: KatalogProdukt): string {
  return [p.marke, p.modell, p.version ?? ''].map((x) => x.toLowerCase()).join('|')
}

/** Läser och kontrollerar en hel CSV-fil. Raderna med produkt är de som importeras. */
export function importera(text: string): Importresultat {
  const { kolumner, rader } = lasCsv(text)
  const filfel: string[] = []
  for (const k of MASTE_FINNAS) if (!kolumner.includes(k)) filfel.push(`Kolumnen ${k} saknas.`)
  for (const k of kolumner) {
    if (!GEMENSAMMA.includes(k) && !ALLA_EGENSKAPSNYCKLAR.has(k)) filfel.push(`Okänd kolumn: ${k || '(tom rubrik)'}.`)
  }
  if (new Set(kolumner).size !== kolumner.length) filfel.push('Samma kolumn finns flera gånger.')
  if (filfel.length) return { filfel, rader: [] }

  const sedda = new Map<string, number>()
  const seddaEan = new Map<string, number>()
  // Kommentaren är fri text och står sist. Innehåller den ett semikolon utan citattecken blir raden för lång,
  // men alla andra kolumner står rätt. Då räcker en varning, eftersom kommentaren ändå inte sparas.
  const kommentarSist = kolumner.at(-1) === 'kommentar'
  const resultat = rader.map(({ rad, falt, antalFalt }): Radresultat => {
    const forLang = antalFalt > kolumner.length && kommentarSist
    if (antalFalt !== kolumner.length && !forLang) {
      const namn = [falt.marke, falt.modell].filter(Boolean).join(' ') || '(utan namn)'
      return { rad, namn, produkt: null, fel: [`raden har ${antalFalt} fält, rubrikraden har ${kolumner.length}`], varningar: [] }
    }
    const r = tolkaRad(rad, falt)
    if (forLang) r.varningar.push('kommentar: innehåller semikolon, sätt den inom citattecken')
    if (!r.produkt) return r
    const nyckel = produktnyckel(r.produkt)
    const forra = sedda.get(nyckel)
    const forraEan = r.produkt.ean ? seddaEan.get(r.produkt.ean) : undefined
    if (forra !== undefined) return { ...r, produkt: null, fel: [`samma märke, modell och version som rad ${forra}`] }
    if (forraEan !== undefined) return { ...r, produkt: null, fel: [`ean: samma som rad ${forraEan}`] }
    sedda.set(nyckel, rad)
    if (r.produkt.ean) seddaEan.set(r.produkt.ean, rad)
    return r
  })
  return { filfel: [], rader: resultat }
}

/** Raderna som importeras. */
export function godkanda(resultat: Importresultat): KatalogProdukt[] {
  return resultat.rader.flatMap((r) => (r.produkt ? [r.produkt] : []))
}

function sqlText(varde: string | null): string {
  return varde === null ? 'null' : `'${varde.replaceAll("'", "''")}'`
}

function sqlTal(varde: number | null): string {
  return varde === null ? 'null' : String(varde)
}

const KOLUMNER = ['marke', 'modell', 'version', 'kategori', 'underkategori', 'packvikt_g', 'minvikt_g', 'pris_sek_ca', 'ean', 'kalla', 'kontrollerad', 'granskad', 'kalla_typ', 'egenskaper']

/**
 * Seed-SQL för produkterna. En produkt som redan finns (samma märke, modell och version, utan hänsyn till
 * stora och små bokstäver) uppdateras, också stavningen av namnet,
 * så samma lista kan köras igen i en ny migrering när CSV:n har ändrats.
 */
export function seedSql(produkter: KatalogProdukt[], kallfiler: string[]): string {
  const huvud = [
    `-- Produktkatalogen från ${kallfiler.join(', ')}.`,
    '-- Skapad med "npm run katalog". Ändra inte filen för hand: ändra CSV:n och skapa en ny migrering.',
    '',
  ]
  if (produkter.length === 0) return [...huvud, '-- Inga produkter.', ''].join('\n')
  const rader = produkter.map((p) => {
    const varden = [
      sqlText(p.marke),
      sqlText(p.modell),
      sqlText(p.version),
      sqlText(p.kategori),
      sqlText(p.underkategori),
      sqlTal(p.packvikt_g),
      sqlTal(p.minvikt_g),
      sqlTal(p.pris_sek_ca),
      sqlText(p.ean),
      sqlText(p.kalla),
      sqlText(p.kontrollerad),
      sqlText(p.granskad),
      sqlText(p.kalla_typ),
      `${sqlText(JSON.stringify(p.egenskaper))}::jsonb`,
    ]
    return `  (${varden.join(', ')})`
  })
  // Märke, modell och version skrivs också över. En konflikt uppstår bara när de är lika bortsett från
  // stora och små bokstäver, så det enda som kan ändras är stavningen, till exempel EXPED till Exped.
  const uppdatera = KOLUMNER.map((k) => `  ${k} = excluded.${k}`)
  return [
    ...huvud,
    `insert into public.produkter (${KOLUMNER.join(', ')}) values`,
    rader.join(',\n'),
    "on conflict (lower(marke), lower(modell), lower(coalesce(version, ''))) do update set",
    `${uppdatera.join(',\n')};`,
    '',
  ].join('\n')
}

/** Nivån som skriptet visar för en rad. Butiksrader får ingen nivå och visas som butik. */
export function nivaText(p: KatalogProdukt): 'stickprovskontrollerad' | 'granskad' | 'butik' | 'inte granskad' {
  if (p.kalla_typ === 'butik') return 'butik'
  const niva = granskning(p).niva
  return niva === 'stickprov' ? 'stickprovskontrollerad' : niva === 'granskad' ? 'granskad' : 'inte granskad'
}

/** Rapporten som visas innan seed-SQL:en skapas: varje rad med fel och varningar, och en summering. */
export function rapport(filnamn: string, resultat: Importresultat): string {
  const ut: string[] = [filnamn]
  for (const f of resultat.filfel) ut.push(`  FEL I FILEN: ${f}`)
  for (const r of resultat.rader) {
    const p = r.produkt
    const detaljer = p ? ` · ${p.underkategori} · ${p.packvikt_g} g · ${nivaText(p)}` : ''
    ut.push(`  ${p ? 'OK ' : 'FEL'} rad ${r.rad}: ${r.namn}${detaljer}`)
    for (const f of r.fel) ut.push(`        fel: ${f}`)
    for (const w of r.varningar) ut.push(`        varning: ${w}`)
  }
  const in_ = godkanda(resultat)
  const stoppade = resultat.rader.length - in_.length
  const medVarning = resultat.rader.filter((r) => r.produkt && r.varningar.length).length
  const antalNiva = (n: ReturnType<typeof nivaText>) => in_.filter((p) => nivaText(p) === n).length
  ut.push(
    `  Summa: ${in_.length} av ${resultat.rader.length} rader importeras (${antalNiva('stickprovskontrollerad')} stickprovskontrollerade, ${antalNiva('granskad')} granskade, ${antalNiva('butik')} butik, ${antalNiva('inte granskad')} inte granskade). ` +
      `${stoppade} stoppas av fel, ${medVarning} har varningar.`,
  )
  return ut.join('\n')
}
