// Skapad med "npm run ikoner" från src/components/ikoner/svg/. Ändra inte filen för hand.

export type Ikonelement = readonly [tagg: "path" | "circle" | "ellipse" | "g", attribut: Readonly<Record<string, string>>, barn: readonly Ikonelement[]]

export const IKONER = {
  "dagbok": [
    [
      "path",
      {
        "d": "M5 3.5h12a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H5z",
        "fill": "var(--ikon-yta, #f6ead6)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M5 3.5h2.5v17H5z",
        "fill": "var(--ikon-yta-2, #ecc28f)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M13 3.5v5.5l1.5-1.1 1.5 1.1V3.5z",
        "fill": "var(--ikon-accent, #e8a33d)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M5 3.5h12a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H5zM7.5 3.5v17M10 12h5M10 15h4",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "matplanering": [
    [
      "path",
      {
        "d": "M4 9h12v3.5a6 6 0 0 1-12 0z",
        "fill": "var(--ikon-yta, #f6ead6)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M15.5 10h5a1 1 0 0 1 0 2h-5z",
        "fill": "var(--ikon-yta-2, #ecc28f)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M4 9h12v1.6H4z",
        "fill": "var(--ikon-accent, #e8a33d)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M4 9h12v3.5a6 6 0 0 1-12 0zM16 10h4.2a.8.8 0 0 1 .8.8v.4a.8.8 0 0 1-.8.8H16M8 3.5c-.7.8-.7 1.7 0 2.5M12 3.5c-.7.8-.7 1.7 0 2.5",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "mina-turer": [
    [
      "path",
      {
        "d": "M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z",
        "fill": "var(--ikon-yta, #f6ead6)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M9 4l6 2v14l-6-2z",
        "fill": "var(--ikon-yta-2, #ecc28f)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M16.5 10a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0z",
        "fill": "var(--ikon-accent, #e8a33d)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "mitt-forrad": [
    [
      "path",
      {
        "d": "M6.5 9.5a5.5 5.5 0 0 1 11 0V19a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 19z",
        "fill": "var(--ikon-yta, #f6ead6)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M9 14h6v4.5H9z",
        "fill": "var(--ikon-yta-2, #ecc28f)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M6.5 9.5a5.5 5.5 0 0 1 11 0V19a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 19zM9 14h6v4.5H9zM10.5 4.6a1.5 1.5 0 0 1 3 0",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "oversikt": [
    [
      "path",
      {
        "d": "M4 11l8-6.5 8 6.5v9.5H4z",
        "fill": "var(--ikon-yta, #f6ead6)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M10 20.5v-5h4v5z",
        "fill": "var(--ikon-yta-2, #ecc28f)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M4 11l8-6.5 8 6.5v9.5H4zM10 20.5v-5h4v5M2.5 12.2L12 4.5l9.5 7.7",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "packlistor": [
    [
      "path",
      {
        "d": "M5.5 4.5h13v16h-13z",
        "fill": "var(--ikon-yta, #f6ead6)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M9 3h6v3H9z",
        "fill": "var(--ikon-yta-2, #ecc28f)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M8 9h2.5v2.5H8zM8 14h2.5v2.5H8z",
        "fill": "var(--ikon-accent, #e8a33d)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M5.5 4.5h13v16h-13zM9 3h6v3H9zM12.5 10.2H16M12.5 15.2H16M8 9h2.5v2.5H8zM8 14h2.5v2.5H8z",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "skafferi": [
    [
      "path",
      {
        "d": "M6 15h5v6H6z",
        "fill": "var(--ikon-yta, #f6ead6)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M5.5 5.5h4V11h-4zM13.4 18a2.6 2.6 0 1 0 5.2 0a2.6 2.6 0 1 0-5.2 0z",
        "fill": "var(--ikon-yta-2, #ecc28f)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M13 4.5h5l.6 6.5h-6.2z",
        "fill": "var(--ikon-accent, #e8a33d)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M3 11h18M3 21h18M5.5 5.5h4V11h-4zM5 4h5M13 4.5h5l.6 6.5h-6.2zM6 15h5v6H6zM13.4 18a2.6 2.6 0 1 0 5.2 0a2.6 2.6 0 1 0-5.2 0z",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "statistik": [
    [
      "path",
      {
        "d": "M4.5 14h3.5v6.5H4.5zM10.25 10h3.5v10.5h-3.5zM16 6.5h3.5v14H16z",
        "fill": "var(--ikon-yta, #f6ead6)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M17.75 6.5V2.8l2.8 1.2-2.8 1.2z",
        "fill": "var(--ikon-accent, #e8a33d)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M4.5 14h3.5v6.5H4.5zM10.25 10h3.5v10.5h-3.5zM16 6.5h3.5v14H16zM17.75 6.5V2.8M3 20.5h18",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "utrustningskatalog": [
    [
      "path",
      {
        "d": "M3.5 5.5c2.7-1.2 5.6-1 8.5.6v14c-2.9-1.6-5.8-1.8-8.5-.6z",
        "fill": "var(--ikon-yta, #f6ead6)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M20.5 5.5c-2.7-1.2-5.6-1-8.5.6v14c2.9-1.6 5.8-1.8 8.5-.6z",
        "fill": "var(--ikon-yta-2, #ecc28f)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M3.5 5.5c2.7-1.2 5.6-1 8.5.6v14c-2.9-1.6-5.8-1.8-8.5-.6zM20.5 5.5c-2.7-1.2-5.6-1-8.5.6v14c2.9-1.6 5.8-1.8 8.5-.6zM6 9.5h3.5M6 12.5h3.5M14.5 9.5H18M14.5 12.5H18",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "vandringskompisar": [
    [
      "path",
      {
        "d": "M11.7 20.5v-2.7a4.4 4.4 0 0 1 8.8 0v2.7z",
        "fill": "var(--ikon-yta-2, #ecc28f)"
      },
      []
    ],
    [
      "circle",
      {
        "cx": "16.1",
        "cy": "8",
        "r": "2.3",
        "fill": "var(--ikon-yta-2, #ecc28f)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M11.7 20.5v-2.7a4.4 4.4 0 0 1 8.8 0v2.7zM18.4 8a2.3 2.3 0 1 1-4.6 0a2.3 2.3 0 1 1 4.6 0z",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ],
    [
      "path",
      {
        "d": "M3.5 20.5v-2.3a4.8 4.8 0 0 1 9.6 0v2.3z",
        "fill": "var(--ikon-yta, #f6ead6)"
      },
      []
    ],
    [
      "circle",
      {
        "cx": "8.3",
        "cy": "9.3",
        "r": "2.7",
        "fill": "var(--ikon-accent, #e8a33d)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M3.5 20.5v-2.3a4.8 4.8 0 0 1 9.6 0v2.3zM11 9.3a2.7 2.7 0 1 1-5.4 0a2.7 2.7 0 1 1 5.4 0z",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "dag": [
    [
      "path",
      {
        "d": "M4 6h16v14.5H4z",
        "fill": "var(--ikon-yta, #f6ead6)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M4 6h16v4H4z",
        "fill": "var(--ikon-yta-2, #ecc28f)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M10 15.2a2 2 0 1 0 4 0a2 2 0 1 0-4 0z",
        "fill": "var(--ikon-accent, #e8a33d)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M4 6h16v14.5H4zM4 10h16M8 4v4M16 4v4M10 15.2a2 2 0 1 0 4 0a2 2 0 1 0-4 0z",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "distans": [
    [
      "path",
      {
        "d": "M6 3.5a2.6 2.6 0 0 1 2.6 2.6C8.6 8.8 6 11 6 11S3.4 8.8 3.4 6.1A2.6 2.6 0 0 1 6 3.5z",
        "fill": "var(--ikon-yta-2, #ecc28f)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M18 3.5a2.6 2.6 0 0 1 2.6 2.6c0 2.7-2.6 4.9-2.6 4.9s-2.6-2.2-2.6-4.9A2.6 2.6 0 0 1 18 3.5z",
        "fill": "var(--ikon-accent, #e8a33d)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M6 3.5a2.6 2.6 0 0 1 2.6 2.6C8.6 8.8 6 11 6 11S3.4 8.8 3.4 6.1A2.6 2.6 0 0 1 6 3.5zM18 3.5a2.6 2.6 0 0 1 2.6 2.6c0 2.7-2.6 4.9-2.6 4.9s-2.6-2.2-2.6-4.9A2.6 2.6 0 0 1 18 3.5zM4 16.5h16M4 14.5v4M20 14.5v4",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "etapp": [
    [
      "path",
      {
        "d": "M4.5 19c2.5-5 5.5-1 8.2-5.5S15.5 9.5 17.5 9",
        "fill": "none",
        "stroke": "var(--ikon-yta-2, #ecc28f)",
        "strokeWidth": "3",
        "strokeLinecap": "round"
      },
      []
    ],
    [
      "circle",
      {
        "cx": "4.5",
        "cy": "19",
        "r": "2.2",
        "fill": "var(--ikon-yta, #f6ead6)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M17.5 2.3h4.6l-1.4 2 1.4 2h-4.6z",
        "fill": "var(--ikon-accent, #e8a33d)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M4.5 19c2.5-5 5.5-1 8.2-5.5S15.5 9.5 17.5 9",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeDasharray": "2 2.2"
      },
      []
    ],
    [
      "path",
      {
        "d": "M6.7 19a2.2 2.2 0 1 1-4.4 0a2.2 2.2 0 1 1 4.4 0zM17.5 10V2.3M17.5 2.3h4.6l-1.4 2 1.4 2h-4.6",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "hojdmeter": [
    [
      "path",
      {
        "d": "M2.5 20.5l6-10.5 4 5.5 3-3.5 6 8.5z",
        "fill": "var(--ikon-yta, #f6ead6)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M17.6 3l2.9 3.4h-1.8V10h-2.2V6.4h-1.8z",
        "fill": "var(--ikon-accent, #e8a33d)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M2.5 20.5l6-10.5 4 5.5 3-3.5 6 8.5zM17.6 3l2.9 3.4h-1.8V10h-2.2V6.4h-1.8z",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "kompass": [
    [
      "path",
      {
        "d": "M3.5 12a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0-17 0z",
        "fill": "var(--ikon-yta, #f6ead6)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M12 18.5l-2-6.5h4z",
        "fill": "var(--ikon-yta-2, #ecc28f)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M12 5.5l2 6.5h-4z",
        "fill": "var(--ikon-accent, #e8a33d)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M3.5 12a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0-17 0zM12 5.5l2 6.5-2 6.5-2-6.5z",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "ledkryss": [
    [
      "path",
      {
        "d": "M11.2 11h1.6v9.5h-1.6z",
        "fill": "var(--ikon-yta, #f6ead6)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M6.3 4.3l1.3-1.3 10.1 8.2-1.3 1.3zM16.4 3l1.3 1.3-10.1 8.2-1.3-1.3z",
        "fill": "#c45a3b"
      },
      []
    ],
    [
      "path",
      {
        "d": "M11.2 11h1.6v9.5h-1.6zM9 20.5h6M6.3 4.3l1.3-1.3 10.1 8.2-1.3 1.3zM16.4 3l1.3 1.3-10.1 8.2-1.3-1.3z",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "overnattning": [
    [
      "path",
      {
        "d": "M4.5 13.5l6-5 6 5v7H4.5z",
        "fill": "var(--ikon-yta, #f6ead6)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M8.8 20.5v-4h3.4v4z",
        "fill": "var(--ikon-yta-2, #ecc28f)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M18.6 3.2a3.6 3.6 0 1 0 2.8 6 2.9 2.9 0 0 1-2.8-6z",
        "fill": "var(--ikon-accent, #e8a33d)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M4.5 13.5l6-5 6 5v7H4.5zM8.8 20.5v-4h3.4v4M3 14.6l7.5-6.3 7.5 6.3M18.6 3.2a3.6 3.6 0 1 0 2.8 6 2.9 2.9 0 0 1-2.8-6z",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "ros": [
    [
      "ellipse",
      {
        "cx": "5.6",
        "cy": "18.5",
        "rx": "3.2",
        "ry": "2.1",
        "fill": "var(--ikon-yta, #f6ead6)",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5"
      },
      []
    ],
    [
      "ellipse",
      {
        "cx": "12",
        "cy": "18.6",
        "rx": "3.3",
        "ry": "2.1",
        "fill": "var(--ikon-yta-2, #ecc28f)",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5"
      },
      []
    ],
    [
      "ellipse",
      {
        "cx": "18.4",
        "cy": "18.5",
        "rx": "3.2",
        "ry": "2.1",
        "fill": "var(--ikon-yta, #f6ead6)",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5"
      },
      []
    ],
    [
      "ellipse",
      {
        "cx": "8.8",
        "cy": "14.6",
        "rx": "3.1",
        "ry": "2",
        "fill": "var(--ikon-yta-2, #ecc28f)",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5"
      },
      []
    ],
    [
      "ellipse",
      {
        "cx": "15.2",
        "cy": "14.6",
        "rx": "3.1",
        "ry": "2",
        "fill": "var(--ikon-yta, #f6ead6)",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5"
      },
      []
    ],
    [
      "path",
      {
        "d": "M14 14.1h2.6v1h-2.6z",
        "fill": "var(--ikon-accent, #e8a33d)"
      },
      []
    ],
    [
      "ellipse",
      {
        "cx": "12",
        "cy": "10.8",
        "rx": "2.5",
        "ry": "1.8",
        "fill": "var(--ikon-yta, #f6ead6)",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5"
      },
      []
    ]
  ],
  "vader": [
    [
      "circle",
      {
        "cx": "9",
        "cy": "8.5",
        "r": "4",
        "fill": "var(--ikon-accent, #e8a33d)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M13 8.5a4 4 0 1 1-8 0a4 4 0 1 1 8 0zM9 2.5v1.3M3.5 8.5H2.2M4.8 4.3l.9.9M13.2 4.3l-.9.9",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ],
    [
      "path",
      {
        "d": "M7 19.5a4 4 0 0 1 .4-8 5.2 5.2 0 0 1 9.9 1.6 3.3 3.3 0 0 1-.3 6.4z",
        "fill": "var(--ikon-yta, #f6ead6)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M7 19.5a4 4 0 0 1 .4-8 5.2 5.2 0 0 1 9.9 1.6 3.3 3.3 0 0 1-.3 6.4z",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "vindskydd": [
    [
      "path",
      {
        "d": "M5 20.5V7.5l13 5.5v7.5z",
        "fill": "var(--ikon-yta, #f6ead6)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M20.5 19c-.9-.9-.9-2 0-3.1.9 1.1.9 2.2 0 3.1z",
        "fill": "var(--ikon-accent, #e8a33d)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M5 20.5V7.5l13 5.5v7.5M3.5 8l16 6.6M3 20.5h18M20.5 19c-.9-.9-.9-2 0-3.1.9 1.1.9 2.2 0 3.1z",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "allergi": [
    [
      "path",
      {
        "d": "M12 10c-2.3-.3-3.6-1.8-3.6-3.9 2.3.3 3.6 1.8 3.6 3.9zM12 10c2.3-.3 3.6-1.8 3.6-3.9-2.3.3-3.6 1.8-3.6 3.9zM12 18c-2.3-.3-3.6-1.8-3.6-3.9 2.3.3 3.6 1.8 3.6 3.9zM12 18c2.3-.3 3.6-1.8 3.6-3.9-2.3.3-3.6 1.8-3.6 3.9z",
        "fill": "var(--ikon-yta-2, #ecc28f)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M12 14c-2.3-.3-3.6-1.8-3.6-3.9 2.3.3 3.6 1.8 3.6 3.9zM12 14c2.3-.3 3.6-1.8 3.6-3.9-2.3.3-3.6 1.8-3.6 3.9z",
        "fill": "var(--ikon-accent, #e8a33d)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M12 6c-1.1-1-1.1-2.5 0-3.6 1.1 1.1 1.1 2.6 0 3.6z",
        "fill": "var(--ikon-yta-2, #ecc28f)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M12 21.5V6M12 6c-1.1-1-1.1-2.5 0-3.6 1.1 1.1 1.1 2.6 0 3.6zM12 10c-2.3-.3-3.6-1.8-3.6-3.9 2.3.3 3.6 1.8 3.6 3.9zM12 10c2.3-.3 3.6-1.8 3.6-3.9-2.3.3-3.6 1.8-3.6 3.9zM12 14c-2.3-.3-3.6-1.8-3.6-3.9 2.3.3 3.6 1.8 3.6 3.9zM12 14c2.3-.3 3.6-1.8 3.6-3.9-2.3.3-3.6 1.8-3.6 3.9zM12 18c-2.3-.3-3.6-1.8-3.6-3.9 2.3.3 3.6 1.8 3.6 3.9zM12 18c2.3-.3 3.6-1.8 3.6-3.9-2.3.3-3.6 1.8-3.6 3.9z",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "gaspatron": [
    [
      "path",
      {
        "d": "M5 20.5V12c0-2.5 3.1-4.5 7-4.5s7 2 7 4.5v8.5z",
        "fill": "var(--ikon-yta, #f6ead6)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M5 14.5h14v3.2H5z",
        "fill": "var(--ikon-accent, #e8a33d)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M10.5 7.6V4.5h3v3.1z",
        "fill": "var(--ikon-yta-2, #ecc28f)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M5 20.5V12c0-2.5 3.1-4.5 7-4.5s7 2 7 4.5v8.5zM5 14.5h14M5 17.7h14M10.5 7.6V4.5h3v3.1M3.5 20.5h17",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "grot": [
    [
      "path",
      {
        "d": "M3 12h18c0 4.4-4 7.5-9 7.5S3 16.4 3 12z",
        "fill": "var(--ikon-yta, #f6ead6)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M5 12h14l-.8 1.8H5.8z",
        "fill": "var(--ikon-accent, #e8a33d)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M3 12h18c0 4.4-4 7.5-9 7.5S3 16.4 3 12zM14.5 12l5-8M8 9c-.6-.8-.6-1.6 0-2.4M11 9c-.6-.8-.6-1.6 0-2.4",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "inkopslista": [
    [
      "path",
      {
        "d": "M5 8.5h14l-1 12H6z",
        "fill": "var(--ikon-yta, #f6ead6)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M8.3 14.6a3.7 3.7 0 1 0 7.4 0a3.7 3.7 0 1 0-7.4 0z",
        "fill": "var(--ikon-accent, #e8a33d)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M5 8.5h14l-1 12H6zM9 8.5V7a3 3 0 0 1 6 0v1.5M10.2 14.7l1.3 1.3 2.5-2.8",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "kaffe": [
    [
      "path",
      {
        "d": "M6.7 12C3.3 11.8 1.9 13.6 2.2 15.4c.3 1.8 1.9 2.3 3.7 2",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.8",
        "strokeLinecap": "round"
      },
      []
    ],
    [
      "path",
      {
        "d": "M7 10.5h10l1.4 9a1 1 0 0 1-1 1.2H6.6a1 1 0 0 1-1-1.2z",
        "fill": "var(--ikon-yta, #f6ead6)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M8 10.5c0-1.6 1.8-2.8 4-2.8s4 1.2 4 2.8z",
        "fill": "var(--ikon-yta-2, #ecc28f)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M11.3 6.2h1.4v1.5h-1.4z",
        "fill": "var(--ikon-accent, #e8a33d)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M7 10.5h10l1.4 9a1 1 0 0 1-1 1.2H6.6a1 1 0 0 1-1-1.2zM8 10.5c0-1.6 1.8-2.8 4-2.8s4 1.2 4 2.8M11.3 6.2h1.4v1.5h-1.4zM17.3 13.5l3.4-2.7v1.9l-2.9 3.4",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "kok": [
    [
      "path",
      {
        "d": "M7 14.5h10V18c0 1.4-2.2 2.5-5 2.5S7 19.4 7 18z",
        "fill": "var(--ikon-yta, #f6ead6)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M9.5 7.5h5V9h-5z",
        "fill": "var(--ikon-accent, #e8a33d)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M4 9h16M6 9L4.5 6.5M18 9l1.5-2.5M9.5 9V7.5h5V9M12 9v3.5M7 14.5h10V18c0 1.4-2.2 2.5-5 2.5S7 19.4 7 18z",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "matpase": [
    [
      "path",
      {
        "d": "M6.5 3.5h11v15.5a1.5 1.5 0 0 1-1.5 1.5H8a1.5 1.5 0 0 1-1.5-1.5z",
        "fill": "var(--ikon-yta, #f6ead6)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M6.5 3.5h11v2.8h-11z",
        "fill": "var(--ikon-yta-2, #ecc28f)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M8.2 13.6a3.8 3.8 0 1 0 7.6 0a3.8 3.8 0 1 0-7.6 0z",
        "fill": "var(--ikon-accent, #e8a33d)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M6.5 3.5h11v15.5a1.5 1.5 0 0 1-1.5 1.5H8a1.5 1.5 0 0 1-1.5-1.5zM6.5 6.3h11M10.5 10.9v2.3a1.5 1.5 0 0 0 3 0v-2.3M12 10.9v2.6M12 14.7v2.6",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "mellanmal": [
    [
      "path",
      {
        "d": "M6.5 3.5h11v9h-11z",
        "fill": "var(--ikon-yta-2, #ecc28f)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M5.5 11.5l1.7 1.2 1.7-1.2 1.7 1.2 1.7-1.2 1.7 1.2 1.7-1.2 1.7 1.2 1.6-1.2v9h-13z",
        "fill": "var(--ikon-yta, #f6ead6)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M9.3 15.3h5.4v2.4H9.3z",
        "fill": "var(--ikon-accent, #e8a33d)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M6.5 11.5V3.5h11v8M10.2 3.5v8M13.8 3.5v8M6.5 7.5h11M5.5 11.5l1.7 1.2 1.7-1.2 1.7 1.2 1.7-1.2 1.7 1.2 1.7-1.2 1.7 1.2 1.6-1.2v9h-13zM9.3 15.3h5.4v2.4H9.3z",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "middag": [
    [
      "path",
      {
        "d": "M4 11h16v6a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z",
        "fill": "var(--ikon-yta, #f6ead6)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M4 11c0-2 3.6-3.2 8-3.2S20 9 20 11z",
        "fill": "var(--ikon-yta-2, #ecc28f)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M11 6.4h2v1.5h-2z",
        "fill": "var(--ikon-accent, #e8a33d)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M4 11h16v6a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3zM4 11c0-2 3.6-3.2 8-3.2S20 9 20 11M11 6.4h2v1.5h-2zM4 13H2.5M20 13h1.5M9 2.8c-.6.7-.6 1.4 0 2M15 2.8c-.6.7-.6 1.4 0 2",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "vatten": [
    [
      "path",
      {
        "d": "M8.5 8.5h7v11.5a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1z",
        "fill": "var(--ikon-yta, #f6ead6)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M9.5 3.5h5V6h-5z",
        "fill": "var(--ikon-yta-2, #ecc28f)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M12 12.6c-1 1.3-1.4 2-1.4 2.6a1.4 1.4 0 0 0 2.8 0c0-.6-.4-1.3-1.4-2.6z",
        "fill": "var(--ikon-accent, #e8a33d)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M8.5 8.5h7v11.5a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1zM9.5 3.5h5V6h-5zM10 6v2.5M14 6v2.5M12 12.6c-1 1.3-1.4 2-1.4 2.6a1.4 1.4 0 0 0 2.8 0c0-.6-.4-1.3-1.4-2.6z",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "byxor": [
    [
      "path",
      {
        "d": "M6.5 3.5h11l1 17h-4.2L12 10.5l-2.3 10H5.5z",
        "fill": "var(--ikon-yta, #f6ead6)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M6.5 3.5h11v2.3h-11z",
        "fill": "var(--ikon-yta-2, #ecc28f)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M11 4h2v1.4h-2z",
        "fill": "var(--ikon-accent, #e8a33d)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M6.5 3.5h11l1 17h-4.2L12 10.5l-2.3 10H5.5zM6.5 5.8h11M12 5.8v4.7M8.2 6.6c.3 1.4 1 2.1 2 2.2M15.8 6.6c-.3 1.4-1 2.1-2 2.2",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "forsta-hjalpen": [
    [
      "path",
      {
        "d": "M3.5 8h17v12.5h-17z",
        "fill": "var(--ikon-yta, #f6ead6)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M10.5 9.95h3v2.8h2.8v3h-2.8v2.8h-3v-2.8H7.7v-3h2.8z",
        "fill": "#c45a3b"
      },
      []
    ],
    [
      "path",
      {
        "d": "M3.5 8h17v12.5h-17zM9 8V5.5h6V8M10.5 9.95h3v2.8h2.8v3h-2.8v2.8h-3v-2.8H7.7v-3h2.8z",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "jacka": [
    [
      "path",
      {
        "d": "M8 4l4 2 4-2 4 3.2-1.6 4H17v9.3H7v-9.3H5.6L4 7.2z",
        "fill": "var(--ikon-yta, #f6ead6)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M8 4l4 2 4-2-1.2-1h-5.6z",
        "fill": "var(--ikon-yta-2, #ecc28f)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M11.4 8.5h1.2v1.8h-1.2z",
        "fill": "var(--ikon-accent, #e8a33d)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M8 4l4 2 4-2 4 3.2-1.6 4H17v9.3H7v-9.3H5.6L4 7.2zM12 6v14.5M8.5 14.5H11M13 14.5h2.5M7 11.2V8.5M17 11.2V8.5",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "kniv": [
    [
      "g",
      {
        "transform": "rotate(-35 12 13.5)"
      },
      [
        [
          "path",
          {
            "d": "M2.5 13.5a2 2 0 0 1 2-2h5v4h-5a2 2 0 0 1-2-2z",
            "fill": "#c45a3b"
          },
          []
        ],
        [
          "path",
          {
            "d": "M9.5 11h1.6v5H9.5z",
            "fill": "var(--ikon-yta-2, #ecc28f)"
          },
          []
        ],
        [
          "path",
          {
            "d": "M11.1 11.6H19c1.5 0 2.6.6 3 1.6-2.3 1.4-6.5 2.2-10.9 2.3z",
            "fill": "var(--ikon-yta, #f6ead6)"
          },
          []
        ],
        [
          "path",
          {
            "d": "M2.5 13.5a2 2 0 0 1 2-2h5v4h-5a2 2 0 0 1-2-2zM9.5 11h1.6v5H9.5zM11.1 11.6H19c1.5 0 2.6.6 3 1.6-2.3 1.4-6.5 2.2-10.9 2.3z",
            "fill": "none",
            "stroke": "var(--ikon-linje, #5a4a3a)",
            "strokeWidth": "1.5",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ]
      ]
    ]
  ],
  "laddare": [
    [
      "path",
      {
        "d": "M7 5h10a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z",
        "fill": "var(--ikon-yta, #f6ead6)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M10 3h4v2h-4z",
        "fill": "var(--ikon-yta-2, #ecc28f)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M12.8 8.5L9.8 13.4h2.3l-.9 3.6 3-4.9h-2.3z",
        "fill": "var(--ikon-accent, #e8a33d)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M7 5h10a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM10 3h4v2M12.8 8.5L9.8 13.4h2.3l-.9 3.6 3-4.9h-2.3z",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "pannlampa": [
    [
      "path",
      {
        "d": "M9 9h6v5.5H9z",
        "fill": "var(--ikon-yta-2, #ecc28f)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M10.6 11.8a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0-2.8 0z",
        "fill": "var(--ikon-accent, #e8a33d)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M9 10.2C5 10.2 3 11 3 12s2 1.8 6 1.8M15 10.2c4 0 6 .8 6 1.8s-2 1.8-6 1.8M9 9h6v5.5H9zM10.6 11.8a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0-2.8 0zM12 16.8v3M9.6 16.5l-1.3 2.6M14.4 16.5l1.3 2.6",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "skor": [
    [
      "g",
      {
        "transform": "translate(4.2 -4.2)"
      },
      [
        [
          "path",
          {
            "d": "M3 17v-4.5c0-1 .8-1.8 1.8-1.8H7l1.3 1.6c.5.6 1.2.9 2 .9H12c2.2 0 4 1.1 4.8 2.8l.5 1z",
            "fill": "var(--ikon-yta, #f6ead6)"
          },
          []
        ],
        [
          "path",
          {
            "d": "M2.5 17h15.3v1.2a.8.8 0 0 1-.8.8H3.3a.8.8 0 0 1-.8-.8z",
            "fill": "var(--ikon-yta-2, #ecc28f)"
          },
          []
        ],
        [
          "path",
          {
            "d": "M3 12.6h1.6v3H3z",
            "fill": "var(--ikon-accent, #e8a33d)"
          },
          []
        ],
        [
          "path",
          {
            "d": "M3 17v-4.5c0-1 .8-1.8 1.8-1.8H7l1.3 1.6c.5.6 1.2.9 2 .9H12c2.2 0 4 1.1 4.8 2.8l.5 1zM2.5 17h15.3v1.2a.8.8 0 0 1-.8.8H3.3a.8.8 0 0 1-.8-.8zM9.6 12.9l.9-1.1M11.6 13.4l.8-1.2",
            "fill": "none",
            "stroke": "var(--ikon-linje, #5a4a3a)",
            "strokeWidth": "1.5",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ]
      ]
    ],
    [
      "path",
      {
        "d": "M3 17v-4.5c0-1 .8-1.8 1.8-1.8H7l1.3 1.6c.5.6 1.2.9 2 .9H12c2.2 0 4 1.1 4.8 2.8l.5 1z",
        "fill": "var(--ikon-yta, #f6ead6)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M2.5 17h15.3v1.2a.8.8 0 0 1-.8.8H3.3a.8.8 0 0 1-.8-.8z",
        "fill": "var(--ikon-yta-2, #ecc28f)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M3 12.6h1.6v3H3z",
        "fill": "var(--ikon-accent, #e8a33d)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M3 17v-4.5c0-1 .8-1.8 1.8-1.8H7l1.3 1.6c.5.6 1.2.9 2 .9H12c2.2 0 4 1.1 4.8 2.8l.5 1zM2.5 17h15.3v1.2a.8.8 0 0 1-.8.8H3.3a.8.8 0 0 1-.8-.8zM9.6 12.9l.9-1.1M11.6 13.4l.8-1.2",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "stavar": [
    [
      "path",
      {
        "d": "M6.7 2.5h2.6l.5 4H7.2zM12.7 2.5h2.6l.5 4h-2.6z",
        "fill": "var(--ikon-yta-2, #ecc28f)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M8.6 18.3h3.2v1.1H8.6zM14.6 18.3h3.2v1.1h-3.2z",
        "fill": "var(--ikon-accent, #e8a33d)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M6.7 2.5h2.6l.5 4H7.2zM12.7 2.5h2.6l.5 4h-2.6zM8.5 6.5l2.2 15M14.5 6.5l2.2 15M8.6 18.3h3.2M14.6 18.3h3.2",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "termos": [
    [
      "path",
      {
        "d": "M8 8h8v11.5a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 8 19.5z",
        "fill": "var(--ikon-yta, #f6ead6)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M7.5 3.5h9v4.5h-9z",
        "fill": "var(--ikon-yta-2, #ecc28f)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M8 12.5h8v3H8z",
        "fill": "var(--ikon-accent, #e8a33d)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M8 8h8v11.5a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 8 19.5zM7.5 3.5h9v4.5h-9zM8 12.5h8M8 15.5h8M10.5 5.7h3",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "vattenrening": [
    [
      "path",
      {
        "d": "M8 10h8v10a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1z",
        "fill": "var(--ikon-yta, #f6ead6)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M8.6 5h6.8v5H8.6z",
        "fill": "var(--ikon-yta-2, #ecc28f)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M8 10h8v10a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1zM8.6 5h6.8v5H8.6zM8.6 6.7h6.8M8.6 8.4h6.8M8 15.2c1.3-.8 2.7.8 4 0s2.7-.8 4 0",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "back": [
    [
      "path",
      {
        "d": "M13 3h2c-.3 2.2-2.4 3.4-2.4 5.4 0 2.4 4.4 3.8 4.4 7.2 0 2.2-1 3.8-1.5 5.4H6.8c.9-1.8 3.4-3 3.4-5.3S7 12.1 7 9.2C7 6.4 11.4 5 13 3z",
        "fill": "var(--ikon-yta, #f6ead6)"
      },
      []
    ],
    [
      "circle",
      {
        "cx": "18.6",
        "cy": "11",
        "r": "1.4",
        "fill": "var(--ikon-yta-2, #ecc28f)"
      },
      []
    ],
    [
      "circle",
      {
        "cx": "4.8",
        "cy": "17.5",
        "r": "1.4",
        "fill": "var(--ikon-yta-2, #ecc28f)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M13 3h2c-.3 2.2-2.4 3.4-2.4 5.4 0 2.4 4.4 3.8 4.4 7.2 0 2.2-1 3.8-1.5 5.4H6.8c.9-1.8 3.4-3 3.4-5.3S7 12.1 7 9.2C7 6.4 11.4 5 13 3zM11 8c-1.2.9-1.4 2.1-.4 3.4M13 15.4c.7 1 .6 2.2-.3 3.2",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ],
    [
      "circle",
      {
        "cx": "18.6",
        "cy": "11",
        "r": "1.4",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ],
    [
      "circle",
      {
        "cx": "4.8",
        "cy": "17.5",
        "r": "1.4",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "deltagare": [
    [
      "circle",
      {
        "cx": "12",
        "cy": "12",
        "r": "9",
        "fill": "var(--ikon-yta, #f6ead6)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M6.2 18.6c1.2-2.5 3.2-3.8 5.8-3.8s4.6 1.3 5.8 3.8A8.9 8.9 0 0 1 12 21a8.9 8.9 0 0 1-5.8-2.4z",
        "fill": "var(--ikon-yta-2, #ecc28f)"
      },
      []
    ],
    [
      "circle",
      {
        "cx": "12",
        "cy": "9.8",
        "r": "3",
        "fill": "var(--ikon-accent, #e8a33d)"
      },
      []
    ],
    [
      "circle",
      {
        "cx": "12",
        "cy": "12",
        "r": "9",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ],
    [
      "circle",
      {
        "cx": "12",
        "cy": "9.8",
        "r": "3",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ],
    [
      "path",
      {
        "d": "M6.2 18.6c1.2-2.5 3.2-3.8 5.8-3.8s4.6 1.3 5.8 3.8",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "fjall": [
    [
      "path",
      {
        "d": "M2 20L8.5 8l3.5 5.5L15 9l7 11z",
        "fill": "var(--ikon-yta-2, #ecc28f)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M8.5 8l-2.7 5 1.6-1 1.2 1.1 1.5-1.2.9.6z",
        "fill": "var(--ikon-yta, #f6ead6)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M15 9l-2.3 3.4 1.3-.8 1 1 1.2-1 1.2.6z",
        "fill": "var(--ikon-yta, #f6ead6)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M2 20L8.5 8l3.5 5.5L15 9l7 11zM5.8 13l1.6-1 1.2 1.1 1.5-1.2.9.6M12.7 12.4l1.3-.8 1 1 1.2-1 1.2.6",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "fjallbjork": [
    [
      "g",
      {
        "transform": "rotate(-25 12 12)"
      },
      [
        [
          "path",
          {
            "d": "M12 2.5c2.9 2.9 6.2 6.2 6.2 10.3A6.2 6.2 0 0 1 12 19a6.2 6.2 0 0 1-6.2-6.2C5.8 8.7 9.1 5.4 12 2.5z",
            "fill": "var(--ikon-yta-2, #ecc28f)"
          },
          []
        ],
        [
          "path",
          {
            "d": "M12 2.5c2.9 2.9 6.2 6.2 6.2 10.3A6.2 6.2 0 0 1 12 19z",
            "fill": "var(--ikon-yta, #f6ead6)"
          },
          []
        ],
        [
          "path",
          {
            "d": "M12 2.5c2.9 2.9 6.2 6.2 6.2 10.3A6.2 6.2 0 0 1 12 19a6.2 6.2 0 0 1-6.2-6.2C5.8 8.7 9.1 5.4 12 2.5zM12 22V6.5M12 11l2.6-2M12 14.3l3.7-2.5M12 11l-2.6-2M12 14.3l-3.7-2.5",
            "fill": "none",
            "stroke": "var(--ikon-linje, #5a4a3a)",
            "strokeWidth": "1.5",
            "strokeLinecap": "round",
            "strokeLinejoin": "round"
          },
          []
        ]
      ]
    ]
  ],
  "hund": [
    [
      "path",
      {
        "d": "M7.5 10c0-3 2-5 4.5-5s4.5 2 4.5 5v4.5c0 3-2 5-4.5 5s-4.5-2-4.5-5z",
        "fill": "var(--ikon-yta, #f6ead6)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M7.8 7.2C6 6.5 4 7.5 4 10s.9 4 2.3 4.2l1.2-4z",
        "fill": "var(--ikon-yta-2, #ecc28f)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M16.2 7.2C18 6.5 20 7.5 20 10s-.9 4-2.3 4.2l-1.2-4z",
        "fill": "var(--ikon-yta-2, #ecc28f)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M9.3 16.2c0-1.5 1.2-2.4 2.7-2.4s2.7.9 2.7 2.4-1.2 3.3-2.7 3.3-2.7-1.8-2.7-3.3z",
        "fill": "var(--ikon-yta-2, #ecc28f)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M7.5 10c0-3 2-5 4.5-5s4.5 2 4.5 5v4.5c0 3-2 5-4.5 5s-4.5-2-4.5-5zM7.8 7.2C6 6.5 4 7.5 4 10s.9 4 2.3 4.2l1.2-4zM16.2 7.2C18 6.5 20 7.5 20 10s-.9 4-2.3 4.2l-1.2-4zM9.3 16.2c0-1.5 1.2-2.4 2.7-2.4s2.7.9 2.7 2.4-1.2 3.3-2.7 3.3-2.7-1.8-2.7-3.3zM10 11.3h.01M14 11.3h.01M11.2 15.4h1.6l-.8.9zM12 16.3v1",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "inbjudan": [
    [
      "path",
      {
        "d": "M2.5 7.5H17v11H2.5z",
        "fill": "var(--ikon-yta, #f6ead6)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M2.5 7.5H17v11H2.5zM2.5 7.5l7.25 5.5L17 7.5",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ],
    [
      "circle",
      {
        "cx": "18.5",
        "cy": "6.5",
        "r": "3.5",
        "fill": "var(--ikon-accent, #e8a33d)"
      },
      []
    ],
    [
      "circle",
      {
        "cx": "18.5",
        "cy": "6.5",
        "r": "3.5",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ],
    [
      "path",
      {
        "d": "M18.5 4.9v3.2M16.9 6.5h3.2",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "lagereld": [
    [
      "path",
      {
        "d": "M4.6 21.2l-.8-2.6 15-4.2.8 2.6z",
        "fill": "var(--ikon-yta-2, #ecc28f)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M19.4 21.2l.8-2.6-15-4.2-.8 2.6z",
        "fill": "var(--ikon-yta-2, #ecc28f)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M4.6 21.2l-.8-2.6 15-4.2.8 2.6zM19.4 21.2l.8-2.6-15-4.2-.8 2.6z",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ],
    [
      "path",
      {
        "d": "M12 3c1.5 2.7 4.5 4.5 4.5 8.2a4.5 4.5 0 0 1-9 0c0-2 1-3.2 2-4.2.2 1.6.8 2.4 1.6 2.7C10.6 7.6 11 5.2 12 3z",
        "fill": "var(--ikon-accent, #e8a33d)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M12 9.8c1 1.2 2 2.2 2 3.5a2 2 0 0 1-4 0c0-1.3 1-2.3 2-3.5z",
        "fill": "var(--ikon-yta, #f6ead6)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M12 3c1.5 2.7 4.5 4.5 4.5 8.2a4.5 4.5 0 0 1-9 0c0-2 1-3.2 2-4.2.2 1.6.8 2.4 1.6 2.7C10.6 7.6 11 5.2 12 3zM12 9.8c1 1.2 2 2.2 2 3.5a2 2 0 0 1-4 0c0-1.3 1-2.3 2-3.5z",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "norrsken": [
    [
      "path",
      {
        "d": "M2.5 11c2.5-3.2 4.5-1.4 6.5-3.6S13 3.5 15.5 5.5 19 7 21.5 5v5c-2.5 2-4.2.6-6-.4s-4.5 0-6 2.2-4.5 1.4-7 4.2z",
        "fill": "var(--ikon-yta-2, #ecc28f)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M2 21v-1.5c3-2 6-2.5 10-1.2 3.5-1.3 7-.8 10 1.2V21z",
        "fill": "var(--ikon-yta, #f6ead6)"
      },
      []
    ],
    [
      "circle",
      {
        "cx": "5.5",
        "cy": "5",
        "r": ".9",
        "fill": "var(--ikon-accent, #e8a33d)"
      },
      []
    ],
    [
      "circle",
      {
        "cx": "19",
        "cy": "14.5",
        "r": ".9",
        "fill": "var(--ikon-accent, #e8a33d)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M2.5 11c2.5-3.2 4.5-1.4 6.5-3.6S13 3.5 15.5 5.5 19 7 21.5 5v5c-2.5 2-4.2.6-6-.4s-4.5 0-6 2.2-4.5 1.4-7 4.2zM2 21v-1.5c3-2 6-2.5 10-1.2 3.5-1.3 7-.8 10 1.2V21z",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "ren": [
    [
      "path",
      {
        "d": "M9 10.8L6 9.8l1.4 2.6z",
        "fill": "var(--ikon-yta-2, #ecc28f)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M15 10.8l3-1-1.4 2.6z",
        "fill": "var(--ikon-yta-2, #ecc28f)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M8.8 10h6.4l-1 7.4c-.3 1.8-1.2 2.8-2.2 2.8s-1.9-1-2.2-2.8z",
        "fill": "var(--ikon-yta, #f6ead6)"
      },
      []
    ],
    [
      "circle",
      {
        "cx": "12",
        "cy": "18.4",
        "r": "1.1",
        "fill": "var(--ikon-accent, #e8a33d)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M8.8 10h6.4l-1 7.4c-.3 1.8-1.2 2.8-2.2 2.8s-1.9-1-2.2-2.8zM9 10.8L6 9.8l1.4 2.6zM15 10.8l3-1-1.4 2.6zM10.3 10C9.3 7 7.8 5 5.8 3.5M8.1 6.3L5.2 6.6M9.3 8l-.9-3.5M13.7 10c1-3 2.5-5 4.5-6.5M15.9 6.3l2.9.3M14.7 8l.9-3.5M10.6 13.4h.01M13.4 13.4h.01",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ],
  "sno": [
    [
      "path",
      {
        "d": "M12 12V3M10.2 4.8l1.8 1.7 1.8-1.7",
        "transform": "rotate(0 12 12)",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ],
    [
      "path",
      {
        "d": "M12 12V3M10.2 4.8l1.8 1.7 1.8-1.7",
        "transform": "rotate(60 12 12)",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ],
    [
      "path",
      {
        "d": "M12 12V3M10.2 4.8l1.8 1.7 1.8-1.7",
        "transform": "rotate(120 12 12)",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ],
    [
      "path",
      {
        "d": "M12 12V3M10.2 4.8l1.8 1.7 1.8-1.7",
        "transform": "rotate(180 12 12)",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ],
    [
      "path",
      {
        "d": "M12 12V3M10.2 4.8l1.8 1.7 1.8-1.7",
        "transform": "rotate(240 12 12)",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ],
    [
      "path",
      {
        "d": "M12 12V3M10.2 4.8l1.8 1.7 1.8-1.7",
        "transform": "rotate(300 12 12)",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ],
    [
      "path",
      {
        "d": "M12 9.5l2.2 1.25v2.5L12 14.5l-2.2-1.25v-2.5z",
        "fill": "var(--ikon-accent, #e8a33d)"
      },
      []
    ],
    [
      "path",
      {
        "d": "M12 9.5l2.2 1.25v2.5L12 14.5l-2.2-1.25v-2.5z",
        "fill": "none",
        "stroke": "var(--ikon-linje, #5a4a3a)",
        "strokeWidth": "1.5",
        "strokeLinecap": "round",
        "strokeLinejoin": "round"
      },
      []
    ]
  ]
} as const satisfies Record<string, readonly Ikonelement[]>

/** Omgången varje ikon kom i: 1 meny, 2 tur, 3 mat, 4 utrustning, 5 natur och folk. */
export const IKONOMGANG = {
  "dagbok": 1,
  "matplanering": 1,
  "mina-turer": 1,
  "mitt-forrad": 1,
  "oversikt": 1,
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
