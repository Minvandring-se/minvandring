// Skapad av design/landskap/dela.cjs. Ändra inte för hand.

export interface Bild {
  src: string
  bredd: number
  hojd: number
}

/** De breda landskapen mellan korten, delade i en vänster- och en högerdel. */
export const BAND = {
  "skog": {
    "vanster": {
      "src": "/landskap/skog-vanster.webp",
      "bredd": 267,
      "hojd": 38
    },
    "hoger": {
      "src": "/landskap/skog-hoger.webp",
      "bredd": 338,
      "hojd": 30
    }
  },
  "sjo": {
    "vanster": {
      "src": "/landskap/sjo-vanster.webp",
      "bredd": 333,
      "hojd": 42
    },
    "hoger": {
      "src": "/landskap/sjo-hoger.webp",
      "bredd": 347,
      "hojd": 35
    }
  },
  "hostbjorkar": {
    "vanster": {
      "src": "/landskap/hostbjorkar-vanster.webp",
      "bredd": 359,
      "hojd": 46
    },
    "hoger": {
      "src": "/landskap/hostbjorkar-hoger.webp",
      "bredd": 380,
      "hojd": 46
    }
  },
  "fjall": {
    "vanster": {
      "src": "/landskap/fjall-vanster.webp",
      "bredd": 349,
      "hojd": 26
    },
    "hoger": {
      "src": "/landskap/fjall-hoger.webp",
      "bredd": 412,
      "hojd": 31
    }
  }
} as const satisfies Record<string, { vanster: Bild; hoger: Bild }>

/** Motiven i sidoremsorna, uppifrån och ner: skog, sjö, höstbjörkar och fjäll. */
export const SIDOR = {
  "vanster": [
    {
      "src": "/landskap/sida-vanster-1.webp",
      "bredd": 163,
      "hojd": 352
    },
    {
      "src": "/landskap/sida-vanster-2.webp",
      "bredd": 182,
      "hojd": 333
    },
    {
      "src": "/landskap/sida-vanster-3.webp",
      "bredd": 188,
      "hojd": 451
    },
    {
      "src": "/landskap/sida-vanster-4.webp",
      "bredd": 211,
      "hojd": 194
    }
  ],
  "hoger": [
    {
      "src": "/landskap/sida-hoger-1.webp",
      "bredd": 121,
      "hojd": 299
    },
    {
      "src": "/landskap/sida-hoger-2.webp",
      "bredd": 137,
      "hojd": 192
    },
    {
      "src": "/landskap/sida-hoger-3.webp",
      "bredd": 148,
      "hojd": 349
    },
    {
      "src": "/landskap/sida-hoger-4.webp",
      "bredd": 203,
      "hojd": 176
    }
  ]
} as const satisfies Record<'vanster' | 'hoger', readonly Bild[]>
