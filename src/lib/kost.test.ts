import { describe, expect, it } from 'vitest'
import { arAllergen, behovstext, filterForGruppen, filterText, kostsvar, kostsvarText, passarFilter, skalForPerson, uppraknade, varningar, varningarForRatt, type Behov, type Kostinfo } from './kost'

const kand: Kostinfo = { vegetarisk: true, vegansk: false, glutenfri: true, laktosfri: true, allergener: ['soja', 'selleri'] }
const okand: Kostinfo = { vegetarisk: null, vegansk: null, glutenfri: null, laktosfri: null, allergener: null }

const behov = (namn: string, extra: Partial<Behov> = {}): Behov => ({
  namn,
  vegetarisk: false,
  vegansk: false,
  glutenfri: false,
  laktosfri: false,
  utan: [],
  ...extra,
})

describe('passarFilter', () => {
  it('släpper igenom allt med ett tomt filter, även okänt', () => {
    expect(passarFilter(okand, { val: [], utan: [] })).toBe(true)
  })

  it('kräver att kostvalet är känt och sant', () => {
    expect(passarFilter(kand, { val: ['vegetarisk', 'glutenfri'], utan: [] })).toBe(true)
    expect(passarFilter(kand, { val: ['vegansk'], utan: [] })).toBe(false)
    expect(passarFilter(okand, { val: ['laktosfri'], utan: [] })).toBe(false)
  })

  it('kräver att allergenerna är kända och att påsen är utan dem', () => {
    expect(passarFilter(kand, { val: [], utan: ['gluten', 'notter'] })).toBe(true)
    expect(passarFilter(kand, { val: [], utan: ['soja'] })).toBe(false)
    expect(passarFilter(okand, { val: [], utan: ['gluten'] })).toBe(false)
  })

  it('en tom lista betyder inga allergener', () => {
    expect(passarFilter({ ...okand, allergener: [] }, { val: [], utan: ['mjolk', 'agg'] })).toBe(true)
  })

  it('spår räknas inte som att påsen innehåller allergenen', () => {
    // Spåren ligger inte i Kostinfo, så de kan inte påverka filtret.
    const medSpar = { ...kand, spar: ['notter'] } as Kostinfo
    expect(passarFilter(medSpar, { val: [], utan: ['notter'] })).toBe(true)
  })
})

describe('spår i varningarna', () => {
  it('ger en dämpad rad när påsen kan innehålla spår av något en person inte tål', () => {
    const p: Kostinfo = { ...kand, allergener: [], spar: ['notter'] }
    expect(varningar(p, [behov('Anna', { utan: ['notter'] })])).toEqual([{ text: 'Kan innehålla spår av nötter, gäller Anna', okand: true }])
  })

  it('säger inget om spår när påsen innehåller allergenen, och inget utan spår', () => {
    expect(varningar({ ...kand, allergener: ['notter'], spar: ['notter'] }, [behov('Anna', { utan: ['notter'] })]).map((v) => v.text)).toEqual(['Innehåller nötter, passar inte Anna'])
    expect(varningar({ ...kand, allergener: [], spar: null }, [behov('Anna', { utan: ['notter'] })])).toEqual([])
  })
})

describe('filterForGruppen', () => {
  it('samlar allas kostval och allergener, utan dubbletter och i fast ordning', () => {
    const f = filterForGruppen([behov('Lisa', { glutenfri: true, utan: ['notter'] }), behov('Erik', { vegetarisk: true, utan: ['notter', 'agg'] })])
    expect(f).toEqual({ val: ['vegetarisk', 'glutenfri'], utan: ['agg', 'notter'] })
  })

  it('är tomt utan behov', () => {
    expect(filterForGruppen([behov('Anna')])).toEqual({ val: [], utan: [] })
  })
})

describe('skalForPerson', () => {
  it('ger kända och okända skäl', () => {
    expect(skalForPerson(kand, behov('Lisa', { vegansk: true, utan: ['soja', 'gluten'] }))).toEqual([
      { typ: 'inte', val: 'vegansk' },
      { typ: 'innehaller', allergen: 'soja' },
    ])
    expect(skalForPerson(okand, behov('Lisa', { glutenfri: true, utan: ['fisk'] }))).toEqual([
      { typ: 'okant_val', val: 'glutenfri' },
      { typ: 'okand_allergen', allergen: 'fisk' },
    ])
  })

  it('är tom när påsen passar', () => {
    expect(skalForPerson(kand, behov('Lisa', { vegetarisk: true, utan: ['gluten'] }))).toEqual([])
  })
})

describe('varningar', () => {
  it('skriver en varning per skäl med alla som berörs', () => {
    const p: Kostinfo = { ...kand, glutenfri: false, allergener: ['gluten'] }
    expect(
      varningar(p, [behov('Lisa', { utan: ['gluten'] }), behov('Erik', { utan: ['gluten'], glutenfri: true }), behov('Anna', { glutenfri: true })]),
    ).toEqual([
      // Erik vill ha glutenfritt, så Inte glutenfri räcker för honom.
      { text: 'Innehåller gluten, passar inte Lisa', okand: false },
      { text: 'Inte glutenfri, passar inte Erik och Anna', okand: false },
    ])
  })

  it('lägger det okända sist och dämpat', () => {
    const p: Kostinfo = { ...kand, laktosfri: null, vegansk: false }
    expect(varningar(p, [behov('Lisa', { laktosfri: true }), behov('Erik', { vegansk: true })])).toEqual([
      { text: 'Inte vegansk, passar inte Erik', okand: false },
      { text: 'Okänt om den är laktosfri, gäller Lisa', okand: true },
    ])
  })

  it('skriver allergenen med liten bokstav', () => {
    expect(varningar({ ...kand, allergener: null }, [behov('Lisa', { utan: ['jordnotter'] })])).toEqual([
      { text: 'Okänt om den innehåller jordnötter, gäller Lisa', okand: true },
    ])
  })

  it('är tom när påsen passar alla', () => {
    expect(varningar(kand, [behov('Lisa', { vegetarisk: true }), behov('Erik')])).toEqual([])
  })
})

describe('uppraknade', () => {
  it('binder ihop namnen med kommatecken och "och"', () => {
    expect(uppraknade([])).toBe('')
    expect(uppraknade(['Lisa'])).toBe('Lisa')
    expect(uppraknade(['Lisa', 'Erik'])).toBe('Lisa och Erik')
    expect(uppraknade(['Lisa', 'Erik', 'Anna'])).toBe('Lisa, Erik och Anna')
  })
})

describe('arAllergen', () => {
  it('känner igen nycklarna men inte etiketterna', () => {
    expect(arAllergen('jordnotter')).toBe(true)
    expect(arAllergen('Jordnötter')).toBe(false)
    expect(arAllergen('inga')).toBe(false)
  })
})

describe('behovstext', () => {
  it('skriver inte gluten två gånger, men skriver både laktosfri och mjölk', () => {
    expect(behovstext(behov('Oscar', { glutenfri: true, utan: ['gluten'] }))).toBe('Glutenfri')
    expect(behovstext(behov('Oscar', { glutenfri: true, utan: ['gluten', 'sesam'] }))).toBe('Glutenfri, tål inte sesam')
    expect(behovstext(behov('Lisa', { utan: ['gluten'] }))).toBe('Tål inte gluten')
    expect(behovstext(behov('Erik', { laktosfri: true, utan: ['mjolk'] }))).toBe('Laktosfri, tål inte mjölk')
  })

  it('räknar upp kostval och allergener', () => {
    expect(behovstext(behov('Lisa', { vegetarisk: true, glutenfri: true, utan: ['sesam', 'notter'] }))).toBe('Vegetarisk, glutenfri, tål inte nötter och sesam')
  })

  it('skriver bara vegansk när personen är både vegetarian och vegan', () => {
    expect(behovstext(behov('Lisa', { vegetarisk: true, vegansk: true }))).toBe('Vegansk')
  })

  it('börjar med versal även när det bara finns allergener', () => {
    expect(behovstext(behov('Lisa', { utan: ['jordnotter'] }))).toBe('Tål inte jordnötter')
  })

  it('är tom utan behov', () => {
    expect(behovstext(behov('Lisa'))).toBe('')
  })
})

describe('kostsvar', () => {
  const inga = { vegetarisk: false, vegansk: false, glutenfri: false, laktosfri: false, utan: [] }

  it('skiljer på att inte ha svarat och att ha sagt att man inte har några kostbehov', () => {
    expect(kostsvar({ user_id: 'u' }, undefined)).toEqual({ lage: 'inte-svarat' })
    expect(kostsvar({ user_id: 'u' }, inga)).toEqual({ lage: 'inga' })
    expect(kostsvarText({ lage: 'inte-svarat' })).toBe('Har inte angett något än')
    expect(kostsvarText({ lage: 'inga' })).toBe('Inga kostbehov')
  })

  it('visar kostbehoven som text', () => {
    const svar = kostsvar({ user_id: 'u' }, { ...inga, glutenfri: true, utan: ['notter'] })
    expect(svar).toEqual({ lage: 'behov', text: 'Glutenfri, tål inte nötter' })
  })

  it('säger att en person utan konto kan fylla i själv', () => {
    expect(kostsvar({ user_id: null }, undefined)).toEqual({ lage: 'utan-konto' })
  })
})

describe('filterText', () => {
  it('beskriver filtret i ord', () => {
    expect(filterText({ val: [], utan: [] })).toBeNull()
    expect(filterText({ val: ['glutenfri'], utan: [] })).toBe('Glutenfri')
    expect(filterText({ val: ['laktosfri', 'vegetarisk'], utan: ['sesam'] })).toBe('Vegetarisk, laktosfri, utan sesam')
    expect(filterText({ val: [], utan: ['agg'] })).toBe('Utan ägg')
    expect(filterText({ val: ['glutenfri'], utan: ['gluten', 'sesam'] })).toBe('Glutenfri, utan sesam')
  })
})

describe('varningarForRatt', () => {
  const brod: Kostinfo = { vegetarisk: true, vegansk: true, glutenfri: false, laktosfri: true, allergener: ['gluten'], spar: [] }
  const ost: Kostinfo = { vegetarisk: true, vegansk: false, glutenfri: true, laktosfri: false, allergener: ['mjolk'], spar: [] }

  it('varnar för det som de kända ingredienserna innehåller', () => {
    expect(varningarForRatt([brod, ost], [behov('Anna', { utan: ['mjolk'] }), behov('Erik', { glutenfri: true })])).toEqual([
      { text: 'Innehåller mjölk, passar inte Anna', okand: false },
      { text: 'Inte glutenfri, passar inte Erik', okand: false },
    ])
  })

  it('räknar en ingrediens utan koppling som okänd, aldrig som att den passar', () => {
    const v = varningarForRatt([ost, null], [behov('Anna', { utan: ['notter'] }), behov('Erik', { vegetarisk: true })])
    expect(v).toEqual([
      { text: 'Okänt om den är vegetarisk, gäller Erik', okand: true },
      { text: 'Okänt om alla ingredienser är utan nötter, gäller Anna', okand: true },
    ])
  })

  it('säger att allt är okänt när ingen ingrediens är känd', () => {
    expect(varningarForRatt([null, null], [behov('Anna', { utan: ['notter'] })])).toEqual([{ text: 'Okänt om den innehåller nötter, gäller Anna', okand: true }])
  })

  it('säger inget för en rätt utan ingredienser eller utan kostbehov', () => {
    expect(varningarForRatt([], [behov('Anna', { utan: ['notter'] })])).toEqual([])
    expect(varningarForRatt([null], [behov('Anna')])).toEqual([])
  })

  it('tar med spår från de kända ingredienserna', () => {
    expect(varningarForRatt([{ ...ost, spar: ['notter'] }], [behov('Anna', { utan: ['notter'] })])).toEqual([{ text: 'Kan innehålla spår av nötter, gäller Anna', okand: true }])
  })
})
