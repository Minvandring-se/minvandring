import { describe, expect, it } from 'vitest'
import { arKok, arKokdel, kokForDel, kokdelar, kokensVikt, kokkandidater, medKoket, taBortFraga } from './forradskok'
import type { Forradssak } from './typer'

function sak(id: string, underkategori: string, ovrigt: Partial<Forradssak> = {}, egenskaper?: Record<string, unknown>): Forradssak {
  return {
    id,
    produkt_id: egenskaper ? `p-${id}` : null,
    namn: id,
    kategori: 'kok',
    underkategori,
    antal: 1,
    vikt_g: 100,
    typ: underkategori === 'bransle' ? 'forbrukas' : 'ryggsack',
    notering: null,
    kok_id: null,
    produkter: egenskaper
      ? { id: `p-${id}`, marke: 'M', modell: id, packvikt_g: 100, kontrollerad: null, granskad: null, kalla_typ: 'tillverkare', version: null, underkategori, minvikt_g: null, kalla: 'https://exempel.se', egenskaper }
      : null,
    ...ovrigt,
  }
}

const brannare = sak('brannare', 'brannare', {}, { typ: 'toppmonterat', bransle: 'gas' })

describe('arKok och arKokdel', () => {
  it('brännare och kompletta kök är kök, kokkärl och bränsle är delar', () => {
    expect(arKok(sak('a', 'brannare'))).toBe(true)
    expect(arKok(sak('a', 'komplett_kok'))).toBe(true)
    expect(arKok(sak('a', 'kastrull'))).toBe(false)
    expect(arKokdel(sak('a', 'kastrull'))).toBe(true)
    expect(arKokdel(sak('a', 'bransle'))).toBe(true)
    expect(arKokdel(sak('a', 'kasa'))).toBe(false)
  })
})

describe('kokdelar och kokForDel', () => {
  it('hittar delarna, kokkärlen före bränslet', () => {
    const gas = sak('gas', 'bransle', { kok_id: 'brannare' })
    const kastrull = sak('kastrull', 'kastrull', { kok_id: 'brannare' })
    const annan = sak('annan', 'kastrull', { kok_id: 'x' })
    const saker = [brannare, gas, kastrull, annan]
    expect(kokdelar(brannare, saker).map((s) => s.id)).toEqual(['kastrull', 'gas'])
    expect(kokForDel(gas, saker)?.id).toBe('brannare')
    expect(kokForDel(sak('lös', 'kastrull'), saker)).toBeNull()
  })
})

describe('kokkandidater', () => {
  it('visar det som passar, det som inte går att bedöma för sig, och inte det som inte passar', () => {
    const latt = sak('latt', 'kastrull', { vikt_g: 80 }, {})
    const tung = sak('tung', 'kastrull', { vikt_g: 400 }, {})
    const gas = sak('gas', 'bransle', {}, { typ: 'skruvpatron' })
    const sprit = sak('sprit', 'bransle', {}, { typ: 'sprit' })
    const egen = sak('egen', 'kastrull')
    const upptagen = sak('upptagen', 'kastrull', { kok_id: 'annat' }, {})
    const kasa = sak('kasa', 'kasa', {}, {})
    const r = kokkandidater(brannare, [brannare, tung, latt, gas, sprit, egen, upptagen, kasa])
    expect(r.passar.map((s) => s.id)).toEqual(['latt', 'gas', 'tung'])
    expect(r.ovriga.map((s) => s.id)).toEqual(['egen'])
  })

  it('ett kök man har skrivit in själv kan inte bedömas, så allt ledigt kommer i ovriga', () => {
    const egetKok = sak('eget', 'brannare')
    const r = kokkandidater(egetKok, [egetKok, sak('k', 'kastrull', {}, {}), sak('g', 'bransle')])
    expect(r.passar).toEqual([])
    expect(r.ovriga.map((s) => s.id)).toEqual(['k', 'g'])
  })
})

describe('kokensVikt', () => {
  it('räknar köket och delarna med antal, och räknar det som saknar vikt', () => {
    const delar = [sak('k', 'kastrull', { vikt_g: 250 }), sak('g', 'bransle', { vikt_g: 390, antal: 2 }), sak('x', 'kastrull', { vikt_g: null })]
    expect(kokensVikt(brannare, delar)).toEqual({ viktG: 100 + 250 + 780, utanVikt: 1 })
  })
})

describe('medKoket', () => {
  it('tar med delarna när köket väljs', () => {
    const saker = [{ id: 'b', kok_id: null }, { id: 'k', kok_id: 'b' }, { id: 'g', kok_id: 'b' }, { id: 'z', kok_id: 'y' }]
    expect(medKoket('b', saker)).toEqual(['b', 'k', 'g'])
    expect(medKoket('z', saker)).toEqual(['z'])
  })
})

describe('taBortFraga', () => {
  const kok = sak('Primus', 'brannare')
  const kastrull = sak('Kastrull', 'kokkarl', { kok_id: 'Primus' })
  const gas = sak('Gas', 'bransle', { kok_id: 'Primus' })
  const grundfraga = (namn: string) => `Ta bort ${namn} ur ditt förråd? Turer där den redan ligger i packlistan påverkas inte.`

  it('en vanlig sak får bara frågan', () => {
    expect(taBortFraga(sak('Kniv', 'ovrigt'), [])).toBe(grundfraga('Kniv'))
  })

  it('ett kök säger att delarna finns kvar', () => {
    expect(taBortFraga(kok, [kok, kastrull, gas])).toBe(`${grundfraga('Primus')} De 2 delarna i köket finns kvar i förrådet.`)
    expect(taBortFraga(kok, [kok, gas])).toBe(`${grundfraga('Primus')} Delen i köket finns kvar i förrådet.`)
    expect(taBortFraga(kok, [kok])).toBe(grundfraga('Primus'))
  })

  it('en del säger vilket kök den lämnar', () => {
    expect(taBortFraga(gas, [kok, gas])).toBe(`${grundfraga('Gas')} Den tas också bort ur köket Primus.`)
  })
})
