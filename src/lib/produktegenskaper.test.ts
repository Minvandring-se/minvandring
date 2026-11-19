import { describe, expect, it } from 'vitest'
import { EGENSKAPER, egenskaperFor, valideraEgenskaper } from './produktegenskaper'

const talt = {
  personer: 2,
  sasong: 3,
  konstruktion: 'tunnel',
  fristaende: false,
  kraver_stavar: false,
  golvyta_m2: 2.8,
  absidyta_m2: 1.2,
  ingangar: 1,
  absider: 1,
  innerhojd_cm: 100,
  langd_cm: 220,
  yttertalt_forst: true,
  material: 'Silikoniserad nylon',
  vattenpelare_duk_mm: 3000,
  vattenpelare_golv_mm: 10000,
  packmatt_cm: '45 x 15',
}

describe('egenskaper för tält', () => {
  it('har de sexton egenskaperna, varav elva behövs för jämförelser', () => {
    const alla = egenskaperFor('talt')
    expect(alla.map((e) => e.nyckel)).toEqual(Object.keys(talt))
    expect(alla.filter((e) => e.forJamforelse).map((e) => e.nyckel)).toEqual([
      'personer',
      'sasong',
      'konstruktion',
      'fristaende',
      'kraver_stavar',
      'golvyta_m2',
      'absidyta_m2',
      'absider',
      'material',
      'vattenpelare_duk_mm',
      'vattenpelare_golv_mm',
    ])
  })

  it('godkänner ett komplett tält utan fel eller varningar', () => {
    expect(valideraEgenskaper('talt', talt)).toEqual({ fel: [], varningar: [] })
  })

  it('varnar men stoppar inte när något som behövs för jämförelser saknas', () => {
    const { golvyta_m2: _g, material: _m, ...rest } = talt
    const r = valideraEgenskaper('talt', { ...rest, absider: null })
    expect(r.fel).toEqual([])
    expect(r.varningar.map((v) => v.split(':')[0])).toEqual(['golvyta_m2', 'absider', 'material'])
  })

  it('varnar inte när en frivillig egenskap saknas', () => {
    const { ingangar: _i, innerhojd_cm: _h, langd_cm: _l, yttertalt_forst: _y, packmatt_cm: _p, ...rest } = talt
    expect(valideraEgenskaper('talt', rest)).toEqual({ fel: [], varningar: [] })
  })

  it('räknar noll och nej som ifyllda värden', () => {
    expect(valideraEgenskaper('talt', { ...talt, absider: 0, absidyta_m2: 0, fristaende: false }).varningar).toEqual([])
  })

  it('ger fel för värden av fel sort eller utanför rimliga gränser', () => {
    const r = valideraEgenskaper('talt', {
      ...talt,
      personer: 2.5,
      sasong: 5,
      konstruktion: 'igloo',
      fristaende: 'ja',
      golvyta_m2: '2,8',
      material: '  ',
      vattenpelare_duk_mm: 3,
    })
    expect(r.fel.map((f) => f.split(':')[0])).toEqual([
      'personer',
      'sasong',
      'konstruktion',
      'fristaende',
      'golvyta_m2',
      'material',
      'vattenpelare_duk_mm',
    ])
  })

  it('ger fel för en egenskap som inte finns i underkategorin', () => {
    expect(valideraEgenskaper('talt', { ...talt, farg: 'grön' }).fel).toEqual(['farg: okänd egenskap för underkategorin'])
  })
})

describe('underkategorier utan egna egenskaper', () => {
  it('har bara tält än så länge', () => {
    expect(Object.keys(EGENSKAPER)).toEqual(['talt'])
  })

  it('godkänner tomma egenskaper och ger fel om något ändå anges', () => {
    expect(valideraEgenskaper('sovsack', {})).toEqual({ fel: [], varningar: [] })
    expect(valideraEgenskaper('sovsack', { komforttemp_c: -5 }).fel).toHaveLength(1)
    // En tarp ligger i samma huvudkategori som tält men har inte tältets egenskaper.
    expect(valideraEgenskaper('tarp', { personer: 2 }).fel).toHaveLength(1)
  })
})
