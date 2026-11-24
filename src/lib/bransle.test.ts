import { describe, expect, it } from 'vitest'
import { formateraPatroner, gasbehov, patronforslag } from './bransle'

describe('gas till turen', () => {
  it('följer Primus veckosiffror för en person', () => {
    expect(gasbehov(1, 7)).toBe(460)
    expect(gasbehov(1, 7, 'vinter')).toBe(680)
  })

  it('räknar varje person med eget kök och avrundar uppåt till jämna 10 g', () => {
    expect(gasbehov(2, 7)).toBe(920)
    // 2 × 5 × 460 / 7 = 657 g
    expect(gasbehov(2, 5)).toBe(660)
    expect(gasbehov(1, 1)).toBe(70)
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
