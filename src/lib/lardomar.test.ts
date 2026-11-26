import { describe, expect, it } from 'vitest'
import { AMNEN, amnesEtikett, arAmne, delaUpp, franText, perAmne, tolkaLardom, type Lardom } from './lardomar'

const lardom = (id: string, amne: Lardom['amne'], skapad: string, tur_id: string | null = null): Lardom => ({
  id,
  tur_id,
  tur_namn: tur_id ? 'Kungsleden 2026' : null,
  amne,
  text: id,
  skapad,
})

describe('lärdomar', () => {
  it('känner igen ämnena och ger etiketter', () => {
    expect(AMNEN.map((a) => a.nyckel)).toEqual(['packning', 'mat', 'sova', 'klader', 'leden', 'ovrigt'])
    expect(arAmne('mat')).toBe(true)
    expect(arAmne('hund')).toBe(false)
    expect(amnesEtikett('mat')).toBe('Mat och kök')
    expect(amnesEtikett('okant')).toBe('Övrigt')
  })

  it('tar bort mellanslag och stoppar tomma och för långa lärdomar', () => {
    expect(tolkaLardom('  Extra gaspatron  ')).toEqual({ text: 'Extra gaspatron' })
    expect(tolkaLardom('   ')).toEqual({ fel: 'Skriv vad du vill komma ihåg.' })
    expect(tolkaLardom('x'.repeat(301))).toEqual({ fel: 'Lärdomen får vara högst 300 tecken. Korta ner den.' })
    expect(tolkaLardom('x'.repeat(300))).toEqual({ text: 'x'.repeat(300) })
  })

  it('grupperar efter ämne i ämnenas ordning, nyast först, och hoppar över tomma ämnen', () => {
    const grupper = perAmne([lardom('a', 'sova', '2026-01-01'), lardom('b', 'packning', '2026-01-01'), lardom('c', 'sova', '2026-02-01')])
    expect(grupper.map((g) => g.amne)).toEqual(['packning', 'sova'])
    expect(grupper[1].lardomar.map((l) => l.id)).toEqual(['c', 'a'])
    expect(grupper[1].etikett).toBe('Sova')
  })

  it('delar upp i den här turen och tidigare turer', () => {
    const { harifran, tidigare } = delaUpp([lardom('a', 'mat', '1', 't1'), lardom('b', 'mat', '1', 't2'), lardom('c', 'mat', '1')], 't1')
    expect(harifran.map((l) => l.id)).toEqual(['a'])
    expect(tidigare.map((l) => l.id)).toEqual(['b', 'c'])
  })

  it('visar varifrån en lärdom kom', () => {
    expect(franText({ tur_namn: 'Kungsleden 2026' })).toBe('Från Kungsleden 2026')
    expect(franText({ tur_namn: null })).toBeNull()
  })
})
