import { describe, expect, it } from 'vitest'
import { KATEGORIER } from './forrad'
import { dubbletter, FORSLAG_GEMENSAMT, forslagSomSaknas, utanBarare } from './packlista'
import type { PackradRad } from './typer'

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
