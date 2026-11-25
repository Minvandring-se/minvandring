import { describe, expect, it } from 'vitest'
import {
  ingredienserTillDatabasen,
  borjaMed,
  dagssummor,
  formateraKcal,
  grupperaMaltid,
  orimligPortion,
  ratterSomSaknar,
  saknasMeningar,
  portionText,
  filterknappText,
  ensamAtareText,
  dagensText,
  kcalPer100g,
  matdagar,
  maltidsAdress,
  maltidsord,
  matplanstext,
  matstatus,
  matsummering,
  saknadeMaltider,
  saknasText,
  naringForRader,
  PASAR_TILL,
  pasdetaljer,
  pasePerPortion,
  pasnamn,
  platsText,
  platserMedAntal,
  platserText,
  antalPasar,
  dubblettText,
  rattPlatser,
  rattPerPortion,
  tolkaRattformular,
  tolkaTal,
  vemBarVad,
  atareFor,
  saknasPerPerson,
  fordela,
  portionerSomBars,
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
const ing = (ratt_id: string, vara_id: string, gram_per_portion: number): Ingrediens => ({ id: `${ratt_id}-${vara_id}`, ratt_id, vara_id, mangd: gram_per_portion, enhet: 'g', gram_per_portion })
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
    const [dag1, dag2] = dagssummor(data, dagar, ['anna', 'erik'])
    expect(dag1.naring.kcal).toBeCloseTo(423 * 2 + 700)
    expect(dag1.naring.gram).toBe(120 * 2 + 150)
    expect(dag1.perPerson.get('erik')!.kcal).toBeCloseTo(423 * 2 + 700)
    expect(dag1.saknas).toEqual(['lunch'])
    expect(dag2.naring.kcal).toBe(0)
    expect(dag2.saknas).toEqual(['frukost', 'lunch', 'middag'])
  })

  it('räknar inte mellanmål som saknade', () => {
    const data = plan([maltid(1, 'frukost', 'Gröt'), maltid(1, 'lunch', 'Gröt'), maltid(1, 'middag', 'Gryta')])
    expect(dagssummor(data, dagar, ['anna'])[0].saknas).toEqual([])
  })

  it('räknar varje rätt bara för dem som äter den', () => {
    // Middag: Anna äter gröten (423 kcal, 120 g), Erik och Lisa grytan (700 kcal, 150 g). Ingen äter båda.
    const data = plan([maltid(1, 'middag', 'Gröt'), maltid(1, 'middag', 'Gryta')])
    const [gröt, gryta] = data.maltider
    data.atare = [
      { maltid_id: gröt.id, deltagare_id: 'anna' },
      { maltid_id: gryta.id, deltagare_id: 'erik' },
      { maltid_id: gryta.id, deltagare_id: 'lisa' },
    ]
    const [dag1] = dagssummor(data, dagar, ['anna', 'erik', 'lisa'])
    expect(dag1.perPerson.get('anna')!.kcal).toBeCloseTo(423)
    expect(dag1.perPerson.get('erik')!.kcal).toBeCloseTo(700)
    expect(dag1.perPerson.get('lisa')!.gram).toBe(150)
    // Snittet är per person, inte summan av rätterna.
    expect(dag1.naring.kcal).toBeCloseTo((423 + 700 + 700) / 3)
  })

  it('räknar som en person när turen inte har några personer', () => {
    const data = plan([maltid(1, 'frukost', 'Gröt')])
    expect(dagssummor(data, dagar, [])[0].naring.gram).toBe(120)
  })
})

describe('dagensText', () => {
  const dagar = matdagar(1, 0)

  it('visar ett värde när alla får lika mycket', () => {
    const data = plan([maltid(1, 'middag', 'Gryta')])
    expect(dagensText(dagssummor(data, dagar, ['anna', 'erik'])[0])).toBe('700 kcal och 150 g per person')
  })

  it('visar ett spann när personerna får olika mycket', () => {
    const data = plan([maltid(1, 'middag', 'Gröt'), maltid(1, 'middag', 'Gryta')])
    data.atare = [{ maltid_id: data.maltider[0].id, deltagare_id: 'anna' }, { maltid_id: data.maltider[1].id, deltagare_id: 'erik' }]
    expect(dagensText(dagssummor(data, dagar, ['anna', 'erik'])[0])).toBe('423–700 kcal och 120–150 g per person')
  })

  it('skriver tusental med mellanslag i spannet', () => {
    const text = dagensText({
      perPerson: new Map([
        ['anna', { kcal: 423, proteinG: 0, gram: 640, ofullstandig: false }],
        ['erik', { kcal: 1250, proteinG: 0, gram: 1200, ofullstandig: false }],
      ]),
    })
    expect(text?.replace(/\s/g, ' ')).toBe('423–1 250 kcal och 640 g–1,2 kg per person')
  })

  it('är tom en dag utan mat', () => {
    expect(dagensText(dagssummor(plan([]), dagar, ['anna'])[0])).toBeNull()
  })
})

describe('summeringen', () => {
  const dagar = matdagar(2, 0)

  it('ger snitt, lägsta dag och antal saknade måltider', () => {
    const data = plan([maltid(1, 'frukost', 'Gröt'), maltid(1, 'middag', 'Gryta'), maltid(2, 'frukost', 'Gröt')])
    const s = matsummering(dagssummor(data, dagar, ['anna', 'erik']))
    expect(s.snittKcal).toBeCloseTo((423 + 700 + 423) / 2)
    expect(s.lagsta).toMatchObject({ person: 'anna', dag: { dag: 2 } })
    expect(s.lagsta!.kcal).toBeCloseTo(423)
    expect(s.saknadeMaltider).toBe(1 + 2)
    expect(s.ofullstandig).toBe(false)
  })

  it('räknar snittet och lägsta per person, efter vem som äter', () => {
    // Dag 1: Anna äter gröt, Erik gryta. Dag 2: båda äter gryta.
    const data = plan([maltid(1, 'middag', 'Gröt'), maltid(1, 'middag', 'Gryta'), maltid(2, 'middag', 'Gryta')])
    data.atare = [{ maltid_id: data.maltider[0].id, deltagare_id: 'anna' }, { maltid_id: data.maltider[1].id, deltagare_id: 'erik' }]
    const s = matsummering(dagssummor(data, dagar, ['anna', 'erik']))
    expect(s.snittKcal).toBeCloseTo((423 + 700 + 700 + 700) / 4)
    expect(s.lagsta).toMatchObject({ person: 'anna', dag: { dag: 1 } })
    expect(s.lagsta!.kcal).toBeCloseTo(423)
  })

  it('räknar lägsta bara bland dagar med mat, och pekar ut en person bara när personerna äter olika', () => {
    // Dag 2 saknar mat och räknas inte. Dag 1 äter båda lika.
    const lika = matsummering(dagssummor(plan([maltid(1, 'middag', 'Gryta')]), dagar, ['anna', 'erik']))
    expect(lika.lagsta).toMatchObject({ kcal: 700, dag: { dag: 1 }, olika: false })
    const data = plan([maltid(1, 'middag', 'Gröt'), maltid(1, 'middag', 'Gryta')])
    data.atare = [{ maltid_id: data.maltider[0].id, deltagare_id: 'anna' }, { maltid_id: data.maltider[1].id, deltagare_id: 'erik' }]
    expect(matsummering(dagssummor(data, dagar, ['anna', 'erik'])).lagsta).toMatchObject({ person: 'anna', olika: true })
  })

  it('är noll utan dagar', () => {
    expect(matsummering([])).toEqual({ snittKcal: 0, lagsta: null, snittProteinG: 0, saknadeMaltider: 0, ofullstandig: false })
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

describe('ingredienserTillDatabasen', () => {
  it('ger namnen som databasfunktionerna tar emot, med tomma värden som null', () => {
    expect(
      ingredienserTillDatabasen([
        { vara: ' Havregryn ', mangd: 90, enhet: 'g', gram: 90, kcalPer100g: 380, proteinPer100g: 12.5 },
        { vara: 'Salt', mangd: null, enhet: null, gram: null, kcalPer100g: null, proteinPer100g: null },
      ]),
    ).toEqual([
      { vara: 'Havregryn', mangd: 90, enhet: 'g', gram: 90, kcal: 380, protein: 12.5 },
      { vara: 'Salt', mangd: null, enhet: null, gram: null, kcal: null, protein: null },
    ])
  })
})

describe('tolkaRattformular', () => {
  // Mängden i gram, som formuläret har förvalt.
  const rad = (vara: string, mangd: string, kcal = '', protein = ''): Ingrediensfalt => ({ vara, mangd, enhet: 'g', gram: '', kcal, protein })

  it('tolkar raderna och hoppar över tomma', () => {
    expect(tolkaRattformular(' Gröt ', [rad('Havregryn', '90', '370', '13,5'), rad('', ''), rad('Russin', '30')])).toEqual({
      ok: true,
      namn: 'Gröt',
      rader: [
        { vara: 'Havregryn', mangd: 90, enhet: 'g', gram: 90, kcalPer100g: 370, proteinPer100g: 13.5 },
        { vara: 'Russin', mangd: 30, enhet: 'g', gram: 30, kcalPer100g: null, proteinPer100g: null },
      ],
    })
  })

  it('kräver ett namn, men en rätt får sakna ingredienser', () => {
    expect(tolkaRattformular('', [rad('Havregryn', '90')])).toEqual({ ok: false, fel: 'Skriv ett namn.' })
    expect(tolkaRattformular('Fika hos mormor', [rad('', '')])).toEqual({ ok: true, namn: 'Fika hos mormor', rader: [] })
    expect(tolkaRattformular('x'.repeat(81), [rad('Havregryn', '90')]).ok).toBe(false)
  })

  it('tar emot mängd och enhet, räknar vikten för g och kg, och låter vikten vara frivillig för andra enheter', () => {
    const f = (vara: string, mangd: string, enhet: string, gram = ''): Ingrediensfalt => ({ vara, mangd, enhet, gram, kcal: '', protein: '' })
    const svar = tolkaRattformular('Pannkakor', [f('Vetemjöl', '0,1', 'kg'), f('Mjölk', '3', 'dl', '300'), f('Ägg', '1', 'st'), f('Salt', '', 'g'), f('Kardemumma', '2', 'krm', '999')])
    expect(svar).toEqual({
      ok: true,
      namn: 'Pannkakor',
      rader: [
        { vara: 'Vetemjöl', mangd: 0.1, enhet: 'kg', gram: 100, kcalPer100g: null, proteinPer100g: null },
        { vara: 'Mjölk', mangd: 3, enhet: 'dl', gram: 300, kcalPer100g: null, proteinPer100g: null },
        { vara: 'Ägg', mangd: 1, enhet: 'st', gram: null, kcalPer100g: null, proteinPer100g: null },
        { vara: 'Salt', mangd: null, enhet: null, gram: null, kcalPer100g: null, proteinPer100g: null },
        { vara: 'Kardemumma', mangd: 2, enhet: 'krm', gram: 999, kcalPer100g: null, proteinPer100g: null },
      ],
    })
    // Mängden avrundas till två decimaler innan vikten räknas.
    expect(tolkaRattformular('Gryta', [f('Pasta', '0,125', 'kg')])).toMatchObject({ ok: true, rader: [{ mangd: 0.13, gram: 130 }] })
    expect(tolkaRattformular('Gryta', [f('Pasta', '0,001', 'kg')]).ok).toBe(false)
    expect(tolkaRattformular('Gryta', [f('Pasta', '6', 'kg')]).ok).toBe(false)
    expect(tolkaRattformular('Gryta', [f('Pasta', '1', 'kopp')]).ok).toBe(false)
    expect(tolkaRattformular('Gryta', [f('Mjölk', '2', 'dl', '2,5')]).ok).toBe(false)
  })

  it('stoppar en ingrediens med längre namn än receptraderna i databasen tillåter', () => {
    expect(tolkaRattformular('Gröt', [rad('x'.repeat(80), '90')]).ok).toBe(true)
    expect(tolkaRattformular('Gröt', [rad('Havregryn', '90'), rad('x'.repeat(81), '30')])).toEqual({
      ok: false,
      fel: 'Ingrediens 2: namnet får vara högst 80 tecken.',
    })
  })

  it('säger vilken rad som är fel', () => {
    expect(tolkaRattformular('Gröt', [rad('Havregryn', '90'), rad('', '30')])).toEqual({ ok: false, fel: 'Ingrediens 2: skriv vad ingrediensen heter.' })
    expect(tolkaRattformular('Gröt', [rad('Havregryn', '0')])).toMatchObject({ ok: false, fel: expect.stringContaining('Ingrediens 1: skriv mängden som ett tal mellan 0,01 och 10 000') })
    expect(tolkaRattformular('Gröt', [rad('Havregryn', '0,4')]).ok).toBe(false)
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
    expect(naringForRader([{ vara: 'Havregryn', mangd: 100, enhet: 'g', gram: 100, kcalPer100g: 370, proteinPer100g: 13 }])).toEqual({
      kcal: 370,
      proteinG: 13,
      gram: 100,
      ofullstandig: false,
    })
    expect(naringForRader([{ vara: 'Russin', mangd: 50, enhet: 'g', gram: 50, kcalPer100g: 300, proteinPer100g: null }])).toMatchObject({ kcal: 150, ofullstandig: true })
    // Utan vikt går energin inte att räkna.
    expect(naringForRader([{ vara: 'Ägg', mangd: 1, enhet: 'st', gram: null, kcalPer100g: 140, proteinPer100g: 13 }])).toEqual({ kcal: 0, proteinG: 0, gram: 0, ofullstandig: true })
  })
})

describe('pasdetaljer', () => {
  const pase: Matprodukt = {
    id: 'p',
    marke: 'Testmat',
    namn: 'Gryta',
    andra_namn: [],
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
    expect(pasdetaljer({ ...bara, allergener: null })).toEqual(['Allergenerna är okända', 'Spår: okänt'])
    expect(pasdetaljer({ ...bara, allergener: [] })).toEqual(['Ingen av de 14 allergenerna', 'Spår: okänt'])
  })

  it('skriver att spåren är okända, men inget när påsen saknar spår', () => {
    const bara = { ...pase, torkning: null, tillagning_vatten: null }
    expect(pasdetaljer({ ...bara, allergener: [], spar: null })).toContain('Spår: okänt')
    expect(pasdetaljer({ ...bara, allergener: [], spar: [] })).toEqual(['Ingen av de 14 allergenerna'])
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

describe('saknadeMaltider och matstatus', () => {
  const dagar = matdagar(2, 1)
  const rad = (dag: number, m: Maltid) => ({ dag, maltid: m })
  const text = (p: { dag: { namn: string }; maltid: Maltid }) => `${p.dag.namn} ${p.maltid}`

  it('räknar frukost, lunch och middag på alla dagar, reservdagar inräknade, men inte mellanmål', () => {
    expect(saknadeMaltider(dagar, [])).toHaveLength(9)
    expect(saknadeMaltider(dagar, [rad(1, 'mellanmal')])).toHaveLength(9)
    expect(matstatus(dagar, [])).toMatchObject({ totalt: 9, planerade: 0, saknas: 9 })
  })

  it('ger de saknade i ordning, dag för dag med reservdagen sist', () => {
    const saknas = saknadeMaltider(dagar, [rad(1, 'frukost'), rad(2, 'lunch'), rad(3, 'middag')])
    expect(saknas.map(text)).toEqual(['Dag 1 lunch', 'Dag 1 middag', 'Dag 2 frukost', 'Dag 2 middag', 'Reservdag 1 frukost', 'Reservdag 1 lunch'])
  })

  it('räknar en måltid med flera rätter en gång', () => {
    expect(matstatus(dagar, [rad(1, 'frukost'), rad(1, 'frukost')])).toMatchObject({ planerade: 1, saknas: 8 })
  })

  it('bortser från rader på dagar som inte finns i turen', () => {
    expect(matstatus(dagar, [rad(7, 'frukost')]).saknas).toBe(9)
  })

  it('pekar på den första som saknas, och null när planen är klar', () => {
    expect(matstatus(dagar, [rad(1, 'frukost')]).forsta).toMatchObject({ dag: { dag: 1 }, maltid: 'lunch' })
    const allt = dagar.flatMap((d) => (['frukost', 'lunch', 'middag'] as const).map((m) => rad(d.dag, m)))
    expect(matstatus(dagar, allt)).toMatchObject({ saknas: 0, planerade: 9, forsta: null })
  })

  it('är tom för en tur utan dagar', () => {
    expect(matstatus([], [])).toEqual({ totalt: 0, planerade: 0, saknas: 0, forsta: null })
  })

  it('ger samma saknade som dagssummor', () => {
    const data: Matdata = { ratter: [ratt('r1')], ingredienser: [], varor: [], pasar: new Map(), maltider: [maltid(1, 'lunch', 'r1')] }
    const perDag = dagssummor(data, dagar, []).flatMap((s) => s.saknas.map((m) => `${s.dag.dag}:${m}`))
    expect(saknadeMaltider(dagar, data.maltider).map((p) => `${p.dag.dag}:${p.maltid}`)).toEqual(perDag)
  })
})

describe('matplanstext', () => {
  const status = (totalt: number, saknas: number) => ({ totalt, planerade: totalt - saknas, saknas, forsta: null })

  it('en kommande tur visar hur många måltider som saknas', () => {
    expect(matplanstext(status(9, 4), false)).toBe('saknas')
    expect(matplanstext(status(9, 0), false)).toBe('klar')
    expect(matplanstext(status(0, 0), false)).toBe('inga-dagar')
  })

  it('en avslutad tur visar bara att planen är klar', () => {
    expect(matplanstext(status(9, 0), true)).toBe('klar')
    expect(matplanstext(status(9, 4), true)).toBeNull()
    expect(matplanstext(status(0, 0), true)).toBeNull()
  })
})

describe('saknasText och maltidsord', () => {
  it('böjer måltid efter antalet', () => {
    expect(saknasText(1)).toBe('1 måltid saknas')
    expect(saknasText(12)).toBe('12 måltider saknas')
  })

  it('ger måltidens namn med liten bokstav', () => {
    expect(maltidsord('mellanmal')).toBe('mellanmål')
  })
})

describe('maltidsAdress', () => {
  it('pekar på turens flik Mat med dag och måltid', () => {
    expect(maltidsAdress('abc', 2, 'lunch')).toBe('/tur/abc/mat?dag=2&maltid=lunch')
  })
})

describe('borjaMed', () => {
  const [dag1, , reserv] = matdagar(2, 1)

  it('säger måltiden i bestämd form och datumet', () => {
    expect(borjaMed({ dag: dag1, maltid: 'frukost' }, 'fredag 4 december')).toBe('Börja med frukosten fredag 4 december.')
  })

  it('säger dagen när datumet saknas, och alltid för en reservdag', () => {
    expect(borjaMed({ dag: dag1, maltid: 'lunch' }, null)).toBe('Börja med lunchen dag 1.')
    expect(borjaMed({ dag: reserv, maltid: 'middag' }, 'söndag 6 december')).toBe('Börja med middagen reservdag 1.')
  })
})

describe('vemBarVad', () => {
  const dagar = matdagar(2, 1)
  const pase = ratt('p', { matprodukt_id: 'mp' })
  const soppa = ratt('soppa')
  const bar = (dag: number, m: Maltid, ratt_id: string, bars_av: string | null = null): Maltidsrad => ({ ...maltid(dag, m, ratt_id), bars_av })
  const data = {
    ratter: [soppa, pase, ratt('tom'), ratt('oanvand', { matprodukt_id: 'mp2' })],
    ingredienser: [ing('soppa', 'linser', 100)],
    maltider: [bar(2, 'middag', 'p', 'anna'), bar(1, 'middag', 'soppa', 'erik'), bar(1, 'lunch', 'tom'), bar(3, 'frukost', 'soppa', 'erik'), bar(1, 'frukost', 'p')],
  }

  it('slår ihop raderna per rätt och bärare, i den ordning de äts första gången', () => {
    const rader = vemBarVad(data, dagar)
    expect(rader.map((r) => [r.namn, r.barsAv])).toEqual([
      ['p', null],
      ['tom', null],
      ['soppa', 'erik'],
      ['p', 'anna'],
    ])
    expect(rader[2].platser.map(platsText)).toEqual(['Middag dag 1', 'Frukost reservdag 1'])
    expect(rader[2].maltidIds).toHaveLength(2)
    expect(rader[0].typ).toBe('pase')
  })

  it('tar med egna rätter utan ingredienser, som också ska bäras, men inte rader utanför turens dagar', () => {
    expect(vemBarVad(data, dagar).map((r) => r.rattId)).toContain('tom')
    expect(vemBarVad({ ...data, maltider: [bar(9, 'lunch', 'p')] }, dagar)).toEqual([])
  })
})

describe('vem som äter', () => {
  const dagar = matdagar(1, 0)
  const personer = ['anna', 'erik', 'lisa']
  const rad = (id: string, m: Maltid, ratt_id = 'Gröt', bars_av: string | null = null): Maltidsrad => ({ id, dag: 1, maltid: m, ratt_id, sortering: 0, bars_av })

  it('alla äter en rad utan ätare', () => {
    expect(atareFor('x', [], personer)).toEqual(personer)
    expect(atareFor('x', [{ maltid_id: 'x', deltagare_id: 'lisa' }, { maltid_id: 'y', deltagare_id: 'erik' }], personer)).toEqual(['lisa'])
  })

  it('räknar vilka huvudmåltider varje person saknar', () => {
    const maltider = [rad('f', 'frukost'), rad('l', 'lunch'), rad('m', 'middag')]
    const atare = [{ maltid_id: 'l', deltagare_id: 'anna' }, { maltid_id: 'm', deltagare_id: 'anna' }, { maltid_id: 'm', deltagare_id: 'erik' }]
    const saknas = saknasPerPerson({ maltider, atare }, dagar, personer)
    expect([...saknas.keys()]).toEqual(['erik', 'lisa'])
    expect(saknas.get('erik')!.map(platsText)).toEqual(['Lunch dag 1'])
    expect(saknas.get('lisa')!.map(platsText)).toEqual(['Lunch dag 1', 'Middag dag 1'])
    expect(saknasPerPerson({ maltider }, dagar, personer).size).toBe(0)
  })

  it('räknar portionerna som en deltagare bär av en rätt, efter dem som äter', () => {
    const maltider = [rad('f', 'frukost', 'Gröt', 'anna'), rad('l', 'lunch', 'Gröt', 'anna'), rad('m', 'middag', 'Gryta', 'erik'), rad('x', 'mellanmal', 'Gröt')]
    const atare = [{ maltid_id: 'l', deltagare_id: 'anna' }]
    expect(portionerSomBars({ maltider, atare }, dagar, personer, 'anna', 'Gröt')).toBe(3 + 1)
    expect(portionerSomBars({ maltider, atare }, dagar, personer, 'erik', 'Gröt')).toBe(0)
  })
})

describe('fordela', () => {
  it('ger den tyngsta raden till den som bär minst, så att vikten blir jämn', () => {
    const rader = [{ id: 'a', gram: 100 }, { id: 'b', gram: 400 }, { id: 'c', gram: 300 }, { id: 'd', gram: 200 }]
    const ut = fordela(rader, ['anna', 'erik'], new Map([['anna', 100]]))
    expect(Object.fromEntries(ut)).toEqual({ b: 'erik', c: 'anna', d: 'anna', a: 'erik' })
  })

  it('gör ingenting utan personer', () => {
    expect(fordela([{ id: 'a', gram: 1 }], [], new Map()).size).toBe(0)
  })
})

describe('grupperaMaltid med bärare', () => {
  it('håller isär samma rätt med olika bärare eller ätare', () => {
    const r = (id: string, bars_av: string | null) => ({ id, ratt_id: 'gryta', bars_av })
    expect(grupperaMaltid([r('1', 'anna'), r('2', 'anna'), r('3', null)]).map((g) => g.rader.length)).toEqual([2, 1])
    expect(grupperaMaltid([r('1', null), r('2', null)], (x) => (x.id === '1' ? 'lisa' : '')).map((g) => g.rader.length)).toEqual([1, 1])
  })
})

describe('platserMedAntal och platserText', () => {
  const [dag1, , dag3] = matdagar(3, 0)
  it('slår ihop samma måltid och skriver antalet', () => {
    const platser = [
      { dag: dag1, maltid: 'lunch' as const },
      { dag: dag3, maltid: 'mellanmal' as const },
      { dag: dag3, maltid: 'mellanmal' as const },
      { dag: dag3, maltid: 'mellanmal' as const },
    ]
    expect(platserMedAntal(platser).map((p) => p.antal)).toEqual([1, 3])
    expect(platserText(platser)).toBe('Lunch dag 1, mellanmål dag 3 (3 st)')
  })
})

describe('grupperaMaltid', () => {
  it('slår ihop samma rätt i en måltid och behåller ordningen och raderna', () => {
    const rader = [maltid(1, 'mellanmal', 'pudding'), maltid(1, 'mellanmal', 'notter'), maltid(1, 'mellanmal', 'pudding')]
    const grupper = grupperaMaltid(rader)
    expect(grupper.map((g) => [g.rattId, g.rader.length])).toEqual([
      ['pudding', 2],
      ['notter', 1],
    ])
    expect(grupper[0].rader.map((r) => r.id)).toEqual([rader[0].id, rader[2].id])
  })
})

describe('orimligPortion', () => {
  it('varnar över 2 000 kcal eller 1,5 kg per portion', () => {
    expect(orimligPortion({ kcal: 4296, gram: 1365 })).toBe(true)
    expect(orimligPortion({ kcal: 900, gram: 1600 })).toBe(true)
    expect(orimligPortion({ kcal: 2000, gram: 1500 })).toBe(false)
  })
})

describe('ratterSomSaknar', () => {
  const dagar = matdagar(1, 0)
  it('säger vilka rätter som saknar energi, protein eller vikt, och bara de som ligger i en måltid', () => {
    const data: Matdata = {
      ratter: [ratt('Bullens pilsnerkorv'), ratt('Gryta'), ratt('Mormors smörgås'), ratt('Oanvänd'), ratt('Påse', { matprodukt_id: 'p1' })],
      varor: [vara('korv', { kcal_per_100g: null, protein_per_100g: null }), vara('ris'), vara('ost', { protein_per_100g: null }), vara('x', { kcal_per_100g: null })],
      ingredienser: [ing('Bullens pilsnerkorv', 'korv', 1), ing('Gryta', 'ris', 100), ing('Gryta', 'ost', 20), ing('Oanvänd', 'x', 10)],
      pasar: new Map([['p1', { id: 'p1', vikt_torr_g: 100, portioner: 1, kcal: 400, protein_g: null }]]),
      maltider: [maltid(1, 'lunch', 'Bullens pilsnerkorv'), maltid(1, 'middag', 'Gryta'), maltid(1, 'frukost', 'Mormors smörgås'), maltid(1, 'mellanmal', 'Påse')],
    }
    expect(ratterSomSaknar(data, dagar)).toEqual({
      energi: ['Bullens pilsnerkorv', 'Mormors smörgås'],
      protein: ['Bullens pilsnerkorv', 'Gryta', 'Påse'],
      vikt: ['Mormors smörgås'],
    })
  })
})

describe('saknasMeningar', () => {
  it('nämner varje rätt en gång och samlar rätter som saknar samma saker', () => {
    expect(saknasMeningar({ energi: ['Bullens pilsnerkorv', 'Mormors smörgås'], protein: ['Bullens pilsnerkorv'], vikt: ['Test', 'Mormors smörgås'] })).toEqual([
      'Test saknar vikt.',
      'Mormors smörgås saknar vikt och energi.',
      'Bullens pilsnerkorv saknar energi och protein.',
    ])
    expect(saknasMeningar({ energi: [], protein: [], vikt: [] })).toEqual([])
  })
})

describe('rattPlatser och dubblettText', () => {
  const dagar = matdagar(2, 1)
  const rad = (dag: number, maltid: Maltid, ratt_id = 'r1') => ({ dag, maltid, ratt_id })
  it('listar måltiderna rätten ligger i, i ordning och bara inom turen', () => {
    const platser = rattPlatser([rad(2, 'lunch'), rad(1, 'middag'), rad(1, 'frukost'), rad(9, 'lunch'), rad(1, 'lunch', 'r2')], dagar, 'r1')
    expect(platser.map((p) => `${p.dag.dag} ${p.maltid}`)).toEqual(['1 frukost', '1 middag', '2 lunch'])
  })
  it('frågar om rätten redan finns i planen', () => {
    expect(dubblettText([])).toBeNull()
    expect(dubblettText(rattPlatser([rad(1, 'lunch')], dagar, 'r1'))).toBe('Finns redan på lunch dag 1. Lägg till ändå?')
    expect(dubblettText(rattPlatser([rad(1, 'lunch'), rad(2, 'mellanmal'), rad(2, 'mellanmal')], dagar, 'r1'))).toBe(
      'Finns redan på lunch dag 1, mellanmål dag 2 (2 st). Lägg till ändå?',
    )
  })
})

describe('antalPasar', () => {
  it('avrundar uppåt till hela påsar', () => {
    expect(antalPasar(3, 2, 1)).toBe(6)
    expect(antalPasar(3, 2, 2)).toBe(3)
    expect(antalPasar(1, 3, 2)).toBe(2)
    expect(antalPasar(2, 1, 0)).toBe(2)
  })
})

describe('portionText', () => {
  it('visar energi och vikt per portion', () => {
    expect(portionText({ kcal: 423, gram: 120 })).toBe('423 kcal per portion, 120 g')
  })

  it('skriver att energin saknas i stället för 0 kcal', () => {
    expect(portionText({ kcal: 0, gram: 1 })).toBe('Energi saknas, 1 g')
    expect(portionText({ kcal: 0, gram: 0 })).toBe('Energi och vikt saknas')
  })
})

describe('filterknappText', () => {
  it('nämner måltiden när påsarna filtreras på den, och kostfiltret', () => {
    expect(filterknappText('mellanmal', false, { val: ['glutenfri'], utan: [] })).toBe('Filter: mellanmål, glutenfri')
    expect(filterknappText('mellanmal', true, { val: [], utan: [] })).toBe('Filter: Inga')
    expect(filterknappText(null, false, { val: [], utan: ['notter'] })).toBe('Filter: utan nötter')
  })
})

describe('tolkaRattformular med vikt utan mängd', () => {
  it('gör vikten till mängden i gram, så att den syns när rätten öppnas igen', () => {
    const svar = tolkaRattformular('Rätt', [{ vara: 'Mjölk', mangd: '', enhet: 'dl', gram: '200', kcal: '', protein: '' }])
    expect(svar).toEqual({ ok: true, namn: 'Rätt', rader: [{ vara: 'Mjölk', mangd: 200, enhet: 'g', gram: 200, kcalPer100g: null, proteinPer100g: null }] })
  })
})

describe('ensamAtareText', () => {
  const atare = [
    { maltid_id: 'm1', deltagare_id: 'anna' },
    { maltid_id: 'm2', deltagare_id: 'anna' },
    { maltid_id: 'm3', deltagare_id: 'anna' },
    { maltid_id: 'm3', deltagare_id: 'erik' },
  ]

  it('varnar när personen är den enda som äter några rader, utan pronomen', () => {
    expect(ensamAtareText(atare, 'anna', 'Anna')).toBe('Anna är den enda som äter 2 rätter. Tas Anna bort äter alla dem.')
    expect(ensamAtareText(atare.slice(1), 'anna', 'Anna')).toBe('Anna är den enda som äter 1 rätt. Tas Anna bort äter alla den.')
  })

  it('är tom när personen inte är ensam ätare på någon rad', () => {
    expect(ensamAtareText(atare, 'erik', 'Erik')).toBeNull()
    expect(ensamAtareText([], 'anna', 'Anna')).toBeNull()
  })
})
