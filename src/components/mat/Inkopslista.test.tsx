import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { Inkopslista } from '@/components/mat/Inkopslista'
import type { Handlarad } from '@/lib/handlingslista'

// Listan ritas som HTML utan webbläsare, så att det som visas går att kontrollera.

const rad = (namn: string, kopare: string | null, klart = false): Handlarad => ({
  nyckel: `${kopare}:${namn}`,
  typ: 'vara',
  id: namn,
  namn,
  kopare,
  avdelning: 'mejeri',
  avdelningVald: false,
  mangd: '6 dl',
  gram: 600,
  hemifran: false,
  klart,
  andradFran: null,
})

const personer = [
  { id: 'oscar', namn: 'Oscar' },
  { id: 'lisa', namn: 'Lisa' },
]

function rita(kanAndra: boolean) {
  return renderToStaticMarkup(
    <MemoryRouter>
      <Inkopslista
        rader={[rad('Mjölk', 'oscar'), rad('Grädde', 'lisa', true), rad('Ost', null)]}
        personer={personer}
        farger={new Map()}
        kanAndra={kanAndra}
        mittDeltagareId="oscar"
        skafferi={[]}
        utskrift="/tur/t/mat/inkopslista"
        onBocka={async () => true}
        onAvdelning={async () => true}
      />
    </MemoryRouter>,
  )
}

describe('Inkopslista', () => {
  it('grupperar per person och avdelning, med det som ingen köper sist och utan bock', () => {
    const html = rita(true)
    expect(html.indexOf('Oscar (du)')).toBeLessThan(html.indexOf('Lisa'))
    expect(html.indexOf('Lisa')).toBeLessThan(html.indexOf('Ingen köper än'))
    expect(html).toContain('Mejeri och ägg')
    expect(html).toContain('1 av 2 klara')
    // Ägaren bockar åt Oscar och Lisa, men det som ingen köper har ingen ruta.
    expect(html.match(/type="checkbox"/g)?.length).toBe(1 + 2)
  })

  it('låter en läsare bocka av bara sitt eget', () => {
    const html = rita(false)
    // Bara Oscars rad har en ruta, och läsaren har ingen ruta för att ändra avdelningar.
    expect(html.match(/type="checkbox"/g)?.length).toBe(1)
    expect(html).not.toContain('Ändra butiksavdelning')
  })
})

describe('Inkopslista, ändrad mängd', () => {
  it('visar att mängden har ändrats sedan raden bockades av, och raden som oavbockad', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <Inkopslista
          rader={[{ ...rad('Havregryn', 'oscar'), mangd: '3 dl', andradFran: '1 dl' }]}
          personer={personer}
          farger={new Map()}
          kanAndra
          mittDeltagareId="oscar"
          skafferi={[]}
          utskrift="/tur/t/mat/inkopslista"
          onBocka={async () => true}
          onAvdelning={async () => true}
        />
      </MemoryRouter>,
    )
    expect(html).toContain('Mängden har ändrats sedan du bockade av (var 1 dl)')
    expect(html).not.toContain('checked')
  })
})
