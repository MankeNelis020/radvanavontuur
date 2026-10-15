# Architectuur

## Stromen

1. De browser stuurt voorkeuren naar `POST /api/avonturen`.
2. De server haalt de eigen catalogus op en, als er een sleutel is, een korte Google Places-zoekactie.
3. Harde grenzen zonder weer maken een shortlist van hoogstens twaalf plekken. Minstens een deel daarvan mag binnen zijn, zodat regen een museum niet uit de lijst duwt voordat het weer bekend is.
4. Alleen die shortlist krijgt weer (Open-Meteo) en, bij een route-sleutel, hoogstens vier routeberekeningen.
5. `recommend` in `src/domain/engine` kiest de winnaar. Die map importeert geen promoties.
6. De sessie wordt opgeslagen.
7. Pas daarna mag `findPromotionAfterSelection` een actie opzoeken.

Het rad krijgt de winnaar en de gewichten mee. De animatie berekent de eindhoek uit dat segment. Ze loot niet opnieuw.

## Opslag

- Met Supabase: tabel `adventure_sessions`, payload plus indexen. Service-rol alleen op de server.
- Zonder Supabase: `.data/store.json`. De interface zegt dat dit ontwikkelopslag is, geen cloud.

Gastavonturen horen bij een httpOnly-cookie `rva_owner`. Een deellink gebruikt een aparte `shareToken` en laat het startpunt weg.

## Sheets

`POST /api/beheer/sync` met header `x-admin-token` leest vier tabbladen: Destinations, Partners, Promotions, Data Quality. Kapotte rijen worden overgeslagen. Dubbele `destination_id` ook. Partners en acties belanden niet in het object dat de motor ziet.

## Grenzen die de motor wel en niet kent

Wel: straal, leeftijd, bevestigde toegankelijkheid, entree en budget, openingstijden als die er zijn, hemelsbrede vervoersgrens, bezoekduur, binnen of buiten, weer, veiligheid, eerder bezocht.

Niet: partnerstatus, commissie, kortingspercentage, of een actie actief is, advertentiebudget.

Onbekende prijs is niet gratis. Onbekende toegankelijkheid is niet toegankelijk. Onbekende openingstijd is niet “open”. Ontbrekend weer schrapt de lijst niet, maar de tekst zegt dat buiten niet op het weer is gecontroleerd.
