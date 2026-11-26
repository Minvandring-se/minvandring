import { describe, expect, it } from 'vitest'
import { varningarForRatt, type Allergen } from './kost'
import { allergenrad, kostdelar, kostForIngrediens, kostForRecept, mangdtext, receptbrickor, receptPerPortion, stegPerPlats, tidtext, type Katalogingrediens } from './receptkatalog'

const livs = (namn: string, grupp: string, allergener: Allergen[] | null, kcal = 350) => ({ namn, grupp, allergener, kcal_per_100g: kcal, protein_per_100g: 12.5 })

function ing(ordning: number, ingrediens: string, extra: Partial<Katalogingrediens> = {}): Katalogingrediens {
  return { ordning, ingrediens, mangd: 6, enhet: 'msk', packas: 'hemma', kommentar: null, livsmedel_nummer: null, varukatalog_id: null, livsmedel: null, varukatalog: null, ...extra }
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
