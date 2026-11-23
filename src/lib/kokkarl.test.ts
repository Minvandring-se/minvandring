import { describe, expect, it } from 'vitest'
import { kokgrupp, kokkarlEtikett } from './kokkarl'

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
})
