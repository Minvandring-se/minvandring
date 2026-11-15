import { describe, expect, it } from 'vitest'
import { aktivTurdel, turdelAdress, TURDELAR } from './turdelar'

describe('turens delar', () => {
  it('har egna adresser', () => {
    expect(turdelAdress('abc', 'oversikt')).toBe('/tur/abc')
    expect(turdelAdress('abc', 'packa')).toBe('/tur/abc/packa')
    expect(turdelAdress('abc', 'mat')).toBe('/tur/abc/mat')
    expect(turdelAdress('abc', 'rutt')).toBe('/tur/abc/rutt')
  })

  it('känner igen delen från adressen', () => {
    for (const { del } of TURDELAR) expect(aktivTurdel(turdelAdress('abc', del))).toBe(del)
    expect(aktivTurdel('/tur/abc/packa/')).toBe('packa')
    expect(aktivTurdel('/tur/abc/okand')).toBe('oversikt')
    // Ett tur-id som råkar heta som en del är fortfarande en översikt.
    expect(aktivTurdel('/tur/packa')).toBe('oversikt')
  })

  it('visar bara översikten som byggd, resten kommer snart', () => {
    expect(TURDELAR.filter((d) => d.byggd).map((d) => d.del)).toEqual(['oversikt'])
  })
})
