import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import type { Katalogrecept } from '@/lib/receptkatalog'

// Sidan ritas som HTML utan webbläsare och utan databas, så att det som visas går att kontrollera.

const grot: Katalogrecept = {
  id: 'aprikosgrot',
  namn: 'Aprikosgröt med valnötter',
  maltid: 'frukost',
  portioner: 1,
  kok_kravs: true,
  torkning_hemma: false,
  beskrivning: 'Krämig gröt som sväller under lock.',
  mangder: 'fran_kallan',
  inspirerat_av: 'Trail Recipes',
  inspirerat_av_url: 'https://trail.recipes/',
  status: 'otestat',
  ingredienser: [
    {
      ordning: 1,
      ingrediens: 'Snabbhavregryn',
      mangd: 6,
      enhet: 'msk',
      packas: 'hemma',
      kommentar: null,
      livsmedel_nummer: 702,
      varukatalog_id: null,
      livsmedel: { namn: 'Havregryn fullkorn', grupp: 'Ris eller annat spannmål', allergener: ['gluten'], kcal_per_100g: 370, protein_per_100g: 13 },
      varukatalog: null,
    },
    { ordning: 2, ingrediens: 'Ghee', mangd: 1, enhet: 'msk', packas: 'separat', kommentar: null, livsmedel_nummer: null, varukatalog_id: null, livsmedel: null, varukatalog: null },
    { ordning: 3, ingrediens: 'Vatten', mangd: 2.5, enhet: 'dl', packas: 'pa_plats', kommentar: null, livsmedel_nummer: null, varukatalog_id: null, livsmedel: null, varukatalog: null },
  ],
  steg: [
    { steg_nr: 2, var: 'turen', steg: 'Koka upp vattnet.', tid_min: '5–10' },
    { steg_nr: 1, var: 'hemma', steg: 'Blanda grynen i en påse.', tid_min: null },
  ],
}

vi.mock('@/hooks/useReceptkatalog', () => ({
  useReceptkatalog: () => [grot],
  useRedigerbaraTurer: () => [],
  hamtaTurlage: async () => null,
}))
vi.mock('@/hooks/useRecept', () => ({ useRecept: () => ({ recept: [], laddaOm: async () => {} }), sparaRecept: async () => null }))

const { Receptsida } = await import('./Receptsida')
const { MinvandringsRecept } = await import('@/components/mat/MinvandringsRecept')

const rita = (adress: string) =>
  renderToStaticMarkup(
    <MemoryRouter initialEntries={[adress]}>
      <Routes>
        <Route path="/matplanering/recept/:id" element={<Receptsida />} />
      </Routes>
    </MemoryRouter>,
  )

describe('MinVandrings recept', () => {
  it('visar korten med måltid, kök, okända allergener och att receptet inte är provlagat', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <MinvandringsRecept />
      </MemoryRouter>,
    )
    expect(html).toContain('href="/matplanering/recept/aprikosgrot"')
    for (const t of ['Frukost', 'Aprikosgröt med valnötter', 'Kök krävs', 'Allergener okända', 'Inte provlagat av oss än']) expect(html).toContain(t)
  })

  it('visar receptet med ingredienser, steg hemma och på turen, källan och knapparna', () => {
    const html = rita('/matplanering/recept/aprikosgrot')
    for (const t of [
      'Aprikosgröt med valnötter',
      'Frukost, 1 portion',
      '6 msk',
      'Snabbhavregryn',
      'Packas för sig',
      'På plats',
      'Innehåller gluten.',
      'Allergenerna är okända för en ingrediens',
      'Hemma',
      'På turen',
      'Koka upp vattnet.',
      '5–10 min',
      'Inspirerat av',
      'Trail Recipes',
      'Lägg i turen',
      'Spara som eget recept',
    ])
      expect(html).toContain(t)
    expect(html.indexOf('Blanda grynen')).toBeLessThan(html.indexOf('Koka upp vattnet'))
  })

  it('säger till när receptet inte finns', () => {
    expect(rita('/matplanering/recept/finns-inte')).toContain('Receptet finns inte')
  })
})
