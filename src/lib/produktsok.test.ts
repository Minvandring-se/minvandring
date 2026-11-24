import { describe, expect, it } from 'vitest'
import { faltFran } from './forrad'
import {
  antalText,
  forvalFranProdukt,
  gArAttSoka,
  iForradetText,
  ingaTraffarText,
  grupperaModeller,
  markenMedAntal,
  modellMedProdukt,
  produktnamn,
  sakFranProdukt,
  sokfilter,
  sokord,
  sorteraTraffar,
  visasText,
} from './produktsok'
import type { Produkt } from './typer'

function produkt(marke: string, modell: string, delar: Partial<Produkt> = {}): Produkt {
  return { id: `${marke}-${modell}`, marke, modell, version: null, kategori: 'talt', underkategori: 'talt', packvikt_g: 1000, kontrollerad: null, granskad: null, kalla_typ: 'tillverkare', ...delar }
}

describe('sokord', () => {
  it('delar upp texten i ord med små bokstäver', () => {
    expect(sokord('  Hilleberg   AKTO ')).toEqual(['hilleberg', 'akto'])
    expect(sokord('Fjällräven')).toEqual(['fjällräven'])
  })

  it('delar på allt som inte är bokstäver eller siffror, så att inget kan ändra filtret', () => {
    expect(sokord('X-Mid 1')).toEqual(['x', 'mid', '1'])
    expect(sokord('a,b)or(c.eq%_"')).toEqual(['a', 'b', 'or', 'c', 'eq'])
    expect(sokord('%%% ,,, ()')).toEqual([])
  })

  it('tar högst fem ord', () => {
    expect(sokord('a b c d e f g')).toHaveLength(5)
  })
})

describe('gArAttSoka', () => {
  it('kräver minst två tecken som går att söka på', () => {
    expect(gArAttSoka('')).toBe(false)
    expect(gArAttSoka(' a ')).toBe(false)
    expect(gArAttSoka('--')).toBe(false)
    expect(gArAttSoka('ak')).toBe(true)
    expect(gArAttSoka('x 1')).toBe(true)
  })
})

describe('sokfilter', () => {
  it('söker i märke, modell och version', () => {
    expect(sokfilter('akto')).toBe('marke.ilike.%akto%,modell.ilike.%akto%,version.ilike.%akto%')
  })

  it('tar med underkategorin när ordet är ett kategorinamn', () => {
    expect(sokfilter('tarp')).toBe('marke.ilike.%tarp%,modell.ilike.%tarp%,version.ilike.%tarp%,underkategori.in.(tarp)')
    expect(sokfilter('sovsäck')).toContain('underkategori.in.(sovsack)')
  })

  it('tar med hela huvudkategorin när ordet finns i dess namn', () => {
    expect(sokfilter('tält')).toContain('underkategori.in.(talt,tarp,vindsack,hangmatta,talttillbehor)')
    expect(sokfilter('sova')).toContain('underkategori.in.(sovsack,quilt,liggunderlag,kudde,lakan,sittunderlag,pump)')
  })

  it('gissar inte kategori på ett eller två tecken', () => {
    expect(sokfilter('tä')).toBe('marke.ilike.%tä%,modell.ilike.%tä%,version.ilike.%tä%')
  })
})

describe('sorteraTraffar', () => {
  const nallo3 = produkt('Hilleberg', 'Nallo 3')
  const nallo2 = produkt('Hilleberg', 'Nallo 2')
  const akto = produkt('Hilleberg', 'Akto')
  const abisko = produkt('Fjällräven', 'Abisko Lite 2')
  const tarp = produkt('Fjällräven', 'Abisko Tarp', { underkategori: 'tarp' })

  it('sätter namn som börjar med söktexten först, sedan i bokstavsordning', () => {
    expect(sorteraTraffar([nallo3, akto, abisko, nallo2], 'hilleberg').map((p) => p.modell)).toEqual(['Akto', 'Nallo 2', 'Nallo 3', 'Abisko Lite 2'])
  })

  it('räknar en modell som börjar med söktexten som bästa träff', () => {
    expect(sorteraTraffar([abisko, akto, nallo2], 'nallo')[0]).toBe(nallo2)
    expect(sorteraTraffar([akto, tarp, abisko], 'abisko l')[0]).toBe(abisko)
  })

  it('sätter ordstarter före träffar mitt i ett ord', () => {
    const mitt = produkt('Annat', 'Superlite')
    expect(sorteraTraffar([mitt, abisko], 'lite').map((p) => p.modell)).toEqual(['Abisko Lite 2', 'Superlite'])
  })

  it('sorterar siffror som tal och samma modell på version', () => {
    const tio = produkt('Märke', 'Tält 10')
    const tva = produkt('Märke', 'Tält 2')
    expect(sorteraTraffar([tio, tva], 'märke').map((p) => p.modell)).toEqual(['Tält 2', 'Tält 10'])
    const rod = produkt('Märke', 'Tält', { id: 'r', version: 'Red Label' })
    const gul = produkt('Märke', 'Tält', { id: 'g', version: 'Yellow Label' })
    expect(sorteraTraffar([gul, rod], 'tält').map((p) => p.version)).toEqual(['Red Label', 'Yellow Label'])
  })

  it('ändrar inte listan den får in', () => {
    const lista = [nallo3, akto]
    sorteraTraffar(lista, 'hilleberg')
    expect(lista).toEqual([nallo3, akto])
  })
})

describe('sakFranProdukt', () => {
  it('kopierar namn, kategori, underkategori och packvikt, och pekar på produkten', () => {
    const p = produkt('Hilleberg', 'Akto', { id: 'p1', version: 'Red Label', packvikt_g: 1700 })
    expect(produktnamn(p)).toBe('Hilleberg Akto')
    expect(sakFranProdukt(p)).toEqual({
      produkt_id: 'p1',
      namn: 'Hilleberg Akto',
      kategori: 'talt',
      underkategori: 'talt',
      typ: 'ryggsack',
      antal: 1,
      vikt_g: 1700,
      notering: null,
    })
  })

  it('tar typen från underkategorins förval', () => {
    expect(sakFranProdukt(produkt('Primus', 'Gas 230', { kategori: 'kok', underkategori: 'bransle' })).typ).toBe('forbrukas')
    expect(sakFranProdukt(produkt('Lundhags', 'Känga', { kategori: 'skor', underkategori: 'kangor' })).typ).toBe('kropp')
  })

  it('kortar ett namn som är längre än förrådet tillåter', () => {
    expect(sakFranProdukt(produkt('M', 'x'.repeat(200))).namn).toHaveLength(80)
  })
})

describe('forvalFranProdukt', () => {
  it('fyller formuläret med samma uppgifter som när produkten väljs i Lägg till utrustning', () => {
    const p = produkt('Rab', 'Neutrino 400', { id: 'p2', version: 'Long', kategori: 'sova', underkategori: 'sovsack', packvikt_g: 1010 })
    expect(forvalFranProdukt(p)).toEqual({ namn: 'Rab Neutrino 400', kategori: 'sova', underkategori: 'sovsack', vikt_g: 1010, produkt_id: 'p2' })
  })

  it('ger formulärets startvärden med vikt och typ, och antal 1', () => {
    const p = produkt('Primus', 'Gas 230', { id: 'p3', kategori: 'kok', underkategori: 'bransle', packvikt_g: 360 })
    expect(faltFran(undefined, forvalFranProdukt(p))).toEqual({
      namn: 'Primus Gas 230',
      kategori: 'kok',
      underkategori: 'bransle',
      typ: 'forbrukas',
      antal: '1',
      vikt: '360',
      notering: '',
    })
  })

  it('hoppar över en kategori eller underkategori som inte finns', () => {
    const p = produkt('X', 'Y', { kategori: 'finns-inte', underkategori: 'finns-inte' })
    expect(forvalFranProdukt(p)).toMatchObject({ kategori: undefined, underkategori: undefined })
  })
})

describe('grupperaModeller', () => {
  const regular = produkt('Rab', 'Neutrino -6 °C', { id: 'r', version: 'Regular', packvikt_g: 870 })
  const lang = produkt('Rab', 'Neutrino -6 °C', { id: 'l', version: 'Long', packvikt_g: 930 })
  const kort = produkt('Rab', 'Neutrino -6 °C', { id: 'k', version: 'Short', packvikt_g: 820 })
  const akto = produkt('Hilleberg', 'Akto', { id: 'a', version: 'Red Label', packvikt_g: 1700 })

  it('slår ihop samma märke och modell till en rad, med den lättaste varianten först', () => {
    const [m, ...resten] = grupperaModeller([regular, lang, kort])
    expect(resten).toEqual([])
    expect(m).toMatchObject({ marke: 'Rab', modell: 'Neutrino -6 °C' })
    expect(m.varianter.map((v) => [v.version, v.packvikt_g])).toEqual([
      ['Short', 820],
      ['Regular', 870],
      ['Long', 930],
    ])
  })

  it('en modell med en enda variant blir en rad med en variant', () => {
    const modeller = grupperaModeller([akto])
    expect(modeller).toHaveLength(1)
    expect(modeller[0].varianter).toEqual([akto])
  })

  it('behåller ordningen på träffarna, efter modellens första förekomst', () => {
    const nallo = produkt('Hilleberg', 'Nallo 2')
    expect(grupperaModeller([regular, akto, lang, nallo, kort]).map((m) => m.modell)).toEqual(['Neutrino -6 °C', 'Akto', 'Nallo 2'])
  })

  it('skiljer inte på stora och små bokstäver eller blanktecken runt om', () => {
    const modeller = grupperaModeller([produkt('Rab', 'Mythic', { id: '1' }), produkt('RAB', ' mythic ', { id: '2' })])
    expect(modeller).toHaveLength(1)
    expect(modeller[0].varianter).toHaveLength(2)
  })

  it('håller isär samma modellnamn hos olika märken, och olika modeller hos samma märke', () => {
    const modeller = grupperaModeller([produkt('Rab', 'Alpine'), produkt('Marmot', 'Alpine'), produkt('Rab', 'Alpine 2')])
    expect(modeller.map((m) => m.nyckel)).toEqual(['rab|alpine', 'marmot|alpine', 'rab|alpine 2'])
  })

  it('sorterar lika tunga varianter på version, och ger unika nycklar', () => {
    const a = produkt('M', 'X', { id: '1', version: 'B', packvikt_g: 500 })
    const b = produkt('M', 'X', { id: '2', version: 'A', packvikt_g: 500 })
    expect(grupperaModeller([a, b])[0].varianter.map((v) => v.version)).toEqual(['A', 'B'])
    const nycklar = grupperaModeller([regular, akto, lang]).map((m) => m.nyckel)
    expect(new Set(nycklar).size).toBe(nycklar.length)
  })

  it('ändrar inte listan den får in, och ger en tom lista för inga produkter', () => {
    const lista = [lang, kort]
    grupperaModeller(lista)
    expect(lista).toEqual([lang, kort])
    expect(grupperaModeller([])).toEqual([])
  })
})

describe('markenMedAntal', () => {
  it('räknar modeller per märke, inte varianter, i bokstavsordning', () => {
    const modeller = grupperaModeller([
      produkt('Rab', 'Neutrino', { id: '1', version: 'Regular' }),
      produkt('Rab', 'Neutrino', { id: '2', version: 'Long' }),
      produkt('Rab', 'Alpine'),
      produkt('Hilleberg', 'Akto'),
      produkt('Älvdalen', 'Tält'),
      produkt('Fjällräven', 'Abisko'),
    ])
    expect(markenMedAntal(modeller)).toEqual([
      { marke: 'Fjällräven', antal: 1 },
      { marke: 'Hilleberg', antal: 1 },
      { marke: 'Rab', antal: 2 },
      { marke: 'Älvdalen', antal: 1 },
    ])
  })

  it('ger en tom lista utan modeller', () => {
    expect(markenMedAntal([])).toEqual([])
  })
})

describe('ingaTraffarText', () => {
  it('säger att sökningen inte matchar när det finns söktext, oavsett kategori', () => {
    expect(ingaTraffarText({ harText: true, kategori: '', underkategori: '' })).toBe('Inga produkter matchar din sökning.')
    expect(ingaTraffarText({ harText: true, kategori: 'sova', underkategori: 'kudde' })).toBe('Inga produkter matchar din sökning.')
  })

  it('säger att underkategorin är tom när en underkategori är vald utan söktext', () => {
    expect(ingaTraffarText({ harText: false, kategori: 'sova', underkategori: 'kudde' })).toBe('Inga produkter i katalogen i den här underkategorin än.')
  })

  it('säger att kategorin är tom när bara en kategori är vald utan söktext', () => {
    expect(ingaTraffarText({ harText: false, kategori: 'vatten', underkategori: '' })).toBe('Inga produkter i katalogen i den här kategorin än.')
  })
})

describe('modellMedProdukt', () => {
  const modeller = grupperaModeller([
    produkt('Rab', 'Neutrino', { id: 'r', version: 'Regular', packvikt_g: 870 }),
    produkt('Rab', 'Neutrino', { id: 'l', version: 'Long', packvikt_g: 910 }),
    produkt('Hilleberg', 'Akto', { id: 'a' }),
  ])

  it('hittar modellen och storleken för en produkt', () => {
    const r = modellMedProdukt(modeller, 'l')
    expect(r?.modell.modell).toBe('Neutrino')
    expect(r?.produkt.version).toBe('Long')
    expect(r?.modell.varianter.map((v) => v.id)).toEqual(['r', 'l'])
  })

  it('ger null för en produkt som inte finns bland modellerna', () => {
    expect(modellMedProdukt(modeller, 'finns-inte')).toBeNull()
    expect(modellMedProdukt([], 'a')).toBeNull()
  })
})

describe('iForradetText', () => {
  it('säger vilken storlek man har', () => {
    expect(iForradetText(['Regular'])).toBe('Du har Regular i ditt förråd')
  })

  it('räknar upp flera storlekar', () => {
    expect(iForradetText(['Regular', 'Long'])).toBe('Du har Regular och Long i ditt förråd')
    expect(iForradetText(['S', 'M', 'L'])).toBe('Du har S, M och L i ditt förråd')
  })

  it('säger bara Finns i ditt förråd för en sak utan storlek', () => {
    expect(iForradetText([null])).toBe('Finns i ditt förråd')
    expect(iForradetText(['  '])).toBe('Finns i ditt förråd')
    expect(iForradetText(['One Size'])).toBe('Finns i ditt förråd')
    expect(iForradetText(['one size'])).toBe('Finns i ditt förråd')
  })

  it('hoppar över dubbletter och storlekslösa bland flera', () => {
    expect(iForradetText(['Regular', 'Regular', null])).toBe('Du har Regular i ditt förråd')
  })
})

describe('antalText', () => {
  it('skiljer på en och flera', () => {
    expect(antalText(1)).toBe('1 produkt')
    expect(antalText(42)).toBe('42 produkter')
    expect(antalText(0)).toBe('0 produkter')
  })
})

describe('visasText', () => {
  it('säger hur många som visas av det riktiga antalet när alla inte får plats', () => {
    expect(visasText(100, 214)).toBe('Visar 100 av 214 produkter')
    expect(visasText(200, 214)).toBe('Visar 200 av 214 produkter')
  })

  it('visar bara antalet när alla syns', () => {
    expect(visasText(214, 214)).toBe('214 produkter')
    expect(visasText(100, 1)).toBe('1 produkt')
    expect(visasText(100, 100)).toBe('100 produkter')
  })
})
