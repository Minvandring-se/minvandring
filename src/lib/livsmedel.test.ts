import { describe, expect, it } from 'vitest'
import { faltFranLivsmedel, rangordnaLivsmedel, sokordForDatabasen, tillstandFranNamn, type Tillstand } from './livsmedel'

describe('tillstandFranNamn', () => {
  it('känner igen torrt, även när namnet också innehåller kokt', () => {
    expect(tillstandFranNamn('Pasta okokt')).toBe('torr')
    expect(tillstandFranNamn('Linser torkade')).toBe('torr')
    expect(tillstandFranNamn('Mjölkpulver helmjölk')).toBe('torr')
    expect(tillstandFranNamn('Vetemjöl special')).toBe('torr')
    expect(tillstandFranNamn('Ris förkokt okokt')).toBe('torr')
  })

  it('känner igen tillagat', () => {
    expect(tillstandFranNamn('Pasta kokt u. salt')).toBe('tillagad')
    expect(tillstandFranNamn('Couscous tillagad')).toBe('tillagad')
    expect(tillstandFranNamn('Lax ugnsbakad')).toBe('tillagad')
    expect(tillstandFranNamn('Potatis ångkokt')).toBe('tillagad')
  })

  it('känner igen rått, men inte rå mitt i ett ord', () => {
    expect(tillstandFranNamn('Morot rå')).toBe('ra')
    expect(tillstandFranNamn('Ris råris okokt')).toBe('torr')
    expect(tillstandFranNamn('Råg fullkorn')).toBeNull()
  })

  it('läser inte mjölk som mjöl', () => {
    expect(tillstandFranNamn('Mjölk fett 3%')).toBeNull()
  })

  it('använder tillagningen i klassificeringen när namnet inte säger något', () => {
    expect(tillstandFranNamn('Köttbullar', 'Stekt i panna')).toBe('tillagad')
    expect(tillstandFranNamn('Nöt talg', 'Tillagningsmetod ej tillämplig')).toBeNull()
    expect(tillstandFranNamn('Couscous')).toBeNull()
  })
})

describe('rangordnaLivsmedel', () => {
  const l = (namn: string, tillstand: Tillstand | null = null) => ({ namn, tillstand })
  const kandidater = [
    l('Pastagratäng makaronipudding', 'tillagad'),
    l('Pasta kokt u. salt', 'tillagad'),
    l('Pasta okokt', 'torr'),
    l('Fullkornspasta okokt', 'torr'),
    l('Pasta fullkorn okokt', 'torr'),
    l('Sallad m. pasta', null),
  ]

  it('sätter namn som börjar med sökordet först och torrt före tillagat', () => {
    expect(rangordnaLivsmedel(kandidater, 'pasta').map((x) => x.namn)).toEqual([
      'Pasta okokt',
      'Pasta fullkorn okokt',
      'Pasta kokt u. salt',
      'Pastagratäng makaronipudding',
      'Sallad m. pasta',
    ])
  })

  it('kräver att alla sökord finns i namnet', () => {
    expect(rangordnaLivsmedel(kandidater, 'pasta okokt').map((x) => x.namn)).toEqual(['Pasta okokt', 'Pasta fullkorn okokt', 'Fullkornspasta okokt'])
  })

  it('ger högst så många förslag som efterfrågas och inget för en tom sökning', () => {
    expect(rangordnaLivsmedel(kandidater, 'pasta', 2)).toHaveLength(2)
    expect(rangordnaLivsmedel(kandidater, '  ')).toEqual([])
  })

  it('bryr sig inte om stora och små bokstäver', () => {
    expect(rangordnaLivsmedel(kandidater, 'PASTA OKOKT')[0].namn).toBe('Pasta okokt')
  })
})

describe('sokordForDatabasen', () => {
  it('väljer det längsta ordet och kräver minst två tecken', () => {
    expect(sokordForDatabasen('ris okokt')).toBe('okokt')
    expect(sokordForDatabasen('p')).toBeNull()
    expect(sokordForDatabasen(' , ')).toBeNull()
  })
})

describe('faltFranLivsmedel', () => {
  it('fyller i kcal som heltal och protein med en decimal och komma', () => {
    expect(faltFranLivsmedel({ kcal_per_100g: 357.6, protein_per_100g: 12.04 })).toEqual({ kcal: '358', protein: '12' })
    expect(faltFranLivsmedel({ kcal_per_100g: 350, protein_per_100g: 24.5 })).toEqual({ kcal: '350', protein: '24,5' })
    expect(faltFranLivsmedel({ kcal_per_100g: null, protein_per_100g: null })).toEqual({ kcal: '', protein: '' })
  })
})
