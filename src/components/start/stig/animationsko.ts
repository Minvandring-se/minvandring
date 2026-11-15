/** Fortsättningen av leden i en sektions övre luft. Ritas fram av scenen för biten ovanför. */
export interface Topp {
  langd: number
  rita: (ramar: Keyframe[], varaktighet: number, signal: AbortSignal) => Promise<void>
  stilla: () => void
}

interface Uppgift {
  controller: AbortController
  kor: (signal: AbortSignal) => Promise<void>
}

/** En kö per sidbesök: högst en scen (utritad bit och eventuellt tält eller brasa) spelas åt gången. */
export function skapaAnimationsko(onError: (fel: unknown) => void = console.error) {
  const vantande: Uppgift[] = []
  const spelade = new Set<string>()
  const toppar = new Map<string, Topp>()
  let aktiv: Uppgift | null = null

  function nasta() {
    if (aktiv) return
    const uppgift = vantande.shift()
    if (!uppgift) return
    aktiv = uppgift
    void Promise.resolve()
      .then(() => {
        if (!uppgift.controller.signal.aborted) return uppgift.kor(uppgift.controller.signal)
      })
      .catch((fel: unknown) => {
        if (!uppgift.controller.signal.aborted) onError(fel)
      })
      .finally(() => {
        aktiv = null
        nasta()
      })
  }

  return {
    harSpelat: (id: string) => spelade.has(id),
    /** Registrerar en sektions övre fortsättning. Returnerar en funktion som tar bort den igen. */
    registreraTopp(id: string, topp: Topp) {
      toppar.set(id, topp)
      return () => {
        if (toppar.get(id) === topp) toppar.delete(id)
      }
    },
    topp: (id: string | undefined) => (id ? toppar.get(id) : undefined),
    markeraSpelad: (id: string) => {
      spelade.add(id)
    },
    /** Lägger en scen i kön. Returnerar en funktion som avbryter den, köad eller pågående. */
    laggTill(kor: Uppgift['kor']) {
      const uppgift: Uppgift = { controller: new AbortController(), kor }
      vantande.push(uppgift)
      nasta()
      return () => {
        uppgift.controller.abort()
        const i = vantande.indexOf(uppgift)
        if (i !== -1) vantande.splice(i, 1)
      }
    },
    /** Avbryter allt. Kön går att använda igen efteråt, eftersom React StrictMode kör setup, cleanup och setup. */
    avbrytAlla() {
      for (const uppgift of vantande.splice(0)) uppgift.controller.abort()
      aktiv?.controller.abort()
    },
  }
}

export type Animationsko = ReturnType<typeof skapaAnimationsko>

/** Avbrytbar animation med Web Animations, utan bibliotek. */
export async function animera(element: Element, ramar: Keyframe[], val: KeyframeAnimationOptions, signal: AbortSignal) {
  if (signal.aborted) throw new DOMException('Avbruten', 'AbortError')
  const animation = element.animate(ramar, { ...val, fill: 'forwards' })
  const avbryt = () => animation.cancel()
  signal.addEventListener('abort', avbryt, { once: true })
  try {
    await animation.finished
  } finally {
    signal.removeEventListener('abort', avbryt)
    // Sluttillståndet sätts av anroparen. Avslutade animationer tas bort
    // via samma signal när hela scenen är klar eller komponenten försvinner.
    if (signal.aborted) animation.cancel()
    else signal.addEventListener('abort', avbryt, { once: true })
  }
}

/** Väntar ms millisekunder. Avbryts direkt med AbortError om signalen avbryts. */
export function vanta(ms: number, signal: AbortSignal) {
  return new Promise<void>((klar, fel) => {
    const avbruten = () => new DOMException('Avbruten', 'AbortError')
    if (signal.aborted) return fel(avbruten())
    const tid = setTimeout(() => {
      signal.removeEventListener('abort', avbryt)
      klar()
    }, ms)
    const avbryt = () => {
      clearTimeout(tid)
      fel(avbruten())
    }
    signal.addEventListener('abort', avbryt, { once: true })
  })
}
