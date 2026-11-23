import { describe, expect, it } from 'vitest'
import { godkandaPasar, importeraMatkatalog, MATKOLUMNER, matrapport, matSeedSql, tolkaAllergener } from './matkatalogimport'

const RUBRIK = MATKOLUMNER.join(';')

/** En fejkad rad. Bara för testerna, aldrig i katalogen. */
function rad(andra: Partial<Record<(typeof MATKOLUMNER)[number], string>> = {}): string {
  const grund: Record<(typeof MATKOLUMNER)[number], string> = {
    marke: 'Testmat',
    namn: 'Gryta med linser',
    maltid: 'lunch_middag',
    torkning: 'frystorkad',
    vikt_torr_g: '150',
    portioner: '1',
    kcal: '600',
    protein_g: '24,5',
    fett_g: '20',
    kolhydrater_g: '75',
    vatten_ml: '450',
    tillagning_vatten: 'varmt',
    tillagning_min: '8',
    vegetarisk: 'ja',
    vegansk: 'nej',
    glutenfri: '',
    laktosfri: 'ja',
    allergener: 'soja, selleri',
    spar: 'sesam',
    pris_sek_ca: '129',
    pris_kalla: 'https://butik.exempel.se/gryta',
    kalla: 'https://testmat.exempel.se/gryta',
    kontrollerad: '',
  }
  return MATKOLUMNER.map((k) => andra[k] ?? grund[k]).join(';')
}

const fil = (...rader: string[]) => [RUBRIK, ...rader].join('\n')

describe('importeraMatkatalog', () => {
  it('tolkar en hel rad', () => {
    const r = importeraMatkatalog(fil(rad()))
    expect(r.filfel).toEqual([])
    expect(godkandaPasar(r)).toEqual([
      {
        marke: 'Testmat',
        namn: 'Gryta med linser',
        maltid: 'lunch_middag',
        torkning: 'frystorkad',
        vikt_torr_g: 150,
        portioner: 1,
        kcal: 600,
        protein_g: 24.5,
        fett_g: 20,
        kolhydrater_g: 75,
        vatten_ml: 450,
        tillagning_vatten: 'varmt',
        tillagning_min: 8,
        vegetarisk: true,
        vegansk: false,
        glutenfri: null,
        laktosfri: true,
        allergener: ['soja', 'selleri'],
        spar: ['sesam'],
        pris_sek_ca: 129,
        pris_kalla: 'https://butik.exempel.se/gryta',
        kalla: 'https://testmat.exempel.se/gryta',
        kontrollerad: null,
      },
    ])
  })

  it('kräver exakt kolumnerna i rätt ordning', () => {
    expect(importeraMatkatalog(RUBRIK.replace(';pris_kalla', '')).filfel).toEqual(['Kolumnen pris_kalla saknas.'])
    expect(importeraMatkatalog(`${RUBRIK};kommentar`).filfel).toEqual(['Okänd kolumn: kommentar.'])
    const bytt = RUBRIK.replace('marke;namn', 'namn;marke')
    expect(importeraMatkatalog(bytt).filfel).toEqual(['Kolumnerna står i fel ordning.'])
  })

  it('pris_kalla är en adress och kräver ett pris', () => {
    expect(godkandaPasar(importeraMatkatalog(fil(rad({ pris_kalla: '' })))))
      .toMatchObject([{ pris_kalla: null, pris_sek_ca: 129 }])
    expect(importeraMatkatalog(fil(rad({ pris_sek_ca: '' }))).rader[0].fel).toEqual(['pris_kalla: får bara vara ifylld när pris_sek_ca är ifyllt'])
    expect(importeraMatkatalog(fil(rad({ pris_kalla: 'butik.exempel.se' }))).rader[0].fel).toEqual(['pris_kalla: ska börja med http:// eller https://'])
  })

  it('läser filer med komma mellan fälten, med citattecken runt fält som innehåller komma', () => {
    const komma = (text: string) =>
      text
        .split('\n')
        .map((rad) => rad.split(';').map((f) => (f.includes(',') ? `"${f}"` : f)).join(','))
        .join('\n')
    const r = importeraMatkatalog(komma(fil(rad({ allergener: 'soja,selleri' }))))
    expect(r.filfel).toEqual([])
    expect(godkandaPasar(r)).toHaveLength(1)
    expect(godkandaPasar(r)[0].allergener).toEqual(['soja', 'selleri'])
  })

  it('ignorerar Astras kontrollerad, även när den inte är ett datum', () => {
    const r = importeraMatkatalog(fil(rad({ kontrollerad: '2026-11-23' }), rad({ namn: 'Annan', kontrollerad: 'igår' })))
    expect(r.rader.map((x) => x.fel)).toEqual([[], []])
    expect(godkandaPasar(r).map((p) => p.kontrollerad)).toEqual([null, null])
  })

  it('stoppar rader med fel och säger varför', () => {
    const r = importeraMatkatalog(
      fil(
        rad({ namn: '', kcal: '' }),
        rad({ namn: 'B', maltid: 'middag', vegansk: 'kanske' }),
        rad({ namn: 'C', vegetarisk: 'nej', vegansk: 'ja' }),
        rad({ namn: 'D', vikt_torr_g: '0', kontrollerad: '2026-13-01' }),
      ),
    )
    expect(r.rader.map((x) => x.fel)).toEqual([
      ['namn: saknas', 'kcal: saknas'],
      ['maltid: frukost, lunch_middag, dessert, mellanmal eller tom cell, inte "middag"', 'vegansk: ja, nej eller tom cell, inte "kanske"'],
      ['vegansk: ja kräver att vegetarisk också är ja'],
      ['vikt_torr_g: heltal mellan 1 och 5000, inte "0"'],
    ])
    expect(godkandaPasar(r)).toEqual([])
  })

  it('stoppar samma märke och namn två gånger', () => {
    const r = importeraMatkatalog(fil(rad(), rad({ marke: 'TESTMAT', namn: 'gryta med linser' })))
    expect(r.rader[1].fel).toEqual(['samma märke och namn som rad 2'])
  })

  it('varnar för det som ser konstigt ut men importerar ändå', () => {
    const r = importeraMatkatalog(
      fil(
        rad({ kcal: '1500' }),
        rad({ namn: 'B', allergener: '', portioner: '' }),
        rad({ namn: 'C', allergener: 'mjolk', vegansk: 'ja', spar: 'mjolk' }),
        rad({ namn: 'D', allergener: 'gluten', glutenfri: 'ja' }),
      ),
    )
    expect(r.rader.map((x) => x.varningar)).toEqual([
      ['1000 kcal per 100 g, kontrollera att kcal och vikt gäller hela påsen'],
      ['portioner: tom, räknas som 1', 'allergener: okända, påsen visas inte när man filtrerar på allergener'],
      ['spar: mjolk står också under allergener', 'vegansk: ja men allergenerna innehåller animaliskt'],
      ['glutenfri: ja men allergenerna innehåller gluten'],
    ])
    expect(godkandaPasar(r)).toHaveLength(4)
  })
})

describe('tolkaAllergener', () => {
  it('skiljer på okänt, inga och en lista', () => {
    expect(tolkaAllergener('', 'allergener')).toEqual({ ok: true, varde: null })
    expect(tolkaAllergener('Inga', 'allergener')).toEqual({ ok: true, varde: [] })
    expect(tolkaAllergener('mjolk, agg,mjolk', 'allergener')).toEqual({ ok: true, varde: ['mjolk', 'agg'] })
  })

  it('tar inte emot okända nycklar eller etiketter', () => {
    expect(tolkaAllergener('mjölk', 'spar')).toMatchObject({ ok: false, fel: expect.stringContaining('spar: okänd nyckel "mjölk"') })
  })
})

describe('matSeedSql och matrapport', () => {
  it('skriver en insert som uppdaterar befintliga påsar', () => {
    const sql = matSeedSql(godkandaPasar(importeraMatkatalog(fil(rad({ namn: "Kock's gryta", allergener: 'inga', spar: '' })))), ['supabase/katalog/mat/test.csv'])
    expect(sql).toContain(`insert into public.matprodukter (${MATKOLUMNER.join(', ')}) values`)
    expect(sql).toContain("'Kock''s gryta'")
    expect(sql).toContain("'{}'::text[], null, 129")
    expect(sql).toContain('on conflict (lower(marke), lower(namn)) do update set')
  })

  it('säger det när det inte finns några påsar', () => {
    expect(matSeedSql([], ['x.csv'])).toContain('-- Inga påsar.')
  })

  it('sammanfattar filen', () => {
    const text = matrapport('test.csv', importeraMatkatalog(fil(rad(), rad({ namn: '' }))))
    expect(text).toContain('OK  rad 2: Testmat Gryta med linser · lunch_middag · 150 g · 600 kcal')
    expect(text).toContain('Summa: 1 av 2 rader importeras. 1 stoppas av fel, 0 har varningar.')
  })
})
