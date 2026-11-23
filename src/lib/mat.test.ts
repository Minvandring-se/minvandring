import { describe, expect, it } from 'vitest'
import {
  dagssummor,
  formateraKcal,
  inkopsgrupper,
  inkopslista,
  kcalPer100g,
  matdagar,
  matsummering,
  matviktTotalt,
  naringForRader,
  PASAR_TILL,
  pasdetaljer,
  pasePerPortion,
  pasnamn,
  rattPerPortion,
  tolkaRattformular,
  tolkaTal,
  type Ingrediensfalt,
  type Matdata,
  type Pase,
} from './mat'
import type { Ingrediens, Maltid, Maltidsrad, Matprodukt, Ratt, Vara } from './typer'

const ratt = (id: string, extra: Partial<Ratt> = {}): Ratt => ({ id, namn: id, matprodukt_id: null, ansvarig: null, klart: false, ...extra })
const vara = (id: string, extra: Partial<Vara> = {}): Vara => ({
  id,
  namn: id,
  kcal_per_100g: 400,
  protein_per_100g: 10,
  extra_g: 0,
  varifran: 'kopa',
  ansvarig: null,
  klart: false,
  ...extra,
})
const ing = (ratt_id: string, vara_id: string, gram_per_portion: number): Ingrediens => ({ id: `${ratt_id}-${vara_id}`, ratt_id, vara_id, gram_per_portion })
let nasta = 0
const maltid = (dag: number, m: Maltid, ratt_id: string): Maltidsrad => ({ id: `m${nasta++}`, dag, maltid: m, ratt_id, sortering: 0 })

// En påse med två portioner: 300 g och 1 400 kcal.
const gryta: Pase = { id: 'p-gryta', vikt_torr_g: 300, portioner: 2, kcal: 1400, protein_g: 60 }

/** Gröt (egen) till frukost och en påse till middag. */
function plan(maltider: Maltidsrad[], extra: Partial<Matdata> = {}): Matdata {
  return {
    ratter: [ratt('Gröt'), ratt('Gryta', { matprodukt_id: gryta.id, ansvarig: 'erik' })],
    ingredienser: [ing('Gröt', 'Havregryn', 90), ing('Gröt', 'Russin', 30)],
    varor: [vara('Havregryn', { kcal_per_100g: 370, protein_per_100g: 13 }), vara('Russin', { kcal_per_100g: 300, protein_per_100g: 3, ansvarig: 'lisa' })],
    pasar: new Map([[gryta.id, gryta]]),
    maltider,
    ...extra,
  }
}

describe('matdagar', () => {
  it('ger vandringsdagarna och sedan reservdagarna', () => {
    expect(matdagar(2, 1)).toEqual([
      { dag: 1, reserv: false, namn: 'Dag 1' },
      { dag: 2, reserv: false, namn: 'Dag 2' },
      { dag: 3, reserv: true, namn: 'Reservdag 1' },
    ])
  })

  it('är tom tills antalet dagar är angivet', () => {
    expect(matdagar(null, 1)).toEqual([])
    expect(matdagar(0, 1)).toEqual([])
  })
})

describe('formateraKcal', () => {
  it('avrundar och skriver tusental med mellanslag', () => {
    expect(formateraKcal(1249.6).replace(/\s/g, ' ')).toBe('1 250 kcal')
    expect(formateraKcal(423)).toBe('423 kcal')
  })
})

describe('kcalPer100g', () => {
  it('räknar och avrundar', () => {
    expect(kcalPer100g(600, 150)).toBe(400)
    expect(kcalPer100g(1400, 300)).toBe(467)
  })

  it('är tom utan vikt', () => {
    expect(kcalPer100g(600, 0)).toBeNull()
  })
})

describe('rätter per portion', () => {
  it('delar påsen med antalet portioner', () => {
    expect(pasePerPortion(gryta)).toEqual({ kcal: 700, proteinG: 30, gram: 150, ofullstandig: false })
  })

  it('en påse utan protein är ofullständig', () => {
    expect(pasePerPortion({ ...gryta, protein_g: null }).ofullstandig).toBe(true)
  })

  it('summerar ingredienserna i en egen rätt', () => {
    const n = rattPerPortion(ratt('Gröt'), plan([]))
    // 90 g × 3,7 + 30 g × 3,0 = 333 + 90 kcal. Protein 90 × 0,13 + 30 × 0,03 = 11,7 + 0,9.
    expect(n.kcal).toBeCloseTo(423)
    expect(n.proteinG).toBeCloseTo(12.6)
    expect(n.gram).toBe(120)
    expect(n.ofullstandig).toBe(false)
  })

  it('en ingrediens utan kcal gör rätten ofullständig', () => {
    const data = plan([], { varor: [vara('Havregryn', { kcal_per_100g: null }), vara('Russin')] })
    expect(rattPerPortion(ratt('Gröt'), data).ofullstandig).toBe(true)
  })

  it('en rätt utan ingredienser väger ingenting', () => {
    expect(rattPerPortion(ratt('Tom'), plan([]))).toEqual({ kcal: 0, proteinG: 0, gram: 0, ofullstandig: false })
  })
})

describe('dagssummor', () => {
  const dagar = matdagar(2, 0)

  it('summerar alla rätter per person och dag, även flera i samma måltid', () => {
    const data = plan([maltid(1, 'frukost', 'Gröt'), maltid(1, 'middag', 'Gryta'), maltid(1, 'middag', 'Gröt')])
    const [dag1, dag2] = dagssummor(data, dagar)
    expect(dag1.naring.kcal).toBeCloseTo(423 * 2 + 700)
    expect(dag1.naring.gram).toBe(120 * 2 + 150)
    expect(dag1.saknas).toEqual(['lunch'])
    expect(dag2.naring.kcal).toBe(0)
    expect(dag2.saknas).toEqual(['frukost', 'lunch', 'middag'])
  })

  it('räknar inte mellanmål som saknade', () => {
    const data = plan([maltid(1, 'frukost', 'Gröt'), maltid(1, 'lunch', 'Gröt'), maltid(1, 'middag', 'Gryta')])
    expect(dagssummor(data, dagar)[0].saknas).toEqual([])
  })
})

describe('inkopslista', () => {
  const dagar = matdagar(3, 1)

  it('räknar varorna för alla personer och alla gånger rätten äts', () => {
    const data = plan([maltid(1, 'frukost', 'Gröt'), maltid(2, 'frukost', 'Gröt')])
    const rader = inkopslista(data, dagar, 3)
    expect(rader.find((r) => r.id === 'Havregryn')?.gram).toBe(90 * 2 * 3)
    expect(rader.find((r) => r.id === 'Russin')).toMatchObject({ gram: 30 * 2 * 3, ansvarig: 'lisa', typ: 'vara' })
  })

  it('avrundar påsarna uppåt till hela påsar', () => {
    // Tre personer två kvällar är sex portioner: tre påsar med två portioner.
    const data = plan([maltid(1, 'middag', 'Gryta'), maltid(2, 'middag', 'Gryta')])
    expect(inkopslista(data, dagar, 3).find((r) => r.typ === 'pase')).toEqual({
      typ: 'pase',
      id: 'Gryta',
      namn: 'Gryta',
      gram: 900,
      pasar: 3,
      matproduktId: 'p-gryta',
      varifran: 'kopa',
      ansvarig: 'erik',
      klart: false,
    })
    // En kväll är tre portioner: två påsar.
    expect(inkopslista(plan([maltid(1, 'middag', 'Gryta')]), dagar, 3).find((r) => r.typ === 'pase')?.pasar).toBe(2)
  })

  it('tar med extra mängd även när varan inte används i någon rätt, men inte oanvända varor', () => {
    const data = plan([], { varor: [vara('Kaffe', { extra_g: 200, varifran: 'hemifran' }), vara('Oanvänd')] })
    expect(inkopslista(data, dagar, 2)).toEqual([
      { typ: 'vara', id: 'Kaffe', namn: 'Kaffe', gram: 200, varifran: 'hemifran', ansvarig: null, klart: false },
    ])
  })

  it('räknar inte måltider på dagar som inte längre finns i turen', () => {
    const data = plan([maltid(1, 'frukost', 'Gröt'), maltid(9, 'frukost', 'Gröt')])
    expect(inkopslista(data, dagar, 1).find((r) => r.id === 'Havregryn')?.gram).toBe(90)
  })

  it('är tom utan personer', () => {
    expect(inkopslista(plan([maltid(1, 'middag', 'Gryta'), maltid(1, 'frukost', 'Gröt')]), dagar, 0)).toEqual([])
  })

  it('sorterar efter namn på svenska', () => {
    const data = plan([], { varor: [vara('Ägg', { extra_g: 1 }), vara('Bröd', { extra_g: 1 }), vara('Ost', { extra_g: 1 })] })
    expect(inkopslista(data, dagar, 1).map((r) => r.namn)).toEqual(['Bröd', 'Ost', 'Ägg'])
  })
})

describe('inkopsgrupper', () => {
  it('grupperar det som ska köpas per ansvarig med det som ingen ansvarar för först', () => {
    const data = plan([maltid(1, 'frukost', 'Gröt'), maltid(1, 'middag', 'Gryta')], {
      varor: [vara('Havregryn'), vara('Russin', { ansvarig: 'lisa' }), vara('Kaffe', { extra_g: 100, varifran: 'hemifran' })],
    })
    const { attKopa, hemifran } = inkopsgrupper(inkopslista(data, matdagar(1, 0), 2), ['lisa', 'erik'])
    expect(attKopa.map((g) => [g.ansvarig, g.rader.map((r) => r.id)])).toEqual([
      [null, ['Havregryn']],
      ['lisa', ['Russin']],
      ['erik', ['Gryta']],
    ])
    expect(hemifran.map((r) => r.id)).toEqual(['Kaffe'])
  })

  it('behåller rader vars ansvariga inte finns bland deltagarna, sist', () => {
    const data = plan([], { varor: [vara('Havregryn', { extra_g: 1, ansvarig: 'borta' })] })
    expect(inkopsgrupper(inkopslista(data, matdagar(1, 0), 1), ['lisa']).attKopa.map((g) => g.ansvarig)).toEqual(['borta'])
  })
})

describe('summeringen', () => {
  it('ger total matvikt, snitt, lägsta dag och antal saknade måltider', () => {
    const dagar = matdagar(2, 0)
    const data = plan([maltid(1, 'frukost', 'Gröt'), maltid(1, 'middag', 'Gryta'), maltid(2, 'frukost', 'Gröt')])
    const s = matsummering(dagssummor(data, dagar))
    expect(s.snittKcal).toBeCloseTo((423 + 700 + 423) / 2)
    expect(s.lagstaKcal).toBeCloseTo(423)
    expect(s.saknadeMaltider).toBe(1 + 2)
    expect(s.ofullstandig).toBe(false)
    // Två personer: gröt 2 × 2 × 120 g och en kväll med gryta, två portioner i en påse på 300 g.
    expect(matviktTotalt(inkopslista(data, dagar, 2))).toBe(480 + 300)
  })

  it('är noll utan dagar', () => {
    expect(matsummering([])).toEqual({ snittKcal: 0, lagstaKcal: 0, snittProteinG: 0, saknadeMaltider: 0, ofullstandig: false })
  })
})

describe('tolkaTal', () => {
  it('tar emot komma, punkt och mellanslag', () => {
    expect(tolkaTal('12,5')).toBe(12.5)
    expect(tolkaTal(' 1 200 ')).toBe(1200)
    expect(tolkaTal('3.0')).toBe(3)
  })

  it('ger null för tomt och NaN för annat', () => {
    expect(tolkaTal('  ')).toBeNull()
    expect(tolkaTal('-5')).toBeNaN()
    expect(tolkaTal('tio')).toBeNaN()
  })
})

describe('tolkaRattformular', () => {
  const rad = (vara: string, gram: string, kcal = '', protein = ''): Ingrediensfalt => ({ vara, gram, kcal, protein })

  it('tolkar raderna och hoppar över tomma', () => {
    expect(tolkaRattformular(' Gröt ', [rad('Havregryn', '90', '370', '13,5'), rad('', ''), rad('Russin', '30')])).toEqual({
      ok: true,
      namn: 'Gröt',
      rader: [
        { vara: 'Havregryn', gram: 90, kcalPer100g: 370, proteinPer100g: 13.5 },
        { vara: 'Russin', gram: 30, kcalPer100g: null, proteinPer100g: null },
      ],
    })
  })

  it('kräver ett namn och minst en ingrediens', () => {
    expect(tolkaRattformular('', [rad('Havregryn', '90')])).toEqual({ ok: false, fel: 'Skriv vad rätten heter.' })
    expect(tolkaRattformular('Gröt', [rad('', '')])).toEqual({ ok: false, fel: 'Lägg till minst en ingrediens.' })
    expect(tolkaRattformular('x'.repeat(81), [rad('Havregryn', '90')]).ok).toBe(false)
  })

  it('säger vilken rad som är fel', () => {
    expect(tolkaRattformular('Gröt', [rad('Havregryn', '90'), rad('', '30')])).toEqual({ ok: false, fel: 'Ingrediens 2: skriv vad ingrediensen heter.' })
    expect(tolkaRattformular('Gröt', [rad('Havregryn', '0')])).toMatchObject({ ok: false, fel: expect.stringContaining('Ingrediens 1: skriv gram') })
    expect(tolkaRattformular('Gröt', [rad('Havregryn', '12,5')]).ok).toBe(false)
    expect(tolkaRattformular('Gröt', [rad('Havregryn', '90', '1000')]).ok).toBe(false)
    expect(tolkaRattformular('Gröt', [rad('Havregryn', '90', '', 'mycket')]).ok).toBe(false)
  })

  it('tar inte emot samma vara två gånger', () => {
    expect(tolkaRattformular('Gröt', [rad('Russin', '10'), rad('russin', '20')])).toEqual({
      ok: false,
      fel: 'russin står två gånger. Lägg ihop mängden på en rad.',
    })
  })
})

describe('naringForRader', () => {
  it('summerar en portion och märker saknade uppgifter', () => {
    expect(naringForRader([{ vara: 'Havregryn', gram: 100, kcalPer100g: 370, proteinPer100g: 13 }])).toEqual({
      kcal: 370,
      proteinG: 13,
      gram: 100,
      ofullstandig: false,
    })
    expect(naringForRader([{ vara: 'Russin', gram: 50, kcalPer100g: 300, proteinPer100g: null }])).toMatchObject({ kcal: 150, ofullstandig: true })
  })
})

describe('pasdetaljer', () => {
  const pase: Matprodukt = {
    id: 'p',
    marke: 'Testmat',
    namn: 'Gryta',
    maltid: 'lunch_middag',
    torkning: 'frystorkad',
    vikt_torr_g: 150,
    portioner: 1,
    kcal: 600,
    protein_g: 25,
    fett_g: null,
    kolhydrater_g: null,
    vatten_ml: 450,
    tillagning_vatten: 'varmt',
    tillagning_min: 8,
    vegetarisk: true,
    vegansk: false,
    glutenfri: null,
    laktosfri: null,
    allergener: ['soja', 'selleri'],
    spar: ['sesam'],
    pris_sek_ca: null,
    pris_kalla: null,
    kalla: 'https://exempel.se',
    kontrollerad: null,
  }

  it('visar torkning, tillagning, allergener och spår', () => {
    expect(pasdetaljer(pase)).toEqual(['Frystorkad', 'Varmt vatten, 450 ml, 8 min', 'Innehåller soja och selleri', 'Kan innehålla spår av sesam'])
  })

  it('skiljer på okända allergener och inga', () => {
    const bara = { ...pase, torkning: null, tillagning_vatten: null, spar: null }
    expect(pasdetaljer({ ...bara, allergener: null })).toEqual(['Allergenerna är okända'])
    expect(pasdetaljer({ ...bara, allergener: [] })).toEqual(['Ingen av de 14 allergenerna'])
  })
})

describe('pasnamn och PASAR_TILL', () => {
  it('sätter ihop märke och namn', () => {
    expect(pasnamn({ marke: 'Testmat', namn: 'Gryta' })).toBe('Testmat Gryta')
  })

  it('visar efterrätter vid middag och mellanmål', () => {
    expect(PASAR_TILL.middag).toContain('dessert')
    expect(PASAR_TILL.frukost).toEqual(['frukost'])
  })
})
