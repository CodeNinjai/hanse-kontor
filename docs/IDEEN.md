# Ideenkatalog: mehr Spieltiefe für Sundhaven

Stand: 12. Oktober 2026. Dieser Katalog bewahrt die 43 ursprünglichen Ideen; Abschnitt 8 (Umland, Landwirtschaft und Frischware) kam am 12. Oktober hinzu. Ihr [Umsetzungsabgleich](UMSETZUNGSABGLEICH.md) unterscheidet vorhandene Funktionen von offenen Anteilen; der [Ausbauplan](AUSBAUPLAN.md) ergänzt jeden Punkt detailliert und verbindet ihn mit dem Gesamtkonzept. **Ein Entwurf ist keine Implementierung.** Die alten Angaben „klein/mittel/groß“ bleiben als ursprüngliche Einschätzung erhalten; sie berücksichtigen Integration, Migration, Oberfläche und Prüfung nur unvollständig und sind keine belastbare Zeitplanung.

Die Maßstäbe dahinter stammen aus `docs/KONZEPT.md`: Jede Neuerung soll eine **Entscheidung** erzeugen, nicht nur mehr vom Gleichen. Sie soll auf der **Karte sichtbar** werden. Und sie soll mindestens zwei der sechs Wege berühren.

**Ergänzung vom 12. Oktober 2026 – angenommene Minispielideen:** Feilschen, versteckte Fracht, Gerüchte zusammensetzen, Beladung planen, Trinkspiel, Angeln, Bogenschießen und Brettspiel im Gasthof. Zusätzlich sind **Wetten** vorgemerkt. Alle neun Ideen sind im [Konzept mit Spielablauf, Einbindung und Wettregeln](KONZEPT.md#vorgemerkte-minispiele-und-wetten) festgehalten und noch geplant. Das separate Push-your-luck-Würfelspiel „Der letzte Wurf“ ist bereits umgesetzt. Diese Ergänzung erweitert den ursprünglichen Katalog und ersetzt keinen seiner 43 Punkte.

---

## Ursprüngliche Prioritäten, inzwischen neu eingeordnet

Die aktuelle Reihenfolge beginnt mit Orientierung und verständlichen Entscheidungen, danach folgen Beziehungen, gemeinsame Waren-/Wettergrundlagen und darauf aufbauende Erweiterungen. Siehe [Pakete A–G](AUSBAUPLAN.md#reihenfolge-und-fertigstellung). Die folgende Tabelle dokumentiert die frühere Auswahl:

| # | Idee | Warum zuerst | Aufwand |
| --- | --- | --- | --- |
| 1 | **Kapitel je Weg** (Missionen 1.2) | Gibt der Mittelphase Richtung und Geschichte. Erweitert den vorhandenen Einstieg und die Salzgeschichte zu Wegkampagnen. | mittel |
| 2 | **Startszenarien** (Missionen 1.1) | Jede Partie fängt anders an. Benötigt konsistente Startwerte, Eröffnungsmissionen und passende Einführung. | klein |
| 3 | **Sturmflut und Hafenmauer** (Ereignisse 5.1) | Erzeugt Entscheidungen über Lager und Deiche; ein ausbaubarer Hochwasserschutz könnte auf der Karte sichtbar werden. | mittel |
| 4 | **Stammkapitäne** (Figuren 4.1) | Macht aus anonymen Schiffen Menschen. Handel wird zur Beziehung, gute Preise werden erarbeitet. | mittel |
| 5 | **Börse und Termingeschäfte** (Gebäude 3.2) | Ein zweites Handelsspiel für die Mittelphase: auf Preise wetten statt nur Waren schieben. | mittel |

---

## 1. Missionen und Kampagne

**1.1 Startszenarien statt nur Schwierigkeit** — *klein*

**Abgleich: Offen.** Der genaue Restumfang steht im [Umsetzungsabgleich](UMSETZUNGSABGLEICH.md); die Ausgestaltung unter **1.1** im [Ausbauplan](AUSBAUPLAN.md).

Beim neuen Spiel wählt man eine Ausgangslage statt nur „leicht/normal/schwer“:
- *Der Erbe:* Haus und Kontor des Vaters, 8.000 Mark Schulden beim Geldwechsler, ein treuer alter Faktor.
- *Der Fremde aus Brügge:* 20.000 Mark, aber Ruf 0, alle Fraktionen misstrauisch, kein Bürgerrecht. Das Bürgerrecht kostet erst ein Jahr Wohnsitz.
- *Die Witwe:* eine laufende Brauerei, zwei Ratsherren gegen sich, ein Rivale will den Betrieb.
- *Der Kapitän:* eine alte Kogge, kein Lager, gute Beziehungen nach Bergen.

Anknüpfung: `HK.newGameHooks` und `HK.DIFFICULTY`. Jedes Szenario ist ein Objekt mit Startwerten und einem Eröffnungstext.

**1.2 Kapitel je Weg** — *mittel*

**Abgleich: Teilweise.** Salz, Brügger Tuch und Monopolkrieg sind spielbar; Besitz- und Mitwissergeschichten ergänzen echte Bau-/Gebäudeaktionen und verzögerte Folgen krimineller Entscheidungen. „Das Brot der Stadt“ eröffnet jetzt auch die politische Kampagne mit Ermittlungen, einem tatsächlichen Kornstreit und späterer Anhörung. Ihre beiden Folgekapitel und die weiteren vollständigen Wegkampagnen bleiben offen. Der genaue Umfang steht im [Umsetzungsabgleich](UMSETZUNGSABGLEICH.md); die Ausgestaltung unter **1.2** im [Ausbauplan](AUSBAUPLAN.md).

Bereits umgesetzt: drei verbundene Handelsbriefe für den Einstieg (zehn Last einkaufen, zwölf Last Getreide stiften oder gegen Lohn liefern, zwei Herkunftshäfen beliefern), mit einmaligen Belohnungen und gespeichertem Fortschritt. Zusätzlich spielbar: Salzgeschichte und „Brügger Tuch“ mit Qualitätsentscheidung, datierter Preisbeobachtung und optionaler echter Rückfracht. Weitere Kapitel für alle sechs Wege bleiben offen.

Jeder der sechs Wege bekommt drei bis vier erzählte Missionen, die freigeschaltet werden, sobald der Spieler Fortschritt in Richtung des Titels macht. Beispiele:
- *Handelsfürst:* „Das Salz von Lüneburg“ (Salzweg sichern), „Brügger Tuch“ (Fernkontor gegen flämische Konkurrenz), „Der Monopolkrieg“ (Rivale Kruse versucht dasselbe Monopol).
- *Herr der Nacht:* „Der Hehler von Wismar“, „Ein Vogt zu viel“, „Die letzte Fahrt der Vitalienbrüder“.
- *Stifter:* „Der neue Turm“, „Reliquie aus Rom“ (Pilgerfahrt mit Risiko), „Der Bischof kommt“.

Anknüpfung: Die Ereignisketten in `js/chains.js` haben schon Stufen, Entscheidungen und Folgen. Ein Kapitel ist eine Kette mit Bedingung zum Start und Belohnung am Ende. Die Oberfläche dafür gibt es schon (`showDecision`).

**1.3 Taverne als Auftragsbörse mit Zeitdruck** — *klein*

**Abgleich: Teilweise.** Datierte Berichte über tatsächliche unbekannte Ladungen kosten 25 Mark und führen zur gemeinsamen Vorauszahlung; Reservierung, begrenzter Bestand und Erstattungen sind spielbar. Generische Abnahmeangebote aus Tavernenhinweisen bleiben offen. Siehe [Umsetzungsabgleich](UMSETZUNGSABGLEICH.md).

Aus Gerüchten werden Gelegenheiten: „Die *Möwe* aus Riga sucht in drei Tagen 40 Last Salz zu 70“. Wer es bis dahin im Lager hat, verkauft zum Sonderpreis.
Anknüpfung: `HK.buyRumor` und `st.incoming` kennen ankommende Schiffe bereits.

**1.4 Erfolge** — *klein*

**Abgleich: Vorhanden.** Vier dauerhafte Erfolge für Salzhandel, ehrliches Jahrzehnt, drei Bündnisse und drei überstandene Stürme desselben Schiffs. Übersicht und Schlusschronik; keine erfundene Althistorie. [aufstieg.js](../js/aufstieg.js).

Sichtbare Ziele neben den Titeln, etwa „1.000 Last Salz gehandelt“, „Zehn Jahre ohne Schmuggel“, „Alle drei Rivalen als Verbündete“ oder „Ein Schiff durch drei Stürme gebracht“. Sie werden in der Chronik am Ende genannt.
Anknüpfung: `st.stats`, Abschnitt „Titel“ in der Übersicht.

**1.5 Bittsteller mit Gedächtnis** — *mittel*

**Abgleich: Vorhanden.** Vier Hilfsgesuchtypen vorhandener Bewohner, endliche Waren, Frist, Hilfe/Absage/Nichtantwort, späterer Ankunftshinweis oder Ratskontakt. Datierte Erinnerung und begrenzte Wahlunterstützung. [stadtgedaechtnis.js](../js/stadtgedaechtnis.js).

Ratsherren, der Pfarrer oder der Abt bitten um konkrete Hilfe, zum Beispiel Getreide in der Hungersnot oder Holz nach dem Brand. Sie vergessen weder Hilfe noch Absage. Wer hilft, hat später einen Fürsprecher.
Anknüpfung: `st.persons[...].loyalty`, die Auftragsgeber in `js/contracts.js`.

---

## 2. Tutorials und Einstieg

Umgesetzt sind der Lehrgang „Erste Schritte“ und der Handelsrat (`js/lehrgang.js`). Darauf aufbauend:

**2.1 Zweiter Lehrgang „Mittelspiel“** — *klein*

**Abgleich: Vorhanden.** Freiwilliger Mittelspiellehrgang nach Einführung und 30.000 Mark Reinvermögen: vier Schwerpunkte mit je fünf Schritten, Archivieren/Fortsetzen, reale Produktion/Miete/Rückkehr/Wahl als Belege. [aufstieg.js](../js/aufstieg.js).

Startet, wenn der erste fertig ist und das Vermögen 30.000 Mark erreicht: Gilde beitreten, Werkstatt bauen, Schiff auf Fahrt schicken, Ratssitz anstreben, ein Bürgerhaus kaufen.
Anknüpfung: `HK.LEHRGANG` ist eine Liste. Ein zweiter Satz Schritte mit eigenem Zähler genügt.

**2.2 Einmalige Hinweise beim ersten Besuch** — *klein*

**Abgleich: Vorhanden, angepasst.** Kleiner ungelesen-Punkt am vorhandenen Fragezeichen; gelesenes Thema bleibt im Handbuch erreichbar. Kein automatischer zusätzlicher Textkasten. [hilfe.js](../js/hilfe.js).

Beim ersten Öffnen jedes Gebäudes erscheint oben im Fenster ein Zweizeiler: wozu der Ort gut ist und was sich gerade lohnt. Ein Klick schließt ihn für immer.
Anknüpfung: `renderSidebar`, `st.seen = {}`.

**2.3 Der Faktor als Berater** — *mittel*

**Abgleich: Vorhanden.** Gespeicherter Wochenbrief mit bis zu drei Hinweisen zu Frist, Ware unterwegs, Käufer oder stillstehender Produktion. Eigenschaft gewichtet Empfehlungen; jeder Hinweis führt zur passenden Ansicht. [aufstieg.js](../js/aufstieg.js).

Der Faktor aus `js/staff.js` schreibt einmal pro Woche einen Bericht, zum Beispiel: „Wolle liegt seit 24 Tagen im Lager. Lübeck sucht Wolle. Der Pachtvertrag des Salzspeichers läuft in 9 Tagen aus.“ Seine Eigenschaft färbt den Rat: Ein gieriger Faktor empfiehlt Schmuggel.
Anknüpfung: `HK.besterAbnehmer` aus dem Handelsrat, Chronik als Ausgabe.

**2.4 Preisgedächtnis im Kontor** — *klein*

**Abgleich: Vorhanden.** Besucherangebote getrennt von den 60 Markttagen: Datum, Herkunft, Kapitän, Menge, Güte, Nettopreis. Bis 60 Tage/2.400 Einträge; alte Angebote sind keine aktuellen Zusagen. [aufstieg-ui.js](../js/aufstieg-ui.js).

Eine kleine Kurve je Ware: Was hat sie in den letzten 60 Tagen am Markt und bei Besuchern gekostet? Damit lernt man, wann Salz billig ist.
Anknüpfung: Das Diagramm in der Übersicht (`drawChart`) gibt es schon. Täglich ein Preispunkt je Ware in `st.preise`.

**2.5 Hilfe als Nachschlagewerk** — *klein*

**Abgleich: Vorhanden.** Durchsuchbares Handbuch mit Themen, Beispielen und Ortslinks; vorhandene Ortshilfen werden übernommen. DE/EN, schmale Ansicht und gespeicherter Lesestatus geprüft. [hilfe.js](../js/hilfe.js).

Die Textwand im Hilfe-Fenster wird zu Kapiteln mit Inhaltsverzeichnis, Suchfeld und Querverweisen auf die Orte („Zeig mir wo“ wie im Lehrgang).

---

## 3. Spezialgebäude

**3.1 Hafenkran der Stadt** — *klein*

**Abgleich: Teilweise.** Der genaue Restumfang steht im [Umsetzungsabgleich](UMSETZUNGSABGLEICH.md); die Ausgestaltung unter **3.1** im [Ausbauplan](AUSBAUPLAN.md).

Ein großer Tretradkran am Kai im Stadtbesitz, wie in Lüneburg oder Danzig. Er lässt sich für ein Jahr pachten: Jedes gelöschte Schiff zahlt Krangeld. Ohne Pacht kassiert ihn ein Rival.
Karte: Kran am Bollwerk-Kai. Anknüpfung: Zollpacht (`taxFarm`) als Vorbild.

**3.2 Börse im Ostviertel** — *mittel*

**Abgleich: Teilweise.** Der genaue Restumfang steht im [Umsetzungsabgleich](UMSETZUNGSABGLEICH.md); die Ausgestaltung unter **3.2** im [Ausbauplan](AUSBAUPLAN.md).

Termingeschäfte: Man verkauft heute 50 Last Getreide zu festem Preis, lieferbar in 30 Tagen, oder kauft auf Termin. Wer sich verschätzt, muss teuer nachkaufen. Gerüchte und das Preisgedächtnis (2.4) werden damit wertvoll.
Anknüpfung: Lieferaufträge in `js/contracts.js` sind schon fast Termingeschäfte, nur ohne Gegenrichtung.

**3.3 Ratskeller** — *klein*

**Abgleich: Offen.** Der genaue Restumfang steht im [Umsetzungsabgleich](UMSETZUNGSABGLEICH.md); die Ausgestaltung unter **3.3** im [Ausbauplan](AUSBAUPLAN.md).

Der Rat hält das Weinmonopol der Stadt und verpachtet den Keller. Der Pächter verkauft Wein ohne Marktgebühr und trifft dort die Ratsherren, wodurch Geschenke billiger werden.
Anknüpfung: Monopolpacht (`js/ausgleich.js`), `giftCost`.

**3.4 Münze** — *mittel*

**Abgleich: Offen.** Der genaue Restumfang steht im [Umsetzungsabgleich](UMSETZUNGSABGLEICH.md); die Ausgestaltung unter **3.4** im [Ausbauplan](AUSBAUPLAN.md).

Das Münzrecht als legales Gegenstück zum Falschgeld. Wer Silber einkauft, prägt mit Gewinn. Der Rat kann aber eine „Münzverrufung“ beschließen, die Bargeld entwertet. Das verbindet Ratsweg und Handelsweg.

**3.5 Lotsenhaus mit Funktion** — *klein*

**Abgleich: Teilweise.** Der genaue Restumfang steht im [Umsetzungsabgleich](UMSETZUNGSABGLEICH.md); die Ausgestaltung unter **3.5** im [Ausbauplan](AUSBAUPLAN.md).

Das Lotsenhaus im Bollwerk steht schon. Lotsengeld senkt Schäden an der Schiffshaut beim Einlaufen. Wer die Lotsen besticht, erfährt eher, was ankommt.
Anknüpfung: `s.hull`, `HK.knowsIncoming`.

**3.6 Fronerei und Henkershaus** — *klein*

**Abgleich: Teilweise.** Der genaue Restumfang steht im [Umsetzungsabgleich](UMSETZUNGSABGLEICH.md); die Ausgestaltung unter **3.6** im [Ausbauplan](AUSBAUPLAN.md).

Ort des Vogts für Prozesse. Verurteilte Rivalen verschwinden für eine Zeit vom Markt. Der Henker ist eine Figur der Unterwelt, mit Wissen und Kontakten.

**3.7 Elendenherberge für Pilger** — *klein*

**Abgleich: Teilweise.** Der genaue Restumfang steht im [Umsetzungsabgleich](UMSETZUNGSABGLEICH.md); die Ausgestaltung unter **3.7** im [Ausbauplan](AUSBAUPLAN.md).

Stiftung am Landtor: mehr Pilger bei der Wallfahrt und Frömmigkeit, aber auch Bettler und Krankheit.
Anknüpfung: `st.pilgrimage`, Pest-Kette.

**3.8 Wochenmarkt am Neuen Markt** — *klein*

**Abgleich: Teilweise.** Der genaue Restumfang steht im [Umsetzungsabgleich](UMSETZUNGSABGLEICH.md); die Ausgestaltung unter **3.8** im [Ausbauplan](AUSBAUPLAN.md).

Jeden siebten Tag ist Markttag im Ostviertel, mit Bauern aus dem Umland: Getreide, Wolle und Holz billiger, Bier und Tuch gefragter. Auf der Karte stehen dann Stände und Menschen auf dem Platz.

---

## 4. Charaktere

**4.1 Stammkapitäne** — *mittel*

**Abgleich: Vorhanden, angepasst.** Ab drei Besuchen und Vertrauen 3 kostenlose Warenbriefe zu realen Ankünften, höchstens alle 14 Tage je Kapitän. Bis acht Last per Kurzknopf vorausbezahlen; gemeinsame endliche Ladung, erst nach Zahlung exklusiv gesichert.

Bereits umgesetzt: feste Identitäten je Herkunftshafen, Besuche und Vertrauen über Spielstände hinweg, höchstens ein Vertrauenspunkt je ehrlichem Besuch und bis zu vier Prozent Preisvorteil bei späteren Ankünften. Aufgeflogener Schmuggel kostet Vertrauen. Datierte Ankunftsberichte und vorausbezahlbare Ladungsanteile sind ergänzt.

Kapitäne kehren wieder. Wer mit Kapitän Reyner Bock dreimal fair gehandelt hat, bekommt bessere Preise, ein Gerücht aus Lübeck oder einen Vorkaufsanteil. Wer ihn betrügt (Schmuggel aufgeflogen, Ware nicht abgenommen), dem bringt er nichts mehr.
Anknüpfung: Schiffe tragen schon Kapitänsnamen (`v.captain`). Eine Beziehungstabelle `st.kapitaene[name]`.

**4.2 Aufsteigende Rivalen** — *mittel*

**Abgleich: Offen.** Der genaue Restumfang steht im [Umsetzungsabgleich](UMSETZUNGSABGLEICH.md); die Ausgestaltung unter **4.2** im [Ausbauplan](AUSBAUPLAN.md).

Rivalen altern und sterben, Erben übernehmen mit anderer Haltung. Ein neuer Emporkömmling (vielleicht ein früherer Faktor des Spielers) tritt in den Kreis.
Anknüpfung: `js/rivals.js`, Familie und Nachfolge (`js/family.js`) als Vorbild.

**4.3 Nebenfiguren mit kleinen Ketten** — *klein je Figur*

**Abgleich: Teilweise.** Der genaue Restumfang steht im [Umsetzungsabgleich](UMSETZUNGSABGLEICH.md); die Ausgestaltung unter **4.3** im [Ausbauplan](AUSBAUPLAN.md).

Der Bettlerkönig (kennt jeden Einbruch), die Kräuterfrau (Heilmittel in der Pest, Hexereivorwurf durch den Pfarrer), der Stadtschreiber (fälscht oder beglaubigt Urkunden), der Henker (siehe 3.6). Jede Figur bringt zwei bis drei Begegnungen mit einer Entscheidung.
Anknüpfung: Passanten-Begegnungen (`enc_*` in `js/i18n.js`), `HK.STATIC_NPCS`.

**4.4 Lehrling, der zum Faktor wird** — *klein*

**Abgleich: Offen.** Der genaue Restumfang steht im [Umsetzungsabgleich](UMSETZUNGSABGLEICH.md); die Ausgestaltung unter **4.4** im [Ausbauplan](AUSBAUPLAN.md).

Ein Kind der Familie oder ein Waisenjunge aus dem Spital geht in die Lehre. Nach drei Jahren wird er Faktor, mit Eigenschaften je nach Ausbildung.

**4.5 Hansischer Gesandter** — *klein*

**Abgleich: Teilweise.** Der genaue Restumfang steht im [Umsetzungsabgleich](UMSETZUNGSABGLEICH.md); die Ausgestaltung unter **4.5** im [Ausbauplan](AUSBAUPLAN.md).

Der Lübecker Gesandte kommt jährlich mit Forderungen (Beitrag zum Krieg, Anerkennung eines Privilegs). Sein Bericht beeinflusst den Hansetag.
Anknüpfung: Hansetag-Kette.

**4.6 Der Chronist** — *klein*

**Abgleich: Offen.** Der genaue Restumfang steht im [Umsetzungsabgleich](UMSETZUNGSABGLEICH.md); die Ausgestaltung unter **4.6** im [Ausbauplan](AUSBAUPLAN.md).

Ein Mönch schreibt die Stadtchronik. Wer ihn beschenkt, wird in der Endchronik freundlicher beschrieben. Wer ihn verärgert, bekommt einen bissigen Nachruf.
Anknüpfung: `showChronicle`, Nachrufzeilen in `js/paths.js`.

---

## 5. Ereignisse

**5.1 Sturmflut** — *mittel*

**Abgleich: Teilweise.** Der genaue Restumfang steht im [Umsetzungsabgleich](UMSETZUNGSABGLEICH.md); die Ausgestaltung unter **5.1** im [Ausbauplan](AUSBAUPLAN.md).

Hochwasser überflutet den Südkai. Lagerware in Speichern am Kai verdirbt zum Teil, Stapel auf den Stegen sind verloren. Ein optional gebauter **Hochwasserschutz** könnte den Schaden halbieren — dann ruht aber ein Tag lang der Handel. Danach: Deichbau als städtisches Vorhaben.
Karte: Wasser über dem Kai, Sandsäcke an den Toren.

**5.2 Krieg der Hanse gegen Dänemark** — *groß*

**Abgleich: Offen.** Der genaue Restumfang steht im [Umsetzungsabgleich](UMSETZUNGSABGLEICH.md); die Ausgestaltung unter **5.2** im [Ausbauplan](AUSBAUPLAN.md).

Blockade des Sunds: weniger Schiffe aus dem Osten, hohe Preise für Salz und Hering. Der Rat erhebt Kriegssteuer und stellt Kaperbriefe aus. Mögliche Rollen: Kriegsgewinnler, Patriot (Schiffe stellen) oder Schmuggler durch die Blockade.
Anknüpfung: Kaperbrief (`js/deals.js`), Vitalienbrüder-Kette.

**5.3 Teuerung mit Kornspekulation** — *mittel*

**Abgleich: Teilweise.** Der genaue Restumfang steht im [Umsetzungsabgleich](UMSETZUNGSABGLEICH.md); die Ausgestaltung unter **5.3** im [Ausbauplan](AUSBAUPLAN.md).

Missernte: Wer Getreide im Kornspeicher hat, kann horten und teuer verkaufen (Geld, Zünfte und Volk wütend) oder es zum alten Preis abgeben (Ruf, Kirche, Patrizier).
Anknüpfung: Hungersnot-Ereignis, Kornspeicher als Gebäude.

**5.4 Der Hering bleibt aus** — *klein*

**Abgleich: Teilweise.** Der genaue Restumfang steht im [Umsetzungsabgleich](UMSETZUNGSABGLEICH.md); die Ausgestaltung unter **5.4** im [Ausbauplan](AUSBAUPLAN.md).

Ein Jahr ohne Heringszug: Der Fischmarkt bricht ein, Fischer verschulden sich, Bürgerhäuser kommen auf den Markt.
Anknüpfung: `goodCatch`, Bürgerhaus-Angebote.

**5.5 Zunftstreit** — *klein*

**Abgleich: Teilweise.** Der genaue Restumfang steht im [Umsetzungsabgleich](UMSETZUNGSABGLEICH.md); die Ausgestaltung unter **5.5** im [Ausbauplan](AUSBAUPLAN.md).

Böttcher und Brauer streiten, wer Fässer bauen darf. Der Spieler als Ratsherr oder Ältermann muss entscheiden und verliert dabei eine Zunft.

**5.6 Fürstenbesuch** — *klein*

**Abgleich: Teilweise.** Der genaue Restumfang steht im [Umsetzungsabgleich](UMSETZUNGSABGLEICH.md); die Ausgestaltung unter **5.6** im [Ausbauplan](AUSBAUPLAN.md).

Ein Herzog zieht durch die Stadt. Wein, Pelze und Gewürze sind zwei Wochen lang gefragt. Wer ihn bewirtet, gewinnt Einfluss und ein Privileg, riskiert aber eine Gegenforderung.

**5.7 Eis im Hafen** — *klein*

**Abgleich: Teilweise.** Der genaue Restumfang steht im [Umsetzungsabgleich](UMSETZUNGSABGLEICH.md); die Ausgestaltung unter **5.7** im [Ausbauplan](AUSBAUPLAN.md).

Im strengen Winter friert der Hafen zu: keine Schiffe, aber Schlittenverkehr aus dem Umland und Jahrmarkt auf dem Eis.
Karte: Eis statt Wasser, Menschen auf dem Eis.

**5.8 Feste im Jahreslauf** — *klein*

**Abgleich: Teilweise.** Der genaue Restumfang steht im [Umsetzungsabgleich](UMSETZUNGSABGLEICH.md); die Ausgestaltung unter **5.8** im [Ausbauplan](AUSBAUPLAN.md).

Fastnacht, Martinsmarkt und Kirchweih mit eigenem Bild auf der Karte (Buden, Fahnen, Umzüge) und kurzen Nachfragespitzen.
Anknüpfung: `HK.seasonEvent`.

---

## 6. Viertel

**6.1 Lastadie — die Werftvorstadt** — *groß*

**Abgleich: Teilweise.** Der genaue Restumfang steht im [Umsetzungsabgleich](UMSETZUNGSABGLEICH.md); die Ausgestaltung unter **6.1** im [Ausbauplan](AUSBAUPLAN.md).

Jenseits des Bollwerks, am Strand östlich des Eckturms: Werften, Holzlager, Teersieder und Reepschläger. Dort werden die Schiffe gebaut, und wer die Lastadie hält, baut billiger.
Karte: Helgen mit halbfertigen Rümpfen, Holzstapel. Anknüpfung: Werft, Holzhof.

**6.2 Vorstadt St. Jürgen vor dem Landtor** — *mittel*

**Abgleich: Teilweise.** Der genaue Restumfang steht im [Umsetzungsabgleich](UMSETZUNGSABGLEICH.md); die Ausgestaltung unter **6.2** im [Ausbauplan](AUSBAUPLAN.md).

Siechenhaus, Gärten, Krüge an der Landstraße. Sie wächst mit dem Wohlstand und brennt bei der Fehde zuerst.

**6.3 Die Insel als Quarantäne** — *klein*

**Abgleich: Teilweise.** Der genaue Restumfang steht im [Umsetzungsabgleich](UMSETZUNGSABGLEICH.md); die Ausgestaltung unter **6.3** im [Ausbauplan](AUSBAUPLAN.md).

Die kleine Insel im Westen wird in der Pest zur Quarantänestation: Schiffe müssen dort liegen, bevor sie löschen. Der Spieler kann sie stiften (Ruf) oder umgehen (Verdacht).
Anknüpfung: `HK.ISLET`, Pest-Kette.

**6.4 Fremdenkontor der Flamen und Engländer** — *mittel*

**Abgleich: Offen.** Der genaue Restumfang steht im [Umsetzungsabgleich](UMSETZUNGSABGLEICH.md); die Ausgestaltung unter **6.4** im [Ausbauplan](AUSBAUPLAN.md).

Ein eigenes Haus ausländischer Kaufleute mit Sonderrechten. Sie zahlen gut, sind aber Konkurrenz für die eigenen Kaufleute. Das gibt eine Ratsentscheidung: Rechte gewähren oder vertreiben.

**6.5 Die Stadt wächst sichtbar** — *groß*

**Abgleich: Teilweise.** Der genaue Restumfang steht im [Umsetzungsabgleich](UMSETZUNGSABGLEICH.md); die Ausgestaltung unter **6.5** im [Ausbauplan](AUSBAUPLAN.md).

Mit dem Wohlstand entstehen neue Häuser auf freien Flächen im Ostviertel, und zum Schluss wird die Mauer erneut erweitert. Sinkt der Wohlstand, verfallen Häuser.
Anknüpfung: Die Bürgerhäuser sind schon Daten (`st.burghers`). Neue Häuser kämen aus einer Liste vorbereiteter Bauplätze.

---

## 7. Systeme für die Tiefe

Bereits umgesetzt: Preisverlauf des heimischen Marktes für jede Ware über die letzten 60 Spieltage, mit getrennten Einkaufs- und Verkaufskurven. Der Verlauf beginnt mit der ersten tatsächlich erfassten Preisprobe; ältere Spielstände erhalten keine erfundene Vergangenheit.

**7.1 Verderb im Lager** — *klein*

**Abgleich: Teilweise.** Der genaue Restumfang steht im [Umsetzungsabgleich](UMSETZUNGSABGLEICH.md); die Ausgestaltung unter **7.1** im [Ausbauplan](AUSBAUPLAN.md).

Frischfisch verdirbt nach 8 Tagen, Bier nach 60, Getreide im Kornspeicher nie. Das zwingt zu Entscheidungen statt endlosem Horten und gibt der Räucherei einen Sinn.

**7.2 Preise der anderen Städte** — *mittel*

**Abgleich: Teilweise.** Der genaue Restumfang steht im [Umsetzungsabgleich](UMSETZUNGSABGLEICH.md); die Ausgestaltung unter **7.2** im [Ausbauplan](AUSBAUPLAN.md).

Eine kleine Hansekarte mit Preisen in Lübeck, Danzig, Bergen und Brügge, die mit den Schiffsnachrichten veralten. Eigene Fahrten lassen sich so planen statt erraten.
Anknüpfung: `HK.ORIGINS`, Fernkontore.

**7.3 Ansehen je Herkunftsstadt** — *klein*

**Abgleich: Teilweise.** Der genaue Restumfang steht im [Umsetzungsabgleich](UMSETZUNGSABGLEICH.md); die Ausgestaltung unter **7.3** im [Ausbauplan](AUSBAUPLAN.md).

Lübecker handeln lieber mit dem, der Lübeck beliefert. Handelsverträge (`js/deals.js`) werden dadurch die Krönung einer Beziehung statt eines Kaufs.

**7.4 Wetter wirkt** — *klein*

**Abgleich: Vorhanden.** Gespeicherte Wetterlagen mit Stärke, Dauer, Verlauf und Ausblick; Bild/Klang/Bewohner, Feldarbeit und Fischfang verwenden denselben Zustand. Schnee verzögert Landtransporte einmal pro Lage; Sturm ersetzt die unabhängige Sturmwürfelung. Wettergeschichten haben Vorrang und keine doppelten Produktionsmalusse. [wetter.js](../js/wetter.js).

Regen leert den Markt, Sturm hält Schiffe draußen, ein klarer Frosttag bringt Karawanen. Sichtbarer Regen beeinflusst inzwischen Bewohner; Wetterereignisse wirken auf Produktion und Lieferungen. Ein gemeinsamer verbindlicher Wetterzustand für Bild und Wirtschaft bleibt offen.
Anknüpfung: `HK.Scene.weather` → Spiellogik.

**7.5 Eigene Schiffe auf der Karte** — *mittel*

**Abgleich: Teilweise.** Der genaue Restumfang steht im [Umsetzungsabgleich](UMSETZUNGSABGLEICH.md); die Ausgestaltung unter **7.5** im [Ausbauplan](AUSBAUPLAN.md).

Abfahrt und Rückkehr der eigenen Koggen werden gezeigt wie bei den Besuchern, mit Wimpel des Kontors. Bei Rückkehr nach einem Sturm hängt das Segel in Fetzen.

**7.6 Ruf als Geschichte statt Zahl** — *mittel*

**Abgleich: Vorhanden für erfasste Taten.** Begrenztes Register für Hilfsgesuche, erfüllte/gebrochene Zusagen und Stadtbeiträge. Persönliche Gespräche, Journal, Schlusschronik und begründete Wahlunterstützung/Vorbehalte. Autor und Generation bleiben getrennt. Weitere Kampagnen können zusätzliche Tattypen ergänzen. [stadtgedaechtnis.js](../js/stadtgedaechtnis.js).

Die Chronik merkt sich die prägenden Taten (erstes Monopol, aufgeflogener Schmuggel, Spende in der Pest). Die Bürger sprechen davon (Passanten-Gerede), und Wahlen fragen danach.

## 8. Umland, Landwirtschaft und Frischware

**Neu festgehalten am 12. Oktober 2026; wird schrittweise umgesetzt (Reihenfolge am Ende des Abschnitts).** Heute gibt es zehn Erzeuger im Umland: Bauernhof (Getreide, wahlweise Flachs oder Hanf), Flachshof, Schäferei, Viehweide, Käserei, Windmühle, Holzfäller, Jäger, Steinbruch und Steinmetz ([landwirtschaft.js](../js/landwirtschaft.js)). Mit allen kann man nur bestellen, abholen oder den Betrieb übernehmen; Müller, Jäger und Holzfäller sind Bewohner mit Berufsbezeichnung, keine Gesprächspartner. Das Untermenü zeigte nur den Schlüssel `ruralSub` (behoben: „Höfe & Betriebe“).

**8.1 Unterseiten des Umlands** — *klein* — **umgesetzt 13. Oktober 2026** (fünf Unterseiten, Commit 19d5ea2)
Nach dem Muster von „Handel“: **Acker & Vieh** (Bauernhof, Flachshof, Schäferei, Viehweide), **Mühle & Verarbeitung** (Mühle, Käserei, Fleischer, Gerber, Bäcker), **Wald & Stein** (Holzfäller, Jäger, Steinbruch, Steinmetz, mit Waldbestand), **Lieferungen** (offene Bestellungen und Abholungen) und **Dorf** (Schulze, Müller, Jäger, Dorfkrug).

**8.2 Der Müller und die Bannmühle** — *mittel* — **umgesetzt 13. Oktober 2026** (js/muehle.js: Mahlgeld, Mühlenpacht im Rathaus, Müllerbrief und Mehlstrecken)
Die Bauern müssen in der Mühle mahlen lassen und zahlen Mahlgeld, meist ein Sechzehntel des Korns. Die Mühle lässt sich pachten; der Pächter verdient am Mahlgeld. Müller galten als Betrüger: Der Müller bietet an, Mehl zu strecken (mehr Ertrag, Verdacht, Bauern verärgert) — ein Dilemma mit Folgen.

**8.3 Vorkauf der Ernte auf dem Halm** — *mittel* — **umgesetzt 13. Oktober 2026** (js/muehle.js: im Frühjahr bei fremden Ackerhöfen, Ernte am 1. August mit drei Ausgängen)
Im Frühjahr zahlt der Kaufmann den Bauern einen Vorschuss und bekommt im Herbst Korn unter Marktpreis. Bei einer Missernte geht ein Teil verloren. Echte hansische Praxis und eine Wette auf das Wetter.

**8.4 Jäger: Jagdpacht und Wilderei** — *mittel*
Das Jagdrecht gehört dem Landesherrn. Daraus wird eine Jagdpacht oder ein Wilderei-Dilemma. Aufträge wie „Pelze für Brügge“, eine Jagdsaison im Herbst.

**8.5 Holzfäller: Holzordnung und Folgeprodukte** — *mittel*
Der Wald ist schon endlich. Dazu kommen Holzordnung oder Aufforstung und die Folgeprodukte **Holzkohle** und **Pottasche** (ein großer Danziger Exportartikel); Pech gibt es bereits.

**8.6 Steinmetz und Bauhütte** — *klein*
Aufträge aus dem Kirchbau und für die Stadtmauer; die Bauhütte als Betrieb.

**8.7 Dorfschulze, Dorfkrug und Kirchweih** — *mittel*
Ein Ansprechpartner für Wegerecht, Abgaben und den Streit zwischen Bauern und Stadt (Stapelrecht). Die Kirchweih als Dorffest.

**8.8 Jahreslauf der Landwirtschaft** — *mittel*
Aussaat im Frühjahr, Ernte im August, Schlachtzeit um Martini im November. Daraus entstehen saisonale Preistrends bei Getreide, Fleisch und Frischware.

**8.9 Neue Waren nur mit Kette oder Entscheidung** — *mittel bis groß*
Das Spiel hat 31 Waren; jede weitere verlängert Markt und Tabellen. Aufgenommen werden nur Waren, die eine Kette oder Entscheidung erzeugen:
- **Gerste, Malz, Hopfen → Bier** (mittel, große Wirkung) — **umgesetzt 13. Oktober 2026** (Commit d500985: Hopfengarten, Mälzerei, Gerste als Frucht, Brauerei braut aus Malz und Hopfen). Hopfengärten vor den Hansestädten; Hamburger und Wismarer Bier war ein Exportschlager.
- **Schwein und Pökelfleisch:** Fleisch und Salz werden Pökelfleisch und Speck, der Schiffsproviant schlechthin (mittel).
- **Butter** neben Käse, damals ein großer Handelsartikel aus Schonen und Dänemark (klein).
- **Holzkohle und Pottasche** aus dem Wald (klein, siehe 8.5).
- **Roggen statt „Getreide“**, eventuell Hafer für den Marstall (mittel, alte Spielstände müssen umgestellt werden).

Hintergrund, was Bauern in Norddeutschland im 14. Jahrhundert anbauten: Getreide in Dreifelderwirtschaft (Roggen als Hauptbrotkorn im Winterfeld, Gerste und Hafer im Sommerfeld, wenig Weizen); Hülsenfrüchte (Erbsen, Ackerbohnen, wichtig für Fastenzeiten und Schiffsproviant); Garten (Kohl als wichtigstes Gemüse, Rüben, Zwiebeln, Lauch, Knoblauch); Obst (Äpfel, Birnen, Kirschen, Pflaumen, meist gedörrt oder als Most); Sonderkulturen (Hopfen, Flachs, Hanf, Waid zum Färben); Tiere (das Schwein als häufigstes Fleisch, mit Eicheln im Wald gemästet; Rinder, auch dänischer Ochsenhandel; Schafe; Hühner und Gänse mit Eiern und Martinsgans; Bienen). Fleisch wurde eingesalzen.

**8.10 Frischware: Gemüse, Obst und Eier** — *mittel* — **umgesetzt 13. Oktober 2026** (js/frischware*.js: zwölf Saisonsorten, Hühnerhof, Gemüsegarten, Obstgarten, Tagesverkauf am Marktstand, Reste an Spital und Arme, Körbe als Naturalien und Geschenk, Frischbude auf dem Markt; offen aus 8.10: Sauerkraut/Dörrobst als Handelsware, Küche von Taverne und Herberge, Frischversorgung als Stadtwert, Marktfrau und Ereignisse)
Keine weiteren Handelswaren, sondern eine eigene Klasse **Frischware**: nur lokal, hält einen Tag, wechselt mit der Jahreszeit, geht weder ins Lager noch aufs Schiff.
- **Marktstand mit Frischware:** morgens bei Gemüsebauer, Obstgarten oder Hühnerhof einkaufen, tagsüber an die Bürger verkaufen (abhängig von Wetter, Markttag, Stimmung, Festen); was abends übrig ist, verdirbt oder geht an Arme und Spital (etwas Frömmigkeit statt Geld).
- **Jahreslauf:** Frühjahr Eier, Kräuter, junger Lauch (Ostereier, Ende der Fastenzeit); Sommer Kirschen, Erdbeeren, Erbsen, Bohnen (Johannisfest); Herbst Äpfel, Birnen, Pflaumen, Kohl, Rüben (Ernte, Martinsgans); Winter nur Lagerkohl, Rüben, Dörrobst (Knappheit, Fastenzeit).
- **Sichtbar auf der Karte:** Buden mit Saisonware, Kohlfelder und Obstgärten vor der Mauer, im Herbst mit roten Äpfeln, im Winter kahl.
- **Haltbar machen als Brücke zum Handel:** Kohl und Salz werden **Sauerkraut** (Schiffsproviant, verbraucht Salz); Obst wird **Dörrobst** oder **Apfelmost**.
- **Naturalien als Geschenk und Pacht:** Höfe im Besitz liefern gelegentlich Zinshühner, Eier oder Äpfel. Damit lässt sich schenken (eine Martinsgans im November wirkt doppelt), Arbeiter und Mannschaften verpflegen oder der eigene Stand bestücken.
- **Taverne und Herberge** kaufen Frischware für die Küche: mehr Gäste, mehr Gerüchte; Fleisch in der Fastenzeit verärgert die Kirche.
- **Frischversorgung der Stadt** als Stimmungswert: Gärten, Höfe und Stände heben ihn, Winter und Fehde senken ihn; er wirkt auf Stimmung, Gesundheit und Mieten. Kohl und Rüben im Hungerwinter bringen Ansehen bei den Zünften.
- **Figuren und Ereignisse:** Marktfrau Grete vom Gemüsestand (Klatsch, Preise vom Land), Raupenfraß im Kohl, Fuchs im Hühnerhof, Kirschenschwemme, Kinder klauen Äpfel im eigenen Obstgarten; Bürgerhäuser mit Gärten bringen zufriedenen Vermietern gelegentlich einen Korb Obst.

**Reihenfolge der Umsetzung:** 8.1 Unterseiten → 8.9 Bierkette (Gerste, Malz, Hopfen) → 8.2 Müller und 8.3 Erntevorkauf → 8.10 Frischware (Stand, Jahreslauf, Karte, Naturalien) → 8.8 Jahreslauf → 8.4 bis 8.7 Leute im Umland → übrige Waren aus 8.9.

## Querschnittsanforderung: Kennzahlen und Zugang mit Konsequenzen

**Neu festgehalten am 12. Oktober 2026; kein zusätzliches Einzel-Feature und nicht umgesetzt.** Reinvermögen, Rang, Ruf, Frömmigkeit, Verdacht, Einfluss, Wohlstand und Einwohner sollen spürbare Ursachen, Schwellen und Folgen im Spiel haben. Sie dürfen nicht überwiegend linear durch wiederholte Einzelklicks steigen oder sinken. Die Oberfläche muss zeigen, was ein Wert bewirkt, was ihn verändert und welche konkrete Möglichkeit oder Gefahr als Nächstes daraus entsteht.

Die vier Fraktionsansehen sollen erkennbare Interessen und Zielkonflikte abbilden. Sie steigen nicht pauschal gemeinsam: Entscheidungen können Fürsprecher gewinnen und andere Gruppen gegen den Spieler aufbringen. Das Ansehen beeinflusst nachvollziehbar Verträge, Ämter, Abstimmungen, Preise, Hilfe und Widerstand. Ruf, Einfluss und Fraktionsansehen bleiben unterscheidbare Größen.

Die Gilde braucht eine Laufbahn statt „Gebühr zahlen → Mitglied → Lizenz anklicken“. Aufnahme, Rang und einzelne Lizenzen knüpfen an relevante Beziehungen, Eignung, Empfehlung oder erbrachte Dienste. Bestechung und politische Absprachen bleiben mögliche, aber riskante Abkürzungen mit späteren Gegenforderungen oder Beweisen. Beiträge und Verpflichtungen machen Mitgliedschaft bedeutsam; Verlässlichkeit bringt Vorteile, Verstöße können Rechte einschränken. Vor jeder Entscheidung sind Bedingungen und Folgen sichtbar, und es bleiben alternative Wege durch die Partie offen. Die ausführliche Leitlinie steht in [KONZEPT.md](KONZEPT.md#461-kennzahlen-als-druck-zugang-und-zielkonflikt); Umsetzungsschritte und Abnahmekriterien folgen in [AUSBAUPLAN.md](AUSBAUPLAN.md#k13-kennzahlen-fraktionen-und-gildenlaufbahn).

## Querschnittsanforderung: Haupt- und Unternavigation zusammenführen

**Neu festgehalten am 12. Oktober 2026; noch nicht umgesetzt.** Die fünf großen Stadtbereiche sollen erhalten bleiben. Unter der Hauptnavigation soll eine zweite, kontextabhängige Navigationsebene die zugehörigen Unterseiten zeigen. Die bisherige Hauptkachel „Kontor“ soll **„Handelshaus“** heißen, mit den Unterpunkten **Kontor**, **Lagerhaus**, **Personal** und **Verträge**. Zu **Seefahrt** gehören **Hafen**, **Flotte & Versorgung**, **Außenhandel & Routen** und **Werft**.

Die untere Navigation **„Meine Bücher“** soll in dasselbe Navigationssystem integriert werden. Übersicht, Planung, Aufträge, Journal und Nachrichten bleiben global erreichbar und werden optisch als gemeinsame, von den Ortsansichten getrennte Gruppe gezeigt. Ihre Inhalte und Datenquellen werden nicht dupliziert. Kartenklicks, Hilfe- und Missionslinks öffnen dieselben Unterseiten; Zähler für Aufträge und Nachrichten bleiben sichtbar. Auf kleinen Bildschirmen darf kein Unterpunkt hinter einem schwer auffindbaren Menü verschwinden. Ausführlicher Entwurf und Abnahme stehen unter [K14 im Ausbauplan](AUSBAUPLAN.md#k14-stadtbereiche-und-bücher-in-einer-navigation).
