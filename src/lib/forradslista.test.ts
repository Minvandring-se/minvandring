import { describe, expect, it } from 'vitest'
import { FORVALDA_VAL, adressFranVal, filtrera, harVal, kategorierIForradet, matcharSok, sortera, valFranAdress } from './forradslista'
import type { Forradssak } from './typer'

function sak(delar: Partial<Forradssak>): Forradssak {
  return { id: delar.namn ?? 'x', produkt_id: null, namn: 'Sak', kategori: 'ovrigt', underkategori: null, antal: 1, vikt_g: null, typ: 'ryggsack', notering: null, ...delar }
}

const produkt = (marke: string, version: string | null) => ({
  id: 'p',
  marke,
  modell: 'M',
  packvikt_g: 1,
  kontrollerad: null,
  granskad: null,
  kalla_typ: 'tillverkare' as const,
  version,
  underkategori: 'talt',
  minvikt_g: null,
  kalla: 'https://exempel.se',
  egenskaper: {},
})

const akto = sak({ namn: 'Hilleberg Akto', kategori: 'talt', vikt_g: 1700, skapad: '2026-11-01T10:00:00Z', produkter: produkt('Hilleberg', 'Red Label') })
const sovsack = sak({ namn: 'Neutrino', kategori: 'sova', vikt_g: 870, skapad: '2026-11-03T10:00:00Z', notering: 'Vintersäcken', produkter: produkt('Rab', 'Regular') })
const flaskor = sak({ namn: 'Flaska', kategori: 'vatten', vikt_g: 150, antal: 3, skapad: '2026-11-02T10:00:00Z' })
const kniv = sak({ namn: 'Kniv', kategori: 'verktyg', vikt_g: null, skapad: '2026-11-04T10:00:00Z' })
const karta = sak({ namn: 'Karta', kategori: 'sakerhet', vikt_g: null })
const alla = [akto, sovsack, flaskor, kniv, karta]
const namn = (lista: Forradssak[]) => lista.map((s) => s.namn)

describe('matcharSok', () => {
  it('söker i namnet utan hänsyn till stora och små bokstäver', () => {
    expect(matcharSok(akto, 'akto')).toBe(true)
    expect(matcharSok(akto, 'AKT')).toBe(true)
    expect(matcharSok(akto, 'nallo')).toBe(false)
  })

  it('söker i märke, version och anteckning', () => {
    expect(matcharSok(sovsack, 'rab')).toBe(true)
    expect(matcharSok(sovsack, 'regular')).toBe(true)
    expect(matcharSok(sovsack, 'vinter')).toBe(true)
    expect(matcharSok(akto, 'red label')).toBe(true)
  })

  it('kräver att alla ord finns, var som helst', () => {
    expect(matcharSok(sovsack, 'rab vinter')).toBe(true)
    expect(matcharSok(sovsack, 'rab sommar')).toBe(false)
  })

  it('matchar allt när söktexten är tom', () => {
    expect(matcharSok(karta, '')).toBe(true)
    expect(matcharSok(karta, '   ')).toBe(true)
  })

  it('klarar en egen sak utan produkt och anteckning', () => {
    expect(matcharSok(kniv, 'kniv')).toBe(true)
    expect(matcharSok(kniv, 'mora')).toBe(false)
  })
})

describe('filtrera', () => {
  it('visar allt utan val', () => {
    expect(filtrera(alla, FORVALDA_VAL)).toEqual(alla)
  })

  it('visar bara en kategori', () => {
    expect(namn(filtrera(alla, { sok: '', kategori: 'sova' }))).toEqual(['Neutrino'])
    expect(filtrera(alla, { sok: '', kategori: 'kok' })).toEqual([])
  })

  it('kombinerar kategori och sökning', () => {
    expect(namn(filtrera(alla, { sok: 'rab', kategori: 'sova' }))).toEqual(['Neutrino'])
    expect(filtrera(alla, { sok: 'rab', kategori: 'talt' })).toEqual([])
  })

  it('räknar en sak med okänd kategori som Övrigt', () => {
    const gammal = sak({ namn: 'Gammal', kategori: 'finns-inte' })
    expect(namn(filtrera([gammal, akto], { sok: '', kategori: 'ovrigt' }))).toEqual(['Gammal'])
  })

  it('ändrar inte listan den får in', () => {
    const lista = [...alla]
    filtrera(lista, { sok: 'a', kategori: '' })
    expect(lista).toEqual(alla)
  })
})

describe('sortera', () => {
  it('tyngst först räknar antal gånger vikt, med saker utan vikt sist', () => {
    expect(namn(sortera(alla, 'tyngst'))).toEqual(['Hilleberg Akto', 'Neutrino', 'Flaska', 'Karta', 'Kniv'])
  })

  it('lättast först har också saker utan vikt sist', () => {
    expect(namn(sortera(alla, 'lattast'))).toEqual(['Flaska', 'Neutrino', 'Hilleberg Akto', 'Karta', 'Kniv'])
  })

  it('sorterar lika tunga saker på namn', () => {
    const a = sak({ namn: 'Bestick', vikt_g: 50 })
    const b = sak({ namn: 'Ask', vikt_g: 50 })
    expect(namn(sortera([a, b], 'tyngst'))).toEqual(['Ask', 'Bestick'])
    expect(namn(sortera([a, b], 'lattast'))).toEqual(['Ask', 'Bestick'])
  })

  it('namn sorterar på svenska, med å, ä och ö sist och siffror som tal', () => {
    const lista = [sak({ namn: 'Öl' }), sak({ namn: 'Tält 10' }), sak({ namn: 'Ask' }), sak({ namn: 'Tält 2' }), sak({ namn: 'Ärm' })]
    expect(namn(sortera(lista, 'namn'))).toEqual(['Ask', 'Tält 2', 'Tält 10', 'Ärm', 'Öl'])
  })

  it('senast tillagd har den nyaste först, och saker utan datum sist', () => {
    expect(namn(sortera(alla, 'senast'))).toEqual(['Kniv', 'Neutrino', 'Flaska', 'Hilleberg Akto', 'Karta'])
  })

  it('ändrar inte listan den får in', () => {
    const lista = [...alla]
    sortera(lista, 'tyngst')
    expect(lista).toEqual(alla)
  })
})

describe('valen i adressen', () => {
  const las = (fraga: string) => valFranAdress(new URLSearchParams(fraga))

  it('ger förvalen för en adress utan val', () => {
    expect(las('')).toEqual(FORVALDA_VAL)
    expect(adressFranVal(FORVALDA_VAL)).toEqual({})
    expect(harVal(FORVALDA_VAL)).toBe(false)
  })

  it('läser söktext, sortering och kategori', () => {
    expect(las('q=akto&sortera=tyngst&kategori=talt')).toEqual({ sok: 'akto', sortering: 'tyngst', kategori: 'talt' })
  })

  it('skriver bara det som skiljer sig från förvalen', () => {
    expect(adressFranVal({ sok: 'akto', sortering: 'kategori', kategori: '' })).toEqual({ q: 'akto' })
    expect(adressFranVal({ sok: '', sortering: 'namn', kategori: 'sova' })).toEqual({ sortera: 'namn', kategori: 'sova' })
    expect(adressFranVal({ sok: '   ', sortering: 'kategori', kategori: '' })).toEqual({})
    expect(harVal({ sok: '', sortering: 'lattast', kategori: '' })).toBe(true)
  })

  it('går runt: det som skrivs till adressen läses tillbaka likadant', () => {
    const val = { sok: 'röd säck', sortering: 'senast', kategori: 'packning' } as const
    expect(valFranAdress(new URLSearchParams(adressFranVal(val)))).toEqual(val)
  })

  it('byter okända värden mot förvalen', () => {
    expect(las('sortera=dyrast&kategori=Tält')).toEqual(FORVALDA_VAL)
    expect(las('sortera=toString')).toEqual(FORVALDA_VAL)
  })

  it('kortar en orimligt lång söktext', () => {
    expect(las(`q=${'a'.repeat(500)}`).sok).toHaveLength(80)
  })
})

describe('kategorierIForradet', () => {
  it('ger kategorierna som har saker, i visningsordning', () => {
    expect(kategorierIForradet(alla).map((k) => k.nyckel)).toEqual(['talt', 'sova', 'vatten', 'sakerhet', 'verktyg'])
    expect(kategorierIForradet(alla)[0].etikett).toBe('Tält och vindskydd')
  })

  it('ger en tom lista för ett tomt förråd', () => {
    expect(kategorierIForradet([])).toEqual([])
  })
})
