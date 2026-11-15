import { describe, expect, it } from 'vitest'
import { beraknaStig, FIGUR, FIGURLUFT, kopplaStig, TASSAR, punktPaKurva, sidaX, slumptal, type Kubik, type Matt, type Sida, type Stigbit } from './geometri'

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
  /** Mellanrummen som de är på sidan: 144 px i mobil och 160 px på dator. */
  const sidan = [mobil(366, 144), matt(768, 144), matt(1366 - 48, 160), matt(1920 - 48, 160)]
  /** Bitarna som på startsidan. */
  const startsidan: Partial<Stigbit>[] = [
    { detaljer: [{ typ: 'eld', lage: 0.72 }] },
    {
      detaljer: [
        { typ: 'talt', lage: 0.3 },
        { typ: 'tassar', lage: 0.7 },
      ],
    },
    { detaljer: [{ typ: 'ledkors', lage: 0.6 }] },
    {},
  ]
  const ids = ['borja', 'packning', 'tanken', 'fragor']

  type Ruta = { namn: string; vanster: number; hoger: number; topp: number; botten: number }
  /** Alla figurer som rutor: x och y är marken, utom tassarna där punkten är mitten. */
  const rutor = (stig: NonNullable<ReturnType<typeof beraknaStig>>): Ruta[] => {
    const ruta = (namn: string, p: { x: number; y: number }, s: { bredd: number; hojd: number }) => ({
      namn,
      vanster: p.x - s.bredd / 2,
      hoger: p.x + s.bredd / 2,
      topp: p.y - s.hojd,
      botten: p.y,
    })
    const f = stig.figurer
    return [
      ...(f.ledkryss ? [ruta('ledkryss', f.ledkryss, FIGUR.ledkryss)] : []),
      ...(f.vagvisare ? [ruta('vägvisare', f.vagvisare, FIGUR.vagvisare)] : []),
      ...f.detaljer.flatMap((d) =>
        d.typ === 'tassar'
          ? (d.tassar ?? []).map((t, i) => ruta(`tass ${i}`, { x: t.punkt.x, y: t.punkt.y + 5 }, FIGUR.tass))
          : [ruta(d.typ, d.punkt, d.typ === 'ledkors' ? FIGUR.ledkryss : FIGUR.detalj)],
      ),
    ]
  }

  it('har minst 24 px fritt till panelerna över och under, och håller sig inom mellanrummet', () => {
    expect(FIGURLUFT).toBe(24)
    const fel: string[] = []
    for (const m of sidan) {
      kopplaStig(startsidan.map((b, i) => ({ ...b, id: ids[i] }))).forEach((b, i) => {
        const stig = beraknaStig(m, { ...b, forsta: true, sista: true }, ids[i])
        for (const r of stig ? rutor(stig) : []) {
          if (r.topp < FIGURLUFT || r.botten > m.hojd - FIGURLUFT || r.vanster < 0 || r.hoger > m.bredd) fel.push(`${m.bredd} ${ids[i]} ${r.namn}`)
        }
      })
    }
    expect(fel).toEqual([])
  })

  it('krockar aldrig med varandra, varken med ledkrysset, vägvisaren eller tältet', () => {
    const fel: string[] = []
    for (const m of sidan) {
      kopplaStig(startsidan.map((b, i) => ({ ...b, id: ids[i] }))).forEach((b, i) => {
        const stig = beraknaStig(m, { ...b, forsta: true, sista: true }, ids[i])
        const r = stig ? rutor(stig) : []
        for (let a = 0; a < r.length; a++) {
          for (let c = a + 1; c < r.length; c++) {
            const [x, y] = [r[a], r[c]]
            const isar = x.hoger <= y.vanster || x.vanster >= y.hoger || x.botten <= y.topp || x.topp >= y.botten
            if (!isar) fel.push(`${m.bredd} ${ids[i]}: ${x.namn} och ${y.namn}`)
          }
        }
      })
    }
    expect(fel).toEqual([])
  })

  it('visar alla figurerna på startsidan i mobil och på dator', () => {
    const fel: string[] = []
    for (const m of sidan) {
      const bitar = kopplaStig(startsidan.map((b, i) => ({ ...b, id: ids[i] })))
      bitar.forEach((b, i) => {
        const f = beraknaStig(m, b, ids[i])?.figurer
        const vantat = [...(b.detaljer ?? []).map((d) => d.typ)].sort()
        const fick = (f?.detaljer ?? []).map((d) => d.typ).sort()
        if (JSON.stringify(fick) !== JSON.stringify(vantat)) fel.push(`${m.bredd} ${ids[i]}: ${fick} i stället för ${vantat}`)
        if (b.forsta && !f?.ledkryss) fel.push(`${m.bredd}: ledkryss saknas`)
        if (b.sista && !f?.vagvisare) fel.push(`${m.bredd}: vägvisare saknas`)
      })
    }
    expect(fel).toEqual([])
  })

  it('står på leden, på delen tvärs över och inte i de branta svängarna', () => {
    const m = matt(1366 - 48, 160)
    const stig = beraknaStig(m, bit('vanster', 'hoger', { forsta: true, sista: true, detaljer: [{ typ: 'eld', lage: 0.5 }, { typ: 'ledkors', lage: 0.75 }] }), 'borja')
    if (!stig) throw new Error('Saknad geometri')
    const langs = stig.kurvor.flatMap((k) => punkter(k, 60))
    const punkterna = [stig.figurer.ledkryss, stig.figurer.vagvisare, ...stig.figurer.detaljer.map((d) => d.punkt)]
    for (const p of punkterna) {
      if (!p) throw new Error('Saknad figur')
      expect(Math.min(...langs.map((q) => Math.hypot(q.x - p.x, q.y - p.y)))).toBeLessThan(1)
      expect(p.x).toBeGreaterThan(stig.start.x + 30)
      expect(p.x).toBeLessThan(stig.slut.x - 30)
    }
  })

  it('lägger 4–6 tassavtryck i följd längs leden, omväxlande på var sida och i färdriktningen', () => {
    for (const m of sidan) {
      for (const [start, slut] of [
        ['hoger', 'vanster'],
        ['vanster', 'hoger'],
      ] as const) {
        const stig = beraknaStig(m, bit(start, slut, { detaljer: [{ typ: 'tassar', lage: 0.7 }] }), 'packning')
        const tassar = stig?.figurer.detaljer.find((d) => d.typ === 'tassar')?.tassar ?? []
        expect(TASSAR).toBeGreaterThanOrEqual(4)
        expect(TASSAR).toBeLessThanOrEqual(6)
        expect(tassar).toHaveLength(TASSAR)
        // Längre och längre fram längs leden, i bitens riktning.
        expect(tassar.every((t, i) => i === 0 || t.andel > tassar[i - 1].andel)).toBe(true)
        const riktning = slut === 'vanster' ? -1 : 1
        expect(Math.sign(tassar[TASSAR - 1].punkt.x - tassar[0].punkt.x)).toBe(riktning)
        // Tårna pekar i färdriktningen: vinkeln är ungefär 0° åt höger eller 180° åt vänster.
        for (const t of tassar) expect(Math.cos((t.vinkel * Math.PI) / 180) * riktning).toBeGreaterThan(0.5)
      }
    }
  })

  it('vet var längs leden ledkrysset och vägvisaren står, så att de dyker upp när leden når dit', () => {
    const stig = beraknaStig(matt(1366 - 48, 160), bit('vanster', 'hoger', { forsta: true, sista: true }), 'borja')
    const { ledkryss, vagvisare } = stig?.figurer ?? {}
    if (!ledkryss || !vagvisare) throw new Error('Saknad figur')
    // Ledkrysset tidigt och vägvisaren sent längs leden.
    expect(ledkryss.andel).toBeGreaterThan(0)
    expect(ledkryss.andel).toBeLessThanOrEqual(0.35)
    expect(vagvisare.andel).toBeGreaterThanOrEqual(0.65)
    expect(vagvisare.andel).toBeLessThan(1)
  })

  it('utelämnar figurer som inte får plats', () => {
    const stig = beraknaStig(
      matt(1416, 44),
      bit('vanster', 'hoger', { forsta: true, sista: true, detaljer: [{ typ: 'talt', lage: 0.5 }, { typ: 'tassar', lage: 0.7 }, { typ: 'ledkors', lage: 0.4 }] }),
      'borja',
    )
    expect(stig?.figurer).toEqual({ ledkryss: null, vagvisare: null, detaljer: [] })
  })

  it('visar bara figurer som hör till biten', () => {
    const stig = beraknaStig(matt(), bit('vanster', 'hoger'), 'tanken')
    expect(stig?.figurer).toEqual({ ledkryss: null, vagvisare: null, detaljer: [] })
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
