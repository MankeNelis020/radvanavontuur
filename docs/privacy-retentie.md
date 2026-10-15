# Bewaartermijnen

| Gegeven | Wie | Hoe lang | Opmerking |
| --- | --- | --- | --- |
| Gastavontuur | Browsercookie plus server | 30 dagen als richtlijn | Nog geen automatische schoonmaakjob. Wis `.data/store.json` of de sessierijen. |
| Accountavontuur | Supabase, gekoppeld aan `auth.users` | Tot het account weg is | Verwijderen van de gebruiker zet `user_id` op null of wist het profiel via cascade waar de sleutel dat afdwingt. |
| Specifieke behoeften | Alleen in de sessie | Met de sessie | Niet in de deellink, niet in analytics, niet naar partners. |
| Startpunt | Alleen in de sessie | Met de sessie | Niet in de deellink. |
| Analytics | Na toestemming | 14 maanden als richtlijn | Geen latitude of longitude. |
| Review | Account | Tot het account weg is | Partners hebben geen verwijderrecht. |
| Zelf bevestigd bezoek | Account | Tot het account weg is | Een Maps-klik zet alleen `route_opened`. |

Een bezoek dat iemand zelf aanvinkt is geen onafhankelijke verificatie. De interface zegt dat ook.
