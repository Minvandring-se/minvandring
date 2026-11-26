import { describe, expect, it } from 'vitest'
import { attGora, bandNedrakning, datumrubrik, fornamn, TIPS_FOR_ARSTID, veckansRecept, veckonummer } from './hem'
import { guideFor } from './tips'

const tur = { id: 'abc', namn: 'Sörmlandsleden' }
const forsta = { dag: { dag: 1, reserv: false, namn: 'Dag 1' }, maltid: 'middag' as const }

describe('bandet', () => {
  it('skriver dagens datum med veckodag', () => {
    expect(datumrubrik('2026-11-26')).toBe('Torsdag 26 november')
    expect(datumrubrik('2027-01-03')).toBe('Söndag 3 januari')
  })

  it('tar förnamnet ur namnet', () => {
    expect(fornamn('Oscar Edmelin')).toBe('Oscar')
    expect(fornamn('  Anna ')).toBe('Anna')
    expect(fornamn('')).toBe('')
  })

  it('räknar dagar till avfärd, och visar ingen nedräkning för en tur som har börjat eller saknar datum', () => {
    expect(bandNedrakning({ avresa: '2026-12-04' }, '2026-11-26')).toEqual({ varde: '8 dagar', text: 'till avfärd, 4 december' })
    expect(bandNedrakning({ avresa: '2026-11-27' }, '2026-11-26')).toEqual({ varde: '1 dag', text: 'till avfärd, 27 november' })
    expect(bandNedrakning({ avresa: '2026-11-26' }, '2026-11-26')).toEqual({ varde: 'I dag', text: 'avfärd, 26 november' })
    expect(bandNedrakning({ avresa: '2026-11-20' }, '2026-11-26')).toBeNull()
    expect(bandNedrakning({ avresa: null }, '2026-11-26')).toBeNull()
  })
})

describe('Att göra', () => {
  it('räknar måltider som saknas, gemensamma saker utan bärare och hur mycket som är packat', () => {
    const rader = attGora(tur, {
      mat: { totalt: 12, planerade: 0, saknas: 12, forsta },
      utanBarare: [{ namn: 'Tält' }, { namn: 'Kök' }, { namn: 'Första hjälpen' }],
      packat: { packat: 18, totalt: 45 },
    })
    expect(rader).toEqual([
      { nyckel: 'maltider', text: '12 måltider saknas', under: 'Matplanen för Sörmlandsleden', till: '/tur/abc/mat?dag=1&maltid=middag' },
      { nyckel: 'gemensamt', text: '3 gemensamma saker har ingen som bär', under: 'Tält, kök och första hjälpen', till: '/tur/abc/packning' },
      { nyckel: 'packat', text: 'Du har packat 40 %', under: 'Din packlista, 18 av 45 saker', till: '/tur/abc/packning' },
    ])
  })

  it('skriver singular och "och 2 till" när fler saker saknar bärare', () => {
    const [m, g] = attGora(tur, {
      mat: { totalt: 3, planerade: 2, saknas: 1, forsta },
      utanBarare: ['Tält', 'Kök', 'Kniv', 'Karta', 'Kompass'].map((namn) => ({ namn })),
      packat: null,
    })
    expect(m.text).toBe('1 måltid saknas')
    expect(g.under).toBe('Tält, kök, kniv och 2 till')
    expect(attGora(tur, { mat: null, utanBarare: [], packat: { packat: 0, totalt: 1 } })[0].under).toBe('Din packlista, 0 av 1 sak')
  })

  it('skriver singular på alla rader när det är en', () => {
    const rader = attGora(tur, { mat: { totalt: 3, planerade: 2, saknas: 1, forsta }, utanBarare: [{ namn: 'Tält' }], packat: { packat: 0, totalt: 1 } })
    expect(rader.map((r) => [r.text, r.under])).toEqual([
      ['1 måltid saknas', 'Matplanen för Sörmlandsleden'],
      ['1 gemensam sak har ingen som bär', 'Tält'],
      ['Du har packat 0 %', 'Din packlista, 0 av 1 sak'],
    ])
    expect(bandNedrakning({ avresa: '2026-11-27' }, '2026-11-26')?.varde).toBe('1 dag')
  })

  it('är tom när allt är klart eller inget går att räkna', () => {
    expect(attGora(tur, { mat: { totalt: 9, planerade: 9, saknas: 0, forsta: null }, utanBarare: [], packat: { packat: 5, totalt: 5 } })).toEqual([])
    expect(attGora(tur, { mat: null, utanBarare: [], packat: { packat: 0, totalt: 0 } })).toEqual([])
  })
})

describe('inspirationen', () => {
  it('räknar ISO-veckor', () => {
    expect(veckonummer('2026-11-26')).toBe(48)
    expect(veckonummer('2027-01-01')).toBe(53)
    expect(veckonummer('2027-01-04')).toBe(1)
  })

  it('ger samma recept hela veckan och ett annat nästa vecka', () => {
    const recept = ['a', 'b', 'c', 'd', 'e']
    const mandag = veckansRecept(recept, '2026-11-23')
    expect(veckansRecept(recept, '2026-11-29')).toBe(mandag)
    expect(veckansRecept(recept, '2026-11-30')).not.toBe(mandag)
    expect(veckansRecept([], '2026-11-23')).toBeNull()
  })

  it('har ett tips för varje årstid som finns i tipsen', () => {
    for (const t of Object.values(TIPS_FOR_ARSTID)) expect(guideFor(t.nyckel), t.nyckel).not.toBeNull()
  })
})

describe('attGora med uppgifter', () => {
  it('visar mina uppgifter först, och inget när jag inte har några', () => {
    const tur = { id: 't1', namn: 'Kungsleden' }
    const [u] = attGora(tur, { mat: null, utanBarare: [], packat: null, uppgifter: 2 })
    expect(u).toEqual({ nyckel: 'uppgifter', text: 'Du har 2 uppgifter i gruppen', under: 'Att göra i gruppen, Kungsleden', till: '/tur/t1' })
    expect(attGora(tur, { mat: null, utanBarare: [], packat: null, uppgifter: 1 })[0].text).toBe('Du har 1 uppgift i gruppen')
    expect(attGora(tur, { mat: null, utanBarare: [], packat: null, uppgifter: 0 })).toEqual([])
  })
})
