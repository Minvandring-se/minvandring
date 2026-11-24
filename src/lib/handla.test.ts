import { describe, expect, it } from 'vitest'
import { avdelningFor } from './handla'

// Att nycklarna stämmer med databasen testas i supabase/rls.test.ts.

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

