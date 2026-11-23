import { describe, expect, it } from 'vitest'
import { arKokgrupp, filtreraKokgrupp, kokEtikettFor, kokgrupp, kokkarlEtikett, passarIhop } from './kokkarl'

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

describe('vilka kokkärl som passar vilka brännare', () => {
  const jetboil = { typ: 'systemkok', system: 'jetboil_fluxring' }
  const crux = { typ: 'toppmonterat' }
  const trangia = { typ: 'stormkok', system: 'trangia_25' }
  const vanlig = { typ: 'kastrull' }

  it('låter brännare och kokkärl i samma system passa ihop', () => {
    expect(passarIhop(jetboil, { system: 'jetboil_fluxring' })).toBe(true)
    expect(passarIhop(trangia, { system: 'trangia_25' })).toBe(true)
  })

  it('låter inte olika system passa ihop', () => {
    expect(passarIhop(jetboil, { system: 'msr_windburner' })).toBe(false)
    expect(passarIhop(trangia, { system: 'trangia_27' })).toBe(false)
  })

  it('ställer vanliga kokkärl på öppna brännare, men inte på system- och stormkök', () => {
    expect(passarIhop(crux, vanlig)).toBe(true)
    expect(passarIhop({ typ: 'slangkok' }, vanlig)).toBe(true)
    expect(passarIhop(jetboil, vanlig)).toBe(false)
    expect(passarIhop({ typ: 'systemkok' }, vanlig)).toBe(false)
    expect(passarIhop({ typ: 'stormkok' }, vanlig)).toBe(false)
  })

  it('ställer kokkärl i ett system på en öppen brännare, utom när tillverkaren säger att de bara passar sitt kök', () => {
    expect(passarIhop(crux, { system: 'trangia_27' })).toBe(true)
    expect(passarIhop(crux, { system: 'msr_reactor', bara_system: true })).toBe(false)
    expect(passarIhop({ typ: 'stormkok', system: 'trangia_27' }, { system: 'trangia_27' })).toBe(true)
  })

  it('säger nej när uppgifter saknas', () => {
    expect(passarIhop(null, vanlig)).toBe(false)
    expect(passarIhop(undefined, undefined)).toBe(false)
  })
})
