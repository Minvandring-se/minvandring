import { describe, expect, it } from 'vitest'
import { passarIhop, passarMed, passarMedRubrik } from './kokkarl'

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

describe('listan över det som passar', () => {
  const crux = { id: 'crux', underkategori: 'brannare', egenskaper: { typ: 'toppmonterat' }, packvikt_g: 72 }
  const trangia27 = { id: 't27', underkategori: 'komplett_kok', egenskaper: { typ: 'stormkok', system: 'trangia_27' }, packvikt_g: 690 }
  const jetboil = { id: 'jb', underkategori: 'komplett_kok', egenskaper: { typ: 'systemkok' }, packvikt_g: 371 }
  const billy27 = { id: 'b27', underkategori: 'kastrull', egenskaper: { typ: 'kastrull', system: 'trangia_27' }, packvikt_g: 320 }
  const billy25 = { id: 'b25', underkategori: 'kastrull', egenskaper: { typ: 'kastrull', system: 'trangia_25' }, packvikt_g: 506 }
  const panna = { id: 'p', underkategori: 'kastrull', egenskaper: { typ: 'stekpanna' }, packvikt_g: 359 }
  const talt = { id: 'x', underkategori: 'talt', egenskaper: {}, packvikt_g: 1 }
  const alla = [crux, trangia27, jetboil, billy27, billy25, panna, talt]

  it('ger en brännare alla kokkärl som passar, lättast först', () => {
    expect(passarMed(crux, alla).map((p) => p.id)).toEqual(['b27', 'p', 'b25'])
  })

  it('ger ett komplett kök bara kokkärl i samma system', () => {
    expect(passarMed(trangia27, alla).map((p) => p.id)).toEqual(['b27'])
    expect(passarMed(jetboil, alla)).toEqual([])
  })

  it('ger ett kokkärl brännarna och köken det passar på', () => {
    expect(passarMed(billy27, alla).map((p) => p.id)).toEqual(['crux', 't27'])
    expect(passarMed(panna, alla).map((p) => p.id)).toEqual(['crux'])
  })

  it('ger inget för det som inte hör till köket', () => {
    expect(passarMed(talt, alla)).toEqual([])
    expect(passarMedRubrik('talt')).toBeNull()
    expect(passarMedRubrik('brannare')).toBe('Kokkärl och stekpannor som passar')
    expect(passarMedRubrik('kastrull')).toBe('Brännare och kök det passar på')
  })
})
