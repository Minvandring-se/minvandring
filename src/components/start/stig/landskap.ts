/**
 * Landskapet som leden går igenom i mellanrummet mellan två paneler: fjäll, skog eller sjö.
 * Det ligger inom panelernas bredd, under leden och figurerna. Formerna räknas fram från bitens id,
 * så att landskapet ser likadant ut vid varje besök, och i andelar av mellanrummet, så att det följer med
 * när fönstret ändrar storlek.
 */
import { slumptal, type Matt, type Punkt } from '@/components/start/stig/geometri'

export type Landskap = 'fjall' | 'skog' | 'sjo'

/** En form i landskapet: SVG-sökväg och Tailwind-klasser för fyllning och linje. */
export interface Form {
  d: string
  klass: string
}

const tal = (n: number) => Math.round(n * 10) / 10

/** Sluten form från en kantlinje ner till mellanrummets botten. */
function nerTillMarken(punkter: Punkt[], botten: number) {
  const forsta = punkter[0]
  const sista = punkter[punkter.length - 1]
  return `M${tal(forsta.x)} ${tal(botten)} ` + punkter.map((p) => `L${tal(p.x)} ${tal(p.y)}`).join(' ') + ` L${tal(sista.x)} ${tal(botten)} Z`
}

/**
 * En bergskedja: toppar och dalar om vartannat över hela bredden.
 * topp och dal är y-intervall som andelar av höjden. Returnerar kantlinjen och topparna.
 */
function kedja(m: Matt, slump: () => number, antal: number, topp: [number, number], dal: [number, number]) {
  const { vanster, hoger, hojd } = m
  const bredd = hoger - vanster
  const steg = bredd / (antal * 2)
  const punkter: Punkt[] = [{ x: vanster, y: hojd * (dal[0] + slump() * (dal[1] - dal[0])) }]
  const toppar: Punkt[] = []
  for (let i = 0; i < antal; i++) {
    const x = vanster + steg * (2 * i + 1) + (slump() - 0.5) * steg * 0.8
    const t = { x, y: hojd * (topp[0] + slump() * (topp[1] - topp[0])) }
    toppar.push(t)
    punkter.push(t)
    punkter.push({ x: vanster + steg * (2 * i + 2) + (slump() - 0.5) * steg * 0.5, y: hojd * (dal[0] + slump() * (dal[1] - dal[0])) })
  }
  punkter[punkter.length - 1].x = hoger
  return { punkter, toppar }
}

/** Snö på en topp: en liten flik som följer bergssidorna ner en bit. */
function sno(t: Punkt, hojd: number): string {
  const h = hojd * 0.07
  return `M${tal(t.x - h * 1.1)} ${tal(t.y + h)} L${tal(t.x)} ${tal(t.y)} L${tal(t.x + h * 1.1)} ${tal(t.y + h)} L${tal(t.x + h * 0.4)} ${tal(t.y + h * 0.7)} L${tal(t.x)} ${tal(t.y + h * 1.1)} L${tal(t.x - h * 0.4)} ${tal(t.y + h * 0.7)} Z`
}

/** En gran med krona i två våningar. x är mitten och y marken. */
function gran(x: number, y: number, h: number): string {
  const t = y - h
  return `M${tal(x)} ${tal(t)} L${tal(x - 0.22 * h)} ${tal(t + 0.45 * h)} H${tal(x - 0.1 * h)} L${tal(x - 0.32 * h)} ${tal(y)} H${tal(x + 0.32 * h)} L${tal(x + 0.1 * h)} ${tal(t + 0.45 * h)} H${tal(x + 0.22 * h)} Z`
}

/** En rad granar över hela bredden. bas och storlek är andelar av höjden. */
function granrad(m: Matt, slump: () => number, bas: [number, number], storlek: [number, number], tathet: number): string {
  const { vanster, hoger, hojd } = m
  const delar: string[] = []
  let x = vanster + slump() * tathet
  while (x < hoger) {
    const h = hojd * (storlek[0] + slump() * (storlek[1] - storlek[0]))
    delar.push(gran(x, hojd * (bas[0] + slump() * (bas[1] - bas[0])), h))
    x += tathet * (0.6 + slump() * 0.8)
  }
  return delar.join(' ')
}

/** Formerna i landskapet, bakifrån och fram. Tomt om mellanrummet saknar mått. */
export function ritaLandskap(m: Matt, typ: Landskap, fro: string): Form[] {
  if (!Object.values(m).every(Number.isFinite) || m.hoger - m.vanster <= 0 || m.hojd <= 0) return []
  const slump = slumptal(`landskap-${typ}-${fro}`)
  const { hojd } = m
  const bredd = m.hoger - m.vanster
  const antal = Math.max(3, Math.round(bredd / 160))

  if (typ === 'fjall') {
    const bak = kedja(m, slump, antal, [0.1, 0.32], [0.42, 0.55])
    const fram = kedja(m, slump, Math.max(2, antal - 1), [0.42, 0.55], [0.62, 0.72])
    return [
      { d: nerTillMarken(bak.punkter, hojd), klass: 'fill-primary-soft/70 stroke-foreground/15' },
      { d: bak.toppar.filter((t) => t.y < hojd * 0.26).map((t) => sno(t, hojd)).join(' '), klass: 'fill-card stroke-foreground/10' },
      { d: nerTillMarken(fram.punkter, hojd), klass: 'fill-sand/45 stroke-foreground/10' },
    ]
  }

  if (typ === 'skog') {
    const as = kedja(m, slump, antal, [0.28, 0.4], [0.45, 0.52])
    return [
      { d: nerTillMarken(as.punkter, hojd), klass: 'fill-primary-soft/50 stroke-foreground/10' },
      { d: granrad(m, slump, [0.55, 0.6], [0.24, 0.42], 30), klass: 'fill-illustration/20 stroke-foreground/10' },
      { d: granrad(m, slump, [0.97, 1], [0.16, 0.26], 90), klass: 'fill-illustration/25 stroke-foreground/10' },
    ]
  }

  // Sjö: låga åsar långt bort, vattnet nedanför leden och vass vid stranden.
  const as = kedja(m, slump, antal, [0.3, 0.42], [0.46, 0.52])
  const strand: Punkt[] = []
  for (let i = 0; i <= 12; i++) strand.push({ x: m.vanster + (bredd * i) / 12, y: hojd * (0.7 + slump() * 0.05) })
  const vagor: string[] = []
  for (let i = 0; i < Math.round(bredd / 90); i++) {
    const x = m.vanster + bredd * (0.08 + slump() * 0.84)
    const y = hojd * (0.8 + slump() * 0.12)
    vagor.push(`M${tal(x)} ${tal(y)} q4 -2.5 8 0 q4 2.5 8 0`)
  }
  const vass: string[] = []
  for (const kant of [0.12, 0.88]) {
    const x0 = m.vanster + bredd * kant
    for (let i = 0; i < 4; i++) {
      const x = x0 + (i - 1.5) * 4
      const y = hojd * 0.74
      vass.push(`M${tal(x)} ${tal(y)} L${tal(x + (slump() - 0.5) * 3)} ${tal(y - hojd * (0.08 + slump() * 0.06))}`)
    }
  }
  return [
    { d: nerTillMarken(as.punkter, hojd), klass: 'fill-primary-soft/50 stroke-foreground/10' },
    { d: nerTillMarken(strand, hojd), klass: 'fill-primary-soft/80 stroke-foreground/15' },
    { d: vagor.join(' '), klass: 'fill-none stroke-foreground/20' },
    { d: vass.join(' '), klass: 'fill-none stroke-foreground/30' },
  ]
}
