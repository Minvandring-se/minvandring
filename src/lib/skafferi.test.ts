import { describe, expect, it } from 'vitest'
import { bastForeStatus, enManadEfter, formateraDatum, hemma, kopText, skafferietForst, sorteraSkafferi } from './skafferi'
import type { Skafferirad } from './typer'

const rad = (matprodukt_id: string, antal: number, bast_fore: string | null = null): Skafferirad => ({ id: `r-${matprodukt_id}`, matprodukt_id, antal, bast_fore })

describe('bäst före', () => {
  it('en månad efter, och sista dagen i en kortare månad', () => {
    expect(enManadEfter('2026-11-23')).toBe('2026-12-23')
    expect(enManadEfter('2026-12-15')).toBe('2027-01-15')
    expect(enManadEfter('2027-01-31')).toBe('2027-02-28')
    expect(enManadEfter('2028-01-31')).toBe('2028-02-29')
  })

  it('har passerat dagen efter datumet, och märks inom en månad', () => {
    const idag = '2026-11-23'
    expect(bastForeStatus(null, idag)).toBeNull()
    expect(bastForeStatus('2026-11-22', idag)).toBe('passerat')
    expect(bastForeStatus('2026-11-23', idag)).toBe('snart')
    expect(bastForeStatus('2026-12-23', idag)).toBe('snart')
    expect(bastForeStatus('2026-12-24', idag)).toBe('ok')
  })

  it('visar datumet på svenska', () => {
    expect(formateraDatum('2027-03-12')).toBe('12 mars 2027')
  })
})

describe('hemma', () => {
  it('räknar påsarna, utom de vars datum har passerat', () => {
    const idag = '2026-11-23'
    const karta = hemma([rad('a', 2), rad('b', 3, '2026-11-01'), rad('c', 1, '2026-12-01')], idag)
    expect([...karta]).toEqual([
      ['a', 2],
      ['c', 1],
    ])
  })
})

describe('texten i inköpslistan', () => {
  it('säger hur många som återstår att köpa', () => {
    expect(kopText(3, 0)).toBeNull()
    expect(kopText(3, 1)).toBe('Köp 2 (du har 1 hemma)')
    expect(kopText(3, 3)).toBe('Du har alla 3 hemma')
    expect(kopText(3, 5)).toBe('Du har alla 3 hemma')
    expect(kopText(1, 2)).toBe('Du har den hemma')
  })
})

describe('ordningen i Välj rätt', () => {
  it('favoriter och det man har hemma först, annars samma ordning', () => {
    const pasar = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id }))
    const ut = skafferietForst(pasar, new Set(['d']), new Map([['b', 2], ['e', 0]]))
    expect(ut.map((p) => p.id)).toEqual(['b', 'd', 'a', 'c', 'e'])
  })
})

describe('ordningen i skafferiet', () => {
  it('det som går ut först överst, utan datum sist, sedan namnet', () => {
    const namn: Record<string, string> = { a: 'Öl', b: 'Gröt', c: 'Bönor', d: 'Ärtsoppa' }
    const rader = [rad('a', 1), rad('b', 1, '2027-05-01'), rad('c', 1), rad('d', 1, '2027-01-01')]
    expect(sorteraSkafferi(rader, (r) => namn[r.matprodukt_id]).map((r) => r.matprodukt_id)).toEqual(['d', 'b', 'c', 'a'])
  })
})
