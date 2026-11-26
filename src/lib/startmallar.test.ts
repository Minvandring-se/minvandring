import { describe, expect, it } from 'vitest'
import { underkategoriFor } from './forrad'
import { STARTMALLAR, antalSaker, startmallTillPackrader } from './startmallar'

describe('STARTMALLAR', () => {
  it('har unika id:n och unika namn inom varje mall', () => {
    expect(new Set(STARTMALLAR.map((m) => m.id)).size).toBe(STARTMALLAR.length)
    for (const m of STARTMALLAR) expect(new Set(m.rader.map((r) => r.namn)).size, m.namn).toBe(m.rader.length)
  })

  it('varje rad har en underkategori som hör till sin kategori, och namn som får plats i packlistan', () => {
    for (const m of STARTMALLAR)
      for (const r of m.rader) {
        expect(underkategoriFor(r.kategori, r.underkategori), `${m.namn}: ${r.namn}`).not.toBeNull()
        expect(r.namn.length).toBeLessThanOrEqual(120)
      }
  })

  it('räknar saker med antal', () => {
    const helg = STARTMALLAR.find((m) => m.id === 'helg-skogen')!
    expect(antalSaker(helg)).toBe(helg.rader.length + 1)
  })
})

describe('startmallTillPackrader', () => {
  const fjall = STARTMALLAR.find((m) => m.id === 'fjalltur-talt')!

  it('gör personliga saker till rader alla ska ha och gruppens till gemensamma rader som ingen bär', () => {
    const rader = startmallTillPackrader(fjall, 't1', 10)
    const talt = rader.find((r) => r.namn === 'Tält')!
    const sovsack = rader.find((r) => r.namn === 'Sovsäck')!
    expect(talt).toMatchObject({ tur_id: 't1', gemensam: true, alla: false, bars_av: null, vikt_g: null })
    expect(sovsack).toMatchObject({ alla: true, gemensam: false, bars_av: null })
    expect(rader[0].sortering).toBe(11)
    expect(rader.find((r) => r.namn === 'Gas')!.typ).toBe('forbrukas')
    expect(rader.find((r) => r.namn === 'Strumpor')!.antal).toBe(3)
  })
})
