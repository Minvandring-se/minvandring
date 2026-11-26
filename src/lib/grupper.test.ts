import { describe, expect, it } from 'vitest'
import { gruppfel, kontrolleraGruppnamn, medlemsText, valjGrupp, type Grupp } from './grupper'

const grupper: Grupp[] = [
  { id: 'g1', namn: 'Fjällgänget', medlemmar: ['a', 'c', 'borta'] },
  { id: 'g2', namn: 'Jobbet', medlemmar: [] },
]
const vanner = [
  { user_id: 'a', namn: 'Anna' },
  { user_id: 'b', namn: 'Erik' },
  { user_id: 'c', namn: 'Padde' },
]

describe('kontrolleraGruppnamn', () => {
  it('kräver ett namn på högst 40 tecken', () => {
    expect(kontrolleraGruppnamn('  ', grupper, null)).toBe('Ge gruppen ett namn.')
    expect(kontrolleraGruppnamn('x'.repeat(41), grupper, null)).toBe('Namnet får vara högst 40 tecken.')
  })
  it('stoppar ett namn som redan finns, oavsett stora och små bokstäver, men inte gruppens eget', () => {
    expect(kontrolleraGruppnamn(' fjällgänget ', grupper, null)).toBe('Du har redan en grupp med det namnet.')
    expect(kontrolleraGruppnamn('Fjällgänget', grupper, 'g1')).toBeNull()
    expect(kontrolleraGruppnamn('Sarekgänget', grupper, null)).toBeNull()
  })
})

describe('medlemsText', () => {
  it('räknar upp vännerna i gruppen och hoppar över den som inte längre är vän', () => {
    expect(medlemsText(grupper[0], vanner)).toBe('Anna och Padde')
    expect(medlemsText(grupper[1], vanner)).toBe('Inga vänner i gruppen än')
  })
})

describe('valjGrupp', () => {
  it('väljer gruppens medlemmar bland de valbara', () => {
    expect([...valjGrupp(grupper[0], [{ user_id: 'b' }, { user_id: 'c' }])]).toEqual(['c'])
  })
})

describe('gruppfel', () => {
  it('översätter databasens fel', () => {
    expect(gruppfel('duplicate key value violates unique constraint "grupper_unikt_namn"')).toBe('Du har redan en grupp med det namnet.')
    expect(gruppfel('En grupp kan ha högst 50 vänner')).toBe('En grupp kan ha högst 50 vänner.')
    expect(gruppfel('Bara vänner kan vara med i en grupp')).toMatch(/inte längre din vän/)
    expect(gruppfel(undefined)).toMatch(/Kontrollera uppkopplingen/)
  })
})
