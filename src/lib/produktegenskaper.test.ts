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
  it('bara tält, tarp, vindsäck, sovsäck och quilt har egenskaper än så länge', () => {
    expect(Object.keys(EGENSKAPER)).toEqual(['talt', 'tarp', 'vindsack', 'sovsack', 'quilt'])
    expect(ALLA_EGENSKAPSNYCKLAR.has('golvyta_m2')).toBe(true)
    expect(ALLA_EGENSKAPSNYCKLAR.has('kommentar')).toBe(false)
  })

  it('godkänner tomma egenskaper och ger fel om något ändå anges', () => {
    expect(valideraEgenskaper('liggunderlag', {})).toEqual({ fel: [], varningar: [] })
    expect(valideraEgenskaper('liggunderlag', { r_varde: 4 }).fel).toHaveLength(1)
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
    expect(rader('liggunderlag', { personer: 1 })).toEqual([])
    expect(rader('talt', null)).toEqual([])
    expect(rader('talt', {})).toEqual([])
  })
})

describe('egenskaper för sovsäck och quilt', () => {
  const sovsack = {
    komfort_temp_c: -3,
    limit_temp_c: -9,
    extrem_temp_c: -28,
    temperaturstandard: 'iso',
    fyllning: 'dun',
    fillpower_cuin: 800,
    fyllnadsvikt_g: 480,
    form: 'mumie',
    max_langd_cm: 185,
    dragkedja: 'vanster',
    material_beskrivning: 'Yttertyg i 20D nylon',
    packmatt_cm: '30 x 17',
  }
  const falt = (nyckel: string): Egenskap => egenskaperFor('sovsack').find((e) => e.nyckel === nyckel)!
  const felnycklar = (e: Record<string, unknown>, under = 'sovsack') => valideraEgenskaper(under, e).fel.map((f) => f.split(':')[0])

  it('har samma tolv egenskaper för sovsäck och quilt, varav fem behövs för jämförelser', () => {
    for (const under of ['sovsack', 'quilt']) {
      expect(egenskaperFor(under).map((e) => e.nyckel)).toEqual(Object.keys(sovsack))
      expect(egenskaperFor(under).filter((e) => e.forJamforelse).map((e) => e.nyckel)).toEqual([
        'komfort_temp_c',
        'limit_temp_c',
        'fyllning',
        'form',
        'max_langd_cm',
      ])
    }
  })

  it('godkänner en komplett sovsäck utan fel eller varningar', () => {
    expect(valideraEgenskaper('sovsack', sovsack)).toEqual({ fel: [], varningar: [] })
  })

  it('varnar men stoppar inte när det som behövs för jämförelser saknas', () => {
    const r = valideraEgenskaper('quilt', { fyllnadsvikt_g: 300 })
    expect(r.fel).toEqual([])
    expect(r.varningar.map((v) => v.split(':')[0])).toEqual(['komfort_temp_c', 'limit_temp_c', 'fyllning', 'form', 'max_langd_cm'])
  })

  it('tolkar minusgrader, även med typografiskt minustecken', () => {
    expect(tolkaEgenskap(falt('komfort_temp_c'), '-3')).toEqual({ varde: -3 })
    expect(tolkaEgenskap(falt('komfort_temp_c'), '\u22123')).toEqual({ varde: -3 })
    expect(tolkaEgenskap(falt('komfort_temp_c'), '0')).toEqual({ varde: 0 })
    expect(tolkaEgenskap(falt('komfort_temp_c'), '-3,5')).toHaveProperty('fel')
    expect(tolkaEgenskap(falt('komfort_temp_c'), '--3')).toHaveProperty('fel')
  })

  it.each([
    ['komfort_temp_c', -41, -45],
    ['komfort_temp_c', 26, 20],
    ['limit_temp_c', -51, undefined],
    ['extrem_temp_c', -71, undefined],
    ['fillpower_cuin', 399, undefined],
    ['fillpower_cuin', 1001, undefined],
    ['fyllnadsvikt_g', 49, undefined],
    ['fyllnadsvikt_g', 3001, undefined],
    ['max_langd_cm', 139, undefined],
    ['max_langd_cm', 231, undefined],
  ])('ger fel när %s är %s', (nyckel, varde, limit) => {
    // Extrem och limit sätts så lågt att bara gränsen för den provade egenskapen bryts.
    const e = { ...sovsack, extrem_temp_c: -70, ...(limit === undefined ? {} : { limit_temp_c: limit }), [nyckel]: varde }
    expect(felnycklar(e)).toEqual([nyckel])
  })

  it('godtar gränsvärdena', () => {
    expect(felnycklar({ komfort_temp_c: 25, limit_temp_c: 20, extrem_temp_c: 15 })).toEqual([])
    expect(felnycklar({ komfort_temp_c: -40, limit_temp_c: -50, extrem_temp_c: -70 })).toEqual([])
    expect(felnycklar({ fyllning: 'dun', fillpower_cuin: 400, fyllnadsvikt_g: 50, max_langd_cm: 140 })).toEqual([])
    expect(felnycklar({ fyllning: 'dun', fillpower_cuin: 1000, fyllnadsvikt_g: 3000, max_langd_cm: 230 })).toEqual([])
  })

  it('godtar bara de val som finns', () => {
    expect(felnycklar({ ...sovsack, temperaturstandard: 'en' })).toEqual(['temperaturstandard'])
    expect(felnycklar({ ...sovsack, fyllning: 'ull', fillpower_cuin: undefined })).toEqual(['fyllning'])
    expect(felnycklar({ ...sovsack, form: 'kokong' })).toEqual(['form'])
    expect(felnycklar({ ...sovsack, dragkedja: 'mitten' })).toEqual(['dragkedja'])
    for (const form of ['mumie', 'rektangular', 'quilt', 'annat']) expect(felnycklar({ ...sovsack, form }), form).toEqual([])
    for (const dragkedja of ['vanster', 'hoger', 'ingen']) expect(felnycklar({ ...sovsack, dragkedja }), dragkedja).toEqual([])
    expect(felnycklar({ ...sovsack, temperaturstandard: 'ej_angiven' })).toEqual([])
  })

  it('limit får inte vara högre än komfort', () => {
    expect(felnycklar({ ...sovsack, komfort_temp_c: -9, limit_temp_c: -3 })).toEqual(['limit_temp_c'])
    expect(felnycklar({ ...sovsack, komfort_temp_c: -5, limit_temp_c: -5 })).toEqual([])
  })

  it('extrem får inte vara högre än limit', () => {
    expect(felnycklar({ ...sovsack, limit_temp_c: -9, extrem_temp_c: -5 })).toEqual(['extrem_temp_c'])
    expect(felnycklar({ ...sovsack, limit_temp_c: -9, extrem_temp_c: -9 })).toEqual([])
  })

  it('jämför bara temperaturer som är ifyllda', () => {
    expect(felnycklar({ komfort_temp_c: -3, extrem_temp_c: 2 })).toEqual([])
    expect(felnycklar({ limit_temp_c: 5 })).toEqual([])
  })

  it('fillpower anges bara för dun', () => {
    expect(felnycklar({ ...sovsack, fyllning: 'syntet' })).toEqual(['fillpower_cuin'])
    expect(felnycklar({ ...sovsack, fyllning: 'blandning' })).toEqual(['fillpower_cuin'])
    expect(felnycklar({ fillpower_cuin: 800 })).toEqual(['fillpower_cuin'])
    const { fillpower_cuin: _f, ...utan } = sovsack
    expect(felnycklar({ ...utan, fyllning: 'syntet' })).toEqual([])
  })

  it('reglerna gäller också quilts, men inte tält', () => {
    expect(felnycklar({ komfort_temp_c: -9, limit_temp_c: -3 }, 'quilt')).toEqual(['limit_temp_c'])
    expect(valideraEgenskaper('talt', { personer: 2 }).fel).toEqual([])
  })

  describe('i förrådets utfällning', () => {
    const rader = (e: Record<string, unknown>) => visaEgenskaper('sovsack', e).map((r) => `${r.etikett}: ${r.varde}`)

    it('visar temperaturer, fyllning, fillpower, form och längd, och döljer resten', () => {
      expect(rader(sovsack)).toEqual([
        'Komforttemperatur: \u22123 °C',
        'Limittemperatur: \u22129 °C',
        'Fyllning: Dun',
        'Fillpower: 800 cuin',
        'Form: Mumie',
        'Max längd: 185 cm',
      ])
    })

    it('skriver ej ISO-testad vid temperaturerna när standarden inte är angiven', () => {
      expect(rader({ ...sovsack, temperaturstandard: 'ej_angiven' }).slice(0, 2)).toEqual([
        'Komforttemperatur: \u22123 °C (ej ISO-testad)',
        'Limittemperatur: \u22129 °C (ej ISO-testad)',
      ])
      const { temperaturstandard: _t, ...utan } = sovsack
      expect(rader(utan)[0]).toBe('Komforttemperatur: \u22123 °C')
    })

    it('visar bara det som har ett värde, och plusgrader utan tecken', () => {
      expect(rader({ komfort_temp_c: 12, fyllning: 'syntet', form: 'rektangular' })).toEqual(['Komforttemperatur: 12 °C', 'Fyllning: Syntet', 'Form: Rektangulär'])
      expect(rader({ limit_temp_c: 0 })).toEqual(['Limittemperatur: 0 °C'])
      expect(rader({})).toEqual([])
    })
  })
})
