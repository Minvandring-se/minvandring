// Stickprovsrutinen för produktkatalogen: urval, checklista och ändringar i CSV-texten.
// Rena funktioner: text in, text ut. Skriptet scripts/katalog.mjs läser och skriver filerna.
import { lasCsv, type KatalogProdukt } from './katalogimport'

/** Andelen av genomgångens rader som ingår i stickprovet, och det minsta antalet. */
export const STICKPROV_ANDEL = 0.05
export const STICKPROV_MINST = 5
/** Så många märken ger minst en rad var. Är märkena fler väljs så många av dem slumpmässigt. */
export const STICKPROV_MAX_MARKEN = 10

/** Raderna som får ingå i en genomgångs stickprov: granskade mot tillverkaren, och inte butiksrader. */
export function stickprovskandidater(produkter: KatalogProdukt[], genomgang: string): KatalogProdukt[] {
  return produkter.filter((p) => p.genomgang === genomgang && p.granskad !== null && p.kalla_typ === 'tillverkare')
}

/** 5 procent av raderna men minst 5 (eller alla om det är färre), och minst en rad per märke upp till tio märken. */
export function stickprovsstorlek(antalRader: number, antalMarken: number): number {
  const procent = Math.ceil(antalRader * STICKPROV_ANDEL)
  return Math.min(antalRader, Math.max(STICKPROV_MINST, procent, Math.min(antalMarken, STICKPROV_MAX_MARKEN)))
}

/** En slumpgenerator som ger samma följd för samma frö (mulberry32), så att ett urval går att återskapa. */
export function slumpgenerator(fro: number): () => number {
  let s = fro >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function blanda<T>(lista: T[], slump: () => number): T[] {
  const ut = [...lista]
  for (let i = ut.length - 1; i > 0; i--) {
    const j = Math.floor(slump() * (i + 1))
    ;[ut[i], ut[j]] = [ut[j], ut[i]]
  }
  return ut
}

/**
 * Drar stickprovet ur kandidaterna: en slumpad rad per märke (högst tio märken, slumpade om de är fler),
 * och sedan slumpade rader ur resten tills urvalet har rätt storlek. Sorterat på märke och modell.
 */
export function dragStickprov(kandidater: KatalogProdukt[], fro: number): KatalogProdukt[] {
  const slump = slumpgenerator(fro)
  const marken = [...new Set(kandidater.map((p) => p.marke.toLowerCase()))].sort()
  const storlek = stickprovsstorlek(kandidater.length, marken.length)
  const valda = new Set<KatalogProdukt>()
  for (const marke of blanda(marken, slump).slice(0, STICKPROV_MAX_MARKEN)) {
    const raderAvMarket = kandidater.filter((p) => p.marke.toLowerCase() === marke)
    valda.add(raderAvMarket[Math.floor(slump() * raderAvMarket.length)])
  }
  for (const p of blanda(kandidater.filter((k) => !valda.has(k)), slump)) {
    if (valda.size >= storlek) break
    valda.add(p)
  }
  return [...valda].sort((a, b) => a.marke.localeCompare(b.marke, 'sv') || a.modell.localeCompare(b.modell, 'sv') || (a.version ?? '').localeCompare(b.version ?? '', 'sv'))
}

export const FELREGEL =
  'Hittar du ett fel: rätta raden i CSV:n, dra ett nytt stickprov av samma storlek ur resten av genomgången (nytt frö) och kontrollera det. ' +
  'Hittas fel igen görs genomgången om i sin helhet, eller så godkänns den inte. ' +
  'Ett stickprov visar inte att allt är rätt. Det fångar systematiska fel.'

/** Checklistan som skrivs till docs/katalog/stickprov/<genomgang>.md. */
export function checklista(genomgang: string, fro: number, urval: KatalogProdukt[], antalKandidater: number, idag: string): string {
  const rader = urval.flatMap((p, i) => [
    `### ${i + 1}. ${[p.marke, p.modell, p.version].filter(Boolean).join(' ')}`,
    '',
    `- Källa: ${p.kalla}`,
    `- Packvikt i katalogen: ${p.packvikt_g} g`,
    `- Minvikt i katalogen: ${p.minvikt_g === null ? 'saknas' : `${p.minvikt_g} g`}`,
    '- [ ] stämmer   [ ] fel',
    '- Anteckning:',
    '',
  ])
  return [
    `# Stickprov: ${genomgang}`,
    '',
    `Skapad ${idag}. Frö ${fro}. Urval: ${urval.length} av ${antalKandidater} rader som är granskade mot tillverkaren (butiksrader ingår inte).`,
    `Samma urval går att återskapa med: npm run katalog -- --stickprov ${genomgang} --frö ${fro}`,
    '',
    '## Regler',
    '',
    '- Öppna källan för varje rad och jämför vikt (och minvikt), mått och temperaturer med tillverkarens sida.',
    '- Genomgången kan godkännas om alla vikter stämmer.',
    `- ${FELREGEL}`,
    '- Godkänn med: npm run katalog -- --godkann ' + genomgang + ' (och skapa sedan en ny seed med --skriv).',
    '',
    '## Rader',
    '',
    ...rader,
  ].join('\n')
}

/** Delar en rad på semikolon utanför citattecken och behåller fälten som de står, med citattecken. */
function ravaFalt(rad: string): string[] {
  const falt: string[] = []
  let nu = ''
  let iCitat = false
  for (const tecken of rad) {
    if (tecken === '"') iCitat = !iCitat
    if (tecken === ';' && !iCitat) {
      falt.push(nu)
      nu = ''
    } else nu += tecken
  }
  falt.push(nu)
  return falt
}

/**
 * Sätter värdet i en kolumn på de rader där funktionen ger ett värde (null = rör inte raden).
 * Allt annat i texten lämnas orört: radslut, ordning och citattecken. Kolumnen får inte vara den sista.
 */
export function andraKolumn(text: string, kolumn: string, nyttVarde: (falt: Record<string, string>) => string | null): { text: string; antal: number } {
  const { kolumner, rader } = lasCsv(text)
  const i = kolumner.indexOf(kolumn)
  if (i === -1) throw new Error(`Kolumnen ${kolumn} saknas.`)
  if (i === kolumner.length - 1) throw new Error(`Kolumnen ${kolumn} är sist och kan inte ändras här.`)
  const linjer = text.split('\n')
  let antal = 0
  for (const { rad, falt } of rader) {
    const varde = nyttVarde(falt)
    if (varde === null) continue
    const delar = ravaFalt(linjer[rad - 1])
    if (delar[i] === varde) continue
    delar[i] = varde
    linjer[rad - 1] = delar.join(';')
    antal++
  }
  return { text: linjer.join('\n'), antal }
}

/** Nyckeln för en rad: märke, modell och version utan hänsyn till stora och små bokstäver. */
export function radnyckel(marke: string, modell: string, version: string | null): string {
  return [marke, modell, version ?? ''].map((x) => x.trim().toLowerCase()).join('|')
}

/** Läser nycklar (marke;modell;version, en per rad) ur en fil. Tomma rader och rader som börjar med # hoppas över. */
export function lasNycklar(text: string): { nyckel: string; text: string }[] {
  return text
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .filter((l) => l.trim() && !l.trim().startsWith('#'))
    .map((l) => {
      const [marke = '', modell = '', version = ''] = l.split(';').map((d) => d.trim())
      return { nyckel: radnyckel(marke, modell, version || null), text: [marke, modell, version].filter(Boolean).join(';') }
    })
}

/** Sätter godkand-datumet i loggen på raderna för genomgången. Ger antal rader som ändrades. */
export function godkandILogg(text: string, genomgang: string, datum: string): { text: string; antal: number } {
  const linjer = text.split('\n')
  const rubrik = ravaFalt(linjer[0].replace(/\r$/, '')).map((k) => k.trim().toLowerCase())
  const iGenomgang = rubrik.indexOf('genomgang')
  const iGodkand = rubrik.indexOf('godkand')
  if (iGenomgang === -1 || iGodkand === -1) throw new Error('Loggen saknar kolumnerna genomgang och godkand.')
  let antal = 0
  for (let n = 1; n < linjer.length; n++) {
    const slutar = linjer[n].endsWith('\r') ? '\r' : ''
    const delar = ravaFalt(linjer[n].replace(/\r$/, ''))
    if (delar[iGenomgang]?.trim() !== genomgang) continue
    delar[iGodkand] = datum
    linjer[n] = delar.join(';') + slutar
    antal++
  }
  return { text: linjer.join('\n'), antal }
}
