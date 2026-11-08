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
