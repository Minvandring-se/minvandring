import { describe, expect, it } from 'vitest'
import { beraknaStig, kopplaStig, punktPaKurva, type Matt, type Sida } from './geometri'

/** En sektion med innehåll på 1152 px i mitten och 80 px padding. */
const matt = (bredd = 1440, hojd = 600): Matt => ({
  bredd,
  hojd,
  vanster: (bredd - 1152) / 2,
  hoger: (bredd + 1152) / 2,
  topp: 80,
  botten: hojd - 80,
})

const sidor: Sida[] = ['vanster', 'hoger']

describe('beraknaStig', () => {
  it('håller alla kurvpunkter och detaljer i nedre mellanrummet', () => {
    for (const bredd of [1360, 1440, 1920, 2560]) {
      for (const hojd of [160, 300, 777.5, 2200]) {
        for (const start of sidor) {
          for (const slut of sidor) {
            for (const svang of [-100, 0, 10, 100, Number.NaN]) {
              const m = matt(bredd, hojd)
              const stig = beraknaStig(m, { start, slut, svang })
              if (!stig) throw new Error('Saknad geometri')
              for (const k of stig.kurvor) {
                for (let i = 0; i <= 100; i++) {
                  const p = punktPaKurva(k, i / 100)
                  expect(p.y).toBeGreaterThan(m.botten + 12)
                  expect(p.y).toBeLessThan(hojd - 1)
                  expect(p.x).toBeGreaterThan(0)
                  expect(p.x).toBeLessThan(bredd)
                }
              }
              // Tältet och brasan är 44 × 36 px och får inte överlappa innehållet.
              expect(stig.detaljPunkt.y - 36).toBeGreaterThan(m.botten)
              expect(stig.detaljPunkt.x - 22).toBeGreaterThan(0)
              expect(stig.detaljPunkt.x + 22).toBeLessThan(bredd)
            }
          }
        }
      }
    }
  })

  it.each([390, 768, 1024, 1359])('döljer leden vid %i px', (bredd) => {
    expect(beraknaStig(matt(bredd), { start: 'vanster', slut: 'hoger' })).toBeNull()
  })

  it('döljer leden när marginalen eller paddingen är för liten', () => {
    for (const andring of [{ vanster: 90 }, { hoger: 1350 }, { topp: 40 }, { botten: 560 }, { bredd: Number.NaN }]) {
      expect(beraknaStig({ ...matt(), ...andring }, { start: 'vanster', slut: 'hoger' })).toBeNull()
    }
  })

  it('börjar och slutar utanför innehållet med plats för vägvisaren', () => {
    const m = matt(1360)
    const stig = beraknaStig(m, { start: 'vanster', slut: 'hoger' })
    if (!stig) throw new Error('Saknad geometri')
    expect(stig.start.x + 24).toBeLessThan(m.vanster)
    expect(stig.slut.x - 24).toBeGreaterThan(m.hoger)
    expect(stig.start.x - 24).toBeGreaterThan(0)
    expect(stig.slut.x + 24).toBeLessThan(m.bredd)
  })
})

describe('kopplaStig', () => {
  const original = [
    { id: 'a', svang: 10 },
    { id: 'b', svang: 12 },
    { id: 'c', svang: 8 },
    { id: 'd', svang: 10 },
  ]

  it('möter förra bitens x-läge, även efter att en bit lagts till eller tagits bort', () => {
    for (const lista of [original, [...original, { id: 'e', svang: 11 }], original.filter((s) => s.id !== 'b')]) {
      const bitar = kopplaStig(lista)
      expect(bitar.map((b) => b.id)).toEqual(lista.map((b) => b.id))
      for (let i = 1; i < bitar.length; i++) {
        expect(bitar[i].start).toBe(bitar[i - 1].slut)
        expect(beraknaStig(matt(1440, 950), bitar[i])?.start.x).toBe(beraknaStig(matt(1440, 430), bitar[i - 1])?.slut.x)
      }
    }
  })

  it('växlar sida när slut saknas och följer slut när det finns', () => {
    const bitar = kopplaStig([{}, {}, { slut: 'hoger' as const }, {}])
    expect(bitar.map((b) => [b.start, b.slut])).toEqual([
      ['vanster', 'hoger'],
      ['hoger', 'vanster'],
      ['vanster', 'hoger'],
      ['hoger', 'vanster'],
    ])
  })

  it('markerar första och sista biten utifrån ordningen', () => {
    const marken = (lista: typeof original) => kopplaStig(lista).map((b) => [b.id, b.forsta, b.sista])
    expect(marken(original)).toEqual([
      ['a', true, false],
      ['b', false, false],
      ['c', false, false],
      ['d', false, true],
    ])
    // En femte sektion flyttar vägvisaren, och att ta bort den första flyttar ledkrysset.
    expect(marken([...original, { id: 'e', svang: 11 }]).at(-1)).toEqual(['e', false, true])
    expect(marken(original.slice(1))[0]).toEqual(['b', true, false])
  })
})
