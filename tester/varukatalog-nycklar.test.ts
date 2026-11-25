// Kategorinycklarna i varukatalogen står både i migreringen och i src/lib/varukatalogimport.ts. Ligger utanför src
// eftersom testet läser en fil från disken.
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { VARUKATEGORIER } from '../src/lib/varukatalogimport'

describe('varukatalogens kategorier', () => {
  it('är desamma i migreringen och i koden', () => {
    const sql = fs.readFileSync(path.join(import.meta.dirname, '..', 'supabase', 'migrations', '20261125100004_varukatalog.sql'), 'utf8')
    const lista = sql.match(/kategori text not null check \(kategori in \(([^)]*)\)\)/)?.[1] ?? ''
    const iSql = [...lista.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]).sort()
    expect(iSql).toEqual(VARUKATEGORIER.map((k) => k.nyckel).sort())
  })
})
