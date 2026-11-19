import { describe, expect, it } from 'vitest'
import { gArAttSoka, produktnamn, sakFranProdukt, sokfilter, sokord, sorteraTraffar } from './produktsok'
import type { Produkt } from './typer'

function produkt(marke: string, modell: string, delar: Partial<Produkt> = {}): Produkt {
  return { id: `${marke}-${modell}`, marke, modell, version: null, kategori: 'talt', underkategori: 'talt', packvikt_g: 1000, kontrollerad: null, ...delar }
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
  it('söker i märke och modell', () => {
    expect(sokfilter('akto')).toBe('marke.ilike.%akto%,modell.ilike.%akto%')
  })

  it('tar med underkategorin när ordet är ett kategorinamn', () => {
    expect(sokfilter('tarp')).toBe('marke.ilike.%tarp%,modell.ilike.%tarp%,underkategori.in.(tarp)')
    expect(sokfilter('sovsäck')).toContain('underkategori.in.(sovsack)')
  })

  it('tar med hela huvudkategorin när ordet finns i dess namn', () => {
    expect(sokfilter('tält')).toContain('underkategori.in.(talt,tarp,vindsack,hangmatta,talttillbehor)')
    expect(sokfilter('sova')).toContain('underkategori.in.(sovsack,quilt,liggunderlag,kudde,lakan,sittunderlag,pump)')
  })

  it('gissar inte kategori på ett eller två tecken', () => {
    expect(sokfilter('tä')).toBe('marke.ilike.%tä%,modell.ilike.%tä%')
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
