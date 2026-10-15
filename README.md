# Rad van Avontuur

Jij bepaalt de grenzen. Het rad bepaalt het avontuur.

Mobiele webapp om met één draai een echt uitje te kiezen. De aanbevelingsmotor ziet geen partnerstatus, commissie, korting of advertentiebudget. Een actie verschijnt pas nadat een bestemming organisch is gekozen.

## Wat er nu werkt

- Snel draaien en uitgebreid draaien, in het Nederlands, zonder account.
- Leeftijden per deelnemer, inclusief maanden onder de twee jaar.
- Locatie delen via de browser, of een plaatsnaam via Open-Meteo of een interne lijst van plaatscentra. Het precieze punt gaat niet mee in een deellink. De ontvanger kan zelf een locatie delen voor de route.
- Straal in kilometers, niet in reistijd.
- Geanimeerd rad dat stopt op de vooraf gekozen bestemming. Geluid staat uit. Minder beweging wordt gerespecteerd.
- Eén herkansing met reden. Een operationele vervanging als iets dicht of onveilig is, telt daar niet mee.
- Lunch en een tussenstop na acceptatie, plus een Google Maps-link.
- Deellink zonder privéstartpunt.
- Weer via Open-Meteo, met een eerlijke status als dat niet lukt.
- Eigen catalogus van echte Nederlandse plekken. Coördinaten komen uit OpenStreetMap. Entreeprijzen en openingstijden blijven onbekend tenzij een bron ze echt levert.
- Optionele Supabase-accounts, reviews na een zelf bevestigd bezoek, favorieten en geschiedenis.
- Google Sheets-synchronisatie, promoties en advertentieplaatsen staan klaar en doen niets tot je ze configureert.

## Wat nog een sleutel nodig heeft

Zonder deze variabelen blijft de app eerlijk: ze verzint geen openingstijden, prijzen of reistijden.

| Variabele | Effect als ze leeg is |
| --- | --- |
| `GOOGLE_MAPS_API_KEY` | Geen Places en geen Routes. Alleen de catalogus en hemelsbrede afstand. |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Geen accounts. Sessies staan in `.data/` op deze server. |
| `GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON`, `GOOGLE_SHEETS_SPREADSHEET_ID`, `ADMIN_SYNC_TOKEN` | Geen sheet-sync. |
| `NEXT_PUBLIC_ADS_ENABLED` | Advertenties blijven een gelabelde placeholder. |

`WEATHER_PROVIDER=fixture` is alleen voor tests. In productie weigert de app dat, tenzij `ALLOW_FIXTURE_PROVIDERS=true`.

## Starten

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Controles

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

De e2e-test verwacht een productiebuild (`npm run build`) en gebruikt bewust testweer.

## Database

De migratie staat in `supabase/migrations/20261015120000_init_schema.sql`.
Row Level Security staat aan. Partner- en promotietabellen hebben geen policy voor `anon` of `authenticated`. De server gebruikt de service-rol en haalt een actie pas op na de selectie.

## Verder lezen

- [Architectuur](docs/architectuur.md)
- [Selectiekansen](docs/aanbeveling.md)
- [API-kosten](docs/api-kosten.md)
- [Bewaartermijnen](docs/privacy-retentie.md)

Coördinaten: © OpenStreetMap-bijdragers, ODbL.
