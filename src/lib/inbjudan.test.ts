import { describe, expect, it } from 'vitest'
import { nastaSteg, tolkaInbjudan } from './inbjudan'

const svar = { tur_id: 't1', namn: 'Sarek 2027', redan_med: false, personer: [{ id: 'd1', namn: 'Pichi' }] }

describe('tolkaInbjudan', () => {
  it('tolkar svaret från databasen', () => {
    expect(tolkaInbjudan(svar)).toEqual({ turId: 't1', turnamn: 'Sarek 2027', redanMed: false, personer: [{ id: 'd1', namn: 'Pichi' }] })
  })

  it('ger null när koden är fel eller svaret är trasigt', () => {
    expect(tolkaInbjudan(null)).toBeNull()
    expect(tolkaInbjudan('text')).toBeNull()
    expect(tolkaInbjudan({ namn: 'Utan id' })).toBeNull()
  })

  it('tål att personerna saknas eller är trasiga', () => {
    expect(tolkaInbjudan({ tur_id: 't1', namn: 'Tur' })?.personer).toEqual([])
    expect(tolkaInbjudan({ ...svar, personer: [null, { id: 'd2' }, { id: 'd3', namn: 'Eva' }] })?.personer).toEqual([{ id: 'd3', namn: 'Eva' }])
  })
})

describe('nastaSteg', () => {
  const inbjudan = tolkaInbjudan(svar)!

  it('frågar "Är du någon av de här?" när turen har personer utan konto', () => {
    expect(nastaSteg(inbjudan)).toBe('fraga')
  })

  it('går med direkt när det inte finns någon att vara', () => {
    expect(nastaSteg({ ...inbjudan, personer: [] })).toBe('ga-med')
  })

  it('öppnar turen utan frågor när man redan är med', () => {
    expect(nastaSteg({ ...inbjudan, redanMed: true })).toBe('oppna')
  })
})
