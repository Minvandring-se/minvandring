import { describe, expect, it } from 'vitest'
import { ledigtMallnamn, mallPerKategori, mallvem, mallvikter, nastaSortering, nyMallrad, sakerText, sammanfatta, tolkaMallnamn, vemKolumner, visatNamn, type Packmallrad } from './packmallar'

const rad = (r: Partial<Packmallrad>): Packmallrad => ({
  id: r.namn ?? 'x',
  namn: 'Sak',
  kategori: 'ovrigt',
  underkategori: null,
  antal: 1,
  vikt_g: 100,
  typ: 'ryggsack',
  alla: false,
  gemensam: false,
  egen_namn: null,
  egen_vikt_g: null,
  sortering: 0,
  ...r,
})

describe('tolkaMallnamn', () => {
  it('tar bort mellanslag och stoppar tomma och för långa namn', () => {
    expect(tolkaMallnamn('  Fjällen ')).toEqual({ namn: 'Fjällen' })
    expect(tolkaMallnamn('   ')).toEqual({ fel: 'Skriv ett namn på packlistan.' })
    expect(tolkaMallnamn('a'.repeat(81))).toHaveProperty('fel')
    expect(tolkaMallnamn('a'.repeat(80))).toEqual({ namn: 'a'.repeat(80) })
  })
})

describe('ledigtMallnamn', () => {
  it('ger namnet när det är ledigt och annars nästa nummer, oavsett stora och små bokstäver', () => {
    expect(ledigtMallnamn('Kungsleden', ['Sarek'])).toBe('Kungsleden')
    expect(ledigtMallnamn('Kungsleden', ['kungsleden'])).toBe('Kungsleden (2)')
    expect(ledigtMallnamn('Kungsleden', ['Kungsleden', 'Kungsleden (2)'])).toBe('Kungsleden (3)')
  })

  it('håller sig inom 80 tecken', () => {
    const langt = 'a'.repeat(80)
    expect(ledigtMallnamn(langt, [langt]).length).toBeLessThanOrEqual(80)
  })
})

describe('sammanfatta', () => {
  it('räknar saker med antal, basvikt utan det gemensamma och rader utan vikt', () => {
    const s = sammanfatta([
      rad({ namn: 'Ryggsäck', vikt_g: 1200 }),
      rad({ namn: 'Sovsäck', vikt_g: 800, alla: true }),
      rad({ namn: 'Strumpor', vikt_g: 60, antal: 2 }),
      rad({ namn: 'Tält', vikt_g: 1800, gemensam: true }),
      rad({ namn: 'Skor', vikt_g: 900, typ: 'kropp' }),
      rad({ namn: 'Gas', vikt_g: 350, typ: 'forbrukas', gemensam: true }),
      rad({ namn: 'Kniv', vikt_g: null }),
    ])
    expect(s).toEqual({ saker: 8, basvikt_g: 2120, gemensamt_g: 1800, utanVikt: 1 })
  })

  it('min egen modell räknas i stället för radens, också när den saknar vikt', () => {
    expect(sammanfatta([rad({ alla: true, vikt_g: 1000, egen_namn: 'Min dunsäck', egen_vikt_g: 800 })]).basvikt_g).toBe(800)
    expect(sammanfatta([rad({ alla: true, vikt_g: 1000, egen_namn: 'Lånad säck', egen_vikt_g: null })])).toMatchObject({ basvikt_g: 0, utanVikt: 1 })
  })

  it('en tom mall har inget', () => {
    expect(sammanfatta([])).toEqual({ saker: 0, basvikt_g: 0, gemensamt_g: 0, utanVikt: 0 })
  })
})

describe('mallPerKategori', () => {
  it('följer förrådets ordning och mallens ordning och hoppar över tomma kategorier', () => {
    const k = mallPerKategori([
      rad({ namn: 'Kniv', kategori: 'ovrigt', sortering: 2 }),
      rad({ namn: 'Sovsäck', kategori: 'sova', sortering: 3 }),
      rad({ namn: 'Lampa', kategori: 'ovrigt', sortering: 1 }),
    ])
    expect(k.map((x) => [x.nyckel, x.rader.map((r) => r.namn)])).toEqual([
      ['sova', ['Sovsäck']],
      ['ovrigt', ['Lampa', 'Kniv']],
    ])
  })
})

it('sakerText', () => {
  expect(sakerText(1)).toBe('1 sak')
  expect(sakerText(3)).toBe('3 saker')
})

it('visatNamn ger min modell när den finns', () => {
  expect(visatNamn(rad({ namn: 'Sovsäck', alla: true, egen_namn: 'Min dunsäck' }))).toBe('Min dunsäck')
  expect(visatNamn(rad({ namn: 'Sovsäck', alla: true }))).toBe('Sovsäck')
})

describe('mallvikter', () => {
  it('delar upp i egen basvikt, gemensamt, förbrukning och på kroppen, med min modell och antal', () => {
    const v = mallvikter([
      rad({ namn: 'Ryggsäck', kategori: 'packning', vikt_g: 1200 }),
      rad({ namn: 'Sovsäck', kategori: 'sova', alla: true, vikt_g: 1000, egen_namn: 'Dunsäck', egen_vikt_g: 800 }),
      rad({ namn: 'Strumpor', kategori: 'klader', vikt_g: 60, antal: 2 }),
      rad({ namn: 'Tält', kategori: 'talt', gemensam: true, vikt_g: 1800 }),
      rad({ namn: 'Gas', kategori: 'kok', typ: 'forbrukas', gemensam: true, vikt_g: 350 }),
      rad({ namn: 'Kängor', kategori: 'skor', typ: 'kropp', vikt_g: 900 }),
      rad({ namn: 'Kniv', vikt_g: null }),
    ])
    expect(v).toEqual({
      bas_g: 2120,
      gemensamt_g: 1800,
      forbrukas_g: 350,
      kropp_g: 900,
      perKategori: [
        { kategori: 'packning', vikt: 1200 },
        { kategori: 'sova', vikt: 800 },
        { kategori: 'klader', vikt: 120 },
      ],
    })
  })
})

describe('vem i mallen', () => {
  it('läser vem från raden och tömmer den egna modellen när raden slutar vara alla', () => {
    expect(mallvem(rad({ alla: true }))).toBe('alla')
    expect(mallvem(rad({ gemensam: true }))).toBe('gemensam')
    expect(mallvem(rad({}))).toBe('jag')
    expect(vemKolumner('alla')).toEqual({ alla: true, gemensam: false })
    expect(vemKolumner('gemensam')).toEqual({ alla: false, gemensam: true, egen_namn: null, egen_vikt_g: null, egen_produkt_id: null })
  })
})

describe('nyMallrad och nastaSortering', () => {
  it('gör en rad med vem, inom gränserna och sist i mallen', () => {
    const r = nyMallrad('m1', { namn: 'a'.repeat(130), kategori: 'sova', underkategori: 'sovsack', antal: 1500, vikt_g: 900, typ: 'ryggsack' }, 'alla', 4)
    expect(r).toMatchObject({ mall_id: 'm1', alla: true, gemensam: false, produkt_id: null, antal: 999, sortering: 4 })
    expect(r.namn).toHaveLength(120)
    expect(nastaSortering([{ sortering: 3 }, { sortering: 7 }])).toBe(8)
    expect(nastaSortering([])).toBe(1)
    expect(nastaSortering([{ sortering: 10000 }])).toBe(10000)
  })
})
