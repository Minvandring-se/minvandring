import { describe, expect, it } from 'vitest'
import {
  KATEGORIER,
  arKategori,
  faltFran,
  formateraVikt,
  forradsrad,
  fyraTunga,
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
  viktjamforelse,
  type SakFalt,
} from './forrad'
import type { ForradsProdukt, Forradssak } from './typer'

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

  it('tar emot vikten i gram eller kilo', () => {
    expect(tolkaSak({ ...falt, vikt: '2.4 kg' })).toMatchObject({ ok: true, varden: { vikt_g: 2400 } })
    expect(tolkaSak({ ...falt, vikt: '1,2kg' })).toMatchObject({ ok: true, varden: { vikt_g: 1200 } })
    expect(tolkaSak({ ...falt, vikt: '850 g' })).toMatchObject({ ok: true, varden: { vikt_g: 850 } })
  })

  it('sparar inte en vikt som inte går att tolka eller är orimligt stor', () => {
    for (const vikt of ['2,4', 'tungt', '-5', '100001', '101 kg']) expect(tolkaSak({ ...falt, vikt }).ok, vikt).toBe(false)
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

/** En produkt som saken kan komma från. Enskilda fält byts ut i testerna. */
function katalogprodukt(delar: Partial<ForradsProdukt> = {}): ForradsProdukt {
  return {
    id: 'p1',
    marke: 'Hilleberg',
    modell: 'Akto',
    packvikt_g: 1700,
    kontrollerad: null,
    granskad: null,
    kalla_typ: 'tillverkare',
    version: 'Red Label',
    underkategori: 'talt',
    minvikt_g: 1300,
    kalla: 'https://exempel.se/akto',
    egenskaper: {},
    ...delar,
  }
}

describe('viktjamforelse', () => {
  const franKatalogen = (vikt_g: number | null, produkt = katalogprodukt()) => sak({ produkt_id: 'p1', kategori: 'talt', vikt_g, produkter: produkt })

  it('samma vikt som katalogen är inte en egen vikt', () => {
    expect(viktjamforelse(franKatalogen(1700))).toEqual({ egen: false, katalogG: 1700 })
  })

  it('en annan vikt än katalogens är en egen vikt, oavsett om den är högre eller lägre', () => {
    expect(viktjamforelse(franKatalogen(1750))).toEqual({ egen: true, katalogG: 1700 })
    expect(viktjamforelse(franKatalogen(1699)).egen).toBe(true)
  })

  it('en borttagen vikt skiljer sig också från katalogens, så att den går att återställa', () => {
    expect(viktjamforelse(franKatalogen(null))).toEqual({ egen: true, katalogG: 1700 })
  })

  it('utan vikt i katalogen finns inget att jämföra med', () => {
    expect(viktjamforelse(franKatalogen(1750, katalogprodukt({ packvikt_g: null })))).toEqual({ egen: false, katalogG: null })
  })

  it('en sak utan produkt_id har aldrig en egen vikt', () => {
    expect(viktjamforelse(sak({ vikt_g: 1750 }))).toEqual({ egen: false, katalogG: null })
    expect(viktjamforelse(sak({ vikt_g: null }))).toEqual({ egen: false, katalogG: null })
    // Produkten är borttagen ur katalogen: produkt_id är tomt även om listan skulle ha kvar uppgifterna.
    expect(viktjamforelse(sak({ produkt_id: null, vikt_g: 1750, produkter: katalogprodukt() })).egen).toBe(false)
  })

  it('en sak vars produkt inte följde med i hämtningen har ingen egen vikt', () => {
    expect(viktjamforelse(sak({ produkt_id: 'p1', vikt_g: 1750, produkter: null })).egen).toBe(false)
  })
})

describe('sakdetaljer', () => {
  const text = (rader: { etikett: string; varde: string }[]) => rader.map((r) => `${r.etikett}: ${r.varde}`)

  it('visar kategori, vikt, antal och typ för en sak man har skrivit in själv, och inga specifikationer', () => {
    const d = sakdetaljer(sak({ kategori: 'kok', underkategori: 'bransle', vikt_g: 230, antal: 2, typ: 'forbrukas' }))
    expect(text(d.grund)).toEqual(['Kategori: Kök, Bränsle', 'Vikt per styck: 230 g', 'Antal: 2', 'Räknas som: Förbrukas'])
    expect(d.viktiga).toEqual([])
    expect(d.ovriga).toEqual([])
  })

  it('säger att vikten saknas, och upprepar inte kategorin när underkategorin heter likadant eller saknas', () => {
    expect(text(sakdetaljer(sak({ kategori: 'ovrigt', underkategori: 'ovrigt' })).grund)).toEqual([
      'Kategori: Övrigt',
      'Vikt per styck: Saknas',
      'Antal: 1',
      'Räknas som: I ryggsäcken',
    ])
    expect(sakdetaljer(sak({ kategori: 'sova' })).grund[0].varde).toBe('Sova')
  })

  it('visar de viktigaste egenskaperna för ett tält först, och resten bland alla specifikationer', () => {
    const talt = sak({
      produkt_id: 'p1',
      kategori: 'talt',
      underkategori: 'talt',
      vikt_g: 1700,
      produkter: katalogprodukt({
        egenskaper: { personer: 1, sasong: 4, konstruktion: 'tunnel', fristaende: 'nej', golvyta_m2: 1.7, absider: 1, innerhojd_cm: 93, material_typ: 'kerlon' },
      }),
    })
    const d = sakdetaljer(talt)
    expect(text(d.grund)).toEqual(['Kategori: Tält och vindskydd, Tält', 'Vikt per styck: 1,7 kg', 'Antal: 1', 'Räknas som: I ryggsäcken'])
    expect(text(d.viktiga)).toEqual(['Personer: 1', 'Säsonger: 4', 'Konstruktion: Tunnel', 'Fristående: Nej', 'Golvyta: 1,7 m²', 'Absider: 1'])
    expect(text(d.ovriga)).toEqual(['Version: Red Label', 'Minsta vikt: 1,3 kg', 'Innerhöjd: 93 cm', 'Material: Kerlon'])
  })

  it('märker en ändrad vikt som egen och visar katalogens vikt bredvid', () => {
    const d = sakdetaljer(sak({ produkt_id: 'p1', kategori: 'talt', underkategori: 'talt', vikt_g: 1750, produkter: katalogprodukt() }))
    expect(text(d.grund)).toEqual([
      'Kategori: Tält och vindskydd, Tält',
      'Vikt per styck: 1,75 kg (egen vikt)',
      'Katalogens vikt: 1,7 kg',
      'Antal: 1',
      'Räknas som: I ryggsäcken',
    ])
  })

  it('visar katalogens vikt även när den egna vikten är borttagen', () => {
    const d = sakdetaljer(sak({ produkt_id: 'p1', kategori: 'talt', vikt_g: null, produkter: katalogprodukt() }))
    expect(text(d.grund).slice(1, 3)).toEqual(['Vikt per styck: Saknas', 'Katalogens vikt: 1,7 kg'])
  })

  it('en egen sak får aldrig texten egen vikt', () => {
    expect(text(sakdetaljer(sak({ vikt_g: 1750 })).grund).join(' ')).not.toContain('egen vikt')
  })

  it('visar produktens egenskaper efter produktens underkategori, även om man har flyttat sin sak', () => {
    const tarp = sak({
      produkt_id: 'p1',
      kategori: 'ovrigt',
      produkter: katalogprodukt({ version: null, underkategori: 'tarp', minvikt_g: null, egenskaper: { langd_cm: 300, konstruktion: 'annat', vattenpelare_duk_mm: 3000 } }),
    })
    const d = sakdetaljer(tarp)
    expect(text(d.viktiga)).toEqual(['Längd: 300 cm'])
    expect(text(d.ovriga)).toEqual(['Vattenpelare duk: 3000 mm'])
  })

  it('visar temperaturer och fyllning först för en sovsäck ur katalogen', () => {
    const sovsack = sak({
      produkt_id: 'p2',
      kategori: 'sova',
      underkategori: 'sovsack',
      vikt_g: 1050,
      produkter: katalogprodukt({
        packvikt_g: 1050,
        version: '185 cm',
        underkategori: 'sovsack',
        minvikt_g: null,
        egenskaper: { komfort_temp_c: -3, limit_temp_c: -9, extrem_temp_c: -28, temperaturstandard: 'ej_angiven', fyllning: 'dun', fillpower_cuin: 800, form: 'mumie', max_langd_cm: 185, dragkedja: 'vanster' },
      }),
    })
    const d = sakdetaljer(sovsack)
    expect(text(d.viktiga)).toEqual([
      'Komforttemperatur: \u22123 °C (ej ISO-testad)',
      'Limittemperatur: \u22129 °C (ej ISO-testad)',
      'Fyllning: Dun',
      'Form: Mumie',
      'Max längd: 185 cm',
    ])
    expect(text(d.ovriga)).toEqual(['Version: 185 cm', 'Extremtemperatur: \u221228 °C', 'Temperaturstandard: Inte angiven', 'Fillpower: 800 cuin', 'Dragkedja: Vänster'])
  })
})

describe('forradsrad', () => {
  it('säger hur många saker som finns, med singular för en', () => {
    expect(forradsrad({ antal: 1, utanVikt: 0 })).toEqual({ saker: '1 sak i förrådet', saknarVikt: null })
    expect(forradsrad({ antal: 4, utanVikt: 0 })).toEqual({ saker: '4 saker i förrådet', saknarVikt: null })
  })

  it('lägger till hur många som saknar vikt när det är minst en', () => {
    expect(forradsrad({ antal: 4, utanVikt: 2 })).toEqual({ saker: '4 saker i förrådet', saknarVikt: '2 saknar vikt' })
    expect(forradsrad({ antal: 1, utanVikt: 1 }).saknarVikt).toBe('1 saknar vikt')
  })

  it('räknar från samma summering som listan', () => {
    const summa = summeraForrad([sak({ vikt_g: null }), sak({ vikt_g: 100, antal: 3 })])
    expect(forradsrad(summa)).toEqual({ saker: '4 saker i förrådet', saknarVikt: '1 saknar vikt' })
  })
})

describe('fyraTunga', () => {
  const ryggsack = sak({ id: 'r', namn: 'Kajka 65', kategori: 'packning', underkategori: 'ryggsack', vikt_g: 3300 })
  const talt = sak({ id: 't', namn: 'Akto', kategori: 'talt', underkategori: 'talt', vikt_g: 1700 })
  const sovsack = sak({ id: 's', namn: 'Neutrino', kategori: 'sova', underkategori: 'sovsack', vikt_g: 870 })
  const underlag = sak({ id: 'l', namn: 'Ultra 5R', kategori: 'sova', underkategori: 'liggunderlag', vikt_g: 585 })
  const alla = [ryggsack, talt, sovsack, underlag]

  it('visas inte när förrådet är tomt', () => {
    expect(fyraTunga([])).toBeNull()
  })

  it('summerar ryggsäck, tält, sovsäck och liggunderlag när alla finns med vikt', () => {
    expect(fyraTunga(alla)).toEqual({ viktG: 6455, komplett: true, text: 'De fyra tunga: 6,46 kg', uppmaningar: [] })
  })

  it('räknar inte in andra saker, och inte antal', () => {
    const kok = sak({ kategori: 'kok', underkategori: 'brannare', vikt_g: 400 })
    const tarp = sak({ kategori: 'talt', underkategori: 'tarp', vikt_g: 500 })
    const utanUnder = sak({ kategori: 'sova', underkategori: null, vikt_g: 900 })
    expect(fyraTunga([...alla, kok, tarp, utanUnder, { ...sovsack, id: 's2', vikt_g: 900, antal: 3 }])?.viktG).toBe(6455)
  })

  it('räknar den lättaste när man har flera i samma grupp', () => {
    const lattTalt = sak({ id: 't2', kategori: 'talt', underkategori: 'talt', vikt_g: 835 })
    expect(fyraTunga([...alla, lattTalt])).toMatchObject({ viktG: 6455 - 1700 + 835, komplett: true })
  })

  it('räknar en quilt som sovsäck, och den lättaste av de två', () => {
    const quilt = sak({ id: 'q', kategori: 'sova', underkategori: 'quilt', vikt_g: 527 })
    expect(fyraTunga([ryggsack, talt, quilt, underlag])).toMatchObject({ komplett: true, viktG: 3300 + 1700 + 527 + 585 })
    expect(fyraTunga([...alla, quilt])?.viktG).toBe(3300 + 1700 + 527 + 585)
  })

  it('uppmanar att lägga till det som saknas, och skriver summan som minst', () => {
    const r = fyraTunga([ryggsack, talt, sovsack])
    expect(r).toMatchObject({ viktG: 5870, komplett: false, text: 'De fyra tunga: minst 5,87 kg' })
    expect(r?.uppmaningar).toEqual([{ grupp: 'liggunderlag', text: 'Lägg till ett liggunderlag', gor: 'laggTill', kategori: 'sova' }])
  })

  it('har en uppmaning per saknad grupp, med rätt kategori att öppna', () => {
    const r = fyraTunga([sak({ kategori: 'kok', underkategori: 'brannare', vikt_g: 400 })])
    expect(r).toMatchObject({ viktG: 0, komplett: false, text: 'De fyra tunga' })
    expect(r?.uppmaningar.map((u) => [u.text, u.gor === 'laggTill' ? u.kategori : null])).toEqual([
      ['Lägg till en ryggsäck', 'packning'],
      ['Lägg till ett tält', 'talt'],
      ['Lägg till en sovsäck', 'sova'],
      ['Lägg till ett liggunderlag', 'sova'],
    ])
  })

  it('en dagsryggsäck räknas inte som ryggsäck, och uppmaningen säger vandringsryggsäck', () => {
    const dag = sak({ id: 'd', kategori: 'packning', underkategori: 'dagsryggsack', vikt_g: 600 })
    const r = fyraTunga([dag, talt, sovsack, underlag])
    expect(r).toMatchObject({ viktG: 1700 + 870 + 585, komplett: false })
    expect(r?.uppmaningar).toEqual([{ grupp: 'ryggsack', text: 'Lägg till en vandringsryggsäck', gor: 'laggTill', kategori: 'packning' }])
    // Med en vanlig ryggsäck också räknas bara den.
    expect(fyraTunga([dag, ...alla])).toMatchObject({ viktG: 6455, komplett: true })
  })

  it('en sak utan vikt räknas inte i summan, och uppmaningen pekar på saken', () => {
    const utan = { ...sovsack, vikt_g: null }
    const r = fyraTunga([ryggsack, talt, utan, underlag])
    expect(r).toMatchObject({ viktG: 3300 + 1700 + 585, komplett: false, text: 'De fyra tunga: minst 5,58 kg' })
    expect(r?.uppmaningar).toEqual([{ grupp: 'sovsack', text: 'Fyll i vikten på din sovsäck', gor: 'fyllIVikt', sakId: 's' }])
  })

  it('använder den lättaste som har vikt när någon i gruppen saknar vikt', () => {
    const utan = sak({ id: 't0', kategori: 'talt', underkategori: 'talt', vikt_g: null })
    const tungt = sak({ id: 't3', kategori: 'talt', underkategori: 'talt', vikt_g: 2400 })
    expect(fyraTunga([ryggsack, utan, tungt, talt, sovsack, underlag])).toEqual({ viktG: 6455, komplett: true, text: 'De fyra tunga: 6,46 kg', uppmaningar: [] })
  })

  it('säger rätt sak för varje grupp som bara har saker utan vikt', () => {
    const r = fyraTunga(alla.map((s) => ({ ...s, vikt_g: null })))
    expect(r).toMatchObject({ viktG: 0, komplett: false, text: 'De fyra tunga' })
    expect(r?.uppmaningar.map((u) => u.text)).toEqual([
      'Fyll i vikten på din ryggsäck',
      'Fyll i vikten på ditt tält',
      'Fyll i vikten på din sovsäck',
      'Fyll i vikten på ditt liggunderlag',
    ])
  })

  it('säger quilt när det är en quilt som saknar vikt', () => {
    const quilt = sak({ id: 'q', kategori: 'sova', underkategori: 'quilt', vikt_g: null })
    expect(fyraTunga([ryggsack, talt, quilt, underlag])?.uppmaningar).toEqual([{ grupp: 'sovsack', text: 'Fyll i vikten på din quilt', gor: 'fyllIVikt', sakId: 'q' }])
  })

  it('blandar saknade saker och saknade vikter', () => {
    const r = fyraTunga([{ ...ryggsack, vikt_g: null }, talt])
    expect(r).toMatchObject({ viktG: 1700, text: 'De fyra tunga: minst 1,7 kg' })
    expect(r?.uppmaningar.map((u) => u.gor)).toEqual(['fyllIVikt', 'laggTill', 'laggTill'])
  })

  it('räknar vikten 0 g som en ifylld vikt', () => {
    expect(fyraTunga([ryggsack, talt, sovsack, { ...underlag, vikt_g: 0 }])).toMatchObject({ komplett: true, viktG: 5870 })
  })
})
