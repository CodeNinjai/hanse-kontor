# Hanse-Kontor

Eine Wirtschaftssimulation für einen Spieler in **Sundhaven**, einer kleinen Hansestadt an der Küste, anno 1372. Die Stadt ist eine belebte Szene mit Hafen: Schiffe laufen ein, Karawanen lagern vor dem Tor, Bürger gehen ihren Wegen nach, nachts leuchten die Fenster. Jedes Gebäude und jede Person lässt sich anklicken und öffnet ein eigenes Spielsystem: Handel, Betriebe, Besitz, Geldverleih, Politik, Kirche, Korruption.

Reines HTML, CSS und JavaScript ohne Build-Schritt: `index.html` öffnen und spielen. Oberfläche auf Deutsch und Englisch umschaltbar.

*A single-player economic simulation set in a small Hanseatic coastal town. Click buildings and people to trade, build, lend, bribe, preach and scheme your way to becoming Lord of Sundhaven. No build step; open `index.html`. UI in German and English.*

## Spielsysteme

| Ort | Was du dort tun kannst |
| --- | --- |
| **Hafen** | Mit einlaufenden Schiffen handeln (kaufen, verkaufen, nachts schmuggeln), eigene Koggen beladen und auf Handelsfahrt schicken |
| **Stadttor** | Karawanen vom Landweg (Köln, Umland) bedienen |
| **Marktplatz** | An die Bürger verkaufen, Stadtwaren kaufen, Marktstände pachten; die Bürger nehmen täglich nur begrenzte Mengen ab |
| **Kontor & Lager** | Lagerbestand, Kassenbuch mit allen Einnahmequellen der letzten 30 Tage |
| **Rathaus** | Sechs Ratsherren mit Wohlwollen und Fraktion, Geschenke, Anträge zu Zoll, Marktgebühr, Wucherverbot, Stapelrecht, Badehausverbot und Monopolen, Kandidatur als Ratsherr und Bürgermeister, städtische Vorhaben stiften, Zollpacht kaufen, Bestechungsgelder als Amtsträger |
| **Kirche** | Spenden, Ablass gegen Verdacht, Stiftungen, wöchentliche Lieferungen von Wachs und Wein, Predigten für dich oder gegen Konkurrenten, Bischofsbesuch |
| **Zollhaus** | Zöllner beschenken für Nachlass, Schmuggelbilanz |
| **Gildehaus** | Beitritt, Lizenzen für Werkstätten |
| **Werkstattgrundstücke** | Brauerei, Räucherei, Weberei, Schmiede, Salzsiederei mit Rohstoffbedarf und Löhnen |
| **Wohnhäuser** | Kaufen, ausbauen, vermieten, nach Bränden reparieren |
| **Taverne** | Gerüchte über kommende Schiffe, Würfelspiel, Spitzel und Schläger anheuern, Taverne kaufen |
| **Geldwechsler** | Darlehen aufnehmen, Bürgern Geld leihen (Zins gegen Ausfallrisiko) |
| **Vogtei** | Verdacht, Ermittlungen, Bestechung, Prozess |
| **Werft, Fischer, Badehaus** | Koggen und Fischerboote bauen, Fisch vom Steg kaufen, Badehaus als Einnahmequelle |
| **Passanten** | Bettler, Mönche, Kaufleute mit Tipps, Fischer mit Angeboten, Wachen, Klatsch über den Rat |

Dazu Stadtereignisse (Hungersnot, Pest, Brand, Vitalienbrüder, Sturm, Jahrmarkt, Sonderabgabe), Kirchenfeste mit Nachfragespitzen, drei Konkurrenten, Ränge, Autosave im Browser sowie Export und Import als JSON.

**Ziel:** Bürgermeister werden, 500.000 Mark Reinvermögen anhäufen und reicher sein als alle Konkurrenten. Nach 60 Tagen mit leerer Kasse ist das Spiel verloren.

## Steuerung

| Taste | Wirkung |
| --- | --- |
| Leertaste | Pause / weiter |
| 1, 2, 3 | Geschwindigkeit |
| N | Einen Tag weiter |

## Projektstruktur

```
index.html      Seitengerüst
css/style.css   Gestaltung
js/data.js      Waren, Herkunftsorte, Betriebe, Personen, Gesetze, Konstanten
js/town.js      Stadtplan: Gebäude, Straßen, Wegenetz, Liegeplätze
js/i18n.js      Sprachtabellen DE/EN
js/game.js      Spielzustand, Wirtschaft, alle Aktionen, Tagestick, Ereignisse
js/scene.js     Canvas-Szene: Gebäude, Schiffe, Passanten, Tag und Nacht
js/ui.js        Seitenleiste, Gebäudemenüs, Dialoge
js/main.js      Spielschleife, Speichern/Laden
```

Die Spiellogik (`data`, `town`, `i18n`, `game`) ist DOM-frei und lässt sich headless in Node simulieren.
