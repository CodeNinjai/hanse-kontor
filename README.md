# Hanse-Kontor

Eine Wirtschaftssimulation für einen Spieler in **Sundhaven**, einer Hansestadt auf einer Halbinsel, anno 1372: Altstadt mit Markt und Kirche, Neustadt hinter der alten Nordmauer, Hafenviertel am Südkai, Handwerkerviertel mit Kloster und Spital im Osten, Bollwerk im Südosten, Fischerdorf am Strand, ein Dorf im Umland und eine unregelmäßige Küste mit Buchten und Landzungen. Das Bild füllt immer den ganzen verfügbaren Platz: Der Canvas hat kein festes Seitenverhältnis mehr, sondern wird auf die Fenstergröße eingepasst, der Anfangsblick sitzt auf der bebauten Fläche statt auf der ganzen Seekarte, und was darüber hinaus sichtbar wird, ist offene See. Zoomen und Verschieben bleiben frei. Die Stadt ist eine isometrisch gezeichnete, belebte Szene: Koggen laufen an den Stegen ein, Karawanen lagern vor dem Tor, Bürger gehen ihren Wegen nach, die Windmühle dreht sich, nachts leuchten Fenster und Laternen, im Winter liegt Schnee auf den Dächern. Jedes Gebäude und jede Person lässt sich anklicken und öffnet ein eigenes Spielsystem: Handel, Betriebe, Besitz, Geldverleih, Politik, Kirche, Korruption.

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
| **Hafenviertel am Südkai** | Lagerhallen und Salzspeicher kaufen und selbst nutzen oder vermieten, Fischmarkt ohne Marktgebühr, Spelunke „Zum Nassen Hund“ mit Schwarzmarkt, Hehler, bestochener Hafenwache und Matrosen, Hafenmeisterei mit Hafenbuch, Liegezeitverlängerung und neuem Liegeplatz |
| **Handwerkerviertel** | Zunfthaus (Beitritt, Lehrlinge, Ältermann-Titel) und zehn Betriebe: Bäckerei, Fleischerei, Böttcherei, Seilerei, Segelmacherei, Fischräucherei, Gerberei, Töpferei, Färberei, Spelunke – jeder mit Tageseinnahmen, Ausbaustufen und eigenen Nebenwirkungen |
| **Kloster, Spital, Lateinschule** | Klosterladen mit Bier und Wachs, Reliquienstiftung, Skriptorium mit Handelsbriefen, Spitalstiftungen für Ruf und Frömmigkeit, Schulstiftungen für Einfluss |
| **Fischerdorf vor der Mauer** | Fang direkt vom Strand kaufen |
| **Neustadt** | Marstall, Kornspeicher, Stadtwaage mit Waagepacht, Goldschmied, Apotheke, Kapelle St. Gertrud (Schiffssegen), Herberge |
| **Bollwerk** | Zeughaus mit Bürgermiliz, Holzhof, Lotsenhaus |

Dazu Stadtereignisse (Hungersnot, Pest, Brand, Vitalienbrüder, Sturm, Jahrmarkt, Sonderabgabe), Kirchenfeste mit Nachfragespitzen, drei Konkurrenten, Ränge, Autosave im Browser sowie Export und Import als JSON.

**Ziel:** Einen der sechs Titel erringen (siehe Spieltiefe), reicher werden als die Konkurrenten und die Partie nach 10, 20 oder 30 Jahren mit einer guten Chronik beenden. Nach 60 Tagen mit leerer Kasse ist das Spiel verloren.

## Spieltiefe

- **Sechs Wege, sechs Titel:** Handelsfürst, Bürgermeister auf Lebenszeit, Reeder der Hanse, Stifter von St. Nikolai, Ältermann der Zünfte, Herr der Nacht – jeweils mit sichtbaren Bedingungen in der Übersicht. Die Partie läuft 10, 20 oder 30 Jahre und endet mit der Chronik samt Nachruf; danach kann man weiterspielen.
- **Fraktionsansehen:** Patrizier, Kaufleute, Zünfte und Kirche urteilen getrennt. Gesetze, Geschenke, Stiftungen, Betriebe und krumme Geschäfte verschieben das Ansehen; Wahlen brauchen die Fraktionen, Geschenke werden billiger, wo man geschätzt wird.
- **Rivalen als Akteure:** Everd Kruse (Kaufmann), Wessel Bracht (Reeder) und Katharina Detmers (Stifterin) kaufen Häuser, Betriebe, Speicher und Schiffe, ziehen in den Rat, stellen Anträge, schwärzen an, drücken Preise oder helfen mit Tipps und Fürsprache. Treffen und Bündnisse in der Taverne, Kauf von Rivalenbesitz nur bei guter Haltung.
- **Aufträge:** Rat, Gilde, Kloster, Spelunke und Hafenmeister hängen befristete Liefer- und Fahrtaufträge aus, mit Lohn, Ansehen und Strafen.
- **Ereignisketten:** Die Vitalienbrüder (Hehlerware oder Warnung, Kaperfahrt selbst anführen) und das Pestjahr (Spital, Hafensperre, Prozession oder Flucht) mit Entscheidungen und Folgen.
- **Seefahrt:** Schnigge, Kogge und Holk, bis zu fünf Schiffe, Kapitäne mit Eigenschaften, Konvois, Fernkontore in Lübeck, Brügge und Bergen; Produktionskette Tuch → Feintuch in der Färberei, Meister in Betrieben.
- **Familie:** Heiratsangebote mit Mitgift und Bündnis, Kinder mit Eigenschaften, Erbe übernimmt nach dem Tod des Kaufmanns – ohne Erben endet die Chronik.
- **Bischofsstreit und Hansetag:** Zwei weitere Ketten. Der Bischof verlangt den Zehnt: zahlen, zum Rat stehen oder vermitteln, sonst Interdikt mit geschlossenen Kirchen; danach Vergleich oder Zehntpacht. Der Hansetag lädt nach Lübeck: selbst fahren, einen Verbündeten schicken oder ablehnen, dann verhandeln um das Privileg des zollfreien Handels.
- **Ämter der Stadt:** Als Bürgermeister besetzt du Zöllner, Hafenmeister, Vogt und Waagemeister mit eigenen Leuten oder mit Kandidaten der Rivalen; ein Amt hält ein Jahr, ein Prozess kostet alle.
- **Kirchenweg sichtbar:** Bruderschaft mit Mitgliedern, Beiträgen und jährlicher Prozession über den Markt; Wallfahrt mit mehr Besuchern und mehr Gefahr; Kirchenbau in Etappen (Seitenschiff, hoher Turm), der mit Gerüst auf der Karte wächst.
- **Fehde:** Ein Ritter kapert Karawanen; Frieden kaufen, die Miliz führen, heimlich Lösegeld zahlen oder abwarten, bis der Landweg wieder frei ist.
- **Gesetzespakete:** Bierziese, Zunftzwang und Bettelordnung als weitere Anträge im Rat, mit Wirkung auf Preise, Rivalenbetriebe, Wohlstand und Fraktionen.
- **Kaperbrief:** Der Rat stellt Kaperbriefe aus; eigene Schiffe fahren ohne Ladung auf Beutefahrt gegen die Vitalienbrüder.
- **Handelsverträge und Wechselbriefe:** Verträge mit Hansestädten holen deren Schiffe öfter und zu besseren Konditionen; beim Geldwechsler legst du Geld sicher oder mit Risiko an.
- **Netzwerk der Unterwelt:** Wer die Spelunke hält, kauft Zöllner, Hafenwache, Vogt und einen Ratsherrn gegen Monatsgeld; jeder Posten senkt das Risiko, und ein aufgeflogener Schmuggel kann das ganze Netzwerk mitreißen.
- **Personal mit Eigenschaften:** Ein Faktor verkauft täglich knappe Ware am Markt und ist tüchtig, gierig oder treu; Meister der Betriebe sind tüchtig, versoffen oder treu (und dann nicht abzuwerben).
- **Eis im Winter:** Bergen, Stockholm und Riga sind im Winter nicht anzulaufen.
- **Unterwelt ausgebaut:** Falschgeld beim Geldwechsler, Erpressung von Rivalen mit Spitzelwissen, und der Freikauf zur Ehrbarkeit, der Verdacht und Vergangenheit tilgt, aber Rückfälle doppelt bestraft. Die Gerberei liefert Leder für Lübeck, Danzig und Köln.
- **Zunftaufstand:** Sinkt das Ansehen bei den Zünften unter 25, ziehen die Handwerker vor das Rathaus: Miliz rufen, vermitteln, den Zug anführen oder die Türen schließen.
- **Bürgerhäuser:** Die 26 Wohnhäuser der Stadt sind bewohnt, jedes mit Familie, Gewerbe, Stand und Stimmung. Sie stehen nur zum Verkauf, wenn ein Haushalt sich verschuldet, wegzieht oder ausstirbt; die Rivalen greifen mit zu. Wer kauft, bekommt Miete und Pflichten: Unterhalt, Brandschaden, Leerstand, halbe Mieten in Pest und Aufruhr. Sechs Häuser machen zum Patrizier und geben Gewicht im Rat.
- **Hafenbild:** Der Südkai ist weit ins Wasser gebaut, damit Gehweg und Ladung nebeneinander Platz haben. Die beiden Stege sind breite Bohlendecks auf Pfählen, an denen die Koggen längsseits festmachen. Auf jedem Steg steht ein Tretradkran mit begehbarem Laufrad und schwenkbarem Ausleger: Er hievt die Last aus dem Rumpf des Schiffes an seinem Liegeplatz, schwenkt sie an Land und setzt sie auf dem Steg ab. Dort wächst ein Stapel aus Kisten, Fässern oder Säcken — welche Ware es ist, entscheidet die Ladung des Schiffes. Jedes Stück hat die Form und die Farbe seiner Ware: Getreide, Salz und Wolle werden zu Säcken, Bier, Wein und Fisch zu Fässern, alles andere zu Kisten — und was am Haken hängt, ist dasselbe Stück, das gleich auf dem Stapel liegt. Sobald sich etwas stapelt, kommen Träger aus den Lagerhäusern am Kai, nehmen sich ein Stück auf die Schulter und tragen es ins Lager. Türmt es sich auf vier Stück, rollt ein Handkarren auf den Steg und nimmt gleich drei mit. Karren stehen frei in der Ebene: Ihr Wagenkasten ist ein gedrehter Quader, dessen vier Seiten nach Tiefe sortiert gezeichnet werden, und beim Abbiegen dreht sich der Karren weich in die neue Fahrtrichtung, statt auf die nächste Achse zu springen. Die Räder sind keine Kreise: Ein stehendes Rad liegt in der Ebene aus Fahrtrichtung und Höhe und wird Punkt für Punkt projiziert, erscheint also als geneigte Ellipse mit Speichen und Nabe. Ist der Steg voll, ruht der Kran. Liegt kein Schiff am Platz, hängt der Haken still über dem Steg. Passanten laufen auf festen Bahnen: Für jede Wegstrecke ist einmal geprüft, welche seitlichen Spuren durchgehend frei von Requisiten, Häusern und Wasser sind, und jeder Passant wählt eine davon. Weil seine Bahn damit eine Gerade bleibt und der Spurwechsel am Knoten weich überblendet wird, kann niemand mehr ruckartig versetzt werden. Die Krone der Kaimauer ist Sperrfläche, damit niemand vorn an der Kante steht. Schiffe am Liegeplatz haben das Segel auf die Rah gegeit und tragen das Wappen ihrer Heimatstadt als Schild am Achterkastell; unter Segel bleibt das Wappen im Tuch. Kisten, Fässer, Netze und Tauwerk säumen die Kaikante.
- **Balancing:** Ein geskripteter Testspieler (`node tools/testspieler.js all 3 20 normal`, Auswertung in `docs/KONZEPT.md`, Abschnitt 7.1) spielt jeden Weg zwanzig Jahre headless durch; Preise, Renditen, Rivalen und Titelbedingungen sind daran abgeglichen. Grob: Händler in Jahr 2, Kaufmann in Jahr 5, Patrizier in Jahr 8, Titel je nach Weg zwischen Jahr 4 und 12.

## Steuerung

- **Karte:** Mausrad oder zwei Finger zoomen, Ziehen verschiebt den Ausschnitt, Doppelklick springt heran; Tasten `+`, `-`, `0` und Pfeiltasten; Schaltflächen unten rechts.

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
js/town.js      Stadtplan in Weltkoordinaten: Gebäude, Straßen, Wegenetz, Stege
js/i18n.js      Sprachtabellen DE/EN
js/game.js      Spielzustand, Wirtschaft, alle Aktionen, Tagestick, Ereignisse
js/iso.js       Isometrische Projektion, Quader, Dächer, Türme, Fenster, Fachwerk
js/scene.js     Szene: Wasser, Boden, Tiefensortierung, Licht, Wetter, Passanten
js/buildings.js Gebäude, Stadtmauer, Bäume, Requisiten, Koggen, Personen
js/paths.js     Titel, Chronik, Fraktionsansehen
js/rivals.js    Rivalen als Akteure
js/contracts.js Auftragsbrett
js/chains.js    Ereignisketten
js/sea.js       Kapitäne, Fernkontore
js/family.js    Heirat, Kinder, Nachfolge
js/offices.js   Ämter der Stadt
js/faith.js     Bruderschaft, Wallfahrt, Kirchenbau
js/deals.js     Handelsverträge, Wechselbriefe, Kaperbrief, Netzwerk, Gesetzeswirkungen
js/staff.js     Faktor, Meister mit Charakter, Falschgeld, Erpressung, Freikauf, Leder
js/burghers.js  Bürgerhäuser: Haushalte, Verkaufsangebote, Mieten, Unterhalt, Patriziertitel
tools/testspieler.js  Geskripteter Testspieler für Balancing-Läufe (Node, ohne Browser)
js/ui.js        Seitenleiste, Gebäudemenüs, Dialoge
js/main.js      Spielschleife, Speichern/Laden
```

Die Spiellogik (`data`, `town`, `i18n`, `game`) ist DOM-frei und lässt sich headless in Node simulieren.
