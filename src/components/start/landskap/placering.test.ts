import { describe, expect, it } from 'vitest'
import { BAND, SIDOR } from './bilder'
import { placeraBand, placeraSidor, type Ruta } from './placering'

const band = Object.values(BAND)
/** Mellanrummen som de är på sidan: mobil, surfplatta och dator. */
const mellanrum = [
  { hojd: 144, vanster: 0, hoger: 366 },
  { hojd: 144, vanster: 0, hoger: 720 },
  { hojd: 160, vanster: 83, hoger: 1235 },
  { hojd: 160, vanster: 360, hoger: 1512 },
]

describe('placeraBand', () => {
  it('behåller bildernas proportioner', () => {
    for (const m of mellanrum)
      for (const b of band) {
        const p = placeraBand(m, b)!
        for (const d of [p.vanster, p.hoger]) expect(d.bredd / d.hojd).toBeCloseTo(d.bild.bredd / d.bild.hojd, 5)
      }
  })

  it('står inom mellanrummet med marken nere vid nästa panel', () => {
    for (const m of mellanrum)
      for (const b of band) {
        const p = placeraBand(m, b)!
        for (const d of [p.vanster, p.hoger]) {
          expect(d.y).toBeGreaterThanOrEqual(0)
          expect(d.y + d.hojd).toBeCloseTo(m.hojd - 6, 5)
          expect(d.klipp.vanster).toBeGreaterThanOrEqual(m.vanster)
          expect(d.klipp.hoger).toBeLessThanOrEqual(m.hoger)
        }
      }
  })

  it('lämnar mitten fri för leden', () => {
    for (const m of mellanrum)
      for (const b of band) {
        const p = placeraBand(m, b)!
        const panel = m.hoger - m.vanster
        expect(p.vanster.klipp.hoger).toBeLessThanOrEqual(m.vanster + 0.42 * panel + 0.01)
        expect(p.hoger.klipp.vanster).toBeGreaterThanOrEqual(m.hoger - 0.42 * panel - 0.01)
      }
  })

  it('skalas efter panelernas bredd på dator och blir inte mindre än 60 % i mobil', () => {
    const dator = placeraBand(mellanrum[3], BAND.skog)!
    expect(dator.vanster.hojd).toBeCloseTo((BAND.skog.vanster.hojd * 1152) / 1200, 5)
    const mobil = placeraBand(mellanrum[0], BAND.skog)!
    expect(mobil.vanster.hojd).toBeCloseTo(BAND.skog.vanster.hojd * 0.6, 5)
  })

  it('saknas utan mått', () => {
    expect(placeraBand({ hojd: 0, vanster: 0, hoger: 300 }, BAND.skog)).toBeNull()
  })
})

describe('placeraSidor', () => {
  const glipor: Ruta[] = [0, 1, 2, 3].map((i) => ({ vanster: 0, hoger: 0, topp: 800 + i * 900, botten: 960 + i * 900 }))
  const sida = (bredd: number) => {
    const panel = Math.min(1152, bredd - 48)
    return { bredd, panelVanster: (bredd - panel) / 2, panelHoger: (bredd + panel) / 2, glipor }
  }

  it('visas inte när ytterkanterna är smala', () => {
    expect(placeraSidor(sida(1366), SIDOR)).toEqual([])
    expect(placeraSidor(sida(390), SIDOR)).toEqual([])
  })

  it('visar ett motiv per mellanrum och sida på breda skärmar', () => {
    const p = placeraSidor(sida(1920), SIDOR)
    expect(p).toHaveLength(8)
  })

  it('står i ytterkanterna, aldrig över panelerna, och behåller proportionerna', () => {
    for (const bredd of [1500, 1600, 1920, 2560]) {
      const s = sida(bredd)
      for (const p of placeraSidor(s, SIDOR)) {
        const iVanster = p.x + p.bredd <= s.panelVanster
        const iHoger = p.x >= s.panelHoger
        expect(iVanster || iHoger).toBe(true)
        expect(p.x).toBeGreaterThanOrEqual(0)
        expect(p.x + p.bredd).toBeLessThanOrEqual(bredd)
        expect(p.bredd / p.hojd).toBeCloseTo(p.bild.bredd / p.bild.hojd, 5)
      }
    }
  })

  it('har marken i samma höjd som bandet i mellanrummet', () => {
    const p = placeraSidor(sida(1920), SIDOR)
    for (const x of p) expect(glipor.some((g) => Math.abs(x.y + x.hojd - (g.botten - 6)) < 0.01)).toBe(true)
  })
})
