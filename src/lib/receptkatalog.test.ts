import { describe, expect, it } from 'vitest'
import { varningarForRatt, type Allergen } from './kost'
import { allergenrad, avrundaMangd, kcalPerPortion, kostdelar, kostForIngrediens, kostForRecept, mangdtext, receptbrickor, receptadress, receptPerPortion, skalaRecept, stegPerPlats, tidtext, viktFor, type Katalogingrediens } from './receptkatalog'

const livs = (namn: string, grupp: string, allergener: Allergen[] | null, kcal = 350) => ({ namn, grupp, allergener, kcal_per_100g: kcal, protein_per_100g: 12.5 })

function ing(ordning: number, ingrediens: string, extra: Partial<Katalogingrediens> = {}): Katalogingrediens {
  return { ordning, ingrediens, mangd: 6, enhet: 'msk', packas: 'hemma', kommentar: null, gram: null, livsmedel_nummer: null, varukatalog_id: null, livsmedel: null, varukatalog: null, ...extra }
}

const gryn = ing(1, 'Havregryn', { livsmedel_nummer: 702, livsmedel: livs('Havregryn fullkorn', 'Ris eller annat spannmål', ['gluten']) })
const mjolk = ing(2, 'Mjölkpulver', { livsmedel_nummer: 4537, livsmedel: livs('Mjölkpulver helmjölk', 'Mjölk', ['mjolk']) })
const vatten = ing(3, 'Vatten', { mangd: 3, enhet: 'dl', packas: 'pa_plats' })
const kanel = ing(4, 'Kanel', { mangd: 0.5, enhet: 'tsk' })

describe('kost och allergener i ett recept', () => {
  it('räknar en kopplad ingrediens och låter en okopplad vara okänd', () => {
    expect(kostForIngrediens(gryn)).toMatchObject({ allergener: ['gluten'], vegansk: true, glutenfri: false })
    expect(kostForIngrediens(kanel)).toBeNull()
  })

  it('räknar inte vattnet på plats', () => {
    expect(kostdelar({ ingredienser: [gryn, vatten] })).toHaveLength(1)
  })

  it('samlar allergenerna när alla är kända, och kostvalen som nej, ja eller okänt', () => {
    const k = kostForRecept(kostdelar({ ingredienser: [gryn, mjolk, vatten] }))
    expect(k).toMatchObject({ allergener: ['gluten', 'mjolk'], vegetarisk: true, vegansk: false, glutenfri: false, laktosfri: false })
    expect(receptbrickor(k)).toEqual(['Vegetarisk'])
  })

  it('gör allergenerna okända när en ingrediens är okänd, och då passar receptet aldrig ett kostval', () => {
    const k = kostForRecept(kostdelar({ ingredienser: [gryn, kanel] }))
    expect(k.allergener).toBeNull()
    expect(k.vegansk).toBeNull()
    expect(k.glutenfri).toBe(false)
    expect(allergenrad({ ingredienser: [gryn, kanel] })).toEqual({ innehaller: ['gluten'], okanda: 1 })
  })

  it('ger varningar för gruppen, även för det som är okänt', () => {
    const v = varningarForRatt(kostdelar({ ingredienser: [gryn, kanel] }), [{ namn: 'Oscar', vegetarisk: false, vegansk: false, glutenfri: true, laktosfri: false, utan: ['notter'] }])
    expect(v.map((x) => x.text)).toEqual(['Inte glutenfri, passar inte Oscar', 'Okänt om alla ingredienser är utan nötter, gäller Oscar'])
  })
})

describe('kopian per portion', () => {
  it('delar mängderna med portionerna, hoppar över vattnet och tar med kcal och protein', () => {
    const rader = receptPerPortion({ portioner: 2, ingredienser: [mjolk, gryn, vatten, ing(5, 'Socker', { mangd: 30, enhet: 'g' })] })
    expect(rader).toEqual([
      { vara: 'Havregryn', mangd: 3, enhet: 'msk', gram: null, kcalPer100g: 350, proteinPer100g: 12.5 },
      { vara: 'Mjölkpulver', mangd: 3, enhet: 'msk', gram: null, kcalPer100g: 350, proteinPer100g: 12.5 },
      { vara: 'Socker', mangd: 15, enhet: 'g', gram: 15, kcalPer100g: null, proteinPer100g: null },
    ])
  })

  it('kopierar en kryddning under 1 g per portion utan mängd', () => {
    const [r] = receptPerPortion({ portioner: 1, ingredienser: [ing(1, 'Ingefärspulver', { mangd: 0.3, enhet: 'g' })] })
    expect(r).toMatchObject({ vara: 'Ingefärspulver', mangd: null, enhet: null, gram: null })
  })

  it('avrundar till två decimaler', () => {
    const [r] = receptPerPortion({ portioner: 3, ingredienser: [ing(1, 'Olja', { mangd: 1, enhet: 'msk' })] })
    expect(r.mangd).toBe(0.33)
  })
})

describe('det som visas', () => {
  it('skriver mängd, tid och steg per plats', () => {
    expect(mangdtext({ mangd: 1.5, enhet: 'dl' })).toBe('1,5 dl')
    expect(mangdtext({ mangd: null, enhet: null })).toBe('')
    expect(tidtext('5–10')).toBe('5–10 min')
    expect(tidtext(null)).toBe('')
    const s = stegPerPlats([
      { steg_nr: 2, var: 'turen', steg: 'Koka', tid_min: null },
      { steg_nr: 1, var: 'hemma', steg: 'Blanda', tid_min: null },
    ])
    expect(s.hemma.map((x) => x.steg)).toEqual(['Blanda'])
    expect(s.turen.map((x) => x.steg)).toEqual(['Koka'])
  })
})

describe('antal personer', () => {
  it('avrundar läsbart: dl och msk till en decimal, tsk, krm och st till närmaste halva, g till hela gram', () => {
    expect(avrundaMangd(1.4583, 'dl')).toBe(1.5)
    expect(avrundaMangd(2.333, 'msk')).toBe(2.3)
    expect(avrundaMangd(0.7, 'tsk')).toBe(0.5)
    expect(avrundaMangd(0.8, 'krm')).toBe(1)
    expect(avrundaMangd(2.25, 'st')).toBe(2.5)
    expect(avrundaMangd(83.4, 'g')).toBe(83)
    expect(avrundaMangd(1.234, 'kg')).toBe(1.23)
    expect(avrundaMangd(12, 'ml')).toBe(10)
  })

  it('går aldrig ner till noll', () => {
    expect(avrundaMangd(0.1, 'tsk')).toBe(0.5)
    expect(avrundaMangd(0.2, 'g')).toBe(1)
    expect(avrundaMangd(0.01, 'dl')).toBe(0.1)
  })

  it('räknar om alla mängder, även vattnet på plats, och gram utan avrundning', () => {
    const rader = [ing(1, 'Gryn', { mangd: 3.5, enhet: 'dl', gram: 140 }), ing(2, 'Kanel', { mangd: 0.75, enhet: 'tsk' }), { ...vatten, mangd: 2.5 }, ing(4, 'Citronpulver', { mangd: null, enhet: null })]
    const tre = skalaRecept(rader, 2, 3)
    expect(tre.map((r) => [r.mangd, r.enhet])).toEqual([
      [5.3, 'dl'],
      [1, 'tsk'],
      [3.8, 'dl'],
      [null, null],
    ])
    expect(tre[0].gram).toBe(210)
  })

  it('visar mängderna som de står för receptets eget antal', () => {
    const rader = [ing(1, 'Kanel', { mangd: 0.75, enhet: 'tsk' })]
    expect(skalaRecept(rader, 2, 2)[0].mangd).toBe(0.75)
  })

  it('lägger turen i adressen när den finns', () => {
    expect(receptadress('aprikosgrot')).toBe('/matplanering/recept/aprikosgrot')
    expect(receptadress('aprikosgrot', 'abc')).toBe('/matplanering/recept/aprikosgrot?tur=abc')
  })
})

describe('kcal per portion', () => {
  const gram = (ordning: number, g: number, kcal: number | null, extra: Partial<Katalogingrediens> = {}) =>
    ing(ordning, `Vara ${ordning}`, { mangd: g, enhet: 'g', livsmedel: kcal === null ? null : livs('Vara', 'Grupp', [], kcal), ...extra })

  it('tar vikten ur gram, eller ur mängden när enheten är g eller kg', () => {
    expect(viktFor(ing(1, 'A', { mangd: 2, enhet: 'dl', gram: 80 }))).toBe(80)
    expect(viktFor(ing(1, 'A', { mangd: 120, enhet: 'g' }))).toBe(120)
    expect(viktFor(ing(1, 'A', { mangd: 0.5, enhet: 'kg' }))).toBe(500)
    expect(viktFor(ing(1, 'A', { mangd: 2, enhet: 'dl' }))).toBeNull()
  })

  it('räknar per portion och avrundar till närmaste 10', () => {
    // 100 g à 370 kcal + 50 g à 600 kcal = 670 kcal, för 2 portioner 335, avrundat 340.
    expect(kcalPerPortion({ portioner: 2, ingredienser: [gram(1, 100, 370), gram(2, 50, 600)] })).toBe(340)
  })

  it('räknar inte vattnet på plats och räknar kryddor i tsk och krm som 0 g', () => {
    expect(kcalPerPortion({ portioner: 1, ingredienser: [gram(1, 100, 370), vatten, kanel] })).toBe(370)
  })

  it('visas bara när ingredienser med känd kcal är minst 80 % av vikten', () => {
    expect(kcalPerPortion({ portioner: 1, ingredienser: [gram(1, 80, 400), gram(2, 20, null)] })).toBe(320)
    expect(kcalPerPortion({ portioner: 1, ingredienser: [gram(1, 79, 400), gram(2, 21, null)] })).toBeNull()
  })

  it('går inte att räkna när vikten saknas för en ingrediens som inte är en krydda', () => {
    expect(kcalPerPortion({ portioner: 1, ingredienser: [gram(1, 100, 370), ing(2, 'Russin', { mangd: 1, enhet: 'dl', livsmedel: livs('Russin', 'Frukt', []) })] })).toBeNull()
    expect(kcalPerPortion({ portioner: 1, ingredienser: [gram(1, 100, 370), ing(2, 'Russin', { mangd: 1, enhet: 'dl', gram: 60, livsmedel: livs('Russin', 'Frukt', [], 300) })] })).toBe(550)
    expect(kcalPerPortion({ portioner: 1, ingredienser: [vatten] })).toBeNull()
  })

  it('tar kcal från märkesvaran före livsmedlet', () => {
    const vara = { vegetarisk: true, vegansk: true, glutenfri: true, laktosfri: true, allergener: [], spar: [], kcal_per_100g: 500, protein_per_100g: 10 }
    expect(kcalPerPortion({ portioner: 1, ingredienser: [gram(1, 100, 370, { varukatalog: vara })] })).toBe(500)
  })
})
