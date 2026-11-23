# Logotypen

SVG-filerna här är källan till logotypen (från Astra, november 2026). De används som de är, utan ändringar i formerna.

- `minvandring-symbol-green.svg`: symbolen för ljus bakgrund.
- `minvandring-symbol-cream.svg`: symbolen för mörk bakgrund.
- `minvandring-symbol-liten.svg`: förenklat gult fjäll för små storlekar (favicon och appikoner).
- `minvandring-logotyp-ljus.svg` och `minvandring-logotyp-mork.svg`: symbolen med namnet, för ljus och mörk bakgrund.
- `minvandring-app-ikon.svg`: hela symbolen på grön bakgrund, används för PWA-ikonen i 512 px.
- `minvandring-storlekskontroll.svg`: alla filer i 512, 64, 32 och 16 px på ljus och mörk bakgrund.

Symbolerna och logotyperna finns också i `public/brand/`, där appen hämtar dem. Byts en fil här, kopiera den dit.

`ikoner.cjs` gör favicon, apple-touch-icon och PWA-ikonerna i `public/`. Delningsbilden görs med `design/og/og-bild.cjs`.

`build_logo.cjs` gäller den gamla symbolen (den gröna M-formen) och används inte längre.
