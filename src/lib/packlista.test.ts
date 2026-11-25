import { describe, expect, it } from 'vitest'
import { KATEGORIER } from './forrad'
import {
  dubbletter,
  dubblettSvar,
  dubblettText,
  egenModell,
  filtrera,
  FORSLAG_GEMENSAMT,
  forslagSomSaknas,
  packat,
  packradFranForslag,
  packradFranSak,
  passarRaden,
  perKategori,
  somPackar,
  statusKarta,
  utanBarare,
  viktrader,
} from './packlista'
import type { Forradssak, PackradRad, PackstatusRad } from './typer'
import { startvikter } from './vikt'

let n = 0
const rad = (r: Partial<PackradRad>): PackradRad => ({
  id: `r${n++}`,
  tur_id: 't',
  namn: 'Sak',
  kategori: 'ovrigt',
  underkategori: null,
  produkt_id: null,
  antal: 1,
  vikt_g: null,
  typ: 'ryggsack',
  bars_av: null,
  alla: false,
  gemensam: false,
  dubblett_ok: false,
  med: true,
  notering: null,
  sortering: 0,
  ...r,
})

describe('dubbletter', () => {
  it('hittar två kök, även när det ena är en brännare och det andra ett komplett kök', () => {
    const a = rad({ underkategori: 'brannare', bars_av: 'anna' })
    const o = rad({ underkategori: 'komplett_kok', bars_av: 'oscar' })
    expect(dubbletter([a, o, rad({ underkategori: 'talt', bars_av: 'anna' })])).toEqual([{ sort: 'kok', etikett: 'kök', rader: [a, o] }])
  })

  it('räknar antalet på en rad', () => {
    expect(dubbletter([rad({ underkategori: 'talt', antal: 2 })]).map((d) => d.sort)).toEqual(['talt'])
  })

  it('frågar inte om det man redan har svarat på, men igen när en ny rad läggs till', () => {
    const svarat = [rad({ underkategori: 'talt', dubblett_ok: true }), rad({ underkategori: 'talt', dubblett_ok: true })]
    expect(dubbletter(svarat)).toEqual([])
    expect(dubbletter([...svarat, rad({ underkategori: 'talt' })])).toHaveLength(1)
  })

  it('bryr sig inte om saker alla ska ha, saker som inte ska med eller sorter där flera är vanligt', () => {
    expect(dubbletter([rad({ underkategori: 'sovsack' }), rad({ underkategori: 'sovsack' })])).toEqual([])
    expect(dubbletter([rad({ underkategori: 'talt', alla: true }), rad({ underkategori: 'talt', alla: true })])).toEqual([])
    expect(dubbletter([rad({ underkategori: 'talt' }), rad({ underkategori: 'talt', med: false })])).toEqual([])
  })
})

describe('förslag på det gruppen behöver gemensamt', () => {
  it('föreslår allt när packlistan är tom', () => {
    expect(forslagSomSaknas([])).toEqual(FORSLAG_GEMENSAMT)
  })

  it('föreslår inte det som redan finns, och räknar ett komplett kök som kök', () => {
    const kvar = forslagSomSaknas([rad({ underkategori: 'talt', bars_av: 'anna' }), rad({ underkategori: 'komplett_kok' })])
    expect(kvar.map((f) => f.namn)).not.toContain('Tält')
    expect(kvar.map((f) => f.namn)).not.toContain('Kök')
    expect(kvar.map((f) => f.namn)).toContain('Gas')
  })

  it('har kategorier och underkategorier som finns i förrådet', () => {
    for (const f of FORSLAG_GEMENSAMT) {
      const k = KATEGORIER.find((x) => x.nyckel === f.kategori)
      expect(k?.under.some((u) => u.nyckel === f.underkategori), f.namn).toBe(true)
    }
  })
})

describe('gemensamma saker utan bärare', () => {
  it('är de gemensamma rader som ska med och som ingen tar med', () => {
    const kok = rad({ gemensam: true })
    expect(utanBarare([kok, rad({ gemensam: true, bars_av: 'anna' }), rad({ gemensam: true, med: false }), rad({})])).toEqual([kok])
  })
})

const anna = { id: 'anna', typ: 'person' as const }
const oscar = { id: 'oscar', typ: 'person' as const }
const bamse = { id: 'bamse', typ: 'hund' as const }
const bock = (r: PackradRad, deltagare: string, ovrigt: Partial<PackstatusRad> = {}): PackstatusRad => ({
  packrad_id: r.id,
  deltagare_id: deltagare,
  tur_id: 't',
  packad: true,
  namn: null,
  vikt_g: null,
  produkt_id: null,
  ...ovrigt,
})
const sak = (s: Partial<Forradssak>): Forradssak => ({
  id: 's',
  produkt_id: null,
  namn: 'Sak',
  kategori: 'ovrigt',
  underkategori: null,
  antal: 1,
  vikt_g: null,
  typ: 'ryggsack',
  notering: null,
  ...s,
})

describe('filter', () => {
  const egen = rad({ bars_av: 'anna' })
  const alla = rad({ alla: true })
  const gemensam = rad({ gemensam: true, bars_av: 'oscar' })
  const oscars = rad({ bars_av: 'oscar' })
  const rader = [egen, alla, gemensam, oscars]

  it('Min packning är det jag bär och det alla ska ha', () => {
    expect(filtrera(rader, 'min', 'anna')).toEqual([egen, alla])
    expect(filtrera(rader, 'min', null)).toEqual([])
  })

  it('Gemensamt är det som bärs åt gruppen, och Alla är allt', () => {
    expect(filtrera(rader, 'gemensamt', 'anna')).toEqual([gemensam])
    expect(filtrera(rader, 'alla', 'anna')).toEqual(rader)
  })
})

describe('kategorier', () => {
  it('följer förrådets ordning och sorterar raderna efter sortering och namn', () => {
    const k = perKategori([
      rad({ kategori: 'ovrigt', namn: 'Bok' }),
      rad({ kategori: 'sova', namn: 'Sovsäck', sortering: 1 }),
      rad({ kategori: 'sova', namn: 'Liggunderlag', sortering: 1 }),
      rad({ kategori: 'sova', namn: 'Kudde', sortering: 0 }),
    ])
    expect(k.map((x) => x.etikett)).toEqual(['Sova', 'Övrigt'])
    expect(k[0].rader.map((r) => r.namn)).toEqual(['Kudde', 'Liggunderlag', 'Sovsäck'])
  })
})

describe('bockar', () => {
  it('alla personer packar en rad som alla ska ha, annars den som bär den', () => {
    expect(somPackar(rad({ alla: true }), [anna, oscar, bamse])).toEqual(['anna', 'oscar'])
    expect(somPackar(rad({ bars_av: 'oscar' }), [anna, oscar])).toEqual(['oscar'])
    expect(somPackar(rad({ gemensam: true }), [anna, oscar])).toEqual([])
  })

  it('räknar hur mycket av det egna som är packat, utan det som inte ska med', () => {
    const a = rad({ bars_av: 'anna' })
    const b = rad({ alla: true })
    const c = rad({ bars_av: 'anna', med: false })
    const status = statusKarta([bock(a, 'anna'), bock(b, 'oscar')])
    expect(packat([a, b, c], status, anna)).toEqual({ packat: 1, totalt: 2 })
    expect(packat([a, b, c], status, oscar)).toEqual({ packat: 1, totalt: 1 })
  })
})

describe('vikter från packlistan', () => {
  it('räknar var och ens egen sovsäck och den gemensamma saken på den som bär den', () => {
    const sovsack = rad({ alla: true, vikt_g: 1000 })
    const talt = rad({ gemensam: true, bars_av: 'oscar', vikt_g: 1800 })
    const v = startvikter(viktrader([sovsack, talt], [bock(sovsack, 'anna', { vikt_g: 780 })]), [
      { ...anna, matandel: null },
      { ...oscar, matandel: null },
    ], new Map())
    expect(v.get('anna')!.bas).toBe(780)
    expect(v.get('oscar')!.bas).toBe(2800)
  })
})

describe('nya rader', () => {
  it('kopierar namn, vikt och kategori från förrådet och sätter vem som bär', () => {
    const s = sak({ namn: 'Nemo Hornet', kategori: 'talt', underkategori: 'talt', vikt_g: 900, produkt_id: 'p1' })
    expect(packradFranSak(s, 't', { som: 'jag', id: 'anna' })).toMatchObject({
      tur_id: 't', namn: 'Nemo Hornet', kategori: 'talt', underkategori: 'talt', vikt_g: 900, produkt_id: 'p1', bars_av: 'anna', alla: false, gemensam: false,
    })
    expect(packradFranSak(s, 't', { som: 'gemensam', id: 'anna' })).toMatchObject({ bars_av: 'anna', gemensam: true, alla: false })
    expect(packradFranSak(s, 't', { som: 'alla' })).toMatchObject({ bars_av: null, gemensam: false, alla: true })
  })

  it('gör ett förslag till en gemensam rad som ingen bär', () => {
    expect(packradFranForslag(FORSLAG_GEMENSAMT[0], 't')).toMatchObject({ namn: 'Tält', gemensam: true, bars_av: null, alla: false, vikt_g: null })
  })

  it('sparar ens egen modell på en rad som alla ska ha', () => {
    const r = rad({ alla: true })
    expect(egenModell(sak({ namn: 'Mammut', vikt_g: 980, produkt_id: 'p2' }), r, 'anna')).toEqual({
      packrad_id: r.id, deltagare_id: 'anna', tur_id: 't', namn: 'Mammut', vikt_g: 980, produkt_id: 'p2',
    })
  })

  it('föreslår förrådets saker i samma kategori, samma underkategori först', () => {
    const r = rad({ alla: true, kategori: 'sova', underkategori: 'sovsack' })
    const saker = [
      sak({ id: '1', namn: 'Underlag', kategori: 'sova', underkategori: 'liggunderlag' }),
      sak({ id: '2', namn: 'Sovsäck', kategori: 'sova', underkategori: 'sovsack' }),
      sak({ id: '3', namn: 'Tält', kategori: 'talt' }),
    ]
    expect(passarRaden(saker, r).map((s) => s.id)).toEqual(['2', '1'])
  })
})


describe('frågan om dubbletter', () => {
  const namn = new Map([['anna', 'Anna'], ['oscar', 'Oscar'], ['pichi', 'Pichi']])
  const forsta = (rader: PackradRad[]) => dubbletter(rader)[0]
  const fraga = (rader: PackradRad[]) => dubblettText(forsta(rader), namn)

  it('säger vilka som tar med en var', () => {
    expect(fraga([rad({ underkategori: 'brannare', bars_av: 'anna' }), rad({ underkategori: 'komplett_kok', bars_av: 'oscar' })])).toBe(
      'Kök: Anna och Oscar tar med en var. Behövs båda?',
    )
    expect(
      fraga([rad({ underkategori: 'forband', bars_av: 'anna' }), rad({ underkategori: 'forband', bars_av: 'oscar' }), rad({ underkategori: 'forband', bars_av: 'pichi' })]),
    ).toBe('Förbandslåda: Anna, Oscar och Pichi tar med en var. Behövs alla tre?')
  })

  it('säger när samma person tar med flera, och när några inte har någon som tar med dem', () => {
    expect(fraga([rad({ underkategori: 'talt', bars_av: 'anna', antal: 3 })])).toBe('Tält: 3 i listan, och Anna tar med dem. Behövs alla tre?')
    expect(fraga([rad({ underkategori: 'brannare', bars_av: 'anna' }), rad({ underkategori: 'brannare', gemensam: true })])).toBe(
      'Kök: Anna tar med en, och en till har ingen tagit på sig. Behövs båda?',
    )
    expect(fraga([rad({ underkategori: 'karta', gemensam: true }), rad({ underkategori: 'karta', gemensam: true })])).toBe(
      'Karta och kompass: 2 i listan, som ingen tar med ännu. Behövs båda?',
    )
  })

  it('svarar med samma antal som frågan', () => {
    expect(dubblettSvar(forsta([rad({ underkategori: 'talt', antal: 2 })]))).toBe('Ja, båda behövs')
    expect(dubblettSvar(forsta([rad({ underkategori: 'talt', antal: 2 }), rad({ underkategori: 'talt' })]))).toBe('Ja, alla behövs')
  })
})
