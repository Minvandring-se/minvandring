import { describe, expect, it } from 'vitest'
import { arKokgrupp, filtreraKokgrupp, kokEtikettFor, kokgrupp, kokkarlEtikett } from './kokkarl'

describe('kök med och utan kokkärl', () => {
  it('räknar ett kök med kokkärlets volym som kit', () => {
    expect(kokgrupp({ typ: 'systemkok', kokkarl_l: 1 })).toBe('med_kokkarl')
    expect(kokkarlEtikett({ kokkarl_l: 1.3 })).toBe('Med kokkärl 1,3 l')
    expect(kokkarlEtikett({ kokkarl_l: 0.65 })).toBe('Med kokkärl 0,65 l')
  })

  it('räknar ett kök utan volym som bara brännare', () => {
    expect(kokgrupp({ typ: 'toppmonterat' })).toBe('bara_brannare')
    expect(kokgrupp(null)).toBe('bara_brannare')
    expect(kokkarlEtikett({ kokkarl_l: '' })).toBe('Bara brännare')
    expect(kokkarlEtikett(undefined)).toBe('Bara brännare')
  })

  it('ger etikett bara för kök', () => {
    expect(kokEtikettFor({ underkategori: 'brannare', egenskaper: { kokkarl_l: 1 } })).toBe('Med kokkärl 1 l')
    expect(kokEtikettFor({ underkategori: 'talt', egenskaper: {} })).toBeNull()
  })

  it('filtrerar köken på grupp och lämnar annat i fred', () => {
    const brannare = { id: 'a', underkategori: 'brannare', egenskaper: {} }
    const kit = { id: 'b', underkategori: 'brannare', egenskaper: { kokkarl_l: 1.2 } }
    const talt = { id: 'c', underkategori: 'talt', egenskaper: {} }
    const alla = [brannare, kit, talt]
    expect(filtreraKokgrupp(alla, '').map((p) => p.id)).toEqual(['a', 'b', 'c'])
    expect(filtreraKokgrupp(alla, 'bara_brannare').map((p) => p.id)).toEqual(['a', 'c'])
    expect(filtreraKokgrupp(alla, 'med_kokkarl').map((p) => p.id)).toEqual(['b', 'c'])
  })

  it('känner igen giltiga grupper', () => {
    expect(arKokgrupp('med_kokkarl')).toBe(true)
    expect(arKokgrupp('gasol')).toBe(false)
  })
})
