import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Matdag, type Ratter } from '@/components/mat/Matdag'
import type { Behov } from '@/lib/kost'
import { matdagar, type Naring } from '@/lib/mat'
import type { Maltidsrad, Matprodukt, Ratt } from '@/lib/typer'

// Måltidsrutan ritas som HTML utan webbläsare, så att det som visas går att kontrollera.

const [dag1] = matdagar(1, 0)
const ratt = (id: string, namn: string, matprodukt_id: string | null = null): Ratt => ({ id, namn, matprodukt_id, ansvarig: null, klart: false })
const rad = (id: string, ratt_id: string): Maltidsrad => ({ id, dag: 1, maltid: 'lunch', ratt_id, sortering: 0 })
const portion = (kcal: number, gram: number): Naring => ({ kcal, proteinG: 10, gram, ofullstandig: false })
const pase = { id: 'p1', marke: 'Test', namn: 'Pasta med vete', glutenfri: false, vegetarisk: true, vegansk: false, laktosfri: true, allergener: ['gluten'], spar: [] } as unknown as Matprodukt

const ratter: Ratter = {
  ratter: new Map([
    ['pase', ratt('pase', 'Test Pasta med vete', 'p1')],
    ['gryta', ratt('gryta', 'Gryta')],
    ['jatte', ratt('jatte', 'Jättegryta')],
  ]),
  perPortion: new Map([
    ['pase', portion(600, 150)],
    ['gryta', portion(500, 200)],
    ['jatte', portion(4296, 1365)],
  ]),
  pasar: new Map([['p1', pase]]),
  ingredienser: new Map([
    ['gryta', ['Älgfärs', 'Potatis', 'Grädde', 'Morot', 'Lök']],
    ['jatte', ['Gurka']],
  ]),
}

const oscar: Behov = { namn: 'Oscar', vegetarisk: false, vegansk: false, glutenfri: true, laktosfri: false, utan: ['gluten'] }

function rita(maltider: Maltidsrad[]) {
  return renderToStaticMarkup(
    <Matdag
      summa={{ dag: dag1, perPerson: new Map(), naring: portion(0, 0), saknas: [] }}
      datum={null}
      maltider={maltider}
      ratter={ratter}
      behov={[oscar]}
      kanAndra
      onLaggTill={() => {}}
      onTaBort={() => {}}
    />,
  )
}

describe('Matdag', () => {
  it('varnar när en påse inte passar någons kostbehov', () => {
    const html = rita([rad('m1', 'pase')])
    expect(html).toContain('Inte glutenfri, passar inte Oscar')
    expect(html).not.toContain('Innehåller gluten')
  })

  it('visar samma rätt flera gånger i en måltid som en rad med antal', () => {
    const html = rita(['a', 'b', 'c', 'd', 'e', 'f'].map((id) => rad(id, 'pase')))
    // Märket står ovanför namnet, och namnet visas en gång.
    expect(html.match(/>Pasta med vete</g)?.length).toBe(1)
    expect(html.indexOf('>Test<')).toBeLessThan(html.indexOf('>Pasta med vete<'))
    expect(html).toContain('6 st')
    expect(html).toContain('aria-label="Ta bort en av 6 Test Pasta med vete från lunch dag 1"')
  })

  it('visar ingredienserna i en egen rätt, och fäller ihop dem när de är många', () => {
    const html = rita([rad('m1', 'gryta')])
    expect(html).toContain('Ingredienser: Älgfärs, Potatis, Grädde och 2 till')
    expect(html).toContain('Älgfärs, Potatis, Grädde, Morot, Lök')
  })

  it('visar vem som bär en rätt och vilka som äter den när det inte är alla', () => {
    const folk = {
      personer: [{ id: 'o', namn: 'Oscar' }, { id: 'l', namn: 'Lisa' }],
      farger: new Map([['o', 'var(--color-person-a)'], ['l', 'var(--color-person-b)']]),
      atare: [{ maltid_id: 'm2', deltagare_id: 'l' }],
    }
    const html = renderToStaticMarkup(
      <Matdag
        summa={{ dag: dag1, perPerson: new Map(), naring: portion(0, 0), saknas: [] }}
        datum={null}
        maltider={[{ ...rad('m1', 'gryta'), bars_av: 'o' }, { ...rad('m2', 'gryta'), bars_av: 'o' }]}
        ratter={ratter}
        folk={folk}
        behov={[]}
        kanAndra
        onLaggTill={() => {}}
        onTaBort={() => {}}
        onVem={() => {}}
      />,
    )
    // Olika ätare blir två rader. Den ena äts bara av Lisa.
    expect(html.match(/Oscar bär, äts av Lisa. Ändra vem som bär och äter Gryta/g)?.length).toBe(1)
    expect(html).toContain('Äts av Lisa')
    expect(html).toContain('Oscar bär')
  })

  it('ber en att kontrollera mängderna när portionen verkar orimlig', () => {
    expect(rita([rad('m1', 'jatte')])).toContain('Kontrollera mängderna')
    expect(rita([rad('m1', 'gryta')])).not.toContain('Kontrollera mängderna')
  })

  it('visar ett spann per person i dagens rubrik när personerna äter olika mycket', () => {
    const html = renderToStaticMarkup(
      <Matdag
        summa={{ dag: dag1, perPerson: new Map([['o', portion(600, 150)], ['l', portion(700, 160)]]), naring: portion(650, 155), saknas: [] }}
        datum={null}
        maltider={[]}
        ratter={ratter}
        behov={[]}
        kanAndra
        onLaggTill={() => {}}
        onTaBort={() => {}}
      />,
    )
    expect(html.replace(/\s/g, ' ')).toContain('600–700 kcal och 150–160 g per person')
  })

  it('varnar för en egen rätt utifrån varorna ur varukatalogen, och okänt räknas inte som att den passar', () => {
    const medKost: Ratter = {
      ...ratter,
      kost: new Map([['gryta', [{ vegetarisk: true, vegansk: false, glutenfri: false, laktosfri: true, allergener: ['gluten'], spar: [] }, null]]]),
    }
    const html = renderToStaticMarkup(
      <Matdag summa={{ dag: dag1, perPerson: new Map(), naring: portion(0, 0), saknas: [] }} datum={null} maltider={[rad('m1', 'gryta')]} ratter={medKost} behov={[oscar]} kanAndra onLaggTill={() => {}} onTaBort={() => {}} />,
    )
    expect(html).toContain('Inte glutenfri, passar inte Oscar')
  })
})
