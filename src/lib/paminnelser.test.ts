import { describe, expect, it } from 'vitest'
import { sorteraPaminnelser, tolkaPaminnelse, type Paminnelse } from './paminnelser'

describe('påminnelser', () => {
  it('kräver en text på högst 200 tecken och en dag från i dag', () => {
    expect(tolkaPaminnelse('  Boka tåget ', '2027-06-01', '2027-05-01')).toEqual({ ok: true, text: 'Boka tåget', datum: '2027-06-01' })
    expect(tolkaPaminnelse('Köp gas', '2027-05-01', '2027-05-01')).toMatchObject({ ok: true })
    expect(tolkaPaminnelse(' ', '2027-06-01', '2027-05-01')).toEqual({ ok: false, fel: 'Skriv vad du vill bli påmind om.' })
    expect(tolkaPaminnelse('a'.repeat(201), '2027-06-01', '2027-05-01')).toMatchObject({ ok: false })
    expect(tolkaPaminnelse('Köp gas', '', '2027-05-01')).toEqual({ ok: false, fel: 'Välj en dag.' })
    expect(tolkaPaminnelse('Köp gas', '2027-04-30', '2027-05-01')).toEqual({ ok: false, fel: 'Välj i dag eller en dag framåt.' })
  })

  it('sorterar de som inte är klara först, närmast datum först', () => {
    const p = (id: string, datum: string, klar = false): Paminnelse => ({ id, tur_id: null, text: id, datum, klar, skickad: null })
    expect(sorteraPaminnelser([p('c', '2027-01-01', true), p('b', '2027-03-01'), p('a', '2027-02-01')]).map((x) => x.id)).toEqual(['a', 'b', 'c'])
  })
})
