import { describe, expect, it } from 'vitest'
import {
  allergentext,
  filterFranAdress,
  filterTillAdress,
  kostetiketter,
  marken,
  mestEnergi,
  naringstabell,
  pristext,
  sokPasar,
  spartext,
  TOMT_KATALOGFILTER,
  type Katalogfilter,
} from './matkatalog'
import type { Matprodukt } from './typer'

function pase(id: string, extra: Partial<Matprodukt> = {}): Matprodukt {
  return {
    id,
    marke: 'Testmat',
    namn: `Påse ${id}`,
    andra_namn: [],
    maltid: 'lunch_middag',
    torkning: null,
    vikt_torr_g: 100,
    portioner: 1,
    kcal: 400,
    protein_g: null,
    fett_g: null,
    kolhydrater_g: null,
    vatten_ml: null,
    tillagning_vatten: null,
    tillagning_min: null,
    vegetarisk: null,
    vegansk: null,
    glutenfri: null,
    laktosfri: null,
    allergener: null,
    spar: null,
    pris_sek_ca: null,
    pris_kalla: null,
    kalla: 'https://exempel.se',
    kontrollerad: null,
    ...extra,
  }
}

const filter = (f: Partial<Katalogfilter> = {}): Katalogfilter => ({ ...TOMT_KATALOGFILTER, ...f })
const ids = (p: Matprodukt[]) => p.map((x) => x.id)

describe('filtret i adressen', () => {
  it('läser kända värden och hoppar över okända', () => {
    const p = new URLSearchParams('maltid=frukost&marke=Real&kost=vegansk,okand,glutenfri&utan=notter,gluten,fel&sortering=pris')
    expect(filterFranAdress(p)).toEqual({ maltid: 'frukost', marke: 'Real', val: ['vegansk', 'glutenfri'], utan: ['gluten', 'notter'], sortering: 'pris' })
    expect(filterFranAdress(new URLSearchParams('maltid=fika&sortering=billigast'))).toEqual(TOMT_KATALOGFILTER)
  })

  it('skriver bara det som är valt, behåller andra delar och läser tillbaka samma filter', () => {
    const f = filter({ maltid: 'dessert', val: ['laktosfri'], utan: ['mjolk'], sortering: 'vikt' })
    const p = filterTillAdress(f, new URLSearchParams('pase=abc&kost=vegansk'))
    expect(p.get('pase')).toBe('abc')
    expect(p.get('kost')).toBe('laktosfri')
    expect(p.has('marke')).toBe(false)
    expect(filterFranAdress(p)).toEqual(f)
    // Förvalet skrivs inte.
    expect(filterTillAdress(TOMT_KATALOGFILTER, new URLSearchParams()).toString()).toBe('')
  })
})

describe('sökning och sortering', () => {
  const katalog = [
    pase('a', { marke: 'Real', namn: 'Pasta Bolognese', kcal: 500, vikt_torr_g: 125, pris_sek_ca: 89, vegetarisk: false, allergener: ['gluten'] }),
    pase('b', { marke: 'Adventure Food', namn: 'Gryta', kcal: 600, vikt_torr_g: 140, pris_sek_ca: 109, vegetarisk: true, vegansk: true, allergener: [] }),
    pase('c', { marke: 'Real', namn: 'Frukostgröt', maltid: 'frukost', kcal: 450, vikt_torr_g: 100, vegetarisk: true, allergener: ['mjolk'] }),
    pase('d', { marke: 'Okänd', namn: 'Utan pris', kcal: 300, vikt_torr_g: 90 }),
  ]

  it('sorterar på mest energi per 100 g som förval', () => {
    // 400, 429, 450 och 333 kcal per 100 g.
    expect(ids(sokPasar(katalog, '', filter()))).toEqual(['c', 'b', 'a', 'd'])
  })

  it('sorterar på kcal, pris och vikt, och påsar utan pris hamnar sist', () => {
    expect(ids(sokPasar(katalog, '', filter({ sortering: 'kcal' })))).toEqual(['b', 'a', 'c', 'd'])
    expect(ids(sokPasar(katalog, '', filter({ sortering: 'pris' })))).toEqual(['a', 'b', 'd', 'c'])
    expect(ids(sokPasar(katalog, '', filter({ sortering: 'vikt' })))).toEqual(['d', 'c', 'a', 'b'])
  })

  it('söker på märke och namn, alla ord måste finnas', () => {
    expect(ids(sokPasar(katalog, 'real', filter()))).toEqual(['c', 'a'])
    expect(ids(sokPasar(katalog, 'REAL pasta', filter()))).toEqual(['a'])
    expect(ids(sokPasar(katalog, 'pizza', filter()))).toEqual([])
  })

  it('filtrerar på måltid, märke, kostval och allergener, och okänt passar inte', () => {
    expect(ids(sokPasar(katalog, '', filter({ maltid: 'frukost' })))).toEqual(['c'])
    expect(ids(sokPasar(katalog, '', filter({ marke: 'real' })))).toEqual(['c', 'a'])
    expect(ids(sokPasar(katalog, '', filter({ val: ['vegetarisk'] })))).toEqual(['c', 'b'])
    expect(ids(sokPasar(katalog, '', filter({ utan: ['gluten'] })))).toEqual(['c', 'b'])
    expect(ids(sokPasar(katalog, '', filter({ val: ['vegetarisk'], utan: ['mjolk'] })))).toEqual(['b'])
  })

  it('hoppar över ett märke som inte finns i katalogen, till exempel från en gammal länk', () => {
    expect(ids(sokPasar(katalog, '', filter({ marke: 'finnsinte' })))).toEqual(['c', 'b', 'a', 'd'])
    expect(ids(sokPasar(katalog, '', filter({ marke: 'finnsinte', maltid: 'frukost' })))).toEqual(['c'])
  })

  it('listar märkena en gång var i bokstavsordning', () => {
    expect(marken(katalog)).toEqual(['Adventure Food', 'Okänd', 'Real'])
  })
})

describe('brickan Mest energi', () => {
  it('går till påsen med högst kcal per 100 g när det finns minst tre', () => {
    const tre = [pase('a', { kcal: 400 }), pase('b', { kcal: 520 }), pase('c', { kcal: 450 })]
    expect(mestEnergi(tre)).toBe('b')
    expect(mestEnergi(tre.slice(0, 2))).toBeNull()
  })

  it('går till den första vid lika', () => {
    expect(mestEnergi([pase('a', { kcal: 500 }), pase('b', { kcal: 500 }), pase('c', { kcal: 100 })])).toBe('a')
  })
})

describe('det som visas', () => {
  it('kostetiketterna visar bara det som är sant, och vegansk ersätter vegetarisk', () => {
    expect(kostetiketter({ vegetarisk: true, vegansk: true, glutenfri: true, laktosfri: null })).toEqual(['Vegansk', 'Glutenfri'])
    expect(kostetiketter({ vegetarisk: true, vegansk: false, glutenfri: false, laktosfri: true })).toEqual(['Vegetarisk', 'Laktosfri'])
    expect(kostetiketter({ vegetarisk: null, vegansk: null, glutenfri: null, laktosfri: null })).toEqual([])
  })

  it('näringen per påse och per 100 g, med streck för det som saknas', () => {
    const rader = naringstabell(pase('a', { kcal: 600, vikt_torr_g: 150, protein_g: 30, fett_g: null, kolhydrater_g: 75.5 }))
    expect(rader).toEqual([
      { etikett: 'Energi', perPase: '600 kcal', per100g: '400 kcal' },
      { etikett: 'Protein', perPase: '30 g', per100g: '20 g' },
      { etikett: 'Fett', perPase: '–', per100g: '–' },
      { etikett: 'Kolhydrater', perPase: '75,5 g', per100g: '50,3 g' },
    ])
  })

  it('allergener, spår och pris', () => {
    expect(allergentext({ allergener: null })).toBe('Okänt')
    expect(allergentext({ allergener: [] })).toBe('Ingen av de 14 allergenerna')
    expect(allergentext({ allergener: ['gluten', 'mjolk', 'soja'] })).toBe('Gluten, mjölk och soja')
    expect(spartext({ spar: null })).toBe('Okänt')
    expect(spartext({ spar: [] })).toBeNull()
    expect(spartext({ spar: ['notter'] })).toBe('Nötter')
    expect(pristext({ pris_sek_ca: null })).toBeNull()
    expect(pristext({ pris_sek_ca: 1299 })).toBe('Cirka 1 299 kr')
  })
})
