import { describe, expect, it } from 'vitest'
import {
  KATEGORIER,
  arKategori,
  faltFran,
  formateraVikt,
  forvaldTyp,
  kategoriFor,
  kategoriForUnder,
  medKategori,
  medUnderkategori,
  sakdetaljer,
  summeraForrad,
  tolkaSak,
  typEfterVal,
  TYPVAL,
  underkategoriFor,
  type SakFalt,
} from './forrad'
import type { Forradssak } from './typer'

function sak(delar: Partial<Forradssak>): Forradssak {
  return { id: crypto.randomUUID(), produkt_id: null, namn: 'Sak', kategori: 'ovrigt', underkategori: null, antal: 1, vikt_g: null, typ: 'ryggsack', notering: null, ...delar }
}

describe('kategorier', () => {
  const under = KATEGORIER.flatMap((k) => k.under.map((u) => ({ ...u, kategori: k.nyckel })))

  it('har fjorton huvudkategorier med unika nycklar, Vinter mellan medicin och hygien, och Övrigt sist', () => {
    const nycklar = KATEGORIER.map((k) => k.nyckel)
    expect(nycklar).toHaveLength(14)
    expect(new Set(nycklar).size).toBe(14)
    expect(nycklar.slice(-4)).toEqual(['medicin', 'vinter', 'hygien', 'ovrigt'])
  })

  it('snöskor ligger under Vinter, och broddar är kvar under Skor med samma nyckel', () => {
    expect(kategoriForUnder('snoskor')?.nyckel).toBe('vinter')
    expect(underkategoriFor('skor', 'broddar')?.etikett).toBe('Broddar')
    expect(KATEGORIER.find((k) => k.nyckel === 'ovrigt')?.under.at(-1)?.nyckel).toBe('ovrigt')
  })

  it('har inga dubbletter bland underkategorierna, så varje underkategori hör till exakt en huvudkategori', () => {
    const nycklar = under.map((u) => u.nyckel)
    expect(nycklar).toHaveLength(78)
    expect(new Set(nycklar).size).toBe(nycklar.length)
    for (const u of under) expect(kategoriForUnder(u.nyckel)?.nyckel, u.nyckel).toBe(u.kategori)
    expect(kategoriForUnder('finns-inte')).toBeNull()
  })

  it('har nycklar utan å, ä och ö och en etikett för varje', () => {
    for (const x of [...KATEGORIER, ...under]) {
      expect(x.nyckel).toMatch(/^[a-z_]+$/)
      expect(x.etikett.trim()).not.toBe('')
    }
  })

  it('varje huvudkategori har minst en underkategori', () => {
    for (const k of KATEGORIER) expect(k.under.length, k.nyckel).toBeGreaterThan(0)
  })

  it('känner igen en nyckel och låter en okänd bli Övrigt', () => {
    expect(arKategori('talt')).toBe(true)
    expect(arKategori('Tält')).toBe(false)
    expect(arKategori('sovsack')).toBe(false)
    expect(kategoriFor('talt').etikett).toBe('Tält och vindskydd')
    expect(kategoriFor('finns-inte').nyckel).toBe('ovrigt')
  })

  it('hittar bara en underkategori i sin egen huvudkategori', () => {
    expect(underkategoriFor('sova', 'sovsack')?.etikett).toBe('Sovsäck')
    expect(underkategoriFor('talt', 'sovsack')).toBeNull()
    expect(underkategoriFor('sova', null)).toBeNull()
    expect(underkategoriFor('sova', '')).toBeNull()
  })
})

describe('forvaldTyp', () => {
  it('skor bärs på kroppen, övriga huvudkategorier ligger i ryggsäcken', () => {
    expect(KATEGORIER.filter((k) => forvaldTyp(k.nyckel) !== 'ryggsack').map((k) => k.nyckel)).toEqual(['skor'])
  })

  it('underkategorins förval går före huvudkategorins', () => {
    expect(forvaldTyp('kok', 'bransle')).toBe('forbrukas')
    expect(forvaldTyp('kok', 'kastrull')).toBe('ryggsack')
    expect(forvaldTyp('skor', 'kangor')).toBe('kropp')
    expect(forvaldTyp('skor', 'lagerskor')).toBe('ryggsack')
  })

  it('det som går åt under turen är bränsle, reningstabletter, skavsår, mediciner och solkräm', () => {
    const under = KATEGORIER.flatMap((k) => k.under.map((u) => ({ nyckel: u.nyckel, typ: forvaldTyp(k.nyckel, u.nyckel) })))
    expect(under.filter((u) => u.typ === 'forbrukas').map((u) => u.nyckel)).toEqual(['bransle', 'rening', 'skavsar', 'mediciner', 'sol_mygg'])
  })

  it('bara solglasögon och kängor har man på sig, övriga skor ligger i ryggsäcken', () => {
    const under = KATEGORIER.flatMap((k) => k.under.map((u) => ({ nyckel: u.nyckel, typ: forvaldTyp(k.nyckel, u.nyckel) })))
    expect(under.filter((u) => u.typ === 'kropp').map((u) => u.nyckel)).toEqual(['solglasogon', 'kangor'])
    for (const u of ['lagerskor', 'damasker', 'broddar']) expect(forvaldTyp('skor', u), u).toBe('ryggsack')
  })

  it('alla andra underkategorier ligger i ryggsäcken', () => {
    const under = KATEGORIER.flatMap((k) => k.under.map((u) => forvaldTyp(k.nyckel, u.nyckel)))
    expect(under.filter((t) => t === 'ryggsack')).toHaveLength(78 - 7)
  })

  it('en underkategori från en annan huvudkategori påverkar inte typen', () => {
    expect(forvaldTyp('talt', 'bransle')).toBe('ryggsack')
  })
})

describe('kryssrutorna för typ', () => {
  it('är två: går åt under turen och har den på mig', () => {
    expect(TYPVAL.map((v) => [v.typ, v.etikett, v.hjalp])).toEqual([
      ['forbrukas', 'Går åt under turen', 'Räknas inte in i basvikten'],
      ['kropp', 'Jag har den på mig', 'Räknas inte in i ryggsäcken'],
    ])
  })

  it('ingen ikryssad betyder ryggsäcken', () => {
    expect(typEfterVal('forbrukas', false)).toBe('ryggsack')
    expect(typEfterVal('kropp', false)).toBe('ryggsack')
  })

  it('utesluter varandra: kryssas den ena i är den andra inte längre vald', () => {
    for (const forst of TYPVAL) {
      for (const sedan of TYPVAL) {
        const typ = typEfterVal(sedan.typ, true)
        expect(typ).toBe(sedan.typ)
        expect(TYPVAL.filter((v) => v.typ === typ), `${forst.typ} sedan ${sedan.typ}`).toHaveLength(1)
      }
    }
  })
})

describe('formateraVikt', () => {
  it('visar gram under 1000 g och kilo från 1000 g', () => {
    expect(formateraVikt(0)).toBe('0 g')
    expect(formateraVikt(850)).toBe('850 g')
    expect(formateraVikt(999)).toBe('999 g')
    expect(formateraVikt(1000)).toBe('1 kg')
    expect(formateraVikt(1250)).toBe('1,25 kg')
    expect(formateraVikt(2400)).toBe('2,4 kg')
    expect(formateraVikt(10000)).toBe('10 kg')
    expect(formateraVikt(12437)).toBe('12,44 kg')
  })
})

describe('summeraForrad', () => {
  it('ger ett tomt resultat för ett tomt förråd', () => {
    expect(summeraForrad([])).toEqual({ grupper: [], antal: 0, viktG: 0, utanVikt: 0 })
  })

  it('grupperar per kategori i listans ordning och sorterar sakerna på namn', () => {
    const r = summeraForrad([
      sak({ namn: 'Sovsäck', kategori: 'sova' }),
      sak({ namn: 'Tält', kategori: 'talt' }),
      sak({ namn: 'Liggunderlag', kategori: 'sova' }),
      sak({ namn: 'Ryggsäck', kategori: 'packning' }),
    ])
    expect(r.grupper.map((g) => g.kategori.nyckel)).toEqual(['packning', 'talt', 'sova'])
    expect(r.grupper[2].saker.map((s) => s.namn)).toEqual(['Liggunderlag', 'Sovsäck'])
  })

  it('räknar antal gånger vikt, per kategori och totalt', () => {
    const r = summeraForrad([
      sak({ kategori: 'vatten', antal: 3, vikt_g: 150 }),
      sak({ kategori: 'vatten', antal: 1, vikt_g: 60 }),
      sak({ kategori: 'talt', antal: 1, vikt_g: 2400 }),
    ])
    const vatten = r.grupper.find((g) => g.kategori.nyckel === 'vatten')!
    expect(vatten).toMatchObject({ antal: 4, viktG: 510, utanVikt: 0 })
    expect(r).toMatchObject({ antal: 5, viktG: 2910, utanVikt: 0 })
  })

  it('räknar saker utan vikt som 0 g och håller reda på hur många de är', () => {
    const r = summeraForrad([sak({ kategori: 'kok', vikt_g: null, antal: 2 }), sak({ kategori: 'kok', vikt_g: 0 }), sak({ kategori: 'sova', vikt_g: 900 })])
    expect(r.grupper.find((g) => g.kategori.nyckel === 'kok')).toMatchObject({ antal: 3, viktG: 0, utanVikt: 1 })
    expect(r).toMatchObject({ antal: 4, viktG: 900, utanVikt: 1 })
  })

  it('lägger en sak med okänd kategori under Övrigt', () => {
    const r = summeraForrad([sak({ kategori: 'gammal-nyckel', vikt_g: 100 })])
    expect(r.grupper.map((g) => g.kategori.nyckel)).toEqual(['ovrigt'])
  })
})

describe('tolkaSak', () => {
  const falt: SakFalt = { namn: ' Tält ', kategori: 'talt', underkategori: 'talt', typ: 'ryggsack', antal: '1', vikt: '2400', notering: ' Det gröna ' }

  it('trimmar texten och gör om antal och vikt till tal', () => {
    expect(tolkaSak(falt)).toEqual({
      ok: true,
      varden: { namn: 'Tält', kategori: 'talt', underkategori: 'talt', typ: 'ryggsack', antal: 1, vikt_g: 2400, notering: 'Det gröna' },
    })
  })

  it('låter underkategori, vikt och anteckning vara tomma', () => {
    expect(tolkaSak({ ...falt, underkategori: '', vikt: ' ', notering: '' })).toMatchObject({
      ok: true,
      varden: { underkategori: null, vikt_g: null, notering: null },
    })
  })

  it('godtar inte en underkategori från en annan huvudkategori', () => {
    expect(tolkaSak({ ...falt, underkategori: 'sovsack' }).ok).toBe(false)
    expect(tolkaSak({ ...falt, underkategori: 'tarp' }).ok).toBe(true)
  })

  it('godkänner vikten 0 g', () => {
    expect(tolkaSak({ ...falt, vikt: '0' })).toMatchObject({ ok: true, varden: { vikt_g: 0 } })
  })

  it('kräver ett namn som inte är för långt', () => {
    expect(tolkaSak({ ...falt, namn: '   ' }).ok).toBe(false)
    expect(tolkaSak({ ...falt, namn: 'a'.repeat(81) }).ok).toBe(false)
    expect(tolkaSak({ ...falt, namn: 'a'.repeat(80) }).ok).toBe(true)
  })

  it('godtar bara kategorier och typer som finns', () => {
    expect(tolkaSak({ ...falt, kategori: 'Tält' }).ok).toBe(false)
    expect(tolkaSak({ ...falt, kategori: '', underkategori: '' }).ok).toBe(false)
    expect(tolkaSak({ ...falt, typ: 'slapas' }).ok).toBe(false)
    expect(tolkaSak({ ...falt, typ: 'toString' }).ok).toBe(false)
  })

  it('kräver ett helt antal mellan 1 och 99', () => {
    for (const antal of ['0', '100', '1,5', '-1', '', 'två']) expect(tolkaSak({ ...falt, antal }).ok, antal).toBe(false)
    expect(tolkaSak({ ...falt, antal: '99' }).ok).toBe(true)
  })

  it('kräver vikten i hela gram och inte orimligt stor', () => {
    for (const vikt of ['2,4', '2.4 kg', '-5', '100001']) expect(tolkaSak({ ...falt, vikt }).ok, vikt).toBe(false)
  })

  it('begränsar anteckningens längd', () => {
    expect(tolkaSak({ ...falt, notering: 'a'.repeat(301) }).ok).toBe(false)
  })
})

describe('faltFran', () => {
  it('börjar utan vald kategori för en ny sak', () => {
    expect(faltFran()).toEqual({ namn: '', kategori: '', underkategori: '', typ: 'ryggsack', antal: '1', vikt: '', notering: '' })
  })

  it('fyller i ett förvalt namn, till exempel söktexten, utan att välja kategori', () => {
    expect(faltFran(undefined, { namn: '  Trangia 27  ' })).toMatchObject({ namn: 'Trangia 27', kategori: '', underkategori: '' })
    expect(faltFran(undefined, { namn: 'x'.repeat(200) }).namn).toHaveLength(80)
  })

  it('ger en ny sak med förval typen som hör till valet', () => {
    expect(faltFran(undefined, { kategori: 'skor' })).toMatchObject({ kategori: 'skor', underkategori: '', typ: 'kropp' })
    expect(faltFran(undefined, { kategori: 'kok', underkategori: 'bransle' })).toMatchObject({ underkategori: 'bransle', typ: 'forbrukas' })
  })

  it('fyller i en befintlig sak, med tom vikt och underkategori när de saknas', () => {
    expect(faltFran(sak({ namn: 'Kängor', kategori: 'skor', typ: 'kropp', antal: 2, vikt_g: null, notering: null }))).toEqual({
      namn: 'Kängor',
      kategori: 'skor',
      underkategori: '',
      typ: 'kropp',
      antal: '2',
      vikt: '',
      notering: '',
    })
    expect(faltFran(sak({ kategori: 'skor', underkategori: 'kangor' })).underkategori).toBe('kangor')
  })

  it('behåller typen man själv har valt på en befintlig sak', () => {
    expect(faltFran(sak({ kategori: 'skor', underkategori: 'kangor', typ: 'ryggsack' })).typ).toBe('ryggsack')
  })
})

describe('val av kategori i formuläret', () => {
  const start = faltFran()

  it('en ny huvudkategori nollställer underkategorin och sätter kategorins typ', () => {
    const kok = medUnderkategori(medKategori(start, 'kok'), 'bransle')
    expect(kok).toMatchObject({ kategori: 'kok', underkategori: 'bransle', typ: 'forbrukas' })
    expect(medKategori(kok, 'skor')).toMatchObject({ kategori: 'skor', underkategori: '', typ: 'kropp' })
  })

  it('underkategorin sätter sitt eget förval, annars huvudkategorins, även när den väljs bort', () => {
    const skor = medKategori(start, 'skor')
    expect(medUnderkategori(skor, 'lagerskor').typ).toBe('ryggsack')
    expect(medUnderkategori(skor, 'kangor').typ).toBe('kropp')
    expect(medUnderkategori(medUnderkategori(skor, 'lagerskor'), '').typ).toBe('kropp')
    expect(medUnderkategori(medKategori(start, 'medicin'), 'mediciner').typ).toBe('forbrukas')
  })

  it('rör inte det man redan har skrivit', () => {
    expect(medKategori({ ...start, namn: 'Trangia', vikt: '330' }, 'kok')).toMatchObject({ namn: 'Trangia', vikt: '330' })
  })
})

describe('sakdetaljer', () => {
  const rader = (s: Forradssak) => sakdetaljer(s).map((r) => `${r.etikett}: ${r.varde}`)

  it('visar kategori, vikt, antal och typ för en sak man har skrivit in själv', () => {
    expect(rader(sak({ kategori: 'kok', underkategori: 'bransle', vikt_g: 230, antal: 2, typ: 'forbrukas' }))).toEqual([
      'Kategori: Kök, Bränsle',
      'Vikt per styck: 230 g',
      'Antal: 2',
      'Räknas som: Förbrukas',
    ])
  })

  it('säger att vikten saknas, och upprepar inte kategorin när underkategorin heter likadant eller saknas', () => {
    expect(rader(sak({ kategori: 'ovrigt', underkategori: 'ovrigt' }))).toEqual(['Kategori: Övrigt', 'Vikt per styck: Saknas', 'Antal: 1', 'Räknas som: I ryggsäcken'])
    expect(rader(sak({ kategori: 'sova' }))[0]).toBe('Kategori: Sova')
  })

  it('lägger till version, minsta vikt och tältets egenskaper för ett tält ur katalogen', () => {
    const talt = sak({
      kategori: 'talt',
      underkategori: 'talt',
      vikt_g: 1700,
      produkter: {
        kontrollerad: null,
        version: 'Red Label',
        underkategori: 'talt',
        minvikt_g: 1300,
        kalla: 'https://exempel.se/akto',
        egenskaper: { personer: 1, sasong: 4, konstruktion: 'tunnel', golvyta_m2: 1.7 },
      },
    })
    expect(rader(talt)).toEqual([
      'Kategori: Tält och vindskydd, Tält',
      'Version: Red Label',
      'Vikt per styck: 1,7 kg',
      'Minsta vikt: 1,3 kg',
      'Antal: 1',
      'Räknas som: I ryggsäcken',
      'Personer: 1',
      'Säsonger: 4',
      'Konstruktion: Tunnel',
      'Golvyta: 1,7 m²',
    ])
  })

  it('visar produktens egenskaper efter produktens underkategori, även om man har flyttat sin sak', () => {
    const tarp = sak({
      kategori: 'ovrigt',
      produkter: { kontrollerad: null, version: null, underkategori: 'tarp', minvikt_g: null, kalla: 'https://exempel.se/tarp', egenskaper: { langd_cm: 300, konstruktion: 'annat' } },
    })
    expect(rader(tarp).slice(-1)).toEqual(['Längd: 300 cm'])
  })

  it('visar temperaturer och fyllning för en sovsäck ur katalogen', () => {
    const sovsack = sak({
      kategori: 'sova',
      underkategori: 'sovsack',
      vikt_g: 1050,
      produkter: {
        kontrollerad: null,
        version: '185 cm',
        underkategori: 'sovsack',
        minvikt_g: null,
        kalla: 'https://exempel.se/fjallsack',
        egenskaper: { komfort_temp_c: -3, limit_temp_c: -9, extrem_temp_c: -28, temperaturstandard: 'ej_angiven', fyllning: 'dun', fillpower_cuin: 800, form: 'mumie', max_langd_cm: 185, dragkedja: 'vanster' },
      },
    })
    expect(rader(sovsack)).toEqual([
      'Kategori: Sova, Sovsäck',
      'Version: 185 cm',
      'Vikt per styck: 1,05 kg',
      'Antal: 1',
      'Räknas som: I ryggsäcken',
      'Komforttemperatur: \u22123 °C (ej ISO-testad)',
      'Limittemperatur: \u22129 °C (ej ISO-testad)',
      'Fyllning: Dun',
      'Fillpower: 800 cuin',
      'Form: Mumie',
      'Max längd: 185 cm',
    ])
  })
})
