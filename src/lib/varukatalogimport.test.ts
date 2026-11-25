import { describe, expect, it } from 'vitest'
import { godkandaVaror, importeraVarukatalog, tolkaVarde, VARUKOLUMNER, varuSeedSql } from './varukatalogimport'

const huvud = VARUKOLUMNER.join(',')
const rad = (over: Partial<Record<(typeof VARUKOLUMNER)[number], string>> = {}) => {
  const falt: Record<string, string> = {
    marke: 'Polarbröd',
    namn: 'Sarek 375 g',
    kategori: 'brod',
    forpackning_g: '375',
    portion_g: '',
    kcal_100g: '280',
    protein_100g: '9.8',
    fett_100g: '1.6',
    kolhydrater_100g: '55',
    fiber_100g: '4.5',
    socker_100g: '7',
    salt_100g: '1.2',
    vatten_ml: '',
    tillagning: '',
    vegetarisk: 'ja',
    vegansk: 'ja',
    glutenfri: 'nej',
    laktosfri: 'ja',
    allergener: 'gluten',
    spar: 'inga',
    haller_utan_kyl: 'ja',
    ean: '7311800640109',
    pris_sek_ca: '34.5',
    pris_kalla: 'https://exempel.se/pris',
    kalla: 'https://www.polarbrod.se/',
    ...over,
  }
  return VARUKOLUMNER.map((k) => (/[",]/.test(falt[k]) ? `"${falt[k]}"` : falt[k])).join(',')
}

describe('tolkaVarde', () => {
  it('läser punkt, komma och mindre än', () => {
    expect(tolkaVarde('9.8', 'x', 100)).toEqual({ ok: true, varde: 9.8 })
    expect(tolkaVarde('9,85', 'x', 100)).toEqual({ ok: true, varde: 9.85 })
    expect(tolkaVarde('<0.1', 'x', 100)).toEqual({ ok: true, varde: 0, mindreAn: true })
    expect(tolkaVarde('', 'x', 100)).toEqual({ ok: true, varde: null })
    expect(tolkaVarde('101', 'x', 100).ok).toBe(false)
    expect(tolkaVarde('ca 5', 'x', 100).ok).toBe(false)
  })
})

describe('importeraVarukatalog', () => {
  it('läser en vara med näring per 100 g och allergener', () => {
    const r = importeraVarukatalog([huvud, rad()].join('\n'))
    expect(r.filfel).toEqual([])
    expect(godkandaVaror(r)).toEqual([
      expect.objectContaining({ marke: 'Polarbröd', namn: 'Sarek 375 g', kategori: 'brod', forpackning_g: 375, kcal_per_100g: 280, protein_per_100g: 9.8, allergener: ['gluten'], spar: [], glutenfri: false, pris_sek_ca: 34.5 }),
    ])
  })

  it('tom cell för allergener är okänt, och det ger en varning', () => {
    const r = importeraVarukatalog([huvud, rad({ allergener: '' })].join('\n'))
    expect(godkandaVaror(r)[0].allergener).toBeNull()
    expect(r.rader[0].varningar).toContain('allergener: okända, varan räknas aldrig som att den passar')
  })

  it('läser mindre än som 0, och avrundar förpackningen till hela gram', () => {
    const r = importeraVarukatalog([huvud, rad({ salt_100g: '<0.1', forpackning_g: '142.4' })].join('\n'))
    expect(godkandaVaror(r)[0]).toMatchObject({ salt_per_100g: 0, forpackning_g: 142 })
    expect(r.rader[0].varningar).toContain('salt_100g: "mindre än" läst som 0')
  })

  it('stoppar fel kategori, saknad energi, fel EAN och dubbletter', () => {
    const r = importeraVarukatalog([huvud, rad({ kategori: 'Bröd' }), rad({ namn: 'Utan kcal', kcal_100g: '' }), rad({ namn: 'Fel EAN', ean: '12' }), rad(), rad({ namn: 'SAREK 375 G' })].join('\n'))
    expect(r.rader.map((x) => x.vara === null)).toEqual([true, true, true, false, true])
    expect(r.rader[4].fel).toEqual(['samma märke och namn som rad 5'])
  })

  it('varnar när energin inte stämmer med fett, kolhydrater och protein', () => {
    const r = importeraVarukatalog([huvud, rad({ kcal_100g: '600' })].join('\n'))
    expect(r.rader[0].varningar.some((v) => v.startsWith('kcal_100g: 600 kcal'))).toBe(true)
  })

  it('stoppar en fil med fel kolumner', () => {
    expect(importeraVarukatalog('marke,namn\nA,B').filfel.length).toBeGreaterThan(0)
  })
})

describe('varuSeedSql', () => {
  it('skriver en upsert på märke och namn, med citattecken och listor', () => {
    const varor = godkandaVaror(importeraVarukatalog([huvud, rad({ namn: "Sarek's" })].join('\n')))
    const sql = varuSeedSql(varor, ['supabase/katalog/varor/brod.csv'])
    expect(sql).toContain('insert into public.varukatalog (marke, namn, kategori')
    expect(sql).toContain("'Sarek''s'")
    expect(sql).toContain("array['gluten']::text[]")
    expect(sql).toContain('on conflict (lower(marke), lower(namn)) do update set')
  })
})
