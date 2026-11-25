// Handlingslistan: enheter för mängder och butikens avdelningar. Rena funktioner utan databas.
// Nycklarna står också i supabase/migrations/20261124230000_handlingslista.sql, och ett test kontrollerar det.

export const ENHETER = ['g', 'kg', 'dl', 'ml', 'st', 'msk', 'tsk', 'krm'] as const
export type Enhet = (typeof ENHETER)[number]

export const arEnhet = (v: string): v is Enhet => (ENHETER as readonly string[]).includes(v)

/** Avdelningarna i den ordning man går genom en svensk mataffär. */
export const AVDELNINGAR = [
  { nyckel: 'frukt_gront', etikett: 'Frukt och grönt' },
  { nyckel: 'brod', etikett: 'Bröd' },
  { nyckel: 'mejeri', etikett: 'Mejeri och ägg' },
  { nyckel: 'kott_fisk', etikett: 'Kött, fisk och chark' },
  { nyckel: 'torrvaror', etikett: 'Pasta, ris och gryn' },
  { nyckel: 'kryddor_konserver', etikett: 'Kryddor och konserver' },
  { nyckel: 'fryst', etikett: 'Fryst' },
  { nyckel: 'snacks', etikett: 'Godis, nötter och snacks' },
  { nyckel: 'dryck', etikett: 'Dryck, kaffe och te' },
  { nyckel: 'friluft', etikett: 'Friluftsmat' },
  { nyckel: 'ovrigt', etikett: 'Övrigt' },
] as const
export type Avdelning = (typeof AVDELNINGAR)[number]['nyckel']

export const arAvdelning = (v: string): v is Avdelning => AVDELNINGAR.some((a) => a.nyckel === v)

// Ord i varans namn som avgör avdelningen, i den ordning de prövas. Det första som passar gäller, så mer
// precisa ord står före allmänna ("kokosmjölk" före "mjölk", "knäckebröd" före "bröd").
const ORD: readonly [Avdelning, readonly string[]][] = [
  ['kryddor_konserver', ['kokosmjölk', 'buljong', 'fond', 'salt', 'peppar', 'krydd', 'olja', 'olivolja', 'vinäger', 'soja', 'ketchup', 'senap', 'tomatpuré', 'krossade tomater', 'konserv', 'bönor', 'linser', 'kikärt', 'tonfisk', 'sylt', 'honung', 'socker', 'pesto', 'ajvar', 'buljongtärning', 'curry', 'chili', 'kanel', 'mjöl ', 'vetemjöl']],
  ['snacks', ['choklad', 'godis', 'nötter', 'nötmix', 'cashew', 'mandel', 'jordnöt', 'chips', 'russin', 'torkad frukt', 'dadlar', 'bar ', 'proteinbar', 'kex', 'kakor', 'studentmix']],
  ['dryck', ['kaffe', 'te ', 'tepåse', 'kakao', 'saft', 'juice', 'läsk', 'vatten', 'sportdryck', 'buljongdryck']],
  ['brod', ['knäckebröd', 'tunnbröd', 'bröd', 'tortilla', 'wrap', 'polarbröd', 'bulle', 'kanelbulle']],
  ['kott_fisk', ['korv', 'salami', 'skinka', 'bacon', 'kött', 'färs', 'kyckling', 'lax', 'fisk', 'renskav', 'chark', 'pålägg', 'fläsk']],
  ['mejeri', ['mjölk', 'grädde', 'smör', 'ost', 'yoghurt', 'fil', 'kvarg', 'crème fraiche', 'ägg', 'mjölkpulver']],
  ['torrvaror', ['pasta', 'spagetti', 'makaroner', 'nudlar', 'ris', 'couscous', 'bulgur', 'quinoa', 'havregryn', 'gryn', 'müsli', 'flingor', 'potatismos', 'pulver']],
  ['frukt_gront', ['potatis', 'lök', 'vitlök', 'morot', 'gurka', 'tomat', 'paprika', 'äpple', 'banan', 'apelsin', 'citron', 'avokado', 'sallad', 'kål', 'svamp', 'frukt', 'grönsak', 'bär']],
  ['fryst', ['fryst', 'frysta', 'glass']],
]

/**
 * Avdelningen för en vara: den som är vald, eller en gissning utifrån namnet. Friluftsmat är för påsar ur
 * matkatalogen, och det som inte går att gissa hamnar i Övrigt.
 */
export function avdelningFor(namn: string, vald: string | null | undefined): Avdelning {
  if (vald && arAvdelning(vald)) return vald
  const n = ` ${namn.toLowerCase()} `
  for (const [avdelning, ord] of ORD) if (ord.some((o) => n.includes(o))) return avdelning
  return 'ovrigt'
}
