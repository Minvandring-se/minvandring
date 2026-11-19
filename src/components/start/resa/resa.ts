/**
 * Planerar landskapet bakom startsidans paneler: en lugn vandring genom svensk natur.
 *
 * Landskapet bestäms av hur långt ner på sidan man är (0–1), inte av sektionerna. Varje sort har en
 * vikt som stiger och sjunker mjukt längs sidan, så att granskogen tunnas ut, sjön dyker upp,
 * fjällbjörkarna får höstfärger och fjället tar vid utan skarpa gränser.
 *
 * Figurerna står bara där inget innehåll finns: i ytterkanterna bredvid panelerna, och i luften mellan
 * sektionerna längst ut mot sidorna, där leden inte går. Hellre för få än för många.
 * Allt räknas fram från ett frö, så att landskapet ser likadant ut vid varje besök.
 */
import { slumptal } from '@/components/start/stig/geometri'

export type Figur = 'gran' | 'bjork' | 'fjallbjork' | 'ljung' | 'sten' | 'stenrose' | 'kulle' | 'fjall' | 'sjo' | 'mark'

export interface Ruta {
  vanster: number
  hoger: number
  topp: number
  botten: number
}

export interface Underlag {
  /** Lagrets mått i px. */
  bredd: number
  hojd: number
  /** Panelerna och annat innehåll. Inget får ritas över dem. */
  hinder: Ruta[]
  /** Luften mellan sektionerna, där leden går. Figurer står bara längst ut mot sidorna. */
  glipor: Ruta[]
}

/** En placerad figur. x är mitten och y marken. bredd och hojd är figurens storlek i px. */
export interface Placerad {
  typ: Figur
  x: number
  y: number
  bredd: number
  hojd: number
  /** Liten variation i formen, 0–1. */
  variant: number
  /** Snö på fjället. */
  sno?: boolean
}

/** Luft mellan figurerna och innehållet. */
const LUFT = 10
/**
 * I gliporna står figurerna i den yttersta delen, där leden inte går. Andel av panelens bredd.
 * I smala fönster finns inga ytterkanter, så där får landskapet ta mer plats och leden går framför det.
 */
const GLIPKANT = 0.09
const GLIPKANT_SMAL = 0.3
const SMAL = 640
/** Minsta höjd på en glipa för att den ska få figurer. */
const MINSTA_GLIPA = 90

/** Mjuk puckel: 1 vid mitten, 0 en bredd bort. */
const puckel = (p: number, mitt: number, bredd: number) => {
  const t = Math.min(1, Math.abs(p - mitt) / bredd)
  return 0.5 + 0.5 * Math.cos(Math.PI * t)
}
/** Mjuk övergång från 0 till 1 mellan a och b. */
const steg = (p: number, a: number, b: number) => {
  const t = Math.min(1, Math.max(0, (p - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** Hur vanlig varje sort är på ett visst djup av sidan, 0–1. Sjön placeras för sig. */
export function vikter(p: number): Record<Exclude<Figur, 'sjo' | 'mark'>, number> {
  return {
    gran: 1 - steg(p, 0.18, 0.5),
    bjork: puckel(p, 0.25, 0.2) * 0.7,
    fjallbjork: puckel(p, 0.55, 0.17),
    ljung: puckel(p, 0.6, 0.18) * 0.5,
    kulle: puckel(p, 0.72, 0.2) * 0.8,
    sten: puckel(p, 0.75, 0.2) * 0.5,
    stenrose: puckel(p, 0.8, 0.12) * 0.4,
    fjall: steg(p, 0.55, 0.85),
  }
}

/** Sjön ligger här på sidan, som andel av höjden. */
const SJO = [0.34, 0.48] as const

/** Storlek på en figur, givet hur mycket plats som finns i bredd. null om den inte får plats. */
function storlek(typ: Figur, slump: () => number, maxBredd: number, maxHojd: number, k = 1): { bredd: number; hojd: number } | null {
  const v = slump()
  const grund = (() => {
    switch (typ) {
      case 'gran':
        return { bredd: 18 + v * 10, hojd: 34 + v * 26 }
      case 'bjork':
      case 'fjallbjork':
        return { bredd: 22 + v * 10, hojd: 30 + v * 20 }
      case 'ljung':
        return { bredd: 18 + v * 8, hojd: 7 + v * 3 }
      case 'sten':
        return { bredd: 14 + v * 10, hojd: 8 + v * 5 }
      case 'stenrose':
        return { bredd: 16 + v * 4, hojd: 20 + v * 6 }
      case 'kulle':
        return { bredd: 70 + v * 60, hojd: 14 + v * 10 }
      case 'fjall':
        return { bredd: 90 + v * 90, hojd: 40 + v * 35 }
      case 'sjo':
        return { bredd: 80 + v * 40, hojd: 30 + v * 10 }
      case 'mark':
        return { bredd: 60 + v * 30, hojd: 7 + v * 3 }
    }
  })()
  const s = { bredd: grund.bredd * k, hojd: grund.hojd * k }
  // Breda former krymper för att passa, små figurer hoppas över hellre än att trängas.
  const skala = Math.min(1, maxBredd / s.bredd, maxHojd / s.hojd)
  const kanKrympa = typ === 'fjall' || typ === 'kulle' || typ === 'sjo' || typ === 'mark'
  if (skala < (kanKrympa ? 0.55 : 1)) return null
  return { bredd: s.bredd * skala, hojd: s.hojd * skala }
}

/** Den vanligaste sorten på ett visst djup. */
function typisk(p: number): Exclude<Figur, 'sjo' | 'mark'> {
  const v = Object.entries(vikter(p)) as [Exclude<Figur, 'sjo' | 'mark'>, number][]
  return v.reduce((a, b) => (b[1] > a[1] ? b : a))[0]
}

/** Väljer en sort efter vikterna. */
function valj(p: number, slump: () => number): Exclude<Figur, 'sjo' | 'mark'> {
  const v = Object.entries(vikter(p)) as [Exclude<Figur, 'sjo' | 'mark'>, number][]
  const summa = v.reduce((a, [, w]) => a + w, 0)
  let r = slump() * summa
  for (const [typ, w] of v) {
    r -= w
    if (r <= 0) return typ
  }
  return v[v.length - 1][0]
}

const rutaFor = (f: Pick<Placerad, 'x' | 'y' | 'bredd' | 'hojd'>): Ruta => ({ vanster: f.x - f.bredd / 2, hoger: f.x + f.bredd / 2, topp: f.y - f.hojd, botten: f.y })
const krockar = (a: Ruta, b: Ruta, luft: number) =>
  !(a.hoger + luft <= b.vanster || a.vanster - luft >= b.hoger || a.botten + luft <= b.topp || a.topp - luft >= b.botten)

/** En yta där figurer får stå: x-intervall och y-intervall för marken. */
interface Yta {
  vanster: number
  hoger: number
  topp: number
  botten: number
  /** Ytterkanten (margin) eller en glipa. */
  slag: 'kant' | 'glipa'
  /** Högsta punkten en figur får nå upp till. */
  tak: number
  /**
   * Var i resan ytan hör hemma, 0–1. Gliporna följer ordningen (skog, sjö, höst, fjäll), så att resan
   * blir densamma även när panelerna är långa i mobil. Saknas den gäller djupet på sidan.
   */
  djup?: number
}

/** Ytorna där landskapet får finnas. */
function ytor(u: Underlag): Yta[] {
  const ut: Yta[] = []
  const panelV = Math.min(...u.hinder.map((h) => h.vanster), u.bredd)
  const panelH = Math.max(...u.hinder.map((h) => h.hoger), 0)
  if (u.hinder.length > 0) {
    // Ytterkanterna bredvid panelerna, över hela höjden.
    if (panelV - LUFT > 24) ut.push({ vanster: 4, hoger: panelV - LUFT, topp: 0, botten: u.hojd, slag: 'kant', tak: 0 })
    if (u.bredd - panelH - LUFT > 24) ut.push({ vanster: panelH + LUFT, hoger: u.bredd - 4, topp: 0, botten: u.hojd, slag: 'kant', tak: 0 })
  }
  const glipor = u.glipor.filter((g) => g.botten - g.topp >= MINSTA_GLIPA)
  glipor.forEach((g, i) => {
    const djup = (i + 1) / (glipor.length + 1)
    const kant = (g.hoger - g.vanster < SMAL ? GLIPKANT_SMAL : GLIPKANT) * (g.hoger - g.vanster)
    // Marken i den nedre delen av glipan, så att figurerna växer upp i luften och inte rör panelen ovanför.
    const topp = g.topp + (g.botten - g.topp) * 0.55
    const botten = g.botten - LUFT
    const tak = g.topp + LUFT * 2
    ut.push({ vanster: g.vanster + 2, hoger: g.vanster + kant, topp, botten, slag: 'glipa', tak, djup })
    ut.push({ vanster: g.hoger - kant, hoger: g.hoger - 2, topp, botten, slag: 'glipa', tak, djup })
  })
  return ut
}

/** Planerar landskapet. Samma underlag och frö ger alltid samma landskap. */
export function planeraResa(u: Underlag, fro = 'minvandring'): Placerad[] {
  if (!(u.bredd > 0 && u.hojd > 0) || !Number.isFinite(u.bredd) || !Number.isFinite(u.hojd)) return []
  const slump = slumptal(fro)
  const placerade: Placerad[] = []
  const upptaget: Ruta[] = []
  /** Var dungen som placeras just nu börjar i upptaget. Träden i den får stå tätt och överlappa varandra. */
  let dunge: number | null = null

  const forsok = (typ: Figur, x: number, y: number, yta: Yta, maxHojd: number, extra: Partial<Placerad> = {}, k = 1, bredd?: number) => {
    const maxBredd = Math.min(2 * (x - yta.vanster), 2 * (yta.hoger - x))
    const s = bredd ? (bredd <= maxBredd ? { bredd, hojd: (7 + slump() * 3) * k } : null) : storlek(typ, slump, maxBredd, maxHojd, k)
    if (!s) return false
    const f: Placerad = { typ, x, y, ...s, variant: slump(), ...extra }
    const r = rutaFor(f)
    if (r.topp < 0 || r.botten > u.hojd) return false
    if (u.hinder.some((h) => krockar(r, h, LUFT))) return false
    // Marken under en dunge får ligga under träden.
    if (typ !== 'mark' && upptaget.some((o, i) => (dunge === null || i < dunge) && krockar(r, o, 4))) return false
    placerade.push(f)
    upptaget.push(r)
    return true
  }

  for (const yta of ytor(u)) {
    const bredd = yta.hoger - yta.vanster
    if (yta.slag === 'glipa') {
      // En eller två små figurer per sida i varje glipa.
      const y = yta.botten - slump() * (yta.botten - yta.topp) * 0.3
      const p = yta.djup ?? y / u.hojd
      const maxHojd = Math.min(y - yta.tak, 64)
      // Det typiska för glipans läge, så att resan syns: skog, sjö, fjällbjörk, fjäll.
      const typ: Figur = p > SJO[0] && p < SJO[1] && bredd > 60 ? 'sjo' : typisk(p)
      forsok(typ, yta.vanster + bredd / 2 + (slump() - 0.5) * bredd * 0.3, y, yta, maxHojd)
      if ((bredd > 80 || slump() < 0.5) && bredd > 40) forsok(valj(p, slump), yta.vanster + bredd * (0.2 + slump() * 0.6), y - 2, yta, maxHojd * 0.7)
      continue
    }
    // Ytterkanterna: glesa dungar och enstaka figurer ner längs sidan. Lite större där kanten är bred.
    const k = Math.min(1.5, Math.max(1, bredd / 220))
    let y = 120 + slump() * 160
    let sjoKlar = false
    while (y < yta.botten) {
      const p = y / u.hojd
      if (!sjoKlar && p > SJO[0] && p < SJO[1] && slump() < 0.7) {
        sjoKlar = forsok('sjo', yta.vanster + bredd / 2, y, yta, 60, {}, k)
      } else {
        const typ = valj(p, slump)
        const x = yta.vanster + bredd * (0.25 + slump() * 0.5)
        if (typ === 'gran' || typ === 'bjork' || typ === 'fjallbjork') {
          // En dunge: två till fem träd tätt ihop på en låg kulle.
          const antal = 2 + Math.floor(slump() * 4)
          const spridning = (10 + antal * 9) * k
          const fore = placerade.length
          dunge = upptaget.length
          for (let i = 0; i < antal; i++) {
            const tx = x + (slump() - 0.5) * spridning
            forsok(slump() < 0.75 ? typ : valj(p, slump), tx, y + (slump() - 0.5) * 6 * k, yta, 200, {}, k * (0.75 + slump() * 0.4))
          }
          if (placerade.length > fore) {
            const tradX = placerade.slice(fore).map((f) => f.x)
            const fran = Math.min(...tradX) - 14 * k
            const till = Math.max(...tradX) + 14 * k
            forsok('mark', (fran + till) / 2, y + 4 * k, yta, 20, {}, k, till - fran)
          }
          dunge = null
        } else {
          forsok(typ, x, y, yta, 200, typ === 'fjall' ? { sno: p > 0.8 && slump() < 0.7 } : {}, k)
        }
      }
      y += 190 + slump() * 230
    }
  }

  // Bakifrån och fram: berg och kullar först, sedan efter marken, så att det som står längre ner hamnar framför.
  const lager = (t: Figur) => (t === 'fjall' ? 0 : t === 'kulle' || t === 'sjo' || t === 'mark' ? 1 : 2)
  return placerade.sort((a, b) => lager(a.typ) - lager(b.typ) || a.y - b.y)
}
