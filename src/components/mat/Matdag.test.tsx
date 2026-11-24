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
      summa={{ dag: dag1, naring: portion(0, 0), saknas: [] }}
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
    expect(html.match(/>Test Pasta med vete</g)?.length).toBe(1)
    expect(html).toContain('6 st')
    expect(html).toContain('aria-label="Ta bort en portion Test Pasta med vete från lunch dag 1"')
  })

  it('visar ingredienserna i en egen rätt, och fäller ihop dem när de är många', () => {
    const html = rita([rad('m1', 'gryta')])
    expect(html).toContain('Ingredienser: Älgfärs, Potatis, Grädde och 2 till')
    expect(html).toContain('Älgfärs, Potatis, Grädde, Morot, Lök')
  })

  it('ber en att kontrollera mängderna när portionen verkar orimlig', () => {
    expect(rita([rad('m1', 'jatte')])).toContain('Kontrollera mängderna')
    expect(rita([rad('m1', 'gryta')])).not.toContain('Kontrollera mängderna')
  })
})
