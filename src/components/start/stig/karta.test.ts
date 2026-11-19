import { describe, expect, it } from 'vitest'
import { KARTBILD, placeraKarta } from './karta'

/** Mellanrummen som de är på sidan: mobil, surfplatta, laptop och stor skärm. */
const sidan = [
  { hojd: 144, vanster: 0, hoger: 342 },
  { hojd: 144, vanster: 0, hoger: 720 },
  { hojd: 160, vanster: 83, hoger: 1235 },
  { hojd: 160, vanster: 360, hoger: 1512 },
]

describe('placeraKarta', () => {
  it('fyller mellanrummet i panelernas bredd, inte ytterkanterna', () => {
    for (const m of sidan) {
      const k = placeraKarta(m)!
      expect(k.x).toBe(m.vanster)
      expect(k.x + k.bredd).toBe(m.hoger)
      expect(k.y).toBe(0)
      expect(k.hojd).toBe(m.hojd)
    }
  })

  it('täcker ytan utan att bilden förvrängs: skalan räcker i båda led', () => {
    for (const m of sidan) {
      const k = placeraKarta(m)!
      expect(KARTBILD.bredd * k.skala).toBeGreaterThanOrEqual(k.bredd - 0.001)
      expect(KARTBILD.hojd * k.skala).toBeGreaterThanOrEqual(k.hojd - 0.001)
    }
  })

  it('beskär lite i sidorna på dator och mer i mobil, men aldrig i höjd mer än nödvändigt', () => {
    const dator = placeraKarta(sidan[2])!
    expect(dator.skala).toBe(1)
    const mobil = placeraKarta(sidan[0])!
    expect(mobil.skala).toBeCloseTo(144 / 160, 6)
  })

  it('tonar ut kanterna utan att ta mer än en liten del av ytan', () => {
    for (const m of sidan) {
      const k = placeraKarta(m)!
      expect(k.sidtoning).toBeLessThanOrEqual(k.bredd * 0.08 + 0.001)
      expect(k.hojdtoning).toBeLessThanOrEqual(16)
    }
  })

  it('saknas utan mått', () => {
    expect(placeraKarta({ hojd: 0, vanster: 0, hoger: 300 })).toBeNull()
  })
})
