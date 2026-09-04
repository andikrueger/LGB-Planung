# LGB Planer

Eine touch-optimierte Webanwendung zur groben Planung von Lehmann-Gartenbahn-Anlagen auf iPhone, iPad und Desktop.

## Funktionen

- Vollständiger aktueller LGB-Gleiskatalog mit Geraden, R1/R2/R3/R5-Radien,
  Hand- und Elektroweichen, Kreuzungen, Funktionsgleisen und Prellböcken
- Platzieren und Verschieben per Maus oder Touch
- Drehung, Stromkreis- und Gleiskennzeichnung pro Element
- Indoor- und Outdoor-Planungsmodus
- Frei einstellbare Planfläche mit exakten Breiten- und Höhenangaben in Metern
- Zoom von 25 % bis 200 % mit verschiebbarer Planfläche
- Grobmodellierung mit Wiese, Erde, Wasser, Hügeln und Gebäuden
- Automatische lokale Speicherung sowie JSON-Import und -Export

Die Plandaten bleiben ausschließlich im `localStorage` des jeweiligen Browsers.
Es werden keine Projektdaten an einen Server übertragen.

Die Gleisdaten basieren auf der
[offiziellen LGB-Gleissystemübersicht](https://www.lgb.com/fileadmin/media/lgb/produkte/produktinformationen/LGB_Gleissystem-Info.pdf)
und der [LGB-Produktdatenbank](https://www.lgb.com/service/product-database)
(Stand September 2026). Zubehör ohne eigene planbare Gleisgeometrie, etwa
Schienenverbinder, Schwellenbänder und Weichenantriebe, ist nicht Bestandteil
der Planfläche.

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
