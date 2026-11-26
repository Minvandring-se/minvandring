import { describe, expect, it } from 'vitest'
import { aktivSida, aktivUndersida, BLAD, bladIState, FLIKAR, flikAktiv, GRUPPSTART, gruppFor, MENYGRUPPER, MER, oppnaGrupper, SIDOR, UNDERSIDOR } from '@/lib/meny'

describe('menyns sidor', () => {
  it('har sökvägar utan å, ä och ö, och alla är olika', () => {
    const vagar = Object.values(SIDOR).map((s) => s.till)
    for (const v of vagar) expect(v).toMatch(/^\/[a-z-]+$/)
    expect(new Set(vagar).size).toBe(vagar.length)
  })

  it('har sökvägarna från uppdraget', () => {
    expect(['matplanering', 'packlistor', 'utrustning', 'dagbok', 'kom-ihag', 'statistik', 'vanner', 'installningar'].map((s) => SIDOR[s as keyof typeof SIDOR].till)).toEqual([
      '/matplanering',
      '/packlistor',
      '/utrustning',
      '/dagbok',
      '/kom-ihag',
      '/statistik',
      '/vanner',
      '/installningar',
    ])
  })

  it('säger vad varje sida som inte är byggd blir', () => {
    for (const s of Object.values(SIDOR).filter((s) => !s.byggd)) expect(s.blir.length).toBeGreaterThan(30)
  })

  it('har Hem överst och grupperna i sidomenyn i rätt ordning, med det som inte är byggt i Kommer snart', () => {
    expect(SIDOR.hem.till).toBe('/hem')
    expect(MENYGRUPPER.map((g) => [g.rubrik, g.sidor.map((s) => SIDOR[s].namn)])).toEqual([
      ['Planera', ['Mina turer', 'Matplanering']],
      ['Utrustning', ['Mitt förråd', 'Packlistor', 'Utrustningskatalog']],
      ['Vandrare', ['Vänner']],
      ['Minnen', ['Kom ihåg till nästa tur']],
      ['Kommer snart', ['Dagbok', 'Statistik']],
    ])
    // Allt i Kommer snart är inte byggt, och allt som inte är byggt ligger där.
    const snart = MENYGRUPPER.find((g) => g.nyckel === 'snart')!.sidor
    expect(Object.values(SIDOR).filter((s) => !s.byggd).map((s) => s.sida).sort()).toEqual([...snart].sort())
  })

  it('öppnar gruppen med den aktiva sidan, och Kommer snart är stängd annars', () => {
    expect([...oppnaGrupper('forrad')]).toEqual(['utrustning'])
    expect([...oppnaGrupper('hem')]).toEqual([])
    expect([...oppnaGrupper('statistik')]).toEqual(['snart'])
    expect(gruppFor('kom-ihag')).toBe('minnen')
    expect(gruppFor('installningar')).toBeNull()
  })

  it('har fem flikar i mobil och resten i Mer, i samma grupper och ordning som sidomenyn', () => {
    expect(FLIKAR.map((f) => f.namn)).toEqual(['Hem', 'Mina turer', 'Matplanering', 'Mitt förråd', 'Mer'])
    // Sidorna heter likadant i mobilens meny som i sidomenyn.
    for (const f of FLIKAR) if (f.typ === 'sida') expect(f.namn).toBe(SIDOR[f.sida].namn)
    expect(MER.map((g) => [g.rubrik, g.sidor])).toEqual([
      ['Utrustning', ['packlistor', 'utrustning']],
      ['Vandrare', ['vanner']],
      ['Minnen', ['kom-ihag']],
      ['Kommer snart', ['dagbok', 'statistik']],
      ['Konto', ['installningar']],
    ])
    // Hela menyn i samma ordning: flikarna och sedan Mer följer sidomenyns ordning.
    const sidomeny = ['hem', ...MENYGRUPPER.flatMap((g) => g.sidor)]
    const mobil = [...FLIKAR.flatMap((f) => (f.typ === 'sida' ? [f.sida] : [])), ...BLAD.mer].filter((s) => sidomeny.includes(s))
    expect(mobil.map((s) => sidomeny.indexOf(s))).toEqual(mobil.map((s) => sidomeny.indexOf(s)).sort((a, b) => a - b))
  })
})

describe('bladIState', () => {
  it('läser det öppna bladet och om det öppnades i appen', () => {
    expect(bladIState({ blad: 'mer', steg: true })).toEqual({ blad: 'mer', steg: true })
    expect(bladIState({ blad: 'mer' })).toEqual({ blad: 'mer', steg: false })
    expect(bladIState({ blad: 'minnen' })).toBeNull()
    expect(bladIState({ blad: 'annat' })).toBeNull()
    expect(bladIState(null)).toBeNull()
    expect(bladIState('mer')).toBeNull()
  })
})

describe('aktivSida och flikAktiv', () => {
  it('känner igen sidan från adressen, och turens sidor hör till Mina turer', () => {
    expect(aktivSida('/turer')).toBe('turer')
    expect(aktivSida('/tur/abc/mat')).toBe('turer')
    expect(aktivSida('/statistik')).toBe('statistik')
    expect(aktivSida('/kom-ihag')).toBe('kom-ihag')
    expect(aktivSida('/okand')).toBeNull()
  })

  it('delarna av Matplanering hör till Matplanering, och fliken Mat är aktiv på alla', () => {
    expect(UNDERSIDOR.matplanering!.map((u) => [u.namn, u.till])).toEqual([
      ['Mina matplaner', '/matplanering'],
      ['Matkatalog', '/matplanering/katalog'],
      ['Recept', '/matplanering/recept'],
      ['Skafferi', '/matplanering/skafferi'],
      ['Tips', '/matplanering/tips'],
    ])
    const mat = FLIKAR.find((f) => f.namn === 'Matplanering')!
    for (const adress of ['/matplanering', '/matplanering/katalog', '/matplanering/recept', '/matplanering/skafferi/', '/matplanering/tips']) {
      expect(aktivSida(adress)).toBe('matplanering')
      expect(flikAktiv(mat, aktivSida(adress))).toBe(true)
    }
    expect(aktivSida('/matplanering/annat')).toBeNull()
    expect(aktivUndersida('/matplanering/skafferi/')).toBe('/matplanering/skafferi')
    expect(aktivUndersida('/forrad')).toBeNull()
    expect(aktivUndersida('/matplanering/tips/energi')).toBe('/matplanering/tips')
    expect(aktivSida('/matplanering/tips/energi')).toBe('matplanering')
  })

  it('delarna har sökvägar utan å, ä och ö', () => {
    for (const delar of Object.values(UNDERSIDOR)) for (const u of delar!) expect(u.till).toMatch(/^\/[a-z-]+(\/[a-z-]+)?$/)
  })

  it('markerar Mer när en av dess sidor är öppen', () => {
    const mer = FLIKAR.find((f) => f.namn === 'Mer')!
    expect(flikAktiv(mer, 'installningar')).toBe(true)
    expect(flikAktiv(mer, 'statistik')).toBe(true)
    expect(flikAktiv(mer, 'forrad')).toBe(false)
    expect(flikAktiv(FLIKAR[0], 'hem')).toBe(true)
    expect(flikAktiv(FLIKAR[1], 'turer')).toBe(true)
    expect(flikAktiv(FLIKAR[0], null)).toBe(false)
    expect(aktivSida('/hem')).toBe('hem')
  })
})

describe('gruppernas startsidor', () => {
  it('Planera går till Mina turer och Utrustning till Mitt förråd, och startsidan hör till gruppen', () => {
    expect(GRUPPSTART).toEqual({ planera: 'turer', utrustning: 'forrad' })
    for (const [grupp, sida] of Object.entries(GRUPPSTART)) expect(MENYGRUPPER.find((g) => g.nyckel === grupp)?.sidor).toContain(sida)
  })
})
