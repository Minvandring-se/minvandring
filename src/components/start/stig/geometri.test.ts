import { describe, expect, it } from 'vitest'
import {
  beraknaEnkelStig,
  beraknaStig,
  cssIntervall,
  framsteg,
  kopplaStig,
  omPlats,
  punktPaKurva,
  ritintervall,
  valjStig,
  type Kubik,
  type Matt,
  type Sida,
  type Stigbit,
} from './geometri'

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

  it('markerar första och sista biten utifrån ordningen', () => {
    const marken = (lista: typeof original) => kopplaStig(lista).map((b: Stigbit) => [b.id, b.forsta, b.sista])
    expect(marken(original)).toEqual([
      ['a', true, false],
      ['b', false, false],
      ['c', false, false],
      ['d', false, true],
    ])
    // En femte sektion flyttar vägvisaren, och att ta bort den första flyttar ledkrysset.
    expect(marken([...original, { id: 'e', svang: 11 }]).slice(-2)).toEqual([
      ['d', false, false],
      ['e', false, true],
    ])
    expect(marken(original.slice(1))[0]).toEqual(['b', true, false])
  })
})

/** Mobil och surfplatta: innehållet går nästan kant i kant, 80 px luft. */
const smal = (bredd = 390, hojd = 900, luft = 80): Matt => ({ bredd, hojd, vanster: 0, hoger: bredd, topp: luft, botten: hojd - luft })

describe('beraknaEnkelStig', () => {
  it('korsar sidan i den nedre luften utan att gå över innehållet eller ut i kanten', () => {
    const fel: string[] = []
    for (const m of [smal(390), smal(390, 400), smal(768), smal(1024, 1200, 112), matt(1280, 900, 112), matt(1440, 700, 112)]) {
      for (const start of sidor) {
        for (const slut of sidor) {
          for (const [forsta, sista] of [
            [true, false],
            [false, true],
          ]) {
            const stig = beraknaEnkelStig(m, { start, slut, forsta, sista, detalj: 'eld', detaljLage: 0.72 })
            if (!stig) {
              fel.push(`${m.bredd}: saknas`)
              continue
            }
            for (const p of punkter(stig.kurvor[0])) {
              if (!(p.y > m.botten + 12 && p.y < m.hojd - 12 && p.x >= 24 && p.x <= m.bredd - 24)) fel.push(`${m.bredd} ${start}-${slut}: ${p.x},${p.y}`)
            }
          }
        }
      }
    }
    expect(fel.slice(0, 5)).toEqual([])
  })

  it('går från ena sidan till den andra', () => {
    const stig = beraknaEnkelStig(smal(), { start: 'vanster', slut: 'hoger' })
    expect(stig?.start.x).toBe(24)
    expect(stig?.slut.x).toBe(390 - 24)
    expect(stig?.dTopp).toBeNull()
    expect(stig?.utgang).toBeNull()
  })

  it('saknas när luften under innehållet är för liten', () => {
    expect(beraknaEnkelStig(smal(390, 900, 40), { start: 'vanster', slut: 'hoger' })).toBeNull()
  })

  it('utelämnar figurer som skulle krocka med innehållet i mobil', () => {
    const stig = beraknaEnkelStig(smal(), { start: 'vanster', slut: 'hoger', forsta: true, sista: true, detalj: 'talt', detaljLage: 0.3 })
    // 80 px luft räcker inte för ledkrysset (44 px), vägvisaren (60 px) eller tältet tidigt på kurvan.
    expect(stig?.figurer).toEqual({ ledkryss: null, vagvisare: null, detalj: null })
  })

  it('visar bara figurer som får plats under innehållet', () => {
    const fel: string[] = []
    for (const m of [smal(390), smal(768), smal(1024, 1200, 112)]) {
      for (const detaljLage of [0.15, 0.5, 0.72, 0.85]) {
        const stig = beraknaEnkelStig(m, { start: 'vanster', slut: 'hoger', forsta: true, sista: true, detalj: 'eld', detaljLage })
        for (const [namn, p, hojd] of [
          ['ledkryss', stig?.figurer.ledkryss, 44],
          ['vägvisare', stig?.figurer.vagvisare, 60],
          ['detalj', stig?.figurer.detalj, 36],
        ] as const) {
          if (p && !(p.y - hojd >= m.botten + 4)) fel.push(`${m.bredd} ${namn} ${detaljLage}`)
        }
      }
    }
    expect(fel).toEqual([])
    // Brasan sent på kurvan får plats i mobil.
    expect(beraknaEnkelStig(smal(), { start: 'vanster', slut: 'hoger', detalj: 'eld', detaljLage: 0.72 })?.figurer.detalj).not.toBeNull()
  })
})

describe('omPlats', () => {
  const m = matt(1440, 600, 80)
  const storlek = { bredd: 44, hojd: 36 }

  it('godtar en figur under innehållet eller helt bredvid det', () => {
    expect(omPlats(m, { x: 700, y: m.botten + 40 }, storlek)).not.toBeNull()
    expect(omPlats(m, { x: m.vanster - 30, y: m.botten - 10 }, storlek)).not.toBeNull()
  })

  it('utelämnar en figur som skulle överlappa innehållet eller hamna utanför sektionen', () => {
    expect(omPlats(m, { x: 700, y: m.botten + 20 }, storlek)).toBeNull()
    expect(omPlats(m, { x: 10, y: m.botten + 40 }, storlek)).toBeNull()
    expect(omPlats(m, null, storlek)).toBeNull()
  })
})

describe('valjStig', () => {
  const bit = { start: 'vanster' as const, slut: 'hoger' as const }

  it('väljer full variant på breda skärmar när marginalen räcker', () => {
    expect(valjStig(matt(1440, 700, 112), bit, true)?.variant).toBe('full')
  })

  it('väljer enkel variant på smala skärmar och när marginalen inte räcker', () => {
    expect(valjStig(matt(1440, 700, 112), bit, false)?.variant).toBe('enkel')
    expect(valjStig(matt(1300, 700, 112), bit, true)?.variant).toBe('enkel')
    expect(valjStig(smal(), bit, false)?.variant).toBe('enkel')
  })

  it('ger samma variant i alla sektioner med samma bredd, så att den fulla ledens skarvar möts', () => {
    const bitar = kopplaStig([{ id: 'a' }, { id: 'b' }, { id: 'c' }])
    expect(bitar.map((b, i) => valjStig(matt(1440, [700, 500, 900][i], 112), b, true)?.variant)).toEqual(['full', 'full', 'full'])
  })
})

describe('ritning i takt med scrollen', () => {
  it('ritar den nedre biten från att luften syns till 30 % upp i fönstret', () => {
    const { nere } = ritintervall(80, 800)
    expect(nere).toEqual([-40, 240])
    expect(framsteg(-100, nere)).toBe(0)
    expect(framsteg(-40, nere)).toBe(0)
    expect(framsteg(100, nere)).toBeCloseTo(0.5, 6)
    expect(framsteg(240, nere)).toBe(1)
    expect(framsteg(1000, nere)).toBe(1)
  })

  it('ritar fortsättningen uppe direkt efter den nedre biten', () => {
    const { nere, uppe } = ritintervall(112, 900)
    expect(uppe[0]).toBe(nere[1])
    expect(uppe[1]).toBeGreaterThan(uppe[0])
  })

  it('drar tillbaka leden när man scrollar upp', () => {
    const { nere } = ritintervall(80, 800)
    const ner = [0, 50, 120, 200].map((p) => framsteg(p, nere))
    const upp = [200, 120, 50, 0].map((p) => framsteg(p, nere))
    expect(upp).toEqual([...ner].reverse())
  })

  it('ger samma intervall i CSS som i reserven', () => {
    // Den nedre utlösaren är luften, så att cover-läget är p + luften. Den övre börjar vid gränsen.
    expect(cssIntervall(80)).toEqual({ nere: 'cover 40px cover calc(80px + 30vh)', uppe: 'cover 30vh cover 40vh' })
    const fonster = 1000
    const { nere, uppe } = ritintervall(80, fonster)
    expect(nere[0] + 80).toBe(40)
    expect(nere[1] + 80).toBe(80 + 0.3 * fonster)
    expect(uppe).toEqual([0.3 * fonster, 0.4 * fonster])
  })
})
