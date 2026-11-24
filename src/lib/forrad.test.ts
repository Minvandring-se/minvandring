import { describe, expect, it } from 'vitest'
import {
  KATEGORIER,
  antalGranskade,
  arKategori,
  storstaVinsten,
  faltFran,
  flerKategorier,
  formateraVikt,
  forradsrad,
  forvaldTyp,
  kategoriFor,
  kategoriForUnder,
  listdelar,
  medKategori,
  medUnderkategori,
  egenskapsdelar,
  produktdetaljer,
  sakdetaljer,
  saknadeGrundsaker,
  summeraForrad,
  tolkaSak,
  typEfterVal,
  TYPVAL,
  underkategoriFor,
  underkategorierFor,
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
    expect(nycklar).toHaveLength(79)
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

  it('ger en kategoris underkategorier i samma ordning som i KATEGORIER', () => {
    expect(underkategorierFor('sova').map((u) => u.nyckel)).toEqual(KATEGORIER.find((k) => k.nyckel === 'sova')?.under.map((u) => u.nyckel))
    expect(underkategorierFor('vatten')[0].etikett).toBe('Flaska')
    expect(underkategorierFor('')).toEqual([])
    expect(underkategorierFor('finns-inte')).toEqual([])
    expect(underkategorierFor('sovsack')).toEqual([])
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
    expect(under.filter((t) => t === 'ryggsack')).toHaveLength(79 - 7)
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

describe('produktdetaljer', () => {
  const talt = {
    packvikt_g: 1700,
    minvikt_g: 1450,
    pris_sek_ca: 8995,
    underkategori: 'talt',
    egenskaper: { personer: 1, sasong: 4, konstruktion: 'tunnel', golvyta_m2: 1.6, absider: 1, ingangar: 1, packmatt_cm: '48 x 15' },
  }
  const text = (rader: { etikett: string; varde: string }[]) => rader.map((r) => `${r.etikett}: ${r.varde}`)

  it('visar vikt, minsta vikt och ungefärligt pris först', () => {
    expect(text(produktdetaljer(talt).grund)).toEqual(['Vikt: 1,7 kg', 'Minsta vikt: 1,45 kg', 'Ungefärligt pris: 8 995 kr'])
  })

  it('hoppar över minsta vikt och pris när de saknas', () => {
    expect(text(produktdetaljer({ ...talt, minvikt_g: null, pris_sek_ca: null }).grund)).toEqual(['Vikt: 1,7 kg'])
  })

  it('delar egenskaperna i de viktiga och de övriga, som i Mitt förråd', () => {
    const d = produktdetaljer(talt)
    expect(text(d.viktiga)).toEqual(['Personer: 1', 'Säsonger: 4', 'Konstruktion: Tunnel', 'Golvyta: 1,6 m²', 'Absider: 1'])
    expect(text(d.ovriga)).toEqual(['Ingångar: 1', 'Packmått (cm): 48 x 15'])
    expect(egenskapsdelar(talt)).toEqual({ viktiga: d.viktiga, ovriga: d.ovriga })
  })

  it('har inga egenskaper för en produkt utan egenskaper', () => {
    const d = produktdetaljer({ ...talt, underkategori: 'kudde', egenskaper: {} })
    expect([d.viktiga, d.ovriga]).toEqual([[], []])
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
      'Vikt per styck: Ingen vikt',
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
    expect(text(d.grund).slice(1, 3)).toEqual(['Vikt per styck: Ingen vikt', 'Katalogens vikt: 1,7 kg'])
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

describe('saknadeGrundsaker', () => {
  const ryggsack = sak({ kategori: 'packning', underkategori: 'ryggsack', vikt_g: 3300 })
  const talt = sak({ kategori: 'talt', underkategori: 'talt', vikt_g: 1700 })
  const sovsack = sak({ kategori: 'sova', underkategori: 'sovsack', vikt_g: 870 })
  const underlag = sak({ kategori: 'sova', underkategori: 'liggunderlag', vikt_g: 585 })

  it('ett tomt förråd saknar alla fyra, i ordningen i KATEGORIER, med texter och underkategori att öppna', () => {
    expect(saknadeGrundsaker([])).toEqual([
      { grupp: 'ryggsack', kategori: 'packning', underkategori: 'ryggsack', rubrik: 'Du har ingen ryggsäck än', hjalp: 'Lägg till den du bär på flerdagsturer.' },
      { grupp: 'talt', kategori: 'talt', underkategori: 'talt', rubrik: 'Du har inget tält eller tarp än', hjalp: 'Lägg till det du sover under på flerdagsturer.' },
      { grupp: 'sovsack', kategori: 'sova', underkategori: 'sovsack', rubrik: 'Du har ingen sovsäck än', hjalp: 'Lägg till din, så räknas den med i vikten.' },
      { grupp: 'liggunderlag', kategori: 'sova', underkategori: 'liggunderlag', rubrik: 'Du har inget liggunderlag än', hjalp: 'Sök i katalogen eller skriv in det själv.' },
    ])
  })

  it('saknar ingenting när alla fyra finns, även utan vikt', () => {
    expect(saknadeGrundsaker([ryggsack, talt, sovsack, underlag])).toEqual([])
    expect(saknadeGrundsaker([ryggsack, talt, sovsack, underlag].map((s) => ({ ...s, vikt_g: null })))).toEqual([])
  })

  it('en tarp räcker för tält, men inte en vindsäck', () => {
    const tarp = sak({ kategori: 'talt', underkategori: 'tarp' })
    const vindsack = sak({ kategori: 'talt', underkategori: 'vindsack' })
    expect(saknadeGrundsaker([ryggsack, tarp, sovsack, underlag])).toEqual([])
    expect(saknadeGrundsaker([ryggsack, vindsack, sovsack, underlag]).map((s) => s.grupp)).toEqual(['talt'])
  })

  it('en quilt räcker för sovsäck, men en dagsryggsäck räcker inte för ryggsäck', () => {
    const quilt = sak({ kategori: 'sova', underkategori: 'quilt' })
    const dag = sak({ kategori: 'packning', underkategori: 'dagsryggsack' })
    expect(saknadeGrundsaker([dag, talt, quilt, underlag]).map((s) => s.grupp)).toEqual(['ryggsack'])
  })

  it('en sak utan underkategori räknas inte', () => {
    expect(saknadeGrundsaker([sak({ kategori: 'sova', underkategori: null }), ryggsack, talt]).map((s) => s.grupp)).toEqual(['sovsack', 'liggunderlag'])
  })
})

describe('listdelar', () => {
  it('blandar kategorier med saker och kategorier där en grundsak saknas, i ordningen i KATEGORIER', () => {
    const talt = sak({ namn: 'Akto', kategori: 'talt', underkategori: 'talt', vikt_g: 1700 })
    const kok = sak({ namn: 'Trangia', kategori: 'kok', underkategori: 'brannare', vikt_g: 900 })
    const saker = [kok, talt]
    const delar = listdelar(summeraForrad(saker).grupper, saknadeGrundsaker(saker))
    expect(delar.map((d) => [d.kategori.nyckel, d.grupp?.antal ?? null, d.saknade.map((s) => s.grupp)])).toEqual([
      ['packning', null, ['ryggsack']],
      ['talt', 1, []],
      ['sova', null, ['sovsack', 'liggunderlag']],
      ['kok', 1, []],
    ])
  })

  it('lägger det som saknas i en kategori som har andra saker', () => {
    const kudde = sak({ kategori: 'sova', underkategori: 'kudde', vikt_g: 80 })
    const sovsack = sak({ kategori: 'sova', underkategori: 'sovsack', vikt_g: 870 })
    const delar = listdelar(summeraForrad([kudde, sovsack]).grupper, saknadeGrundsaker([kudde, sovsack]))
    expect(delar.find((d) => d.kategori.nyckel === 'sova')).toMatchObject({ grupp: { antal: 2 }, saknade: [{ grupp: 'liggunderlag' }] })
  })

  it('visar bara kategorier med saker när inget saknas skickas in, till exempel med filter', () => {
    const kok = sak({ kategori: 'kok', vikt_g: 900 })
    expect(listdelar(summeraForrad([kok]).grupper, []).map((d) => d.kategori.nyckel)).toEqual(['kok'])
  })
})

describe('flerKategorier', () => {
  it('ger Kök, Vatten, Kläder, Prylar och elektronik och Första hjälpen och medicin när förrådet saknar dem', () => {
    expect(flerKategorier([]).map((k) => k.etikett)).toEqual(['Kök', 'Vatten', 'Kläder', 'Prylar och elektronik', 'Första hjälpen och medicin'])
  })

  it('tar bara med de kategorier som saknar saker', () => {
    const saker = [sak({ kategori: 'kok' }), sak({ kategori: 'klader' }), sak({ kategori: 'talt' })]
    expect(flerKategorier(saker).map((k) => k.nyckel)).toEqual(['vatten', 'prylar', 'medicin'])
  })

  it('är tom när alla fem har saker', () => {
    expect(flerKategorier(['kok', 'vatten', 'klader', 'prylar', 'medicin'].map((kategori) => sak({ kategori })))).toEqual([])
  })
})

describe('storstaVinsten', () => {
  it('pekar ut saken som väger mest, med antal gånger vikt', () => {
    const talt = sak({ id: 't', namn: 'Tält', kategori: 'talt', vikt_g: 1700 })
    const flaskor = sak({ id: 'f', namn: 'Flaska', kategori: 'vatten', vikt_g: 600, antal: 3 })
    expect(storstaVinsten([talt, flaskor])).toEqual({ id: 'f', namn: 'Flaska', viktG: 1800, kategori: 'Vatten' })
  })

  it('hoppar över saker utan vikt och ger null när ingen sak har vikt', () => {
    expect(storstaVinsten([sak({ vikt_g: null }), sak({ vikt_g: 0 })])).toBeNull()
    expect(storstaVinsten([])).toBeNull()
  })
})

describe('antalGranskade', () => {
  const fran = (produkt: ForradsProdukt, vikt_g = produkt.packvikt_g) => sak({ produkt_id: produkt.id, kategori: 'talt', vikt_g, produkter: produkt })

  it('räknar saker med katalogens vikt som är granskad eller stickprovskontrollerad', () => {
    const saker = [
      fran(katalogprodukt({ granskad: '2026-11-01' })),
      fran(katalogprodukt({ kontrollerad: '2026-11-02' })),
      fran(katalogprodukt()),
      fran(katalogprodukt({ granskad: '2026-11-01', kalla_typ: 'butik' })),
      sak({ vikt_g: 100 }),
    ]
    expect(antalGranskade(saker)).toBe(2)
  })

  it('räknar inte en sak med egen vikt', () => {
    expect(antalGranskade([fran(katalogprodukt({ granskad: '2026-11-01' }), 1750)])).toBe(0)
  })
})
