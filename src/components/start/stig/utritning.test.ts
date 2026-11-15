import { describe, expect, it } from 'vitest'
import { easeInOut, RITTID, utritning, VANTAN } from './utritning'

/** Hur stor del av hela leden (nere + uppe) som syns vid tiden t ms, enligt nyckelrutorna. */
function synligAndel(t: number, langdNere: number, langdUppe: number) {
  const { nere, uppe } = utritning(langdNere, langdUppe)
  const varde = (del: typeof nere, tid: number) => {
    const o = Math.min(1, Math.max(0, tid / del.varaktighet))
    const i = Math.min(del.ramar.length - 2, Math.floor(o * (del.ramar.length - 1)))
    const [a, b] = [del.ramar[i], del.ramar[i + 1]]
    const andel = (o - a.offset) / (b.offset - a.offset)
    return 1 - (a.strokeDashoffset + (b.strokeDashoffset - a.strokeDashoffset) * andel)
  }
  const total = langdNere + langdUppe
  const nereSynlig = varde(nere, t) * langdNere
  const uppeSynlig = uppe ? varde(uppe, t - nere.varaktighet) * langdUppe : 0
  return (nereSynlig + uppeSynlig) / total
}

describe('easeInOut', () => {
  it('börjar och slutar lugnt och är symmetrisk', () => {
    expect(easeInOut(0)).toBe(0)
    expect(easeInOut(1)).toBe(1)
    expect(easeInOut(0.5)).toBeCloseTo(0.5, 4)
    expect(easeInOut(0.1)).toBeLessThan(0.1)
    expect(easeInOut(0.9)).toBeGreaterThan(0.9)
    expect(easeInOut(0.25) + easeInOut(0.75)).toBeCloseTo(1, 4)
  })
})

describe('utritning', () => {
  it('tar 1,6 sekunder efter en halv sekunds väntan', () => {
    expect(VANTAN).toBe(500)
    expect(RITTID).toBe(1600)
    const { nere, uppe } = utritning(1200, 60)
    expect(nere.varaktighet + (uppe?.varaktighet ?? 0)).toBeCloseTo(1600, 6)
    expect(utritning(800).nere.varaktighet).toBe(1600)
    expect(utritning(800).uppe).toBeNull()
  })

  it('ritar från början till slut och ligger sedan kvar', () => {
    const { nere, uppe } = utritning(1200, 60)
    expect(nere.ramar[0].strokeDashoffset).toBe(1)
    expect(nere.ramar.at(-1)?.strokeDashoffset).toBeCloseTo(0, 6)
    expect(uppe?.ramar[0].strokeDashoffset).toBeCloseTo(1, 6)
    expect(uppe?.ramar.at(-1)?.strokeDashoffset).toBeCloseTo(0, 6)
    for (const del of [nere, uppe]) {
      const varden = del?.ramar.map((r) => r.strokeDashoffset) ?? []
      expect(varden.every((v, i) => i === 0 || v <= varden[i - 1])).toBe(true)
    }
  })

  it('följer ease-in-out över båda delarna, så att farten inte ändras vid sektionsgränsen', () => {
    for (const [nere, uppe] of [
      [1200, 60],
      [500, 120],
      [900, 0],
    ]) {
      for (let t = 0; t <= RITTID; t += 40) {
        expect(synligAndel(t, nere, uppe)).toBeCloseTo(easeInOut(t / RITTID), 2)
      }
    }
  })
})
