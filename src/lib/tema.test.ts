import { describe, expect, it } from 'vitest'
import { TEMA_NYCKEL, aktivtLage, lasTemaval, sparaTemaval, temaAttribut, tolkaTemaval } from '@/lib/tema'

/** En enkel lagring i minnet, som localStorage. */
function minne(start: Record<string, string> = {}) {
  const data = new Map(Object.entries(start))
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  }
}

/** En lagring som inte går att nå, som i vissa privata lägen. */
const trasig = {
  getItem: () => {
    throw new Error('blockerad')
  },
  setItem: () => {
    throw new Error('blockerad')
  },
  removeItem: () => {
    throw new Error('blockerad')
  },
}

describe('tolkaTemaval', () => {
  it('godtar ljus, mork och system', () => {
    expect(tolkaTemaval('ljus')).toBe('ljus')
    expect(tolkaTemaval('mork')).toBe('mork')
    expect(tolkaTemaval('system')).toBe('system')
  })

  it('gör allt annat till system', () => {
    for (const v of [null, undefined, '', 'dark', 'Mork', 1, {}]) expect(tolkaTemaval(v)).toBe('system')
  })
})

describe('lasTemaval', () => {
  it('läser det sparade valet', () => {
    expect(lasTemaval(minne({ [TEMA_NYCKEL]: 'mork' }))).toBe('mork')
  })

  it('ger system när inget är sparat, när värdet är ogiltigt och när lagringen saknas eller är blockerad', () => {
    expect(lasTemaval(minne())).toBe('system')
    expect(lasTemaval(minne({ [TEMA_NYCKEL]: 'lila' }))).toBe('system')
    expect(lasTemaval(null)).toBe('system')
    expect(lasTemaval(trasig)).toBe('system')
  })
})

describe('sparaTemaval', () => {
  it('sparar ljust och mörkt', () => {
    const l = minne()
    expect(sparaTemaval(l, 'mork')).toBe(true)
    expect(l.data.get(TEMA_NYCKEL)).toBe('mork')
    sparaTemaval(l, 'ljus')
    expect(l.data.get(TEMA_NYCKEL)).toBe('ljus')
  })

  it('tar bort valet för system, så att enheten bestämmer', () => {
    const l = minne({ [TEMA_NYCKEL]: 'mork' })
    sparaTemaval(l, 'system')
    expect(l.data.has(TEMA_NYCKEL)).toBe(false)
  })

  it('säger ifrån när det inte gick att spara', () => {
    expect(sparaTemaval(null, 'mork')).toBe(false)
    expect(sparaTemaval(trasig, 'mork')).toBe(false)
  })
})

describe('aktivtLage', () => {
  it('följer valet när det är ljust eller mörkt', () => {
    expect(aktivtLage('ljus', true)).toBe('ljus')
    expect(aktivtLage('mork', false)).toBe('mork')
  })

  it('följer enheten när valet är system', () => {
    expect(aktivtLage('system', true)).toBe('mork')
    expect(aktivtLage('system', false)).toBe('ljus')
  })
})

describe('temaAttribut', () => {
  it('sätter data-tema för ljust och mörkt och tar bort det för system', () => {
    expect(temaAttribut('ljus')).toBe('ljus')
    expect(temaAttribut('mork')).toBe('mork')
    expect(temaAttribut('system')).toBeNull()
  })
})
