import { describe, expect, it } from 'vitest'
import type { KatalogProdukt } from './katalogimport'
import { andraKolumn, checklista, dragStickprov, godkandILogg, lasNycklar, radnyckel, stickprovsstorlek, stickprovskandidater } from './katalogstickprov'

function produkt(marke: string, modell: string, delar: Partial<KatalogProdukt> = {}): KatalogProdukt {
  return {
    marke,
    modell,
    version: null,
    kategori: 'talt',
    underkategori: 'talt',
    packvikt_g: 1000,
    minvikt_g: null,
    pris_sek_ca: null,
    ean: null,
    kalla: `https://exempel.se/${marke}/${modell}`,
    kontrollerad: null,
    granskad: '2026-11-25',
    kalla_typ: 'tillverkare',
    genomgang: '2026-11-22-xxl-talt',
    egenskaper: {},
    ...delar,
  }
}

/** n rader fördelade på m märken. */
function rader(n: number, m: number): KatalogProdukt[] {
  return Array.from({ length: n }, (_, i) => produkt(`Märke ${i % m}`, `Modell ${i}`))
}

describe('stickprovsstorlek', () => {
  it.each([
    [3, 2, 3],
    [20, 2, 5],
    [100, 3, 5],
    [200, 4, 10],
    [101, 3, 6],
    [30, 8, 8],
    [30, 15, 10],
  ])('%i rader och %i märken ger %i i stickprovet', (n, m, forvantat) => {
    expect(stickprovsstorlek(n, m)).toBe(forvantat)
  })
})

describe('stickprovskandidater', () => {
  it('tar bara raden i genomgången som är granskad och från tillverkaren', () => {
    const lista = [
      produkt('A', '1'),
      produkt('A', '2', { granskad: null }),
      produkt('A', '3', { kalla_typ: 'butik', granskad: null }),
      produkt('A', '4', { genomgang: '2026-11-22-outnorth-talt' }),
    ]
    expect(stickprovskandidater(lista, '2026-11-22-xxl-talt').map((p) => p.modell)).toEqual(['1'])
  })
})

describe('dragStickprov', () => {
  it('ger samma urval för samma frö och ett annat för ett annat frö', () => {
    const lista = rader(200, 6)
    const a = dragStickprov(lista, 42).map((p) => p.modell)
    expect(dragStickprov(lista, 42).map((p) => p.modell)).toEqual(a)
    expect(dragStickprov(lista, 43).map((p) => p.modell)).not.toEqual(a)
  })

  it('har rätt storlek, inga dubbletter och minst en rad per märke', () => {
    const lista = rader(200, 6)
    const urval = dragStickprov(lista, 1)
    expect(urval).toHaveLength(10)
    expect(new Set(urval).size).toBe(10)
    expect(new Set(urval.map((p) => p.marke)).size).toBe(6)
  })

  it('tar alla rader när genomgången har färre än fem', () => {
    expect(dragStickprov(rader(3, 3), 7)).toHaveLength(3)
  })

  it('väljer tio märken slumpmässigt när märkena är fler än tio', () => {
    const urval = dragStickprov(rader(60, 25), 5)
    expect(urval).toHaveLength(10)
    expect(new Set(urval.map((p) => p.marke)).size).toBe(10)
  })
})

describe('checklista', () => {
  it('har frö, regler och en post per rad med källa, vikter och ruta', () => {
    const urval = [produkt('Hilleberg', 'Akto', { packvikt_g: 1700, minvikt_g: 1300, version: 'Red Label' }), produkt('Rab', 'Ascent', { packvikt_g: 900 })]
    const text = checklista('2026-11-22-xxl-talt', 42, urval, 14, '2026-11-25')
    expect(text).toContain('# Stickprov: 2026-11-22-xxl-talt')
    expect(text).toContain('Frö 42')
    expect(text).toContain('--stickprov 2026-11-22-xxl-talt --frö 42')
    expect(text).toContain('### 1. Hilleberg Akto Red Label')
    expect(text).toContain('Packvikt i katalogen: 1700 g')
    expect(text).toContain('Minvikt i katalogen: 1300 g')
    expect(text).toContain('Minvikt i katalogen: saknas')
    expect(text).toContain('[ ] stämmer   [ ] fel')
    expect(text).toContain('Det fångar systematiska fel')
    expect(text).toContain('2 av 14 rader')
  })
})

describe('andraKolumn', () => {
  const csv = 'marke;modell;kontrollerad_datum;genomgang;kommentar\r\nA;"x;y";;g1;Hej\r\nB;z;2026-01-01;g2;\r\n'

  it('ändrar bara de rader funktionen väljer och behåller radslut, citattecken och ordning', () => {
    const r = andraKolumn(csv, 'kontrollerad_datum', (f) => (f.genomgang === 'g1' ? '2026-12-01' : null))
    expect(r.antal).toBe(1)
    expect(r.text).toBe('marke;modell;kontrollerad_datum;genomgang;kommentar\r\nA;"x;y";2026-12-01;g1;Hej\r\nB;z;2026-01-01;g2;\r\n')
  })

  it('räknar inte en rad som redan har värdet', () => {
    expect(andraKolumn(csv, 'kontrollerad_datum', (f) => (f.marke === 'B' ? '2026-01-01' : null)).antal).toBe(0)
  })

  it('vägrar ändra en kolumn som saknas eller står sist', () => {
    expect(() => andraKolumn(csv, 'granskad_datum', () => 'x')).toThrow('saknas')
    expect(() => andraKolumn(csv, 'kommentar', () => 'x')).toThrow('sist')
  })
})

describe('lasNycklar', () => {
  it('läser marke;modell;version, hoppar över tomma rader och kommentarer och ignorerar skiftläge', () => {
    const n = lasNycklar('# granskade\r\nHilleberg;Akto;Red Label\r\n\r\nRab;Ascent;\r\nRab;Ascent 2\r\n')
    expect(n.map((x) => x.nyckel)).toEqual([radnyckel('hilleberg', 'akto', 'red label'), radnyckel('Rab', 'Ascent', null), radnyckel('Rab', 'Ascent 2', null)])
  })
})

describe('godkandILogg', () => {
  const logg = 'datum;kalla;genomgang;godkand\r\n2026-11-22;XXL;2026-11-22-xxl-talt;\r\n2026-11-22;XXL;2026-11-22-xxl-sov;\r\n'

  it('skriver datumet på genomgångens rad och rör inte de andra', () => {
    const r = godkandILogg(logg, '2026-11-22-xxl-talt', '2026-12-01')
    expect(r.antal).toBe(1)
    expect(r.text).toBe('datum;kalla;genomgang;godkand\r\n2026-11-22;XXL;2026-11-22-xxl-talt;2026-12-01\r\n2026-11-22;XXL;2026-11-22-xxl-sov;\r\n')
  })

  it('ger noll när genomgången inte finns i loggen', () => {
    expect(godkandILogg(logg, 'finns-inte', '2026-12-01').antal).toBe(0)
  })
})
