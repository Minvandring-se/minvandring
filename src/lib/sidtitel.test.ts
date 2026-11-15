import { describe, expect, it } from 'vitest'
import { sidtitel, STANDARDTITEL } from './sidtitel'

describe('sidtitel', () => {
  it('sätter sidans namn före MinVandring', () => {
    expect(sidtitel('Mina turer')).toBe('Mina turer · MinVandring')
    expect(sidtitel('  Sarek 2027 ')).toBe('Sarek 2027 · MinVandring')
  })

  it('ger standardtiteln när sidan saknar namn', () => {
    expect(sidtitel('')).toBe(STANDARDTITEL)
    expect(sidtitel(undefined)).toBe(STANDARDTITEL)
  })
})
