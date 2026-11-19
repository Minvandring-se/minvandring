import { describe, expect, it } from 'vitest'
import {
  antalFranFalt,
  bildForTur,
  dagarVarde,
  datumrad,
  flerTurer,
  halsning,
  dagarText,
  datumIntervall,
  delaUppTurer,
  deltagareText,
  initialer,
  lage,
  lokaltDatum,
  nastaEtikett,
  nedrakning,
  sistaDag,
  TURBILDER,
  type TurIListan,
} from './turlista'

const IDAG = '2027-08-14'

function tur(id: string, avresa: string | null, hemkomst: string | null = null, dagar: number | null = 1, skapad = '2027-01-01T00:00:00Z'): TurIListan {
  return { id, namn: id, avresa, hemkomst, dagar, skapad }
}

describe('lage', () => {
  it('pågår från avresan till och med hemkomsten', () => {
    expect(lage(tur('a', '2027-08-12', '2027-08-16'), IDAG)).toBe('pagar')
    expect(lage(tur('a', IDAG, IDAG), IDAG)).toBe('pagar')
    expect(lage(tur('a', '2027-08-10', IDAG), IDAG)).toBe('pagar')
  })

  it('räknar sista dagen från antal dagar när hemkomst saknas', () => {
    expect(sistaDag(tur('a', '2027-08-12', null, 5))).toBe('2027-08-16')
    expect(lage(tur('a', '2027-08-12', null, 3), IDAG)).toBe('pagar')
    expect(lage(tur('a', '2027-08-12', null, 2), IDAG)).toBe('tidigare')
  })

  it('kommande om avresan är senare, tidigare om turen är slut, kommande utan datum', () => {
    expect(lage(tur('a', '2027-08-15'), IDAG)).toBe('kommande')
    expect(lage(tur('a', '2027-08-01', '2027-08-13'), IDAG)).toBe('tidigare')
    expect(lage(tur('a', null), IDAG)).toBe('kommande')
  })
})

describe('delaUppTurer', () => {
  it('väljer en pågående tur före en kommande', () => {
    const r = delaUppTurer([tur('snart', '2027-08-20'), tur('nu', '2027-08-13', '2027-08-15')], IDAG)
    expect(r.nasta?.id).toBe('nu')
    expect(r.kommande.map((t) => t.id)).toEqual(['snart'])
  })

  it('väljer annars den närmaste kommande, och lägger turer utan datum sist', () => {
    const r = delaUppTurer(
      [tur('utan', null), tur('sen', '2027-12-01'), tur('nara', '2027-09-01'), tur('forr', '2026-07-01', '2026-07-05')],
      IDAG,
    )
    expect(r.nasta?.id).toBe('nara')
    expect(r.kommande.map((t) => t.id)).toEqual(['sen', 'utan'])
    expect(r.tidigare.map((t) => t.id)).toEqual(['forr'])
  })

  it('tar den senast skapade turen utan datum när inga turer har datum', () => {
    const r = delaUppTurer([tur('gammal', null, null, 1, '2027-01-01T00:00:00Z'), tur('ny', null, null, 1, '2027-05-01T00:00:00Z')], IDAG)
    expect(r.nasta?.id).toBe('ny')
    expect(r.kommande.map((t) => t.id)).toEqual(['gammal'])
  })

  it('har ingen nästa tur när alla turer är tidigare, och sorterar senast avslutad först', () => {
    const r = delaUppTurer([tur('2025', '2025-07-01', '2025-07-03'), tur('2026', '2026-07-01', '2026-07-03')], IDAG)
    expect(r.nasta).toBeNull()
    expect(r.kommande).toEqual([])
    expect(r.tidigare.map((t) => t.id)).toEqual(['2026', '2025'])
  })

  it('fungerar utan turer', () => {
    expect(delaUppTurer([], IDAG)).toEqual({ nasta: null, kommande: [], tidigare: [] })
  })
})

describe('texter', () => {
  it('skriver datumintervall utan tankstreck som paus', () => {
    expect(datumIntervall('2027-08-12', '2027-08-16')).toBe('12–16 augusti 2027')
    expect(datumIntervall('2027-07-30', '2027-08-03')).toBe('30 juli till 3 augusti 2027')
    expect(datumIntervall('2027-12-30', '2028-01-02')).toBe('30 december 2027 till 2 januari 2028')
    expect(datumIntervall('2027-08-12', '2027-08-12')).toBe('12 augusti 2027')
    expect(datumIntervall('2027-08-12', null)).toBe('Från 12 augusti 2027')
    expect(datumIntervall(null, null)).toBe('Datum ej bestämt')
  })

  it('räknar dagar, deltagare och hundar', () => {
    expect(dagarText(1)).toBe('1 dag')
    expect(dagarText(5)).toBe('5 dagar')
    expect(deltagareText([{ typ: 'person' }])).toBe('1 deltagare')
    expect(deltagareText([{ typ: 'person' }, { typ: 'person' }, { typ: 'hund' }])).toBe('2 deltagare och 1 hund')
    expect(deltagareText([{ typ: 'person' }, { typ: 'hund' }, { typ: 'hund' }])).toBe('1 deltagare och 2 hundar')
  })

  it('gör initialer av namn', () => {
    expect(initialer('Oscar Medelin')).toBe('OM')
    expect(initialer('anna')).toBe('A')
    expect(initialer('  Eva  Lisa  Karlsson ')).toBe('EK')
    expect(initialer('')).toBe('?')
  })

  it('ger dagens datum i lokal tid', () => {
    expect(lokaltDatum(new Date(2027, 7, 4, 23, 30))).toBe('2027-08-04')
  })
})

describe('bildForTur', () => {
  it('ger samma bild för samma tur och använder flera bilder', () => {
    const id = '7f1c2a4e-1111-4222-8333-123456789abc'
    expect(bildForTur(id)).toBe(bildForTur(id))
    const bilder = new Set(Array.from({ length: 40 }, (_, i) => bildForTur(`tur-${i}`)))
    expect(bilder.size).toBe(TURBILDER.length)
  })
})

describe('datumrad', () => {
  it('visar datum och dagar när turen har datum', () => {
    expect(datumrad({ avresa: '2027-08-12', hemkomst: '2027-08-16', dagar: 5 })).toBe('12–16 augusti 2027 · 5 dagar')
  })

  it('visar bara "Datum ej bestämt" på en ny tur, där dagarna inte är angivna', () => {
    expect(datumrad({ avresa: null, hemkomst: null, dagar: null })).toBe('Datum ej bestämt')
  })

  it('visar dagarna när någon har angett dem, även utan datum', () => {
    expect(datumrad({ avresa: null, hemkomst: null, dagar: 4 })).toBe('Datum ej bestämt · 4 dagar')
    expect(datumrad({ avresa: null, hemkomst: null, dagar: 3 })).toBe('Datum ej bestämt · 3 dagar')
    expect(datumrad({ avresa: null, hemkomst: null, dagar: 1 })).toBe('Datum ej bestämt · 1 dag')
  })

  it('visar bara avresan när varken hemkomst eller dagar är angivna', () => {
    expect(datumrad({ avresa: '2027-08-12', hemkomst: null, dagar: null })).toBe('Från 12 augusti 2027')
  })
})

describe('flerTurer', () => {
  it('visas inte när det bara finns en tur', () => {
    expect(flerTurer(0, 0).visa).toBe(false)
  })

  it('visas när det finns fler turer, med Kommande förvald', () => {
    expect(flerTurer(2, 0)).toEqual({ visa: true, forvald: 'kommande' })
    expect(flerTurer(1, 3)).toEqual({ visa: true, forvald: 'kommande' })
  })

  it('väljer Tidigare när det inte finns några kommande turer', () => {
    expect(flerTurer(0, 2)).toEqual({ visa: true, forvald: 'tidigare' })
  })
})

describe('vandringsdagar som inte är angivna', () => {
  it('visas som "Inte angett" i turens uppgifter', () => {
    expect(dagarVarde(null)).toBe('Inte angett')
    expect(dagarVarde(5)).toBe('5')
  })

  it('ett tomt fält sparas som tomt, inte som 0', () => {
    expect(antalFranFalt('')).toBeNull()
    expect(antalFranFalt('  ')).toBeNull()
    expect(antalFranFalt('5')).toBe(5)
    expect(antalFranFalt('abc')).toBeNull()
  })

  it('en tur med avresa men utan dagar räknas som en dag lång', () => {
    expect(sistaDag({ avresa: '2027-08-12', hemkomst: null, dagar: null })).toBe('2027-08-12')
    expect(lage({ avresa: '2027-08-12', hemkomst: null, dagar: null }, '2027-08-13')).toBe('tidigare')
  })
})

describe('nedrakning', () => {
  const idag = '2027-08-10'
  const tur = (avresa: string | null, hemkomst: string | null = null, dagar: number | null = null) => ({ avresa, hemkomst, dagar })

  it('säger I dag när turen börjar i dag', () => {
    expect(nedrakning(tur('2027-08-10', '2027-08-12', 3), idag)).toBe('I dag')
    expect(nedrakning(tur('2027-08-10'), idag)).toBe('I dag')
  })

  it('säger I morgon dagen före', () => {
    expect(nedrakning(tur('2027-08-11', '2027-08-13', 3), idag)).toBe('I morgon')
  })

  it('räknar dagarna till avresan', () => {
    expect(nedrakning(tur('2027-08-12', '2027-08-14', 3), idag)).toBe('Om 2 dagar')
    expect(nedrakning(tur('2027-08-25', '2027-08-27', 3), idag)).toBe('Om 15 dagar')
    expect(nedrakning(tur('2028-08-10'), idag)).toBe('Om 366 dagar')
  })

  it('räknar över månadsskiften och sommartid utan att tappa en dag', () => {
    expect(nedrakning(tur('2027-09-01'), '2027-08-31')).toBe('I morgon')
    expect(nedrakning(tur('2027-03-29'), '2027-03-27')).toBe('Om 2 dagar')
    expect(nedrakning(tur('2027-11-01'), '2027-10-30')).toBe('Om 2 dagar')
  })

  it('säger vilken dag det är när turen pågår', () => {
    expect(nedrakning(tur('2027-08-09', '2027-08-11', 3), idag)).toBe('Pågår nu, dag 2 av 3')
  })

  it('räknar sista dagen som pågående', () => {
    expect(nedrakning(tur('2027-08-08', '2027-08-10', 3), idag)).toBe('Pågår nu, dag 3 av 3')
  })

  it('räknar längden från antal dagar när hemkomsten saknas', () => {
    expect(nedrakning(tur('2027-08-09', null, 5), idag)).toBe('Pågår nu, dag 2 av 5')
  })

  it('låter hemkomsten gå före antal dagar när de inte stämmer överens', () => {
    expect(nedrakning(tur('2027-08-09', '2027-08-12', 2), idag)).toBe('Pågår nu, dag 2 av 4')
  })

  it('visar ingen nedräkning för en odaterad tur', () => {
    expect(nedrakning(tur(null), idag)).toBeNull()
    expect(nedrakning(tur(null, null, 3), idag)).toBeNull()
  })

  it('säger bara I dag när dagarna saknas och turen börjar i dag, och ingenting dagen efter', () => {
    expect(nedrakning(tur('2027-08-10'), idag)).toBe('I dag')
    expect(nedrakning(tur('2027-08-09'), idag)).toBeNull()
  })

  it('visar ingen nedräkning när turen är över', () => {
    expect(nedrakning(tur('2027-08-07', '2027-08-09', 3), idag)).toBeNull()
  })

  it('en dagstur i dag är I dag, inte dag 1 av 1', () => {
    expect(nedrakning(tur('2027-08-10', '2027-08-10', 1), idag)).toBe('I dag')
  })
})

describe('nastaEtikett', () => {
  const idag = '2027-08-10'

  it('sätter nedräkningen efter Nästa vandring, med liten bokstav', () => {
    expect(nastaEtikett({ avresa: '2027-08-25', hemkomst: null, dagar: 3 }, idag)).toBe('Nästa vandring · om 15 dagar')
    expect(nastaEtikett({ avresa: '2027-08-11', hemkomst: null, dagar: 3 }, idag)).toBe('Nästa vandring · i morgon')
    expect(nastaEtikett({ avresa: '2027-08-10', hemkomst: null, dagar: 3 }, idag)).toBe('Nästa vandring · i dag')
  })

  it('säger Pågår nu med dagen när turen pågår', () => {
    expect(nastaEtikett({ avresa: '2027-08-09', hemkomst: '2027-08-11', dagar: 3 }, idag)).toBe('Pågår nu · dag 2 av 3')
  })

  it('säger bara Nästa vandring för en odaterad tur', () => {
    expect(nastaEtikett({ avresa: null, hemkomst: null, dagar: 3 }, idag)).toBe('Nästa vandring')
  })
})

describe('antalen i Kommande och Tidigare', () => {
  it('räknas från samma listor som visas, utan turen i det stora kortet', () => {
    const tur = (id: string, avresa: string | null, hemkomst: string | null = null) => ({ id, namn: id, avresa, hemkomst, dagar: 3, skapad: `2027-01-0${id}` })
    const turer = [tur('1', '2027-08-12', '2027-08-14'), tur('2', '2027-09-01', '2027-09-03'), tur('3', null), tur('4', '2027-06-01', '2027-06-03'), tur('5', null)]
    const { nasta, kommande, tidigare } = delaUppTurer(turer, '2027-08-10')
    expect(nasta?.id).toBe('1')
    expect(kommande.map((t) => t.id)).toEqual(['2', '5', '3'])
    expect(tidigare.map((t) => t.id)).toEqual(['4'])
    // Varje tur finns på exakt ett ställe, så antalen i flikarna stämmer med det listan visar.
    expect(1 + kommande.length + tidigare.length).toBe(turer.length)
    expect(flerTurer(kommande.length, tidigare.length)).toEqual({ visa: true, forvald: 'kommande' })
  })
})

describe('halsning', () => {
  it('är kort när kortet för nästa vandring visas', () => {
    expect(halsning('Oscar', 'nasta-visas')).toBe('Hej Oscar!')
    expect(halsning('  Anna Karin ', 'nasta-visas')).toBe('Hej Anna Karin!')
  })

  it('visas inte alls utan namn när kortet för nästa vandring visas', () => {
    expect(halsning('', 'nasta-visas')).toBeNull()
    expect(halsning('   ', 'nasta-visas')).toBeNull()
  })

  it('är som förut i övriga lägen, med och utan namn', () => {
    expect(halsning('Oscar', 'laddar')).toBe('Hej Oscar.')
    expect(halsning('', 'laddar')).toBe('Hej.')
    expect(halsning('Oscar', 'inga-turer')).toBe('Hej Oscar. Här samlar du vandringarna du planerar.')
    expect(halsning('', 'inga-turer')).toBe('Hej. Här samlar du vandringarna du planerar.')
    expect(halsning('Oscar', 'bara-tidigare')).toBe('Hej Oscar. Dags att planera nästa vandring?')
    expect(halsning('', 'bara-tidigare')).toBe('Hej. Dags att planera nästa vandring?')
  })
})
