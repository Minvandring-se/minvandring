import { describe, expect, it } from 'vitest'
import { handlagrupper, handlingslista, matviktPerBarare, matviktPerDeltagare, summeraMangder } from './handlingslista'
import { matdagar, type Matdata, type Pase } from './mat'
import type { Ingrediens, InkopKlart, Maltidsrad, Ratt, Vara } from './typer'

describe('summeraMangder', () => {
  it('räknar om vikt mellan g och kg och volym mellan ml, dl och l', () => {
    expect(summeraMangder([{ mangd: 600, enhet: 'g' }, { mangd: 0.6, enhet: 'kg' }])).toBe('1,2 kg')
    expect(summeraMangder([{ mangd: 450, enhet: 'g' }])).toBe('450 g')
    expect(summeraMangder([{ mangd: 3, enhet: 'dl' }, { mangd: 300, enhet: 'ml' }])).toBe('6 dl')
    expect(summeraMangder([{ mangd: 8, enhet: 'dl' }, { mangd: 4, enhet: 'dl' }])).toBe('1,2 l')
    expect(summeraMangder([{ mangd: 50, enhet: 'ml' }])).toBe('50 ml')
    // Avrundas före jämförelsen, så att 999,6 g blir 1 kg och inte 1000 g.
    expect(summeraMangder([{ mangd: 999.6, enhet: 'g' }])).toBe('1 kg')
    expect(summeraMangder([{ mangd: 99.996, enhet: 'ml' }])).toBe('1 dl')
    expect(summeraMangder([{ mangd: 999.996, enhet: 'ml' }])).toBe('1 l')
    // Mindre än det som går att visa blir aldrig 0.
    expect(summeraMangder([{ mangd: 0.4, enhet: 'g' }])).toBe('1 g')
    expect(summeraMangder([{ mangd: 0.004, enhet: 'ml' }])).toBe('0,01 ml')
  })

  it('lämnar msk, tsk, krm och st som de är, och räknar ihop dem var för sig', () => {
    expect(summeraMangder([{ mangd: 2, enhet: 'dl' }, { mangd: 1, enhet: 'msk' }, { mangd: 1, enhet: 'msk' }, { mangd: 3, enhet: 'st' }, { mangd: 1.5, enhet: 'krm' }])).toBe(
      '2 dl, 3 st, 2 msk och 1,5 krm',
    )
    expect(summeraMangder([])).toBe('')
  })
})

describe('handlingslista', () => {
  const dagar = matdagar(2, 0)
  const personer = ['anna', 'erik', 'lisa']
  const ratt = (id: string, extra: Partial<Ratt> = {}): Ratt => ({ id, namn: id, matprodukt_id: null, ansvarig: null, klart: false, ...extra })
  const vara = (id: string, extra: Partial<Vara> = {}): Vara => ({
    id,
    namn: id,
    kcal_per_100g: null,
    protein_per_100g: null,
    extra_g: 0,
    varifran: 'kopa',
    ansvarig: null,
    klart: false,
    ...extra,
  })
  const ing = (ratt_id: string, vara_id: string, mangd: number | null, enhet: Ingrediens['enhet'], gram: number | null = null): Ingrediens => ({
    id: `${ratt_id}-${vara_id}`,
    ratt_id,
    vara_id,
    mangd,
    enhet,
    gram_per_portion: gram,
  })
  const rad = (id: string, dag: number, ratt_id: string, bars_av: string | null): Maltidsrad => ({ id, dag, maltid: 'middag', ratt_id, sortering: 0, bars_av })
  const pase: Pase = { id: 'mp', vikt_torr_g: 150, portioner: 2, kcal: 600, protein_g: 20 }

  const data = (maltider: Maltidsrad[], extra: Partial<Matdata & { klart: InkopKlart[] }> = {}): Matdata & { klart: InkopKlart[] } => ({
    ratter: [ratt('Pannkakor'), ratt('Gröt'), ratt('Påse', { matprodukt_id: 'mp' })],
    varor: [vara('Mjölk'), vara('Ägg'), vara('Salt'), vara('Havregryn'), vara('Kaffe', { extra_g: 200, ansvarig: 'erik' })],
    ingredienser: [
      ing('Pannkakor', 'Mjölk', 3, 'dl', 300),
      ing('Pannkakor', 'Ägg', 1, 'st'),
      ing('Pannkakor', 'Salt', null, null),
      ing('Gröt', 'Havregryn', 90, 'g', 90),
      ing('Gröt', 'Mjölk', 1, 'dl', 100),
    ],
    pasar: new Map([['mp', pase]]),
    maltider,
    klart: [],
    ...extra,
  })
  const hitta = (rader: ReturnType<typeof handlingslista>, namn: string, kopare: string | null) => rader.find((r) => r.namn === namn && r.kopare === kopare)

  it('köps av den som bär raden, i så många portioner som det är personer som äter', () => {
    const rader = handlingslista(data([rad('m1', 1, 'Pannkakor', 'anna'), rad('m2', 2, 'Gröt', 'anna')]), dagar, personer)
    // Mjölk i båda rätterna för tre personer: 9 dl och 3 dl blir 1,2 l.
    expect(hitta(rader, 'Mjölk', 'anna')).toMatchObject({ mangd: '1,2 l', gram: 1200, avdelning: 'mejeri' })
    expect(hitta(rader, 'Ägg', 'anna')).toMatchObject({ mangd: '3 st', gram: 0 })
    expect(hitta(rader, 'Havregryn', 'anna')).toMatchObject({ mangd: '270 g', avdelning: 'torrvaror' })
    // Salt utan mängd står med, men utan mängd.
    expect(hitta(rader, 'Salt', 'anna')).toMatchObject({ mangd: '' })
  })

  it('ger samma vara två rader när två personer bär rätter med den, och bockarna gäller var för sig', () => {
    const rader = handlingslista(
      data([rad('m1', 1, 'Pannkakor', 'anna'), rad('m2', 2, 'Gröt', 'erik')], { klart: [{ deltagare_id: 'erik', vara_id: 'Mjölk', ratt_id: null }] }),
      dagar,
      personer,
    )
    expect(hitta(rader, 'Mjölk', 'anna')).toMatchObject({ mangd: '9 dl', klart: false })
    expect(hitta(rader, 'Mjölk', 'erik')).toMatchObject({ mangd: '3 dl', klart: true })
  })

  it('räknar efter dem som äter, och lägger det som ingen bär hos ingen, som inte kan bockas av', () => {
    const rader = handlingslista(
      data([rad('m1', 1, 'Pannkakor', null)], { atare: [{ maltid_id: 'm1', deltagare_id: 'lisa' }], klart: [{ deltagare_id: 'anna', vara_id: 'Mjölk', ratt_id: null }] }),
      dagar,
      personer,
    )
    expect(hitta(rader, 'Mjölk', null)).toMatchObject({ mangd: '3 dl', klart: false })
  })

  it('räknar påsar i hela påsar under Friluftsmat, och tar med extra mängd hos varans ansvariga', () => {
    const rader = handlingslista(data([rad('m1', 1, 'Påse', 'lisa')], { klart: [{ deltagare_id: 'lisa', vara_id: null, ratt_id: 'Påse' }] }), dagar, personer)
    expect(hitta(rader, 'Påse', 'lisa')).toMatchObject({ typ: 'pase', pasar: 2, mangd: '2 påsar', gram: 300, avdelning: 'friluft', klart: true, matproduktId: 'mp' })
    expect(hitta(rader, 'Kaffe', 'erik')).toMatchObject({ mangd: '200 g', avdelning: 'dryck' })
  })

  it('visar en rad som oavbockad när mängden har ändrats sedan den bockades av', () => {
    // Anna bockade av havregryn vid 90 g. Sedan lades gröten i en måltid till, så nu ska hon köpa 270 g.
    const klart = [{ deltagare_id: 'anna', vara_id: 'Havregryn', ratt_id: null, mangd: '90 g' }]
    const en = handlingslista(data([rad('m1', 1, 'Gröt', 'anna')], { klart }), dagar, ['anna'])
    expect(hitta(en, 'Havregryn', 'anna')).toMatchObject({ mangd: '90 g', klart: true, andradFran: null })
    const tre = handlingslista(data([rad('m1', 1, 'Gröt', 'anna'), rad('m2', 2, 'Gröt', 'anna'), { ...rad('m3', 2, 'Gröt', 'anna'), maltid: 'frukost' }], { klart }), dagar, ['anna'])
    expect(hitta(tre, 'Havregryn', 'anna')).toMatchObject({ mangd: '270 g', klart: false, andradFran: '90 g' })
  })

  it('räknar en gammal bock utan sparad mängd som avbockad', () => {
    const rader = handlingslista(data([rad('m1', 1, 'Gröt', 'anna')], { klart: [{ deltagare_id: 'anna', vara_id: 'Havregryn', ratt_id: null, mangd: null }] }), dagar, ['anna'])
    expect(hitta(rader, 'Havregryn', 'anna')).toMatchObject({ klart: true, andradFran: null })
  })

  it('visar en påse som oavbockad när antalet påsar har ändrats', () => {
    const klart = [{ deltagare_id: 'lisa', vara_id: null, ratt_id: 'Påse', mangd: '1 påse' }]
    const rader = handlingslista(data([rad('m1', 1, 'Påse', 'lisa')], { klart }), dagar, personer)
    expect(hitta(rader, 'Påse', 'lisa')).toMatchObject({ mangd: '2 påsar', klart: false, andradFran: '1 påse' })
  })

  it('säger om avdelningen är vald eller gissad', () => {
    const vald = data([rad('m1', 1, 'Gröt', 'anna')], { varor: [{ id: 'Havregryn', namn: 'Havregryn', kcal_per_100g: null, protein_per_100g: null, extra_g: 0, varifran: 'kopa', ansvarig: null, klart: false, avdelning: 'fryst' }] })
    expect(hitta(handlingslista(vald, dagar, personer), 'Havregryn', 'anna')).toMatchObject({ avdelning: 'fryst', avdelningVald: true })
    expect(hitta(handlingslista(data([rad('m1', 1, 'Gröt', 'anna')]), dagar, personer), 'Havregryn', 'anna')).toMatchObject({ avdelning: 'torrvaror', avdelningVald: false })
  })

  it('räknar bara rader inom turens dagar', () => {
    expect(handlingslista(data([rad('m1', 9, 'Gröt', 'anna')]), dagar, personer).filter((r) => r.namn !== 'Kaffe')).toEqual([])
  })
})

describe('handlagrupper', () => {
  const r = (namn: string, kopare: string | null, avdelning: 'mejeri' | 'torrvaror') => ({
    nyckel: `${kopare}:${namn}`,
    typ: 'vara' as const,
    id: namn,
    namn,
    kopare,
    avdelning,
    avdelningVald: false,
    mangd: '',
    gram: 0,
    hemifran: false,
    klart: false,
    andradFran: null,
  })

  it('grupperar per köpare i deltagarnas ordning med ingen sist, och per avdelning i butikens ordning', () => {
    const grupper = handlagrupper([r('Pasta', null, 'torrvaror'), r('Ris', 'erik', 'torrvaror'), r('Mjölk', 'erik', 'mejeri'), r('Grädde', 'erik', 'mejeri'), r('Ost', 'anna', 'mejeri')], [
      'anna',
      'erik',
      'lisa',
    ])
    expect(grupper.map((g) => g.kopare)).toEqual(['anna', 'erik', null])
    expect(grupper[1].avdelningar.map((a) => [a.avdelning, a.rader.map((x) => x.namn)])).toEqual([
      ['mejeri', ['Grädde', 'Mjölk']],
      ['torrvaror', ['Ris']],
    ])
  })
})

describe('matvikten per bärare', () => {
  const dagar = matdagar(2, 0)
  const ratt = (id: string, extra: Partial<Ratt> = {}): Ratt => ({ id, namn: id, matprodukt_id: null, ansvarig: null, klart: false, ...extra })
  const vara: Vara = { id: 'Havregryn', namn: 'Havregryn', kcal_per_100g: 370, protein_per_100g: 13, extra_g: 0, varifran: 'kopa', ansvarig: null, klart: false }
  const rad = (id: string, dag: number, ratt_id: string, bars_av: string | null): Maltidsrad => ({ id, dag, maltid: 'middag', ratt_id, sortering: 0, bars_av })
  // En påse med två portioner på 300 g, och gröt med 100 g havregryn per portion.
  const pase: Pase = { id: 'mp', vikt_torr_g: 300, portioner: 2, kcal: 1200, protein_g: 40 }
  const data = (maltider: Maltidsrad[], atare: Matdata['atare'] = []): Matdata => ({
    ratter: [ratt('Gröt'), ratt('Gryta', { matprodukt_id: 'mp' })],
    varor: [vara],
    ingredienser: [{ id: 'i1', ratt_id: 'Gröt', vara_id: 'Havregryn', mangd: 100, enhet: 'g', gram_per_portion: 100 }],
    pasar: new Map([['mp', pase]]),
    maltider,
    atare,
  })

  it('räknar hela påsar, samma som inköpslistan', () => {
    // Tre personer äter en påse med två portioner: två hela påsar, 600 g, inte tre portioner på 450 g.
    const vikt = matviktPerBarare(data([rad('m1', 1, 'Gryta', 'anna')]), dagar, ['anna', 'erik', 'lisa'])
    expect(vikt).toEqual({ perBarare: new Map([['anna', 600]]), inteFordelat: 0, totalt: 600 })
  })

  it('visar det som ingen bär för sig', () => {
    const vikt = matviktPerBarare(data([rad('m1', 1, 'Gröt', 'anna'), rad('m2', 2, 'Gryta', null)]), dagar, ['anna', 'erik'])
    expect(vikt).toEqual({ perBarare: new Map([['anna', 200]]), inteFordelat: 300, totalt: 500 })
  })

  it('räknar bara dem som äter, så att en rätt som bara Anna äter inte väger hos någon annan', () => {
    const vikt = matviktPerBarare(data([rad('m1', 1, 'Gröt', 'anna')], [{ maltid_id: 'm1', deltagare_id: 'anna' }]), dagar, ['anna', 'erik'])
    expect(vikt.perBarare).toEqual(new Map([['anna', 100]]))
    expect(vikt.totalt).toBe(100)
  })

  it('räknar påsar för sig per bärare, eftersom var och en köper sina', () => {
    // Anna och Erik bär en portion var av en påse med två portioner: en påse var.
    const vikt = matviktPerBarare(data([rad('m1', 1, 'Gryta', 'anna'), rad('m2', 2, 'Gryta', 'erik')], [{ maltid_id: 'm1', deltagare_id: 'anna' }, { maltid_id: 'm2', deltagare_id: 'erik' }]), dagar, ['anna', 'erik'])
    expect(vikt.perBarare).toEqual(new Map([['anna', 300], ['erik', 300]]))
  })

  it('räknar extra mängd hos den som köper den, som i inköpslistan, och en hund som bärare för sig', () => {
    const med = { ...data([rad('m1', 1, 'Gröt', 'hund')]), varor: [{ ...vara, extra_g: 50, ansvarig: 'erik' }] }
    const vikt = matviktPerBarare(med, dagar, ['anna', 'erik'])
    expect(vikt.perBarare).toEqual(new Map([['hund', 200], ['erik', 50]]))
    expect(vikt.totalt).toBe(250)
  })

  describe('matviktPerDeltagare, för startvikten i packlistan', () => {
    const anna = { id: 'anna', typ: 'person' as const, matandel: null }
    const erik = { id: 'erik', typ: 'person' as const, matandel: null }
    const hund = { id: 'hund', typ: 'hund' as const, matandel: null, hundmatPerDagG: 300 }

    it('räknar det var och en bär och delar det som ingen bär ännu efter matandelarna', () => {
      const vikt = matviktPerDeltagare(data([rad('m1', 1, 'Gröt', 'anna'), rad('m2', 2, 'Gryta', null)]), [anna, erik], dagar)
      expect(vikt).toEqual(new Map([['anna', 200 + 150], ['erik', 150]]))
    })

    it('lägger till hundens egen mat', () => {
      const vikt = matviktPerDeltagare(data([rad('m1', 1, 'Gröt', 'anna')]), [anna, erik, hund], dagar)
      expect(vikt.get('hund')).toBe(300 * 2)
      expect(vikt.get('anna')).toBe(200)
    })
  })
})
