import { describe, expect, it } from 'vitest'
import { beraknaStig, FIGUR, FIGURLUFT, kopplaStig, punktPaKurva, sidaX, slumptal, type Kubik, type Matt, type Sida, type Stigbit } from './geometri'

/** Ett mellanrum: bredd och höjd, med paneler på 1152 px i mitten (eller nästan kant i kant). */
const matt = (bredd = 1416, hojd = 112): Matt => {
  const panel = Math.min(1152, bredd)
  return { bredd, hojd, vanster: (bredd - panel) / 2, hoger: (bredd + panel) / 2 }
}
/** Mobil: mellanrummet ligger innanför sidmarginalen, så panelerna fyller hela bredden. */
const mobil = (bredd = 366, hojd = 80): Matt => ({ bredd, hojd, vanster: 0, hoger: bredd })

const sidor: Sida[] = ['vanster', 'hoger']
const punkter = (k: Kubik, n = 40) => Array.from({ length: n + 1 }, (_, i) => punktPaKurva(k, i / n))
const bit = (start: Sida, slut: Sida, extra: Partial<Stigbit> = {}): Stigbit => ({ start, slut, ...extra })

describe('beraknaStig', () => {
  it('går bara i mellanrummet, från panelen ovanför till panelen nedanför', () => {
    const fel: string[] = []
    for (const m of [mobil(), mobil(358, 80), matt(768, 96), matt(1024, 112), matt(1366 - 48, 112), matt(1920 - 48, 112), matt(1416, 40)]) {
      for (const id of ['borja', 'packning', 'tanken', 'fragor', 'x', 'en femte']) {
        for (const start of sidor) {
          for (const slut of sidor) {
            const stig = beraknaStig(m, bit(start, slut), id)
            if (!stig) {
              fel.push(`${m.bredd}x${m.hojd} ${id}: saknas`)
              continue
            }
            for (const p of stig.kurvor.flatMap((k) => punkter(k))) {
              if (!(p.y >= 0 && p.y <= m.hojd && p.x >= 0 && p.x <= m.bredd)) fel.push(`${m.bredd}x${m.hojd} ${id} ${start}-${slut}: ${p.x},${p.y}`)
            }
          }
        }
      }
    }
    expect(fel.slice(0, 5)).toEqual([])
  })

  it('börjar vid panelen ovanför och slutar vid panelen nedanför, på rätt sida', () => {
    const m = matt()
    const stig = beraknaStig(m, bit('vanster', 'hoger'), 'borja')
    expect(stig?.start).toEqual({ x: sidaX(m, 'vanster'), y: 1 })
    expect(stig?.slut).toEqual({ x: sidaX(m, 'hoger'), y: m.hojd - 1 })
    expect(stig?.kurvor[0][0]).toEqual(stig?.start)
    expect(stig?.kurvor.at(-1)?.[3]).toEqual(stig?.slut)
  })

  it('har många små bukter med olika storlek och avstånd', () => {
    for (const id of ['borja', 'packning', 'tanken', 'fragor']) {
      const stig = beraknaStig(matt(), bit('vanster', 'hoger'), id)
      if (!stig) throw new Error('Saknad geometri')
      // Bitarnas längd i x och höjden på varje genompunkt.
      const langder = stig.kurvor.map((k) => Math.hypot(k[3].x - k[0].x, k[3].y - k[0].y))
      const y = stig.kurvor.slice(1, -1).map((k) => k[0].y)
      expect(stig.kurvor.length).toBeGreaterThanOrEqual(11)
      expect(Math.max(...langder) / Math.min(...langder)).toBeGreaterThan(1.5)
      // Upp och ner om vartannat flera gånger, med olika utslag.
      const vandningar = y.slice(1, -1).filter((v, i) => (v - y[i]) * (y[i + 2] - v) < 0).length
      expect(vandningar).toBeGreaterThanOrEqual(4)
    }
  })

  it('slingrar sig även i svängarna ner från och mot panelerna', () => {
    /** Hur många gånger böjningen byter håll längs kurvorna, alltså hur många S-bukter de har. */
    const byten = (kurvor: Kubik[]) => {
      const p = kurvor.flatMap((k) => punkter(k, 20))
      const kors = p.slice(2).map((c, i) => {
        const [a, b] = [p[i], p[i + 1]]
        return (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x)
      })
      const tecken = kors.filter((k) => Math.abs(k) > 1e-6).map(Math.sign)
      return tecken.slice(1).filter((t, i) => t !== tecken[i]).length
    }
    for (const id of ['borja', 'packning', 'tanken', 'fragor']) {
      const stig = beraknaStig(matt(), bit('vanster', 'hoger'), id)
      if (!stig) throw new Error('Saknad geometri')
      expect(byten(stig.kurvor.slice(0, 3)), `${id}: första svängen`).toBeGreaterThanOrEqual(1)
      expect(byten(stig.kurvor.slice(-3)), `${id}: sista svängen`).toBeGreaterThanOrEqual(1)
    }
  })

  it('ser likadan ut vid varje besök och ändras inte vid resize', () => {
    const a = beraknaStig(matt(1416, 112), bit('vanster', 'hoger'), 'packning')
    const b = beraknaStig(matt(1416, 112), bit('vanster', 'hoger'), 'packning')
    expect(a?.d).toBe(b?.d)
    // Samma form i andelar av mellanrummet, oavsett storlek.
    const relativ = (m: Matt) =>
      beraknaStig(m, bit('vanster', 'hoger'), 'packning')
        ?.kurvor.map((k) => [(k[3].x - m.vanster) / (m.hoger - m.vanster), k[3].y / m.hojd])
        .flat()
    const stor = relativ(matt(1920 - 48, 112)) ?? []
    const liten = relativ(matt(1366 - 48, 112)) ?? []
    expect(stor.length).toBe(liten.length)
    stor.forEach((v, i) => expect(v).toBeCloseTo(liten[i], 1))
  })

  it('ger olika former för olika sektioner', () => {
    const d = ['borja', 'packning', 'tanken', 'fragor'].map((id) => beraknaStig(matt(), bit('vanster', 'hoger'), id)?.d)
    expect(new Set(d).size).toBe(4)
  })

  it('är mjuk, utan knyck där bukterna möts', () => {
    const stig = beraknaStig(matt(), bit('hoger', 'vanster'), 'tanken')
    if (!stig) throw new Error('Saknad geometri')
    for (let i = 1; i < stig.kurvor.length; i++) {
      const [, , c, e] = stig.kurvor[i - 1]
      const [s, b] = stig.kurvor[i]
      const vinkel = (x: number, y: number) => Math.atan2(y, x)
      const skillnad = Math.abs(vinkel(e.x - c.x, e.y - c.y) - vinkel(b.x - s.x, b.y - s.y))
      expect(Math.min(skillnad, 2 * Math.PI - skillnad)).toBeLessThan(0.35)
    }
  })

  it('saknas när mellanrummet är för litet', () => {
    expect(beraknaStig(matt(1416, 30), bit('vanster', 'hoger'), 'a')).toBeNull()
    expect(beraknaStig(mobil(120), bit('vanster', 'hoger'), 'a')).toBeNull()
    expect(beraknaStig({ ...matt(), hojd: Number.NaN }, bit('vanster', 'hoger'), 'a')).toBeNull()
  })
})

describe('figurer', () => {
  /** Helt i mellanrummet med minst 24 px fritt till panelen ovanför och nedanför. */
  const fritt = (m: Matt, p: { x: number; y: number }, s: { bredd: number; hojd: number }) =>
    p.x - s.bredd / 2 >= 0 && p.x + s.bredd / 2 <= m.bredd && p.y - s.hojd >= FIGURLUFT && p.y <= m.hojd - FIGURLUFT
  /** Mellanrummen som de är på sidan: 144 px i mobil och 160 px på dator. */
  const sidan = [mobil(366, 144), matt(768, 144), matt(1366 - 48, 160), matt(1920 - 48, 160)]

  it('står på leden med minst 24 px fritt över och under, aldrig mot en panel', () => {
    expect(FIGURLUFT).toBe(24)
    const fel: string[] = []
    for (const m of sidan) {
      for (const id of ['borja', 'packning', 'tanken', 'fragor']) {
        const stig = beraknaStig(m, bit('vanster', 'hoger', { forsta: true, sista: true, detalj: 'talt', detaljLage: 0.5 }), id)
        if (!stig) continue
        const langs = stig.kurvor.flatMap((k) => punkter(k, 60))
        for (const [namn, p, storlek] of [
          ['ledkryss', stig.figurer.ledkryss, FIGUR.ledkryss],
          ['vägvisare', stig.figurer.vagvisare, FIGUR.vagvisare],
          ['detalj', stig.figurer.detalj, FIGUR.detalj],
        ] as const) {
          if (!p) continue
          if (!fritt(m, p, storlek)) fel.push(`${m.bredd} ${id} ${namn}: för nära en panel`)
          if (Math.min(...langs.map((q) => Math.hypot(q.x - p.x, q.y - p.y))) > 1) fel.push(`${m.bredd} ${id} ${namn}: inte på leden`)
        }
      }
    }
    expect(fel).toEqual([])
  })

  it('visar tältet, brasan, ledkrysset och vägvisaren i mobil och på dator', () => {
    const fel: string[] = []
    for (const m of sidan) {
      for (const id of ['borja', 'packning', 'tanken', 'fragor']) {
        for (const [start, slut] of [
          ['vanster', 'hoger'],
          ['hoger', 'vanster'],
        ] as const) {
          for (const [detalj, detaljLage] of [
            ['talt', 0.3],
            ['eld', 0.72],
          ] as const) {
            const f = beraknaStig(m, bit(start, slut, { forsta: true, sista: true, detalj, detaljLage }), id)?.figurer
            for (const [namn, p] of Object.entries(f ?? {})) if (!p) fel.push(`${m.bredd} ${id} ${start} ${detalj}: ${namn} saknas`)
          }
        }
      }
    }
    expect(fel).toEqual([])
  })

  it('står på delen tvärs över, inte i de branta svängarna nära panelerna', () => {
    const m = matt(1366 - 48, 160)
    const stig = beraknaStig(m, bit('vanster', 'hoger', { forsta: true, sista: true, detalj: 'eld', detaljLage: 0.5 }), 'borja')
    if (!stig) throw new Error('Saknad geometri')
    for (const p of Object.values(stig.figurer)) {
      if (!p) throw new Error('Saknad figur')
      // Mellan bitens ändar och en bit in från dem, där leden går tvärs över.
      expect(p.x).toBeGreaterThan(stig.start.x + 30)
      expect(p.x).toBeLessThan(stig.slut.x - 30)
    }
  })

  it('utelämnar figurer som inte får plats', () => {
    const stig = beraknaStig(matt(1416, 44), bit('vanster', 'hoger', { forsta: true, sista: true, detalj: 'talt' }), 'borja')
    expect(stig?.figurer).toEqual({ ledkryss: null, vagvisare: null, detalj: null })
  })

  it('visar bara figurer som hör till biten', () => {
    const stig = beraknaStig(matt(), bit('vanster', 'hoger'), 'tanken')
    expect(stig?.figurer).toEqual({ ledkryss: null, vagvisare: null, detalj: null })
  })
})

describe('slumptal', () => {
  it('ger samma följd för samma frö och olika för olika frön', () => {
    const a = slumptal('packning')
    const b = slumptal('packning')
    const c = slumptal('tanken')
    const fa = [a(), a(), a()]
    expect([b(), b(), b()]).toEqual(fa)
    expect([c(), c(), c()]).not.toEqual(fa)
    expect(fa.every((v) => v >= 0 && v < 1)).toBe(true)
  })
})

describe('kopplaStig', () => {
  const original = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }]

  it('börjar varje bit där förra slutade, så att leden fortsätter under panelen', () => {
    for (const lista of [original, [...original, { id: 'e' }], original.filter((s) => s.id !== 'b')]) {
      const bitar = kopplaStig(lista)
      expect(bitar.map((b) => b.id)).toEqual(lista.map((b) => b.id))
      for (let i = 1; i < bitar.length; i++) {
        expect(bitar[i].start).toBe(bitar[i - 1].slut)
        // Samma panelbredd: förra bitens slut och nästa bits början ligger rakt över varandra.
        expect(beraknaStig(matt(), bitar[i], bitar[i].id)?.start.x).toBe(beraknaStig(matt(), bitar[i - 1], bitar[i - 1].id)?.slut.x)
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
    const marken = (lista: { id: string }[]) => kopplaStig(lista).map((b) => [b.id, b.forsta, b.sista])
    expect(marken(original)).toEqual([
      ['a', true, false],
      ['b', false, false],
      ['c', false, false],
      ['d', false, true],
    ])
    expect(marken([...original, { id: 'e' }]).at(-1)).toEqual(['e', false, true])
    expect(marken(original.slice(1))[0]).toEqual(['b', true, false])
  })
})
