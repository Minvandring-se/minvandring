// Kontrollerar att CSV-filerna i supabase/katalog går att importera och att den senaste seed-migreringen
// är skapad från dem. Ändras en CSV utan att en ny migrering skapas med "npm run katalog" faller testet.
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { godkanda, importera, seedSql } from '../src/lib/katalogimport'

const mapp = path.join(import.meta.dirname, 'katalog')
const filer = fs.readdirSync(mapp).filter((f) => f.endsWith('.csv')).sort()
const resultat = filer.map((f) => importera(fs.readFileSync(path.join(mapp, f), 'utf8')))

describe('katalogen i supabase/katalog', () => {
  it('har inga fel i filerna', () => {
    for (const r of resultat) {
      expect(r.filfel).toEqual([])
      expect(r.rader.filter((x) => x.fel.length).map((x) => `rad ${x.rad}: ${x.fel.join(', ')}`)).toEqual([])
    }
  })

  it('stämmer med den senaste seed-migreringen, så att CSV:n och databasen inte glider isär', () => {
    const migreringar = path.join(import.meta.dirname, 'migrations')
    const senaste = fs.readdirSync(migreringar).filter((f) => /_katalog_.*\.sql$/.test(f)).sort().at(-1)!
    const sql = fs.readFileSync(path.join(migreringar, senaste), 'utf8').replaceAll('\r\n', '\n')
    expect(sql).toBe(seedSql(resultat.flatMap(godkanda), filer.map((f) => `supabase/katalog/${f}`)))
  })
})
