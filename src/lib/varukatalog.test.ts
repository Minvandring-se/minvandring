import { describe, expect, it } from 'vitest'
import { kostinfoForVara, rangordnaVaror, varumonster, varunamnFor } from './varukatalog'

const v = (marke: string, namn: string) => ({ marke, namn })

describe('varunamnFor', () => {
  it('är märke och namn, högst 80 tecken', () => {
    expect(varunamnFor(v('Polarbröd', 'Sarek 375 g'))).toBe('Polarbröd Sarek 375 g')
    expect(varunamnFor(v('M', 'x'.repeat(100))).length).toBe(80)
  })
})

describe('kostinfoForVara', () => {
  it('tar allergener, spår och kostval, och okänt stannar okänt', () => {
    expect(kostinfoForVara({ vegetarisk: true, vegansk: null, glutenfri: false, laktosfri: true, allergener: null, spar: ['notter'] })).toEqual({
      vegetarisk: true,
      vegansk: null,
      glutenfri: false,
      laktosfri: true,
      allergener: null,
      spar: ['notter'],
    })
  })
})

describe('rangordnaVaror', () => {
  const kandidater = [v('Wasa', 'Husman knäckebröd'), v('Polarbröd', 'Sarek 375 g'), v('Polarbröd', 'Sarek 422 g'), v('Leksands', 'Knäcke runda')]

  it('kräver alla ord i märke eller namn, och sätter det som börjar med sökningen först', () => {
    expect(rangordnaVaror(kandidater, 'sarek').map((k) => k.namn)).toEqual(['Sarek 375 g', 'Sarek 422 g'])
    expect(rangordnaVaror(kandidater, 'polarbröd 422').map((k) => k.namn)).toEqual(['Sarek 422 g'])
    expect(rangordnaVaror(kandidater, 'knäcke').map((k) => k.marke)).toEqual(['Leksands', 'Wasa'])
    expect(rangordnaVaror(kandidater, '')).toEqual([])
  })
})

describe('varumonster', () => {
  it('är det längsta ordet, och tomt för kort sökning', () => {
    expect(varumonster('wasa knäckebröd')).toBe('knäckebröd')
    expect(varumonster('a')).toBeNull()
  })
})
