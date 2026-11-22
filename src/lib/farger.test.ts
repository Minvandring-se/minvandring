import { describe, expect, it } from 'vitest'
import { fargvariabler, kontrast, luminans } from '@/lib/farger'

// Kontrollen av själva färgerna i src/index.css ligger i tester/farger.test.ts, som får läsa filer.

describe('kontrast', () => {
  it('ger 21 för svart mot vitt och 1 för samma färg', () => {
    expect(kontrast('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(kontrast('#1f3d2e', '#1f3d2e')).toBe(1)
  })

  it('bryr sig inte om ordningen', () => {
    expect(kontrast('#1f3d2e', '#eef0eb')).toBe(kontrast('#eef0eb', '#1f3d2e'))
  })

  it('kastar ett fel för en ogiltig färg', () => {
    expect(() => luminans('grön')).toThrow()
    expect(() => luminans('#fff')).toThrow()
  })
})

describe('fargvariabler', () => {
  it('läser --color-* med sexsiffriga värden och gör dem till gemener', () => {
    expect(fargvariabler('--color-primary: #1F3D2E; --color-ring:#2e5945;')).toEqual({ primary: '#1f3d2e', ring: '#2e5945' })
  })

  it('hoppar över annat än färger', () => {
    expect(fargvariabler('--radius-md: 0.875rem; --color-x: var(--y);')).toEqual({})
  })
})
