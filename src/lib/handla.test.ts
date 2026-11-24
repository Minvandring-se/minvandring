import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { AVDELNINGAR, avdelningFor, ENHETER } from './handla'

describe('avdelningFor', () => {
  it('använder den valda avdelningen', () => {
    expect(avdelningFor('Mjölk', 'fryst')).toBe('fryst')
  })

  it('gissar utifrån namnet', () => {
    expect(avdelningFor('Mjölk', null)).toBe('mejeri')
    expect(avdelningFor('Kokosmjölk', null)).toBe('skafferi')
    expect(avdelningFor('Vetemjöl', null)).toBe('skafferi')
    expect(avdelningFor('Knäckebröd', null)).toBe('brod')
    expect(avdelningFor('Laxfilé', null)).toBe('kott_fisk')
    expect(avdelningFor('Potatismos pulver', null)).toBe('torrvaror')
    expect(avdelningFor('Potatis', null)).toBe('frukt_gront')
    expect(avdelningFor('Havregryn', null)).toBe('torrvaror')
    expect(avdelningFor('Mörk choklad', null)).toBe('snacks')
    expect(avdelningFor('Snabbkaffe', null)).toBe('dryck')
  })

  it('lägger det som inte går att gissa i Övrigt, och struntar i en okänd vald avdelning', () => {
    expect(avdelningFor('Tändstickor', null)).toBe('ovrigt')
    expect(avdelningFor('Tändstickor', 'okand')).toBe('ovrigt')
  })
})

describe('nycklarna i databasen', () => {
  const sql = fs.readFileSync(path.join(import.meta.dirname, '..', '..', 'supabase', 'migrations', '20261124230000_handlingslista.sql'), 'utf8')
  const lista = (efter: string) => [...(sql.slice(sql.indexOf(efter)).match(/in \(([^)]*)\)/)?.[1].matchAll(/'([a-z_]+)'/g) ?? [])].map((m) => m[1])

  it('har samma enheter som src/lib/handla.ts', () => {
    expect(lista('add column enhet')).toEqual([...ENHETER])
  })

  it('har samma avdelningar som src/lib/handla.ts', () => {
    expect(lista('add column avdelning')).toEqual(AVDELNINGAR.map((a) => a.nyckel))
  })
})
