import { describe, expect, it } from 'vitest'
import { arstidFor, arstidsbild } from './arstid'

describe('årstiden för en tur', () => {
  it('väljer efter månaden för turens första dag', () => {
    const fall: [string, string][] = [
      ['2026-12-04', 'vinter'],
      ['2027-01-15', 'vinter'],
      ['2027-03-31', 'vinter'],
      ['2027-04-01', 'var'],
      ['2027-05-20', 'var'],
      ['2027-06-01', 'sommar'],
      ['2027-08-31', 'sommar'],
      ['2027-09-01', 'host'],
      ['2027-11-30', 'host'],
    ]
    for (const [datum, arstid] of fall) expect(arstidFor(datum), datum).toBe(arstid)
  })

  it('blir sommar utan datum eller med ett datum som inte går att läsa', () => {
    expect(arstidFor(null)).toBe('sommar')
    expect(arstidFor('')).toBe('sommar')
    expect(arstidFor('december')).toBe('sommar')
  })

  it('ger bilden i två storlekar', () => {
    expect(arstidsbild('host')).toEqual({ src: '/illustrationer/tur-host-720.webp', srcSet: '/illustrationer/tur-host-720.webp 720w, /illustrationer/tur-host-1440.webp 1440w' })
  })
})
