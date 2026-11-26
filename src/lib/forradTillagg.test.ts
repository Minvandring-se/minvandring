import { describe, expect, it } from 'vitest'
import { KATEGORIER, underkategoriFor } from './forrad'
import { franTur, gissaKategori, snabbSak } from './forradTillagg'
import type { PackradRad, PackstatusRad } from './typer'

describe('gissaKategori', () => {
  it('känner igen vanliga saker, med det mer precisa ordet först', () => {
    expect(gissaKategori('Spork titan')).toEqual({ kategori: 'kok', underkategori: 'bestick' })
    expect(gissaKategori('Sittunderlag')).toEqual({ kategori: 'sova', underkategori: 'sittunderlag' })
    expect(gissaKategori('Liggunderlag Thermarest')).toEqual({ kategori: 'sova', underkategori: 'liggunderlag' })
    expect(gissaKategori('Dagsryggsäck 20 l')).toEqual({ kategori: 'packning', underkategori: 'dagsryggsack' })
    expect(gissaKategori('Snöspade')).toEqual({ kategori: 'vinter', underkategori: 'snospade' })
    expect(gissaKategori('PANNLAMPA')).toEqual({ kategori: 'prylar', underkategori: 'pannlampa' })
    expect(gissaKategori('Lägerskor')).toEqual({ kategori: 'skor', underkategori: 'lagerskor' })
  })

  it('ger null när inget ord känns igen', () => {
    expect(gissaKategori('Lyckosten')).toBeNull()
  })

  it('varje ord pekar på en kategori och en underkategori som finns', () => {
    for (const k of KATEGORIER) for (const u of k.under) {
      const g = gissaKategori(u.etikett)
      if (g?.underkategori) expect(underkategoriFor(g.kategori, g.underkategori), u.etikett).not.toBeNull()
    }
  })
})

describe('snabbSak', () => {
  it('gissar kategori och typ från namnet och tolkar vikten', () => {
    expect(snabbSak(' Spork ', '18')).toEqual({
      ok: true,
      varden: { namn: 'Spork', kategori: 'kok', underkategori: 'bestick', typ: 'ryggsack', antal: 1, vikt_g: 18, notering: null },
    })
    expect(snabbSak('Gas 230', '0,4 kg')).toMatchObject({ ok: true, varden: { kategori: 'kok', underkategori: 'bransle', typ: 'forbrukas', vikt_g: 400 } })
  })

  it('vikten får saknas, och ett okänt namn hamnar i Övrigt', () => {
    expect(snabbSak('Lyckosten', '')).toMatchObject({ ok: true, varden: { kategori: 'ovrigt', underkategori: null, vikt_g: null } })
  })

  it('den valda kategorin i sökningen går före gissningen', () => {
    expect(snabbSak('Spork', '', { kategori: 'ovrigt' })).toMatchObject({ ok: true, varden: { kategori: 'ovrigt', underkategori: null } })
    expect(snabbSak('Mugg', '', { kategori: 'kok' })).toMatchObject({ ok: true, varden: { kategori: 'kok', underkategori: 'kasa' } })
    expect(snabbSak('Grej', '', { kategori: 'kok', underkategori: 'disk' })).toMatchObject({ ok: true, varden: { kategori: 'kok', underkategori: 'disk' } })
  })

  it('stoppar tomt namn, för långt namn och fel vikt', () => {
    expect(snabbSak('  ', '10')).toEqual({ ok: false, fel: 'Skriv vad saken heter.' })
    expect(snabbSak('a'.repeat(81), '')).toHaveProperty('ok', false)
    expect(snabbSak('Spork', '1,5')).toHaveProperty('ok', false)
  })
})

describe('franTur', () => {
  const rad = (r: Partial<PackradRad>): PackradRad => ({
    id: r.namn ?? 'x',
    tur_id: 't',
    namn: 'Sak',
    kategori: 'ovrigt',
    underkategori: null,
    produkt_id: null,
    antal: 1,
    vikt_g: 100,
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
  const status = (s: Partial<PackstatusRad>): PackstatusRad => ({ packrad_id: '', deltagare_id: 'jag', tur_id: 't', packad: false, namn: null, vikt_g: null, produkt_id: null, ...s })

  it('tar det jag bär och det alla ska ha med min modell, men inte andras saker eller det som inte ska med', () => {
    const k = franTur(
      [
        rad({ namn: 'Ryggsäck', bars_av: 'jag', sortering: 1 }),
        rad({ namn: 'Tält', bars_av: 'jag', gemensam: true, sortering: 2 }),
        rad({ namn: 'Sovsäck', alla: true, vikt_g: 1000, sortering: 3 }),
        rad({ namn: 'Kniv', alla: true, sortering: 4 }),
        rad({ namn: 'Kök', bars_av: 'annan', sortering: 5 }),
        rad({ namn: 'Hemma', bars_av: 'jag', med: false, sortering: 6 }),
        rad({ namn: 'Karta', gemensam: true, sortering: 7 }),
      ],
      [status({ packrad_id: 'Sovsäck', namn: 'Min dunsäck', vikt_g: 800, produkt_id: 'p1' }), status({ packrad_id: 'Kniv', deltagare_id: 'annan', namn: 'Annans kniv' })],
      'jag',
      [],
    )
    expect(k.map((x) => [x.varden.namn, x.varden.vikt_g, x.varden.produkt_id])).toEqual([
      ['Ryggsäck', 100, null],
      ['Tält', 100, null],
      ['Min dunsäck', 800, 'p1'],
      ['Kniv', 100, null],
    ])
  })

  it('markerar det som redan finns i förrådet, med samma produkt eller samma namn', () => {
    const k = franTur(
      [rad({ namn: 'Ryggsäck', bars_av: 'jag', produkt_id: 'p2', sortering: 1 }), rad({ namn: 'Spork', bars_av: 'jag', sortering: 2 }), rad({ namn: 'Kåsa', bars_av: 'jag', sortering: 3 })],
      [],
      'jag',
      [{ namn: 'Gammal säck', produkt_id: 'p2' }, { namn: ' spork ', produkt_id: null }],
    )
    expect(k.map((x) => [x.varden.namn, x.finnsRedan])).toEqual([
      ['Ryggsäck', true],
      ['Spork', true],
      ['Kåsa', false],
    ])
  })

  it('håller antal och namn inom förrådets gränser', () => {
    const [k] = franTur([rad({ namn: 'a'.repeat(120), antal: 500, bars_av: 'jag' })], [], 'jag', [])
    expect(k.varden.antal).toBe(99)
    expect(k.varden.namn).toHaveLength(80)
  })
})
