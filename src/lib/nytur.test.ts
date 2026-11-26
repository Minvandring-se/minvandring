import { describe, expect, it } from 'vitest'
import { tolkaNyTur } from './nytur'

describe('ny tur', () => {
  it('kräver ett namn på högst 80 tecken, utan mellanslag runt om', () => {
    expect(tolkaNyTur('  ', { lage: 'datum', avresa: '', hemkomst: '' })).toEqual({ ok: false, falt: 'namn', fel: 'Skriv vad turen heter.' })
    expect(tolkaNyTur('a'.repeat(81), { lage: 'datum', avresa: '', hemkomst: '' })).toMatchObject({ ok: false, falt: 'namn' })
    expect(tolkaNyTur(' Sarek 2027 ', { lage: 'datum', avresa: '', hemkomst: '' })).toEqual({ ok: true, rad: { namn: 'Sarek 2027', avresa: null, hemkomst: null } })
  })

  it('räknar vandringsdagarna från datumen, båda dagarna inräknade', () => {
    expect(tolkaNyTur('Sarek', { lage: 'datum', avresa: '2027-08-12', hemkomst: '2027-08-18' })).toEqual({ ok: true, rad: { namn: 'Sarek', avresa: '2027-08-12', hemkomst: '2027-08-18', dagar: 7 } })
    expect(tolkaNyTur('Dagstur', { lage: 'datum', avresa: '2027-08-12', hemkomst: '2027-08-12' })).toMatchObject({ ok: true, rad: { dagar: 1 } })
  })

  it('godtar ett datum utan det andra, utan dagar', () => {
    expect(tolkaNyTur('Sarek', { lage: 'datum', avresa: '2027-08-12', hemkomst: '' })).toEqual({ ok: true, rad: { namn: 'Sarek', avresa: '2027-08-12', hemkomst: null } })
    expect(tolkaNyTur('Sarek', { lage: 'datum', avresa: '', hemkomst: '2027-08-18' })).toEqual({ ok: true, rad: { namn: 'Sarek', avresa: null, hemkomst: '2027-08-18' } })
  })

  it('stoppar hemkomst före avresan och turer över 30 dagar, som databasen', () => {
    expect(tolkaNyTur('Sarek', { lage: 'datum', avresa: '2027-08-18', hemkomst: '2027-08-12' })).toEqual({ ok: false, falt: 'datum', fel: 'Hemkomsten kan inte vara före avresan.' })
    expect(tolkaNyTur('Lång', { lage: 'datum', avresa: '2027-07-01', hemkomst: '2027-07-30' })).toMatchObject({ ok: true, rad: { dagar: 30 } })
    expect(tolkaNyTur('För lång', { lage: 'datum', avresa: '2027-07-01', hemkomst: '2027-07-31' })).toEqual({ ok: false, falt: 'datum', fel: 'En tur kan vara högst 30 dagar.' })
  })

  it('godtar antal dagar utan datum, 1 till 30 eller tomt', () => {
    expect(tolkaNyTur('Sarek', { lage: 'dagar', dagar: '6' })).toEqual({ ok: true, rad: { namn: 'Sarek', avresa: null, hemkomst: null, dagar: 6 } })
    expect(tolkaNyTur('Sarek', { lage: 'dagar', dagar: ' 30 ' })).toMatchObject({ ok: true, rad: { dagar: 30 } })
    expect(tolkaNyTur('Sarek', { lage: 'dagar', dagar: '' })).toEqual({ ok: true, rad: { namn: 'Sarek', avresa: null, hemkomst: null } })
    for (const fel of ['0', '31', '2.5', '-1', 'tre']) expect(tolkaNyTur('Sarek', { lage: 'dagar', dagar: fel })).toEqual({ ok: false, falt: 'dagar', fel: 'Ange 1 till 30 vandringsdagar.' })
  })
})
