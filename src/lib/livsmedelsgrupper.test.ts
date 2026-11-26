import { describe, expect, it } from 'vitest'
import { allergenerForLivsmedel, arMatratt, HUVUDGRUPPER, huvudgruppFor, kostForLivsmedel, MATRATTSGRUPPER } from './livsmedelsgrupper'

describe('arMatratt', () => {
  it('räknar färdiga rätter som maträtter, men inte råvaror', () => {
    expect(arMatratt('Kötträtt')).toBe(true)
    expect(arMatratt('Soppa')).toBe(true)
    expect(arMatratt('Pasta och liknande produkter')).toBe(false)
    expect(arMatratt(null)).toBe(false)
    expect(new Set(MATRATTSGRUPPER).size).toBe(MATRATTSGRUPPER.length)
  })
})

describe('allergenerForLivsmedel', () => {
  const a = allergenerForLivsmedel

  it('ger mjölk för mejerier, ägg för ägg och fisk för fisk', () => {
    expect(a('Mjölk standard fett 3%', 'Mjölk')).toEqual(['mjolk'])
    expect(a('Mjölk laktosfri', 'Mjölk')).toEqual(['mjolk'])
    expect(a('Äggula rå', 'Ägg')).toEqual(['agg'])
    expect(a('Lax odlad rå', 'Fisk')).toEqual(['fisk'])
  })

  it('räknar skaldjur som kräftdjur eller blötdjur och inte som fisk, även i gruppen Fisk', () => {
    expect(a('Räka kokt', 'Fisk och skaldjur')).toEqual(['kraftdjur'])
    expect(a('Krabba kokt', 'Fisk')).toEqual(['kraftdjur'])
    expect(a('Bläckfisk rå', 'Fisk')).toEqual(['blotdjur'])
    expect(a('Blåmussla kokt', 'Fisk och skaldjur')).toEqual(['blotdjur'])
  })

  it('ger gluten för vete, råg, korn, havre och dinkel, men inte för bovete, hirs, ris eller majs', () => {
    expect(a('Vetemjöl', 'Cerealier eller cerealielika mjölprodukter och derivat')).toEqual(['gluten'])
    expect(a('Havregryn fullkorn', 'Ris eller annat spannmål')).toEqual(['gluten'])
    expect(a('Korngryn ångprep. fullkorn', 'Ris eller annat spannmål')).toEqual(['gluten'])
    expect(a('Bovete hela el. krossade korn', 'Ris eller annat spannmål')).toEqual([])
    expect(a('Hirs hela el. krossade korn fullkorn', 'Ris eller annat spannmål')).toEqual([])
    expect(a('Ris vildris okokt', 'Ris eller annat spannmål')).toEqual([])
    expect(a('Majsgryn polenta kokt m. salt', 'Ris eller annat spannmål')).toEqual([])
  })

  it('ger gluten för pasta utom pasta av ris, majs eller bönor, glasnudlar och glutenfri pasta', () => {
    expect(a('Pasta okokt', 'Pasta och liknande produkter')).toEqual(['gluten'])
    expect(a('Nudlar äggnudlar okokta', 'Pasta och liknande produkter')).toEqual(['gluten', 'agg'])
    expect(a('Nudlar glasnudlar okokta', 'Pasta och liknande produkter')).toEqual([])
    expect(a('Pasta tagliatelle m. ägg okokt glutenfri', 'Pasta och liknande produkter')).toEqual(['agg'])
  })

  it('läser nötter, jordnötter, soja, sesam och selleri ur namnet, utan att förväxla dem med liknande ord', () => {
    expect(a('Hasselnötter', 'Nöt, frö eller kärna')).toEqual(['notter'])
    expect(a('Mandlar sötmandel', 'Nöt, frö eller kärna')).toEqual(['notter'])
    expect(a('Sellerikål pak choi', 'Grönsaker och svamp')).toEqual([])
    expect(a('Sojabönor torkade', 'Baljväxter')).toEqual(['soja'])
    expect(a('Sesamolja', 'Vegetabiliskt fett och olja')).toEqual(['sesam'])
    expect(a('Rotselleri', 'Grönsaker och svamp')).toEqual(['selleri'])
    expect(a('Potatis mandelpotatis rå', 'Potatis och stärkelserika rötter')).toEqual([])
    expect(a('Lamm lägg rå', 'Rött kött')).toEqual([])
    expect(a('Ostronskivling', 'Grönsaker och svamp')).toEqual([])
  })

  it('räknar raffinerade oljor som fria från allergener, utom sesam- och jordnötsolja', () => {
    expect(a('Sojaolja', 'Vegetabiliskt fett och olja')).toEqual([])
    // Vetegroddsolja är oftast kallpressad, så undantaget för raffinerade oljor gäller inte.
    expect(a('Vetegroddsolja', 'Vegetabiliskt fett och olja')).toEqual(['gluten'])
  })

  it('ger tom lista för enkla råvaror utan allergener', () => {
    expect(a('Nöt ryggbiff rå', 'Rött kött')).toEqual([])
    expect(a('Linser torkade', 'Baljväxter')).toEqual([])
    expect(a('Äpple', 'Frukt och bär')).toEqual([])
  })

  it('är okänd för sammansatta livsmedel, maträtter, torkad frukt och grupper som inte är enkla', () => {
    expect(a('Risgrynsgröt', 'Ris eller annat spannmål')).toBeNull()
    expect(a('Flygande Jakob kyckling m. bacon jordnötter banan', 'Fågel')).toBeNull()
    expect(a('Kycklingfilé panerad', 'Fågel')).toBeNull()
    expect(a('Aprikos torkad', 'Frukt och bär')).toBeNull()
    expect(a('Köttbullar', 'Kötträtt')).toBeNull()
    expect(a('Chips', 'Snacks')).toBeNull()
    expect(a('Okänt', null)).toBeNull()
  })
})

// De 34 livsmedlen i felsökningen 26 november (Claude outputs/livsmedel/misstankta.md) som räknades som "inga
// allergener". De sju säkra får sina allergener, resten blir okända.
describe('allergenerForLivsmedel, de misstänkta livsmedlen', () => {
  const misstankta: readonly [number, string, string, readonly string[] | null][] = [
    [3140, 'Nötter blandade naturella', 'Nöt, frö eller kärna', ['jordnotter', 'notter']],
    [3139, 'Nötter blandade rostade m. salt', 'Nöt, frö eller kärna', ['jordnotter', 'notter']],
    [1642, 'Deg filodeg kylvara el. frysvara', 'Spannmål och spannmålsprodukter', ['gluten']],
    [6346, 'Lasagne nötfärs', 'Spannmål och spannmålsprodukter', ['gluten', 'agg', 'mjolk', 'selleri']],
    [1471, 'Leverpalt', 'Innanmat och inälvsmat', ['gluten']],
    [1472, 'Njurpalt', 'Innanmat och inälvsmat', ['gluten']],
    [530, 'Grönsakssufflé', 'Grönsaker, rotfrukter och svamp', ['gluten', 'agg', 'mjolk']],
    [1479, 'Leverbiff mald lever stekt hemlagad', 'Innanmat och inälvsmat', null],
    [1473, 'Leverbiff mald lever rå frysvara', 'Innanmat och inälvsmat', null],
    [1467, 'Leverbiff mald lever stekt frysvara', 'Innanmat och inälvsmat', null],
    [1465, 'Gryta levergryta nöt', 'Innanmat och inälvsmat', null],
    [1464, 'Leversauté kyckling', 'Innanmat och inälvsmat', null],
    [1466, 'Njursauté', 'Innanmat och inälvsmat', null],
    [6391, 'Gryta kyckling tikka masala', 'Fågel', null],
    [478, 'Gryta kikärtsgryta grönsaksgryta veg.', 'Grönsaker, rotfrukter och svamp', null],
    [306, 'Morot stuvad', 'Grönsaker och svamp', null],
    [458, 'Champinjon stuvad', 'Grönsaker, rotfrukter och svamp', null],
    [2081, 'Kantarell stuvad', 'Grönsaker, rotfrukter och svamp', null],
    [6438, 'Grönsaksbas grönsakspasta', 'Grönsaker och svamp', null],
    [6399, 'Grönsaksbiff rödbetsbiff stekt veg.', 'Potatis och stärkelserika rötter', null],
    [4128, 'Potatis Hasselbackspotatis bakad', 'Potatis och stärkelserika rötter', null],
    [2758, 'Sushi veg.', 'Ris eller annat spannmål', null],
    [5305, 'Saffransris', 'Ris eller annat spannmål', null],
    [6870, 'Våffelmix glutenfri', 'Cerealier eller cerealielika mjölprodukter och derivat', null],
    [1099, 'Kycklingburgare rå fett ca 7% frysvara', 'Fågel', null],
    [5973, 'Kryddblandning taco', 'Krydda', null],
    [6865, 'Mjölblandning ljus glutenfri', 'Cerealier eller cerealielika mjölprodukter och derivat', null],
    [4011, 'Majskrokar', 'Spannmål och spannmålsprodukter', null],
    [41, 'Vetegroddsolja', 'Vegetabiliskt fett och olja', ['gluten']],
    [3522, 'Bananchips', 'Frukt och bär', null],
    [1010, 'Gris skinka skivad rökt fett 1-3%', 'Rött kött', null],
    [6009, 'Kalkon rökt tunna skivor', 'Fågel', null],
    [1101, 'Hamburgare nöt rå frysvara', 'Rött kött', null],
    [453, 'Rödkål tillagad', 'Grönsaker och svamp', null],
  ]

  it('har alla 34', () => {
    expect(new Set(misstankta.map(([nr]) => nr)).size).toBe(34)
  })

  it.each(misstankta)('%i %s', (_nr, namn, grupp, vantat) => {
    expect(allergenerForLivsmedel(namn, grupp)).toEqual(vantat)
  })

  it('låter rena råvaror med liknande ord vara som förut', () => {
    const a = allergenerForLivsmedel
    expect(a('Nöt ryggbiff rå', 'Rött kött')).toEqual([])
    expect(a('Nöt rostbiff rå', 'Rött kött')).toEqual([])
    expect(a('Champinjon skivad frysvara', 'Grönsaker och svamp')).toEqual([])
    expect(a('Sellerikål pak choi', 'Grönsaker och svamp')).toEqual([])
    expect(a('Hasselnötter', 'Nöt, frö eller kärna')).toEqual(['notter'])
    expect(a('Rapsolja kallpressad', 'Vegetabiliskt fett och olja')).toEqual([])
    expect(a('Sojaolja', 'Vegetabiliskt fett och olja')).toEqual([])
    expect(a('Ris sushiris kokt', 'Ris eller annat spannmål')).toEqual([])
    expect(a('Pasta fusilli lasagneplattor okokt glutenfri', 'Pasta och liknande produkter')).toEqual([])
    // En blandning som räknar upp sina sädesslag har kända allergener.
    expect(a('Grynblandning havre råg vete korn kokt m. salt', 'Ris eller annat spannmål')).toEqual(['gluten'])
    expect(a('Mjölblandning rågsikt', 'Cerealier eller cerealielika mjölprodukter och derivat')).toEqual(['gluten'])
  })
})
describe('huvudgrupper', () => {
  it('lägger varje grupp i högst en huvudgrupp', () => {
    const alla = HUVUDGRUPPER.flatMap((h) => h.grupper)
    expect(new Set(alla).size).toBe(alla.length)
  })

  it('hittar huvudgruppen för en grupp', () => {
    expect(huvudgruppFor('Rött kött')).toBe('kott')
    expect(huvudgruppFor('Hårdost')).toBe('mejeri')
    expect(huvudgruppFor('Soppa')).toBe('ratter')
    expect(huvudgruppFor('Kosttillskott och hälsopreparat')).toBeNull()
    expect(huvudgruppFor(null)).toBeNull()
  })
})

describe('kostForLivsmedel', () => {
  it('räknar enkla växter med kända allergener som veganska', () => {
    expect(kostForLivsmedel('Linser röda torkade', 'Baljväxter', [])).toEqual({ vegetarisk: true, vegansk: true, glutenfri: true, laktosfri: true })
    expect(kostForLivsmedel('Havregryn fullkorn', 'Ris eller annat spannmål', ['gluten'])).toEqual({ vegetarisk: true, vegansk: true, glutenfri: false, laktosfri: true })
  })

  it('räknar mejeri och ägg som vegetariskt men inte veganskt, och mjölk som inte laktosfritt', () => {
    expect(kostForLivsmedel('Mjölk laktosfri', 'Mjölk', ['mjolk'])).toEqual({ vegetarisk: true, vegansk: false, glutenfri: true, laktosfri: false })
    expect(kostForLivsmedel('Ägg rått', 'Ägg', ['agg'])).toMatchObject({ vegetarisk: true, vegansk: false })
    expect(kostForLivsmedel('Pasta äggnudlar okokt', 'Pasta och liknande produkter', ['gluten', 'agg'])).toMatchObject({ vegetarisk: true, vegansk: false })
  })

  it('räknar honung som inte veganskt', () => {
    expect(kostForLivsmedel('Honung', 'Socker, honung eller sirap', [])).toMatchObject({ vegetarisk: true, vegansk: false })
  })

  it('räknar kött och fisk som varken vegetariskt eller veganskt, även när allergenerna är okända', () => {
    expect(kostForLivsmedel('Nöt entrecote rå', 'Rött kött', [])).toMatchObject({ vegetarisk: false, vegansk: false })
    expect(kostForLivsmedel('Kycklingfilé panerad', 'Fågel', null)).toEqual({ vegetarisk: false, vegansk: false, glutenfri: null, laktosfri: null })
    expect(kostForLivsmedel('Korv veg. sojakorv konserv. fett 15%', 'Korv eller liknande produkt', null)).toMatchObject({ vegetarisk: null, vegansk: null })
  })

  it('låter allt annat vara okänt', () => {
    expect(kostForLivsmedel('Köttbullar', 'Kötträtt', null)).toEqual({ vegetarisk: null, vegansk: null, glutenfri: null, laktosfri: null })
    expect(kostForLivsmedel('Chips', 'Snacks', [])).toEqual({ vegetarisk: null, vegansk: null, glutenfri: true, laktosfri: true })
  })
})
