# Selectiekansen

Een bestemming doet mee of niet. Dat is binair en gaat vóór elke score.

Van wat overblijft is de geschiktheid `s` een getal tussen 0 en 1:

- 30% overlap met interesses
- 18% afstand tot het gekozen tempo
- 18% afstand tot rust of avontuur
- 14% binnen, buiten of allebei
- 12% verrassingsniveau tegenover hoe bekend de plek is
- 8% voorkeur voor gratis, als die is gevraagd

Het weer vermenigvuldigt `s`. Lichte regen verlaagt een buitenplek, maar haalt haar er niet af. Stevige regen of onweer wel, als de plek alleen buiten is.

Het selectiegewicht is:

`w = 0,05 + s^1,6`

De kans is:

`P(i) = w_i / som(w)`

De vloer van 0,05 zorgt dat een geldige plek nooit kans nul heeft. Een betere match weegt wel zwaarder. Dit is dus geen gelijke loting. Het rad tekent die gewichten, niet gelijke taartpunten, tenzij de gewichten toevallig gelijk zijn.

De shortlist bevat maximaal twaalf plekken. Kansen gelden binnen die shortlist, niet binnen heel Nederland. Dat staat in de toelichting bij de uitslag.

De toevalsgenerator is mulberry32 met een FNV-achtige hash van de sessie-seed. Dezelfde seed en dezelfde invoer geven dezelfde winnaar. Tests gebruiken die eigenschap. Een herkansing krijgt een nieuwe seed en laat de vorige bestemming weg. De reden verlaagt het gewicht van dezelfde categorie of van een onhandige afstand. Ze mag geen harde grens breken.

Is de kandidatenlijst leeg, dan is er geen uitslag. De app verzint er geen.
