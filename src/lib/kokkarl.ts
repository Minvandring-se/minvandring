/**
 * Vad som passar ihop i köket: brännare och kompletta kök på ena sidan, kokkärl och stekpannor på den andra.
 * Ett kokkärlssystem (egenskapen system, till exempel trangia_27) anges bara när tillverkaren säger vad som passar.
 */
type Egenskaper = Record<string, unknown> | null | undefined

/** Underkategorierna som värmer: brännare utan kokkärl och kompletta kök. */
export const KOKVARMARE = ['brannare', 'komplett_kok'] as const

/** Underkategorin för lösa kokkärl och stekpannor. */
export const KOKKARL = 'kastrull'

function arVarmare(underkategori: string): boolean {
  return (KOKVARMARE as readonly string[]).includes(underkategori)
}

/** Brännare som tar vanliga kastruller: de står fritt eller sitter på patronen och har öppna pannstöd. */
const OPPNA_TYPER = new Set(['toppmonterat', 'slangkok', 'annat'])

/**
 * Passar kokkärlet på brännaren? Har brännaren ett kokkärlssystem passar bara kokkärl i samma system. En öppen
 * brännare tar alla kokkärl utom de som tillverkaren säger bara fungerar med sitt eget kök (bara_system). Systemkök
 * och stormkök utan angivet system är byggda för sina egna kastruller, så där passar inget annat.
 */
export function passarIhop(brannare: Egenskaper, kokkarl: Egenskaper): boolean {
  const brannarsystem = brannare?.system
  if (typeof brannarsystem === 'string' && brannarsystem) return kokkarl?.system === brannarsystem
  if (kokkarl?.bara_system === true) return false
  return typeof brannare?.typ === 'string' && OPPNA_TYPER.has(brannare.typ)
}

type Koksak = { id: string; underkategori: string; egenskaper?: Egenskaper; packvikt_g?: number | null }

/** Rubriken för listan över det som passar, eller null när produkten inte hör till köket. */
export function passarMedRubrik(underkategori: string): string | null {
  if (arVarmare(underkategori)) return 'Kokkärl och stekpannor som passar'
  if (underkategori === KOKKARL) return 'Brännare och kök det passar på'
  return null
}

/**
 * Det bland kandidaterna som passar ihop med produkten, lättast först: kokkärl till en brännare eller ett komplett
 * kök, och brännare och kompletta kök till ett kokkärl. Produkten själv tas aldrig med.
 */
export function passarMed<P extends Koksak>(produkt: Koksak, kandidater: P[]): P[] {
  let traffar: P[] = []
  if (arVarmare(produkt.underkategori)) {
    traffar = kandidater.filter((k) => k.underkategori === KOKKARL && passarIhop(produkt.egenskaper, k.egenskaper))
  } else if (produkt.underkategori === KOKKARL) {
    traffar = kandidater.filter((k) => arVarmare(k.underkategori) && passarIhop(k.egenskaper, produkt.egenskaper))
  }
  return traffar.filter((k) => k.id !== produkt.id).sort((a, b) => (a.packvikt_g ?? Infinity) - (b.packvikt_g ?? Infinity))
}
