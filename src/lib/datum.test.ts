import { describe, expect, it } from 'vitest'
import { dagarMellan, dagensDatum, datumText } from './datum'

describe('dagarMellan', () => {
  it('räknar båda dagarna', () => {
    expect(dagarMellan('2027-07-10', '2027-07-15')).toBe(6)
    expect(dagarMellan('2027-07-10', '2027-07-10')).toBe(1)
  })

  it('klarar månadsskifte', () => {
    expect(dagarMellan('2027-07-30', '2027-08-02')).toBe(4)
  })

  it('ger null när ett datum saknas eller hemkomsten är före avresan', () => {
    expect(dagarMellan('2027-07-10', null)).toBeNull()
    expect(dagarMellan('2027-07-15', '2027-07-10')).toBeNull()
  })
})

describe('datumText', () => {
  it('skriver datumet på svenska', () => {
    expect(datumText('2027-07-10')).toBe('10 juli 2027')
    expect(datumText(null)).toBe('')
  })
})

describe('dagensDatum', () => {
  it('ger veckodag och datum, med dag 1 som avresedagen', () => {
    expect(dagensDatum('2026-12-04', 1)).toBe('fredag 4 december')
    expect(dagensDatum('2026-12-04', 3)).toBe('söndag 6 december')
  })

  it('går över månads- och årsskiften', () => {
    expect(dagensDatum('2026-12-31', 2)).toBe('fredag 1 januari')
  })

  it('är null utan avresa eller med en dag före turen', () => {
    expect(dagensDatum(null, 1)).toBeNull()
    expect(dagensDatum('2026-12-04', 0)).toBeNull()
    expect(dagensDatum('inte ett datum', 1)).toBeNull()
  })
})
