import { describe, expect, it } from 'vitest'
import { ALLA_EGENSKAPSNYCKLAR, EGENSKAPER, egenskaperFor, tolkaEgenskap, valideraEgenskaper, visaEgenskaper, viktstorlekText, type Egenskap } from './produktegenskaper'

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
  it('tält, tarp, vindsäck, sovsäck, quilt, liggunderlag, ryggsäckar, kök och kokkärl har egenskaper än så länge', () => {
    expect(Object.keys(EGENSKAPER)).toEqual(['talt', 'tarp', 'vindsack', 'sovsack', 'quilt', 'liggunderlag', 'ryggsack', 'dagsryggsack', 'brannare', 'komplett_kok', 'kastrull', 'bransle', 'filter', 'rening', 'stavar', 'pannlampa', 'isolering', 'regnklader'])
    expect(ALLA_EGENSKAPSNYCKLAR.has('golvyta_m2')).toBe(true)
    expect(ALLA_EGENSKAPSNYCKLAR.has('kommentar')).toBe(false)
  })

  it('godkänner tomma egenskaper och ger fel om något ändå anges', () => {
    expect(valideraEgenskaper('kudde', {})).toEqual({ fel: [], varningar: [] })
    expect(valideraEgenskaper('kudde', { r_varde: 4 }).fel).toHaveLength(1)
    // En hängmatta ligger i samma huvudkategori som tält men har inga egna egenskaper.
    expect(valideraEgenskaper('hangmatta', { personer: 2 }).fel).toHaveLength(1)
  })
})

describe('visaEgenskaper', () => {
  const rader = (under: string, egenskaper: Record<string, unknown> | null) => visaEgenskaper(under, egenskaper).map((r) => `${r.etikett}: ${r.varde}`)

  it('skriver stavtypen med ä: Fällbar, inte Fallbar', () => {
    expect(rader('stavar', { typ: 'fallbar' })).toEqual(['Typ: Fällbar'])
  })

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
    expect(rader('kudde', { personer: 1 })).toEqual([])
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

  it('fillpower anges bara för dun och blandning', () => {
    expect(felnycklar({ ...sovsack, fyllning: 'dun' })).toEqual([])
    expect(felnycklar({ ...sovsack, fyllning: 'blandning' })).toEqual([])
    expect(felnycklar({ ...sovsack, fyllning: 'syntet' })).toEqual(['fillpower_cuin'])
    expect(felnycklar({ fillpower_cuin: 800 })).toEqual(['fillpower_cuin'])
    const { fillpower_cuin: _f, ...utan } = sovsack
    expect(felnycklar({ ...utan, fyllning: 'syntet' })).toEqual([])
  })

  it('reglerna gäller också quilts, men inte tält', () => {
    expect(felnycklar({ komfort_temp_c: -9, limit_temp_c: -3 }, 'quilt')).toEqual(['limit_temp_c'])
    expect(valideraEgenskaper('talt', { personer: 2 }).fel).toEqual([])
  })

  describe('i förrådets utfällning', () => {
    const rader = (e: Record<string, unknown>, bara?: 'viktiga' | 'ovriga') =>
      visaEgenskaper('sovsack', e)
        .filter((r) => (bara === 'viktiga' ? r.viktig : bara === 'ovriga' ? !r.viktig : true))
        .map((r) => `${r.etikett}: ${r.varde}`)

    it('visar temperaturer, fyllning, form och längd först', () => {
      expect(rader(sovsack, 'viktiga')).toEqual(['Komforttemperatur: \u22123 °C', 'Limittemperatur: \u22129 °C', 'Fyllning: Dun', 'Form: Mumie', 'Max längd: 185 cm'])
    })

    it('lägger resten bland alla specifikationer', () => {
      expect(rader(sovsack, 'ovriga')).toEqual([
        'Extremtemperatur: \u221228 °C',
        'Temperaturstandard: ISO',
        'Fillpower: 800 cuin',
        'Fyllnadsvikt: 480 g',
        'Dragkedja: Vänster',
        'Materialbeskrivning: Yttertyg i 20D nylon',
        'Packmått (cm): 30 x 17',
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

describe('de viktigaste egenskaperna per underkategori', () => {
  const viktiga = (under: string) => egenskaperFor(under).filter((e) => e.viktig).map((e) => e.nyckel)

  it('tält: personer, säsong, konstruktion, fristående, golvyta och absider', () => {
    expect(viktiga('talt')).toEqual(['personer', 'sasong', 'konstruktion', 'fristaende', 'golvyta_m2', 'absider'])
  })

  it('sovsäck och quilt: komfort, limit, fyllning, form och max längd', () => {
    for (const under of ['sovsack', 'quilt']) expect(viktiga(under)).toEqual(['komfort_temp_c', 'limit_temp_c', 'fyllning', 'form', 'max_langd_cm'])
  })

  it('tarp och vindsäck: personer, längd och material', () => {
    for (const under of ['tarp', 'vindsack']) expect(viktiga(under)).toEqual(['personer', 'langd_cm', 'material_typ'])
  })
})

describe('egenskaper för liggunderlag', () => {
  const underlag = {
    typ: 'luft',
    r_varde: 4.2,
    r_varde_standard: 'astm',
    langd_cm: 183,
    bredd_cm: 51,
    tjocklek_cm: 7.5,
    form: 'mumie',
    ventil: 'platt',
    pumpsack_ingar: true,
    material_beskrivning: '30D ripstopnylon',
    packmatt_cm: '23 x 10',
  }
  const falt = (nyckel: string): Egenskap => egenskaperFor('liggunderlag').find((e) => e.nyckel === nyckel)!
  const felnycklar = (e: Record<string, unknown>) => valideraEgenskaper('liggunderlag', e).fel.map((f) => f.split(':')[0])

  it('har elva egenskaper, varav fem behövs för jämförelser', () => {
    expect(egenskaperFor('liggunderlag').map((e) => e.nyckel)).toEqual(Object.keys(underlag))
    expect(egenskaperFor('liggunderlag').filter((e) => e.forJamforelse).map((e) => e.nyckel)).toEqual(['typ', 'r_varde', 'langd_cm', 'bredd_cm', 'tjocklek_cm'])
  })

  it('godkänner ett komplett liggunderlag utan fel eller varningar', () => {
    expect(valideraEgenskaper('liggunderlag', underlag)).toEqual({ fel: [], varningar: [] })
  })

  it('varnar men stoppar inte när det som behövs för jämförelser saknas', () => {
    const r = valideraEgenskaper('liggunderlag', { form: 'mumie' })
    expect(r.fel).toEqual([])
    expect(r.varningar.map((v) => v.split(':')[0])).toEqual(['typ', 'r_varde', 'langd_cm', 'bredd_cm', 'tjocklek_cm'])
  })

  it('tolkar R-värde och tjocklek med decimalkomma eller punkt', () => {
    expect(tolkaEgenskap(falt('r_varde'), '4,2')).toEqual({ varde: 4.2 })
    expect(tolkaEgenskap(falt('r_varde'), '4.2')).toEqual({ varde: 4.2 })
    expect(tolkaEgenskap(falt('tjocklek_cm'), '0,4')).toEqual({ varde: 0.4 })
    expect(tolkaEgenskap(falt('pumpsack_ingar'), 'ja')).toEqual({ varde: true })
    expect(tolkaEgenskap(falt('r_varde_standard'), 'ASTM')).toEqual({ varde: 'astm' })
  })

  it.each([
    ['r_varde', 0],
    ['r_varde', 12.1],
    ['langd_cm', 99],
    ['langd_cm', 231],
    ['bredd_cm', 29],
    ['bredd_cm', 151],
    ['tjocklek_cm', 0.1],
    ['tjocklek_cm', 20.5],
    ['langd_cm', 183.5],
  ])('ger fel när %s är %s', (nyckel, varde) => {
    expect(felnycklar({ ...underlag, [nyckel]: varde })).toEqual([nyckel])
  })

  it('godtar gränsvärdena', () => {
    expect(felnycklar({ ...underlag, r_varde: 0.1, langd_cm: 100, bredd_cm: 30, tjocklek_cm: 0.2 })).toEqual([])
    expect(felnycklar({ ...underlag, r_varde: 12, langd_cm: 230, bredd_cm: 150, tjocklek_cm: 20 })).toEqual([])
  })

  it('godtar bara de val som finns', () => {
    expect(felnycklar({ ...underlag, typ: 'dun' })).toEqual(['typ'])
    expect(felnycklar({ ...underlag, r_varde_standard: 'en' })).toEqual(['r_varde_standard'])
    expect(felnycklar({ ...underlag, form: 'quilt' })).toEqual(['form'])
    expect(felnycklar({ ...underlag, ventil: 'dubbel' })).toEqual(['ventil'])
    expect(felnycklar({ ...underlag, pumpsack_ingar: 'ja' })).toEqual(['pumpsack_ingar'])
    for (const typ of ['luft', 'sjalvuppblasande', 'annat']) expect(felnycklar({ ...underlag, typ }), typ).toEqual([])
    for (const ventil of ['platt', 'traditionell', 'ingen', 'annat']) expect(felnycklar({ ...underlag, ventil }), ventil).toEqual([])
    for (const form of ['rektangular', 'mumie', 'annat']) expect(felnycklar({ ...underlag, form }), form).toEqual([])
  })

  it('ett underlag av skum får inte ha en ventil', () => {
    expect(felnycklar({ ...underlag, typ: 'skum', ventil: 'platt' })).toEqual(['ventil'])
    expect(felnycklar({ ...underlag, typ: 'skum', ventil: 'annat' })).toEqual(['ventil'])
    expect(felnycklar({ ...underlag, typ: 'skum', ventil: 'ingen' })).toEqual([])
    const { ventil: _v, ...utanVentil } = underlag
    expect(felnycklar({ ...utanVentil, typ: 'skum' })).toEqual([])
  })

  it('andra typer får ha vilken ventil som helst, även ingen', () => {
    expect(felnycklar({ ...underlag, typ: 'luft', ventil: 'ingen' })).toEqual([])
    expect(felnycklar({ ...underlag, typ: 'sjalvuppblasande', ventil: 'traditionell' })).toEqual([])
  })

  describe('i förrådets utfällning', () => {
    const rader = (e: Record<string, unknown>, bara?: 'viktiga' | 'ovriga') =>
      visaEgenskaper('liggunderlag', e)
        .filter((r) => (bara === 'viktiga' ? r.viktig : bara === 'ovriga' ? !r.viktig : true))
        .map((r) => `${r.etikett}: ${r.varde}`)

    it('visar typ, R-värde, längd x bredd och tjocklek först', () => {
      expect(rader(underlag, 'viktiga')).toEqual(['Typ: Luft', 'R-värde: 4,2', 'Längd x bredd: 183 x 51 cm', 'Tjocklek: 7,5 cm'])
    })

    it('lägger resten bland alla specifikationer', () => {
      expect(rader(underlag, 'ovriga')).toEqual([
        'Standard för R-värde: ASTM',
        'Form: Mumie',
        'Ventil: Platt',
        'Pumpsäck ingår: Ja',
        'Materialbeskrivning: 30D ripstopnylon',
        'Packmått (cm): 23 x 10',
      ])
    })

    it('skriver ej ASTM-testat vid R-värdet när standarden inte är angiven', () => {
      expect(rader({ ...underlag, r_varde_standard: 'ej_angiven' })[1]).toBe('R-värde: 4,2 (ej ASTM-testat)')
      const { r_varde_standard: _s, ...utan } = underlag
      expect(rader(utan)[1]).toBe('R-värde: 4,2')
    })

    it('visar längd och bredd var för sig när bara den ena finns', () => {
      expect(rader({ langd_cm: 183 })).toEqual(['Längd: 183 cm'])
      expect(rader({ bredd_cm: 51 })).toEqual(['Bredd: 51 cm'])
    })

    it('skriver ut självuppblåsande med å, ä och ö, och visar bara det som har ett värde', () => {
      expect(rader({ typ: 'sjalvuppblasande', pumpsack_ingar: false })).toEqual(['Typ: Självuppblåsande', 'Pumpsäck ingår: Nej'])
      expect(rader({})).toEqual([])
    })
  })

  it('är de viktigaste: typ, R-värde, längd, bredd och tjocklek', () => {
    expect(egenskaperFor('liggunderlag').filter((e) => e.viktig).map((e) => e.nyckel)).toEqual(['typ', 'r_varde', 'langd_cm', 'bredd_cm', 'tjocklek_cm'])
  })
})

describe('egenskaper för ryggsäck och dagsryggsäck', () => {
  const ryggsack = {
    volym_l: 55,
    passform: 'unisex',
    torso_min_cm: 42,
    torso_max_cm: 58,
    justerbar_rygg: true,
    ram: 'intern',
    max_last_kg: 20,
    hoftbalte: 'fast',
    atkomst: 'topp_och_front',
    regnskydd_ingar: true,
    material_beskrivning: 'Vinylon F',
  }
  const falt = (nyckel: string): Egenskap => egenskaperFor('ryggsack').find((e) => e.nyckel === nyckel)!
  const felnycklar = (e: Record<string, unknown>, under = 'ryggsack') => valideraEgenskaper(under, e).fel.map((f) => f.split(':')[0])

  it('har samma elva egenskaper för ryggsäck och dagsryggsäck, varav fem behövs för jämförelser', () => {
    for (const under of ['ryggsack', 'dagsryggsack']) {
      expect(egenskaperFor(under).map((e) => e.nyckel)).toEqual(Object.keys(ryggsack))
      expect(egenskaperFor(under).filter((e) => e.forJamforelse).map((e) => e.nyckel)).toEqual(['volym_l', 'passform', 'torso_min_cm', 'torso_max_cm', 'ram'])
    }
  })

  it('godkänner en komplett ryggsäck utan fel eller varningar', () => {
    expect(valideraEgenskaper('ryggsack', ryggsack)).toEqual({ fel: [], varningar: [] })
  })

  it('varnar men stoppar inte när det som behövs för jämförelser saknas', () => {
    const r = valideraEgenskaper('dagsryggsack', { hoftbalte: 'inget' })
    expect(r.fel).toEqual([])
    expect(r.varningar.map((v) => v.split(':')[0])).toEqual(['volym_l', 'passform', 'torso_min_cm', 'torso_max_cm', 'ram'])
  })

  it('tolkar volym och maxlast med decimalkomma eller punkt', () => {
    expect(tolkaEgenskap(falt('volym_l'), '22,5')).toEqual({ varde: 22.5 })
    expect(tolkaEgenskap(falt('volym_l'), '22.5')).toEqual({ varde: 22.5 })
    expect(tolkaEgenskap(falt('max_last_kg'), '18')).toEqual({ varde: 18 })
    expect(tolkaEgenskap(falt('torso_min_cm'), '42,5')).toHaveProperty('fel')
    expect(tolkaEgenskap(falt('justerbar_rygg'), 'Nej')).toEqual({ varde: false })
  })

  it.each([
    ['volym_l', 0.5],
    ['volym_l', 151],
    ['torso_min_cm', 24],
    ['torso_max_cm', 76],
    ['max_last_kg', 0.5],
    ['max_last_kg', 61],
  ])('ger fel när %s är %s', (nyckel, varde) => {
    expect(felnycklar({ ...ryggsack, [nyckel]: varde })).toEqual([nyckel])
  })

  it('godtar gränsvärdena', () => {
    expect(felnycklar({ ...ryggsack, volym_l: 1, torso_min_cm: 25, torso_max_cm: 25, max_last_kg: 1 })).toEqual([])
    expect(felnycklar({ ...ryggsack, volym_l: 150, torso_min_cm: 75, torso_max_cm: 75, max_last_kg: 60 })).toEqual([])
  })

  it('godtar bara de val som finns', () => {
    expect(felnycklar({ ...ryggsack, passform: 'barn' })).toEqual(['passform'])
    expect(felnycklar({ ...ryggsack, ram: 'aluminium' })).toEqual(['ram'])
    expect(felnycklar({ ...ryggsack, hoftbalte: 'ja' })).toEqual(['hoftbalte'])
    expect(felnycklar({ ...ryggsack, atkomst: 'botten' })).toEqual(['atkomst'])
    expect(felnycklar({ ...ryggsack, regnskydd_ingar: 'ja' })).toEqual(['regnskydd_ingar'])
    for (const passform of ['dam', 'herr', 'unisex']) expect(felnycklar({ ...ryggsack, passform }), passform).toEqual([])
    for (const ram of ['intern', 'ingen', 'extern', 'annat']) expect(felnycklar({ ...ryggsack, ram }), ram).toEqual([])
    for (const hoftbalte of ['fast', 'avtagbart', 'enkelt', 'inget']) expect(felnycklar({ ...ryggsack, hoftbalte }), hoftbalte).toEqual([])
    for (const atkomst of ['topp', 'topp_och_front', 'topp_och_sida', 'front', 'annat']) expect(felnycklar({ ...ryggsack, atkomst }), atkomst).toEqual([])
  })

  it('den minsta rygglängden får inte vara större än den största', () => {
    expect(felnycklar({ ...ryggsack, torso_min_cm: 60, torso_max_cm: 50 })).toEqual(['torso_min_cm'])
    expect(felnycklar({ ...ryggsack, torso_min_cm: 50, torso_max_cm: 50 })).toEqual([])
    expect(felnycklar({ torso_min_cm: 60, torso_max_cm: 50 }, 'dagsryggsack')).toEqual(['torso_min_cm'])
  })

  it('jämför bara rygglängderna när båda är ifyllda', () => {
    expect(felnycklar({ torso_min_cm: 60 })).toEqual([])
    expect(felnycklar({ torso_max_cm: 30 })).toEqual([])
  })

  describe('i förrådets utfällning', () => {
    const rader = (e: Record<string, unknown>, bara?: 'viktiga' | 'ovriga') =>
      visaEgenskaper('ryggsack', e)
        .filter((r) => (bara === 'viktiga' ? r.viktig : bara === 'ovriga' ? !r.viktig : true))
        .map((r) => `${r.etikett}: ${r.varde}`)

    it('visar volym, passform, rygglängd, ram och maxlast först', () => {
      expect(rader(ryggsack, 'viktiga')).toEqual(['Volym: 55 l', 'Passform: Unisex', 'Rygglängd: 42\u201358 cm', 'Ram: Intern', 'Maxlast: 20 kg'])
    })

    it('lägger resten bland alla specifikationer', () => {
      expect(rader(ryggsack, 'ovriga')).toEqual([
        'Justerbar rygg: Ja',
        'Höftbälte: Fast',
        'Åtkomst: Topp och front',
        'Regnskydd ingår: Ja',
        'Materialbeskrivning: Vinylon F',
      ])
    })

    it('visar bara den ena rygglängden när den andra saknas, och ett värde när de är lika', () => {
      expect(rader({ torso_min_cm: 42 })).toEqual(['Rygglängd: 42 cm'])
      expect(rader({ torso_max_cm: 58 })).toEqual(['Rygglängd: 58 cm'])
      expect(rader({ torso_min_cm: 48, torso_max_cm: 48 })).toEqual(['Rygglängd: 48 cm'])
    })

    it('visar bara det som har ett värde, och volym med decimalkomma', () => {
      expect(rader({ volym_l: 22.5, atkomst: 'topp_och_sida', regnskydd_ingar: false })).toEqual(['Volym: 22,5 l', 'Åtkomst: Topp och sida', 'Regnskydd ingår: Nej'])
      expect(rader({})).toEqual([])
    })
  })
})

describe('egenskaper för kök och brännare', () => {
  const kok = {
    typ: 'systemkok',
    bransle: 'gas',
    personer: 2,
    effekt_w: 1500,
    koktid_1l_min: 4.5,
    forbrukning_g_h: 120,
    regulator: false,
    kokkarl_l: 1,
    tandare: true,
    patronfaste: 'EN 417',
    packmatt_cm: '12 x 16',
    system: 'jetboil_fluxring',
  }
  const felnycklar = (e: Record<string, unknown>) => valideraEgenskaper('komplett_kok', e).fel.map((f) => f.split(':')[0])

  it('har tolv egenskaper, varav fem behövs för jämförelser, samma för brännare och kompletta kök', () => {
    expect(egenskaperFor('brannare').map((e) => e.nyckel)).toEqual(Object.keys(kok))
    expect(egenskaperFor('komplett_kok')).toEqual(egenskaperFor('brannare'))
    expect(egenskaperFor('brannare').filter((e) => e.forJamforelse).map((e) => e.nyckel)).toEqual(['typ', 'bransle', 'personer', 'effekt_w', 'koktid_1l_min'])
  })

  it('godkänner ett komplett kök utan fel eller varningar', () => {
    expect(valideraEgenskaper('komplett_kok', kok)).toEqual({ fel: [], varningar: [] })
  })

  it('varnar men stoppar inte när ett spritkök saknar effekt och koktid', () => {
    const r = valideraEgenskaper('komplett_kok', { typ: 'stormkok', bransle: 'sprit', personer: 2, kokkarl_l: 1.5 })
    expect(r.fel).toEqual([])
    expect(r.varningar.map((v) => v.split(':')[0])).toEqual(['effekt_w', 'koktid_1l_min'])
  })

  it('tillåter tändare och regulator bara på kök för gas eller multibränsle', () => {
    expect(felnycklar({ ...kok, bransle: 'sprit' })).toEqual(['tandare'])
    expect(felnycklar({ ...kok, bransle: 'ved', regulator: true })).toEqual(['regulator', 'tandare'])
    expect(felnycklar({ ...kok, bransle: 'multibransle', regulator: true })).toEqual([])
    // Nej är alltid tillåtet, också för spritkök.
    expect(felnycklar({ ...kok, bransle: 'sprit', tandare: false })).toEqual([])
  })

  it('kräver kokkärl för ett stormkök och ett systemkök', () => {
    const { kokkarl_l: _, ...utanKokkarl } = kok
    expect(felnycklar({ ...utanKokkarl, typ: 'stormkok' })).toEqual(['kokkarl_l'])
    expect(felnycklar({ ...utanKokkarl, typ: 'systemkok' })).toEqual(['kokkarl_l'])
  })

  it('kräver kokkärl för ett komplett kök och förbjuder det för en brännare', () => {
    const { kokkarl_l: _, ...utanKokkarl } = kok
    const brannare = { ...utanKokkarl, typ: 'toppmonterat' }
    expect(felnycklar(brannare)).toEqual(['kokkarl_l'])
    expect(valideraEgenskaper('brannare', brannare).fel).toEqual([])
    expect(valideraEgenskaper('brannare', { ...brannare, kokkarl_l: 1 }).fel.map((f) => f.split(':')[0])).toEqual(['kokkarl_l'])
  })

  it('ger fel för typer och bränslen som inte finns', () => {
    expect(felnycklar({ ...kok, typ: 'gasolkok', bransle: 'gasol' })).toEqual(['typ', 'bransle'])
  })

  it('visar typ och bränsle med svenska namn', () => {
    const rader = visaEgenskaper('brannare', { typ: 'slangkok', bransle: 'multibransle', koktid_1l_min: 3.5 })
    expect(rader.map((r) => r.varde)).toEqual(['Slangkök', 'Multibränsle', '3,5 min'])
  })
})

describe('egenskaper för kokkärl', () => {
  const kastrull = {
    typ: 'kastrull',
    volym_l: 1.3,
    material: 'hardanodiserad_aluminium',
    system: 'trangia_25',
    varmevaxlare: false,
    lock: true,
    antal_delar: 2,
    packmatt_cm: '18 x 10',
    bara_system: false,
  }

  it('har nio egenskaper, varav tre behövs för jämförelser', () => {
    expect(egenskaperFor('kastrull').map((e) => e.nyckel)).toEqual(Object.keys(kastrull))
    expect(egenskaperFor('kastrull').filter((e) => e.forJamforelse).map((e) => e.nyckel)).toEqual(['typ', 'volym_l', 'material'])
  })

  it('godkänner ett komplett kokkärl, också utan system', () => {
    expect(valideraEgenskaper('kastrull', kastrull)).toEqual({ fel: [], varningar: [] })
    const { system: _, ...utanSystem } = kastrull
    expect(valideraEgenskaper('kastrull', utanSystem)).toEqual({ fel: [], varningar: [] })
  })

  it('kräver system när kokkärlet bara passar sitt eget kök', () => {
    const { system: _, ...utanSystem } = kastrull
    expect(valideraEgenskaper('kastrull', { ...utanSystem, bara_system: true }).fel.map((f) => f.split(':')[0])).toEqual(['bara_system'])
  })

  it('ger fel för system som inte finns', () => {
    expect(valideraEgenskaper('kastrull', { ...kastrull, system: 'egen' }).fel.map((f) => f.split(':')[0])).toEqual(['system'])
  })

  it('visar system och material med svenska namn', () => {
    const rader = visaEgenskaper('kastrull', { material: 'hardanodiserad_aluminium', system: 'trangia_28' })
    expect(rader.map((r) => r.varde)).toEqual(['Hårdanodiserad aluminium', 'Trangia 28 (Mini)'])
  })
})

describe('egenskaper för bränsle', () => {
  const patron = { typ: 'skruvpatron', bransle_g: 230, tomvikt_g: 145, gasblandning: 'propan, butan och isobutan' }

  it('har fem egenskaper, varav två behövs för jämförelser', () => {
    expect(egenskaperFor('bransle').map((e) => e.nyckel)).toEqual(['typ', 'bransle_g', 'tomvikt_g', 'volym_l', 'gasblandning'])
    expect(egenskaperFor('bransle').filter((e) => e.forJamforelse).map((e) => e.nyckel)).toEqual(['typ', 'bransle_g'])
  })

  it('godkänner en gaspatron och en flaska sprit', () => {
    expect(valideraEgenskaper('bransle', patron)).toEqual({ fel: [], varningar: [] })
    expect(valideraEgenskaper('bransle', { typ: 'sprit', bransle_g: 800, volym_l: 1 })).toEqual({ fel: [], varningar: [] })
  })

  it('ger fel för volym på en patron och gasblandning på sprit', () => {
    expect(valideraEgenskaper('bransle', { ...patron, volym_l: 0.5 }).fel.map((f) => f.split(':')[0])).toEqual(['volym_l'])
    expect(valideraEgenskaper('bransle', { typ: 'sprit', gasblandning: 'butan' }).fel.map((f) => f.split(':')[0])).toEqual(['gasblandning'])
  })

  it('visar typen med svenskt namn', () => {
    expect(visaEgenskaper('bransle', patron).map((r) => r.varde)).toEqual(['Skruvpatron (EN 417)', '230 g', '145 g', 'propan, butan och isobutan'])
  })
})

describe('egenskaper för pannlampor', () => {
  const lampa = {
    typ: 'pannlampa',
    lumen_max: 450,
    rackvidd_max_m: 90,
    brinntid_hogsta_h: 4,
    brinntid_max_h: 120,
    batteri: 'hybrid',
    laddbar: true,
    laddport: 'usb-c',
    rott_ljus: true,
    laslage: true,
    vattentalighet: 'ipx8',
  }

  it('godkänner en komplett lampa utan fel eller varningar', () => {
    expect(valideraEgenskaper('pannlampa', lampa)).toEqual({ fel: [], varningar: [] })
  })

  it('markerar lumen, brinntid på högsta läget och batteri som de viktigaste', () => {
    expect(egenskaperFor('pannlampa').filter((e) => e.viktig).map((e) => e.nyckel)).toEqual(['lumen_max', 'brinntid_hogsta_h', 'batteri'])
  })

  it('varnar men stoppar inte när något som behövs för jämförelser saknas', () => {
    const { lumen_max: _l, batteri: _b, ...rest } = lampa
    const r = valideraEgenskaper('pannlampa', rest)
    expect(r.fel).toEqual([])
    expect(r.varningar.map((v) => v.split(':')[0])).toEqual(['lumen_max', 'batteri'])
  })

  it('godkänner bara de sex batterivärdena och ger fel för andra', () => {
    for (const batteri of ['inbyggt', 'aaa', 'aa', 'cr2032', 'hybrid', 'batteripack']) expect(valideraEgenskaper('pannlampa', { ...lampa, batteri }).fel).toEqual([])
    for (const batteri of ['externt li-ion', '18650', 'r2']) expect(valideraEgenskaper('pannlampa', { ...lampa, batteri }).fel.map((f) => f.split(':')[0])).toEqual(['batteri'])
  })

  it('tolkar batteri och vattentålighet med stora bokstäver', () => {
    const batteri = egenskaperFor('pannlampa').find((e) => e.nyckel === 'batteri')!
    expect(tolkaEgenskap(batteri, 'AAA')).toEqual({ varde: 'aaa' })
    expect(tolkaEgenskap(batteri, 'Hybrid')).toEqual({ varde: 'hybrid' })
    const tal = egenskaperFor('pannlampa').find((e) => e.nyckel === 'vattentalighet')!
    expect(tolkaEgenskap(tal, 'IPX8')).toEqual({ varde: 'ipx8' })
  })

  it('godkänner decimaler i brinntiden men inte en kortare tid på det svagaste läget än på högsta', () => {
    expect(valideraEgenskaper('pannlampa', { ...lampa, brinntid_hogsta_h: 2.5 }).fel).toEqual([])
    expect(valideraEgenskaper('pannlampa', { ...lampa, brinntid_hogsta_h: 90, brinntid_max_h: 50 }).fel.map((f) => f.split(':')[0])).toEqual(['brinntid_hogsta_h'])
  })

  it('visar värdena med svenska namn och enheter', () => {
    const rader = visaEgenskaper('pannlampa', lampa)
    expect(rader.find((r) => r.nyckel === 'lumen_max')).toMatchObject({ varde: '450 lumen', viktig: true })
    expect(rader.find((r) => r.nyckel === 'brinntid_hogsta_h')?.varde).toBe('4 h')
    expect(rader.find((r) => r.nyckel === 'batteri')?.varde).toBe('Hybrid')
    expect(rader.find((r) => r.nyckel === 'laddport')?.varde).toBe('USB-C')
    expect(rader.find((r) => r.nyckel === 'vattentalighet')?.varde).toBe('IPX8')
  })
})

describe('egenskaper för vattenrening', () => {
  const flaska = { typ: 'flaskfilter', kapacitet_l: 1000, flode_l_min: 2, porstorlek_mikron: 0.1, renar_bakterier: true, renar_virus: false, tal_frost: 'nej', passar_flaskgang: '42 mm' }
  const tabletter = { typ: 'tabletter', kapacitet_l: 70, renar_bakterier: true, renar_virus: true, verkningstid_min: 30, tal_frost: 'ej_angivet' }

  it('filter och reningstabletter har samma egenskaper', () => {
    expect(egenskaperFor('filter')).toBe(egenskaperFor('rening'))
  })

  it('godkänner ett komplett filter och tabletter utan fel eller varningar', () => {
    expect(valideraEgenskaper('filter', flaska)).toEqual({ fel: [], varningar: [] })
    expect(valideraEgenskaper('rening', tabletter)).toEqual({ fel: [], varningar: [] })
  })

  it('markerar typ, kapacitet, flöde och om viruset renas som de viktigaste', () => {
    expect(egenskaperFor('filter').filter((e) => e.viktig).map((e) => e.nyckel)).toEqual(['typ', 'kapacitet_l', 'flode_l_min', 'renar_virus'])
  })

  it('ger fel för en typ som inte finns och för värden utanför gränserna', () => {
    expect(valideraEgenskaper('filter', { ...flaska, typ: 'sil' }).fel.map((f) => f.split(':')[0])).toEqual(['typ'])
    expect(valideraEgenskaper('filter', { ...flaska, porstorlek_mikron: 0 }).fel.map((f) => f.split(':')[0])).toEqual(['porstorlek_mikron'])
  })

  it('tolkar flöde med både punkt och komma', () => {
    const flode = egenskaperFor('filter').find((e) => e.nyckel === 'flode_l_min')!
    expect(tolkaEgenskap(flode, '1.75')).toEqual({ varde: 1.75 })
    expect(tolkaEgenskap(flode, '1,75')).toEqual({ varde: 1.75 })
  })

  it('visar typ med svenskt namn och flödet med decimalkomma', () => {
    const rader = visaEgenskaper('filter', { typ: 'gravitationsfilter', flode_l_min: 1.75, tal_frost: 'ej_angivet' })
    expect(rader.map((r) => r.varde)).toEqual(['Gravitationsfilter', '1,75 l/min', 'Inte angivet'])
  })
})

describe('egenskaper för vandringsstavar', () => {
  const stav = { typ: 'fallbar', langd_min_cm: 110, langd_max_cm: 125, packlangd_cm: 37, material: 'kol', lasning: 'klamlas', grepp: 'kork_och_skum', fjadring: false }

  it('godkänner en komplett stav utan fel eller varningar', () => {
    expect(valideraEgenskaper('stavar', stav)).toEqual({ fel: [], varningar: [] })
  })

  it('markerar typ, längd, material och låsning som de viktigaste', () => {
    expect(egenskaperFor('stavar').filter((e) => e.viktig).map((e) => e.nyckel)).toEqual(['typ', 'langd_min_cm', 'langd_max_cm', 'material', 'lasning'])
  })

  it('ger fel när kortaste längden är större än längsta', () => {
    expect(valideraEgenskaper('stavar', { ...stav, langd_min_cm: 130 }).fel.map((f) => f.split(':')[0])).toEqual(['langd_min_cm'])
  })

  it('låsning och grepp är enkla val', () => {
    expect(valideraEgenskaper('stavar', { ...stav, lasning: 'FlickLock' }).fel.map((f) => f.split(':')[0])).toEqual(['lasning'])
    expect(valideraEgenskaper('stavar', { ...stav, grepp: 'Trek Pro 245' }).fel.map((f) => f.split(':')[0])).toEqual(['grepp'])
  })

  it('visar längden som ett spann, och packlängden med decimalkomma', () => {
    const rader = visaEgenskaper('stavar', { ...stav, packlangd_cm: 39.5 })
    expect(rader.find((r) => r.nyckel === 'langd_min_cm')).toMatchObject({ etikett: 'Längd', varde: '110–125 cm', viktig: true })
    expect(rader.find((r) => r.nyckel === 'langd_max_cm')).toBeUndefined()
    expect(rader.find((r) => r.nyckel === 'packlangd_cm')?.varde).toBe('39,5 cm')
    expect(rader.find((r) => r.nyckel === 'lasning')?.varde).toBe('Klämlås')
    expect(rader.find((r) => r.nyckel === 'grepp')?.varde).toBe('Kork och skum')
    expect(rader.find((r) => r.nyckel === 'fjadring')?.varde).toBe('Nej')
  })
})

describe('egenskaper för kläder', () => {
  const dunjacka = { kon: 'herr', viktstorlek: 'M', fyllning: 'dun', fillpower: 800, fyllnadsvikt_g: 90, huva: true, tyg: 'Pertex Quantum' }
  const regnjacka = { kon: 'dam', viktstorlek: 'S', plagg: 'jacka', membran: 'GORE-TEX Paclite Plus', lager: '2,5', vattenpelare_mm: 28000, huva: true, ventilation: false }

  it('godkänner en komplett dunjacka och regnjacka', () => {
    expect(valideraEgenskaper('isolering', dunjacka)).toEqual({ fel: [], varningar: [] })
    expect(valideraEgenskaper('regnklader', regnjacka)).toEqual({ fel: [], varningar: [] })
  })

  it('ger fel när en syntetjacka har fillpower', () => {
    expect(valideraEgenskaper('isolering', { ...dunjacka, fyllning: 'syntet' }).fel.map((f) => f.split(':')[0])).toEqual(['fillpower'])
  })

  it('läser 2,5 lager som ett val', () => {
    expect(tolkaEgenskap(egenskaperFor('regnklader').find((e) => e.nyckel === 'lager')!, '2,5')).toEqual({ varde: '2,5' })
  })

  it('visar vilken storlek vikten gäller', () => {
    expect(visaEgenskaper('isolering', dunjacka).find((r) => r.nyckel === 'viktstorlek')).toMatchObject({ etikett: 'Vikten gäller storlek', varde: 'M', viktig: true })
  })
})

describe('viktstorlekText', () => {
  it('visar kön och storleken vikten gäller för kläder', () => {
    expect(viktstorlekText('isolering', { kon: 'herr', viktstorlek: 'M' })).toBe('Herr, vikt i storlek M')
    expect(viktstorlekText('regnklader', { kon: 'dam', viktstorlek: '10 (UK)' })).toBe('Dam, vikt i storlek 10 (UK)')
  })

  it('säger när storleken saknas, och ger null för annat än kläder', () => {
    expect(viktstorlekText('regnklader', { kon: 'unisex' })).toBe('Unisex, storleken för vikten anges inte')
    expect(viktstorlekText('isolering', null)).toBe('Storleken för vikten anges inte')
    expect(viktstorlekText('talt', { kon: 'herr', viktstorlek: 'M' })).toBeNull()
  })
})
