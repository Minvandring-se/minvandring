import { describe, expect, it } from 'vitest'
import { aktivSida, BLAD, bladIState, FLIKAR, flikAktiv, MENYGRUPPER, SIDOR } from '@/lib/meny'

describe('menyns sidor', () => {
  it('har sökvägar utan å, ä och ö, och alla är olika', () => {
    const vagar = Object.values(SIDOR).map((s) => s.till)
    for (const v of vagar) expect(v).toMatch(/^\/[a-z-]+$/)
    expect(new Set(vagar).size).toBe(vagar.length)
  })

  it('har sökvägarna från uppdraget', () => {
    expect(['matplanering', 'packlistor', 'utrustning', 'dagbok', 'kom-ihag', 'statistik', 'kompisar', 'installningar'].map((s) => SIDOR[s as keyof typeof SIDOR].till)).toEqual([
      '/matplanering',
      '/packlistor',
      '/utrustning',
      '/dagbok',
      '/kom-ihag',
      '/statistik',
      '/kompisar',
      '/installningar',
    ])
  })

  it('säger vad varje sida som inte är byggd blir', () => {
    for (const s of Object.values(SIDOR).filter((s) => !s.byggd)) expect(s.blir.length).toBeGreaterThan(30)
  })

  it('har grupperna i sidomenyn i rätt ordning', () => {
    expect(MENYGRUPPER.map((g) => [g.rubrik, g.sidor.map((s) => SIDOR[s].namn)])).toEqual([
      ['Planera', ['Mina turer', 'Matplanering', 'Packlistor och mallar']],
      ['Utrustning', ['Mitt förråd', 'Utrustningskatalog']],
      ['Minnen', ['Dagbok', 'Kom ihåg till nästa', 'Statistik']],
      ['Folk', ['Vandringskompisar']],
    ])
  })

  it('har fem flikar i mobil och bladen Minnen och Mer', () => {
    expect(FLIKAR.map((f) => f.namn)).toEqual(['Turer', 'Mat', 'Förråd', 'Minnen', 'Mer'])
    expect(BLAD.minnen).toEqual(['dagbok', 'kom-ihag', 'statistik'])
    expect(BLAD.mer).toEqual(['packlistor', 'utrustning', 'kompisar', 'installningar'])
  })
})

describe('bladIState', () => {
  it('läser det öppna bladet och om det öppnades i appen', () => {
    expect(bladIState({ blad: 'mer', steg: true })).toEqual({ blad: 'mer', steg: true })
    expect(bladIState({ blad: 'minnen' })).toEqual({ blad: 'minnen', steg: false })
    expect(bladIState({ blad: 'annat' })).toBeNull()
    expect(bladIState(null)).toBeNull()
    expect(bladIState('mer')).toBeNull()
  })
})

describe('aktivSida och flikAktiv', () => {
  it('känner igen sidan från adressen, och turens sidor hör till Mina turer', () => {
    expect(aktivSida('/turer')).toBe('turer')
    expect(aktivSida('/tur/abc/mat')).toBe('turer')
    expect(aktivSida('/statistik')).toBe('statistik')
    expect(aktivSida('/kom-ihag')).toBe('kom-ihag')
    expect(aktivSida('/okand')).toBeNull()
  })

  it('markerar bladet när en av dess sidor är öppen', () => {
    const minnen = FLIKAR.find((f) => f.namn === 'Minnen')!
    const mer = FLIKAR.find((f) => f.namn === 'Mer')!
    expect(flikAktiv(minnen, 'statistik')).toBe(true)
    expect(flikAktiv(mer, 'installningar')).toBe(true)
    expect(flikAktiv(mer, 'statistik')).toBe(false)
    expect(flikAktiv(FLIKAR[0], 'turer')).toBe(true)
    expect(flikAktiv(FLIKAR[0], null)).toBe(false)
  })
})
