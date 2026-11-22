// Kontrast enligt WCAG 2.1, för att kontrollera färgvariablerna i src/index.css.

/** Relativ luminans för en färg som #rrggbb. */
export function luminans(hex: string): number {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) throw new Error(`Ogiltig färg: ${hex}`)
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(m[1].slice(i, i + 2), 16) / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Kontrastförhållandet mellan två färger, från 1 till 21. Ordningen spelar ingen roll. */
export function kontrast(a: string, b: string): number {
  const [ljus, mork] = [luminans(a), luminans(b)].sort((x, y) => y - x)
  return (ljus + 0.05) / (mork + 0.05)
}

/** Färgvariablerna (--color-*) i ett CSS-block, som namn utan prefix och värde. */
export function fargvariabler(css: string): Record<string, string> {
  const ut: Record<string, string> = {}
  for (const [, namn, varde] of css.matchAll(/--color-([a-z-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) ut[namn] = varde.toLowerCase()
  return ut
}
