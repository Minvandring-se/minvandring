import { describe, expect, it } from 'vitest'
import { formateraPatroner, gasbehov, patronforslag, PRIMUS_G } from './bransle'

describe('gas till turen', () => {
  it('följer Primus för en person i en dag, en helg och en vecka', () => {
    expect([1, 2, 3, 7].map((d) => gasbehov(1, d))).toEqual([100, 230, 230, 460])
    expect([1, 2, 3, 7].map((d) => gasbehov(1, d, 'vinter'))).toEqual([230, 450, 450, 680])
  })

  it('räknar minst helgens gas mellan helg och vecka och fördelar veckan på längre turer', () => {
    // 680 / 7 × 4 = 389 g, men en helg är 450 g
    expect(gasbehov(1, 4, 'vinter')).toBe(450)
    // 460 / 7 × 10 = 657 g
    expect(gasbehov(1, 10)).toBe(660)
  })

  it('räknar varje person med eget kök', () => {
    expect(gasbehov(2, 7)).toBe(920)
    expect(gasbehov(3, 1, 'vinter')).toBe(690)
  })

  it('ger 0 när personer eller dagar saknas', () => {
    expect(gasbehov(0, 5)).toBe(0)
    expect(gasbehov(2, 0)).toBe(0)
    expect(gasbehov(Number.NaN, 3)).toBe(0)
  })
})

describe('patroner som räcker', () => {
  it('väljer så få patroner som möjligt', () => {
    expect(patronforslag(400)).toEqual([450])
    expect(patronforslag(300)).toEqual([450])
    expect(patronforslag(100)).toEqual([100])
  })

  it('väljer minst gas över bland lika många patroner', () => {
    expect(patronforslag(200)).toEqual([230])
    expect(patronforslag(1000)).toEqual([450, 450, 100])
    expect(patronforslag(600)).toEqual([450, 230])
  })

  it('ger Primus patroner för en person i en vecka', () => {
    expect(patronforslag(gasbehov(1, 1))).toEqual([100])
    expect(patronforslag(gasbehov(1, 2, 'vinter'))).toEqual([450])
    expect(patronforslag(gasbehov(1, 7))).toEqual([230, 230])
    expect(patronforslag(gasbehov(1, 7, 'vinter'))).toEqual([450, 230])
  })

  it('ger tom lista när inget behövs och null när det krävs fler än åtta patroner', () => {
    expect(patronforslag(0)).toEqual([])
    expect(patronforslag(4000)).toBeNull()
  })

  it('går att räkna med andra storlekar', () => {
    expect(patronforslag(250, [110, 250])).toEqual([250])
  })

  it('skriver patronerna som text', () => {
    expect(formateraPatroner([450, 450, 100])).toBe('2 × 450 g + 100 g')
    expect(formateraPatroner([230])).toBe('230 g')
  })
})

describe('Primus siffror som patroner', () => {
  it('blir de patroner som Primus själva skriver', () => {
    expect([PRIMUS_G.sommar.dag, PRIMUS_G.sommar.helg, PRIMUS_G.sommar.vecka].map((g) => formateraPatroner(patronforslag(g) ?? []))).toEqual(['100 g', '230 g', '2 × 230 g'])
    expect([PRIMUS_G.vinter.dag, PRIMUS_G.vinter.helg, PRIMUS_G.vinter.vecka].map((g) => formateraPatroner(patronforslag(g) ?? []))).toEqual(['230 g', '450 g', '450 g + 230 g'])
  })
})
