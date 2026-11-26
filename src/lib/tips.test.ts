import { describe, expect, it } from 'vitest'
import { GUIDER, guideFor, lastid } from './tips'

const allText = (g: (typeof GUIDER)[number]) => [g.rubrik, g.ingress, ...g.avsnitt.flatMap((a) => [a.rubrik, ...a.stycken, ...(a.punkter ?? [])])]

describe('tipsen', () => {
  it('har de fyra guiderna med olika nycklar utan å, ä och ö', () => {
    expect(GUIDER.map((g) => g.rubrik)).toEqual([
      'Hur mycket energi behöver man?',
      'Vatten och bränsle till maten',
      'Packa maten smart',
      'Så läser du kcal per 100 g',
    ])
    const nycklar = GUIDER.map((g) => g.nyckel)
    for (const n of nycklar) expect(n).toMatch(/^[a-z0-9-]+$/)
    expect(new Set(nycklar).size).toBe(nycklar.length)
  })

  it('varje guide har minst en källa med en adress', () => {
    for (const g of GUIDER) {
      expect(g.kallor.length).toBeGreaterThan(0)
      for (const k of g.kallor) {
        expect(k.namn.trim()).not.toBe('')
        expect(k.url).toMatch(/^https:\/\//)
      }
    }
  })

  it('har inga tankstreck och inga tomma avsnitt', () => {
    for (const g of GUIDER) {
      for (const text of allText(g)) expect(text).not.toMatch(/[–—]/)
      for (const a of g.avsnitt) expect(a.stycken.length + (a.punkter?.length ?? 0)).toBeGreaterThan(0)
    }
  })
})

describe('artiklarna', () => {
  /** Siffran som den står i texten: en- och tankstreck blir "till", och "minst" och "cirka" stryks. */
  const iTexten = (varde: string) => varde.replace(/^(minst|cirka) /, '').replace('–', ' till ').replace(/ (kcal|liter)$/, '')

  it('varje viktig siffra står i guidens text', () => {
    for (const g of GUIDER) {
      expect(g.siffror.length).toBeGreaterThan(0)
      const text = allText(g).join(' ')
      for (const s of g.siffror) {
        const delar = iTexten(s.varde).split(' till ')
        for (const d of delar) expect(text, `${g.nyckel}: ${s.varde}`).toContain(d)
      }
    }
  })

  it('räknar lästiden i hela minuter, minst en', () => {
    expect(lastid({ ingress: 'Kort.', avsnitt: [] })).toBe(1)
    expect(lastid({ ingress: 'ord '.repeat(400), avsnitt: [] })).toBe(3)
    for (const g of GUIDER) expect(lastid(g)).toBeGreaterThanOrEqual(1)
  })

  it('hittar guiden med nyckeln', () => {
    expect(guideFor('energi')?.rubrik).toBe('Hur mycket energi behöver man?')
    expect(guideFor('finns-inte')).toBeNull()
    expect(guideFor(undefined)).toBeNull()
  })
})
