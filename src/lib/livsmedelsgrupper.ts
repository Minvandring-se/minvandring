// Livsmedlens grupper: vilka som är maträtter, och allergenerna för enkla råvaror. Rena funktioner utan databas.
// Reglerna står också i docs/katalog/livsmedel.md. Ändra båda ställena samtidigt.
import type { Allergen } from './kost'

/**
 * Grupperna i Livsmedelsverkets indelning som är färdiga rätter, inte råvaror. De kommer efter råvarorna när man
 * söker, eftersom man oftast skriver in det man själv köper och lagar.
 */
export const MATRATTSGRUPPER: readonly string[] = [
  'Kötträtt',
  'Sås i maträtt',
  'Cerealierätter t.ex. klimp, risotto, pannkakor med fyllning, couscous, smörgåsar',
  'Fisk- och skaldjursrätt',
  'Grönsaksrätter',
  'Potatisrätter',
  'Soppa',
  'Matpaj eller pizza',
  'Baljväxträtter',
  'Pastarätter',
  'Färdigsallad',
  'Äggrätter',
  'Svamprätter',
  'Smörgåsar',
  'Maträtter och efterrätter',
  'Livsmedelsrätter och ingredienser',
  'Pannkaka eller våffla',
  'Dessert',
]

export const arMatratt = (grupp: string | null): boolean => grupp !== null && MATRATTSGRUPPER.includes(grupp)

// ─── Allergener ──────────────────────────────────────────────────────────────

/** Grupperna där allt är mjölk eller gjort på mjölk. */
const MEJERI = ['Mjölk', 'Fil och yoghurt', 'Grädde', 'Smör', 'Hårdost', 'Lagrad ost', 'Halvhård ost', 'Mjukost', 'Ost', 'Färskost', 'Övriga ostprodukter', 'Mejeriprodukter', 'Övriga mjölkprodukter']

/** Enkla råvaror: grupper där allergenerna går att utläsa ur gruppen och namnet. */
const ENKLA = [
  ...MEJERI,
  'Ägg',
  'Fisk',
  'Fisk och skaldjur',
  'Rött kött',
  'Fågel',
  'Innanmat och inälvsmat',
  'Andra djurfetter',
  'Grönsaker och svamp',
  'Grönsaker, rotfrukter och svamp',
  'Frukt och bär',
  'Potatis och stärkelserika rötter',
  'Baljväxter',
  'Nöt, frö eller kärna',
  'Ris eller annat spannmål',
  // Inte 'Spannmål och spannmålsprodukter': gruppen blandar deg, lasagne och snacks, så allergenerna är okända.
  'Cerealier eller cerealielika mjölprodukter och derivat',
  'Pasta och liknande produkter',
  'Vegetabiliskt fett och olja',
  'Krydda',
  'Socker, honung eller sirap',
  'Vatten',
]

/**
 * Ord som visar att ett livsmedel i en enkel grupp ändå är sammansatt, till exempel "Kycklingfilé panerad",
 * "Leverpastej" eller "Risgrynsgröt". Då är allergenerna okända.
 */
// Bara "biff" räcker inte, eftersom Ryggbiff och Rostbiff är rena köttbitar.
const SAMMANSATT =
  /panerad|pastej|korv|pudding|bröd|kebab|marinerad|soppa|sås|gratäng|fyllning|färdig|smaksatt|kryddad|choklad|glass|kaka|kex|müsli|granola|gröt|margarin|gryta|sauté|stuvad|sufflé|palt|lasagne(?!plattor)|deg\b|sushi(?!ris)|masala|tikka|hemlagad|blandning(?!.*(\s|^)(vete|råg|korn|havre))|mix|grönsaksbas|buljong|fond\b|burgare|hasselback|saffransris|krokar|chips|leverbiff|grönsaksbiff|rödbetsbiff/

/** Pålägg kan innehålla mjölkprotein. Bara för kött och fågel, så att Champinjon skivad förblir enkel. */
const PALAGG = /skivad|tunna skivor/

/**
 * Livsmedel i Livsmedelsverkets råvarugrupper där allergenerna är kända trots att de är sammansatta. Listan tar med
 * allergener som troligen ingår, eftersom en varning för mycket är bättre än en för lite.
 */
const KANDA: readonly { grupp: string; namn: RegExp; allergener: readonly Allergen[] }[] = [
  // En blandning kan innehålla jordnötter.
  { grupp: 'Nöt, frö eller kärna', namn: /^nötter blandade (naturella|rostade m\. salt)$/, allergener: ['jordnotter', 'notter'] },
  { grupp: 'Spannmål och spannmålsprodukter', namn: /^deg filodeg/, allergener: ['gluten'] },
  { grupp: 'Spannmål och spannmålsprodukter', namn: /^lasagne nötfärs$/, allergener: ['gluten', 'agg', 'mjolk', 'selleri'] },
  { grupp: 'Innanmat och inälvsmat', namn: /^(lever|njur)palt$/, allergener: ['gluten'] },
  { grupp: 'Grönsaker, rotfrukter och svamp', namn: /^grönsakssufflé$/, allergener: ['gluten', 'agg', 'mjolk'] },
]

/**
 * "m." följt av något annat än salt, ben, skinn, skal, svål, lag, vatten, olja, fett eller ägg betyder att något
 * mer ingår, till exempel "Kyckling m. bacon jordnötter banan". Då är allergenerna okända.
 */
const MED_NAGOT = / m\. (?!salt|ben|skinn|skal|svål|lag\b|vatten|olja|fett|ägg)/

/** Vete utom bovete, som inte innehåller gluten. */
// Korn bara som spannmålet (Korngryn, Kornmjöl), inte "krossade korn" av bovete eller hirs.
const GLUTEN = /(?<!bo)vete|^råg|[\s-]råg|råg(mjöl|kross|flingor|kli)|^korn|[\s-]korn(gryn|mjöl|flingor)|\skorn\s.*(vete|råg|havre)|havre|dinkel|spelt|emmer|kamut|bulgur|couscous|mannagryn|seitan|graham/

const ORD: readonly [Allergen, RegExp][] = [
  ['gluten', GLUTEN],
  ['jordnotter', /jordnöt/],
  ['notter', /mandl|mandel(?!potatis)|hasselnöt|valnöt|cashew|pekannöt|paranöt|pistage|macadamia|nötmix|(^|\s)nötter/],
  ['sesam', /sesam|tahini/],
  ['soja', /soja|tofu|tempeh|edamame/],
  ['lupin', /lupin/],
  ['selleri', /selleri(?!kål)/],
  ['senap', /senap/],
  // Ägg som eget ord eller början på ett ord (Äggula, äggnudlar), inte "lägg" som i Lamm lägg.
  ['agg', /(^|[^a-zåäö])ägg/],
]

/** Kräftdjur och blötdjur, bara i fiskgrupperna, så att till exempel Ostronskivling inte räknas. */
const KRAFTDJUR = /räk|krabb|hummer|kräft|langust|scampi/
const BLOTDJUR = /mussl|ostron|bläckfisk|snäck|snigel|calamar/

/** Allergenerna i EU:s lista som orden i namnet visar, i listans ordning. */
function iNamnet(namn: string): Allergen[] {
  return ORD.filter(([, re]) => re.test(namn)).map(([a]) => a)
}

/**
 * Allergenerna för ett livsmedel, bara för enkla råvaror. null betyder okänt: sammansatta livsmedel och färdiga rätter
 * kan innehålla vad som helst, och okänt räknas aldrig som att livsmedlet passar. En tom lista betyder att det inte
 * innehåller någon av de 14.
 *
 * - Mejerigrupperna innehåller alltid mjölk, även laktosfria (mjölkprotein). Ägg innehåller ägg.
 * - Fisk innehåller fisk. I "Fisk och skaldjur" avgör namnet: räkor och kräftor är kräftdjur, musslor blötdjur.
 * - Pasta innehåller gluten om den inte är gjord på ris, majs eller baljväxter eller kallas glutenfri.
 * - Torkad frukt, fruktchips och tillagad rödkål är okända, eftersom de kan innehålla svaveldioxid.
 * - Raffinerade oljor räknas inte som allergener (EU:s undantag), utom sesam- och jordnötsolja. Vetegroddsolja och
 *   kallpressade oljor behåller allergenerna i namnet (vetegroddsolja är gluten).
 * - Några sammansatta livsmedel i råvarugrupperna har kända allergener (KANDA), till exempel Leverpalt.
 * - Annars avgör orden i namnet: vete, råg, korn, havre och dinkel är gluten, mandel och hasselnöt nötter, och så vidare.
 */
export function allergenerForLivsmedel(namn: string, grupp: string | null): Allergen[] | null {
  if (grupp === null) return null
  const n = namn.toLowerCase()
  const kand = KANDA.find((k) => k.grupp === grupp && k.namn.test(n))
  if (kand) return [...kand.allergener]
  if (!ENKLA.includes(grupp)) return null
  if (SAMMANSATT.test(n) || MED_NAGOT.test(n)) return null
  if ((grupp === 'Rött kött' || grupp === 'Fågel') && PALAGG.test(n)) return null
  if (grupp === 'Frukt och bär' && /torkad|torkade|torkat/.test(n)) return null
  if (/rödkål/.test(n) && /tillagad/.test(n)) return null
  if (grupp === 'Nöt, frö eller kärna' && /blandade/.test(n)) return null

  const ut = new Set<Allergen>(iNamnet(n))
  if (MEJERI.includes(grupp)) ut.add('mjolk')
  if (grupp === 'Ägg') ut.add('agg')
  if (grupp === 'Fisk' || grupp === 'Fisk och skaldjur') {
    if (KRAFTDJUR.test(n)) ut.add('kraftdjur')
    if (BLOTDJUR.test(n)) ut.add('blotdjur')
    // Skaldjur är inte fisk.
    if (!ut.has('kraftdjur') && !ut.has('blotdjur')) ut.add('fisk')
  }
  if (grupp === 'Pasta och liknande produkter' && !/(^|\s)ris|risnudl|glasnudl|majs|bön|lins|kikärt|mung|glutenfri/.test(n)) ut.add('gluten')
  // Undantaget gäller bara raffinerade oljor. Vetegroddsolja och kallpressade oljor behåller sina allergener.
  if (grupp === 'Vegetabiliskt fett och olja' && !/vetegrodd|kallpressad/.test(n)) {
    for (const a of [...ut]) if (a !== 'sesam' && a !== 'jordnotter') ut.delete(a)
  }
  const ordning: readonly Allergen[] = ['gluten', 'kraftdjur', 'agg', 'fisk', 'jordnotter', 'soja', 'mjolk', 'notter', 'selleri', 'senap', 'sesam', 'svaveldioxid', 'lupin', 'blotdjur']
  return ordning.filter((a) => ut.has(a))
}

// ─── Huvudgrupper och kost i matkatalogen ────────────────────────────────────

/**
 * Livsmedelsverkets drygt 90 grupper samlade i några huvudgrupper, som rutor att välja i matkatalogen. En grupp som
 * inte står här finns bara i sökningen.
 */
export const HUVUDGRUPPER: readonly { nyckel: string; etikett: string; grupper: readonly string[] }[] = [
  {
    nyckel: 'kott',
    etikett: 'Kött och fågel',
    grupper: ['Rött kött', 'Fågel', 'Innanmat och inälvsmat', 'Korv eller liknande produkt', 'Konserverat kött', 'Kött eller köttprodukter', 'Andra djurfetter'],
  },
  { nyckel: 'fisk', etikett: 'Fisk och skaldjur', grupper: ['Fisk', 'Fisk- och skaldjursprodukt', 'Fisk och skaldjur'] },
  { nyckel: 'mejeri', etikett: 'Mejeri och ägg', grupper: [...MEJERI, 'Ägg'] },
  {
    nyckel: 'spannmal',
    etikett: 'Gryn, pasta och bröd',
    grupper: [
      'Ris eller annat spannmål',
      'Pasta och liknande produkter',
      'Cerealier eller cerealielika mjölprodukter och derivat',
      'Spannmål och spannmålsprodukter',
      'Frukostflingor',
      'Ojäst bröd',
      'Jäst bröd',
      'Övriga bröd',
      'Baknings ingrediens',
    ],
  },
  { nyckel: 'gronsaker', etikett: 'Grönsaker och potatis', grupper: ['Grönsaker och svamp', 'Grönsaker, rotfrukter och svamp', 'Grönsaksprodukter', 'Potatis och stärkelserika rötter'] },
  { nyckel: 'frukt', etikett: 'Frukt och bär', grupper: ['Frukt och bär', 'Processad frukt och bär', 'Sylt eller marmelad'] },
  {
    nyckel: 'baljvaxter',
    etikett: 'Baljväxter, nötter och frön',
    grupper: ['Baljväxter', 'Vegetariska produkter', 'Vegetabiliska mejeriprodukter', 'Nöt, frö eller kärna', 'Nöt eller frö produkt'],
  },
  {
    nyckel: 'smak',
    etikett: 'Fett och smaksättning',
    grupper: [
      'Vegetabiliskt fett och olja',
      'Margarin och blandade fetter',
      'Krydda',
      'Kryddning eller extrakt',
      'Smaksättare, tex ketchup, sojasås, senap',
      'Kryddor smaksättare dressing röror',
      'Dressing, majonnäs',
      'Chutney eller pickle',
      'Smakämne eller essencer',
      'Socker, honung eller sirap',
    ],
  },
  {
    nyckel: 'sott',
    etikett: 'Sött och snacks',
    grupper: [
      'Choklad eller chokladprodukt',
      'Konfekt och annan sockerprodukt dvs ej choklad',
      'Snacks',
      'Söta kakor',
      'Bageriprodukter, söta och/eller feta',
      'Glass och annan frusen dessert med mejeriprodukter',
      'Dessertsås',
      'Socker och söta livsmedel',
    ],
  },
  {
    nyckel: 'dryck',
    etikett: 'Dryck',
    grupper: ['Dryck utan alkohol', 'Kaffe, te och kakao', 'Juice och nektar', 'Läsk', 'Vatten', 'Vin och vinliknande drycker', 'Likör eller sprit', 'Öl eller maltdryck', 'Cider och liknande drycker'],
  },
  { nyckel: 'ratter', etikett: 'Färdiga rätter', grupper: MATRATTSGRUPPER },
]

/** Huvudgruppen för en av Livsmedelsverkets grupper. null när gruppen inte hör till någon. */
export function huvudgruppFor(grupp: string | null): string | null {
  if (grupp === null) return null
  return HUVUDGRUPPER.find((h) => h.grupper.includes(grupp))?.nyckel ?? null
}

/** Grupper med enkla råvaror från växtriket. Med kända allergener går det att säga om livsmedlet är veganskt. */
const VAXTER = [
  'Grönsaker och svamp',
  'Grönsaker, rotfrukter och svamp',
  'Frukt och bär',
  'Potatis och stärkelserika rötter',
  'Baljväxter',
  'Nöt, frö eller kärna',
  'Ris eller annat spannmål',
  'Cerealier eller cerealielika mjölprodukter och derivat',
  'Pasta och liknande produkter',
  'Vegetabiliskt fett och olja',
  'Krydda',
  'Socker, honung eller sirap',
  'Vatten',
]

/** Allergener som kommer från djur. */
const FRAN_DJUR: readonly Allergen[] = ['mjolk', 'agg', 'fisk', 'kraftdjur', 'blotdjur']

/**
 * Kostvalen för ett livsmedel, utifrån gruppen och allergenerna. null betyder okänt, och okänt räknas aldrig som att
 * livsmedlet passar.
 * - Glutenfri och laktosfri: kända allergener utan gluten och utan mjölk. Med mjölk är det inte laktosfritt, eftersom
 *   databasen inte säger om laktosen är borttagen.
 * - Vegetarisk och vegansk: bara enkla råvaror från växtriket (VAXTER) och mejeri och ägg. Kött, fisk och skaldjur är
 *   varken eller. Honung är inte veganskt. Allt annat är okänt.
 */
export function kostForLivsmedel(namn: string, grupp: string | null, allergener: readonly Allergen[] | null) {
  const kand = allergener !== null
  const huvud = huvudgruppFor(grupp)
  // "Korv veg." ligger bland korvarna, så den är okänd i stället för kött.
  const franDjur = (huvud === 'kott' || huvud === 'fisk') && !/\bveg/i.test(namn)
  let vegetarisk: boolean | null = null
  let vegansk: boolean | null = null
  if (franDjur) {
    vegetarisk = false
    vegansk = false
  } else if (kand && grupp !== null && (VAXTER.includes(grupp) || huvud === 'mejeri')) {
    vegetarisk = !allergener.some((a) => a === 'fisk' || a === 'kraftdjur' || a === 'blotdjur')
    vegansk = vegetarisk && !allergener.some((a) => FRAN_DJUR.includes(a)) && !/honung/i.test(namn)
  }
  return {
    vegetarisk,
    vegansk,
    glutenfri: kand ? !allergener.includes('gluten') : null,
    laktosfri: kand ? !allergener.includes('mjolk') : null,
  }
}
