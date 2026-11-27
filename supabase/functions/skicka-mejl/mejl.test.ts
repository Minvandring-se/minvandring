import { describe, expect, it } from 'vitest'
import { appadress, byggMejl, html, mejlbar } from './mejl'

const KOD = 'a'.repeat(48)

describe('mejlen om notiser', () => {
  it('har notisens text, en knapp till turen, varför man får mejlet och länken för att avregistrera sig', () => {
    const m = byggMejl({ typ: 'tillagd_i_tur', text: 'Oscar lade till dig i Sarek 2027', lank: '/tur/123', kod: KOD })
    expect(m.amne).toBe('Oscar lade till dig i Sarek 2027')
    expect(m.avregistrera).toBe(`https://www.minvandring.se/avregistrera/${KOD}`)
    for (const del of ['Oscar lade till dig i Sarek 2027', 'Öppna turen: https://www.minvandring.se/tur/123', 'eftersom en vän lade till dig', 'https://www.minvandring.se/installningar', `Avregistrera dig: https://www.minvandring.se/avregistrera/${KOD}`])
      expect(m.text).toContain(del)
    expect(m.html).toContain(`href="https://www.minvandring.se/avregistrera/${KOD}"`)
    expect(m.html).toContain('href="https://www.minvandring.se/tur/123"')
  })

  it('ger vänförfrågan ett eget ämne och leder till Vänner', () => {
    const m = byggMejl({ typ: 'vanforfragan', text: 'Anna vill bli din vän', lank: null, kod: KOD })
    expect(m.amne).toBe('Ny vänförfrågan i MinVandring')
    expect(m.text).toContain('Svara på förfrågan: https://www.minvandring.se/vanner')
  })

  it('gör namn till ren text och leder aldrig bort från MinVandring', () => {
    const m = byggMejl({ typ: 'tillagd_i_tur', text: '<a href="https://ond.example">Klicka</a> lade till dig', lank: '//ond.example/x', kod: KOD })
    expect(m.html).not.toContain('<a href="https://ond.example">')
    expect(m.html).toContain('&lt;a href=&quot;https://ond.example&quot;&gt;')
    expect(m.text).toContain('Öppna turen: https://www.minvandring.se/turer')
    expect(appadress('https://ond.example', '/turer')).toBe('https://www.minvandring.se/turer')
    expect(appadress('/tur/1"><script>', '/turer')).toBe('https://www.minvandring.se/turer')
    expect(appadress('/tur/1', '/turer')).toBe('https://www.minvandring.se/tur/1')
    expect(html(`<>&"'`)).toBe('&lt;&gt;&amp;&quot;&#39;')
  })

  it('mejlar bara sorterna som har en text, och stoppar andra', () => {
    expect(mejlbar('tillagd_i_tur')).toBe(true)
    expect(mejlbar('vanforfragan')).toBe(true)
    expect(mejlbar('gick_med')).toBe(false)
    expect(() => byggMejl({ typ: 'gick_med', text: 'x', lank: null, kod: KOD })).toThrow()
  })
})
