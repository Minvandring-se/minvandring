import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { HemVy, type Inspiration } from './HemVy'

// Hem ritas som HTML utan webbläsare och utan databas. Vyn för en ny användare utan turer går inte att se med ett
// riktigt konto som har turer, så den kontrolleras här.

const ingenInspiration: Inspiration = { lardom: null, recept: null, tips: null }

const rita = (props: Partial<Parameters<typeof HemVy>[0]> = {}) =>
  renderToStaticMarkup(
    <MemoryRouter>
      <HemVy namn="Oscar Edmelin" idag="2026-11-26" turer={[]} nasta={null} attgora={null} inspiration={ingenInspiration} vanlank={null} {...props} />
    </MemoryRouter>,
  )

describe('Hem', () => {
  it('hälsar med förnamn och datum, utan nedräkning när det inte finns någon kommande tur', () => {
    const html = rita()
    expect(html).toContain('Torsdag 26 november')
    expect(html).toContain('Hej Oscar!')
    expect(html).toContain('Planera ditt nästa äventyr.')
    expect(html).toContain('Ny tur')
    // Knappen i bandet leder till Vänner.
    expect(html).toContain('Lägg till vänner')
    expect(html).toContain('href="/vanner"')
    expect(html).not.toContain('#bjud-in')
    expect(html).not.toContain('till avfärd')
    expect(html).not.toContain('Nästa tur:')
  })

  it('visar guiden i tre steg i stället för Nästa tur och Att göra för en ny användare', () => {
    const html = rita()
    for (const t of ['Kom igång', 'Skapa en tur', 'Lägg till vänner', 'Till Vänner', 'Packa och planera maten', 'Till Mitt förråd']) expect(html).toContain(t)
    expect(html).not.toContain('Att göra')
  })

  it('döljer inspirationen när den saknar data, och visar bara delarna som finns', () => {
    expect(rita()).not.toContain('Inspiration')
    const html = rita({ inspiration: { lardom: null, recept: { id: 'aprikosgrot', namn: 'Aprikosgröt med valnötter' }, tips: { nyckel: 'energi', rubrik: 'Hur mycket energi behöver man?', etikett: 'Tips för hösten' } } })
    expect(html).toContain('Veckans recept')
    expect(html).toContain('href="/matplanering/recept/aprikosgrot"')
    expect(html).toContain('Tips för hösten')
    expect(html).not.toContain('Kom ihåg från förra turen')
  })

  it('har Lägg till vänner, Hitta din nästa vandring och genvägarna', () => {
    const html = rita()
    expect(html).toContain('Skicka din vänlänk')
    expect(html).not.toContain('Skicka mejl')
    expect(html).not.toContain('mailto:')
    // Utan vänlänk (medan den hämtas) visas bara länken till Vänner.
    expect(html).not.toContain('Kopiera min vänlänk')
    expect(rita({ vanlank: { kod: '0123456789abcdef0123456789abcdef', giltig_till: '2026-12-03T12:00:00Z' } })).toContain('Kopiera min vänlänk')
    expect(html).toContain('href="/hitta-vandring"')
    expect(html).toContain('Kommer snart')
    for (const g of ['/matplanering', '/forrad', '/utrustning', '/matplanering/skafferi']) expect(html).toContain(`href="${g}"`)
  })

  it('säger till när turerna inte går att hämta', () => {
    expect(rita({ turer: 'fel' })).toContain('Det gick inte att hämta dina turer')
  })
})
