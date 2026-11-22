import { describe, expect, it } from 'vitest'
import { granskning } from './granskning'

describe('granskning', () => {
  it('stickprovskontrollerad är den högsta nivån, också när granskad finns', () => {
    const g = granskning({ kontrollerad: '2026-12-01', granskad: '2026-11-25', kalla_typ: 'tillverkare' })
    expect(g.niva).toBe('stickprov')
    expect(g.marke).toBe('Stickprovskontrollerad')
    expect(g.forklaring).toBe('Uppgifterna ingår i en genomgång som MinVandring har stickprovskontrollerat mot tillverkarnas sidor 1 december 2026.')
  })

  it('granskad mot tillverkaren när bara granskad är satt', () => {
    const g = granskning({ kontrollerad: null, granskad: '2026-11-25', kalla_typ: 'tillverkare' })
    expect(g).toEqual({ niva: 'granskad', marke: 'Granskad mot tillverkaren', forklaring: 'Vikten är jämförd med tillverkarens uppgifter 25 november 2026.' })
  })

  it('utan nivå och från tillverkaren: inget märke, och en text för detaljen', () => {
    expect(granskning({ kontrollerad: null, granskad: null, kalla_typ: 'tillverkare' })).toEqual({
      niva: 'ingen',
      marke: null,
      forklaring: 'Uppgifterna kommer från tillverkaren men är inte jämförda än.',
    })
  })

  it('butiksrader får aldrig någon nivå', () => {
    const g = granskning({ kontrollerad: null, granskad: null, kalla_typ: 'butik' })
    expect(g).toEqual({ niva: 'ingen', marke: null, forklaring: 'Vikten kommer från butikens sida, eftersom tillverkaren saknar vikt.' })
    expect(granskning({ kontrollerad: '2026-12-01', granskad: '2026-11-25', kalla_typ: 'butik' }).niva).toBe('ingen')
  })
})
