import { describe, expect, it } from 'vitest'
import { arAllergen, filterForGruppen, passarFilter, skalForPerson, uppraknade, varningar, type Behov, type Kostinfo } from './kost'

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
      { text: 'Innehåller gluten, passar inte Lisa och Erik', okand: false },
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
