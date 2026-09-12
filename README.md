# Hanse-Kontor

Eine Wirtschaftssimulation im Hansebund, anno 1370, als Browsergame. Ohne Build-Tools, ohne Abhängigkeiten: `index.html` öffnen und losspielen.

*A Hanseatic League trading simulation as a browser game. No build step, no dependencies: open `index.html` and play. The UI is switchable between German and English.*

## Spielen

- Lokal: `index.html` im Browser öffnen (funktioniert direkt von der Festplatte).
- Gehostet: das Verzeichnis auf einen beliebigen statischen Webserver oder GitHub Pages legen.

## Features

- **15 Hansestädte** von London bis Nowgorod auf einer stilisierten Karte von Nord- und Ostsee, **14 Waren** mit eigener Produktions- und Verbrauchsstruktur je Stadt.
- **Dynamische Preise:** Jeder Kauf treibt den Preis, jeder Verkauf senkt ihn. Andere Hansekaufleute gleichen Extreme langsam aus.
- **Vier Schiffstypen** (Schnigge, Kogge, Holk, Kraweel), Werften, Reparatur, Bewaffnung, Stürme und Piraten.
- **Kontore** mit Lager, **Verwalter** (automatischer Kauf/Verkauf zu Grenzpreisen) und **13 Betriebe** (Brauerei, Salzsiederei, Weberei, …), teils mit Rohstoffbedarf.
- **Handelsrouten:** Schiffe fahren Stationen mit Kauf-, Verkaufs-, Lade- und Entlade-Aufträgen endlos ab.
- **Stadtereignisse:** Hungersnot, Pest, Fest, Großbrand, reiche Ernte, Jahrmarkt.
- **Ansehen, Spenden, Ränge** vom Krämer bis zum Eldermann (Siegbedingung), **Bank** mit Darlehen, Bankrott nach 60 Tagen Zahlungsunfähigkeit.
- **Chronik, Statistik** mit Vermögenskurve, **Autosave** im Browser sowie Export/Import als JSON.
- **Deutsch / Englisch** jederzeit umschaltbar.

## Steuerung

| Taste | Wirkung |
| --- | --- |
| Leertaste | Pause / weiter |
| 1, 2, 3 | Geschwindigkeit |
| N | Einen Tag weiter |

## Projektstruktur

```
index.html      Seitengerüst
css/style.css   Gestaltung (Pergament-Look, Karte, Dialoge)
js/data.js      Waren, Städte, Seewege, Schiffe, Betriebe, Ränge
js/geo.js       Projektion, Wegfindung (Dijkstra) über Wegpunkte
js/economy.js   Preise, Stadtereignisse, täglicher Wirtschaftstick
js/game.js      Spielzustand, Aktionen (Handel, Schiffe, Kontore, Bank, Routen), Tick
js/i18n.js      Sprachtabellen DE/EN
js/map.js       SVG-Karte
js/ui.js        Oberfläche, Dialoge, Routen-Editor
js/main.js      Spielschleife, Speichern/Laden
```

Die Spiellogik (`data`, `geo`, `economy`, `game`) ist DOM-frei und lässt sich headless in Node testen.
