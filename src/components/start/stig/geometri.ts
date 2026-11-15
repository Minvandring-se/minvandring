/**
 * Geometrin för leden på startsidan. Leden går bara i luften mellan panelerna: varje bit börjar vid
 * nederkanten på en panel och slutar vid överkanten på nästa, och går aldrig in över en panel.
 *
 * Bitarna har många små, ojämna bukter, som en riktig stig. Ojämnheten är slumpmässig men räknas ut
 * från bitens id, så att den ser likadan ut vid varje besök. Den räknas i andelar av mellanrummets
 * mått och ändras därför inte när fönstret ändrar storlek.
 */

export type Sida = 'vanster' | 'hoger'
export type Detalj = 'talt' | 'eld' | 'tassar' | 'ledkors'

export interface DetaljVal {
  typ: Detalj
  /** Ungefär var längs biten detaljen står, 0–1, räknat i färdriktningen. */
  lage: number
}

export interface StigVal {
  id?: string
  /** Utelämna för att växla till motsatt sida. */
  slut?: Sida
  /** Små detaljer längs biten. De placeras i tur och ordning och krockar aldrig med varandra. */
  detaljer?: readonly DetaljVal[]
}

export interface Stigbit extends StigVal {
  start: Sida
  slut: Sida
  /** Första biten i leden. Får ett ledkryss i början. */
  forsta?: boolean
  /** Sista biten i leden. Får en vägvisare i slutet. */
  sista?: boolean
}

/** Mellanrummets mått och panelernas vänster- och högerkant i mellanrummet, i CSS-pixlar. */
export interface Matt {
  bredd: number
  hojd: number
  vanster: number
  hoger: number
}

export interface Punkt {
  x: number
  y: number
}

export type Kubik = [Punkt, Punkt, Punkt, Punkt]

/** Ett tassavtryck: mitten, vinkeln i färdriktningen (grader) och var längs leden det ligger. */
export interface Tass {
  punkt: Punkt
  vinkel: number
  andel: number
}

/**
 * En placerad detalj. punkt är var den står (marken). andel är var längs leden den ligger,
 * så att den kan dyka upp när leden ritats fram dit. Tassar har en lista med avtryck.
 */
export interface PlaceradDetalj {
  typ: Detalj
  punkt: Punkt
  andel: number
  tassar?: Tass[]
}

/** Var figurerna står, med fötterna på leden. null eller utelämnad när den saknas eller inte får plats. */
export interface Figurer {
  ledkryss: Punkt | null
  vagvisare: Punkt | null
  detaljer: PlaceradDetalj[]
}

/** Minsta fria luft över och under en figur, till panelen eller sektionen intill. */
export const FIGURLUFT = 24

/** Figurernas storlek i px. x är mitten och y marken. */
export const FIGUR = {
  ledkryss: { bredd: 32, hojd: 44 },
  vagvisare: { bredd: 48, hojd: 60 },
  detalj: { bredd: 44, hojd: 36 },
  tass: { bredd: 10, hojd: 10 },
}

/** Antal tassavtryck och avståndet mellan dem längs leden, i px. */
export const TASSAR = 5
const TASSAVSTAND = 18
/** Minsta avstånd mellan två figurer. */
const FIGURMELLANRUM = 8

const MINSTA_HOJD = 40
const MINSTA_BREDD = 160
/** Bitens ändar ligger så här långt in från panelens kant, som andel av panelens bredd. */
const INDRAG = 0.14

/**
 * Kopplar ihop bitarna i ordning. Varje bit börjar på den sida där förra slutade och utan eget slut
 * växlar den sida. Första och sista biten räknas fram från ordningen. Övriga fält, som id, behålls.
 */
export function kopplaStig<T extends StigVal>(delar: readonly T[], start: Sida = 'vanster'): Array<T & Stigbit> {
  let sida = start
  return delar.map((del, i) => {
    const slut = del.slut ?? (sida === 'vanster' ? 'hoger' : 'vanster')
    const bit = { ...del, start: sida, slut, forsta: i === 0, sista: i === delar.length - 1 }
    sida = slut
    return bit
  })
}

/** Slumptal 0–1 som alltid blir desamma för samma frö (FNV-1a och mulberry32). */
export function slumptal(fro: string): () => number {
  let h = 2166136261
  for (let i = 0; i < fro.length; i++) h = Math.imul(h ^ fro.charCodeAt(i), 16777619)
  let s = h >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function punktPaKurva(k: Kubik, t: number): Punkt {
  const u = 1 - t
  return {
    x: u ** 3 * k[0].x + 3 * u ** 2 * t * k[1].x + 3 * u * t ** 2 * k[2].x + t ** 3 * k[3].x,
    y: u ** 3 * k[0].y + 3 * u ** 2 * t * k[1].y + 3 * u * t ** 2 * k[2].y + t ** 3 * k[3].y,
  }
}

function riktningPaKurva(k: Kubik, t: number): Punkt {
  const u = 1 - t
  return {
    x: 3 * u ** 2 * (k[1].x - k[0].x) + 6 * u * t * (k[2].x - k[1].x) + 3 * t ** 2 * (k[3].x - k[2].x),
    y: 3 * u ** 2 * (k[1].y - k[0].y) + 6 * u * t * (k[2].y - k[1].y) + 3 * t ** 2 * (k[3].y - k[2].y),
  }
}

/** x för bitens ände på en sida, en bit in från panelens kant. */
export function sidaX(m: Matt, sida: Sida) {
  const indrag = INDRAG * (m.hoger - m.vanster)
  return sida === 'vanster' ? m.vanster + indrag : m.hoger - indrag
}

/** Punkter längs leden med andelen av sträckan, för att placera figurerna. */
function langsLeden(kurvor: Kubik[], steg = 60): { punkter: (Punkt & { andel: number })[]; langd: number } {
  const punkter = kurvor.flatMap((k, i) =>
    Array.from({ length: steg + (i === kurvor.length - 1 ? 1 : 0) }, (_, j) => punktPaKurva(k, j / steg)),
  )
  const avstand = [0]
  for (let i = 1; i < punkter.length; i++) {
    avstand.push(avstand[i - 1] + Math.hypot(punkter[i].x - punkter[i - 1].x, punkter[i].y - punkter[i - 1].y))
  }
  const total = avstand[avstand.length - 1] || 1
  return { punkter: punkter.map((p, i) => ({ ...p, andel: avstand[i] / total })), langd: total }
}

interface Ruta {
  vanster: number
  hoger: number
  topp: number
  botten: number
}

const rutaFor = (p: Punkt, s: { bredd: number; hojd: number }): Ruta => ({ vanster: p.x - s.bredd / 2, hoger: p.x + s.bredd / 2, topp: p.y - s.hojd, botten: p.y })

const krockar = (a: Ruta, b: Ruta) =>
  !(
    a.hoger + FIGURMELLANRUM <= b.vanster ||
    a.vanster - FIGURMELLANRUM >= b.hoger ||
    a.botten + FIGURMELLANRUM <= b.topp ||
    a.topp - FIGURMELLANRUM >= b.botten
  )

/** Om figuren får plats i mellanrummet: helt inom det och med minst FIGURLUFT fritt över och under. */
export function farPlats(m: Matt, p: Punkt, storlek: { bredd: number; hojd: number }) {
  return (
    p.x - storlek.bredd / 2 >= 0 &&
    p.x + storlek.bredd / 2 <= m.bredd &&
    p.y - storlek.hojd >= FIGURLUFT &&
    p.y <= m.hojd - FIGURLUFT
  )
}

/** Bitens kurvor, SVG-sökväg och figurer, eller null om mellanrummet är för litet. */
export function beraknaStig(m: Matt, bit: Stigbit, fro = bit.id ?? '') {
  if (
    !Object.values(m).every(Number.isFinite) ||
    m.hojd < MINSTA_HOJD ||
    m.bredd < MINSTA_BREDD ||
    m.hoger - m.vanster < MINSTA_BREDD ||
    m.vanster < 0 ||
    m.hoger > m.bredd
  ) {
    return null
  }

  const slump = slumptal(fro)
  const { bredd, hojd } = m
  const start = { x: sidaX(m, bit.start), y: 1 }
  const slut = { x: sidaX(m, bit.slut), y: hojd - 1 }
  // Grundformen i tre delar: brant ner från panelen ovanför, tvärs över i mitten och brant ner mot
  // nästa panel. Samma sida: en båge in mot mitten och tillbaka.
  const panel = m.hoger - m.vanster
  // Delen tvärs över ligger lite under mitten, så att figurerna på den får luft över sig.
  const mittY = 0.6 * hojd
  const bojning = Math.min(130, Math.max(40, 0.12 * panel))
  const tvars = slut.x !== start.x ? Math.sign(slut.x - start.x) : bit.start === 'vanster' ? 1 : -1
  const m1 = { x: start.x + tvars * bojning, y: mittY }
  const m2 = slut.x !== start.x ? { x: slut.x - tvars * bojning, y: mittY } : { x: start.x + tvars * (bojning + 0.2 * panel), y: mittY }
  const ner: Kubik = [start, { x: start.x, y: start.y + 0.6 * (mittY - start.y) }, { x: m1.x - tvars * 0.45 * bojning, y: mittY }, m1]
  const over: Kubik = [m1, { x: m1.x + (m2.x - m1.x) / 3, y: mittY }, { x: m1.x + (2 * (m2.x - m1.x)) / 3, y: mittY }, m2]
  const nerIgen: Kubik = [m2, { x: m2.x + tvars * 0.45 * bojning, y: mittY }, { x: slut.x, y: slut.y - 0.6 * (slut.y - mittY) }, slut]

  // Små, ojämna bukter vinkelrätt mot grundformen: ett par i varje sväng ner och fler, med olika
  // avstånd och storlek, tvärs över.
  const storsta = Math.min(9, hojd * 0.11)
  const tvarsAntal = 7 + Math.floor(slump() * 4)
  const steg = Array.from({ length: tvarsAntal + 1 }, () => 0.5 + slump())
  const summa = steg.reduce((a, b) => a + b, 0)
  let ackumulerat = 0
  // [kurva, läge, i en sväng]. I svängarna byter bukterna alltid håll, så att de slingrar.
  const lagen: [Kubik, number, boolean][] = [
    [ner, 0.35 + 0.1 * slump(), true],
    [ner, 0.7 + 0.1 * slump(), true],
    ...steg.slice(0, -1).map((v): [Kubik, number, boolean] => {
      ackumulerat += v / summa
      return [over, ackumulerat, false]
    }),
    [nerIgen, 0.25 + 0.1 * slump(), true],
    [nerIgen, 0.6 + 0.1 * slump(), true],
  ]
  let tecken = slump() < 0.5 ? -1 : 1
  const mitt = lagen.map(([kurva, t, sving]) => {
    tecken = sving || slump() < 0.75 ? -tecken : tecken
    const utslag = tecken * storsta * (0.3 + 0.7 * slump())
    const p = punktPaKurva(kurva, t)
    const r = riktningPaKurva(kurva, t)
    const l = Math.hypot(r.x, r.y) || 1
    return {
      x: Math.min(bredd - 4, Math.max(4, p.x + (-r.y / l) * utslag)),
      y: Math.min(hojd - 6, Math.max(6, p.y + (r.x / l) * utslag)),
    }
  })

  // Mjuk kurva genom punkterna (Catmull–Rom). Kontrollpunkterna hålls inom mellanrummet, och då
  // gör kurvan det också, så att den aldrig går in över en panel.
  const genom = [{ x: start.x, y: -0.3 * hojd }, start, ...mitt, slut, { x: slut.x, y: 1.3 * hojd }]
  const inom = (p: Punkt) => ({ x: Math.min(bredd, Math.max(0, p.x)), y: Math.min(hojd - 0.5, Math.max(0.5, p.y)) })
  const kurvor: Kubik[] = []
  for (let i = 1; i < genom.length - 2; i++) {
    const [a, b, c, d] = [genom[i - 1], genom[i], genom[i + 1], genom[i + 2]]
    kurvor.push([b, inom({ x: b.x + (c.x - a.x) / 6, y: b.y + (c.y - a.y) / 6 }), inom({ x: c.x - (d.x - b.x) / 6, y: c.y - (d.y - b.y) / 6 }), c])
  }

  // Figurerna står bara på delen som går tvärs över, inte i de branta svängarna nära panelerna.
  // De placeras i tur och ordning, och en figur som skulle krocka med en tidigare väljer en annan plats.
  const [tvarsFran, tvarsTill] = [Math.min(m1.x, m2.x), Math.max(m1.x, m2.x)]
  const { punkter: alla, langd } = langsLeden(kurvor)
  const tvarsPunkter = alla.filter((p) => p.x >= tvarsFran && p.x <= tvarsTill)
  const upptagna: Ruta[] = []
  const ledig = (r: Ruta) => upptagna.every((u) => !krockar(r, u))
  const passar = (p: Punkt, storlek: { bredd: number; hojd: number }) => farPlats(m, p, storlek) && ledig(rutaFor(p, storlek))
  const ta = <T extends Punkt>(p: T | undefined, storlek: { bredd: number; hojd: number }) => {
    if (!p) return null
    upptagna.push(rutaFor(p, storlek))
    return { x: p.x, y: p.y }
  }
  const narmast = (onskat: number) => [...tvarsPunkter].filter((p) => Math.abs(p.andel - onskat) <= 0.25).sort((a, b) => Math.abs(a.andel - onskat) - Math.abs(b.andel - onskat))

  const ledkryss = bit.forsta ? ta(tvarsPunkter.find((p) => p.andel <= 0.35 && passar(p, FIGUR.ledkryss)), FIGUR.ledkryss) : null
  const vagvisare = bit.sista ? ta([...tvarsPunkter].reverse().find((p) => p.andel >= 0.65 && passar(p, FIGUR.vagvisare)), FIGUR.vagvisare) : null

  /** Punkten på leden närmast en andel. */
  const punktVid = (andel: number) => alla[Math.max(0, alla.findIndex((p) => p.andel >= andel))] ?? alla[alla.length - 1]
  /** Punkten och stigens riktning där, mätt över en tasslängd så att små bukter inte vrider tassen. */
  const vid = (andel: number) => {
    const halv = TASSAVSTAND / 2 / langd
    const [a, b] = [punktVid(andel - halv), punktVid(andel + halv)]
    const l = Math.hypot(b.x - a.x, b.y - a.y) || 1
    return { punkt: punktVid(andel), riktning: { x: (b.x - a.x) / l, y: (b.y - a.y) / l } }
  }

  /** Tassavtryck i följd längs leden, omväxlande lite på var sida, i färdriktningen. */
  const tassarVid = (mitt: number): Tass[] | null => {
    const steg = TASSAVSTAND / langd
    const tassar: Tass[] = []
    for (let j = 0; j < TASSAR; j++) {
      const andel = mitt + (j - (TASSAR - 1) / 2) * steg
      if (andel <= 0 || andel >= 1) return null
      const { punkt, riktning } = vid(andel)
      if (punkt.x < tvarsFran || punkt.x > tvarsTill) return null
      const sida = j % 2 === 0 ? 1 : -1
      const mittpunkt = { x: punkt.x - riktning.y * 4 * sida, y: punkt.y + riktning.x * 4 * sida }
      // Rutan räknas från mitten: markpunkten ligger en halv tass under.
      if (!passar({ x: mittpunkt.x, y: mittpunkt.y + FIGUR.tass.hojd / 2 }, FIGUR.tass)) return null
      tassar.push({ punkt: mittpunkt, vinkel: (Math.atan2(riktning.y, riktning.x) * 180) / Math.PI, andel })
    }
    return tassar
  }

  const detaljer: PlaceradDetalj[] = []
  for (const val of bit.detaljer ?? []) {
    if (val.typ === 'tassar') {
      for (const p of narmast(val.lage)) {
        const tassar = tassarVid(p.andel)
        if (!tassar) continue
        for (const t of tassar) upptagna.push(rutaFor({ x: t.punkt.x, y: t.punkt.y + FIGUR.tass.hojd / 2 }, FIGUR.tass))
        detaljer.push({ typ: 'tassar', punkt: tassar[Math.floor(TASSAR / 2)].punkt, andel: tassar[0].andel, tassar })
        break
      }
      continue
    }
    // Ledkorset är samma röda kryss som vid ledens början.
    const storlek = val.typ === 'ledkors' ? FIGUR.ledkryss : FIGUR.detalj
    const p = narmast(val.lage).find((q) => passar(q, storlek))
    const punkt = ta(p, storlek)
    if (p && punkt) detaljer.push({ typ: val.typ, punkt, andel: p.andel })
  }
  const figurer: Figurer = { ledkryss, vagvisare, detaljer }

  const d = `M ${start.x} ${start.y} ` + kurvor.map(([, b, c, e]) => `C ${b.x} ${b.y}, ${c.x} ${c.y}, ${e.x} ${e.y}`).join(' ')
  return { d, start, slut, kurvor, figurer }
}
