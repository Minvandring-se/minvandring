import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

// Formuläret ritas som HTML utan webbläsare och utan databas, så att det som visas går att kontrollera.

const vanner = vi.hoisted(() => ({ lista: [] as import('@/lib/vanner').Van[] }))
vi.mock('@/hooks/useVanner', () => ({ useMinaVanner: () => vanner.lista, laggTillVannerITur: async () => null }))
vi.mock('@/hooks/useProfilbilder', () => ({ useProfilbilder: () => ({}) }))

const { NyTurInnehall } = await import('./NyTurRuta')

const rita = () =>
  renderToStaticMarkup(
    <MemoryRouter>
      <NyTurInnehall anvandarId="u1" onStang={() => {}} />
    </MemoryRouter>,
  )

describe('Ny tur', () => {
  it('visar namnet, datum från och till och Skapa tur', () => {
    const html = rita()
    for (const t of ['Ny tur', 'Vad heter turen?', 'Från', 'Till', 'type="date"', 'Skapa tur', 'aria-label="Stäng"']) expect(html).toContain(t)
    expect(html).not.toContain('Vänner som ska med')
  })

  it('visar vännerna att välja när man har vänner', () => {
    vanner.lista = [{ user_id: 'v1', namn: 'Astra', bild_uppdaterad: null, turer_ihop: 1, senaste_tur: null }]
    const html = rita()
    expect(html).toContain('Vänner som ska med')
    expect(html).toContain('Astra')
    expect(html).toContain('läggs till som redigerare')
  })
})
