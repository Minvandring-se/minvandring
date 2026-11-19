/**
 * Terrängen i mellanrummen mellan startsidans paneler: tunna höjdkurvor som i en karta och ett litet
 * motiv som visar var på vandringen man är (skog, sjö, höstbjörkar, fjäll). Allt ligger under leden.
 * Motiven placeras där de inte krockar med ledens figurer. Formerna räknas fram från bitens id,
 * så att terrängen ser likadan ut vid varje besök.
 */
import { slumptal, type Matt } from '@/components/start/stig/geometri'

export type Terrang = 'skog' | 'sjo' | 'host' | 'fjall'

export interface Ruta {
  vanster: number
  hoger: number
  topp: number
  botten: number
}

/** En form: SVG-sökväg och Tailwind-klasser för fyllning och linje. */
export interface Form {
  d: string
  klass: string
}

const tal = (n: number) => Math.round(n * 10) / 10

/** Antal höjdkurvor per mellanrum. */
export const KURVOR = 3

/**
 * Höjdkurvorna: mjuka, vågiga linjer över hela mellanrummet. Varje linje är en summa av två
 * sinusvågor med olika längd, så att de ser ut som terräng och inte som ett mönster.
 */
export function hojdkurvor(m: Matt, fro: string): string[] {
  const slump = slumptal(`kurvor-${fro}`)
  const { bredd, hojd } = m
  const steg = 24
  return Array.from({ length: KURVOR }, (_, i) => {
    const bas = hojd * (0.3 + (0.5 * (i + 0.3 + slump() * 0.4)) / KURVOR)
    const a1 = hojd * (0.05 + slump() * 0.05)
    const a2 = hojd * (0.02 + slump() * 0.03)
    const l1 = 500 + slump() * 500
    const l2 = 180 + slump() * 160
    const f1 = slump() * Math.PI * 2
    const f2 = slump() * Math.PI * 2
    const punkter: string[] = []
    for (let x = 0; x <= bredd + steg; x += steg) {
      const y = bas + a1 * Math.sin((2 * Math.PI * x) / l1 + f1) + a2 * Math.sin((2 * Math.PI * x) / l2 + f2)
      punkter.push(`${tal(Math.min(x, bredd))} ${tal(Math.min(hojd - 2, Math.max(2, y)))}`)
    }
    return `M${punkter.join(' L')}`
  })
}

/** Storleken på motivens delar i px. x är mitten och y marken. */
const MOTIV: Record<Terrang, { bredd: number; hojd: number }> = {
  skog: { bredd: 46, hojd: 28 },
  sjo: { bredd: 84, hojd: 20 },
  host: { bredd: 40, hojd: 30 },
  fjall: { bredd: 220, hojd: 46 },
}

/** Hur många delar varje motiv har: skog och höstbjörkar på båda sidor om leden, en sjö och en fjällkedja. */
const ANTAL: Record<Terrang, number> = { skog: 2, sjo: 1, host: 2, fjall: 1 }

/** Platser att pröva, som andel av panelens bredd, i den ordningen. */
const PLATSER: Record<Terrang, number[]> = {
  skog: [0.3, 0.72, 0.22, 0.8, 0.4, 0.62],
  sjo: [0.66, 0.6, 0.72, 0.4, 0.34],
  host: [0.26, 0.76, 0.2, 0.82, 0.36, 0.64],
  fjall: [0.62, 0.55, 0.7, 0.45, 0.38],
}

const krockar = (a: Ruta, b: Ruta, luft: number) =>
  !(a.hoger + luft <= b.vanster || a.vanster - luft >= b.hoger || a.botten + luft <= b.topp || a.topp - luft >= b.botten)

function gran(x: number, y: number, h: number): string {
  const t = y - h
  return `M${tal(x)} ${tal(t)} L${tal(x - 0.2 * h)} ${tal(t + 0.45 * h)} H${tal(x - 0.09 * h)} L${tal(x - 0.3 * h)} ${tal(y)} H${tal(x + 0.3 * h)} L${tal(x + 0.09 * h)} ${tal(t + 0.45 * h)} H${tal(x + 0.2 * h)} Z`
}

function bjorkkrona(x: number, y: number, r: number): string {
  return `M${tal(x)} ${tal(y - r)} C${tal(x + r * 0.9)} ${tal(y - r)} ${tal(x + r)} ${tal(y + r * 0.6)} ${tal(x)} ${tal(y + r * 0.8)} C${tal(x - r)} ${tal(y + r * 0.6)} ${tal(x - r * 0.9)} ${tal(y - r)} ${tal(x)} ${tal(y - r)} Z`
}

/** Formerna för en del av ett motiv, med marken i (x, y). */
function ritaDel(typ: Terrang, x: number, y: number, storlek: { bredd: number; hojd: number }, slump: () => number): Form[] {
  const { bredd, hojd } = storlek
  const mark = `M${tal(x - bredd / 2)} ${tal(y)} Q${tal(x)} ${tal(y - 4)} ${tal(x + bredd / 2)} ${tal(y)}`
  switch (typ) {
    case 'skog': {
      const trad = [-14, -4, 6, 15].map((dx, i) => gran(x + dx + (slump() - 0.5) * 3, y - 1, hojd * (i === 1 ? 1 : 0.62 + slump() * 0.25)))
      return [
        { d: mark, klass: 'fill-none stroke-primary-soft' },
        { d: trad.join(' '), klass: 'fill-illustration/30 stroke-illustration/60' },
      ]
    }
    case 'host': {
      const stammar: string[] = []
      const kronor: string[] = []
      for (const [dx, h] of [
        [-9, 1],
        [3, 0.8],
        [12, 0.65],
      ] as const) {
        const tx = x + dx
        const th = hojd * h
        stammar.push(`M${tal(tx)} ${tal(y)} L${tal(tx + (slump() - 0.5) * 2)} ${tal(y - th * 0.55)}`)
        kronor.push(bjorkkrona(tx, y - th * 0.7, th * 0.3))
      }
      return [
        { d: mark, klass: 'fill-none stroke-sand' },
        { d: kronor.join(' '), klass: 'fill-accent/60 stroke-accent-strong/50' },
        { d: stammar.join(' '), klass: 'fill-none stroke-foreground/35' },
      ]
    }
    case 'sjo': {
      const v = bredd / 2
      const d = `M${tal(x - v)} ${tal(y - 6)} C${tal(x - v * 0.7)} ${tal(y - hojd)} ${tal(x + v * 0.5)} ${tal(y - hojd - 2)} ${tal(x + v)} ${tal(y - 8)} C${tal(x + v * 0.8)} ${tal(y + 2)} ${tal(x - v * 0.6)} ${tal(y + 3)} ${tal(x - v)} ${tal(y - 6)} Z`
      const vagor = `M${tal(x - v * 0.4)} ${tal(y - 9)} q3 -2 6 0 q3 2 6 0 M${tal(x + v * 0.15)} ${tal(y - 5)} q3 -2 6 0`
      const vass = `M${tal(x + v * 0.9)} ${tal(y - 6)} l-1 -12 M${tal(x + v * 0.98)} ${tal(y - 7)} l1 -9 M${tal(x - v * 0.95)} ${tal(y - 5)} l0 -8`
      return [
        { d, klass: 'fill-primary-soft stroke-illustration/30' },
        { d: vagor, klass: 'fill-none stroke-illustration/30' },
        { d: vass, klass: 'fill-none stroke-illustration/45' },
      ]
    }
    case 'fjall': {
      // En kedja med tre till fyra toppar och snö på de högsta.
      const toppar = 3 + Math.floor(slump() * 2)
      const kontur: string[] = [`M${tal(x - bredd / 2)} ${tal(y)}`]
      const sno: string[] = []
      for (let i = 0; i < toppar; i++) {
        const tx = x - bredd / 2 + (bredd * (i + 0.5)) / toppar + (slump() - 0.5) * 12
        const th = hojd * (0.55 + slump() * 0.45)
        const dal = x - bredd / 2 + (bredd * (i + 1)) / toppar
        kontur.push(`L${tal(tx)} ${tal(y - th)}`)
        if (i < toppar - 1) kontur.push(`L${tal(dal)} ${tal(y - hojd * (0.2 + slump() * 0.15))}`)
        if (th > hojd * 0.75) {
          const s = th * 0.18
          sno.push(`M${tal(tx - s)} ${tal(y - th + s)} L${tal(tx)} ${tal(y - th)} L${tal(tx + s)} ${tal(y - th + s)} L${tal(tx + s * 0.4)} ${tal(y - th + s * 0.7)} L${tal(tx)} ${tal(y - th + s * 1.1)} L${tal(tx - s * 0.4)} ${tal(y - th + s * 0.7)} Z`)
        }
      }
      kontur.push(`L${tal(x + bredd / 2)} ${tal(y)} Z`)
      return [
        { d: kontur.join(' '), klass: 'fill-primary-soft/50 stroke-illustration/35' },
        { d: sno.join(' '), klass: 'fill-card stroke-illustration/25' },
      ]
    }
  }
}

/**
 * Motivet i ett mellanrum. upptaget är ledens figurer (tält, brasa, skyltar), som motivet inte får krocka med.
 * Delar som inte får plats hoppas över.
 */
export function terrangMotiv(m: Matt, typ: Terrang, fro: string, upptaget: Ruta[]): { former: Form[]; rutor: Ruta[] } {
  const slump = slumptal(`motiv-${typ}-${fro}`)
  const panel = m.hoger - m.vanster
  // Fjällen är bredare än en smal panel tillåter. Då krymper de.
  const skala = Math.min(1, (0.5 * panel) / MOTIV[typ].bredd)
  const storlek = { bredd: MOTIV[typ].bredd * skala, hojd: MOTIV[typ].hojd * Math.max(skala, 0.7) }
  const y = m.hojd * (typ === 'fjall' ? 0.56 : 0.86)
  const rutor: Ruta[] = []
  for (const andel of PLATSER[typ]) {
    if (rutor.length >= ANTAL[typ]) break
    const x = m.vanster + andel * panel
    const r = { vanster: x - storlek.bredd / 2, hoger: x + storlek.bredd / 2, topp: y - storlek.hojd, botten: y + 3 }
    if (r.vanster < m.vanster || r.hoger > m.hoger || r.topp < 4 || r.botten > m.hojd - 2) continue
    if ([...upptaget, ...rutor].some((u) => krockar(r, u, 10))) continue
    rutor.push(r)
  }
  const former = rutor.flatMap((r) => ritaDel(typ, (r.vanster + r.hoger) / 2, r.botten - 3, storlek, slump))
  return { former, rutor }
}
