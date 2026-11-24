// Kontrollerar att CSV:n med baslivsmedlen går att importera och att den senaste seed-migreringen för livsmedlen är
// skapad från den. Ändras CSV:n utan att en ny migrering skapas med "npm run livsmedel -- --skriv" faller testet.
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { godkandaLivsmedel, importeraLivsmedel, livsmedelSeedSql } from '../src/lib/livsmedelimport'

const csv = path.join(import.meta.dirname, 'katalog', 'livsmedel', 'livsmedel.csv')
const resultat = importeraLivsmedel(fs.readFileSync(csv, 'utf8'))

describe('livsmedlen i supabase/katalog/livsmedel', () => {
  it('har inga fel i filen, och bara enstaka rader utelämnas', () => {
    expect(resultat.filfel).toEqual([])
    // En rad med fel kommer inte med, som i matkatalogen. I dag gäller det Matolja (nummer 3418), som har 902 kcal och
    // 102 g fett per 100 g hos Livsmedelsverket. Fler sådana rader ska synas här, till exempel om API:t ändras.
    expect(resultat.rader.filter((x) => x.fel.length).map((x) => x.livsmedel?.nummer ?? x.rad)).toHaveLength(1)
  })

  it('stämmer med den senaste seed-migreringen, så att CSV:n och databasen inte glider isär', () => {
    const migreringar = path.join(import.meta.dirname, 'migrations')
    const senaste = fs.readdirSync(migreringar).filter((f) => /_livsmedel_.*\.sql$/.test(f)).sort().at(-1)!
    const sql = fs.readFileSync(path.join(migreringar, senaste), 'utf8').replaceAll('\r\n', '\n')
    expect(sql).toBe(livsmedelSeedSql(godkandaLivsmedel(resultat), 'supabase/katalog/livsmedel/livsmedel.csv'))
  })
})
