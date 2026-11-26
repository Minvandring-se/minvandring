import { describe, expect, it } from 'vitest'
import {
  arReceptfavorit,
  kopplingsnyckel,
  nyaPortioner,
  portionertext,
  rattForHemma,
  rattMedNamn,
  rattnamnFel,
  ratterHemma,
  sorteraRatter,
  tolkaKoppling,
} from './skafferiratter'
import type { Skafferiratt } from './typer'

const ratt = (namn: string, portioner = 1, bast_fore: string | null = null, koppling: Partial<Skafferiratt> = {}): Skafferiratt => ({
  id: `r-${namn}`,
  namn,
  portioner,
  bast_fore,
  recept_id: null,
  receptkatalog_id: null,
  ...koppling,
})

describe('namnet på en rätt hemma', () => {
  it('måste finnas och vara högst 80 tecken', () => {
    expect(rattnamnFel('  ')).toBe('Skriv vad rätten heter.')
    expect(rattnamnFel('a'.repeat(81))).toBe('Namnet får vara högst 80 tecken.')
    expect(rattnamnFel(` ${'a'.repeat(80)} `)).toBeNull()
    expect(rattnamnFel('Mammas korvstroganoff')).toBeNull()
  })

  it('hittas oavsett stora och små bokstäver och mellanslag runt om', () => {
    const ratter = [ratt('Mammas korvstroganoff')]
    expect(rattMedNamn(ratter, ' mammas KORVSTROGANOFF ')?.id).toBe('r-Mammas korvstroganoff')
    expect(rattMedNamn(ratter, 'Korvstroganoff')).toBeUndefined()
  })
})

describe('portioner', () => {
  it('skrivs i singular och plural', () => {
    expect(portionertext(1)).toBe('1 portion')
    expect(portionertext(5)).toBe('5 portioner')
  })

  it('läggs till inom 1 till 999', () => {
    expect(nyaPortioner(5, 3)).toBe(8)
    expect(nyaPortioner(998, 5)).toBe(999)
    expect(nyaPortioner(0, 0)).toBe(1)
  })
})

describe('rätterna hemma', () => {
  it('sorteras med det som går ut först överst och utan datum sist', () => {
    const ratter = [ratt('Öl'), ratt('Gryta', 2, '2027-03-31'), ratt('Chili', 1, '2027-01-31'), ratt('Bönor')]
    expect(sorteraRatter(ratter).map((r) => r.namn)).toEqual(['Chili', 'Gryta', 'Bönor', 'Öl'])
  })

  it('räknar inte en rätt vars bäst före har passerat', () => {
    const ratter = [ratt('Gammal', 2, '2026-10-31'), ratt('Ny', 2, '2027-01-31'), ratt('Utan datum')]
    expect(ratterHemma(ratter, '2026-11-26').map((r) => r.namn)).toEqual(['Ny', 'Utan datum'])
    // Jämförs med turens första dag.
    expect(ratterHemma(ratter, '2027-02-01').map((r) => r.namn)).toEqual(['Utan datum'])
  })
})

describe('kopplingen till ett recept', () => {
  it('blir en nyckel och tillbaka', () => {
    expect(kopplingsnyckel(ratt('A', 1, null, { recept_id: 'abc' }))).toBe('eget:abc')
    expect(kopplingsnyckel(ratt('A', 1, null, { receptkatalog_id: 'chili-sin-carne' }))).toBe('katalog:chili-sin-carne')
    expect(kopplingsnyckel(ratt('A'))).toBe('')
    expect(tolkaKoppling('eget:abc')).toEqual({ recept_id: 'abc' })
    expect(tolkaKoppling('katalog:chili-sin-carne')).toEqual({ receptkatalog_id: 'chili-sin-carne' })
    expect(tolkaKoppling('')).toBeNull()
    expect(tolkaKoppling('annat:x')).toBeNull()
    expect(tolkaKoppling('eget:')).toBeNull()
  })

  it('stjärnan gäller egna recept och MinVandrings recept var för sig', () => {
    const favoriter = { egna: new Set(['abc']), katalog: new Set(['chili']) }
    expect(arReceptfavorit(favoriter, { recept_id: 'abc' })).toBe(true)
    expect(arReceptfavorit(favoriter, { receptkatalog_id: 'abc' })).toBe(false)
    expect(arReceptfavorit(favoriter, { receptkatalog_id: 'chili' })).toBe(true)
  })
})

describe('en rätt hemma som läggs i turen', () => {
  const turens = [
    { id: 'p', namn: 'Gryta', matprodukt_id: 'pase-1' },
    { id: 'g', namn: 'Gryta', matprodukt_id: null },
    { id: 'k', namn: 'Korvstroganoff', matprodukt_id: null },
  ]

  it('blir en ny rätt när turen inte har någon med namnet', () => {
    expect(rattForHemma(' Chili ', turens, () => false)).toEqual({ typ: 'ny', namn: 'Chili' })
  })

  it('använder turens rätt med namnet när den saknar ingredienser', () => {
    expect(rattForHemma('korvstroganoff', turens, () => false)).toEqual({ typ: 'befintlig', rattId: 'k' })
  })

  it('får ett nytt namn när turens rätt har ingredienser, så att inget hamnar i inköpslistan', () => {
    expect(rattForHemma('Gryta', turens, (id) => id === 'g')).toEqual({ typ: 'ny', namn: 'Gryta (2)' })
    const medTvaan = [...turens, { id: 'g2', namn: 'Gryta (2)', matprodukt_id: null }]
    expect(rattForHemma('Gryta', medTvaan, (id) => id === 'g')).toEqual({ typ: 'befintlig', rattId: 'g2' })
    expect(rattForHemma('Gryta', medTvaan, () => true)).toEqual({ typ: 'ny', namn: 'Gryta (3)' })
  })
})
