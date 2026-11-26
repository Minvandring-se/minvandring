import { describe, expect, it } from 'vitest'
import {
  guideForRecept,
  KOM_IGANG,
  komIgangAdress,
  sokTork,
  textdelar,
  torkadress,
  torkflikFranAdress,
  TORKGUIDER,
  torkpostFor,
  TORKRECEPT,
  torktid,
} from './torkasjalv'

/** Den synliga texten: allt utom id, slug och kopplingen till receptet. */
const allText = JSON.stringify([TORKRECEPT, TORKGUIDER, KOM_IGANG], (k, v) => (['id', 'slug', 'recept'].includes(k) ? undefined : v))

describe('innehållet i Torka själv', () => {
  it('har alla 30 recept och 20 råvaruguider med unika id och sidor utan å, ä och ö', () => {
    expect(TORKRECEPT).toHaveLength(30)
    expect(TORKGUIDER).toHaveLength(20)
    expect(new Set([...TORKRECEPT, ...TORKGUIDER].map((p) => p.id)).size).toBe(50)
    expect(TORKRECEPT.map((r) => r.nummer)).toEqual(Array.from({ length: 30 }, (_, i) => i + 1))
    const sidor = [...TORKRECEPT, ...TORKGUIDER.filter((g) => !g.recept)].map((p) => p.slug)
    expect(sidor).toHaveLength(48)
    expect(new Set(sidor).size).toBe(48)
    for (const s of sidor) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it('går att nå: varje recept och guide har en sida som hittar tillbaka till rätt post', () => {
    for (const r of TORKRECEPT) expect(torkpostFor(torkadress(r).split('/').at(-1))?.post).toBe(r)
    for (const g of TORKGUIDER.filter((x) => !x.recept)) expect(torkpostFor(torkadress(g).split('/').at(-1))?.post).toBe(g)
    expect(torkpostFor('finns-inte')).toBeNull()
  })

  it('har en gemensam sida för äpple och banan, som är receptets sida', () => {
    const apple = TORKGUIDER.find((g) => g.id === 'ravara-apple')!
    const banan = TORKGUIDER.find((g) => g.id === 'ravara-banana')!
    const r26 = TORKRECEPT.find((r) => r.id === 'recept-026')!
    const r27 = TORKRECEPT.find((r) => r.id === 'recept-027')!
    expect(torkadress(apple)).toBe(torkadress(r26))
    expect(torkadress(banan)).toBe(torkadress(r27))
    expect(guideForRecept('recept-026')).toBe(apple)
    expect(guideForRecept('recept-027')).toBe(banan)
    // Guidens egen slug ger ingen andra sida.
    expect(torkpostFor(apple.slug)?.post ?? null).not.toBe(apple)
    expect(TORKGUIDER.filter((g) => g.recept)).toHaveLength(2)
  })

  it('har ingen status om provlagning och inga betyg från källorna, men källänkarna', () => {
    expect(allText).not.toMatch(/provlag|provtork|betyg|källgranskat/i)
    for (const p of [...TORKRECEPT, ...TORKGUIDER]) {
      expect(p.kallor.length).toBeGreaterThan(0)
      for (const k of p.kallor) expect(k.url).toMatch(/^https:\/\//)
    }
  })

  it('har säkerhetsguiden i Kom igång, med tillagad mat, kött, förvaring och återfuktning', () => {
    expect(KOM_IGANG.map((a) => a.id)).toEqual(expect.arrayContaining(['grundmetod', 'utrustning', 'sakerhet', 'torrhet', 'pa-tur', 'basingredienser']))
    const sakerhet = JSON.stringify(KOM_IGANG.find((a) => a.id === 'sakerhet'))
    expect(sakerhet).toContain('71 °C')
    expect(sakerhet).toContain('Livsmedelsverket')
    expect(komIgangAdress('sakerhet')).toBe('/matplanering/katalog?del=torka&flik=kom-igang#sakerhet')
  })

  it('behåller de råvaruspecifika säkerhetsråden i guiden', () => {
    expect(TORKGUIDER.find((g) => g.id === 'ravara-mince')!.forbered).toContain('71 °C')
    expect(TORKGUIDER.find((g) => g.id === 'ravara-mushroom')!.notis).toContain('giftiga')
  })

  it('har inga tankstreck som paus och inga hänvisningar till underlagets filer', () => {
    expect(allText).not.toContain(' – ')
    expect(allText).not.toMatch(/\.md\b|recept-0\d\d/)
  })
})

describe('torktid', () => {
  it('skriver intervall, cirka för samma tal och aldrig ett påhittat tal när tiden saknas', () => {
    expect(torktid({ temperatur: 57, timmarMin: 6, timmarMax: 12 })).toBe('57 °C, cirka 6–12 timmar')
    expect(torktid({ temperatur: 50, timmarMin: 10, timmarMax: 10 })).toBe('50 °C, cirka 10 timmar')
    expect(torktid({ temperatur: 50, timmarMin: null, timmarMax: null })).toBe('50 °C, tid saknas i källan')
    expect(torktid(TORKGUIDER.find((g) => g.id === 'ravara-leek')!)).not.toMatch(/\d+\s*timmar/)
  })
})

describe('sokTork', () => {
  it('söker i rubrik och text, med svenska bokstäver, och alla ord ska finnas', () => {
    expect(sokTork(TORKRECEPT, 'äppel').map((r) => r.id)).toEqual(expect.arrayContaining(['recept-026', 'recept-028']))
    expect(sokTork(TORKRECEPT, 'LINSER pasta').map((r) => r.id)).toContain('recept-001')
    expect(sokTork(TORKGUIDER, 'förväll').length).toBeGreaterThan(0)
    expect(sokTork(TORKRECEPT, '  ')).toHaveLength(30)
    expect(sokTork(TORKRECEPT, 'xyzzy')).toEqual([])
  })
})

describe('textdelar', () => {
  it('delar upp fetstil och länkar och tolkar ingen HTML', () => {
    expect(textdelar('Torka vid **57 °C** och läs [källan](https://exempel.se/a).')).toEqual([
      { typ: 'text', text: 'Torka vid ' },
      { typ: 'fet', text: '57 °C' },
      { typ: 'text', text: ' och läs ' },
      { typ: 'lank', text: 'källan', url: 'https://exempel.se/a' },
      { typ: 'text', text: '.' },
    ])
    expect(textdelar('<b>x</b> [x](javascript:alert(1))')).toEqual([{ typ: 'text', text: '<b>x</b> [x](javascript:alert(1))' }])
  })
})

describe('torkflikFranAdress', () => {
  it('ger Recept när fliken saknas eller är okänd', () => {
    expect(torkflikFranAdress(new URLSearchParams('flik=ravaror'))).toBe('ravaror')
    expect(torkflikFranAdress(new URLSearchParams('flik=x'))).toBe('recept')
    expect(torkflikFranAdress(new URLSearchParams(''))).toBe('recept')
  })
})
