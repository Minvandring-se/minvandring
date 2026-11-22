// Granskningsnivåerna för en produkt i katalogen. Samma regler används i appen och i katalogverktygen.
import { datumText } from './datum'
import type { KallaTyp } from './typer'

/** Det som avgör nivån. kalla_typ är 'butik' när vikten kommer från butikens sida, eftersom tillverkaren saknar vikt. */
export interface Granskningsuppgifter {
  /** Dagen en grundare stickprovskontrollerade genomgången raden ingick i. */
  kontrollerad: string | null
  /** Dagen vikten jämfördes med tillverkarens sida. */
  granskad: string | null
  kalla_typ: KallaTyp
}

export type Granskningsniva = 'stickprov' | 'granskad' | 'ingen'

export interface Granskningsvisning {
  niva: Granskningsniva
  /** Texten i märket. null när raden inte har någon nivå och därför inget märke. */
  marke: string | null
  /** Förklaringen under märket, eller texten i detaljen när det inte finns något märke. */
  forklaring: string
}

/** Nivån och texterna för en produkt. Ett märke per rad: den högsta nivån. Butiksrader får aldrig någon nivå. */
export function granskning(p: Granskningsuppgifter): Granskningsvisning {
  if (p.kalla_typ === 'butik') {
    return { niva: 'ingen', marke: null, forklaring: 'Vikten kommer från butikens sida, eftersom tillverkaren saknar vikt.' }
  }
  if (p.kontrollerad) {
    return {
      niva: 'stickprov',
      marke: 'Stickprovskontrollerad',
      forklaring: `Uppgifterna ingår i en genomgång som MinVandring har stickprovskontrollerat mot tillverkarnas sidor ${datumText(p.kontrollerad)}.`,
    }
  }
  if (p.granskad) {
    return { niva: 'granskad', marke: 'Granskad mot tillverkaren', forklaring: `Vikten är jämförd med tillverkarens uppgifter ${datumText(p.granskad)}.` }
  }
  return { niva: 'ingen', marke: null, forklaring: 'Uppgifterna kommer från tillverkaren men är inte jämförda än.' }
}
