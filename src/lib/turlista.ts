// Logik för listan Mina turer: vilken tur som är nästa, hur turerna delas upp, datumtext och bild.
// Datum är ISO-strängar (YYYY-MM-DD), som i databasen.

export interface TurIListan {
  id: string
  namn: string
  avresa: string | null
  hemkomst: string | null
  /** null tills någon har angett antalet dagar. */
  dagar: number | null
  skapad: string
}

export type Lage = 'pagar' | 'kommande' | 'tidigare'

/** Dagens datum som YYYY-MM-DD i användarens tidszon. */
export function lokaltDatum(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dag = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${dag}`
}

function laggTillDagar(iso: string, dagar: number): string {
  const d = new Date(`${iso}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dagar)
  return d.toISOString().slice(0, 10)
}

/** Sista dagen på turen: hemkomsten, annars räknat från avresan och antal dagar (en dag om det inte är angett). null utan avresa. */
export function sistaDag(tur: Pick<TurIListan, 'avresa' | 'hemkomst' | 'dagar'>): string | null {
  if (!tur.avresa) return null
  if (tur.hemkomst && tur.hemkomst >= tur.avresa) return tur.hemkomst
  return laggTillDagar(tur.avresa, Math.max(1, tur.dagar ?? 1) - 1)
}

/** Pågår turen, ligger den framför eller bakom oss? Turer utan datum räknas som kommande. */
export function lage(tur: Pick<TurIListan, 'avresa' | 'hemkomst' | 'dagar'>, idag: string): Lage {
  const slut = sistaDag(tur)
  if (!tur.avresa || !slut) return 'kommande'
  if (slut < idag) return 'tidigare'
  if (tur.avresa <= idag) return 'pagar'
  return 'kommande'
}

/**
 * Delar upp turerna. Nästa är en pågående tur i första hand, annars den närmaste kommande med datum,
 * annars den senast skapade utan datum. Kommande: med datum i tidsordning, sedan de utan datum (nyast först).
 * Tidigare: senast avslutade först.
 */
export function delaUppTurer<T extends TurIListan>(turer: readonly T[], idag: string): { nasta: T | null; kommande: T[]; tidigare: T[] } {
  const nyastForst = (a: T, b: T) => b.skapad.localeCompare(a.skapad)
  const pagar = turer.filter((t) => lage(t, idag) === 'pagar').sort((a, b) => a.avresa!.localeCompare(b.avresa!))
  const medDatum = turer.filter((t) => lage(t, idag) === 'kommande' && t.avresa).sort((a, b) => a.avresa!.localeCompare(b.avresa!))
  const utanDatum = turer.filter((t) => !t.avresa).sort(nyastForst)
  const tidigare = turer.filter((t) => lage(t, idag) === 'tidigare').sort((a, b) => sistaDag(b)!.localeCompare(sistaDag(a)!))

  const ordning = [...pagar, ...medDatum, ...utanDatum]
  const nasta = ordning[0] ?? null
  return { nasta, kommande: ordning.slice(1), tidigare }
}

const MANADER = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december']

function delar(iso: string) {
  const [ar, manad, dag] = iso.split('-').map(Number)
  return { ar, manad: MANADER[manad - 1], dag }
}

/** "12–16 augusti 2027", "30 juli till 3 augusti 2027", "Från 12 augusti 2027" eller "Datum ej bestämt". */
export function datumIntervall(avresa: string | null, hemkomst: string | null): string {
  if (!avresa) return 'Datum ej bestämt'
  const a = delar(avresa)
  if (!hemkomst || hemkomst < avresa) return `Från ${a.dag} ${a.manad} ${a.ar}`
  const h = delar(hemkomst)
  if (hemkomst === avresa) return `${a.dag} ${a.manad} ${a.ar}`
  if (a.ar === h.ar && a.manad === h.manad) return `${a.dag}–${h.dag} ${h.manad} ${h.ar}`
  if (a.ar === h.ar) return `${a.dag} ${a.manad} till ${h.dag} ${h.manad} ${h.ar}`
  return `${a.dag} ${a.manad} ${a.ar} till ${h.dag} ${h.manad} ${h.ar}`
}

/** "1 dag", "5 dagar" */
export function dagarText(dagar: number): string {
  return dagar === 1 ? '1 dag' : `${dagar} dagar`
}

/** "3 deltagare", "3 deltagare och 1 hund", "1 deltagare och 2 hundar". */
export function deltagareText(deltagare: readonly { typ: 'person' | 'hund' }[]): string {
  const personer = deltagare.filter((d) => d.typ === 'person').length
  const hundar = deltagare.length - personer
  const text = `${personer} deltagare`
  if (hundar === 0) return text
  return `${text} och ${hundar} ${hundar === 1 ? 'hund' : 'hundar'}`
}

/** Initialer för en rund namnbricka: "Oscar Medelin" → "OM", "anna" → "A". */
export function initialer(namn: string): string {
  const ord = namn.trim().split(/\s+/).filter(Boolean)
  if (ord.length === 0) return '?'
  const forsta = ord[0][0]
  const sista = ord.length > 1 ? ord[ord.length - 1][0] : ''
  return (forsta + sista).toUpperCase()
}

/** Bilderna i public/hero som turerna kan få. Gruppbilden är inte med, den ska bort från sajten. */
export const TURBILDER = ['2-sommarfjall', '3-utsikt', '4-kust', '5-norrsken'] as const

/** En bild per tur, vald utifrån id så att samma tur alltid får samma bild. */
export function bildForTur(id: string): (typeof TURBILDER)[number] {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return TURBILDER[(h >>> 0) % TURBILDER.length]
}

/**
 * Raden med datum under turens namn: "12–16 augusti 2027 · 5 dagar".
 * Utan avresa står "Datum ej bestämt", med längden efter om någon har angett den: "Datum ej bestämt · 3 dagar".
 */
export function datumrad(tur: Pick<TurIListan, 'avresa' | 'hemkomst' | 'dagar'>): string {
  const datum = datumIntervall(tur.avresa, tur.hemkomst)
  return tur.dagar === null ? datum : `${datum} · ${dagarText(tur.dagar)}`
}

/** Texten som visas när en uppgift om turen inte är ifylld. */
export const INTE_ANGETT = 'Inte angett'

/** Antalet vandringsdagar i turens uppgifter: "5", eller "Inte angett" när ingen har angett det. */
export function dagarVarde(dagar: number | null): string {
  return dagar === null ? INTE_ANGETT : String(dagar)
}

/** Värdet i ett sifferfält: ett heltal, eller null när fältet är tomt eller inte är ett tal. */
export function antalFranFalt(text: string): number | null {
  if (text.trim() === '') return null
  const tal = Number(text)
  return Number.isFinite(tal) ? Math.round(tal) : null
}

/**
 * Avsnittet under nästa vandring. Visas bara när det finns fler turer än den som redan syns i det stora kortet.
 * Fliken Tidigare är förvald när det inte finns några kommande turer.
 */
export function flerTurer(kommande: number, tidigare: number): { visa: boolean; forvald: 'kommande' | 'tidigare' } {
  return { visa: kommande + tidigare > 0, forvald: kommande === 0 && tidigare > 0 ? 'tidigare' : 'kommande' }
}

/** Antal dagar från ett datum till ett annat. Negativt om det andra ligger före det första. */
function dagarEmellan(fran: string, till: string): number {
  return Math.round((Date.parse(`${till}T12:00:00Z`) - Date.parse(`${fran}T12:00:00Z`)) / 86_400_000)
}

/**
 * Hur långt det är kvar till turen, eller hur långt den har kommit:
 * "I dag", "I morgon", "Om 15 dagar" eller "Pågår nu, dag 2 av 3".
 * null när turen saknar datum eller redan är över. Är längden okänd under en pågående tur står bara "Pågår nu".
 */
export function nedrakning(tur: Pick<TurIListan, 'avresa' | 'hemkomst' | 'dagar'>, idag: string): string | null {
  const slut = sistaDag(tur)
  if (!tur.avresa || !slut || slut < idag) return null
  const kvar = dagarEmellan(idag, tur.avresa)
  if (kvar === 0) return 'I dag'
  if (kvar === 1) return 'I morgon'
  if (kvar > 1) return `Om ${kvar} dagar`
  // Turen pågår. Längden är känd när det finns en hemkomst eller ett antal dagar.
  const kandLangd = (tur.hemkomst !== null && tur.hemkomst >= tur.avresa) || tur.dagar !== null
  if (!kandLangd) return 'Pågår nu'
  return `Pågår nu, dag ${1 - kvar} av ${dagarEmellan(tur.avresa, slut) + 1}`
}

/**
 * Kort text för sidomenyns lista Dina turer: "I dag", "I morgon", "Om 9 dagar", "Pågår" eller "Inget datum".
 * null för turer som är över.
 */
export function kortNedrakning(tur: Pick<TurIListan, 'avresa' | 'hemkomst' | 'dagar'>, idag: string): string | null {
  if (!tur.avresa) return 'Inget datum'
  const text = nedrakning(tur, idag)
  if (!text) return null
  return text.startsWith('Pågår') ? 'Pågår' : text
}

/**
 * Etiketten i turens huvud: "Avfärd om 12 dagar", "Avfärd i morgon", "Avfärd i dag" eller "Pågår nu, dag 2 av 3".
 * null när turen saknar datum eller redan är över.
 */
export function avfardEtikett(tur: Pick<TurIListan, 'avresa' | 'hemkomst' | 'dagar'>, idag: string): string | null {
  const text = nedrakning(tur, idag)
  if (!text) return null
  if (text.startsWith('Pågår')) return text
  return `Avfärd ${text[0].toLowerCase()}${text.slice(1)}`
}

/**
 * Deltagarnas namn i en mening: "Oscar", "Oscar och Anna" eller "Oscar, Anna och Rex".
 * Högst fyra namn, sedan "och 3 till".
 */
export function deltagarNamn(deltagare: readonly { namn: string }[], max = 4): string {
  const namn = deltagare.map((d) => d.namn.trim()).filter(Boolean)
  if (namn.length === 0) return ''
  if (namn.length > max) return `${namn.slice(0, max).join(', ')} och ${namn.length - max} till`
  if (namn.length === 1) return namn[0]
  return `${namn.slice(0, -1).join(', ')} och ${namn[namn.length - 1]}`
}

/**
 * Etiketten på kortet för nästa vandring: "Nästa vandring · om 15 dagar" eller "Pågår nu · dag 2 av 3".
 * Utan datum står bara "Nästa vandring".
 */
export function nastaEtikett(tur: Pick<TurIListan, 'avresa' | 'hemkomst' | 'dagar'>, idag: string): string {
  const text = nedrakning(tur, idag)
  if (!text) return 'Nästa vandring'
  if (text.startsWith('Pågår nu')) return text.replace(', ', ' · ')
  return `Nästa vandring · ${text[0].toLowerCase()}${text.slice(1)}`
}

/**
 * Hälsningen under rubriken Mina turer. När kortet för nästa vandring visas räcker "Hej Oscar!",
 * eftersom kortets etikett redan säger vad det är. Utan namn visas då ingen hälsning alls.
 * I övriga lägen säger hälsningen vad sidan är till för.
 */
export function halsning(namn: string, lage: 'laddar' | 'inga-turer' | 'nasta-visas' | 'bara-tidigare'): string | null {
  const tilltal = namn.trim()
  if (lage === 'nasta-visas') return tilltal ? `Hej ${tilltal}!` : null
  const hej = tilltal ? `Hej ${tilltal}.` : 'Hej.'
  if (lage === 'inga-turer') return `${hej} Här samlar du vandringarna du planerar.`
  if (lage === 'bara-tidigare') return `${hej} Dags att planera nästa vandring?`
  return hej
}
