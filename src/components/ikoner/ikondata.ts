// Skapad med "npm run ikoner" från src/components/ikoner/svg/. Ändra inte filen för hand.

export type Ikonelement = readonly [tagg: "mask" | "rect" | "path" | "circle" | "ellipse" | "g", attribut: Readonly<Record<string, string>>, barn: readonly Ikonelement[]]

/** Platshållaren för maskens id. Komponenten Ikon byter den mot ett id som är unikt på sidan. */
export const MASK = 'MASK'

export const IKONER = {
  "hygien": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M13.6 6.6a3 3 0 1 0 6 0a3 3 0 1 0 -6 0zM8.7 8.6a1.9 1.9 0 1 0 3.8 0a1.9 1.9 0 1 0 -3.8 0zM19.1 11.6a1.3 1.3 0 1 0 2.6 0a1.3 1.3 0 1 0 -2.6 0z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M4 12.6h12.6a2.2 2.2 0 0 1 2.2 2.2v3.8a2.2 2.2 0 0 1-2.2 2.2H4a2.2 2.2 0 0 1-2.2-2.2v-3.8A2.2 2.2 0 0 1 4 12.6z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M4.8 15.4h4.4",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "1.3",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M16.5 5.6a0.9 0.9 0 1 0 1.8 0a0.9 0.9 0 1 0 -1.8 0z",
            "fill": "#000"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "sovsack": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M9 3h6a3.5 3.5 0 0 1 3.5 3.5c0 5-.8 9.4-1.6 13A2 2 0 0 1 15 21H9a2 2 0 0 1-1.9-1.5c-.8-3.6-1.6-8-1.6-13A3.5 3.5 0 0 1 9 3z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M9.3 6.8a2.7 2.1 0 1 0 5.4 0a2.7 2.1 0 1 0 -5.4 0z",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M7.3 11.4c3 .8 6.4.8 9.4 0M7.9 15.4c2.8.7 5.4.7 8.2 0",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "1.3",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "dagbok": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M5 3h12.5A1.5 1.5 0 0 1 19 4.5v15a1.5 1.5 0 0 1-1.5 1.5H5z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M8.2 3.4v17.2M11 11h5M11 14.5h4",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "1.3",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M13.6 3v5l1.5-1.2 1.5 1.2V3z",
            "fill": "#000"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "hem": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M3 11.2L12 3.8l9 7.4V20.5H3z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M6 11.6L12 6.7l6 4.9",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "1.3",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M10 20.5v-5.4h4v5.4z",
            "fill": "#000"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "matplanering": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M8 3.2c-.8.9-.8 1.9 0 2.8M12 3.2c-.8.9-.8 1.9 0 2.8",
            "fill": "none",
            "stroke": "#fff",
            "strokeWidth": "1.9",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M3.5 8.5h13v4a6.5 6.5 0 0 1-13 0z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M16 9.8h4.3a1.2 1.2 0 0 1 0 2.4H16z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M4.4 10.8h11.2M6.6 13.2c.5 1.8 1.9 3 3.7 3.4",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "1.3",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "mina-turer": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M9 5v13M15 7v13",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "1.3",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M16.5 10.9a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0 -2.8 0z",
            "fill": "#000"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "mitt-forrad": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M10.2 4.2a1.8 1.8 0 0 1 3.6 0",
            "fill": "none",
            "stroke": "#fff",
            "strokeWidth": "1.9",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M6 10a6 6 0 0 1 12 0v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M8.6 11.6h6.8M8.6 14.6h6.8v4H8.6z",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "1.3",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "packlistor": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M5 4.5h14v16.5H5z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M9 2.3h6v3.7H9z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M9 6.2h6M7.6 10.4l1.1 1.1 2-2.1M7.6 15.4l1.1 1.1 2-2.1M12.8 10.5h3.8M12.8 15.5h3.8",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "1.3",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "skafferi": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M7 2.8h10v3.4H7z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M6 7.2h12v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M8.8 11.4h6.4v5.2H8.8z",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "1.3",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "statistik": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M3.8 13.5h4.4V20H3.8zM9.8 9.5h4.4V20H9.8zM15.8 5.5h4.4V20h-4.4z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M6 15.8v2.4M12 11.8v6.4M18 7.8v10.4",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "1.3",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M2.5 21h19",
            "fill": "none",
            "stroke": "#fff",
            "strokeWidth": "1.9",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "utrustningskatalog": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M2.5 5.5c3-1.3 6.2-1 9 .7v14.3c-2.8-1.7-6-2-9-.7z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M21.5 5.5c-3-1.3-6.2-1-9 .7v14.3c2.8-1.7 6-2 9-.7z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M5 9.4h3.8M5 12.4h3.8M5 15.4h2.8M15.2 9.4H19M15.2 12.4H19M15.2 15.4h2.8",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "1.3",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "vandringskompisar": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M13.9 7.4a2.6 2.6 0 1 0 5.2 0a2.6 2.6 0 1 0 -5.2 0z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M13 21v-2.6a4 4 0 0 1 8 0V21z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M5.3 8.4a3.2 3.2 0 1 0 6.4 0a3.2 3.2 0 1 0 -6.4 0zM2.8 21v-2.4a5.7 5.7 0 0 1 11.4 0V21z",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "2.6",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M5.3 8.4a3.2 3.2 0 1 0 6.4 0a3.2 3.2 0 1 0 -6.4 0z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M2.8 21v-2.4a5.7 5.7 0 0 1 11.4 0V21z",
            "fill": "#fff"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "dag": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M4 5.5h16v15H4z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M4.4 10h15.2",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "1.3",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M8 3v4.4M16 3v4.4",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "2.6",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M8 3v4.4M16 3v4.4",
            "fill": "none",
            "stroke": "#fff",
            "strokeWidth": "1.9",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M9.9 15.2a2.1 2.1 0 1 0 4.2 0a2.1 2.1 0 1 0 -4.2 0z",
            "fill": "#000"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "distans": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M6 2.8a3 3 0 0 1 3 3C9 8.8 6 11.4 6 11.4S3 8.8 3 5.8a3 3 0 0 1 3-3zM18 2.8a3 3 0 0 1 3 3c0 3-3 5.6-3 5.6s-3-2.6-3-5.6a3 3 0 0 1 3-3z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M4.9 5.9a1.1 1.1 0 1 0 2.2 0a1.1 1.1 0 1 0 -2.2 0zM16.9 5.9a1.1 1.1 0 1 0 2.2 0a1.1 1.1 0 1 0 -2.2 0z",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M4 16.5h16M4 14.3v4.4M20 14.3v4.4",
            "fill": "none",
            "stroke": "#fff",
            "strokeWidth": "1.9",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "etapp": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M4.5 19c2.5-5 5.5-1 8.2-5.5S15.5 10.5 17.5 10.4",
            "fill": "none",
            "stroke": "#fff",
            "strokeWidth": "1.9",
            "strokeLinecap": "round",
            "strokeDasharray": "2.2 2.4"
          },
          []
        ],
        [
          "path",
          {
            "d": "M2 19a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M3.6 19a0.9 0.9 0 1 0 1.8 0a0.9 0.9 0 1 0 -1.8 0z",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M17.5 10.4V1.4",
            "fill": "none",
            "stroke": "#fff",
            "strokeWidth": "1.9",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M17.5 1h4.8l-1.5 2.1 1.5 2.1h-4.8z",
            "fill": "#fff"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "hojdmeter": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M2.5 20.5l6-10.5 4 5.5 3-3.5 6 8.5z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M17.6 2.6l3.1 3.7h-1.9V10h-2.4V6.3h-1.9z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M5.8 17.6l2.2-1.6M14.4 17.9l1.8-1.2",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "1.3",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "kompass": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M12 5l2.2 7H9.8z",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M9.8 12.2L12 19l2.2-6.8",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "1.3",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "ledkryss": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M11 10.6h2v9.9h-2z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M8.6 20.6h6.8",
            "fill": "none",
            "stroke": "#fff",
            "strokeWidth": "1.9",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M6.1 4.4l1.5-1.5 10.3 8.4-1.5 1.5zM16.4 2.9l1.5 1.5-10.3 8.4-1.5-1.5z",
            "fill": "#fff"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "overnattning": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M18.6 3.2a3.6 3.6 0 1 0 2.8 6 2.9 2.9 0 0 1-2.8-6z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M2.8 14.6L10.5 8.2l7.7 6.4h-1.7v5.9H4.5v-5.9z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M6.2 13.6l4.3-3.6 4.3 3.6",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "1.3",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M8.8 20.5v-4h3.4v4z",
            "fill": "#000"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "ros": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M2.3 18.5a3.3 2.2 0 1 0 6.6 0a3.3 2.2 0 1 0 -6.6 0z",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "2.6",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M2.3 18.5a3.3 2.2 0 1 0 6.6 0a3.3 2.2 0 1 0 -6.6 0z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M8.6 18.6a3.4 2.2 0 1 0 6.8 0a3.4 2.2 0 1 0 -6.8 0z",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "2.6",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M8.6 18.6a3.4 2.2 0 1 0 6.8 0a3.4 2.2 0 1 0 -6.8 0z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M15.1 18.5a3.3 2.2 0 1 0 6.6 0a3.3 2.2 0 1 0 -6.6 0z",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "2.6",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M15.1 18.5a3.3 2.2 0 1 0 6.6 0a3.3 2.2 0 1 0 -6.6 0z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M5.6 14.6a3.2 2.1 0 1 0 6.4 0a3.2 2.1 0 1 0 -6.4 0z",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "2.6",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M5.6 14.6a3.2 2.1 0 1 0 6.4 0a3.2 2.1 0 1 0 -6.4 0z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M12 14.6a3.2 2.1 0 1 0 6.4 0a3.2 2.1 0 1 0 -6.4 0z",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "2.6",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M12 14.6a3.2 2.1 0 1 0 6.4 0a3.2 2.1 0 1 0 -6.4 0z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M9.4 10.7a2.6 1.9 0 1 0 5.2 0a2.6 1.9 0 1 0 -5.2 0z",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "2.6",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M9.4 10.7a2.6 1.9 0 1 0 5.2 0a2.6 1.9 0 1 0 -5.2 0z",
            "fill": "#fff"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "vader": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M9 2.2v1.4M3.2 8.5H1.8M4.6 4.1l1 1M13.4 4.1l-1 1",
            "fill": "none",
            "stroke": "#fff",
            "strokeWidth": "1.9",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M4.8 8.5a4.2 4.2 0 1 0 8.4 0a4.2 4.2 0 1 0 -8.4 0z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M7 19.5a4 4 0 0 1 .4-8 5.2 5.2 0 0 1 9.9 1.6 3.3 3.3 0 0 1-.3 6.4z",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "2.6",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M7 19.5a4 4 0 0 1 .4-8 5.2 5.2 0 0 1 9.9 1.6 3.3 3.3 0 0 1-.3 6.4z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M9.6 16.6h5",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "1.3",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "vindskydd": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M2.8 20.6h15.4",
            "fill": "none",
            "stroke": "#fff",
            "strokeWidth": "1.9",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M5 20.5V7.5l13 5.5v7.5z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M3.4 7.9l16.2 6.7",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "2.6",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M3.4 7.9l16.2 6.7",
            "fill": "none",
            "stroke": "#fff",
            "strokeWidth": "1.9",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M8.4 12v8.2M12.4 13.7v6.5",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "1.3",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M20.6 20c-1.1-1.1-1.1-2.5 0-3.9 1.1 1.4 1.1 2.8 0 3.9z",
            "fill": "#fff"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "allergi": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M12 21.6V7",
            "fill": "none",
            "stroke": "#fff",
            "strokeWidth": "1.9",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M12 10c-2.3-.3-3.6-1.8-3.6-3.9 2.3.3 3.6 1.8 3.6 3.9zM12 10c2.3-.3 3.6-1.8 3.6-3.9-2.3.3-3.6 1.8-3.6 3.9zM12 14c-2.3-.3-3.6-1.8-3.6-3.9 2.3.3 3.6 1.8 3.6 3.9zM12 14c2.3-.3 3.6-1.8 3.6-3.9-2.3.3-3.6 1.8-3.6 3.9zM12 18c-2.3-.3-3.6-1.8-3.6-3.9 2.3.3 3.6 1.8 3.6 3.9zM12 18c2.3-.3 3.6-1.8 3.6-3.9-2.3.3-3.6 1.8-3.6 3.9zM12 6c-1.1-1-1.1-2.5 0-3.6 1.1 1.1 1.1 2.6 0 3.6z",
            "fill": "#fff"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "gaspatron": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M10.4 7.8V4h3.2v3.8z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M5 20.5V12c0-2.5 3.1-4.6 7-4.6s7 2.1 7 4.6v8.5z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M5.4 14.4h13.2M5.4 17.6h13.2",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "1.3",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M3.4 20.8h17.2",
            "fill": "none",
            "stroke": "#fff",
            "strokeWidth": "1.9",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "grot": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M14.2 12.4l5.4-8.6M8 9c-.6-.8-.6-1.6 0-2.4M11 9c-.6-.8-.6-1.6 0-2.4",
            "fill": "none",
            "stroke": "#fff",
            "strokeWidth": "1.9",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M2.8 11.8h18.4c0 4.6-4.1 7.8-9.2 7.8s-9.2-3.2-9.2-7.8z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M5.4 13.8h13.2",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "1.3",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "inkopslista": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M9 8.4V7a3 3 0 0 1 6 0v1.4",
            "fill": "none",
            "stroke": "#fff",
            "strokeWidth": "1.9",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M4.8 8.2h14.4l-1 12.4H5.8z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M8.2 14.6a3.8 3.8 0 1 0 7.6 0a3.8 3.8 0 1 0 -7.6 0z",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M10.2 14.7l1.3 1.3 2.5-2.8",
            "fill": "none",
            "stroke": "#fff",
            "strokeWidth": "1.9",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "kaffe": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M6.7 12C3.3 11.8 1.9 13.6 2.2 15.4c.3 1.8 1.9 2.3 3.7 2",
            "fill": "none",
            "stroke": "#fff",
            "strokeWidth": "1.9",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M11.3 5.4h1.4v1.8h-1.4z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M17.2 13.4l3.8-3v2.4l-3.1 3.6z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M7.8 10c0-1.7 1.9-2.9 4.2-2.9s4.2 1.2 4.2 2.9z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M7 10.8h10l1.4 8.7a1 1 0 0 1-1 1.2H6.6a1 1 0 0 1-1-1.2z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M9.2 13.4v4.6",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "1.3",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "kok": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M3.8 9.2h16.4M6 9.2L4.4 6.4M18 9.2l1.6-2.8M12 9.2v4",
            "fill": "none",
            "stroke": "#fff",
            "strokeWidth": "1.9",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M9.4 6.8h5.2v2.4H9.4z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M6.8 14h10.4v4c0 1.5-2.3 2.6-5.2 2.6s-5.2-1.1-5.2-2.6z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M9.2 16.6h5.6",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "1.3",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "matpase": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M6.5 3.2h11v15.8a1.5 1.5 0 0 1-1.5 1.5H8a1.5 1.5 0 0 1-1.5-1.5z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M6.9 6.3h10.2",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "1.3",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M8.1 13.6a3.9 3.9 0 1 0 7.8 0a3.9 3.9 0 1 0 -7.8 0z",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M10.4 10.9v2.3a1.6 1.6 0 0 0 3.2 0v-2.3M12 10.9v6.2",
            "fill": "none",
            "stroke": "#fff",
            "strokeWidth": "1.9",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "mellanmal": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M6.5 3.2h11v8.8h-11z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M10.2 3.6v7.8M13.8 3.6v7.8M6.9 7.5h10.2",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "1.3",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M5.5 11.8l1.7 1.2 1.7-1.2 1.7 1.2 1.7-1.2 1.7 1.2 1.7-1.2 1.7 1.2 1.6-1.2v8.8h-13z",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "2.6",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M5.5 11.8l1.7 1.2 1.7-1.2 1.7 1.2 1.7-1.2 1.7 1.2 1.7-1.2 1.7 1.2 1.6-1.2v8.8h-13z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M9.2 15.4h5.6v2.6H9.2z",
            "fill": "#000"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "middag": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M9 2.6c-.6.7-.6 1.4 0 2M15 2.6c-.6.7-.6 1.4 0 2M4 13.4H2.2M20 13.4h1.8",
            "fill": "none",
            "stroke": "#fff",
            "strokeWidth": "1.9",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M11 5.4h2v2h-2z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M4 10.6c0-2 3.6-3.4 8-3.4s8 1.4 8 3.4z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M4 11.4h16v5.8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M7 14.2v3",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "1.3",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "vatten": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M9.4 2.8h5.2v3.2H9.4z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M10.2 6.6h3.6v2H10.2z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M8.2 8.4h7.6v11.6a1.2 1.2 0 0 1-1.2 1.2H9.4a1.2 1.2 0 0 1-1.2-1.2z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M12 12c-1.3 1.6-1.8 2.5-1.8 3.2a1.8 1.8 0 0 0 3.6 0c0-.7-.5-1.6-1.8-3.2z",
            "fill": "#000"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "byxor": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M6.8 3h10.4l1.6 18h-4.6L12 11.2 9.8 21H5.2z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M7.1 5.6h9.8M9.2 3.4v1.8M14.8 3.4v1.8M15 12.4h2.6v3.4H15zM6.3 15.8h2.6",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "1.3",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "forsta-hjalpen": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M9 8V5.4h6V8",
            "fill": "none",
            "stroke": "#fff",
            "strokeWidth": "1.9",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M3.5 8h17v12.5h-17z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M10.5 9.95h3v2.8h2.8v3h-2.8v2.8h-3v-2.8H7.7v-3h2.8z",
            "fill": "#000"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "jacka": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M8 4l4 2 4-2 4 3.2-1.6 4H17v9.3H7v-9.3H5.6L4 7.2z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M8.4 3.4l1-1h5.2l1 1L12 5.2z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M8.4 4.4l3.6 1.9 3.6-1.9M12 6.6v13.5M8.5 14.5h2.1M13.4 14.5h2.1M7 10.9V8.6M17 10.9V8.6",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "1.3",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "kniv": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "transform": "rotate(-35 12 13.5)",
            "d": "M2.5 13.5a2 2 0 0 1 2-2h5v4h-5a2 2 0 0 1-2-2z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "transform": "rotate(-35 12 13.5)",
            "d": "M9.5 10.8h1.6v5.4H9.5z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "transform": "rotate(-35 12 13.5)",
            "d": "M11.1 11.6H19c1.5 0 2.6.6 3 1.6-2.3 1.4-6.5 2.2-10.9 2.3z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "transform": "rotate(-35 12 13.5)",
            "d": "M9.4 11.4v4.2M11.2 11.6v3.8",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "1.3",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "transform": "rotate(-35 12 13.5)",
            "d": "M4.35 13.5a0.65 0.65 0 1 0 1.3 0a0.65 0.65 0 1 0 -1.3 0zM6.75 13.5a0.65 0.65 0 1 0 1.3 0a0.65 0.65 0 1 0 -1.3 0z",
            "fill": "#000"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "laddare": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M10 2.4h4v2h-4z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M7 4.9h10a1 1 0 0 1 1 1v14.1a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5.9a1 1 0 0 1 1-1z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M12.8 8.5L9.8 13.4h2.3l-.9 3.6 3-4.9h-2.3z",
            "fill": "#000"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "pannlampa": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M9 10.2C5 10.2 3 11 3 12s2 1.8 6 1.8M15 10.2c4 0 6 .8 6 1.8s-2 1.8-6 1.8M12 17v3M9.6 16.7l-1.3 2.6M14.4 16.7l1.3 2.6",
            "fill": "none",
            "stroke": "#fff",
            "strokeWidth": "1.9",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M8.8 8.8h6.4v6H8.8z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M10.3 11.8a1.7 1.7 0 1 0 3.4 0a1.7 1.7 0 1 0 -3.4 0z",
            "fill": "#000"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "skor": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "transform": "translate(4.6 -5.4)",
            "d": "M3 17v-4.5c0-1 .8-1.8 1.8-1.8H7l1.3 1.6c.5.6 1.2.9 2 .9H12c2.2 0 4 1.1 4.8 2.8l.5 1z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "transform": "translate(4.6 -5.4)",
            "d": "M2.5 17h15.3v1.2a.8.8 0 0 1-.8.8H3.3a.8.8 0 0 1-.8-.8z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M3 17v-4.5c0-1 .8-1.8 1.8-1.8H7l1.3 1.6c.5.6 1.2.9 2 .9H12c2.2 0 4 1.1 4.8 2.8l.5 1zM2.5 17h15.3v1.2a.8.8 0 0 1-.8.8H3.3a.8.8 0 0 1-.8-.8z",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "2.6",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M3 17v-4.5c0-1 .8-1.8 1.8-1.8H7l1.3 1.6c.5.6 1.2.9 2 .9H12c2.2 0 4 1.1 4.8 2.8l.5 1z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M2.5 17h15.3v1.2a.8.8 0 0 1-.8.8H3.3a.8.8 0 0 1-.8-.8z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M3.1 17.1h14.4M9.6 12.9l.9-1.1M11.6 13.4l.8-1.2",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "1.3",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "stavar": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M8.6 6.5l2.2 15M14.6 6.5l2.2 15M8.2 18.3h3.8M14.2 18.3h3.8",
            "fill": "none",
            "stroke": "#fff",
            "strokeWidth": "1.9",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M6.5 2.2h3l.5 4.4H7z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M12.5 2.2h3l.5 4.4h-3z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M7.3 4.2h2.2M13.3 4.2h2.2",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "1.3",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "termos": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M7.5 3h9v4.3h-9z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M8 7.8h8v11.7a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 8 19.5z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M10.5 5.2h3M8.4 12.5h7.2M8.4 15.5h7.2",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "1.3",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "vattenrening": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M12 2.6s6.4 6.8 6.4 11.3a6.4 6.4 0 0 1-12.8 0C5.6 9.4 12 2.6 12 2.6z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M9 14.2l2.1 2.1 4-4.2",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "1.3",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "back": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M13 2.8h2.2c-.3 2.2-2.4 3.4-2.4 5.4 0 2.4 4.4 3.8 4.4 7.2 0 2.2-1 3.8-1.5 5.6H6.6c.9-1.8 3.4-3 3.4-5.3S6.8 12.1 6.8 9.2C6.8 6.4 11.4 5 13 2.8z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M11 8c-1.2.9-1.4 2.1-.4 3.4M13 15.4c.7 1 .6 2.2-.3 3.2",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "1.3",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M17.2 11a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0zM3 17.5a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0z",
            "fill": "#fff"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "deltagare": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M2.8 12a9.2 9.2 0 1 0 18.4 0a9.2 9.2 0 1 0 -18.4 0z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M8.9 9.6a3.1 3.1 0 1 0 6.2 0a3.1 3.1 0 1 0 -6.2 0z",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M6.6 18.2c1.2-2.3 3-3.4 5.4-3.4s4.2 1.1 5.4 3.4",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "1.3",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "fjall": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M2 20L8.5 8l3.5 5.5L15 9l7 11z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M5.8 13l1.6-1 1.2 1.1 1.5-1.2.9.6",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "1.3",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "fjallbjork": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "transform": "rotate(-25 12 12)",
            "d": "M12 18.6V22",
            "fill": "none",
            "stroke": "#fff",
            "strokeWidth": "1.9",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "transform": "rotate(-25 12 12)",
            "d": "M12 2.5c2.9 2.9 6.2 6.2 6.2 10.3A6.2 6.2 0 0 1 12 19a6.2 6.2 0 0 1-6.2-6.2C5.8 8.7 9.1 5.4 12 2.5z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "transform": "rotate(-25 12 12)",
            "d": "M12 6.5v12.1M12 11l2.6-2M12 14.3l3.7-2.5M12 11l-2.6-2M12 14.3l-3.7-2.5",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "1.3",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "hund": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M4.6 10c0-3.3 2.6-6 6-6h1.6c2 0 3.5 1 4.3 2.7l1 2.1h2.4c.9 0 1.6.7 1.6 1.6v1.4c0 1.5-1.2 2.7-2.7 2.7h-3.3l-.4 2.2 1.7 4.8H8.2l.7-4.4C6.3 15.9 4.6 13.3 4.6 10z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M9.8 5.1c-2.2.2-3.7 2-3.9 4.6-.1 1.8.6 3.2 1.7 3.8l1.5-.7c.9-2.6 1.3-5.1.7-7.7z",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "2.6",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M9.8 5.1c-2.2.2-3.7 2-3.9 4.6-.1 1.8.6 3.2 1.7 3.8l1.5-.7c.9-2.6 1.3-5.1.7-7.7z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M12.95 8.6a0.85 0.85 0 1 0 1.7 0a0.85 0.85 0 1 0 -1.7 0z",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M18.6 12.6h-2.4M9.1 16.6l5.6.3",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "1.3",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M19.5 10a0.9 0.9 0 1 0 1.8 0a0.9 0.9 0 1 0 -1.8 0z",
            "fill": "#000"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "inbjudan": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M2.5 7.5H17v11H2.5z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M3 8l6.75 5.1L16.5 8",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "1.3",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M14.9 6.5a3.6 3.6 0 1 0 7.2 0a3.6 3.6 0 1 0 -7.2 0z",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "2.6",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M14.9 6.5a3.6 3.6 0 1 0 7.2 0a3.6 3.6 0 1 0 -7.2 0z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M18.5 4.8v3.4M16.8 6.5h3.4",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "1.3",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "lagereld": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M4.6 21.2l-.8-2.6 15-4.2.8 2.6z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M19.4 21.2l.8-2.6-15-4.2-.8 2.6z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M12 3c1.5 2.7 4.5 4.5 4.5 8.2a4.5 4.5 0 0 1-9 0c0-2 1-3.2 2-4.2.2 1.6.8 2.4 1.6 2.7C10.6 7.6 11 5.2 12 3z",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "2.6",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M12 3c1.5 2.7 4.5 4.5 4.5 8.2a4.5 4.5 0 0 1-9 0c0-2 1-3.2 2-4.2.2 1.6.8 2.4 1.6 2.7C10.6 7.6 11 5.2 12 3z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M12 9.8c1 1.2 2 2.2 2 3.5a2 2 0 0 1-4 0c0-1.3 1-2.3 2-3.5z",
            "fill": "#000"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "norrsken": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M2.5 11c2.5-3.2 4.5-1.4 6.5-3.6S13 3.5 15.5 5.5 19 7 21.5 5v5c-2.5 2-4.2.6-6-.4s-4.5 0-6 2.2-4.5 1.4-7 4.2z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M6.5 9.4v3M10.6 7v3.2M14.6 5.6v3.6M18.4 6.6v3",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "1.3",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M2 21v-1.5c3-2 6-2.5 10-1.2 3.5-1.3 7-.8 10 1.2V21z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M4.5 4.6a1 1 0 1 0 2 0a1 1 0 1 0 -2 0zM18 14.5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0z",
            "fill": "#fff"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "ren": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "d": "M10.3 10C9.3 7 7.8 5 5.8 3.5M8.1 6.3L5.2 6.6M9.3 8l-.9-3.5M13.7 10c1-3 2.5-5 4.5-6.5M15.9 6.3l2.9.3M14.7 8l.9-3.5",
            "fill": "none",
            "stroke": "#fff",
            "strokeWidth": "1.9",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M9 10.8L5.8 9.7l1.5 2.8zM15 10.8l3.2-1.1-1.5 2.8z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M8.6 9.8h6.8l-1 7.6c-.3 1.9-1.3 3-2.4 3s-2.1-1.1-2.4-3z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M9.85 13.4a0.75 0.75 0 1 0 1.5 0a0.75 0.75 0 1 0 -1.5 0zM12.65 13.4a0.75 0.75 0 1 0 1.5 0a0.75 0.75 0 1 0 -1.5 0zM10.9 18.2a1.1 1.1 0 1 0 2.2 0a1.1 1.1 0 1 0 -2.2 0z",
            "fill": "#000"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ],
  "sno": [
    [
      "mask",
      {
        "id": "MASK",
        "maskUnits": "userSpaceOnUse",
        "x": "0",
        "y": "0",
        "width": "24",
        "height": "24"
      },
      [
        [
          "rect",
          {
            "width": "24",
            "height": "24",
            "fill": "#000"
          },
          []
        ],
        [
          "path",
          {
            "transform": "rotate(0 12 12)",
            "d": "M12 12V3M10.2 4.8l1.8 1.7 1.8-1.7",
            "fill": "none",
            "stroke": "#fff",
            "strokeWidth": "1.9",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "transform": "rotate(60 12 12)",
            "d": "M12 12V3M10.2 4.8l1.8 1.7 1.8-1.7",
            "fill": "none",
            "stroke": "#fff",
            "strokeWidth": "1.9",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "transform": "rotate(120 12 12)",
            "d": "M12 12V3M10.2 4.8l1.8 1.7 1.8-1.7",
            "fill": "none",
            "stroke": "#fff",
            "strokeWidth": "1.9",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "transform": "rotate(180 12 12)",
            "d": "M12 12V3M10.2 4.8l1.8 1.7 1.8-1.7",
            "fill": "none",
            "stroke": "#fff",
            "strokeWidth": "1.9",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "transform": "rotate(240 12 12)",
            "d": "M12 12V3M10.2 4.8l1.8 1.7 1.8-1.7",
            "fill": "none",
            "stroke": "#fff",
            "strokeWidth": "1.9",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "transform": "rotate(300 12 12)",
            "d": "M12 12V3M10.2 4.8l1.8 1.7 1.8-1.7",
            "fill": "none",
            "stroke": "#fff",
            "strokeWidth": "1.9",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M12 9.2l2.4 1.4v2.8L12 14.8l-2.4-1.4v-2.8z",
            "fill": "none",
            "stroke": "#000",
            "strokeWidth": "2.6",
            "strokeLinejoin": "round"
          },
          []
        ],
        [
          "path",
          {
            "d": "M12 9.2l2.4 1.4v2.8L12 14.8l-2.4-1.4v-2.8z",
            "fill": "#fff"
          },
          []
        ],
        [
          "path",
          {
            "d": "M11.2 12a0.8 0.8 0 1 0 1.6 0a0.8 0.8 0 1 0 -1.6 0z",
            "fill": "#000"
          },
          []
        ]
      ]
    ],
    [
      "rect",
      {
        "width": "24",
        "height": "24",
        "fill": "currentColor",
        "mask": "url(#MASK)"
      },
      []
    ]
  ]
} as const satisfies Record<string, readonly Ikonelement[]>

/** Omgången varje ikon kom i: 1 meny, 2 tur, 3 mat, 4 utrustning, 5 natur och folk, 0 extra (sovsäck och hygien). */
export const IKONOMGANG = {
  "hygien": 0,
  "sovsack": 0,
  "dagbok": 1,
  "hem": 1,
  "matplanering": 1,
  "mina-turer": 1,
  "mitt-forrad": 1,
  "packlistor": 1,
  "skafferi": 1,
  "statistik": 1,
  "utrustningskatalog": 1,
  "vandringskompisar": 1,
  "dag": 2,
  "distans": 2,
  "etapp": 2,
  "hojdmeter": 2,
  "kompass": 2,
  "ledkryss": 2,
  "overnattning": 2,
  "ros": 2,
  "vader": 2,
  "vindskydd": 2,
  "allergi": 3,
  "gaspatron": 3,
  "grot": 3,
  "inkopslista": 3,
  "kaffe": 3,
  "kok": 3,
  "matpase": 3,
  "mellanmal": 3,
  "middag": 3,
  "vatten": 3,
  "byxor": 4,
  "forsta-hjalpen": 4,
  "jacka": 4,
  "kniv": 4,
  "laddare": 4,
  "pannlampa": 4,
  "skor": 4,
  "stavar": 4,
  "termos": 4,
  "vattenrening": 4,
  "back": 5,
  "deltagare": 5,
  "fjall": 5,
  "fjallbjork": 5,
  "hund": 5,
  "inbjudan": 5,
  "lagereld": 5,
  "norrsken": 5,
  "ren": 5,
  "sno": 5
} as const
