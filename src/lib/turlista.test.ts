import { describe, expect, it } from 'vitest'
import {
  bildForTur,
  datumrad,
  flerTurer,
  dagarText,
  datumIntervall,
  delaUppTurer,
  deltagareText,
  initialer,
  lage,
  lokaltDatum,
  sistaDag,
  TURBILDER,
  type TurIListan,
} from './turlista'

const IDAG = '2027-08-14'

function tur(id: string, avresa: string | null, hemkomst: string | null = null, dagar = 1, skapad = '2027-01-01T00:00:00Z'): TurIListan {
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
    expect(datumIntervall(null, null)).toBe('Inga datum än')
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

  it('visar inte standardvärdet för dagar på en tur utan datum', () => {
    expect(datumrad({ avresa: null, hemkomst: null, dagar: 3 })).toBe('Inga datum än')
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
