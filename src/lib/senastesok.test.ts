import { describe, expect, it } from 'vitest'
import { laggTillSokning, tolkaSenaste } from './senastesok'

describe('laggTillSokning', () => {
  it('lägger den nya sökningen först och sparar högst tre', () => {
    expect(laggTillSokning(['gröt', 'pasta', 'chili'], 'viltgryta')).toEqual(['viltgryta', 'gröt', 'pasta'])
  })

  it('räknar samma sökning en gång oavsett stora och små bokstäver', () => {
    expect(laggTillSokning(['Gröt', 'pasta'], ' gröt ')).toEqual(['gröt', 'pasta'])
  })

  it('hoppar över för korta sökningar', () => {
    expect(laggTillSokning(['gröt'], 'a')).toEqual(['gröt'])
    expect(laggTillSokning(['gröt'], '   ')).toEqual(['gröt'])
  })
})

describe('tolkaSenaste', () => {
  it('läser en sparad lista', () => {
    expect(tolkaSenaste('["gröt","pasta"]')).toEqual(['gröt', 'pasta'])
  })

  it('ger en tom lista för trasigt eller fel innehåll', () => {
    expect(tolkaSenaste(null)).toEqual([])
    expect(tolkaSenaste('inte json')).toEqual([])
    expect(tolkaSenaste('{"a":1}')).toEqual([])
    expect(tolkaSenaste('["gröt", 3, "x"]')).toEqual(['gröt'])
  })
})
