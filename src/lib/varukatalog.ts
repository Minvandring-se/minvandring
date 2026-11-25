// Varukatalogen i appen: förslag när man skriver ingredienser, namnet som varan får i turen och det som är känt om
// allergener och kost. Rena funktioner utan databas.
import type { Kostinfo } from './kost'
import { MAX_VARUNAMN } from './mat'
import type { Varukatalogvara, Varukategori } from './typer'

/** Kategorierna som de visas, till exempel som bricka på ett förslag. */
export const KATEGORIETIKETT: Record<Varukategori, string> = {
  brod: 'Bröd',
  frukost: 'Frukost',
  ost_mejeri: 'Ost och mejeri',
  korv_chark: 'Korv och chark',
  snabbmat: 'Snabbmat',
  tuber_smaksattning: 'Tuber och smaksättning',
  mellanmal: 'Mellanmål',
  drycker: 'Dryck',
}

export type Katalogforslag = Pick<
  Varukatalogvara,
  'id' | 'marke' | 'namn' | 'kategori' | 'kcal_per_100g' | 'protein_per_100g' | 'vegetarisk' | 'vegansk' | 'glutenfri' | 'laktosfri' | 'allergener' | 'spar'
>

/** Namnet som varan får i turen eller receptet: märke och namn, högst 80 tecken som en vara. */
export function varunamnFor(v: Pick<Varukatalogvara, 'marke' | 'namn'>): string {
  return `${v.marke} ${v.namn}`.slice(0, MAX_VARUNAMN).trim()
}

/** Det som är känt om varans allergener och kostval, för varningarna. */
export function kostinfoForVara(v: Pick<Varukatalogvara, 'vegetarisk' | 'vegansk' | 'glutenfri' | 'laktosfri' | 'allergener' | 'spar'>): Kostinfo {
  return { vegetarisk: v.vegetarisk, vegansk: v.vegansk, glutenfri: v.glutenfri, laktosfri: v.laktosfri, allergener: v.allergener, spar: v.spar }
}

const ord = (text: string) =>
  text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)

/**
 * De bästa förslagen för det man har skrivit: alla ord måste finnas i märket eller namnet. Först varor där märke och
 * namn börjar med det man skrivit, sedan där ett ord börjar med det första sökordet, sedan övriga, och vid lika det
 * kortaste namnet.
 */
export function rangordnaVaror<T extends Pick<Varukatalogvara, 'marke' | 'namn'>>(kandidater: readonly T[], sok: string, max = 3): T[] {
  const sokord = ord(sok)
  if (sokord.length === 0) return []
  const fras = sokord.join(' ')
  return kandidater
    .flatMap((k) => {
      const text = ord(`${k.marke} ${k.namn}`).join(' ')
      if (!sokord.every((s) => text.includes(s))) return []
      const t = text.startsWith(fras) || ord(k.namn).join(' ').startsWith(fras) ? 0 : text.split(' ').some((o) => o.startsWith(sokord[0])) ? 1 : 2
      return [{ k, t, langd: text.length }]
    })
    .sort((a, b) => a.t - b.t || a.langd - b.langd || a.k.namn.localeCompare(b.k.namn, 'sv'))
    .slice(0, max)
    .map((x) => x.k)
}

/** Mönstret som databasen söker med (ilike): det längsta ordet. null när det man skrivit är för kort. */
export function varumonster(sok: string): string | null {
  const o = ord(sok)
  if (o.length === 0 || sok.trim().length < 2) return null
  return o.reduce((a, b) => (b.length > a.length ? b : a))
}
