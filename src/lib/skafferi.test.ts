import { describe, expect, it } from 'vitest'
import { garUtFore, jamforDatum, manadOchAr, nyttAntal, skafferibesked, skafferistatus, tidigasteDatum, tillatnaAr, tolkaBastFore, valFranDatum, bastForeStatus, bokade, bokadText, bokningarFranRader, enManadEfter, formateraDatum, hemma, kopText, ledigaHemma, senastAnvanda, skafferietForst, sorteraSkafferi, turerFore, type Bokningstur } from './skafferi'
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

describe('bokning från skafferiet', () => {
  const tur = (id: string, avresa: string | null, skapad: string, dagar = 3): Bokningstur => ({ id, avresa, hemkomst: null, dagar, skapad })
  const turer = [
    tur('juni', '2027-06-01', '2026-11-03'),
    tur('mars', '2027-03-01', '2026-11-05'),
    tur('utan', null, '2026-11-01'),
    tur('utan2', null, '2026-11-02'),
    tur('forra', '2026-08-01', '2026-07-01'),
  ]
  const idag = '2026-11-24'

  it('låter kommande turer som börjar tidigare ta påsarna först', () => {
    expect(turerFore(turer, 'mars', idag)).toEqual(new Set())
    expect(turerFore(turer, 'juni', idag)).toEqual(new Set(['mars']))
    // Turer utan datum kommer sist, i den ordning de skapades. Avslutade turer räknas inte.
    expect(turerFore(turer, 'utan2', idag)).toEqual(new Set(['mars', 'juni', 'utan']))
    expect(turerFore(turer, 'forra', idag)).toEqual(new Set())
  })

  it('räknar bara påsarna i turerna före', () => {
    const bokningar = [
      { turId: 'mars', matproduktId: 'p1', pasar: 2 },
      { turId: 'juni', matproduktId: 'p1', pasar: 3 },
      { turId: 'mars', matproduktId: 'p2', pasar: 1 },
    ]
    expect(bokade(bokningar, new Set(['mars']))).toEqual(new Map([['p1', 2], ['p2', 1]]))
    expect(bokade(bokningar, new Set(['mars', 'juni']))).toEqual(new Map([['p1', 5], ['p2', 1]]))
  })

  it('drar av det bokade från det man har hemma', () => {
    const iSkafferiet = new Map([['p1', 3], ['p2', 1], ['p3', 2]])
    expect(ledigaHemma(iSkafferiet, new Map([['p1', 2], ['p2', 4]]))).toEqual(new Map([['p1', 1], ['p3', 2]]))
  })

  it('säger hur många påsar som går till en tidigare tur', () => {
    expect(bokadText(0)).toBeNull()
    expect(bokadText(1)).toBe('En påse hemma är bokad till en tur som börjar före den här.')
    expect(bokadText(3)).toBe('3 påsar hemma är bokade till en tur som börjar före den här.')
  })
})

describe('senastAnvanda', () => {
  const turer = [
    { id: 'a', skapad: '2026-10-01' },
    { id: 'b', skapad: '2026-11-01' },
    { id: 'denna', skapad: '2026-09-01' },
  ]
  it('tar den här turens påsar först, sedan den senast skapade turen, och varje påse en gång', () => {
    const ratter = [
      { turId: 'a', matproduktId: 'p1' },
      { turId: 'b', matproduktId: 'p2' },
      { turId: 'denna', matproduktId: 'p3' },
      { turId: 'a', matproduktId: 'p2' },
    ]
    expect(senastAnvanda(ratter, turer, 'denna')).toEqual(['p3', 'p2', 'p1'])
    expect(senastAnvanda(ratter, turer, 'denna', 2)).toEqual(['p3', 'p2'])
  })
})

describe('bokningarFranRader', () => {
  it('lägger ihop portionerna man bär per tur och påse och avrundar uppåt till hela påsar', () => {
    const rader = [
      { turId: 'mars', matproduktId: 'p1', portioner: 2 },
      { turId: 'mars', matproduktId: 'p1', portioner: 1 },
      { turId: 'juni', matproduktId: 'p1', portioner: 1 },
      { turId: 'mars', matproduktId: 'p2', portioner: 3 },
    ]
    expect(bokningarFranRader(rader, new Map([['p1', 2], ['p2', 1]]))).toEqual([
      { turId: 'mars', matproduktId: 'p1', pasar: 2 },
      { turId: 'juni', matproduktId: 'p1', pasar: 1 },
      { turId: 'mars', matproduktId: 'p2', pasar: 3 },
    ])
  })
})

describe('bäst före som månad och år', () => {
  const idag = '2026-11-24'
  it('tillåter år från i år till och med 15 år framåt', () => {
    expect(tillatnaAr(idag)[0]).toBe(2026)
    expect(tillatnaAr(idag).at(-1)).toBe(2041)
    expect(tillatnaAr(idag)).toHaveLength(16)
  })

  it('sparar den sista dagen i månaden, också i februari ett skottår', () => {
    expect(tolkaBastFore('3', '2027', idag)).toEqual({ ok: true, datum: '2027-03-31' })
    expect(tolkaBastFore('2', '2028', idag)).toEqual({ ok: true, datum: '2028-02-29' })
    expect(tolkaBastFore('', '', idag)).toEqual({ ok: true, datum: null })
  })

  it('stoppar halva val och år utanför gränsen, också sexsiffriga år', () => {
    expect(tolkaBastFore('3', '', idag).ok).toBe(false)
    expect(tolkaBastFore('', '2027', idag).ok).toBe(false)
    expect(tolkaBastFore('3', '2042', idag)).toEqual({ ok: false, fel: 'Välj ett år mellan 2026 och 2041.' })
    expect(tolkaBastFore('3', '202611', idag).ok).toBe(false)
    expect(tolkaBastFore('13', '2027', idag).ok).toBe(false)
  })

  it('visar datumet som månad och år, och läser tillbaka det till väljarna', () => {
    expect(manadOchAr('2027-03-31')).toBe('mars 2027')
    expect(valFranDatum('2027-03-31')).toEqual({ manad: '3', ar: '2027' })
    expect(valFranDatum(null)).toEqual({ manad: '', ar: '' })
  })
})

describe('lägga påsar i skafferiet', () => {
  it('lägger till det nya antalet, högst 999', () => {
    expect(nyttAntal(2, 1)).toBe(3)
    expect(nyttAntal(998, 5)).toBe(999)
  })

  it('behåller det tidigaste bäst före', () => {
    expect(tidigasteDatum('2027-03-31', '2027-01-31')).toBe('2027-01-31')
    expect(tidigasteDatum(null, '2027-01-31')).toBe('2027-01-31')
    expect(tidigasteDatum('2027-03-31', null)).toBe('2027-03-31')
    expect(tidigasteDatum(null, null)).toBeNull()
  })

  it('bekräftar kort hur många man har hemma', () => {
    expect(skafferibesked(3, '2027-03-31')).toBe('Nu har du 3 hemma, bäst före mars 2027.')
    expect(skafferibesked(1, null)).toBe('Nu har du 1 hemma.')
  })
})

describe('bäst före jämfört med turen', () => {
  it('jämför med turens första dag, eller med i dag när turen saknar datum', () => {
    expect(jamforDatum('2026-12-04', '2026-11-24')).toBe('2026-12-04')
    expect(jamforDatum(null, '2026-11-24')).toBe('2026-11-24')
  })

  it('räknar en påse som hemma om bäst före är på eller efter turens första dag, och alltid utan bäst före', () => {
    const rader = [
      { id: 'a', matprodukt_id: 'p1', antal: 2, bast_fore: '2026-12-03' },
      { id: 'b', matprodukt_id: 'p2', antal: 1, bast_fore: '2026-12-04' },
      { id: 'c', matprodukt_id: 'p3', antal: 4, bast_fore: null },
    ]
    expect(hemma(rader, jamforDatum('2026-12-04', '2026-11-24'))).toEqual(
      new Map([
        ['p2', 1],
        ['p3', 4],
      ]),
    )
    expect(garUtFore('2026-12-03', '2026-12-04')).toBe(true)
    expect(garUtFore('2026-12-04', '2026-12-04')).toBe(false)
    expect(garUtFore(null, '2026-12-04')).toBe(false)
  })

  it('säger Gått ut när datumet har passerat och Går ut snart inom tre månader', () => {
    const idag = '2026-11-24'
    expect(skafferistatus('2026-11-23', idag)).toBe('gatt_ut')
    expect(skafferistatus('2026-11-24', idag)).toBe('snart')
    expect(skafferistatus('2027-02-24', idag)).toBe('snart')
    expect(skafferistatus('2027-02-28', idag)).toBeNull()
    expect(skafferistatus(null, idag)).toBeNull()
  })
})
