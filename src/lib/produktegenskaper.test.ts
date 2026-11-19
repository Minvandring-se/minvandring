import { describe, expect, it } from 'vitest'
import { ALLA_EGENSKAPSNYCKLAR, EGENSKAPER, egenskaperFor, tolkaEgenskap, valideraEgenskaper, visaEgenskaper, type Egenskap } from './produktegenskaper'

const talt = {
  personer: 2,
  sasong: 3,
  konstruktion: 'tunnel',
  fristaende: 'nej',
  kraver_stavar: false,
  golvyta_m2: 2.8,
  absidyta_m2: 1.2,
  ingangar: 1,
  absider: 1,
  innerhojd_cm: 100,
  langd_cm: 220,
  yttertalt_forst: true,
  material_typ: 'silnylon',
  material_beskrivning: 'Silikoniserad nylon 20D',
  vattenpelare_duk_mm: 3000,
  vattenpelare_golv_mm: 10000,
  packmatt_cm: '45 x 15',
}

describe('egenskaper för tält', () => {
  it('har de sjutton egenskaperna, varav elva behövs för jämförelser', () => {
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
      'material_typ',
      'vattenpelare_duk_mm',
      'vattenpelare_golv_mm',
    ])
  })

  it('godkänner ett komplett tält utan fel eller varningar', () => {
    expect(valideraEgenskaper('talt', talt)).toEqual({ fel: [], varningar: [] })
  })

  it('varnar men stoppar inte när något som behövs för jämförelser saknas', () => {
    const { golvyta_m2: _g, material_typ: _m, ...rest } = talt
    const r = valideraEgenskaper('talt', { ...rest, absider: null })
    expect(r.fel).toEqual([])
    expect(r.varningar.map((v) => v.split(':')[0])).toEqual(['golvyta_m2', 'absider', 'material_typ'])
  })

  it('varnar inte när en frivillig egenskap saknas', () => {
    const { ingangar: _i, innerhojd_cm: _h, langd_cm: _l, yttertalt_forst: _y, material_beskrivning: _b, packmatt_cm: _p, ...rest } = talt
    expect(valideraEgenskaper('talt', rest)).toEqual({ fel: [], varningar: [] })
  })

  it('räknar noll och nej som ifyllda värden', () => {
    expect(valideraEgenskaper('talt', { ...talt, absider: 0, absidyta_m2: 0, kraver_stavar: false }).varningar).toEqual([])
  })

  it('ger fel för värden av fel sort eller utanför rimliga gränser', () => {
    const r = valideraEgenskaper('talt', {
      ...talt,
      personer: 2.5,
      sasong: 5,
      konstruktion: 'igloo',
      fristaende: true,
      golvyta_m2: '2,8',
      material_typ: 'DCF',
      material_beskrivning: '  ',
      vattenpelare_duk_mm: 3,
    })
    expect(r.fel.map((f) => f.split(':')[0])).toEqual([
      'personer',
      'sasong',
      'konstruktion',
      'fristaende',
      'golvyta_m2',
      'material_typ',
      'material_beskrivning',
      'vattenpelare_duk_mm',
    ])
  })

  it('fristående är ja, halvt eller nej', () => {
    for (const fristaende of ['ja', 'halvt', 'nej']) expect(valideraEgenskaper('talt', { ...talt, fristaende }).fel, fristaende).toEqual([])
    for (const fristaende of ['delvis', false, '']) {
      const r = valideraEgenskaper('talt', { ...talt, fristaende })
      expect([...r.fel, ...r.varningar].map((x) => x.split(':')[0]), String(fristaende)).toEqual(['fristaende'])
    }
  })

  it('godtar konstruktionerna och materialtyperna som CSV:n använder', () => {
    for (const konstruktion of ['tunnel', 'kupol', 'geodetiskt', 'pyramid', 'stavtalt', 'annat']) {
      expect(valideraEgenskaper('talt', { ...talt, konstruktion }).fel, konstruktion).toEqual([])
    }
    for (const material_typ of ['polyester', 'nylon', 'silnylon', 'silpoly', 'dcf', 'kerlon', 'bomull', 'annat']) {
      expect(valideraEgenskaper('talt', { ...talt, material_typ }).fel, material_typ).toEqual([])
    }
  })

  it('ger fel för en egenskap som inte finns i underkategorin', () => {
    expect(valideraEgenskaper('talt', { ...talt, farg: 'grön' }).fel).toEqual(['farg: okänd egenskap för underkategorin'])
  })
})

describe('egenskaper för tarp och vindsäck', () => {
  it('har fem enkla egenskaper som alla är frivilliga', () => {
    for (const under of ['tarp', 'vindsack']) {
      expect(egenskaperFor(under).map((e) => e.nyckel)).toEqual(['personer', 'langd_cm', 'material_typ', 'material_beskrivning', 'vattenpelare_duk_mm'])
      expect(egenskaperFor(under).some((e) => e.forJamforelse)).toBe(false)
      expect(valideraEgenskaper(under, {})).toEqual({ fel: [], varningar: [] })
    }
  })

  it('godtar en lång tarp men inte tältets egenskaper', () => {
    expect(valideraEgenskaper('tarp', { langd_cm: 450, material_typ: 'silnylon', vattenpelare_duk_mm: 3000 }).fel).toEqual([])
    expect(valideraEgenskaper('tarp', { konstruktion: 'annat' }).fel).toEqual(['konstruktion: okänd egenskap för underkategorin'])
  })
})

describe('tolkaEgenskap', () => {
  const falt = (nyckel: string): Egenskap => egenskaperFor('talt').find((e) => e.nyckel === nyckel)!

  it('godtar både komma och punkt som decimaltecken', () => {
    expect(tolkaEgenskap(falt('golvyta_m2'), '2,8')).toEqual({ varde: 2.8 })
    expect(tolkaEgenskap(falt('golvyta_m2'), '2.8')).toEqual({ varde: 2.8 })
    expect(tolkaEgenskap(falt('golvyta_m2'), ' 3 ')).toEqual({ varde: 3 })
    expect(tolkaEgenskap(falt('golvyta_m2'), '2,8 m2')).toHaveProperty('fel')
  })

  it('kräver hela tal där det ska vara heltal', () => {
    expect(tolkaEgenskap(falt('personer'), '2')).toEqual({ varde: 2 })
    expect(tolkaEgenskap(falt('personer'), '2,5')).toHaveProperty('fel')
    expect(tolkaEgenskap(falt('personer'), 'två')).toHaveProperty('fel')
  })

  it('gör om ja och nej, och val med stora bokstäver till små', () => {
    expect(tolkaEgenskap(falt('kraver_stavar'), 'Ja')).toEqual({ varde: true })
    expect(tolkaEgenskap(falt('kraver_stavar'), 'nej')).toEqual({ varde: false })
    expect(tolkaEgenskap(falt('kraver_stavar'), 'halvt')).toHaveProperty('fel')
    expect(tolkaEgenskap(falt('material_typ'), 'DCF')).toEqual({ varde: 'dcf' })
    expect(tolkaEgenskap(falt('material_typ'), 'Kerlon')).toEqual({ varde: 'kerlon' })
    expect(tolkaEgenskap(falt('material_typ'), 'plast')).toHaveProperty('fel')
    expect(tolkaEgenskap(falt('fristaende'), 'halvt')).toEqual({ varde: 'halvt' })
  })

  it('behåller fri text som den är, utan blanktecken runt om', () => {
    expect(tolkaEgenskap(falt('packmatt_cm'), ' 43 x 13 ')).toEqual({ varde: '43 x 13' })
  })
})

describe('underkategorier utan egna egenskaper', () => {
  it('bara tält, tarp och vindsäck har egenskaper än så länge', () => {
    expect(Object.keys(EGENSKAPER)).toEqual(['talt', 'tarp', 'vindsack'])
    expect(ALLA_EGENSKAPSNYCKLAR.has('golvyta_m2')).toBe(true)
    expect(ALLA_EGENSKAPSNYCKLAR.has('kommentar')).toBe(false)
  })

  it('godkänner tomma egenskaper och ger fel om något ändå anges', () => {
    expect(valideraEgenskaper('sovsack', {})).toEqual({ fel: [], varningar: [] })
    expect(valideraEgenskaper('sovsack', { komforttemp_c: -5 }).fel).toHaveLength(1)
    // En hängmatta ligger i samma huvudkategori som tält men har inga egna egenskaper.
    expect(valideraEgenskaper('hangmatta', { personer: 2 }).fel).toHaveLength(1)
  })
})

describe('visaEgenskaper', () => {
  const rader = (under: string, egenskaper: Record<string, unknown> | null) => visaEgenskaper(under, egenskaper).map((r) => `${r.etikett}: ${r.varde}`)

  it('visar tältets egenskaper som text, med enheter, decimalkomma och ja eller nej', () => {
    expect(rader('talt', talt)).toEqual([
      'Personer: 2',
      'Säsonger: 3',
      'Konstruktion: Tunnel',
      'Fristående: Nej',
      'Kräver vandringsstavar: Nej',
      'Golvyta: 2,8 m²',
      'Absidyta: 1,2 m²',
      'Ingångar: 1',
      'Absider: 1',
      'Innerhöjd: 100 cm',
      'Längd: 220 cm',
      'Yttertältet reses först: Ja',
      'Material: Silnylon',
      'Materialbeskrivning: Silikoniserad nylon 20D',
      'Vattenpelare duk: 3000 mm',
      'Vattenpelare golv: 10000 mm',
      'Packmått (cm): 45 x 15',
    ])
  })

  it('skriver ut val som inte bara ska ha stor bokstav', () => {
    expect(rader('talt', { konstruktion: 'stavtalt', fristaende: 'halvt', material_typ: 'dcf' })).toEqual([
      'Konstruktion: Stavtält',
      'Fristående: Halvt',
      'Material: DCF',
    ])
  })

  it('tar bara med det som har ett värde, och noll räknas som ett värde', () => {
    expect(rader('talt', { personer: 1, sasong: null, absider: 0, material_beskrivning: '  ' })).toEqual(['Personer: 1', 'Absider: 0'])
  })

  it('anpassar sig efter underkategorin: en tarp visar inte tältets egenskaper', () => {
    const tarp = { langd_cm: 450, material_typ: 'silnylon', vattenpelare_duk_mm: 3000, konstruktion: 'annat' }
    expect(rader('tarp', tarp)).toEqual(['Längd: 450 cm', 'Material: Silnylon', 'Vattenpelare duk: 3000 mm'])
  })

  it('ger ingenting för en underkategori utan egenskaper eller en produkt utan uppgifter', () => {
    expect(rader('sovsack', { personer: 1 })).toEqual([])
    expect(rader('talt', null)).toEqual([])
    expect(rader('talt', {})).toEqual([])
  })
})
