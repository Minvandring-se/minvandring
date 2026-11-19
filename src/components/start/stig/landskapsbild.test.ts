import { describe, expect, it } from 'vitest'
import { BILD, MINSTA_SKALA, placeraLandskap } from './landskapsbild'

const vb = (s: string) => s.split(' ').map(Number)

/** Mellanrummen som de är på sidan: mobil, surfplatta, laptop och stor skärm. */
const sidan = [
  { hojd: 144, vanster: 0, hoger: 342 },
  { hojd: 144, vanster: 0, hoger: 720 },
  { hojd: 160, vanster: 83, hoger: 1235 },
  { hojd: 160, vanster: 360, hoger: 1512 },
]

describe('placeraLandskap', () => {
  it('behåller bildens proportioner', () => {
    for (const m of sidan) {
      const p = placeraLandskap(m)!
      for (const h of [p.vanster, p.hoger]) {
        const [, , w, hh] = vb(h.viewBox)
        expect(h.bredd / h.hojd).toBeCloseTo(w / hh, 6)
      }
    }
  })

  it('står inom panelernas bredd med marken nere vid nästa panel', () => {
    for (const m of sidan) {
      const p = placeraLandskap(m)!
      expect(p.vanster.x).toBe(m.vanster)
      expect(p.hoger.x + p.hoger.bredd).toBeCloseTo(m.hoger, 6)
      expect(p.vanster.x + p.vanster.bredd).toBeLessThanOrEqual(p.hoger.x + 0.001)
      expect(p.vanster.y + p.vanster.hojd).toBeCloseTo(m.hojd, 6)
      expect(p.vanster.y).toBeGreaterThanOrEqual(0)
    }
  })

  it('visar hela bilden i ett stycke på dator', () => {
    const p = placeraLandskap(sidan[2])!
    expect(p.beskuren).toBe(false)
    expect(vb(p.vanster.viewBox)).toEqual([0, 0, 600, 160])
    expect(vb(p.hoger.viewBox)).toEqual([600, 0, 600, 160])
    expect(p.vanster.hojd).toBeCloseTo((160 * 1152) / 1200, 6)
  })

  it('visar halvorna större i mobil och låter mitten falla bort', () => {
    const p = placeraLandskap(sidan[0])!
    expect(p.beskuren).toBe(true)
    expect(p.vanster.hojd).toBeCloseTo(BILD.hojd * MINSTA_SKALA, 6)
    const [x0, , w0] = vb(p.vanster.viewBox)
    const [x1, , w1] = vb(p.hoger.viewBox)
    expect(x0).toBe(0)
    expect(x1 + w1).toBe(BILD.bredd)
    expect(w0).toBeLessThan(BILD.bredd / 2)
  })

  it('saknas utan mått', () => {
    expect(placeraLandskap({ hojd: 0, vanster: 0, hoger: 300 })).toBeNull()
  })
})
