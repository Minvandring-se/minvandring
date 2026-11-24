import { sakFranProdukt } from './produktsok'
import type { Produkt } from './typer'

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

/** Underkategorin för bränsle: gaspatroner, sprit och annat som brinner. */
export const BRANSLE = 'bransle'

function harEn417(brannare: Egenskaper): boolean {
  return typeof brannare?.patronfaste === 'string' && brannare.patronfaste.toUpperCase().includes('EN 417')
}

/**
 * Passar bränslet till brännaren? En skruvpatron passar en gasbrännare, utom när patronfästet är angivet och inte är
 * EN 417, och en multibränslebrännare bara när patronfästet är EN 417. Bensin och fotogen passar multibränsle, sprit
 * passar sprit och fast bränsle passar fast bränsle. Ved och "annat" kopplas inte till något.
 */
export function passarBransle(brannare: Egenskaper, bransle: Egenskaper): boolean {
  const kok = brannare?.bransle
  switch (bransle?.typ) {
    case 'skruvpatron':
      if (kok === 'gas') return saknasText(brannare?.patronfaste) || harEn417(brannare)
      return kok === 'multibransle' && harEn417(brannare)
    case 'bensin':
    case 'fotogen':
      return kok === 'multibransle'
    case 'sprit':
      return kok === 'sprit'
    case 'fast_bransle':
      return kok === 'fast_bransle'
    default:
      return false
  }
}

function saknasText(varde: unknown): boolean {
  return typeof varde !== 'string' || varde.trim() === ''
}

type Koksak = { id: string; underkategori: string; egenskaper?: Egenskaper; packvikt_g?: number | null }

/** Rubriken för listan över det som passar, eller null när produkten inte hör till köket. */
export function passarMedRubrik(underkategori: string): string | null {
  if (arVarmare(underkategori)) return 'Kokkärl och stekpannor som passar'
  if (underkategori === KOKKARL) return 'Brännare och kök det passar på'
  return null
}

/** Rubriken för listan över bränsle eller brännare, eller null när produkten inte har med bränsle att göra. */
export function bransleRubrik(underkategori: string): string | null {
  if (arVarmare(underkategori)) return 'Bränsle som passar'
  if (underkategori === BRANSLE) return 'Brännare och kök det passar till'
  return null
}

/** Bränslet som passar en brännare eller ett komplett kök, eller brännarna och köken som passar ett bränsle. Lättast först. */
export function bransleMed<P extends Koksak>(produkt: Koksak, kandidater: P[]): P[] {
  let traffar: P[] = []
  if (arVarmare(produkt.underkategori)) {
    traffar = kandidater.filter((k) => k.underkategori === BRANSLE && passarBransle(produkt.egenskaper, k.egenskaper))
  } else if (produkt.underkategori === BRANSLE) {
    traffar = kandidater.filter((k) => arVarmare(k.underkategori) && passarBransle(k.egenskaper, produkt.egenskaper))
  }
  return traffar.filter((k) => k.id !== produkt.id).sort((a, b) => (a.packvikt_g ?? Infinity) - (b.packvikt_g ?? Infinity))
}

/** Kokkärlssystemet två produkter delar, till exempel trangia_27, eller null när de inte delar något. */
export function gemensamtSystem(a: Egenskaper, b: Egenskaper): string | null {
  const s = a?.system
  return typeof s === 'string' && s && b?.system === s ? s : null
}

/**
 * Det bland kandidaterna som passar ihop med produkten: kokkärl till en brännare eller ett komplett kök, och brännare
 * och kompletta kök till ett kokkärl. Det som är gjort för samma kokkärlssystem kommer först, sedan resten, och inom
 * varje grupp det lättaste först. Produkten själv tas aldrig med.
 */
export function passarMed<P extends Koksak>(produkt: Koksak, kandidater: P[]): P[] {
  let traffar: P[] = []
  if (arVarmare(produkt.underkategori)) {
    traffar = kandidater.filter((k) => k.underkategori === KOKKARL && passarIhop(produkt.egenskaper, k.egenskaper))
  } else if (produkt.underkategori === KOKKARL) {
    traffar = kandidater.filter((k) => arVarmare(k.underkategori) && passarIhop(k.egenskaper, produkt.egenskaper))
  }
  const forst = (k: P) => (gemensamtSystem(produkt.egenskaper, k.egenskaper) ? 0 : 1)
  return traffar
    .filter((k) => k.id !== produkt.id)
    .sort((a, b) => forst(a) - forst(b) || (a.packvikt_g ?? Infinity) - (b.packvikt_g ?? Infinity))
}

/** Den sammanlagda vikten för en brännare och de kokkärl man har valt till den, i gram. */
export function kokvikt(delar: readonly { packvikt_g: number }[]): number {
  return delar.reduce((summa, d) => summa + d.packvikt_g, 0)
}

/**
 * Sakerna som läggs i förrådet när man sparar sitt kök: brännaren och de valda kokkärlen och bränslet, var för sig och med
 * koppling till katalogen. Brännaren tas inte med om den redan finns i förrådet, och samma kokkärl bara en gång.
 */
export function sakerForKok(brannare: Produkt, valda: readonly Produkt[], brannarenFinns: boolean) {
  const unika = valda.filter((v, i) => v.id !== brannare.id && valda.findIndex((x) => x.id === v.id) === i)
  return [...(brannarenFinns ? [] : [brannare]), ...unika].map(sakFranProdukt)
}
