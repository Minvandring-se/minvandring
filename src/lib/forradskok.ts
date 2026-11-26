import { BRANSLE, KOKKARL, KOKVARMARE, bransleMed, passarMed } from './kokkarl'
import type { Forradssak } from './typer'

/**
 * Ditt kök i förrådet: en brännare eller ett komplett kök med de kokkärl och det bränsle man använder till det.
 * Delarna är vanliga saker i förrådet som pekar på köket med kok_id.
 */

/** Brännare och kompletta kök, som man kan bygga ett kök kring. */
export function arKok(sak: Pick<Forradssak, 'underkategori'>): boolean {
  return (KOKVARMARE as readonly (string | null)[]).includes(sak.underkategori)
}

/** Kokkärl, stekpannor och bränsle, som kan ingå i ett kök. */
export function arKokdel(sak: Pick<Forradssak, 'underkategori'>): boolean {
  return sak.underkategori === KOKKARL || sak.underkategori === BRANSLE
}

/** Delarna i köket, kokkärlen först och sedan bränslet. */
export function kokdelar(kok: Pick<Forradssak, 'id'>, saker: readonly Forradssak[]): Forradssak[] {
  const ordning = (s: Forradssak) => (s.underkategori === KOKKARL ? 0 : 1)
  return saker.filter((s) => s.kok_id === kok.id).sort((a, b) => ordning(a) - ordning(b) || a.namn.localeCompare(b.namn, 'sv'))
}

/** Köket en del hör till, eller null. */
export function kokForDel(del: Pick<Forradssak, 'kok_id'>, saker: readonly Forradssak[]): Forradssak | null {
  return del.kok_id ? (saker.find((s) => s.id === del.kok_id) ?? null) : null
}

function koksak(s: Forradssak) {
  return { id: s.id, underkategori: s.underkategori ?? '', egenskaper: s.produkter?.egenskaper, packvikt_g: s.vikt_g }
}

/**
 * Det i förrådet som kan läggas till i köket: kokkärl och bränsle som inte redan hör till ett kök. Det som enligt
 * katalogen passar kommer i passar (det lättaste först). Det som appen inte kan bedöma, för att köket eller delen är
 * inskriven för hand, kommer i ovriga. Det som enligt katalogen inte passar visas inte.
 */
export function kokkandidater(kok: Forradssak, saker: readonly Forradssak[]): { passar: Forradssak[]; ovriga: Forradssak[] } {
  const lediga = saker.filter((s) => s.id !== kok.id && arKokdel(s) && !s.kok_id)
  if (!kok.produkter) return { passar: [], ovriga: lediga }
  const franKatalogen = lediga.filter((s) => s.produkter)
  const k = koksak(kok)
  const ok = new Set([...passarMed(k, franKatalogen.map(koksak)), ...bransleMed(k, franKatalogen.map(koksak))].map((p) => p.id))
  const passar = franKatalogen.filter((s) => ok.has(s.id)).sort((a, b) => (a.vikt_g ?? Infinity) - (b.vikt_g ?? Infinity))
  return { passar, ovriga: lediga.filter((s) => !s.produkter) }
}

/** Vad köket väger med alla delar, i gram, och hur många av sakerna som saknar vikt. */
export function kokensVikt(kok: Forradssak, delar: readonly Forradssak[]): { viktG: number; utanVikt: number } {
  const alla = [kok, ...delar]
  return {
    viktG: alla.reduce((summa, s) => summa + (s.vikt_g ?? 0) * s.antal, 0),
    utanVikt: alla.filter((s) => s.vikt_g === null).length,
  }
}

/** Sakerna som väljs tillsammans i packlistan: köket och dess delar, eller bara saken när den inte har några delar. */
export function medKoket(id: string, saker: readonly Pick<Forradssak, 'id' | 'kok_id'>[]): string[] {
  return [id, ...saker.filter((s) => s.kok_id === id).map((s) => s.id)]
}
