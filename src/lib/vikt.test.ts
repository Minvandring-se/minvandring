import { describe, expect, it } from 'vitest'
import { matandelar, matvikter, packvikter, type Deltagare, type Packrad } from './vikt'

const oscar: Deltagare = { id: 'o', typ: 'person', matandel: null }
const andreas: Deltagare = { id: 'a', typ: 'person', matandel: null }
const pichi: Deltagare = { id: 'p', typ: 'person', matandel: null }
const bamse: Deltagare = { id: 'b', typ: 'hund', matandel: null, hundmatPerDagG: 300 }

const rad = (r: Partial<Packrad>): Packrad => ({
  antal: 1, viktG: null, typ: 'ryggsack', med: true, barsAv: null, alla: false, ...r,
})

describe('packvikter', () => {
  it('räknar alla-saker per person men inte för hunden', () => {
    const v = packvikter([rad({ viktG: 1200, alla: true })], [oscar, andreas, bamse])
    expect(v.get('o')!.bas).toBe(1200)
    expect(v.get('a')!.bas).toBe(1200)
    expect(v.get('b')!.bas).toBe(0)
  })

  it('räknar bara den som bär saken och multiplicerar med antal', () => {
    const v = packvikter([rad({ viktG: 53, antal: 3, barsAv: 'o' })], [oscar, andreas])
    expect(v.get('o')!.bas).toBe(159)
    expect(v.get('a')!.bas).toBe(0)
  })

  it('räknar inte saker som inte ska med', () => {
    const v = packvikter([rad({ viktG: 500, barsAv: 'o', med: false })], [oscar])
    expect(v.get('o')!.bas).toBe(0)
  })

  it('delar upp på ryggsäck, förbrukning och kropp', () => {
    const v = packvikter(
      [rad({ viktG: 100, barsAv: 'o' }), rad({ viktG: 50, barsAv: 'o', typ: 'forbrukas' }), rad({ viktG: 30, barsAv: 'o', typ: 'kropp' })],
      [oscar],
    )
    expect(v.get('o')).toEqual({ bas: 100, forbrukas: 50, kropp: 30 })
  })
})

describe('matandelar', () => {
  it('delar lika när ingen har egen andel', () => {
    const a = matandelar([oscar, andreas, pichi, bamse])
    expect(a.get('o')).toBeCloseTo(1 / 3)
    expect(a.get('b')).toBe(0)
  })

  it('ger resten lika till dem utan egen andel', () => {
    const a = matandelar([oscar, andreas, { ...pichi, matandel: 0.5 }])
    expect(a.get('p')).toBe(0.5)
    expect(a.get('o')).toBeCloseTo(0.25)
    expect(a.get('a')).toBeCloseTo(0.25)
  })
})

describe('matvikter', () => {
  it('låter hunden bära sin egen mat', () => {
    const m = matvikter(18000, [oscar, andreas, pichi, bamse], 7)
    expect(m.get('o')).toBeCloseTo(6000)
    expect(m.get('b')).toBe(2100)
  })
})
