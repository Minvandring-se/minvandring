import { describe, expect, it } from 'vitest'
import { andel, fro, procent, ringBage, turbildForm } from '@/lib/matt'

describe('andel', () => {
  it('räknar andelen av målet', () => {
    expect(andel(5, 10)).toBe(0.5)
    expect(andel(0.25)).toBe(0.25)
  })

  it('stannar mellan 0 och 1', () => {
    expect(andel(15, 10)).toBe(1)
    expect(andel(-3, 10)).toBe(0)
  })

  it('ger 0 för ogiltiga värden och mål', () => {
    expect(andel(Number.NaN)).toBe(0)
    expect(andel(5, 0)).toBe(0)
    expect(andel(5, -1)).toBe(0)
    expect(andel(Number.POSITIVE_INFINITY, 10)).toBe(0)
  })
})

describe('procent', () => {
  it('avrundar till hela procent', () => {
    expect(procent(0.643)).toBe(64)
    expect(procent(1.2)).toBe(100)
  })
})

describe('ringBage', () => {
  it('fyller rätt del av omkretsen', () => {
    const { omkrets, fylld } = ringBage(0.5, 10)
    expect(omkrets).toBeCloseTo(62.83, 2)
    expect(fylld).toBeCloseTo(31.42, 2)
  })

  it('fyller inget för noll och hela ringen för över 100 %', () => {
    expect(ringBage(0, 10).fylld).toBe(0)
    expect(ringBage(2, 10).fylld).toBeCloseTo(ringBage(1, 10).omkrets)
  })
})

describe('fro och turbildForm', () => {
  it('ger samma värde för samma text och ett värde mellan 0 och 1', () => {
    expect(fro('abc')).toBe(fro('abc'))
    for (const t of ['', 'a', 'Kungsleden', '8a75a9ea-0037-4c2c-8762-5e64f3f2ea79']) {
      expect(fro(t)).toBeGreaterThanOrEqual(0)
      expect(fro(t)).toBeLessThanOrEqual(1)
    }
  })

  it('ger samma bild för samma tur och olika bilder för olika turer', () => {
    expect(turbildForm('tur-1')).toEqual(turbildForm('tur-1'))
    expect(turbildForm('tur-1')).not.toEqual(turbildForm('tur-2'))
  })

  it('håller solen och topparna inom bildrutan', () => {
    for (let i = 0; i < 50; i++) {
      const f = turbildForm(`tur-${i}`)
      expect(f.solX).toBeGreaterThanOrEqual(380)
      expect(f.solX).toBeLessThanOrEqual(520)
      expect(f.topp1).toBeGreaterThanOrEqual(110)
      expect(f.topp2).toBeLessThanOrEqual(190)
    }
  })
})
