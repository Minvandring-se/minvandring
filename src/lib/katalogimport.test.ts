import { describe, expect, it } from 'vitest'
import { godkanda, importera, lasCsv, rapport, seedSql, tolkaRad } from './katalogimport'

const RUBRIK =
  'marke;modell;version;underkategori;personer;sasong;konstruktion;fristaende;kraver_stavar;packvikt_g;minvikt_g;golvyta_m2;absidyta_m2;ingangar;absider;innerhojd_cm;langd_cm;yttertalt_forst;material_typ;material_beskrivning;vattenpelare_duk_mm;vattenpelare_golv_mm;packmatt_cm;pris_sek_ca;ean;kalla;kontrollerad_datum;kommentar'

/** Ett komplett tält. Enskilda fält byts ut i testerna. */
const TALT: Record<string, string> = {
  marke: 'Testmärke',
  modell: 'Fjälltält 2',
  version: '2026',
  underkategori: 'talt',
  personer: '2',
  sasong: '4',
  konstruktion: 'tunnel',
  fristaende: 'nej',
  kraver_stavar: 'nej',
  packvikt_g: '2400',
  minvikt_g: '2000',
  golvyta_m2: '2,6',
  absidyta_m2: '1,3',
  ingangar: '1',
  absider: '1',
  innerhojd_cm: '100',
  langd_cm: '220',
  yttertalt_forst: 'ja',
  material_typ: 'Kerlon',
  material_beskrivning: 'Ytterduk i Kerlon 1200',
  vattenpelare_duk_mm: '5000',
  vattenpelare_golv_mm: '15000',
  packmatt_cm: '48 x 17',
  pris_sek_ca: '9500',
  ean: '7331234567890',
  kalla: 'https://exempel.se/fjalltalt-2',
  kontrollerad_datum: '2026-11-19',
  kommentar: 'Bara för oss.',
}

function csv(...rader: Record<string, string>[]): string {
  const kolumner = RUBRIK.split(';')
  return [RUBRIK, ...rader.map((r) => kolumner.map((k) => r[k] ?? '').join(';'))].join('\n')
}

describe('lasCsv', () => {
  it('läser kolumnerna efter namn, oavsett ordning', () => {
    const { rader } = lasCsv('modell;packvikt_g;marke\nAkto;1700;Hilleberg\n')
    expect(rader).toEqual([{ rad: 2, falt: { modell: 'Akto', packvikt_g: '1700', marke: 'Hilleberg' }, antalFalt: 3 }])
  })

  it('klarar BOM, Windows-radslut, tomma rader och blanktecken runt värdena', () => {
    const { kolumner, rader } = lasCsv('﻿Marke; modell\r\n\r\n Hilleberg ; Akto \r\n')
    expect(kolumner).toEqual(['marke', 'modell'])
    expect(rader.map((r) => r.falt)).toEqual([{ marke: 'Hilleberg', modell: 'Akto' }])
    expect(rader[0].rad).toBe(3)
  })

  it('låter ett fält inom citattecken innehålla semikolon och citattecken', () => {
    const { rader } = lasCsv('marke;kommentar\nHilleberg;"Tunnel; kallas ""Akto"""\n')
    expect(rader[0].falt.kommentar).toBe('Tunnel; kallas "Akto"')
    expect(rader[0].antalFalt).toBe(2)
  })
})

describe('tolkaRad', () => {
  it('gör om en komplett rad till en produkt, utan fel eller varningar', () => {
    expect(tolkaRad(2, TALT)).toEqual({
      rad: 2,
      namn: 'Testmärke Fjälltält 2 2026',
      fel: [],
      varningar: [],
      produkt: {
        marke: 'Testmärke',
        modell: 'Fjälltält 2',
        version: '2026',
        kategori: 'talt',
        underkategori: 'talt',
        packvikt_g: 2400,
        minvikt_g: 2000,
        pris_sek_ca: 9500,
        ean: '7331234567890',
        kalla: 'https://exempel.se/fjalltalt-2',
        kontrollerad: '2026-11-19',
        egenskaper: {
          personer: 2,
          sasong: 4,
          konstruktion: 'tunnel',
          fristaende: 'nej',
          kraver_stavar: false,
          golvyta_m2: 2.6,
          absidyta_m2: 1.3,
          ingangar: 1,
          absider: 1,
          innerhojd_cm: 100,
          langd_cm: 220,
          yttertalt_forst: true,
          material_typ: 'kerlon',
          material_beskrivning: 'Ytterduk i Kerlon 1200',
          vattenpelare_duk_mm: 5000,
          vattenpelare_golv_mm: 15000,
          packmatt_cm: '48 x 17',
        },
      },
    })
  })

  it('sparar inte kommentaren', () => {
    expect(JSON.stringify(tolkaRad(2, TALT).produkt)).not.toContain('Bara för oss')
  })

  it('godtar punkt som decimaltecken och DCF med stora bokstäver', () => {
    const r = tolkaRad(2, { ...TALT, golvyta_m2: '2.6', material_typ: 'DCF' })
    expect(r.fel).toEqual([])
    expect(r.produkt?.egenskaper).toMatchObject({ golvyta_m2: 2.6, material_typ: 'dcf' })
  })

  it('importerar en rad utan kontrollerad_datum som inte granskad', () => {
    const r = tolkaRad(2, { ...TALT, kontrollerad_datum: '' })
    expect(r.fel).toEqual([])
    expect(r.produkt?.kontrollerad).toBeNull()
  })

  it('varnar men importerar när fält för jämförelser saknas', () => {
    const r = tolkaRad(2, { ...TALT, sasong: '', golvyta_m2: '', vattenpelare_duk_mm: '' })
    expect(r.produkt).not.toBeNull()
    expect(r.fel).toEqual([])
    expect(r.varningar.map((v) => v.split(':')[0])).toEqual(['sasong', 'golvyta_m2', 'vattenpelare_duk_mm'])
    expect(r.produkt?.egenskaper).not.toHaveProperty('sasong')
  })

  it('låter version, minvikt, pris och ean vara tomma', () => {
    const r = tolkaRad(2, { ...TALT, version: '', minvikt_g: '', pris_sek_ca: '', ean: '' })
    expect(r.produkt).toMatchObject({ version: null, minvikt_g: null, pris_sek_ca: null, ean: null })
  })

  it.each([
    ['marke', ''],
    ['modell', ''],
    ['underkategori', ''],
    ['underkategori', 'igloo'],
    ['packvikt_g', ''],
    ['packvikt_g', '0'],
    ['packvikt_g', '2,4 kg'],
    ['minvikt_g', '2500'],
    ['minvikt_g', 'lätt'],
    ['pris_sek_ca', '9 500 kr'],
    ['ean', '123'],
    ['kalla', ''],
    ['kalla', 'exempel.se/talt'],
    ['kontrollerad_datum', '19/11 2026'],
    ['kontrollerad_datum', '2026-02-30'],
    ['personer', '2,5'],
    ['sasong', '3-4'],
    ['konstruktion', 'igloo'],
    ['fristaende', 'delvis'],
    ['kraver_stavar', 'kanske'],
    ['golvyta_m2', 'stor'],
    ['vattenpelare_duk_mm', '3'],
  ])('stoppar raden när %s är "%s"', (kolumn, varde) => {
    const r = tolkaRad(2, { ...TALT, [kolumn]: varde })
    expect(r.produkt).toBeNull()
    expect(r.fel.map((f) => f.split(':')[0])).toEqual([kolumn])
  })

  it('samlar alla fel på raden', () => {
    expect(tolkaRad(2, { ...TALT, marke: '', packvikt_g: 'x', kalla: '' }).fel).toHaveLength(3)
  })

  it('en tarp behöver inga egenskaper, och tältets kolumner sparas inte för den', () => {
    const r = tolkaRad(2, { marke: 'Testmärke', modell: 'Tarp', underkategori: 'tarp', packvikt_g: '500', kalla: 'https://exempel.se/tarp' })
    expect(r).toMatchObject({ fel: [], varningar: [], produkt: { kategori: 'talt', underkategori: 'tarp', egenskaper: {} } })

    const medTaltfalt = tolkaRad(2, { ...TALT, underkategori: 'tarp', langd_cm: '450' })
    expect(medTaltfalt.fel).toEqual([])
    expect(medTaltfalt.varningar).toHaveLength(1)
    expect(medTaltfalt.varningar[0]).toContain('konstruktion')
    expect(medTaltfalt.produkt?.egenskaper).toEqual({
      personer: 2,
      langd_cm: 450,
      material_typ: 'kerlon',
      material_beskrivning: 'Ytterduk i Kerlon 1200',
      vattenpelare_duk_mm: 5000,
    })
  })
})

describe('importera', () => {
  it('importerar raderna utan fel och stoppar de med fel', () => {
    const r = importera(csv(TALT, { ...TALT, modell: 'Trasigt', packvikt_g: '', ean: '' }, { ...TALT, modell: 'Tarp', underkategori: 'tarp', ean: '' }))
    expect(r.filfel).toEqual([])
    expect(r.rader.map((x) => [x.rad, x.produkt !== null])).toEqual([
      [2, true],
      [3, false],
      [4, true],
    ])
    expect(godkanda(r).map((p) => p.modell)).toEqual(['Fjälltält 2', 'Tarp'])
  })

  it('stoppar en dubblett av märke, modell och version, utan hänsyn till stora och små bokstäver', () => {
    const r = importera(csv(TALT, { ...TALT, marke: 'TESTMÄRKE', ean: '' }, { ...TALT, version: '2027', ean: '' }))
    expect(r.rader.map((x) => x.produkt !== null)).toEqual([true, false, true])
    expect(r.rader[1].fel).toEqual(['samma märke, modell och version som rad 2'])
  })

  it('stoppar en rad med samma ean som en tidigare', () => {
    const r = importera(csv(TALT, { ...TALT, modell: 'Annat tält' }))
    expect(r.rader[1].fel).toEqual(['ean: samma som rad 2'])
  })

  it('importerar ingenting när en kolumn saknas eller är okänd', () => {
    expect(importera('marke;modell;underkategori;kalla\nA;B;talt;https://exempel.se').filfel).toEqual(['Kolumnen packvikt_g saknas.'])
    const okand = importera(`${RUBRIK};farg\n`)
    expect(okand.filfel).toEqual(['Okänd kolumn: farg.'])
    expect(okand.rader).toEqual([])
  })

  it('varnar men importerar när kommentaren sist på raden innehåller ett semikolon', () => {
    const r = importera(csv({ ...TALT, kommentar: 'Först; sedan mer; och mer' }))
    expect(r.rader[0].produkt).toMatchObject({ modell: 'Fjälltält 2', kalla: 'https://exempel.se/fjalltalt-2', kontrollerad: '2026-11-19' })
    expect(r.rader[0].fel).toEqual([])
    expect(r.rader[0].varningar).toEqual(['kommentar: innehåller semikolon, sätt den inom citattecken'])
  })

  it('stoppar en för lång rad när kommentaren inte står sist', () => {
    const r = importera('marke;modell;underkategori;packvikt_g;kommentar;kalla
A;B;talt;100;x;https://exempel.se;extra')
    expect(r.rader[0].produkt).toBeNull()
    expect(r.rader[0].fel[0]).toContain('7 fält')
  })

  it('stoppar en rad med fel antal fält', () => {
    const r = importera(`${RUBRIK}\nTestmärke;Halv rad;;talt`)
    expect(r.rader[0].produkt).toBeNull()
    expect(r.rader[0].fel[0]).toContain('4 fält')
  })
})

describe('seedSql', () => {
  const produkter = godkanda(importera(csv({ ...TALT, modell: "Tält med ' i namnet", version: '', kontrollerad_datum: '' })))

  it('skriver null för tomma värden och dubblar apostrofer', () => {
    const sql = seedSql(produkter, ['supabase/katalog/test.csv'])
    expect(sql).toContain("('Testmärke', 'Tält med '' i namnet', null, 'talt', 'talt', 2400, 2000, 9500, '7331234567890', 'https://exempel.se/fjalltalt-2', null, '{")
    expect(sql).toContain('"material_typ":"kerlon"')
    expect(sql).toContain('::jsonb)')
    expect(sql).not.toContain('Bara för oss')
  })

  it('uppdaterar en produkt som redan finns i stället för att lägga in den igen', () => {
    const sql = seedSql(produkter, ['a.csv'])
    expect(sql).toContain("on conflict (lower(marke), lower(modell), lower(coalesce(version, ''))) do update set")
    expect(sql).toContain('packvikt_g = excluded.packvikt_g')
    expect(sql).not.toContain('marke = excluded.marke')
  })

  it('skriver ingen insert utan produkter', () => {
    expect(seedSql([], ['a.csv'])).not.toContain('insert')
  })
})

describe('rapport', () => {
  it('visar varje rad med fel och varningar, och en summering', () => {
    const text = rapport('test.csv', importera(csv(TALT, { ...TALT, modell: 'Utan vikt', packvikt_g: '', ean: '' }, { ...TALT, modell: 'Ogranskat', sasong: '', ean: '', kontrollerad_datum: '' })))
    expect(text).toContain('OK  rad 2: Testmärke Fjälltält 2 2026 · talt · 2400 g · granskad 2026-11-19')
    expect(text).toContain('FEL rad 3: Testmärke Utan vikt 2026')
    expect(text).toContain('fel: packvikt_g: saknas')
    expect(text).toContain('varning: sasong: saknas, behövs för jämförelser')
    expect(text).toContain('Summa: 2 av 3 rader importeras (1 granskade, 1 inte granskade). 1 stoppas av fel, 1 har varningar.')
  })
})
