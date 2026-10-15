# API-kosten

Prijzen van Google, Supabase, Vercel en Open-Meteo veranderen. Dit document telt eerst verzoeken. Bedragen daaronder zijn overgenomen van publieke pagina's op 15 oktober 2026 en moeten voor een begroting opnieuw worden gelezen. Niets hiervan is een offerte.

## Verzoeken per draai, als alles geconfigureerd is

| Bron | Per draai | Waarom zo weinig |
| --- | --- | --- |
| Google Places Nearby Search | 1 | Eén cirkel, hoogstens 10 resultaten, vaste field mask. |
| Google Routes | 0 tot 4 | Alleen de sterkste kandidaten, en alleen als er een vervoermiddel is. |
| Open-Meteo | hoogstens 12 | Alleen de shortlist. Zelfde afgeronde coördinaat en uur blijven 30 minuten in het geheugen. |
| Google Sheets | 0 | Sync is een beheeractie, geen onderdeel van een draai. |
| Supabase | 1 schrijfactie, later een paar leesacties | De motor leest de catalogus uit de code zolang er geen sheet-import is. |

Een herkansing doet deze reeks opnieuw. Lunch en een tussenstop doen dat niet: die gebruiken de catalogus en hemelsbrede afstand.

## Volume

| Draaien per maand | Places | Routes, bovengrens | Weer, bovengrens |
| --- | --- | --- | --- |
| 1.000 | 1.000 | 4.000 | 12.000 |
| 10.000 | 10.000 | 40.000 | 120.000 |
| 100.000 | 100.000 | 400.000 | 1.200.000 |

De weer-cache en het feit dat veel draaien dezelfde stad en hetzelfde uur delen, maken het echte weer-aantal lager. Hoeveel lager hangt af van spreiding. Dat is hier niet gemodelleerd.

## Google, gelezen op 15 oktober 2026

Bron: [Google Maps Platform core services pricing list](https://developers.google.com/maps/billing-and-pricing/pricing).

De tabel noemde onder meer:

- Nearby Search Enterprise, SKU `772E-9975-BE34`: vrije kap 1.000, daarna 35,00 USD in de eerste betaalde staffel. Openingstijden vallen volgens de Places-documentatie in de Enterprise-SKU. Daarom vraagt de field mask ze alleen aan als de sleutel er is.
- Compute Routes Essentials, SKU `9EFF-679A-9B16`: vrije kap 10.000, daarna 5,00 USD in de eerste betaalde staffel.

De pagina toont staffelprijzen. Bevestig in de console of het bedrag per 1.000 gebeurtenissen is voordat je het maal het volume doet. Routes met `TRAFFIC_UNAWARE` en alleen duur plus afstand is bedoeld voor Essentials. Transit of extra velden kunnen een duurdere SKU raken. Ook dat moet in de console gecontroleerd worden.

Een ruwe lezing, als de staffelprijs per 1.000 geldt en niemand de vrije kap deelt met andere producten: 10.000 draaien kosten dan vooral Places (ongeveer 9.000 betaalde verzoeken na de kap). 100.000 draaien zitten diep in de staffels. Reken dit opnieuw met de prijscalculator. Dit is geen belofte van een maandbedrag.

## Open-Meteo

De gebruikte endpoint is `https://api.open-meteo.com/v1/forecast`. De data vragen naamsvermelding. Commercieel gebruik van de gratis API is niet vanzelf toegestaan. Rond 100.000 draaien hoort hier een eigen plan of een andere weerbron, vóór livegang. Zie [open-meteo.com](https://open-meteo.com/).

## Supabase en Vercel

Geen bedragen in dit document. Kijk op de prijspagina's van Supabase en Vercel op het moment van lanceren. De database blijft klein: één sessierij per draai, geen ruwe GPS-historie in analytics.

## Wat de app expres niet doet

- Geen Places-details voor elke catalogusrij.
- Geen route voor elke kandidaat.
- Geen sheet-lezing tijdens het draaien.
- Geen live advertenties.
