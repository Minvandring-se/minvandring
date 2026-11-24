// Filnamnen i supabase/migrations. Supabase håller isär migreringarna på datumet först i namnet, så två filer med
// samma datum gör att den ena aldrig går att köra. Ligger utanför src eftersom testet läser en mapp från disken.
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const filer = fs.readdirSync(path.join(import.meta.dirname, '..', 'supabase', 'migrations')).filter((f) => f.endsWith('.sql'))

describe('migreringarna', () => {
  it('börjar med ett datum på 14 siffror och ett namn', () => {
    const fel = filer.filter((f) => !/^\d{14}_[a-z0-9_]+\.sql$/.test(f))
    expect(fel).toEqual([])
  })

  it('har inga två filer med samma datum', () => {
    const perDatum = new Map<string, string[]>()
    for (const f of filer) perDatum.set(f.slice(0, 14), [...(perDatum.get(f.slice(0, 14)) ?? []), f])
    const dubbletter = [...perDatum.values()].filter((lista) => lista.length > 1)
    expect(dubbletter).toEqual([])
  })
})
