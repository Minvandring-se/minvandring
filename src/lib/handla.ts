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

// Ord i varans namn som avgör avdelningen. Det längsta ord som passar gäller, oavsett avdelning, så att
// "kanelbulle" går före "kanel" och "pepparkakor" före "peppar". Ord på högst fyra bokstäver ("ost", "te", "ris",
// "salt") räknas bara som hela ord, så att "frukost" inte blir ost och "baguette" inte blir te.
const ORD: Record<Exclude<Avdelning, 'friluft' | 'ovrigt'>, readonly string[]> = {
  kryddor_konserver: [
    'kokosmjölk', 'buljong', 'buljongtärning', 'fond', 'salt', 'peppar', 'krydda', 'kryddor', 'kryddmix', 'olja', 'olivolja', 'rapsolja',
    'vinäger', 'soja', 'sojasås', 'ketchup', 'senap', 'tomatpuré', 'krossade tomater', 'konserv', 'bönor', 'linser', 'kikärtor',
    'tonfisk', 'sylt', 'honung', 'socker', 'pesto', 'ajvar', 'curry', 'chili', 'kanel', 'soppa', 'tomatsoppa', 'varma koppen',
    'rostad lök', 'jordnötssmör', 'nutella', 'sirap', 'buljongpulver', 'lingonsylt', 'hallonsylt', 'jordgubbssylt',
  ],
  snacks: [
    'choklad', 'godis', 'nötter', 'nötmix', 'cashew', 'cashewnötter', 'mandel', 'mandlar', 'jordnöt', 'jordnötter', 'chips', 'russin',
    'torkad frukt', 'dadlar', 'proteinbar', 'müslibar', 'energibar', 'snickers', 'kex', 'kakor', 'pepparkakor', 'studentmix',
    'ostbågar', 'pinnar', 'salta pinnar', 'lökringar', 'popcorn', 'lakrits', 'mintkola', 'digestivekex', 'havrekex', 'mariekex',
  ],
  dryck: [
    'kaffe', 'snabbkaffe', 'pulverkaffe', 'te', 'tepåse', 'tepåsar', 'kakao', 'oboy', 'saft', 'juice', 'läsk', 'vatten', 'dryck',
    'sportdryck', 'buljongdryck', 'latte', 'cappuccino', 'blåbärssoppa', 'nyponsoppa', 'havredryck', 'mjölkdryck',
  ],
  brod: ['knäckebröd', 'tunnbröd', 'bröd', 'tortilla', 'tortillabröd', 'wrap', 'wraps', 'polarbröd', 'bulle', 'kanelbulle', 'baguette', 'krisprolls', 'grissini', 'skorpor', 'pitabröd'],
  kott_fisk: [
    'korv', 'salami', 'skinka', 'bacon', 'kött', 'köttfärs', 'färs', 'kyckling', 'lax', 'fisk', 'torsk', 'renskav', 'chark', 'pålägg',
    'fläsk', 'rostbiff', 'leverpastej', 'pastej', 'kaviar', 'makrill', 'sill', 'räkor', 'laxfilé', 'gravlax',
  ],
  mejeri: [
    'mjölk', 'grädde', 'smör', 'ost', 'mjukost', 'hushållsost', 'västerbottensost', 'smältost', 'parmesan', 'halloumi', 'fetaost',
    'yoghurt', 'fil', 'filmjölk', 'kvarg', 'crème fraiche', 'ägg', 'mjölkpulver', 'risifrutti', 'kesella', 'keso',
  ],
  torrvaror: [
    'pasta', 'spagetti', 'makaroner', 'nudlar', 'ris', 'couscous', 'bulgur', 'quinoa', 'havregryn', 'gryn', 'müsli', 'flingor',
    'potatismos', 'pulver', 'mjöl', 'vetemjöl', 'gröt', 'tortellini', 'granola', 'basmatiris', 'jasminris', 'fullkornsris', 'risgryn',
  ],
  frukt_gront: [
    'potatis', 'lök', 'vitlök', 'morot', 'morötter', 'gurka', 'tomat', 'tomater', 'paprika', 'äpple', 'äpplen', 'banan', 'bananer',
    'apelsin', 'citron', 'avokado', 'sallad', 'kål', 'svamp', 'frukt', 'grönsak', 'grönsaker', 'bär', 'melon', 'vattenmelon',
    'honungsmelon', 'blåbär', 'lingon', 'zucchini', 'broccoli', 'vitkål', 'rödkål',
  ],
  fryst: ['fryst', 'frysta', 'glass'],
}

/** Högst så här många bokstäver: då räknas ordet bara som ett helt ord. */
const KORT = 4

const ALLA_ORD = Object.entries(ORD)
  .flatMap(([avdelning, ord]) => ord.map((o) => ({ ord: o, avdelning: avdelning as Avdelning })))
  .sort((a, b) => b.ord.length - a.ord.length)

/** Sant när ordet finns i namnet: som ett helt ord för korta ord, annars var som helst. */
function finns(namn: string, ord: string): boolean {
  if (ord.length > KORT) return namn.includes(ord)
  return namn.split(/[^\p{L}]+/u).includes(ord)
}

/**
 * Avdelningen för en vara: den som är vald, eller en gissning utifrån namnet. Friluftsmat är för påsar ur
 * matkatalogen, och det som inte går att gissa hamnar i Övrigt.
 */
export function avdelningFor(namn: string, vald: string | null | undefined): Avdelning {
  if (vald && arAvdelning(vald)) return vald
  const n = namn.toLowerCase()
  return ALLA_ORD.find(({ ord }) => finns(n, ord))?.avdelning ?? 'ovrigt'
}
