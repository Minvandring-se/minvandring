import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Framsteg } from '@/components/ui/framsteg'
import { KommerSnart, KommerSnartEtikett } from '@/components/ui/kommerSnart'
import { Matare } from '@/components/ui/matare'
import { Nyckeltal } from '@/components/ui/nyckeltal'
import { Sektion } from '@/components/ui/sektion'
import { Turbild } from '@/components/ui/turbild'

// Byggstenarna ritas som HTML utan webbläsare, så att struktur och tillgänglighet går att kontrollera.

describe('Sektion', () => {
  it('kopplar rubriken till sektionen och visar etiketten för det som inte är byggt', () => {
    const html = renderToStaticMarkup(<Sektion rubrik="Dagsetapper" kommerSnart>innehåll</Sektion>)
    const id = /aria-labelledby="([^"]+)"/.exec(html)?.[1]
    expect(id).toBeTruthy()
    expect(html).toContain(`<h2 id="${id}"`)
    expect(html).toContain('Kommer snart')
  })

  it('visar ingen etikett för en riktig sektion och kan ha rubrik på nivå 3', () => {
    const html = renderToStaticMarkup(<Sektion rubrik="Deltagare" rubrikniva={3} />)
    expect(html).not.toContain('Kommer snart')
    expect(html).toContain('<h3')
  })
})

describe('KommerSnart', () => {
  it('låter skärmläsare få meningen och gör exempelinnehållet otillgängligt för tryck och tangentbord', () => {
    const html = renderToStaticMarkup(
      <KommerSnart text="Här kommer dagsetapperna.">
        <button type="button">Alla etapper</button>
      </KommerSnart>,
    )
    expect(html).toContain('class="sr-only">Här kommer dagsetapperna.</p>')
    expect(html).toMatch(/<div inert="" aria-hidden="true"[^>]*><button/)
  })

  it('visar meningen när det inte finns något exempelinnehåll', () => {
    const html = renderToStaticMarkup(<KommerSnart text="Här kommer omröstningen." />)
    expect(html).not.toContain('sr-only')
    expect(html).not.toContain('inert')
  })

  it('har etiketten i text, inte bara som färg', () => {
    expect(renderToStaticMarkup(<KommerSnartEtikett />)).toContain('>Kommer snart</span>')
  })
})

describe('Nyckeltal', () => {
  it('ger en dl med etikett och värde för varje tal', () => {
    const html = renderToStaticMarkup(
      <Nyckeltal
        varden={[
          { etikett: 'Datum', varde: '4–6 dec' },
          { etikett: 'Dagar', varde: 3 },
        ]}
      />,
    )
    expect(html.startsWith('<dl')).toBe(true)
    expect(html).toContain('repeat(2, minmax(0, 1fr))')
    expect(html.match(/<dt/g)).toHaveLength(2)
    expect(html).toContain('>Dagar</dt><dd')
  })

  it('ritar inget utan värden', () => {
    expect(renderToStaticMarkup(<Nyckeltal varden={[]} />)).toBe('')
  })
})

describe('Framsteg och Matare', () => {
  it('Framsteg säger värdet i procent till skärmläsare och håller sig mellan 0 och 100', () => {
    expect(renderToStaticMarkup(<Framsteg varde={0.68} etikett="Packning" />)).toContain('aria-valuenow="68"')
    expect(renderToStaticMarkup(<Framsteg varde={3} etikett="Packning" />)).toContain('width:100%')
  })

  it('Matare har en etikett med procenten', () => {
    expect(renderToStaticMarkup(<Matare varde={0.64} etikett="Redo för avfärd" />)).toContain('aria-label="Redo för avfärd: 64 %"')
  })
})

describe('Turbild', () => {
  it('är dold för skärmläsare och ritas likadant för samma tur', () => {
    const a = renderToStaticMarkup(<Turbild turId="abc" />)
    expect(a).toContain('aria-hidden="true"')
    expect(a).toBe(renderToStaticMarkup(<Turbild turId="abc" />))
    expect(a).not.toBe(renderToStaticMarkup(<Turbild turId="xyz" />))
  })

  it('använder bara färgvariablerna', () => {
    expect(renderToStaticMarkup(<Turbild turId="abc" />)).not.toMatch(/#[0-9a-f]{3,6}/i)
  })
})
