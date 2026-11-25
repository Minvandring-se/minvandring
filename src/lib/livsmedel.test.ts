import { describe, expect, it } from 'vitest'
import { faltFranLivsmedel, monsterForDatabasen, rangordnaLivsmedel, tillstandFranNamn, type Tillstand } from './livsmedel'

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
    // Torkat men kokt väger som tillagat.
    expect(tillstandFranNamn('Röda linser torkade kokta m. salt')).toBe('tillagad')
  })

  it('känner igen rått, men inte rå mitt i ett ord', () => {
    expect(tillstandFranNamn('Morot rå')).toBe('ra')
    expect(tillstandFranNamn('Ris råris okokt')).toBe('torr')
    expect(tillstandFranNamn('Råg fullkorn')).toBeNull()
  })

  it('läser inte det som står efter m. (med) som maträttens tillstånd', () => {
    expect(tillstandFranNamn('Kalvdans m. mjölkpulver ägg')).toBeNull()
    expect(tillstandFranNamn('Bröd m. torkade tranbär')).toBeNull()
    expect(tillstandFranNamn('Mjölkpulver helmjölk')).toBe('torr')
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

  it('sätter råvaror före maträtter, även när maträtten träffar bättre', () => {
    const lista = [
      { namn: 'Pasta m. köttfärssås', tillstand: null, grupp: 'Pastarätter' },
      { namn: 'Pasta okokt', tillstand: 'torr' as const, grupp: 'Pasta och liknande produkter' },
      { namn: 'Pasta', tillstand: null, grupp: 'Pastarätter' },
    ]
    expect(rangordnaLivsmedel(lista, 'pasta').map((x) => x.namn)).toEqual(['Pasta okokt', 'Pasta', 'Pasta m. köttfärssås'])
  })

  it('kräver att alla sökord finns i namnet', () => {
    expect(rangordnaLivsmedel(kandidater, 'pasta okokt').map((x) => x.namn)).toEqual(['Pasta okokt', 'Pasta fullkorn okokt', 'Fullkornspasta okokt'])
  })

  it('ger högst så många förslag som efterfrågas och inget för en tom sökning', () => {
    expect(rangordnaLivsmedel(kandidater, 'pasta', 2)).toHaveLength(2)
    expect(rangordnaLivsmedel(kandidater, '  ')).toEqual([])
  })

  it('hittar sammansatta ord när delarna står isär i namnet, och tvärtom', () => {
    const vilt = [l('Älg färs rå', 'ra'), l('Ren kött rå', 'ra'), l('Renkött torkat', 'torr'), l('Rensad sill', null)]
    expect(rangordnaLivsmedel(vilt, 'älgfärs').map((x) => x.namn)).toEqual(['Älg färs rå'])
    expect(rangordnaLivsmedel(vilt, 'renkött').map((x) => x.namn)).toEqual(['Renkött torkat', 'Ren kött rå'])
    expect(rangordnaLivsmedel(vilt, 'ren kött').map((x) => x.namn)).toEqual(['Renkött torkat', 'Ren kött rå'])
  })

  it('sätter ett namn som är exakt det man skrivit före varianter, oavsett tillstånd', () => {
    const gronsaker = [l('Gurka inlagd', null), l('Gurka rå', 'ra'), l('Gurka', null), l('Morotskaka', null), l('Morot', null), l('Morot kokt', 'tillagad'), l('Valnötter', null), l('Valnötter rostade', null)]
    expect(rangordnaLivsmedel(gronsaker, 'gurka')[0].namn).toBe('Gurka')
    expect(rangordnaLivsmedel(gronsaker, 'Morot').map((x) => x.namn)).toEqual(['Morot', 'Morotskaka', 'Morot kokt'])
    expect(rangordnaLivsmedel(gronsaker, 'valnötter')[0].namn).toBe('Valnötter')
  })

  it('bryr sig inte om stora och små bokstäver', () => {
    expect(rangordnaLivsmedel(kandidater, 'PASTA OKOKT')[0].namn).toBe('Pasta okokt')
  })
})

describe('monsterForDatabasen', () => {
  it('ger det längsta ordet och samma ord delat på varje ställe, med minst två bokstäver i varje del', () => {
    expect(monsterForDatabasen('älgfärs')).toEqual(['älgfärs', 'äl%gfärs', 'älg%färs', 'älgf%ärs', 'älgfä%rs'])
    expect(monsterForDatabasen('ris okokt')?.[0]).toBe('okokt')
  })

  it('delar inte korta ord och ger inget för det som är för kort', () => {
    expect(monsterForDatabasen('ris')).toEqual(['ris'])
    expect(monsterForDatabasen('p')).toBeNull()
    expect(monsterForDatabasen(' , ')).toBeNull()
  })
})

describe('faltFranLivsmedel', () => {
  it('fyller i kcal som heltal och protein med en decimal och komma', () => {
    expect(faltFranLivsmedel({ kcal_per_100g: 357.6, protein_per_100g: 12.04 })).toEqual({ kcal: '358', protein: '12' })
    expect(faltFranLivsmedel({ kcal_per_100g: 350, protein_per_100g: 24.5 })).toEqual({ kcal: '350', protein: '24,5' })
    expect(faltFranLivsmedel({ kcal_per_100g: null, protein_per_100g: null })).toEqual({ kcal: '', protein: '' })
  })
})
