/** Antal vandringsdagar från avresa till hemkomst, båda dagarna inräknade. null om något datum saknas eller är fel. */
export function dagarMellan(avresa: string | null | undefined, hemkomst: string | null | undefined): number | null {
  if (!avresa || !hemkomst) return null
  const fran = Date.parse(`${avresa}T00:00:00Z`)
  const till = Date.parse(`${hemkomst}T00:00:00Z`)
  if (Number.isNaN(fran) || Number.isNaN(till) || till < fran) return null
  return Math.round((till - fran) / 86_400_000) + 1
}

/** "2027-07-10" → "10 juli 2027" */
export function datumText(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(`${iso}T12:00:00Z`)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

/**
 * Veckodagen och datumet för en dag i turen, räknat från avresan: dag 1 är avresedagen. "fredag 4 december".
 * null när avresan saknas eller är fel.
 */
export function dagensDatum(avresa: string | null | undefined, dag: number): string | null {
  if (!avresa || dag < 1) return null
  const d = new Date(`${avresa}T12:00:00Z`)
  if (Number.isNaN(d.getTime())) return null
  d.setUTCDate(d.getUTCDate() + dag - 1)
  return d.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
}
