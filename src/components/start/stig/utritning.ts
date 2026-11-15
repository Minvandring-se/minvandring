/** Tider för utritningen av en bit av leden. */

/** Paus innan en bit börjar ritas, i ms. */
export const VANTAN = 200
/** Hur länge utritningen tar, i ms. Ritas med ease-in-out. */
export const RITTID = 1600

/** ease-in-out (cubic-bezier(.42, 0, .58, 1)): hur stor del av leden som är ritad vid andel t av tiden. */
export function easeInOut(t: number): number {
  if (t <= 0) return 0
  if (t >= 1) return 1
  const x = (s: number) => 3 * (1 - s) ** 2 * s * 0.42 + 3 * (1 - s) * s ** 2 * 0.58 + s ** 3
  const y = (s: number) => 3 * (1 - s) * s ** 2 + s ** 3
  let lag = 0
  let hog = 1
  for (let i = 0; i < 40; i++) {
    const mitt = (lag + hog) / 2
    if (x(mitt) < t) lag = mitt
    else hog = mitt
  }
  return y((lag + hog) / 2)
}

/** När leden når en viss andel av sträckan, som andel av ritiden. Omvändningen av easeInOut. */
export function tidVidAndel(andel: number): number {
  if (andel <= 0) return 0
  if (andel >= 1) return 1
  let lag = 0
  let hog = 1
  for (let i = 0; i < 40; i++) {
    const mitt = (lag + hog) / 2
    if (easeInOut(mitt) < andel) lag = mitt
    else hog = mitt
  }
  return (lag + hog) / 2
}
