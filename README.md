# LGB Planer

Eine touch-optimierte Webanwendung zur groben Planung von Lehmann-Gartenbahn-Anlagen auf iPhone, iPad und Desktop.

## Funktionen

- LGB-Gleiskatalog mit Geraden, Radien, Weichen und Sondergleisen
- Platzieren und Verschieben per Maus oder Touch
- Drehung, Stromkreis- und Gleiskennzeichnung pro Element
- Indoor- und Outdoor-Planungsmodus
- Grobmodellierung mit Wiese, Erde, Wasser, Hügeln und Gebäuden
- Automatische lokale Speicherung sowie JSON-Import und -Export

Die Plandaten bleiben ausschließlich im `localStorage` des jeweiligen Browsers.
Es werden keine Projektdaten an einen Server übertragen.

## Entwicklung

```bash
npm install
npm run dev
```

Produktions-Build und Lint:

```bash
npm run build
npm run lint
```

## GitHub Pages

Der Workflow `.github/workflows/deploy-pages.yml` veröffentlicht jeden Stand
des `main`-Branches unter
`https://andikrueger.github.io/LGB-Planung/`.

Im Repository muss unter **Settings → Pages → Build and deployment** als Quelle
**GitHub Actions** ausgewählt sein.
