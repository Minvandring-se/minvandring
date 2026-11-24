import { describe, expect, it } from 'vitest'
import { godkandaLivsmedel, importeraLivsmedel, LIVSMEDELSKOLUMNER, livsmedelCsv, livsmedelSeedSql, NARINGSVARDEN, radFranApi } from './livsmedelimport'

const naring = [
  { namn: 'Energi (kJ)', varde: 1495, enhet: 'kJ' },
  { namn: 'Energi (kcal)', varde: 357.4, enhet: 'kcal' },
  { namn: 'Protein', varde: 12.04, enhet: 'g' },
  { namn: 'Fett, totalt', varde: 1.66, enhet: 'g' },
  { namn: 'Kolhydrater, tillgängliga', varde: 70.1, enhet: 'g' },
  { namn: 'Fiber', varde: 3, enhet: 'g' },
  { namn: 'Sockerarter, totalt', varde: 2.46, enhet: 'g' },
  { namn: 'Salt, NaCl', varde: 0.013, enhet: 'g' },
  // Vatten är en logisk nolla hos Livsmedelsverket, alltså ett riktigt värde.
  { namn: 'Vatten', varde: 0, enhet: 'g' },
]
const klass = [
  { typ: 'LanguaL', fasett: 'A Gruppindelning EuroFIR', namn: 'Pasta' },
  { typ: 'LanguaL', fasett: 'G Tillagning', namn: 'Tillagningsmetod ej tillämplig' },
]

describe('radFranApi', () => {
  it('tar näringsvärdena per 100 g med rätt antal decimaler, gruppen och tillståndet', () => {
    expect(radFranApi({ nummer: 7, namn: ' Pasta okokt ', version: '2026-06-29T00:18:24.893' }, naring, klass)).toEqual({
      nummer: 7,
      namn: 'Pasta okokt',
      grupp: 'Pasta',
      tillstand: 'torr',
      kcal_per_100g: 357,
      protein_per_100g: 12,
      fett_per_100g: 1.7,
      kolhydrater_per_100g: 70.1,
      fiber_per_100g: 3,
      sockerarter_per_100g: 2.5,
      salt_per_100g: 0.01,
      vatten_per_100g: 0,
      version: '2026-06-29',
    })
  })

  it('lämnar det som saknas tomt, aldrig 0', () => {
    const rad = radFranApi({ nummer: 8, namn: 'Okänd' }, [{ namn: 'Fiber', varde: null, enhet: 'g' }], [])
    for (const n of NARINGSVARDEN) expect(rad[n.db]).toBeNull()
    expect(rad).toMatchObject({ grupp: null, tillstand: null, version: null })
  })

  it('kräver rätt enhet, så att kJ aldrig blir kcal', () => {
    expect(radFranApi({ nummer: 9, namn: 'X' }, [{ namn: 'Energi (kcal)', varde: 1495, enhet: 'kJ' }], []).kcal_per_100g).toBeNull()
  })
})

describe('CSV:n', () => {
  const rader = [
    radFranApi({ nummer: 2, namn: 'Lax; ugnsbakad', version: '2026-01-01' }, naring.slice(0, 3), [{ typ: 'LanguaL', fasett: 'A Gruppindelning EuroFIR', namn: 'Fisk' }]),
    radFranApi({ nummer: 1, namn: 'Pasta okokt', version: '2026-06-29' }, naring, klass),
  ]

  it('skrivs med semikolon och decimalkomma, med tomt där värdet saknas, och läses tillbaka till samma rader', () => {
    const text = livsmedelCsv(rader)
    const [rubrik, forsta, andra] = text.split('\n')
    expect(rubrik).toBe(LIVSMEDELSKOLUMNER.join(';'))
    expect(rubrik).toBe('nummer;namn;grupp;tillstand;kcal;protein_g;fett_g;kolhydrater_g;fiber_g;sockerarter_g;salt_g;vatten_g;version')
    expect(forsta).toBe('1;Pasta okokt;Pasta;torr;357;12;1,7;70,1;3;2,5;0,01;0;2026-06-29')
    expect(andra).toBe('2;"Lax; ugnsbakad";Fisk;tillagad;357;12;;;;;;;2026-01-01')
    const tillbaka = importeraLivsmedel(text)
    expect(tillbaka.filfel).toEqual([])
    expect(godkandaLivsmedel(tillbaka)).toEqual([rader[1], rader[0]])
  })

  it('stoppar rader med fel och nummer som finns två gånger', () => {
    const tom = ';;;;;;;'
    const text = [
      LIVSMEDELSKOLUMNER.join(';'),
      `1;Ris;;torr;1200${tom};`,
      `2;;;${tom};;`,
      `3;Gröt;;kall;${tom};`,
      `4;Bröd;;;250;120;;;;;;;`,
      `5;Ris okokt;;torr;350,5;7;;;;;;;`,
      `6;Ris okokt;;torr;350;7;;;;;;;2026-6-1`,
      `7;Ris okokt;;torr;350;7;;;;;;;`,
      `7;Ris okokt;;torr;350;7;;;;;;;`,
      `8;Ris;${'a'.repeat(201)};;;;;;;;;;`,
    ].join('\n')
    const r = importeraLivsmedel(text)
    expect(r.rader.filter((x) => x.fel.length).map((x) => x.rad)).toEqual([2, 3, 4, 5, 6, 7, 10])
    expect(r.filfel).toEqual(['Nummer 7 finns två gånger (rad 9)'])
  })

  it('kräver rätt rubrikrad', () => {
    expect(importeraLivsmedel('nummer;namn\n1;Ris')).toEqual({ rader: [], filfel: [expect.stringContaining('Rubrikraden')] })
  })
})

describe('livsmedelSeedSql', () => {
  it('uppdaterar ett livsmedel som redan finns och skriver apostrofer rätt', () => {
    const sql = livsmedelSeedSql([radFranApi({ nummer: 1, namn: "Kock's gryta" }, naring, [])], 'supabase/katalog/livsmedel/livsmedel.csv')
    expect(sql).toContain(`(1, 'Kock''s gryta', null, null, 357, 12, 1.7, 70.1, 3, 2.5, 0.01, 0, null)`)
    expect(sql).toContain('on conflict (nummer) do update set')
  })
})
