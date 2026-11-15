import { describe, expect, it } from 'vitest'
import { beraknaStig, kopplaStig, punktPaKurva, type Kubik, type Matt, type Sida, type Stigbit } from './geometri'

/** En sektion med innehåll på 1152 px i mitten och lika mycket luft uppe och nere. */
const matt = (bredd = 1440, hojd = 600, luft = 80): Matt => ({
  bredd,
  hojd,
  vanster: (bredd - 1152) / 2,
  hoger: (bredd + 1152) / 2,
  topp: luft,
  botten: hojd - luft,
})

const sidor: Sida[] = ['vanster', 'hoger']
const punkter = (k: Kubik) => Array.from({ length: 101 }, (_, i) => punktPaKurva(k, i / 100))
const normal = (p: { x: number; y: number }) => {
  const l = Math.hypot(p.x, p.y)
  return { x: p.x / l, y: p.y / l }
}

describe('beraknaStig', () => {
  it('håller hela leden och detaljerna i luften ovanför och under innehållet', () => {
    const fel: string[] = []
    for (const bredd of [1344, 1360, 1440, 1920, 2560]) {
      for (const hojd of [160, 300, 777.5, 2200]) {
        for (const luft of [80, 112]) {
          if (hojd < 2 * luft) continue
          for (const start of sidor) {
            for (const slut of sidor) {
              for (const svang of [-100, 0, 10, 100, Number.NaN]) {
                for (const [forsta, sista] of [
                  [true, false],
                  [false, false],
                  [false, true],
                  [true, true],
                ]) {
                  const m = matt(bredd, hojd, luft)
                  const fall = `${bredd}x${hojd} luft ${luft} ${start}-${slut} svang ${svang} forsta ${forsta} sista ${sista}`
                  const stig = beraknaStig(m, { start, slut, svang, forsta, sista })
                  if (!stig) {
                    fel.push(`${fall}: saknas`)
                    continue
                  }
                  for (const p of stig.kurvor.flatMap(punkter)) {
                    if (!(p.y > m.botten + 12 && p.y <= hojd && p.x > 0 && p.x < bredd)) fel.push(`${fall}: ${p.x},${p.y}`)
                  }
                  for (const p of stig.toppKurva ? punkter(stig.toppKurva) : []) {
                    if (!(p.y >= 0 && p.y < m.topp - 12 && p.x > 0 && p.x < bredd)) fel.push(`${fall}: topp ${p.x},${p.y}`)
                  }
                  // Tältet och brasan är 44 × 36 px och får inte överlappa innehållet.
                  const d = stig.detaljPunkt
                  if (!(d.y - 36 > m.botten && d.x - 22 > 0 && d.x + 22 < bredd)) fel.push(`${fall}: detalj ${d.x},${d.y}`)
                }
              }
            }
          }
        }
      }
    }
    expect(fel.slice(0, 5)).toEqual([])
  })

  it('ställer tältet och brasan på kurvan', () => {
    for (const detaljLage of [0.15, 0.3, 0.72, 0.85]) {
      const stig = beraknaStig(matt(1440, 700, 112), { start: 'hoger', slut: 'vanster', detaljLage })
      if (!stig) throw new Error('Saknad geometri')
      const narmast = Math.min(...stig.kurvor.flatMap(punkter).map((p) => Math.hypot(p.x - stig.detaljPunkt.x, p.y - stig.detaljPunkt.y)))
      expect(narmast).toBeLessThan(1)
    }
  })

  it.each([390, 768, 1024, 1343])('döljer leden när marginalen inte räcker vid %i px', (bredd) => {
    expect(beraknaStig(matt(bredd), { start: 'vanster', slut: 'hoger' })).toBeNull()
  })

  it('visar leden vid 1366 px fönster med rullningslist i Windows (sektionen 1349 px)', () => {
    expect(beraknaStig(matt(1349), { start: 'vanster', slut: 'hoger' })).not.toBeNull()
  })

  it('döljer leden när marginalen eller luften är för liten', () => {
    for (const andring of [{ vanster: 90 }, { hoger: 1350 }, { topp: 40 }, { botten: 560 }, { bredd: Number.NaN }]) {
      expect(beraknaStig({ ...matt(), ...andring }, { start: 'vanster', slut: 'hoger' })).toBeNull()
    }
  })

  it('börjar och slutar utanför innehållet med plats för vägvisaren', () => {
    const m = matt(1344)
    const stig = beraknaStig(m, { start: 'vanster', slut: 'hoger' })
    if (!stig) throw new Error('Saknad geometri')
    expect(stig.start.x + 24).toBeLessThan(m.vanster)
    expect(stig.slut.x - 24).toBeGreaterThan(m.hoger)
    expect(stig.start.x - 24).toBeGreaterThan(0)
    expect(stig.slut.x + 24).toBeLessThan(m.bredd)
  })

  it('svänger ner till sektionsgränsen, utom i sista biten', () => {
    const m = matt(1440, 600)
    expect(beraknaStig(m, { start: 'vanster', slut: 'hoger' })?.utgang).toEqual({ x: m.hoger + 48, y: 600 })
    expect(beraknaStig(m, { start: 'vanster', slut: 'hoger', sista: true })?.utgang).toBeNull()
    expect(beraknaStig(m, { start: 'vanster', slut: 'hoger', forsta: true })?.toppKurva).toBeNull()
  })
})

describe('kopplaStig', () => {
  const original = [
    { id: 'a', svang: 10 },
    { id: 'b', svang: 12 },
    { id: 'c', svang: 8 },
    { id: 'd', svang: 10 },
  ]

  it('möter förra biten exakt vid sektionsgränsen, i samma riktning, även efter ändrad lista', () => {
    for (const lista of [original, [...original, { id: 'e', svang: 11 }], original.filter((s) => s.id !== 'b')]) {
      const bitar = kopplaStig(lista)
      expect(bitar.map((b) => b.id)).toEqual(lista.map((b) => b.id))
      for (let i = 1; i < bitar.length; i++) {
        const forra = beraknaStig(matt(1440, 430, 112), bitar[i - 1])
        const denna = beraknaStig(matt(1440, 950, 112), bitar[i])
        if (!forra?.utgang || !denna?.toppKurva) throw new Error('Saknad geometri')
        expect(bitar[i].start).toBe(bitar[i - 1].slut)
        // Samma x, och y är sektionsgränsen: förra sektionens nederkant och denna sektions överkant.
        expect(denna.toppKurva[0].x).toBe(forra.utgang.x)
        expect(forra.utgang.y).toBe(430)
        expect(denna.toppKurva[0].y).toBe(0)
        // Samma riktning på båda sidor om gränsen, alltså inget knyck.
        const ut = forra.kurvor[forra.kurvor.length - 1]
        const fore = normal({ x: ut[3].x - ut[2].x, y: ut[3].y - ut[2].y })
        const efter = normal({ x: denna.toppKurva[1].x - denna.toppKurva[0].x, y: denna.toppKurva[1].y - denna.toppKurva[0].y })
        expect(efter.x).toBeCloseTo(fore.x, 6)
        expect(efter.y).toBeCloseTo(fore.y, 6)
        expect(fore.y).toBeGreaterThan(0)
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

  it('markerar första och sista biten och grannarna utifrån ordningen', () => {
    const marken = (lista: typeof original) => kopplaStig(lista).map((b: Stigbit) => [b.id, b.forsta, b.sista, b.forraId, b.nastaId])
    expect(marken(original)).toEqual([
      ['a', true, false, undefined, 'b'],
      ['b', false, false, 'a', 'c'],
      ['c', false, false, 'b', 'd'],
      ['d', false, true, 'c', undefined],
    ])
    // En femte sektion flyttar vägvisaren, och att ta bort den första flyttar ledkrysset.
    expect(marken([...original, { id: 'e', svang: 11 }]).slice(-2)).toEqual([
      ['d', false, false, 'c', 'e'],
      ['e', false, true, 'd', undefined],
    ])
    expect(marken(original.slice(1))[0]).toEqual(['b', true, false, undefined, 'c'])
  })
})
