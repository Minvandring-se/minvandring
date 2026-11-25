// Sökningen på andra namn mot de riktiga CSV:erna i supabase/katalog/mat. Ligger utanför src, eftersom testet läser
// filer från disken.
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { forstaAndraNamn, paseMatchar } from '../src/lib/mat'
import { godkandaPasar, importeraMatkatalog } from '../src/lib/matkatalogimport'

describe('sökningen bland påsarna i katalogen', () => {
  const pasar = fs
    .readdirSync(path.join(import.meta.dirname, '..', 'supabase', 'katalog', 'mat'))
    .filter((f) => f.endsWith('.csv'))
    .flatMap((f) => godkandaPasar(importeraMatkatalog(fs.readFileSync(path.join(import.meta.dirname, '..', 'supabase', 'katalog', 'mat', f), 'utf8'))))
  const hitta = (sok: string) => pasar.filter((p) => paseMatchar(p, sok)).map((p) => `${p.marke} ${p.namn}`)

  it('hittar en påse på ett annat namn, utan hänsyn till stora och små bokstäver', () => {
    expect(hitta('viltgryta')).toContain('Real Turmat Reindeer Stew')
    expect(hitta('crunchy granola')).toContain('Blå Band Krispig granola med mjölk och kokos')
  })

  it('visar det första andra namnet under namnet', () => {
    const ren = pasar.find((p) => p.namn === 'Reindeer Stew')!
    expect(forstaAndraNamn(ren)).toBe('Viltgryta')
  })

  it('ger inga andra namn till påsarna där källorna pekar på fel påse', () => {
    for (const namn of ['Apple & Cinnamon Porridge', 'Karibisches Kartoffel-Curry mit Huhn (1 portion)', 'Erbseneintopf mit Schinken (2 portioner)'])
      expect(pasar.find((p) => p.namn === namn)?.andra_namn, namn).toEqual([])
  })
})
