import { describe, expect, it } from 'vitest'
import { FILVALJARE_ACCEPT, MAX_FILSTORLEK, MINNE_MS, behoverHamtas, bildsokvag, kontrolleraFil, kvadratFranMitten, valjFormat, type Minnesrad } from './profilbild'

describe('bildsokvag', () => {
  it('är användarens mapp och filen bild, utan filändelse', () => {
    expect(bildsokvag('11111111-2222-3333-4444-555555555555')).toBe('11111111-2222-3333-4444-555555555555/bild')
  })
})

describe('kontrolleraFil', () => {
  const MB = 1024 * 1024

  it('godtar JPG, PNG och WebP', () => {
    for (const type of ['image/jpeg', 'image/png', 'image/webp']) expect(kontrolleraFil({ type, size: MB }), type).toBeNull()
  })

  it('säger vilka filtyper som går när typen är fel', () => {
    for (const type of ['image/heic', 'image/gif', 'image/svg+xml', 'application/pdf', '']) {
      expect(kontrolleraFil({ type, size: MB }), type).toBe('Välj en bild i JPG, PNG eller WebP.')
    }
  })

  it('godtar högst 10 MB', () => {
    expect(MAX_FILSTORLEK).toBe(10 * MB)
    expect(kontrolleraFil({ type: 'image/jpeg', size: 10 * MB })).toBeNull()
    expect(kontrolleraFil({ type: 'image/jpeg', size: 10 * MB + 1 })).toBe('Bilden är för stor. Välj en som är högst 10 MB.')
  })

  it('godtar inte en tom fil', () => {
    expect(kontrolleraFil({ type: 'image/png', size: 0 })).toBe('Filen är tom. Välj en annan bild.')
  })

  it('klagar på typen före storleken', () => {
    expect(kontrolleraFil({ type: 'video/mp4', size: 50 * MB })).toBe('Välj en bild i JPG, PNG eller WebP.')
  })

  it('filväljaren visar samma typer, så att iPhone gör om HEIC till JPEG', () => {
    expect(FILVALJARE_ACCEPT).toBe('image/jpeg,image/png,image/webp')
  })
})

describe('kvadratFranMitten', () => {
  it('tar mitten av en liggande bild', () => {
    expect(kvadratFranMitten(4000, 3000)).toEqual({ x: 500, y: 0, sida: 3000 })
  })

  it('tar mitten av en stående bild', () => {
    expect(kvadratFranMitten(3000, 4000)).toEqual({ x: 0, y: 500, sida: 3000 })
  })

  it('lämnar en kvadratisk bild orörd', () => {
    expect(kvadratFranMitten(256, 256)).toEqual({ x: 0, y: 0, sida: 256 })
  })

  it('avrundar till hela pixlar och håller sig inom bilden', () => {
    const { x, y, sida } = kvadratFranMitten(1001, 600)
    expect({ x, y, sida }).toEqual({ x: 201, y: 0, sida: 600 })
    expect(x + sida).toBeLessThanOrEqual(1001)
  })

  it('klarar en bild som är mindre än den sparade storleken, och en utan storlek', () => {
    expect(kvadratFranMitten(100, 60)).toEqual({ x: 20, y: 0, sida: 60 })
    expect(kvadratFranMitten(0, 0)).toEqual({ x: 0, y: 0, sida: 0 })
  })
})

describe('valjFormat', () => {
  it('behåller WebP när webbläsaren kunde skapa det', () => {
    expect(valjFormat('image/webp')).toBe('image/webp')
  })

  it('väljer JPEG när försöket med WebP gav något annat, som i Safari', () => {
    expect(valjFormat('image/png')).toBe('image/jpeg')
    expect(valjFormat('')).toBe('image/jpeg')
    expect(valjFormat(null)).toBe('image/jpeg')
    expect(valjFormat(undefined)).toBe('image/jpeg')
  })
})

describe('behoverHamtas', () => {
  const nu = 1_000_000_000
  const minne = (rader: Record<string, Minnesrad>) => new Map(Object.entries(rader))

  it('hämtar de som inte finns i minnet, varje id en gång', () => {
    expect(behoverHamtas(['a', 'b', 'a'], minne({}), nu)).toEqual(['a', 'b'])
  })

  it('hämtar inte det som nyss är hämtat, inte heller beskedet att bild saknas', () => {
    const m = minne({ a: { adress: 'https://exempel.se/a', hamtad: nu - 1000 }, b: { adress: null, hamtad: nu - 1000 } })
    expect(behoverHamtas(['a', 'b', 'c'], m, nu)).toEqual(['c'])
  })

  it('hämtar om det som är äldre än tio minuter', () => {
    const m = minne({ a: { adress: 'https://exempel.se/a', hamtad: nu - MINNE_MS }, b: { adress: null, hamtad: nu - MINNE_MS + 1 } })
    expect(behoverHamtas(['a', 'b'], m, nu)).toEqual(['a'])
  })

  it('ger en tom lista utan användare', () => {
    expect(behoverHamtas([], minne({}), nu)).toEqual([])
  })
})
