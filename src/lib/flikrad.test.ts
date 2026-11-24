import { describe, expect, it } from 'vitest'
import { skrollForAktivFlik } from './flikrad'

// Raden är 390 px bred och skrollad till 0. Fliken anges med vänster och höger kant i radens innehåll.
const rad = { skroll: 0, bredd: 390 }

describe('skrollForAktivFlik', () => {
  it('skrollar inte när fliken redan syns helt', () => {
    expect(skrollForAktivFlik({ ...rad, vanster: 100, hoger: 200 })).toBe(0)
  })

  it('skrollar fram en flik som ligger utanför till höger, med lite luft efter', () => {
    expect(skrollForAktivFlik({ ...rad, vanster: 420, hoger: 520 })).toBe(520 - 390 + 16)
  })

  it('skrollar fram en flik som bara delvis syns till höger', () => {
    expect(skrollForAktivFlik({ ...rad, vanster: 360, hoger: 440 })).toBe(440 - 390 + 16)
  })

  it('skrollar tillbaka till en flik som ligger utanför till vänster', () => {
    expect(skrollForAktivFlik({ skroll: 300, bredd: 390, vanster: 120, hoger: 200 })).toBe(120 - 16)
  })

  it('går aldrig under noll', () => {
    expect(skrollForAktivFlik({ skroll: 50, bredd: 390, vanster: 4, hoger: 80 })).toBe(0)
  })
})
