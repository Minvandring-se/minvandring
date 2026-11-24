import { describe, expect, it } from 'vitest'
import type { TolkadIngrediens } from './mat'
import { ledigtNamn, raderTillFalt, rattTillRader, receptbesked, receptMedNamn, receptTillRader, sammaIngredienser, valForRecept } from './recept'
import type { Ingrediens, Ratt, Recept, Vara } from './typer'

const rad = (vara: string, gram: number, kcal: number | null = null, protein: number | null = null): TolkadIngrediens => ({
  vara,
  mangd: gram,
  enhet: 'g',
  gram,
  kcalPer100g: kcal,
  proteinPer100g: protein,
})

const ratt = (id: string, namn: string, matprodukt_id: string | null = null): Ratt => ({ id, namn, matprodukt_id, ansvarig: null, klart: false })
const vara = (id: string, namn: string): Vara => ({
  id,
  namn,
  kcal_per_100g: 380,
  protein_per_100g: 12.5,
  extra_g: 0,
  varifran: null,
  ansvarig: null,
  klart: false,
})
const ingrediens = (ratt_id: string, vara_id: string, gram: number): Ingrediens => ({ id: `${ratt_id}-${vara_id}`, ratt_id, vara_id, mangd: gram, enhet: 'g', gram_per_portion: gram })

describe('raderna', () => {
  it('receptet i sin ordning', () => {
    const r: Recept = {
      id: 'r',
      namn: 'Gröt',
      rader: [
        { id: '2', recept_id: 'r', vara: 'Russin', mangd: 20, enhet: 'g', gram_per_portion: 20, kcal_per_100g: 300, protein_per_100g: 3, sortering: 1 },
        { id: '1', recept_id: 'r', vara: 'Havregryn', mangd: 90, enhet: 'g', gram_per_portion: 90, kcal_per_100g: 380, protein_per_100g: 12.5, sortering: 0 },
      ],
    }
    expect(receptTillRader(r)).toEqual([rad('Havregryn', 90, 380, 12.5), rad('Russin', 20, 300, 3)])
  })

  it('en rätt i turen med varornas kcal och protein', () => {
    const varor = [vara('v1', 'Couscous'), vara('v2', 'Linser')]
    const ing = [ingrediens('a', 'v1', 100), ingrediens('b', 'v2', 50), ingrediens('a', 'saknas', 10)]
    expect(rattTillRader('a', ing, varor)).toEqual([rad('Couscous', 100, 380, 12.5)])
  })

  it('som fält i formuläret, med komma i decimaler, och vikten bara för andra enheter än g och kg', () => {
    expect(raderTillFalt([rad('Havregryn', 90, 380, 12.5), rad('Salt', 2)])).toEqual([
      { vara: 'Havregryn', mangd: '90', enhet: 'g', gram: '', kcal: '380', protein: '12,5' },
      { vara: 'Salt', mangd: '2', enhet: 'g', gram: '', kcal: '', protein: '' },
    ])
    const mjolk: TolkadIngrediens = { vara: 'Mjölk', mangd: 1.5, enhet: 'dl', gram: 150, kcalPer100g: null, proteinPer100g: null }
    const salt: TolkadIngrediens = { vara: 'Salt', mangd: null, enhet: null, gram: null, kcalPer100g: null, proteinPer100g: null }
    expect(raderTillFalt([mjolk, salt])).toEqual([
      { vara: 'Mjölk', mangd: '1,5', enhet: 'dl', gram: '150', kcal: '', protein: '' },
      { vara: 'Salt', mangd: '', enhet: 'g', gram: '', kcal: '', protein: '' },
    ])
  })
})

describe('samma ingredienser med mängd och enhet', () => {
  it('skiljer på mängder i dl även när ingen av raderna har en vikt', () => {
    const mjolk = (mangd: number): TolkadIngrediens => ({ vara: 'Mjölk', mangd, enhet: 'dl', gram: null, kcalPer100g: null, proteinPer100g: null })
    expect(sammaIngredienser([mjolk(2)], [mjolk(2)])).toBe(true)
    expect(sammaIngredienser([mjolk(2)], [mjolk(3)])).toBe(false)
  })
})

describe('samma ingredienser', () => {
  it('jämför varor och mängder oavsett ordning och stora bokstäver, men inte kcal', () => {
    expect(sammaIngredienser([rad('Ris', 100), rad('Linser', 50, 340)], [rad('linser ', 50), rad('RIS', 100, 360)])).toBe(true)
  })

  it('skiljer på mängd, vara och antal rader', () => {
    expect(sammaIngredienser([rad('Ris', 100)], [rad('Ris', 110)])).toBe(false)
    expect(sammaIngredienser([rad('Ris', 100)], [rad('Bulgur', 100)])).toBe(false)
    expect(sammaIngredienser([rad('Ris', 100)], [rad('Ris', 100), rad('Salt', 2)])).toBe(false)
    expect(sammaIngredienser([rad('Ris', 100), rad('ris', 100)], [rad('Ris', 100), rad('Salt', 100)])).toBe(false)
  })
})

describe('ledigt namn', () => {
  it('namnet självt, annars nästa lediga nummer', () => {
    expect(ledigtNamn('Gryta', ['Gröt'])).toBe('Gryta')
    expect(ledigtNamn('Gryta', ['gryta'])).toBe('Gryta (2)')
    expect(ledigtNamn('Gryta', ['Gryta', 'Gryta (2)'])).toBe('Gryta (3)')
  })

  it('kortar namnet så att det ryms inom 80 tecken', () => {
    const langt = 'x'.repeat(80)
    const namn = ledigtNamn(langt, [langt])
    expect(namn).toHaveLength(80)
    expect(namn.endsWith(' (2)')).toBe(true)
  })
})

describe('valet när ett recept läggs i en tur', () => {
  const varor = [vara('v1', 'Couscous'), vara('v2', 'Linser')]
  const recept = [rad('Couscous', 100), rad('Linser', 50)]

  it('kopierar med receptets namn när turen inte har det', () => {
    expect(valForRecept('Gryta', recept, [ratt('a', 'Gröt')], [], varor)).toEqual({ typ: 'kopiera', namn: 'Gryta' })
  })

  it('använder turens rätt när ingredienserna och mängderna är desamma', () => {
    const ing = [ingrediens('a', 'v1', 100), ingrediens('a', 'v2', 50)]
    expect(valForRecept('Gryta', recept, [ratt('a', 'gryta')], ing, varor)).toEqual({ typ: 'befintlig', rattId: 'a', namn: 'gryta' })
  })

  it('kopierar med ett nytt namn när turens rätt skiljer sig', () => {
    const ing = [ingrediens('a', 'v1', 120), ingrediens('a', 'v2', 50)]
    expect(valForRecept('Gryta', recept, [ratt('a', 'Gryta')], ing, varor)).toEqual({ typ: 'nytt_namn', namn: 'Gryta (2)' })
  })

  it('använder en tidigare kopia med samma ingredienser i stället för att göra en till', () => {
    const ratter = [ratt('a', 'Gryta'), ratt('b', 'Gryta (2)')]
    const ing = [ingrediens('a', 'v1', 120), ingrediens('b', 'v1', 100), ingrediens('b', 'v2', 50)]
    expect(valForRecept('Gryta', recept, ratter, ing, varor)).toEqual({ typ: 'befintlig', rattId: 'b', namn: 'Gryta (2)' })
    expect(valForRecept('Gryta', recept, ratter, ing.slice(0, 1), varor)).toEqual({ typ: 'nytt_namn', namn: 'Gryta (3)' })
  })

  it('använder aldrig en påse, men påsens namn är upptaget', () => {
    expect(valForRecept('Gryta', recept, [ratt('p', 'Gryta', 'mp1')], [], varor)).toEqual({ typ: 'nytt_namn', namn: 'Gryta (2)' })
  })

  it('tecken som betyder något i ett reguljärt uttryck i namnet', () => {
    const ratter = [ratt('a', 'Pasta (vegansk)'), ratt('b', 'Pasta (vegansk) (2)')]
    const ing = [ingrediens('b', 'v1', 100), ingrediens('b', 'v2', 50)]
    expect(valForRecept('Pasta (vegansk)', recept, ratter, ing, varor)).toEqual({ typ: 'befintlig', rattId: 'b', namn: 'Pasta (vegansk) (2)' })
  })
})

describe('texterna', () => {
  it('säger vad som hände när namnet fanns', () => {
    expect(receptbesked({ typ: 'kopiera', namn: 'Gryta' }, 'Gryta')).toBeNull()
    expect(receptbesked({ typ: 'befintlig', rattId: 'a', namn: 'Gryta' }, 'Gryta')).toBe('Gryta fanns redan i turen med samma ingredienser, så den lades i måltiden.')
    expect(receptbesked({ typ: 'nytt_namn', namn: 'Gryta (2)' }, 'Gryta')).toBe('Turen har redan en annan rätt som heter Gryta. Receptet lades till som Gryta (2).')
  })

  it('hittar ett recept med samma namn oavsett stora bokstäver', () => {
    const recept = [{ namn: 'Gröt' }, { namn: 'Gryta' }]
    expect(receptMedNamn(recept, ' gryta')).toEqual({ namn: 'Gryta' })
    expect(receptMedNamn(recept, 'Soppa')).toBeUndefined()
  })
})
