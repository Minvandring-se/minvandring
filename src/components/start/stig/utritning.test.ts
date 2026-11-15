import { describe, expect, it } from 'vitest'
import { easeInOut, RITTID, tidVidAndel, VANTAN } from './utritning'

describe('utritning', () => {
  it('väntar 0,2 s och ritar på 1,6 s', () => {
    expect(VANTAN).toBe(200)
    expect(RITTID).toBe(1600)
  })

  it('ritar med ease-in-out: lugnt i början och slutet', () => {
    expect(easeInOut(0)).toBe(0)
    expect(easeInOut(1)).toBe(1)
    expect(easeInOut(0.5)).toBeCloseTo(0.5, 4)
    expect(easeInOut(0.1)).toBeLessThan(0.1)
    expect(easeInOut(0.9)).toBeGreaterThan(0.9)
  })

  it('räknar ut när leden når en viss punkt, så att ledkorset dyker upp just då', () => {
    for (const andel of [0, 0.1, 0.35, 0.5, 0.72, 0.95, 1]) {
      expect(easeInOut(tidVidAndel(andel))).toBeCloseTo(andel, 4)
    }
    // Senare längs leden betyder senare i tiden.
    const tider = [0.2, 0.4, 0.6, 0.8].map(tidVidAndel)
    expect(tider.every((t, i) => i === 0 || t > tider[i - 1])).toBe(true)
  })
})
