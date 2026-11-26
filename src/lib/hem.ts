// Sidan Hem: välkomstbandet, Att göra för nästa tur och inspirationen. Rena funktioner utan databas.
import type { Arstid } from './arstid'
import { uppraknade } from './kost'
import { maltidsAdress, type Matstatus } from './mat'
import { turdelAdress } from './turdelar'
import type { TurIListan } from './turlista'

const VECKODAGAR = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'] as const
const MANADER = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'] as const

function delar(datum: string): { ar: number; manad: number; dag: number } {
  const [ar, manad, dag] = datum.split('-').map(Number)
  return { ar, manad, dag }
}

const dagnummer = (datum: string) => {
  const { ar, manad, dag } = delar(datum)
  return Date.UTC(ar, manad - 1, dag) / 86_400_000
}

/** Dagens datum i bandet: "Torsdag 26 november". */
export function datumrubrik(idag: string): string {
  const { ar, manad, dag } = delar(idag)
  return `${VECKODAGAR[new Date(Date.UTC(ar, manad - 1, dag)).getUTCDay()]} ${dag} ${MANADER[manad - 1]}`
}

/** Förnamnet ur profilens namn: det första ordet. Tomt när namnet saknas. */
export function fornamn(namn: string): string {
  return namn.trim().split(/\s+/)[0] ?? ''
}

/**
 * Nedräkningen i bandet för en kommande tur: "8 dagar", "1 dag" eller "I dag" stort, och "till avfärd, 4 december"
 * under. null när turen saknar datum eller redan har börjat.
 */
export function bandNedrakning(tur: Pick<TurIListan, 'avresa'>, idag: string): { varde: string; text: string } | null {
  if (!tur.avresa || tur.avresa < idag) return null
  const kvar = dagnummer(tur.avresa) - dagnummer(idag)
  const { dag, manad } = delar(tur.avresa)
  const datum = `${dag} ${MANADER[manad - 1]}`
  if (kvar === 0) return { varde: 'I dag', text: `avfärd, ${datum}` }
  return { varde: kvar === 1 ? '1 dag' : `${kvar} dagar`, text: `till avfärd, ${datum}` }
}

export interface Attgora {
  nyckel: 'maltider' | 'gemensamt' | 'packat'
  text: string
  under: string
  till: string
}

/**
 * Att göra inför nästa tur, högst fyra rader, ur det som går att räkna fram:
 * - måltider som saknas i matplanen (länk till den första som saknas)
 * - gemensamma packrader som ska med men som ingen bär (namnen på de första tre)
 * - hur mycket av ens egen packlista som är packat, när något är kvar.
 * En tom lista betyder att inget är kvar att göra.
 */
export function attGora(
  tur: Pick<TurIListan, 'id' | 'namn'>,
  data: { mat: Matstatus | null; utanBarare: readonly { namn: string }[]; packat: { packat: number; totalt: number } | null },
): Attgora[] {
  const ut: Attgora[] = []
  const { mat, utanBarare, packat } = data
  if (mat && mat.saknas > 0)
    ut.push({
      nyckel: 'maltider',
      text: mat.saknas === 1 ? '1 måltid saknas' : `${mat.saknas} måltider saknas`,
      under: `Matplanen för ${tur.namn}`,
      till: mat.forsta ? maltidsAdress(tur.id, mat.forsta.dag.dag, mat.forsta.maltid) : turdelAdress(tur.id, 'mat'),
    })
  if (utanBarare.length > 0) {
    const namn = utanBarare.slice(0, 3).map((r, i) => (i === 0 ? r.namn : r.namn.charAt(0).toLowerCase() + r.namn.slice(1)))
    const fler = utanBarare.length - namn.length
    ut.push({
      nyckel: 'gemensamt',
      text: utanBarare.length === 1 ? '1 gemensam sak har ingen som bär' : `${utanBarare.length} gemensamma saker har ingen som bär`,
      under: fler > 0 ? `${namn.join(', ')} och ${fler} till` : uppraknade(namn),
      till: turdelAdress(tur.id, 'packning'),
    })
  }
  if (packat && packat.totalt > 0 && packat.packat < packat.totalt)
    ut.push({
      nyckel: 'packat',
      text: `Du har packat ${Math.round((packat.packat / packat.totalt) * 100)} %`,
      under: `Din packlista, ${packat.packat} av ${packat.totalt} ${packat.totalt === 1 ? 'sak' : 'saker'}`,
      till: turdelAdress(tur.id, 'packning'),
    })
  return ut.slice(0, 4)
}

/** Veckonumret enligt ISO 8601 (veckan börjar på måndag, vecka 1 innehåller årets första torsdag). */
export function veckonummer(datum: string): number {
  const { ar, manad, dag } = delar(datum)
  const d = new Date(Date.UTC(ar, manad - 1, dag))
  const veckodag = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - veckodag)
  const forsta = Date.UTC(d.getUTCFullYear(), 0, 1)
  return Math.ceil(((d.getTime() - forsta) / 86_400_000 + 1) / 7)
}

/** Veckans recept: samma hela veckan, och nästa vecka nästa recept i listan. null utan recept. */
export function veckansRecept<T>(recept: readonly T[], idag: string): T | null {
  if (recept.length === 0) return null
  const { ar } = delar(idag)
  return recept[(ar * 53 + veckonummer(idag)) % recept.length]
}

/**
 * Tipset för årstiden: vintern om bränsle i kyla, våren om att packa maten, sommaren om vatten och höstens om
 * energi. Bara guider som finns i src/lib/tips.ts.
 */
export const TIPS_FOR_ARSTID: Record<Arstid, { nyckel: string; etikett: string }> = {
  vinter: { nyckel: 'vatten-och-bransle', etikett: 'Tips för vintern' },
  var: { nyckel: 'packa', etikett: 'Tips för våren' },
  sommar: { nyckel: 'vatten-och-bransle', etikett: 'Tips för sommaren' },
  host: { nyckel: 'energi', etikett: 'Tips för hösten' },
}
