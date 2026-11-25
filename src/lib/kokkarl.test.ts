import { describe, expect, it } from 'vitest'
import { bransleMed, bransleRubrik, gemensamtSystem, kokvikt, passarBransle, passarIhop, passarMed, passarMedRubrik, sakerForKok } from './kokkarl'
import type { Produkt } from './typer'

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

  it('ger ett kokkärl brännarna och köken det passar på, med köken i samma system först', () => {
    expect(passarMed(billy27, alla).map((p) => p.id)).toEqual(['t27', 'crux'])
    expect(gemensamtSystem(billy27.egenskaper, trangia27.egenskaper)).toBe('trangia_27')
    expect(gemensamtSystem(billy27.egenskaper, crux.egenskaper)).toBeNull()
    expect(passarMed(panna, alla).map((p) => p.id)).toEqual(['crux'])
  })

  it('ger inget för det som inte hör till köket', () => {
    expect(passarMed(talt, alla)).toEqual([])
    expect(passarMedRubrik('talt')).toBeNull()
    expect(passarMedRubrik('brannare')).toBe('Kokkärl och stekpannor som passar')
    expect(passarMedRubrik('kastrull')).toBe('Brännare och kök det passar på')
  })
})

describe('ditt kök', () => {
  const produkt = (id: string, underkategori: string, packvikt_g: number) =>
    ({ id, marke: 'Trangia', modell: id, version: null, kategori: 'kok', underkategori, packvikt_g, kontrollerad: null, granskad: null, kalla_typ: 'tillverkare' }) as Produkt
  const crux = produkt('Crux', 'brannare', 72)
  const billy = produkt('Billy', 'kastrull', 320)
  const panna = produkt('Panna', 'kastrull', 359)

  it('lägger ihop vikten', () => {
    expect(kokvikt([crux, billy, panna])).toBe(751)
    expect(kokvikt([])).toBe(0)
  })

  it('lägger brännaren och kokkärlen i förrådet var för sig, med koppling till katalogen', () => {
    const saker = sakerForKok(crux, [billy, panna, billy], false)
    expect(saker.map((s) => s.produkt_id)).toEqual(['Crux', 'Billy', 'Panna'])
    expect(saker.map((s) => s.underkategori)).toEqual(['brannare', 'kastrull', 'kastrull'])
    expect(saker.every((s) => s.antal === 1)).toBe(true)
  })

  it('tar inte med brännaren när den redan finns i förrådet', () => {
    expect(sakerForKok(crux, [billy], true).map((s) => s.produkt_id)).toEqual(['Billy'])
  })
})

describe('bränsle som passar', () => {
  const patron = { typ: 'skruvpatron' }
  const pocketRocket = { bransle: 'gas', patronfaste: 'EN 417' }
  const utanFaste = { bransle: 'gas' }
  const stickpatron = { bransle: 'gas', patronfaste: 'Stickpatron' }
  const whisperlite = { bransle: 'multibransle', patronfaste: 'EN 417 och bränsleflaska' }
  const bensinkok = { bransle: 'multibransle' }
  const trangia = { bransle: 'sprit' }

  it('ger gaspatroner till gasbrännare med EN 417 eller utan angivet fäste', () => {
    expect(passarBransle(pocketRocket, patron)).toBe(true)
    expect(passarBransle(utanFaste, patron)).toBe(true)
    expect(passarBransle(stickpatron, patron)).toBe(false)
  })

  it('ger gaspatroner till multibränsle bara med EN 417, men bensin och fotogen alltid', () => {
    expect(passarBransle(whisperlite, patron)).toBe(true)
    expect(passarBransle(bensinkok, patron)).toBe(false)
    expect(passarBransle(bensinkok, { typ: 'bensin' })).toBe(true)
    expect(passarBransle(whisperlite, { typ: 'fotogen' })).toBe(true)
    expect(passarBransle(pocketRocket, { typ: 'bensin' })).toBe(false)
  })

  it('ger sprit till spritkök och fast bränsle till kök för fast bränsle', () => {
    expect(passarBransle(trangia, { typ: 'sprit' })).toBe(true)
    expect(passarBransle(trangia, patron)).toBe(false)
    expect(passarBransle({ bransle: 'fast_bransle' }, { typ: 'fast_bransle' })).toBe(true)
  })

  it('kopplar inte ved, annat eller saknade uppgifter', () => {
    expect(passarBransle({ bransle: 'ved' }, { typ: 'annat' })).toBe(false)
    expect(passarBransle(pocketRocket, { typ: 'annat' })).toBe(false)
    expect(passarBransle(null, patron)).toBe(false)
    expect(passarBransle(pocketRocket, undefined)).toBe(false)
  })

  const brannare = { id: 'pr', underkategori: 'brannare', egenskaper: pocketRocket, packvikt_g: 73 }
  const t27 = { id: 't27', underkategori: 'komplett_kok', egenskaper: { ...trangia, typ: 'stormkok' }, packvikt_g: 690 }
  const stor = { id: 'p450', underkategori: 'bransle', egenskaper: patron, packvikt_g: 650 }
  const liten = { id: 'p100', underkategori: 'bransle', egenskaper: patron, packvikt_g: 190 }
  const sprit = { id: 's', underkategori: 'bransle', egenskaper: { typ: 'sprit' }, packvikt_g: 900 }
  const billy = { id: 'b', underkategori: 'kastrull', egenskaper: { typ: 'kastrull' }, packvikt_g: 300 }
  const alla = [brannare, t27, stor, liten, sprit, billy]

  it('ger en brännare bränslet som passar, lättast först', () => {
    expect(bransleMed(brannare, alla).map((p) => p.id)).toEqual(['p100', 'p450'])
    expect(bransleMed(t27, alla).map((p) => p.id)).toEqual(['s'])
  })

  it('ger ett bränsle brännarna och köken det passar till', () => {
    expect(bransleMed(liten, alla).map((p) => p.id)).toEqual(['pr'])
    expect(bransleMed(sprit, alla).map((p) => p.id)).toEqual(['t27'])
    expect(bransleMed(billy, alla)).toEqual([])
  })

  it('har rubriker för brännare och bränsle, men inte för kokkärl', () => {
    expect(bransleRubrik('brannare')).toBe('Bränsle som passar')
    expect(bransleRubrik('bransle')).toBe('Brännare och kök det passar till')
    expect(bransleRubrik('kastrull')).toBeNull()
  })
})
