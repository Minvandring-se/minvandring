import { describe, expect, it } from 'vitest'
import { datumText, dagarMellan } from './datum'

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
