import { describe, expect, it } from 'vitest'
import { anteckningsdatum, kanAndraAnteckning, skribent, kanTaBortAnteckning, sorteraAnteckningar, tolkaAnteckning, type Anteckning } from './anteckningar'

const anteckning = (id: string, user_id: string, privat: boolean, skapad = '2026-11-26T08:00:00Z'): Anteckning => ({
  id,
  tur_id: 't',
  user_id,
  text: id,
  privat,
  skapad,
  andrad: skapad,
})

describe('anteckningar', () => {
  it('tar bort mellanslag och stoppar tomma och för långa anteckningar', () => {
    expect(tolkaAnteckning('  Vadet var djupt  ')).toEqual({ text: 'Vadet var djupt' })
    expect(tolkaAnteckning('\n ')).toEqual({ fel: 'Skriv något i anteckningen.' })
    expect(tolkaAnteckning('x'.repeat(2001))).toEqual({ fel: 'Anteckningen får vara högst 2\u00a0000 tecken. Korta ner den.' })
  })

  it('visar nyast först', () => {
    const lista = sorteraAnteckningar([anteckning('a', 'u', false, '2026-01-01T00:00:00Z'), anteckning('b', 'u', false, '2026-02-01T00:00:00Z')])
    expect(lista.map((a) => a.id)).toEqual(['b', 'a'])
  })

  it('man ändrar bara sina egna', () => {
    expect(kanAndraAnteckning(anteckning('a', 'jag', false), 'jag')).toBe(true)
    expect(kanAndraAnteckning(anteckning('a', 'du', false), 'jag')).toBe(false)
  })

  it('man tar bort sina egna, och ägaren tar bort andras delade men inte privata', () => {
    expect(kanTaBortAnteckning(anteckning('a', 'jag', true), 'jag', 'viewer')).toBe(true)
    expect(kanTaBortAnteckning(anteckning('a', 'du', false), 'jag', 'owner')).toBe(true)
    expect(kanTaBortAnteckning(anteckning('a', 'du', true), 'jag', 'owner')).toBe(false)
    expect(kanTaBortAnteckning(anteckning('a', 'du', false), 'jag', 'editor')).toBe(false)
  })

  it('visar datumet och om anteckningen har ändrats', () => {
    expect(anteckningsdatum({ skapad: '2026-11-26T08:00:00Z', andrad: '2026-11-26T08:00:30Z' })).toBe('26 nov 2026')
    expect(anteckningsdatum({ skapad: '2026-11-26T08:00:00Z', andrad: '2026-11-27T08:00:00Z' })).toBe('26 nov 2026, ändrad')
  })

  it('visar vem som skrev anteckningen', () => {
    const deltagare = [{ user_id: 'anna', namn: 'Anna' }, { user_id: null, namn: 'Hunden' }]
    expect(skribent({ user_id: 'jag' }, deltagare, 'jag')).toBe('Du')
    expect(skribent({ user_id: 'anna' }, deltagare, 'jag')).toBe('Anna')
    expect(skribent({ user_id: 'borta' }, deltagare, 'jag')).toBe('En tidigare deltagare')
  })
})
