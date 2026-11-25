import { describe, expect, it } from 'vitest'
import { avdelningFor } from './handla'

// Att nycklarna stämmer med databasen testas i supabase/rls.test.ts.

describe('avdelningFor', () => {
  it('använder den valda avdelningen', () => {
    expect(avdelningFor('Mjölk', 'fryst')).toBe('fryst')
  })

  it('gissar utifrån namnet', () => {
    expect(avdelningFor('Mjölk', null)).toBe('mejeri')
    expect(avdelningFor('Kokosmjölk', null)).toBe('kryddor_konserver')
    expect(avdelningFor('Vetemjöl', null)).toBe('torrvaror')
    expect(avdelningFor('Knäckebröd', null)).toBe('brod')
    expect(avdelningFor('Laxfilé', null)).toBe('kott_fisk')
    expect(avdelningFor('Potatismos pulver', null)).toBe('torrvaror')
    expect(avdelningFor('Potatis', null)).toBe('frukt_gront')
    expect(avdelningFor('Havregryn', null)).toBe('torrvaror')
    expect(avdelningFor('Mörk choklad', null)).toBe('snacks')
    expect(avdelningFor('Snabbkaffe', null)).toBe('dryck')
  })

  it('väljer det längsta ord som passar, och korta ord bara som hela ord', () => {
    // Listan ur felsökningen av matdelen, där gissningen blev fel förut.
    const vantat: Record<string, string> = {
      Kanelbulle: 'brod',
      Pepparkakor: 'snacks',
      'Saltade jordnötter': 'snacks',
      'Salta pinnar': 'snacks',
      Sojamjölk: 'mejeri',
      Vetemjöl: 'torrvaror',
      Frukostflingor: 'torrvaror',
      Rostbiff: 'kott_fisk',
      Torskfilé: 'kott_fisk',
      Äggnudlar: 'torrvaror',
      Ostbågar: 'snacks',
      Baguette: 'brod',
      Latte: 'dryck',
      Vattenmelon: 'frukt_gront',
      Krisprolls: 'brod',
      Morötter: 'frukt_gront',
      Buljongdryck: 'dryck',
      Olivolja: 'kryddor_konserver',
      Havredryck: 'dryck',
      Mjukost: 'mejeri',
      Leverpastej: 'kott_fisk',
      Honungsmelon: 'frukt_gront',
      'Rostad lök': 'kryddor_konserver',
      Pulverkaffe: 'dryck',
      Te: 'dryck',
      Ost: 'mejeri',
      Ris: 'torrvaror',
      Salt: 'kryddor_konserver',
      Laxfilé: 'kott_fisk',
    }
    expect(Object.fromEntries(Object.keys(vantat).map((n) => [n, avdelningFor(n, null)]))).toEqual(vantat)
  })

  it('lägger det som inte går att gissa i Övrigt, och struntar i en okänd vald avdelning', () => {
    expect(avdelningFor('Tändstickor', null)).toBe('ovrigt')
    expect(avdelningFor('Tändstickor', 'okand')).toBe('ovrigt')
  })
})

