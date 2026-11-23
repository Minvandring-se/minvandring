import { describe, expect, it } from 'vitest'
import { aktivTurdel, delFranSokvag, turdel, turdelAdress, TURDELAR } from './turdelar'

describe('turens delar', () => {
  it('har flikarna i skissens ordning', () => {
    expect(TURDELAR.map((d) => d.namn)).toEqual(['Översikt', 'Etapper', 'Karta', 'Packning', 'Mat', 'Gruppen', 'Kostnader', 'Säkerhet', 'Anteckningar'])
  })

  it('har egna adresser utan å, ä och ö', () => {
    expect(turdelAdress('abc', 'oversikt')).toBe('/tur/abc')
    expect(turdelAdress('abc', 'packning')).toBe('/tur/abc/packning')
    expect(turdelAdress('abc', 'sakerhet')).toBe('/tur/abc/sakerhet')
    for (const { sokvag } of TURDELAR) expect(sokvag).toMatch(/^[a-z-]*$/)
  })

  it('känner igen delen från adressen', () => {
    for (const { del } of TURDELAR) expect(aktivTurdel(turdelAdress('abc', del))).toBe(del)
    expect(aktivTurdel('/tur/abc/mat/')).toBe('mat')
    expect(aktivTurdel('/tur/abc/okand')).toBe('oversikt')
    // Ett tur-id som råkar heta som en del är fortfarande en översikt.
    expect(aktivTurdel('/tur/mat')).toBe('oversikt')
  })

  it('markerar samma flik som sidan visar för gamla adresser', () => {
    expect(aktivTurdel('/tur/abc/packa')).toBe('packning')
    expect(aktivTurdel('/tur/abc/rutt')).toBe('etapper')
    for (const sokvag of ['packa', 'rutt', 'karta', 'okand']) expect(aktivTurdel(`/tur/abc/${sokvag}`)).toBe(delFranSokvag(sokvag))
  })

  it('visar bara översikten som byggd, och varje planerad del säger vad den blir', () => {
    expect(TURDELAR.filter((d) => d.byggd).map((d) => d.del)).toEqual(['oversikt'])
    for (const d of TURDELAR.filter((d) => !d.byggd)) expect(d.blir.length).toBeGreaterThan(20)
  })

  it('hittar delen från sökvägen, och leder gamla adresser till de nya flikarna', () => {
    expect(delFranSokvag('karta')).toBe('karta')
    expect(delFranSokvag('packa')).toBe('packning')
    expect(delFranSokvag('rutt')).toBe('etapper')
    expect(delFranSokvag('okand')).toBe('oversikt')
    expect(delFranSokvag(undefined)).toBe('oversikt')
    expect(turdel('mat').namn).toBe('Mat')
  })
})
