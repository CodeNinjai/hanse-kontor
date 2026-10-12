# Sundhaven: fehlende Spieltiefe in das Gesamtkonzept integrieren

**Ausbauplan mit fortgeschriebenem Umsetzungsstand.** Stand: 12. Oktober 2026. Grundlage ist der [Abgleich mit dem Code](UMSETZUNGSABGLEICH.md). Die Nummern 1.1–7.6 entsprechen vollständig dem [Ideenkatalog](IDEEN.md). Bereits vorhandene Funktionen werden erweitert; neue Mechaniken sollen keine zweite, unabhängige Wirtschaft neben dem Spiel aufbauen.

## Bereits spielbar ergänzt

Die Umsetzung ist vom Benutzer ausdrücklich für das Spiel freigegeben. Das erste geprüfte Paket enthält **1.4, 1.5, 2.1–2.5, 7.4, das Tatregister aus 7.6 und K12 für Lieferaufträge**. Codebelege und konkrete Abnahmeprüfungen stehen im [Umsetzungsabgleich](UMSETZUNGSABGLEICH.md#5-umsetzung-nach-freigabe-für-das-spielbare-spiel). Am 12. Oktober kamen **4.1**, datierte Tavernen-Ladungsberichte aus **1.3** und **„Brügger Tuch“ aus 1.2** hinzu. Berichte verwenden reale Ankünfte, Vorauszahlungen die gemeinsame endliche Ladung; die optionale Rückfracht reserviert tatsächliche Nachfrage. Hinzu kommen jetzt **„Der Monopolkrieg“**, die Besitzgeschichte **„Ein Haus als Machtbasis“** und die Folgegeschichte **„Der Preis des Schweigens“**. Sie verknüpfen politische Zusagen, echte Bau-/Besitzaktionen und kriminelle Methoden mit unmittelbaren und verzögerten Folgen. Ein generischer Tavernen-Abnahmeauftrag bleibt offen. Die Politikkapitel „Das Brot der Stadt“ und „Zwei Ufer, ein Rat“ mit Anwohneraufgabe und Bewährungsprobe sind ebenfalls umgesetzt. Der neue Katalog unter 1.2a plant insgesamt 72 eigenständige Missionen; nicht als spielbar markierte Inhalte bleiben Zielbeschreibungen. Insbesondere Startszenarien, Wegkampagnen und Stadtviertel sind dadurch noch nicht umgesetzt.

## Ergänzung: Verbindliche Arbeitszeiten (umgesetzt)

`arbeitsvorhaben.js` verwaltet gespeicherte Aufträge für Lager, Werkstätten, Häuser/Bürgerhäuser, Betriebsausbau, Schiffsreparatur, Marktstände, Liegeplätze, Stadtstiftungen und kleine Kirchenstiftungen. Einmalige Vorauszahlung, Termin, Aufschub der tatsächlichen Wirkung, gegenseitige Sperren am selben Ziel, Abbruch mit sinkender Erstattung und Abschlusschronik sind umgesetzt. Die Planung bündelt diese Aufträge sowie bestehende Schiffsbauten und große Kirchenbauzeiten. Die Immobiliengeschichte und die Bauunterstützung im Monopolkrieg warten auf Fertigstellung; ein verpasster Verhandlungstermin gewährt keine verspätete Unterstützung. Die genauen Dauern und Grenzen stehen in [Konzept 2.1](KONZEPT.md#21-zeit-als-knappe-ressource).

Abgenommen mit Domainprüfungen für alle 13 Aktionsarten, Speicherung, Parallelität, Eigentumsverlust, Bestands-/Produktionswirkung, gesperrte Ausfahrten, fristgerechte politische Unterstützung und Abbruch. Browserprüfung: Lagerauftrag, Abbruch, Speichern/Laden, Immobilienmission bis zum Abschluss, DE/EN und 1500/390/320 Pixel. Bestehende Intrigen-, Flotten-, Nachttransport-, Außenhandels- und Kalkulationsprüfungen bleiben Bestandteil der Regression. Eine szenische Baustelle für jeden neuen Auftrag und zufällige Bauverzögerungen sind damit nicht umgesetzt.

**Verbindlicher Prüfpunkt für weitere Pakete:** Annahme, Ausführung, Transport und Wirkung unterscheiden; Aufwand bekommt eine erkennbare Dauer und einen reservierten Ausführenden/Ort. Reguläre örtliche Transporte, Laden/Löschen, Personalsuche/-anreise sowie organisierte Intrigen sind die noch offenen Umstellungen. Bestehende Liefer-/Storyfristen müssen vorher auf faire Durchführbarkeit geprüft werden. Eine Verzögerung soll eine Beschaffungs- oder Terminentscheidung erzeugen, keine Wartepflicht ohne Alternative. Zusätzliche Auftragstypen werden dadurch nicht als neue erzählte Missionen gezählt.

## Gemeinsame Spielerfahrung

**Vorgemerkte Erweiterung vom 12. Oktober 2026:** Die neun angenommenen Ideen für freiwillige Minispiele einschließlich Wetten stehen gesammelt unter [Vorgemerkte Minispiele und Wetten](KONZEPT.md#vorgemerkte-minispiele-und-wetten). Sie sind noch nicht umgesetzt und ergänzen den Ausbauplan. Das bereits spielbare Würfelspiel „Der letzte Wurf“ bildet den ersten eigenständigen Minispielbaustein; eine feste Reihenfolge für die weiteren Spiele ist noch offen.

Die Stadt bietet konkrete Vorhaben an: jemanden versorgen, einen günstigen Transport sichern, einen Streit schlichten oder ein Unternehmen aufbauen. Daraus entsteht die Schleife **Nachricht → Entscheidung → Beschaffung → sichtbare Durchführung → Abrechnung → Erinnerung**. Nicht jede Aufgabe muss einen Warenkauf verlangen: Beziehungen, Terminwahl, Wissen und politische Zugeständnisse sind gleichwertige Mittel.

In einer Auftragskarte stehen zuerst Ziel, nächste Handlung, Frist und erwartetes Ergebnis. Auszahlung ist nicht Gewinn. Fehlende Ware wird mit den momentan erreichbaren Bezugsquellen bewertet; bereits gebundene Zahlungen erscheinen als gebundenes Kapital und werden nicht erneut als notwendiger Einkauf dargestellt. Fristen und Risiken stehen vor dem Annehmen fest. Optionale Schritte bleiben optional, und ein gescheiterter Auftrag kann eine neue Geschichte eröffnen, ohne die ganze Partie zu sperren.

Die Karte zeigt Gründe für Bewegung: Bauern fahren zum Wochenmarkt, ein Lotse geht zum Schiff, Handwerker errichten Küstenschutz, Pilger beziehen eine Unterkunft. Jede relevante Figur benutzt ein bestehendes oder neues dauerhaftes Bewohner-/Gästeprofil. Veranstaltungen vergeben Arbeits- und Besuchsziele, statt Menschen am Ziel erscheinen zu lassen. Wiederkehrende Figuren behalten Namen, Beziehungen und Erfahrungen.

### Zuständigkeiten der vorhandenen Ansichten

| Ort | Gehört dorthin | Verknüpfung |
| --- | --- | --- |
| Handelshaus → Kontor | Kasse, Kassenbuch, Faktorbericht und geschäftliche Rechte | keine Verdopplung der Warenverwaltung |
| Handelshaus → Lagerhaus | Vorräte, Güte, Chargenalter, reservierter Platz, Ankünfte, Schutz | Verarbeitung, Verkauf und Transport aus demselben Bestand |
| Handelshaus → Personal | Faktor und Lagerpersonal; Schiffsmannschaften bleiben bei ihrer Flotte | gemeinsame Profile und Lohnabrechnung |
| Handelshaus → Verträge | laufende Angebote und bindende Vereinbarungen | vorhandene Aufträge bleiben maßgeblich; kein zweites Aufgabenbuch |
| Seefahrt → Hafen | ankommende Schiffe, Hafenumschlag und Lotse | direkte Kartenverknüpfung und Lieferbelege |
| Seefahrt → Flotte & Versorgung | eigene Schiffe, Besatzungen, Proviant, Kosten und Rückstände | gemeinsame Abfahrt und Lagerplanung |
| Seefahrt → Außenhandel & Routen | Berichte, Handelsstädte und gespeicherte Routen | tatsächliche Fracht, Reise und Abrechnung |
| Seefahrt → Werft | Schiffskatalog, laufender Bau und Reparatur | Baufortschritt der Karte und Kosten der Flotte |
| Rat / Kirche / Gewerke | Rechte, Dienste und Entscheidungen des jeweiligen Orts | passende Hilfe über `?`, Kartenfokus über kompakte Ortsaktion |
| Umland & Produktion | Höfe, Rohstoffe, Produktionsketten und Bestellungen | gemeinsame Vorräte, Termine und Lieferaufträge |
| Gemeinsame Navigation → Übersicht | Stadt- und Kontorstatus | aktueller Spielstand, keine zweite Bilanz |
| Gemeinsame Navigation → Planung | Mengen, Termine, Alternativen, Kapazität, Liefer- und Preisrisiken | Aufträge und betroffene Waren/Routen sind vorgewählt |
| Gemeinsame Navigation → Aufträge | angenommene Ziele, verfügbare Geschichten, Teilschritte und Abschlüsse | „Beschaffung planen“, „Zur Person“, „Entscheiden“ |
| Gemeinsame Navigation → Journal | Entscheidungen, Abrechnungen, bleibende Folgen, eigene Notizen | Rücksprung zur Person, Ware oder Geschichte |
| Gemeinsame Navigation → Nachrichten | datierte Angebote, Gerüchte, Berichte und antwortbare Schreiben | Antworten führen bestehende Spielaktionen aus |

Die Hauptnavigation wechselt den Stadtbereich; direkt darunter erscheinen dessen Unterseiten. Die fünf Stadtbereiche erhalten **Bücher** als sechste Hauptkachel; **Kontor** heißt als Oberbegriff **Handelshaus**. Übersicht, Planung, Aufträge, Journal und Nachrichten sind die Unterseiten des Bücherbereichs. Alle Unterseiten bekommen kleinere Symbole im Stil der Hauptnavigation. Damit gibt es eine Navigation, aber weiterhin klare Zuständigkeiten und genau eine maßgebliche Datenquelle je Vorgang. Karte und Gebäude bleiben alternative direkte Einstiege. Unterpunkte zeigen den aktiven Ort, offene Zähler und nachvollziehbare Rückwege; auf kleinen Displays bleiben sie ohne schwer auffindbare Pop-ups erreichbar.
| Rat / Kirche / Gewerke | Rechte, Dienste und Entscheidungen des jeweiligen Orts | passende Hilfe über `?`, Kartenfokus über kompakte Ortsaktion |

### Technische und wirtschaftliche Grundlage

Neue Systeme erhalten versionierte Zustandsfelder und Migrationen über die vorhandenen Hooks. Angebote, Aufträge, Personen und Buchungen haben stabile Kennungen. Anzeigen und Preisvorschauen verändern keine Bestände und verbrauchen keinen Zufall. Aktion und Tagestick prüfen Voraussetzungen erneut; wiederholter Klick oder Laden darf keine zweite Belohnung auslösen.

Die Wirtschaft bleibt auch ohne laufende Karte vollständig simulierbar. Ein geschäftlicher Vorgang erzeugt einen Frachtbeleg; die Animation arbeitet diesen ab. Begehbarkeit und Darstellung sind keine Voraussetzung für eine zweite Abrechnung. Wetter, Sperren und Verspätungen wirken dagegen vor einer wirtschaftlichen Ankunft und werden mit ihrer Ursache gespeichert.

Bestände werden nicht doppelt verkauft oder gleichzeitig mehreren bindenden Reservierungen zugerechnet. Wo bisher nur ein unverbindlicher Fortschrittsvergleich existiert, darf die Oberfläche keine Reservierung behaupten. Neue bindende Verpflichtungen brauchen eine gemeinsame Reservierungsübersicht mit ausdrücklicher Freigabe bei Erfüllung, Ablauf oder Rücktritt.

Zahlen in den folgenden Entwürfen sind Startwerte für Prüfungen, keine bereits gemessene Balance. Jede neue wiederkehrende Geldquelle erhält reale Nachfrage, Kosten und eine Grenze. Schwierigkeit verändert Spielräume, nicht heimlich die angebotenen Vertragsbedingungen.

## 1. Missionen und Kampagne

### 1.1 Vier Startszenarien

Der klassische Krämerstart bleibt verfügbar. Szenario und Schwierigkeit sind getrennte Entscheidungen; eine illustrierte Karte zeigt Startbesitz, Schulden, Beziehungen und das erste Problem.

| Szenario | Ausgangslage | Erste Geschichte | Einbindung / Ausgleich |
| --- | --- | --- | --- |
| Der Erbe | Kontor, geerbtes Haus, 8.000 Mark Schuld, erfahrener Faktor | Gläubiger fordert einen Zahlungsplan; verkaufen, handeln oder umschulden | Schulden erscheinen im vorhandenen Darlehenssystem, Faktor kostet Lohn. Keine pauschale Startbelohnung zusätzlich zum Erbe. |
| Der Fremde | 20.000 Mark, geringe Ortskenntnis und wenig politischer Rückhalt | Bürge gesucht; ehrlicher Liefervertrag oder teure Fürsprache | Handel bleibt möglich. Volles Bürgerrecht öffnet politische Rechte nach Wohnsitz und Bürgschaft; es darf nicht ein Jahr lang das Spiel blockieren. |
| Die Witwe | übernommene Brauerei und laufende Verpflichtungen | Rivale bietet einen schnellen Verkauf; alternativ Rohstoffversorgung sichern | Betrieb ersetzt einen Teil des Bargelds, Eigentum und Lieferpflichten werden offen ausgewiesen. Eine politische Intrige ist eine konkrete Geschichte, kein dauerhafter pauschaler Malus. |
| Der Kapitän | gebrauchte Kogge, kleine Kasse, Kontakte in Bergen | erste Fahrt finanzieren und beschädigten Rumpf instand setzen | Statt völlig fehlendem Lager wird ein kleiner gemieteter Umschlagplatz angeboten, damit Rückfracht und Einführung funktionieren. |

Anschluss: `newGame`, Darlehen, Besitz, Personal, Auftragsbuch. Abnahme: alle vier Starts sind ohne erzwungenen sofortigen Bankrott spielbar, speichern korrekt und vergeben keine fremden Besitzrechte doppelt. Bestehende Partien erhalten kein rückwirkendes Startszenario.

### 1.2 Die großen Wendepunkte je Spielweg

**Politikkapitel 1 umgesetzt – „Das Brot der Stadt“ (12. Oktober):** Frühestens ab Tag 18, bei höchstens 110 % des normalen Getreide-Zielbestands und einem tatsächlich finanzierbaren Kornkauf durch Kruse, beginnt ein einmaliger Streit. Er kauft höchstens 48 Last beziehungsweise ein Fünftel des Marktbestands und hält sie als gespeicherte, endliche Ladung zurück. Die Stadt verliert diese Menge, Kruse bezahlt sie. Während der ungelösten Krise gilt +12 % Nachfrage für Getreide/Mehl. Ein hoher Marktbestand oder ein zahlungsunfähiger Rivale verschieben den Beginn.

Der gespeicherte Hintergrund ist absichtliche Verknappung oder ein echter Zahlungsstreit. Öffentliche Prüfung (80 Mark, zwei Tage), Bestechung (140 Mark, sofort) oder ein zunächst unbestätigter Kai-Hinweis führen zu unterschiedlichen Entscheidungen. Frühere Kornhilfe beziehungsweise die gemeinschaftliche Salzlieferung ermöglichen eine verlässliche kostenlose Aussage; Gerüchte und übersprungene Ermittlungen lassen sich nachprüfen. Die ursprüngliche Frist von 18 Tagen bleibt bestehen. Rechtmäßige Beschlagnahme benötigt echte Betrugsbelege und Einfluss. Vermittlung bezahlt die reale Restladung, Nothilfe verbraucht zwölf Last eigener Lagerware mit Güte mindestens 85. Gefälschte Beschlüsse und bezahlte Absprachen eröffnen illegale Wege. Der Gildepakt verbilligt offene Vermittlung und schließt geheime Absprachen aus; eine erhaltene Machtbasis senkt den Einflussbedarf.

Sieben Tage nach der Maßnahme prüft eine Anhörung den dann gespeicherten Marktbestand und die geleistete Nothilfe. Ausreichende Versorgung (55 % des normalen Zielbestands oder zwölf Last Nothilfe) bringt nach Rechenschaft +1 Wahlunterstützung für 120 Tage innerhalb der handelnden Generation. Acht weitere Last können einen unzureichenden Befund korrigieren. Bestechung/Fälschung/Absprache werden bei der Anhörung sicher aufgedeckt, wie vorab angekündigt. Wiedergutmachung, Geständnis oder Vertuschung haben unterschiedliche Kosten und Ruf-/Fraktionsfolgen; Ignorieren verschärft sie. Andere Ermittlungen bleiben erhalten. Ungenutzte Privatvorräte werden einmalig zum gespeicherten Großhandelspreis in den Markt zurückgeführt; die eigene Leistung wird davon getrennt bewertet. Es gibt keinen garantierten Geldlohn.

Mission, datierte Briefe, Journal, Rathaus-/Marktverweise, Folgenvorschau und Fragezeichenhilfe sind integriert. **„Die Wahl von Sundhaven“ bleibt offen; der folgende Baubogen ist inzwischen spielbar.** Dieses Kapitel erweitert keine Baugeometrie und ersetzt keine vollständige Kampagnenbalance.

**Politischer Baubogen umgesetzt – „Zwei Ufer, ein Rat“ (12. Oktober):** Angebot frühestens Tag 35 und drei Tage nach beendetem Kornstreit. Eine zweitägige Besichtigung kostet 100 Mark und bindet an 40 Tage bis zur Eröffnung. Der Spieler priorisiert Südkai oder Uferweg, mit unterschiedlichen Fraktionsreaktionen. Finanzierung aus eigener Kasse, kirchliche Arbeitshilfe (250 Mark weniger Arbeitskosten; Frömmigkeit 40 oder anerkannte Kornhilfe) oder Brachts echte Hinterlegung (600 Mark aus seinem Vermögen; nach Verwendung 720 Mark Schuld, 21 Tage Frist). Unverbrauchte Hinterlegung wird bei Scheitern zurückgegeben. Schulden mindern das Reinvermögen; direkte Tilgung und Raten überweisen tatsächlich an Bracht. Raten kosten einmalig 40 Mark zusätzlich und buchen täglich höchstens zehn Mark aus verfügbarer Kasse; unbeantworteter Verzug startet sie mit Ruf −2 und Patrizier −3.

„Wessen Weg wird gesperrt?“ führt bis zu drei vorhandene Haushalte des gewählten Viertels als parallele Aufgabe. Entschädigung (120 Mark), ruhige Arbeitszeiten (zwei weitere Bautage) oder hoheitlicher Zwang (vier Einfluss, schlechtere Stimmung und Fraktionsfolgen) wirken tatsächlich. Zehn Tage ohne Antwort haben die zuvor erklärte negative Folge. Erst nach dieser Entscheidung beziehungsweise ihrem Ablauf kann der Vertrag beginnen. Zunftbau: 1.600 Mark, zwölf Holz, acht Stein, zwei Werkzeug, Güte 85, zehn Tage. Günstiger Bau: 900 Mark, acht Holz, vier Stein, ein Werkzeug, Güte 70, sechs Tage und einmal gespeichertes Mängelrisiko von 40 %. Die 80-Mark-Prüfung legt das Ergebnis offen; Reparatur kostet 450 Mark, drei Holz, zwei Stein mit Güte 85 und drei Tage. Geld und Warenwert werden getrennt dokumentiert.

Nach Eröffnung beginnt „Die erste Bewährungsprobe“: vierzehn Tage später wird ein verschwiegener Mangel sicher zum Schaden und setzt die Vorteile aus. Zwölf Tage bleiben für Reparatur und Abnahme oder Ablehnung. Der intakte Kai senkt das Zufalls-Verzögerungsrisiko noch nicht geprüfter Schiffsankünfte um zehn Prozentpunkte; am Uferweg betrifft dies Karawanen, zusätzlich sinkt die Fracht neuer Umlandaufträge um zwei Mark. Wetter, Sperren und volle Häfen bleiben wirksam. Abnahme gibt einmalig +1 Wahlunterstützung für 180 Tage innerhalb der handelnden Generation. Keine private Miete und kein garantierter Geldlohn; kein neuer stadtweiter Sturmflutschutz. Die Karte zeigt einen anklickbaren Bauhinweis, noch keine vollständig animierte Baustelle oder veränderte Küstengeometrie.

**Teilumsetzung 12. Oktober:** Die drei Handelskapitel Salz, Brügger Tuch und Monopolkrieg sind spielbar. Der Monopolkrieg wird nach dem Tuchkapitel oder mit Gildenmitgliedschaft und Ruf 30 angeboten. Nach Annahme bleiben 35 Tage: Beweise legal prüfen, durch Bestechung erhalten oder als Original stehlen; Unterstützung durch eine finanzierte Versammlung, politischen Einfluss oder eine reale Stadtstiftung gewinnen. Freiwillig stehen Vermittlung, gefälschte Unterschriften und begrenzte Sabotage zur Wahl. Die Ausgänge sind reguläre Tuchmonopolpacht, verbindlicher Gildepakt oder Kruses aus seinem Vermögen bezahltes Schweigegeld. Der Pakt gewährt eine Wahlunterstützung und erfüllt alternativ die Monopolbedingung des Handelstitels; er verhindert eigene Monopolanträge und Pacht bis zum ausdrücklich mit Nachteilen verbundenen Austritt. Weitere Titelbedingungen bleiben bestehen.

**Wegübergreifende Geschichten:** Ab Tag 5 beziehungsweise nach dem Tuchkapitel lässt sich ein vorhandenes Haus als Machtbasis ausbauen, behalten oder verkaufen. Eigentum, normale Kauf-/Ausbau-/Verkaufskosten und Mieten gelten tatsächlich. Ein behaltenes, unbeschädigtes Haus ab Stufe 2 liefert eine Unterstützung im Monopolkrieg. Die erste schmutzige Methode eröffnet eine einmalige Mitwisser-Folgegeschichte: Nachricht vier Tage später, sieben Tage Antwortfrist, höhere Forderung bei weiteren Taten vor der Antwort (maximal drei Stufen). Bezahlen, Selbstanzeige und Enthüllung haben unterschiedliche Folgen; andere Ermittlungen bleiben bestehen. Alle Entscheidungen ändern die normalen Werte und Fraktionsbeziehungen, protokollieren tatsächliche Änderungen und bleiben gespeichert. Geldfluss wird nicht als Gewinn ausgegeben, wenn dafür ein Gebäude erhalten bleibt.

Dies ist keine allgemeine Diebstahl- oder Sabotagewirtschaft und erledigt nicht die fünf übrigen vollständigen Wegkampagnen. Das gestohlene Waagebuch ist ein eindeutiger Gegenstand dieser Geschichte. Sabotage kostet Kruse bis zu 800 Mark und blockiert zehn Tage seine Besitzkäufe, feindlichen Aktionen und Ratsanträge; laufende Mieten werden nicht ausgeschaltet. Bauen nutzt die vorhandenen Stadtprojekte, zuerst das günstigste noch offene. K4 ist durch den Gildepakt teilweise erfüllt; neue Ratsgesetze und ein eigener Gildesitz bleiben offen.

Die Wege sind parallel offen. Kapitel werden durch tatsächliche Leistungen freigeschaltet, nicht durch einen unumkehrbaren Klassenwahlknopf. Ein früherer Titel oder bereits errichtetes Gebäude zählt als erfüllte Voraussetzung; Belohnungen gibt es trotzdem höchstens einmal.

| Weg | Kapitel 1 | Kapitel 2 | Kapitel 3 / dauerhafte Entscheidung |
| --- | --- | --- | --- |
| Handel | Vorhandene Salzgeschichte als Einstieg erhalten | **Brügger Tuch:** datierte Preisberichte, Qualitätsentscheidung und eine konkrete Rückfracht | **Monopolkrieg:** Kruse konkurriert um Rechte; Monopol mit Abgaben oder Gildepakt ohne Exklusivität |
| Politik | **Das Brot der Stadt (spielbar):** Kornstreit, Ermittlungen, Versorgung und spätere Anhörung | **Zwei Ufer, ein Rat (spielbar):** Uferbau finanzieren, Anwohnerinteressen vermitteln und Ausführung verantworten | **Die Wahl von Sundhaven:** Stimmen aus Taten und Bündnissen, Zusagen mit späterer Rechenschaft |
| Seefahrt | **Die erste eigene Fahrt:** Ladung, Kapitän, Reserven und sichere Ankunft | **Geleit nach Bergen:** Konvoi, Lotsendienst und Meldungen gegen riskantere freie Fahrt abwägen | **Die gesperrte Passage:** Handel, Geleit oder Kaperauftrag im fiktiven Regionalkonflikt |
| Kirche | **Licht und Brot:** Wachs und Versorgung für eine konkrete Gemeinde | **Das Pilgerhaus:** Unterkunft, Güte der Lebensmittel und Krankenvorsorge | **Der Bischof kommt:** Stiftung oder Vermittlung im vorhandenen Kirchen-/Ratskonflikt |
| Handwerk | **Meisterstück:** Material beschaffen und geforderte Qualität erreichen | **Fässer für die Brauer:** den Kompetenzstreit lösen, statt bloß Geld zu überweisen | **Die Stimme der Zünfte:** Schutzrechte oder offene Gewerbeordnung mit unterschiedlichen Partnern |
| Unterwelt | **Der Hehler von Wismar:** verdächtige Ware und den Ursprung prüfen | **Ein Vogt zu viel:** echte Informationen sammeln, Schweigegeld oder Aussage abwägen | **Die letzte dunkle Fahrt:** riskantes Netzwerk behalten oder über den bestehenden Freikauf aussteigen |

Jedes Kapitel hat zwei bis vier überprüfbare Schritte, höchstens eine dominierende Frist und mindestens zwei wirtschaftlich oder gesellschaftlich unterschiedliche Lösungen. Der Titel bleibt an seine überprüfbaren Leistungen gebunden; die Kapitel vermitteln und vertiefen den Weg, ersetzen nicht alle Titelbedingungen. Entscheidungspunkte werden über Nachrichten geöffnet, Fortschritt über das bestehende Auftragsbuch verfolgt.

Abnahme: jeder Zweig bis zum Abschluss, verspätete Lieferung, fehlende Qualität, bereits erledigte Vorleistungen und Laden zwischen zwei Schritten werden geprüft. Eine Niederlage schließt nur ausdrücklich vereinbarte Chancen, nicht grundlos andere Wege.

### 1.2a Langfristiger Umfang: 72 eigenständige Missionen

**Ausbauziel des Benutzers: etwa 50–100 gut ausgearbeitete Aufträge und eine lange, zusammenhängende Geschichte.** Die konkrete Arbeitsfassung umfasst **72 Missionen: 48 in sechs Spielwegen, zwölf Stadt- und Personengeschichten, sechs Familiengeschichten und sechs verflochtene Schlusskapitel**. Das ist ein Inhaltsplan, keine Behauptung über den aktuellen Spielumfang. Von diesen 72 Einträgen sind derzeit neun spielbar; sie sind unten ausdrücklich markiert. Einführungsbriefe, gewöhnliche Lieferverträge, wiederkehrende Gesuche und unterschiedliche Entscheidungen innerhalb derselben Mission erhöhen diese Zahl nicht. Die bisherigen drei Kapitel je Weg bleiben die großen Wendepunkte; weitere Missionen verbinden sie und führen ihre Folgen fort.

Die Langgeschichte handelt davon, **wer Sundhavens Versorgung kontrolliert und wer dafür Verantwortung trägt**. Kruse will Handelsrechte, Bracht bindet Menschen durch Kapital, Wulflam schützt die Handlungsfähigkeit des Rates, Vrome die Stellung seiner Mitglieder. Anselm und Bruno vertreten unterschiedliche Vorstellungen kirchlicher Fürsorge; Grete hört die Folgen im Alltag. Sie sind keine austauschbaren Auftragstafeln. Eine Figur kann in einer Sache Partner und in der nächsten Gegner sein. Neu eingeführte Personen brauchen gespeicherte Identität, Herkunft, Aufenthalt und einen späteren Wiederauftritt.

**Dramaturgie und Tempo:** Ankommen und Vertrauen aufbauen → um Besitz und Zugänge ringen → gemeinsame Krisen mit gegensätzlichen Interessen → Macht ausüben und alte Zusagen verantworten → Nachfolge und Vermächtnis. Die frühen vorhandenen Kapitel bleiben erreichbar. Neue mittlere und späte Kapitel werden an tatsächliche Reisen, Betriebsbesitz, Amtsperioden, Jahreszeiten und verstrichene Zeit seit früheren Entscheidungen gebunden. Nicht alle Geschichten starten im ersten Monat. Für einen normalen Verlauf sollen zwei bis vier angenommene größere Vorhaben gleichzeitig sinnvoll bearbeitbar sein; der Spieler darf mehr annehmen, erhält aber vorher eine klare Terminübersicht. Noch nicht angenommene Einladungen erzeugen keine versteckten Strafpflichten. Diese Angebotssteuerung ist ebenfalls noch umzusetzen.

**Zählweise und Qualität:** Eine Mission braucht einen eigenen Konflikt, ein überprüfbares Ergebnis und mindestens zwei inhaltlich verschiedene Ausgänge. Ein Gesprächsklick, eine zweite Liefermenge oder bloßes Warten ist keine zusätzliche Mission. Ein Kapitel darf eine parallele Anwohneraufgabe und eine spätere Bewährungsprobe enthalten, wenn diese eigene Entscheidungen, Betroffene und Folgen besitzen. Keine reine Wiederholung desselben Kauf-/Liefermusters mit anderem Warennamen. Pro neuem Wegbogen sollen mindestens vier verschiedene Tätigkeiten vorkommen: ermitteln, vermitteln, organisieren, bauen, finanzieren, reisen, schützen, täuschen, stehlen oder politisch handeln.

**Folgenvertrag:** Jede bindende Entscheidung zeigt unmittelbar Kosten, Frist, bekannte Risiken und betroffene Werte. Ruf, Einfluss, Frömmigkeit, Verdacht und die vier Fraktionsbeziehungen reagieren nach Bedeutung der Tat; nicht jede Handlung verändert künstlich alle Werte. Langzeitfolgen werden als Bindung oder mögliches Risiko angekündigt, ohne verborgene Informationen zu verraten. Einmalige Ergebnisbelege speichern Autor, Generation, Zeitpunkt, Geldfluss, Warenwert, Besitzänderung und Zusagen. Spätere Kapitel lesen diese Belege. Scheitern verändert einen Anschluss, statt die gesamte Kampagne zu sperren. Kein kostenlos neu erzeugtes Rivalengeld, keine zweimal verbrauchte Ladung, keine mehrfach gutgeschriebene Hilfe.

In den Tabellen bedeutet **spielbar** eine vorhandene, geprüfte Mission. Alle anderen Einträge sind **geplant**; Mechaniken, die sie benötigen, bleiben offen, bis sie ebenfalls umgesetzt und geprüft sind. Reihenfolge innerhalb eines Weges ist eine dramaturgische Orientierung, keine starre Pflichtkette.

#### Handel – Zugang, Abhängigkeit und Verantwortung (H01–H08)

| ID / Mission | Konflikt und unterschiedliche Handlungen | Anschluss und bleibende Folge | Stand |
| --- | --- | --- | --- |
| H01 · Das Salz von Lüneburg | Salz für den Fang organisieren; eigene Marge und gemeinschaftliche Versorgung abwägen, Rückfahrt optional ausrüsten. | Vertrauensbeleg trägt H02 und kann im Kornstreit eine verlässliche Aussage ermöglichen. | spielbar |
| H02 · Brügger Tuch | Willem verlangt eine Gütezusage; normale oder feinere Ware, datierte Beschaffung und echte Rückfrachtentscheidung. | Erfüllung stärkt Käufervertrauen; hoher Vertrauenswert hilft im Monopolkrieg. Scheitern sperrt dessen Einstieg nicht. | spielbar |
| H03 · Der Monopolkrieg | Kruses Exklusivität bekämpfen oder nutzen: Beweise, Bündnisse, reale Investition, Bestechung, Diebstahl, Fälschung oder Sabotage. | Reguläres Monopol, bindender Gildepakt oder bezahlter Rückzug; kriminelle Methoden können C02 auslösen. | spielbar |
| H04 · Die fehlende Last | Vaget findet eine Differenz zwischen gespeichertem Frachtbeleg und Lager. Herkunft prüfen, Verlader entschädigen oder bewusst beschuldigen. | Ein belegter Verantwortlicher und eine korrigierte echte Menge; ungerechter Vorwurf kehrt bei S04/C07 zurück. Benötigt durchgängige Chargenherkunft. | geplant |
| H05 · Der Wechsel ohne Siegel | Schonefeld erhält einen zweifelhaften Wechsel. Bestätigung abwarten, auf eigene Rechnung vorfinanzieren oder das Risiko gegen Abschlag verkaufen. | Endliches Kreditrisiko und Beziehung zum Aussteller; kein zugleich eingelöster und verkaufter Wechsel. Verbindet D05. | geplant |
| H06 · Das fremde Kontor | Eine auswärtige Gesellschaft sucht ein bestehendes Haus. Vermieten, gemeinsames Handelskapital stellen oder Sonderrechte ablehnen. | Echte Miete und befristete Rechte verändern Konkurrenz; gibt P06 und F03 einen konkreten Vertrag. | geplant |
| H07 · Kruses letzter Preis | Nach längerer Konkurrenz gerät Kruse mit einem nachweisbaren Geschäft in Bedrängnis. Vermögenswerte kaufen, eine begrenzte Partnerschaft anbieten oder ihn scheitern lassen. | Wirklicher Besitz-/Kapitalwechsel; ein geretteter Gegner schuldet keine ewige Gefolgschaft und kann F04 anders beurteilen. | geplant |
| H08 · Das offene Kontorbuch | Eine Handelsprüfung verlangt Rechenschaft über H03–H07. Belege offenlegen, Streitforderungen ausgleichen oder einen begrenzten Vergleich verhandeln. | Abschluss des Handelsbogens mit nachvollziehbarer Bilanz; saubere Rechte oder fortbestehende Belastung gehen in F03 ein. | geplant |

#### Politik – Versorgung, Mandat und Kontrolle (P01–P08)

| ID / Mission | Konflikt und unterschiedliche Handlungen | Anschluss und bleibende Folge | Stand |
| --- | --- | --- | --- |
| P01 · Das Brot der Stadt | Kruses tatsächliche Kornreserve untersuchen; Vermittlung, Nothilfe, rechtmäßige Beschlagnahme, Fälschung oder Absprache. | Spätere Anhörung bewertet reale Versorgung und Methoden. Anerkannte Hilfe öffnet kirchliche Bauhilfe in P02. | spielbar |
| P02 · Zwei Ufer, ein Rat | Südkai oder Uferweg priorisieren; eigene Mittel, Brachts Kredit oder kirchliche Arbeitshilfe, Zunftbau oder riskantes Angebot. | Echter Warenverbrauch, Schulden und routeabhängiger Transportvorteil. Aktiviert P03 und nach Eröffnung P04. Kein garantierter Geldlohn. | spielbar |
| P03 · Wessen Weg wird gesperrt? | Bestehende Anwohner entschädigen, ruhige Arbeitszeiten zusagen oder Zugang hoheitlich erzwingen. | Verändert konkrete Haushaltsstimmung und Bauzeit. Eigenständige parallele Entscheidung zu P02; keine zweite Materiallieferung. | spielbar |
| P04 · Die erste Bewährungsprobe | Ein späterer Belastungstest prüft den gespeicherten Bauzustand. Schaden reparieren, Verantwortung ablehnen oder intakten Bau abnehmen. | Schäden setzen Vorteile aus; bewährtes Werk gibt begrenzte Wahlunterstützung. Früher verschwiegene Mängel bleiben kausal erkennbar. | spielbar |
| P05 · Die Wahl von Sundhaven | Tatsächliche Wahl vorbereiten: Programm mit begrenzten Zusagen, offene Bündnisse, gekaufte Unterstützung oder unabhängige Kandidatur. | Wertet P01–P04 und Stadtgedächtnis aus. Wahl bleibt regulär ausgetragen; Niederlage führt in Opposition, Sieg zu überprüfbaren Pflichten. | geplant |
| P06 · Wessen Bürgerrecht? | Zugewanderte Gewerbetreibende beantragen Zugang. Gleichbehandlung, Probeprivileg oder restriktive Auflagen mit Zünften und fremdem Kontor verhandeln. | Ein konkretes Ratsrecht mit Laufzeit bzw. Widerrufsregel; bestehende Verträge werden nicht rückwirkend gelöscht. | geplant |
| P07 · Das Amt und der Vetter | Ein Verbündeter verlangt ein Amt für einen ungeeigneten Kandidaten. Eignung untersuchen, öffentlich ausschreiben, Gefälligkeit gewähren oder Antrag zurückweisen. | Reale Person besetzt eine reale freie Stelle; Kompetenz, Loyalität und Korruptionsbeleg begleiten ihre Amtsführung. | geplant |
| P08 · Rechenschaft vor der Stadt | Nach einer Amtsperiode werden die in P05 eingegangenen Zusagen geprüft. Erfüllung belegen, Fristverlängerung gegen Gegenleistung aushandeln oder Verantwortung abgeben. | Kein rückwirkendes Erfinden von Pflichten. Bewertung verändert Wiederwahl und Rolle in F04. | geplant |

#### Seefahrt – Menschen und Risiko statt bloßer Reisezähler (S01–S08)

| ID / Mission | Konflikt und unterschiedliche Handlungen | Anschluss und bleibende Folge | Stand |
| --- | --- | --- | --- |
| S01 · Die erste eigene Fahrt | Mit einem tatsächlich angestellten Kapitän Route, Ladung und Reserve vereinbaren. Kleine gesicherte Fahrt oder höheres gebundenes Kapital riskieren. | Reisebeleg, Kapitänsvertrauen und tatsächliche Bilanz eröffnen den Bogen; vorhandene Reisen zählen als Erfahrung. | geplant |
| S02 · Der Lotse im Nebel | Eine angekündigte schwierige Anfahrt: warten, einen verfügbaren Lotsen bezahlen oder die freie Passage wagen. | Gespeichertes Wetter und echte Verzögerung/Schadenswahrscheinlichkeit; ein bezahlter Lotse braucht Zeit und kann nicht zwei Schiffe gleichzeitig führen. | geplant |
| S03 · Geleit nach Bergen | Mit Bracht ein endliches Geleit organisieren; Beitrag, eigene Schutzfahrt oder unabhängige Route wählen. | Reale Schiffe, Kostenaufteilung und definierter Schutz; spätere Forderung in S08 hängt von übernommenen Pflichten ab. | geplant |
| S04 · Lohn unter Deck | Eine identifizierte Mannschaft beanstandet dokumentierte Lohnrückstände oder schlechte Versorgung. Zahlen, einen vertretbaren neuen Vertrag schließen oder rechtmäßig ersetzen. | Stimmung und Verfügbarkeit der Mannschaft; keine zufällige Meuterei ohne vorherige Ursache. H04 kann ihre Glaubwürdigkeit beeinflussen. | geplant |
| S05 · Das Schiff vor der Insel | Krankheitshinweis führt zu begrenzter Quarantäne. Versorgen, Ladung kontrolliert umladen oder eine angekündigt riskante Umgehung versuchen. | Ein gemeinsamer Krankheits-/Quarantänezustand; Crew, Liegeplatz und Ladung bleiben erhalten. Verknüpft K03 und C04. | geplant |
| S06 · Die gesperrte Passage | Fiktiver regionaler Handelsrechtsstreit: Umweg, Geleit, verhandelter Pass oder rechtlich klar begrenzter Kaperauftrag. | Kein beliebiges historisches Kriegsereignis. Einfluss auf tatsächliche Route und Beziehungen; Grundlage für F01. | geplant |
| S07 · Die Helling von morgen | Ruge plant eine Erweiterung der Lastadie. Kapital beteiligen, eigenes Material stellen oder Nutzungsrechte gegen feste Bauleistung verhandeln. | Geprüfte Baufläche, Baufortschritt und begrenzte Werftkapazität; keine kostenlose zusätzliche Werft. | geplant |
| S08 · Brachts gebundene Flotte | Bracht verlangt die Erfüllung tatsächlicher Geleit-/Kreditbindungen. Gegenleistung leisten, Anteile verkaufen oder ein begrenztes Entflechtungsabkommen schließen. | Vertragliche Freiheit oder Abhängigkeit trägt F03; bereits getilgte Bauschuld wird niemals neu gefordert. | geplant |

#### Kirche – Fürsorge, Gewissen und Einfluss (K01–K08)

| ID / Mission | Konflikt und unterschiedliche Handlungen | Anschluss und bleibende Folge | Stand |
| --- | --- | --- | --- |
| K01 · Licht und Brot | Anselm muss mit begrenzten Mitteln Gottesdienst und Versorgung organisieren. Anlass, Helfer und Verteilung gestalten; nicht nur Wachs abliefern. | Belegte Versorgung und persönliche Zusage; K02 knüpft an tatsächlich erreichte Haushalte an. | geplant |
| K02 · Das Pilgerhaus | Bruno will Unterkunft schaffen, Grete warnt vor Verdrängung. Bestehendes Haus mieten, erwerben und umbauen oder Gäste auf freie Betten verteilen. | Kapazität und Eigentum bleiben real; Kosten, Aufnahme und späterer Unterhalt haben einen Verantwortlichen. | geplant |
| K03 · Die geschlossene Tür | Begrenzte Pflegeplätze treffen auf neue Kranke. Zusätzliche Plätze finanzieren, gesicherte Verlegung organisieren oder nach sichtbaren Regeln priorisieren. | Gespeicherte Betroffene statt abstrakter Moralpunkte; verbindet S05 und vermeidet doppelte Krankheitsfolgen. | geplant |
| K04 · Das Siegel der Reliquie | Eine hochpreisige Reliquie hat zweifelhafte Herkunft. Prüfen, einen belegbaren Gegenstand stiften oder eine Fälschung bewusst verbreiten. | Erwerb bezahlt einen tatsächlichen Anbieter; spätere Enthüllung liest den damaligen Befund. Kein Neuwürfeln beim Laden. | geplant |
| K05 · Der Bischof kommt | Rat und Kirche streiten über den Empfang. Vermitteln, begrenzt stiften oder offen Partei ergreifen. | Besuch hat angekündigten Termin und endliche Nachfrage; Zusagen an beide Seiten können unvereinbar sein. | geplant |
| K06 · Zins und Gewissen | Ein dokumentierter Kredit gerät mit Kirchenrecht oder Versprechen in Konflikt. Erlass, transparente Umwandlung oder offener Rechtsstreit. | Wirkliche Restschuld wird geändert; Frömmigkeit und Kreditbeziehungen reagieren, keine frei erfundene neue Forderung. | geplant |
| K07 · Das verstummte Geläut | Ein Konflikt droht zum Interdikt zu werden. Tatsächliche Forderungen vermitteln, Ersatzversorgung organisieren oder auf Ratsgewalt setzen. | Bestehendes Interdikt-/Gottesdienstsystem erhält einen gemeinsamen Zustand; Einwohnerwege und Versorgung reagieren darauf. | geplant |
| K08 · Wessen Name steht am Tor? | Bei der Weihe eines tatsächlich finanzierten Hauses konkurrieren Stifterruhm und unabhängige Fürsorge. Namensrecht, Bürgerstiftung oder zurückhaltende Schenkung. | Stiftungssatzung statt sofortiger Titelvergabe; Nachfolge und Schlusschronik erinnern den realen Träger. | geplant |

#### Handwerk – Können, Eigentum und Arbeitsbedingungen (W01–W08)

| ID / Mission | Konflikt und unterschiedliche Handlungen | Anschluss und bleibende Folge | Stand |
| --- | --- | --- | --- |
| W01 · Das Meisterstück | Dreyer prüft ein echtes Werkstück. Besseres Material, sorgfältigere Arbeit oder bewusst kaschierte Fehler wählen. | Eine gespeicherte Güteprüfung, Material- und Zeitkosten; Nachprüfung statt beliebig wiederholtem Würfeln. | geplant |
| W02 · Wasser für zwei Räder | Müller und Gerber streiten um begrenzte Nutzung. Arbeitszeiten teilen, eine Verbesserung bauen oder Vorrang politisch sichern. | Verknüpfte Produktionskapazität und betroffene Betriebe; keine zweite unabhängige Warenproduktion. | geplant |
| W03 · Fässer für die Brauer | Böttcher und Brauer blockieren einander. Lohn-/Kapazitätsvereinbarung, gemeinsamer Invest oder Parteinahme. | Endlicher Kapazitätseffekt mit Ablauf und nachprüfbaren Pflichten; keine allein für die Mission erfundene Fassware. | geplant |
| W04 · Der verschwundene Lehrling | Eine gespeicherte Person verlässt einen Betrieb nach einem Streit. Aussagen prüfen, Arbeitsplatz wechseln lassen oder Rückkehr aushandeln. | Wohnort, Vertrag, Ausbildung und eigene Wünsche der Person bleiben konsistent; eröffnet D02 als Kontakt, nicht als identische Aufgabe. | geplant |
| W05 · Ein Riss im Stein | Gelieferter Werkstein fällt bei einer realen Baustelle auf. Charge zurücknehmen, auf eigene Kosten nacharbeiten oder den Prüfer beeinflussen. | Güte und Bauzustand entsprechen derselben Ursache; keine doppelte Schadensbuchung zu P04. | geplant |
| W06 · Die kalte Schmiede | Ein dokumentierter Brennstoffengpass bedroht Löhne. Kurzarbeit vereinbaren, verbundene Betriebe umplanen oder begrenzte Vorräte teuer sichern. | Produktionsausfall und Personalkosten bleiben tatsächlich, Hilfe begründet spätere Unterstützung. | geplant |
| W07 · Die Stimme der Zünfte | Dreyer und Vrome ringen um Gewerberechte. Schutzvertrag, offene Ordnung oder befristeten Kompromiss ausarbeiten. | Konkrete Satzung und Fraktionskosten; bestehende Betriebe verschwinden nicht durch einen einzelnen Dialog. | geplant |
| W08 · Das gemeinsame Werk | Mehrere vorhandene Gewerke sollen ein öffentliches Vorhaben gemeinsam tragen. Leistungsanteile, Haftung und echte Leitung vereinbaren. | Abschluss bewertet eigene Beiträge und frühere Streitlösungen; erleichtert Organisation in F02, schenkt keine Titelbedingung. | geplant |

#### Unterwelt – Versuchung, Beweise und Ausstieg (U01–U08)

| ID / Mission | Konflikt und unterschiedliche Handlungen | Anschluss und bleibende Folge | Stand |
| --- | --- | --- | --- |
| U01 · Der Hehler von Wismar | Peer vermittelt verdächtige endliche Ware. Herkunft prüfen, legalen Rückkauf vermitteln, melden oder bewusst hehlen. | Eindeutiger Herkunftsbeleg und realer Geschädigter; Ware wird nicht gleichzeitig legal verkauft. | geplant |
| U02 · Die zweite Zollrolle | Hasenkamps Register enthält einen konkreten belastenden Eintrag. Rechtmäßig Einsicht gewinnen, bestechen, stehlen oder Kopie manipulieren. | Unverwechselbares Beweisstück und gespeicherte Entdeckungsgefahr; H04/K06 können andere Lesarten eröffnen. | geplant |
| U03 · Die blinde Wache | Eine vorhandene Patrouille soll eine bestimmte Nacht auslassen. Eine begrenzte Bestechung, Ablenkung oder Verzicht. | Genaues Zeitfenster für einen bestehenden Vorgang; keine dauerhafte globale Abschaltung der Wache. | geplant |
| U04 · Das gerissene Tau | Ein Auftraggeber will eine rivalisierende Ladung sabotieren. Ablehnen, Beweise sichern, warnen oder tatsächlich beschädigen. | Ein endlicher echter Schaden mit betroffener Person; Warnung kann einen späteren Zeugen schaffen. | geplant |
| U05 · Ein Vogt zu viel | Bardowick wird mit belegten Verbindungen konfrontiert. Aussage, Vergleich, Schweigegeld oder Gegenbeweis. | Gericht benutzt bestehende Ermittlungen; keine Löschung fremder Verfahren durch einen Missionserfolg. | geplant |
| U06 · Gretes verschwundener Gast | Eine echte Gastperson bleibt nach einem Geschäft aus. Aufenthaltsfolge verfolgen, sichere Rückkehr finanzieren oder ihren Auftraggeber decken. | Gast verlässt/kehrt über Wege zurück; Gretes Vertrauen und Zeugenschutz in C07 reagieren. | geplant |
| U07 · Die letzte dunkle Fahrt | Netzwerk bietet einen letzten realen Schmuggelvorgang. Ausführen, offenlegen oder den bestehenden Freikauf nutzen. | Schiff, Ware, Zoll und Netzwerkbindung werden wirklich abgewickelt; Rückzug kann Besitz kosten. | geplant |
| U08 · Namen im Prozessbuch | Belege aus U01–U07 werden verhandelt. Einzelne Taten eingestehen, zulässigen Vergleich schließen oder mit vorhandenen Beweisen verteidigen. | Begrenzter Abschluss dieser Vorgänge; Verdacht ist kein automatischer Schuldbeweis. Folgen gehen in F04/D05 ein. | geplant |

#### Stadt und persönliche Bindungen (C01–C12)

| ID / Mission | Eigenständiger Konflikt und Tätigkeit | Verknüpfung / Ergebnis | Stand |
| --- | --- | --- | --- |
| C01 · Ein Haus als Machtbasis | Ein vorhandenes Haus erwerben/ausbauen, behalten oder tatsächlich verkaufen. | Reale Miete und Besitz; erhaltene unbeschädigte Stufe 2 unterstützt H03. | spielbar |
| C02 · Der Preis des Schweigens | Ein Mitwisser reagiert auf eine frühere schmutzige Methode; zahlen, sich anzeigen oder ihn offenlegen. | Datierter Erpressungsversuch mit begrenzter Eskalation; fremde Ermittlungen bleiben bestehen. | spielbar |
| C03 · Die Nacht der Funken | Eine angekündigte Brandgefahr verlangt Brandwachen, Räumung oder begrenzte bauliche Vorsorge. | Ein gemeinsamer Brandzustand; echte Schäden und gegebenenfalls Ersatzunterkunft statt verschwundener Bewohner. | geplant |
| C04 · Ein Bett für die Fremden | Grete muss tatsächliche Gäste auf begrenzte Betten verteilen. Zimmer finanzieren, Gastgeber finden oder geordnete Weiterreise vereinbaren. | Konkurrenz zwischen Pilgern, Seeleuten und Kaufleuten; bezieht K02/S05 ein. | geplant |
| C05 · Der Wald gehört wem? | Holzfäller, Jäger und Bauern verlangen verschiedene Nutzungen derselben Fläche. Nutzungszeiten, Wiederaufforstung oder begrenzte Entschädigung vereinbaren. | Gespeicherter Nutzungsvertrag beeinflusst reale Produktion; kein unendlicher Holzbonus. | geplant |
| C06 · Die Wette des Spielmanns | Ein benannter Spieler bietet eine nachvollziehbare Wette mit begrenzten Einsätzen an. Mitspielen, Betrug belegen oder den Streit schlichten. | Tatsächliches Spiel mit offengelegten Regeln; Einsatz stammt aus endlichen Kassen, kein unbegrenztes Rufspiel. | geplant |
| C07 · Eine Zeugin braucht Schutz | Eine früher gewonnene Zeugin fürchtet einen bestimmten Gegner. Unterkunft und sichere Wege organisieren, Aussage vertagen oder Vergleich anbieten. | Erhaltene Aussage verändert H04/U08; Hilfe kann den Arbeitgeber oder Gastgeber belasten. | geplant |
| C08 · Der Rat der Brunnenbank | Bekannte Nachbarn streiten um einen öffentlichen Platz. Anhören, Sitz-/Versorgungsangebot verändern oder Nutzung zeitlich teilen. | Echte Ziele und Belegung für vorhandene Bewohner; Platz wird genutzt statt nur dekoriert. | geplant |
| C09 · Die Schulden des Fährmanns | Eine vorhandene Dienstperson kann eine belegte Rate nicht zahlen. Umschulden, Dienstvertrag übernehmen oder rechtmäßigen Vermögensverkauf begleiten. | Reale Forderung und Dienstkapazität; verbindet H05/K06 ohne doppelte Schuld. | geplant |
| C10 · Das Maß des Marktes | Verkäufer und Kunden beanstanden manipulierte Maße. Vaget bei einer nachvollziehbaren Prüfung unterstützen, Ausgleich verhandeln oder den Täter decken. | Tatsächliche Marktgebühr/Abrechnung und befristete Konsequenz; keine beliebige Veränderung aller Preise. | geplant |
| C11 · Kein Platz beim Martinsmarkt | Bauern, Gaukler und etablierte Händler konkurrieren um begrenzte Standplätze. Plätze, Gebühren und Zeitfenster verhandeln. | Sichtbare Nutzung der freien Stadtfläche, echte Besucher und begrenzter Festverbrauch; kein zweiter identischer Dauer-Markt. | geplant |
| C12 · Die ungeschriebene Geschichte | Ein Chronist bittet um Belege widersprüchlicher Taten. Dokumente geben, Kommentar finanzieren oder auf Namensnennung verzichten. | Objektive Ereignisse bleiben unverändert; ausdrücklich subjektiver Ton und Gegenstimmen gehen in F06 ein. | geplant |

#### Familie und Nachfolge (D01–D06)

| ID / Mission | Konflikt und Entscheidung | Spätere Bedeutung | Stand |
| --- | --- | --- | --- |
| D01 · Zwei Familien, ein Vertrag | Eine Verbindung bringt Erwartungen an Vermögen, Wohnung und Religion. Bedingungen verhandeln oder die Verbindung ablehnen. | Tatsächliche Familienpersonen, Mitgift und Eigentum; keine bloße Kaufaktion für Frömmigkeit. | geplant |
| D02 · Ein eigener Weg | Ein geeignetes Familienmitglied wünscht Ausbildung, die dem Elternplan widerspricht. Wunsch fördern, Alternative anbieten oder finanzielle Grenze setzen. | Ausbildung braucht Zeit/Geld und verändert verfügbare Rollen; keine sofortige Amtsvergabe. | geplant |
| D03 · Der Faktor aus der Familie | Eine erwachsene ausgebildete Person möchte ein reales Fernkontor führen. Begrenztes Kapital und Kontrollrechte vereinbaren oder externe Leitung wählen. | Ein Faktorbericht über echte Tätigkeit; gemeinsames H06/K2-System, keine zusätzliche Pauschalrente. | geplant |
| D04 · Das Haus der Schwester | Ein lebendes Familienmitglied hat einen begründeten Wohn-/Besitzanspruch. Nutzungsrecht, tatsächliche Auszahlung oder nachvollziehbare Ablehnung. | Kauf, Verkauf und Miete bleiben konsistent; Ausgang prägt die spätere Erbteilung. | geplant |
| D05 · Das versiegelte Testament | Offene Schulden, Häuser und Beziehungen passen nicht zu allen Erberwartungen. Vermögen zuordnen, Forderungen vorab begleichen oder Pflichten transparent übertragen. | Nie mehr Vermögen verteilen als vorhanden; politische Unterstützung ist persönlich und wird nicht pauschal vererbt. | geplant |
| D06 · Ein Name, zwei Leben | Die tatsächliche Nachfolge verlangt neue eigene Zusagen. Erbe übernimmt bestehende Verpflichtungen, verhandelt erlaubte Änderungen oder veräußert Besitz. | Gründer bleibt Autor früherer Taten; neuer Ruf und alte Familiengeschichte stehen unterscheidbar nebeneinander. | geplant |

#### Gemeinsamer Schlussbogen: Die Zukunft Sundhavens (F01–F06)

| ID / Mission | Verflechtung und Handlung | Ergebnis | Stand |
| --- | --- | --- | --- |
| F01 · Die Briefe aus dem Sund | Ein fiktiver Handelsrechtskonflikt erreicht die Stadt. Datierte Berichte prüfen, diplomatische Kontakte nutzen oder begrenzt vorsorgen. | Beginnt nach gereiften Wegbögen, nicht zwingend nach allen 48 Wegmissionen. Zustand des Konflikts steuert Routen und Nachrichten gemeinsam. | geplant |
| F02 · Eine Stadt hält zusammen | Wetter-/Versorgungslage verschärft den Konflikt. Vorhandene Gebäude schützen, knappe Arbeit zuteilen, Evakuierung und echte Reserven organisieren. | P02/S07/K02/W08 geben belegte Möglichkeiten; wer sie nicht hat, erhält teurere oder kleinere Alternativen. | geplant |
| F03 · Der Preis der Freiheit | Kruse, Bracht, Rat und fremde Gesellschaften bieten unterschiedliche Bündnisse. Zeitlich und wirtschaftlich begrenzte Verpflichtungen verhandeln. | Alte Pakte, Schulden und Rechte werden ausdrücklich einbezogen; kein widersprüchlicher Gratisbeitritt zu allen Gegenseiten. | geplant |
| F04 · Die öffentliche Rechnung | Einwohner und Fraktionen verlangen Rechenschaft über konkrete Krisentaten. Belege vorlegen, Wiedergutmachung leisten oder verantwortliche Ämter abgeben. | Ehrlicher, kompromittierter und oppositioneller Ausgang sind spielbare Fortsetzungen. Kein zufälliges Löschen erreichter Titel. | geplant |
| F05 · Was wir weitergeben | Wiederaufbau und gegebenenfalls Nachfolge verbinden privates Kapital mit öffentlicher Zukunft. Eigentum, Stiftung oder gemeinsame Verwaltung wählen. | Vorhandene Familie oder eine institutionelle Alternative trägt die Zusage; kinderlose Partien bleiben abschließbar. | geplant |
| F06 · Die Chronik von Sundhaven | Frühere Entscheidungen werden mit dem Chronisten und ihren Betroffenen eingeordnet. Offene Forderungen begleichen oder bewusst ungelöst hinterlassen. | Mehrere begründete Schlussbilder aus tatsächlichem Vermögen, Rechten, Beziehungen und Versorgung. Freies Weiterspielen bleibt möglich. | geplant |

**Nächste spielbare Etappen:** P05 verbindet die vorhandenen frühen Politikkapitel mit der echten Wahl. Danach S01/S02 und W01/W02 als andere Tätigkeitsformen, bevor weitere große Lieferkonflikte hinzukommen. C04/K02 teilen eine reale Unterkunftsgrundlage; U01/U02 teilen belegbare Warenherkunft statt gesonderter erfundener Bestände. Die spätere Verteilung richtet sich nach dem Funktionsabgleich, nicht danach, möglichst rasch die Zahl 72 zu erreichen.

**Abnahme jeder Lieferung:** alle wesentlichen Lösungswege, Scheitern und Verweigerung; Laden vor/nach zeitversetzter Folge; fehlende Mittel/Güte; doppelte Klicks; vorhandene Vorleistungen; DE/EN und schmale Darstellung. Für wegübergreifende Folgen zusätzlich mindestens ein vollständiger Ablauf vom verursachenden Kapitel bis zur späteren Reaktion. Mehrjährige Simulationsläufe prüfen Geld-/Warenbilanz, Angebotsdichte und Sackgassen; sie ersetzen nicht das Durchspielen der Dialoge und Entscheidungen.

### 1.3 Aus Gerüchten werden Gelegenheiten

**Teilumsetzung 12. Oktober:** Datierte Beschaffungsberichte gegen Informationsgebühr, kostenlose Stammkapitänsbriefe, begrenzte Vorauszahlung und vorhandene Erstattungen sind spielbar. Generische Abnahmeangebote erwarteter Besucher bleiben offen.

Die Taverne verkauft Informationen über einen konkreten erwarteten Besucher. Ein Angebot nennt Ware, endliche Menge, Preis, Ankunftsfenster und Verlässlichkeit. Erst eine bestätigte Zusage wird zum Vertrag; ein bezahltes Gerücht allein erzeugt keine Lieferpflicht. Die betreffende Ladung oder Nachfrage wird beim Besucher reserviert, sodass Rivalen nicht denselben versprochenen Anteil verbrauchen.

Anschluss: `incoming`, Stammkapitäne, Planung und Verträge. Abnahme: verspäteter oder ausgefallener Besucher, verweigerte Zusage und ausverkaufter Restbestand haben eindeutige Folgen und Erstattungsregeln.

### 1.4 Erfolge als persönliche Chronik

Erfolge erscheinen in der Übersicht und im Schlussjournal, ohne weitere dauerhafte Hinweisleiste. Beispiele: 1.000 Last Salz tatsächlich gehandelt; zehn Jahre ohne Schmuggel; drei gleichzeitige Rivalenbündnisse; ein bestimmtes Schiff übersteht drei dokumentierte Stürme. Jeder Erfolg speichert Datum und Beleg. Die Belohnung ist Anerkennung beziehungsweise eine Chronikzeile, kein neuer endloser Geldbonus.

Anschluss: Handelsaktionen, Schiffsereignisse, Bündnisse, Titel. Abnahme: Warenverschiebung zwischen eigenen Lagern zählt nicht als Handel; alter Spielstand erfindet keine historischen Mengen oder Sturmfahrten.

### 1.5 Bittsteller erinnern sich

Hilfsgesuche referenzieren eine Person, einen konkreten Bedarf und eine Frist. Hilfe, Absage und Nichtantwort werden getrennt gespeichert. Später kann dieselbe Person eine Einführung, eine Empfehlung im Rat oder einen Hinweis anbieten. Dankbarkeit ist begrenzt und lässt sich nicht durch viele Kleinstspenden vervielfachen.

Anschluss: Personenloyalität, Post, Stadtgeschichten, Familien und Wahlen. Abnahme: eine Reaktion pro Gesuch, sichtbare Begründung späterer Fürsprache, erreichbarer Kontakt auch nach einem Amtswechsel.

## 2. Lernen und Entscheidungen erleichtern

### 2.1 Mittelspiellehrgang als freiwilliges Vorhaben

Nach Einführung und ungefähr 30.000 Mark Reinvermögen kommt ein Brief „Dein nächster Schritt“. Der Spieler wählt einen Schwerpunkt: Produktion, erste Fahrt, Besitz oder Rat. Fünf kleine Schritte erklären insbesondere laufende Kosten, fehlende Rohstoffe, Rücklagen und langfristige Bindungen. Bereits Erreichtes wird anerkannt; der Lehrgang kann archiviert werden und blockiert keine Freischaltung.

Abnahme: mindestens zwei unterschiedliche Wege durch den Lehrgang; keine Aufforderung zum unnötigen zweiten Kauf einer bereits vorhandenen Investition.

### 2.2 Hilfe beim ersten Besuch ohne neue Textkästen

Ein unaufdringlicher Punkt am vorhandenen `?` kennzeichnet ungelesene Ortshilfe. Beim Öffnen werden Zweck, typische erste Aktion und eine häufige Fehlannahme erklärt. Gelesene Artikel bleiben im Nachschlagewerk auffindbar. Automatisch aufklappende Banner und unumkehrbares „für immer geschlossen“ werden aus dem alten Vorschlag gestrichen.

Anschluss: bestehende Fragezeichen, neuer Artikelkatalog; Lesezustand je Artikelversion. Abnahme: Tastaturbedienung, erneutes Öffnen, Sprachwechsel und keine Veränderung des Spielzustands allein durch Menüwechsel außer dem Lesezeichen.

### 2.3 Wochenbrief des Faktors

Ein angestellter Faktor verschickt höchstens einmal je sieben Spieltage einen Bericht mit bis zu drei begründeten Hinweisen: drohende Frist, gebundenes Geld, ungenutzte Produktionschance oder passender Käufer. Jeder Hinweis enthält Beobachtungsdatum und eine Ortsaktion. Eigenschaften beeinflussen die Gewichtung; auch ein gieriger Faktor zeigt Kosten und Risiko ehrlich an.

Lageralter kann erst genannt werden, wenn Chargenalter erfasst wird. Bis dahin heißt ein Hinweis etwa „Seit dem letzten Bericht kein Verkauf“, falls dies tatsächlich belegt ist. Abnahme: kein Bericht ohne Faktor, keine falschen Bestände, keine unbegrenzt wachsende Post, keine Ausführung eines empfohlenen Geschäfts durch bloßes Lesen.

### 2.4 Markt- und Besucherpreise getrennt merken

Die vorhandenen 60 Markttage bleiben unverändert. Besucherbeobachtungen erhalten Herkunft, Kapitän, Tag, Güte und Preis nach Gebühren; geringe Mengen und Sonderrabatte werden gekennzeichnet. Sie erscheinen als Einzelbeobachtungen oder nachvollziehbare Spanne, nicht als erfundene tägliche Durchschnittskurve.

Abnahme: leere Vergangenheit bleibt leer; Marktkauf und Besucherverkauf werden nicht als gleichartige Preise vermischt; Speicherumfang ist begrenzt.

### 2.5 Durchsuchbares Nachschlagewerk

Artikelgruppen: Einstieg, Handel und Gewinn, Lager und Qualität, Produktion, Seefahrt, Gesellschaft, Rat und Kirche. Suche berücksichtigt Titel, Waren- und Gebäudenamen. Artikel enthalten ein kurzes Beispiel und passende Ortslinks; sie erklären aktuelle Regeln aus denselben Daten, die Aktionen verwenden. Die Fragezeichen öffnen direkt den betreffenden Artikel.

Abnahme: Suchwort „Gewinn“ erklärt Auszahlung minus Warenwert und Kosten; „Lager“ erklärt reservierten Platz; unbekannte Begriffe liefern sinnvolle Vorschläge. Keine veraltete zweite Kopie der Regeln in `helpText` pflegen.

## 3. Orte mit eigener Funktion

### 3.1 Kranpacht

Der Hafenmeister vergibt eine befristete Betriebspacht für einen vorhandenen städtischen Kran. Erträge richten sich nach dokumentiertem NPC-Umschlag, abzüglich Personal und Wartung. Eigene Umlagerungen und wiederholtes Be-/Entladen erzeugen keinen Gewinn. Ein Rivale kann dieselbe Pacht nach Ablauf übernehmen; es gibt nie zwei Pächter zugleich.

Auf der Karte wechseln Schild und Arbeitsmannschaft, nicht der gesamte Hafen. Abnahme: gleicher Ertrag mit sichtbarer und ausgeschalteter Animation; Streik und Hafensperre reduzieren die reale Nutzung; keine doppelte Belastung bereits vereinbarter Frachtkosten.

### 3.2 Kaufmannsversammlung und Termingeschäfte

Die Funktion wird zunächst im Schifferhaus beziehungsweise in der Gilde angeboten, statt sofort ein zusätzliches Börsengebäude zu platzieren. Ein Vertrag enthält Richtung, Gegenpartei, Ware, Menge, Qualität, Preis, Lieferort, Termin, Sicherheit und klare Nichterfüllungsregel. Kauf auf Termin ergänzt bestehende Verkaufslieferungen. Die Oberfläche zeigt gebundenes Kapital und Konkurrenz mit anderen Verpflichtungen.

Kein unbegrenztes Wetten ohne Ware: endliche Gegenparteibestände, Positionsgrenzen und erfüllbare Mengen. Bei einem Platzmangel wird eine vorab vereinbarte, begrenzte Annahmefrist angeboten, keine stillschweigende Warenlöschung. Abnahme: Marktpreissprung, gleichzeitige Fälligkeiten, Qualitätsmangel, Insolvenz der Gegenpartei und erneutes Laden am Abrechnungstag.

### 3.3 Ratskeller

Eine Ratskellerpacht nutzt das Rathaus als Zugang. Wein kommt aus echten Beständen und wird nur bis zur örtlichen Nachfrage ausgeschenkt. Gebührenbefreiung gilt ausschließlich für diese Menge; sie ist keine kostenlose Umgehung aller Marktgebühren. Ratsbegegnungen haben Termine und eine begrenzte Wirkung, keinen dauerhaft stapelbaren Geschenkerabatt.

Abnahme: ohne Wein kein Weinerlös, verärgerte Kaufleute reagieren auf Privilegien, Pacht läuft sichtbar aus. Verbindet Handel und Politik.

### 3.4 Münzrecht

Das legale Münzrecht ist ein später Ratsauftrag, nicht ein zweiter Falschgeldknopf. Vor einer neuen Silberware müssen Importquellen, Nachfrage des Goldschmieds, Güte und Transport vollständig ergänzt sein. Der Spieler beschafft Metall, zahlt Lohn und Abgabe und erfüllt einen begrenzten Prägeauftrag. Die ausgezahlte Summe wird mit dem Metallverbrauch abgerechnet.

Eine Münzverrufung wird angekündigt und betrifft ausgewiesene umlaufende Münzbestände beziehungsweise Tauschkosten; sie darf nicht überraschend und unbeschränkt den gesamten abstrakten Geldwert vernichten. Abnahme: keine selbstverstärkende Metall–Münzen–Metall-Schleife, gleiche Regeln für Spieler und konkurrierende Aufträge.

### 3.5 Lotsenhaus

Das bestehende Gebäude erhält einen Dienstleistungsbereich zusätzlich zum zugeordneten Haushalt. Für eine konkrete eigene Fahrt kann Lotsenhilfe bestellt werden; der Preis und die reduzierte Gefahr bei der Hafeneinfahrt stehen vorher fest. Sie verhindert keine Piratenüberfälle auf hoher See. Erfahrene Lotsen verkaufen datierte Ankunftsberichte, ohne unbekannte zukünftige Ereignisse zu verraten.

Abnahme: ein Auftrag pro Ankunft, kein zweites Lotsengeld aus der Salzgeschichte für denselben Dienst, Lotse mit Name und Weg, Wirkung auch ohne Kartenanimation.

### 3.6 Fronerei und Henker

Der Vogt erhält ein Prozessbuch mit belegter Anschuldigung, Anhörung, Ausgang und zeitlich begrenzten Folgen. Rivalen verlieren während einer Sperre bestimmte Handlungsrechte, nicht ihre gesamten gespeicherten Häuser oder Beziehungen. Der Henker ist eine benannte Figur mit Wohnort und zwei unterschiedlichen Diensten: öffentliches Amt und riskante Information.

Abnahme: keine frei wiederholbare Ausschaltung eines Rivalen; Anschuldigung hat Kosten und Gegenrisiko; Fristen und Rückkehr der Handlungsfähigkeit sind gespeichert.

### 3.7 Pilgerunterkunft

Zunächst wird ein Teil der vorhandenen Herberge gestiftet. Belegte Betten benötigen endliche Versorgung, Personal und Pflege. Pilger erhalten normale Gästeprofile und reisen an. Gute Versorgung stärkt Kirche und örtliche Nachfrage; Überbelegung erhöht das Krankheitsrisiko. Ein eigener Neubau folgt erst mit freiem, geprüftem Bauplatz.

Abnahme: dieselben Betten werden nicht doppelt verkauft, Pilger konsumieren nicht noch einmal zusätzlich denselben bereits gebuchten Bedarf; Pestschutz begrenzt, beseitigt aber nicht jede Gefahr.

### 3.8 Siebentägiger Bauernmarkt

Der Neue Markt bekommt einen festen, im Kalender sichtbaren Wochentag. Erzeuger reservieren nur ihren tatsächlichen Überschuss, transportieren ihn in die Stadt und nehmen unverkaufte Ware zurück. Marktstände öffnen und schließen mit dem Tagesablauf. Wetter und Sperren können die Anreise verhindern; Käufer sehen die Ursache.

Abnahme: günstige Mengen sind begrenzt; Verkauf am Hof und Markt greifen nicht doppelt auf denselben Vorrat zu; Anbieter und Kunden laufen hin und heim. Der bestehende allgemeine Markttagsbonus wird für denselben Bedarf nicht zusätzlich verdoppelt.

## 4. Menschen mit fortlaufender Geschichte

### 4.1 Vertrauen bei Stammkapitänen

**Umgesetzt 12. Oktober:** Ab drei Besuchen und Vertrauen 3 gelegentlich ein datierter Warenbrief zur tatsächlichen nächsten Ankunft, je Kapitän höchstens alle 14 Tage. Der Kurzknopf sichert bis acht Last durch Vorauszahlung aus dem gemeinsamen Vorrat; erst die Zahlung bindet die Menge. Kapitänsidentität wird für die Anreise reserviert.

Der vorhandene Preisvorteil bleibt gedeckelt. Nach mehreren verlässlichen Besuchen wird gelegentlich ein datierter Bericht oder ein kleiner reservierbarer Ladungsanteil angeboten. Der Kapitän benennt Ablaufdatum und Bindung; Vertrauen schafft Zugang, aber keine kostenlosen Waren. Der Anteil wird derselben Ankunft entnommen, aus der bereits Vorauszahlungen bedient werden.

Abnahme: höchstens eine Vertrauensverbesserung je Besuch; doppelte Reservierung ausgeschlossen; mehrere Schiffe desselben Kapitäns erzeugen keine widersprüchlichen Identitäten.

### 4.2 Rivalen und Erben

Rivalenhäuser bekommen eine dauerhafte Hauskennung, davon getrennte Personen und eine angekündigte Nachfolge. Besitz, Schulden und Verträge bleiben beim Haus; Haltung und Prioritäten können sich mit dem Erben ändern. Ein neuer Emporkömmling erhält eine belegte Herkunft, begrenztes Startvermögen und kauft vorhandene Angebote.

Abnahme: alte Briefe nennen weiterhin den damaligen Absender, neue Anträge den Nachfolger; kein Vermögensreset, kein plötzlich unbesetztes Monopol. Ein früherer Faktor darf nur auftreten, wenn seine Vorgeschichte tatsächlich gespeichert ist.

### 4.3 Vier Nebenfiguren, je eine kurze Kette

| Figur | Begegnungen | Entscheidung und Folge |
| --- | --- | --- |
| Bettlerkönig | vermisste Ware → Zeuge → Wiederbeschaffung | Hilfe leisten oder Information bezahlen; konkrete Beziehung, kein allwissender Einbruchsmelder |
| Kräuterfrau | Krankheit → Materialbedarf → öffentlicher Vorwurf | Behandlung finanzieren, für sie eintreten oder Abstand halten; Versorgung, Kirchenansehen und Ruf reagieren |
| Stadtschreiber | unklare Urkunde → Recherche → Beglaubigung | rechtmäßige Belege beschaffen oder Fälschung riskieren; dasselbe Dokument bleibt später nachweisbar |
| Henker | amtlicher Auftrag → zweifelhafter Informant → Aussage | Wissen nutzen oder melden; Verknüpfung zum Prozessbuch und Unterweltweg |

Die Figuren werden an bestehende Gebäude gebunden und wie andere Bewohner anklickbar. Abnahme: je zwei tragfähige Abschlüsse, erkennbare Kosten, gespeicherte Erinnerung und kein neuer Auftrag während derselbe Konflikt bereits läuft.

### 4.4 Ausbildung zum Faktor

Ein geeignetes Kind oder ein aufgenommener Lehrling erhält einen Mentor, laufende Kosten und Ausbildungsentscheidungen. Nach drei Spieljahren wird eine Anstellung angeboten, kein zusätzlicher automatischer Faktor erzeugt. Erlernter Schwerpunkt beeinflusst Berichte und Handelsprioritäten; der Vertrag nutzt das bestehende Personalsystem.

Abnahme: Alter und Ausbildungsdauer stimmen nach Laden und Nachfolge; Entlassung löscht nicht die Person. Der Spieler kann den bisherigen Faktor behalten.

### 4.5 Gesandter und Hansetag

Ein jährliches angekündigtes Schreiben enthält eine regionale Forderung und mehrere Beiträge: Geld, Güter, diplomatische Unterstützung oder begründete Ablehnung. Der Gesandte besucht die Stadt als Gast. Seine gespeicherte Bewertung beeinflusst eine spätere Verhandlung, garantiert aber keinen Sieg.

Abnahme: genau eine Forderung pro Jahr, keine Überschneidung mit einem identischen Hansetag-Beitrag, vergangene Zusagen im Journal einsehbar.

### 4.6 Der Chronist

Ein Mönch im Kloster sammelt belegte Taten. Eine Stiftung kann Zugang, Ausführlichkeit und Ton des Berichts beeinflussen, keine Niederlage in einen Erfolg verwandeln. Der Schlussbericht verbindet objektive Bilanz und ausdrücklich subjektiven Kommentar.

Abnahme: Titel, tatsächliche Gewinne und begangene Vergehen bleiben korrekt; Schenkungen erzeugen weder neue Tatsachen noch unendlich wiederholbare Rufpunkte.

## 5. Ereignisse mit Vorbereitung und Nachwirkung

### 5.1 Sturmflut und Küstenschutz

Das vorhandene Hochwasser wird um eine Vorwarnung, örtliche Gefährdung und ein Bauprojekt ergänzt. Der Spieler kann gefährdete Bestände umlagern, zeitweiligen Schutz bezahlen oder dauerhaft investieren. Schutz kostet Holz, Werkstein, Arbeit und Unterhalt; während der Arbeiten sind einzelne Kaiabschnitte eingeschränkt.

Zuerst muss klar sein, welche Ware tatsächlich in welchem Speicher liegt. Bis diese Zuordnung existiert, gibt es nur ausdrücklich stadtweiten Schutz, keine erfundenen individuellen Speicherverluste. Abnahme: jede Charge höchstens einmal geschädigt, bekannte Gefahr angezeigt, sichtbare Baustelle mit freiem Umweg, Wirkung unabhängig von der Animation.

### 5.2 Regionaler Blockadekonflikt

Der Vorschlag wird als fiktiver Konflikt um Handelsrechte im Sund entworfen. Eine konkrete historische Kriegskampagne ab 1372 benötigt vor ihrer Ausarbeitung einen gesonderten Quellenabgleich. Phasen: Spannungen und Gerüchte, befristete Kontrollen, Blockade, Verhandlung und Nachwirkung. Nicht alle Handelswege fallen gleichzeitig aus.

Händler können Vorräte sichern, Reeder Geleit anbieten, der Rat Beiträge verhandeln und Schmuggler eine riskante Route nutzen. Abnahme: mindestens ein bezahlbarer alternativer Beschaffungsweg; Versicherungen, Kaperbriefe und Lieferverträge behandeln denselben Schaden konsistent; keine automatisch rückwirkenden Vertragsänderungen.

### 5.3 Kornkrise

Aus einer angekündigten Missernte entstehen drei konkrete Angebote: begrenzter Notverkauf zu hohem Preis, Ratslieferung zum Festpreis oder Spende. Vorräte bleiben frei verfügbar, bis eine Handlung bindend ausgeführt wird. Die Bevölkerung erinnert sich an tatsächlich gelieferte Mengen und Zeitpunkt; gewöhnlicher Verkauf erhält nicht pauschal dieselbe Bewertung wie organisierte Notversorgung.

Abnahme: keine doppelte Anrechnung auf Spende und Verkauf, kein Pflichtverlustgeschäft ohne vorher sichtbare Gegenleistung, späterer Fürsprecher verweist auf den richtigen Vorgang.

### 5.4 Ausbleibender Heringszug

Ein saisonaler Verlauf ersetzt einen ununterbrochenen Jahresmalus: schwache Fänge, steigende Salz-/Räucherkapazitätsprobleme, Unterstützung und Erholung. Betroffene Fischerhaushalte führen begrenzte Notstände; daraus können konkrete Darlehensgesuche oder Hausangebote entstehen. Lieferalternative und Reparaturhilfe ermöglichen Gegenentscheidungen.

Abnahme: Notlage folgt tatsächlichen Ereignissen statt zufälligem zusätzlichem Hausverkauf; Ende und Erholung sind sichtbar; der kurze bestehende Netzausfall wird nicht parallel doppelt gerechnet.

### 5.5 Böttcher gegen Brauer

Ein befristeter Streit betrifft Fassversorgung und Braukapazität. Vermittlung kostet Zeit oder Einfluss, ein gemeinsamer Auftrag Material und Lohn, Parteinahme gewinnt einen Fürsprecher und verärgert die andere Seite. Keine neue Fassware einführen, solange Verpackung nicht als durchgängige Produktionsressource behandelt wird; zunächst einen transparenten Kapazitätseffekt verwenden.

Abnahme: Wirkung endet oder geht in eine dokumentierte Vereinbarung über; sie stapelt sich nicht unbegrenzt mit Hafenstreik und Zunftaufstand.

### 5.6 Fürstenbesuch

Die Gesandtschaft wird um vorher bestellbare Versorgung, festes Besuchsfenster und eine echte Einladung erweitert. Wer bewirtet, wählt zwischen kleinem sicheren Auftrag und größerer gesellschaftlicher Verpflichtung. Ein Privileg besitzt Umfang und Ablaufdatum; die mögliche spätere Gegenforderung wird vorher als Bindung erklärt.

Abnahme: Nachfrage ist endlich, die Nachwirkung tritt höchstens einmal ein, Absage lässt andere Wege offen, das bestehende Gesandtschaftsereignis wird nicht als zweiter gleichzeitiger Besuch erzeugt.

### 5.7 Strenger Hafenwinter

Eis entsteht aus einem gespeicherten Winterzustand. Erst sinkt die Kapazität, dann werden betroffene Schiffsankünfte verschoben. Landhandel, eingelagerte Vorräte und gegebenenfalls Schlitten bieten Alternativen. Ein Eisjahrmarkt ist nur bei ausdrücklich freigegebenem Eisbereich möglich; Personen folgen geprüftem Wegnetz, nicht beliebig jeder Wasserfläche.

Abnahme: keine gleichzeitig fahrenden Schiffe im gesperrten Bereich, Auftauen räumt Wege und Besucher kontrolliert, Lieferfristen und Erstattungen bleiben nachvollziehbar. Die normalen jährlichen Zielsperren und das Sonderereignis werden gemeinsam bewertet.

### 5.8 Fastnacht, Martinsmarkt und Kirchweih

Jedes Fest bekommt eine eigene Tätigkeit statt nur anderer Fahnen: Fastnacht mit Spielleuten und Wirten, Martinsmarkt mit Bauern und Wintervorräten, Kirchweih mit Gottesdienst, Besuchern und Stiftungen. Beschaffungsangebote erscheinen vorher im Kalender. Bereits existierende Feste behalten ihre tatsächlichen Nachfrageeffekte.

Abnahme: wiederkehrende Termine stimmen über den Jahreswechsel, Dekoration und Figuren werden aus demselben Ereigniszustand gesteuert, Festverbrauch wird nur einmal gebucht. Kalenderdaten sind im Spiel bewusst vereinfachte Termine, solange keine historische Kalenderberechnung implementiert ist.

## 6. Stadtentwicklung ohne beliebige neue Kulisse

### 6.1 Lastadie

Die Werftvorstadt wächst in vorbereiteten Bauabschnitten: Holzlager, Helling, Seilbahn und Werkhäuser. Sie verknüpft Holzhof, Seilerei, Segelmacherei und Schiffsbau. Ein gemeinsamer Bauauftrag bindet Material und Arbeitszeit; fertige Infrastruktur reduziert konkrete Baukosten innerhalb einer begrenzten Kapazität.

Abnahme: keine Duplikate der bisherigen Betriebe oder ihrer Erträge, erreichbarer Transportweg, freie Fahrrinne und eindeutige Eigentumsrechte. Bestehende Gebäude werden erst nach gesonderter Kartenplanung umgesetzt oder erweitert.

### 6.2 St.-Jürgen-Vorstadt

Das Viertel entsteht schrittweise aus vorhandener Herberge, Gärten und Pflegeangeboten. Wachstum setzt Nachfrage, Versorgung und Erschließung voraus. Eine Fehde kann angekündigte Schäden verursachen; Evakuierung, Miliz oder Frieden bieten Gegenmaßnahmen. Bewohner erhalten Ersatzunterkünfte statt aus dem Spiel zu verschwinden.

Abnahme: Erweiterung beschädigt keine vorhandenen Höfe oder Karawanenplätze; Arbeits- und Wohnwege funktionieren auch bei gesperrtem Landtor; Wiederaufbau hat begrenzte Kosten und ein Ende.

### 6.3 Quarantäneinsel

Die vorhandene Insel erhält nach einem Ratsbeschluss einen Anleger und begrenzte Versorgungsplätze. Ein betroffenes Schiff wartet mit Crew und Ladung auf Freigabe. Die Stadt muss Versorgung und Dauer finanzieren; der Spieler kann stiften, regelkonform warten oder eine sichtbare Umgehung riskieren.

Abnahme: Quarantäneschiffe verkaufen nicht gleichzeitig am Stadtkai, Ladung wird nicht doppelt gebucht, eine spätere Freigabe ist garantiert oder hat eine definierte Ausfallregel. Kontrollen berücksichtigen den realen Krankheitszustand der Kampagne.

### 6.4 Fremdenkontor

Ein vorhandenes geeignetes Bürgerhaus wird zunächst vertraglich angemietet. Die ausländische Gesellschaft hat endliches Kapital, eigene Warengesuche und Rechte mit Laufzeit. Privilegien erhöhen Handel und Konkurrenz; Gleichbehandlung, Sonderrechte und Widerruf haben verschiedene politische Folgen.

Abnahme: keine kostenlosen Waren aus unbekannter Herkunft; reguläre Hausmiete und Handelsgebühren werden korrekt aufgeteilt; Widerruf führt zu einer geordneten Abreise und Abwicklung offener Verträge.

### 6.5 Sichtbares Stadtwachstum

Eine Liste geprüfter Bauparzellen bestimmt, wo überhaupt gebaut werden kann. Freischaltung verlangt über längere Zeit Wohlstand, belegte Nachfrage und Versorgung. Stufen: abgesteckt, Materiallager, Baustelle, Bezug. Verfall zeigt zuerst Reparaturbedarf und Leerstand; Häuser und Bewohner werden nicht spontan gelöscht.

Mauererweiterung ist ein späteres gemeinsames Projekt mit Toren, Wegen und neuer Navigation. Abnahme: jeder Bauzustand korrekt anklickbar und sortiert; laufende Wege werden sicher neu geplant; alte Spielstände behalten belegte Flächen.

## 7. Verbundene Wirtschafts- und Gesellschaftssysteme

### 7.1 Chargenalter und Haltbarkeit

Für verderbliche Waren werden Menge, Einlagerungstag, Güte und Herkunft je Charge gespeichert. Neue Ware verjüngt keine alte. Verkäufe und Verarbeitung entnehmen standardmäßig die älteste geeignete Charge; eine Mindestgüte kann andere Chargen erfordern. Lagerhaus und Planung zeigen gefährdete Mengen und den nächsten sinnvollen Schritt.

Die vorgeschlagenen acht Tage für Frischfisch und 60 für Bier sind zu prüfende Startwerte. Lagerart und Konservierung beeinflussen Haltbarkeit; „Getreide verdirbt nie“ wird durch sehr langsamen Verderb bei geeigneter Lagerung ersetzt. Keine überraschende Vernichtung alter Spielstände: bestehender Bestand beginnt mit dem Migrationsdatum und klarer Einführung. Abnahme: Mengenbilanz bei Teilverkauf, Mischen, Produktion, Schiffsladung und Schaden; keine doppelte Qualitätsminderung aus demselben Ereignis.

### 7.2 Datierte Nachrichten aus fremden Städten

Seefahrt zeigt eine einfache Handelskarte mit den tatsächlich bekannten Berichten. Jede Notierung nennt Ware, beobachteten Preis, Menge, Güte, Quelle und Alter. Mit der Reisezeit sinkt die Sicherheit; „unbekannt“ bleibt unbekannt. Die Routenplanung rechnet Reise-, Kapitäns-, Zoll- und Rückfrachtkosten ein.

Zunächst sind Berichte Beobachtungen des vorhandenen Preis- und Vertragsmodells. Erst ein eigener simulierter Fremdmarkt rechtfertigt dynamische fremde Tagespreise. Abnahme: kein Wissen über zukünftige Zufallsentscheidungen, keine garantierte Gewinnanzeige bei veraltetem Bericht.

**Erster spielbarer Routenbaustein (12. Oktober):** Unter Seefahrt beziehungsweise Hafenmeisterei führt „Außenhandel & Routen“ zu sieben Seehandelsstädten. Je Stadt lässt sich ein Plan mit einer beliebigen Handelsware aus dem eigenen Lager, Menge und optionaler Rückfracht speichern. Jede Abfahrt wird ausdrücklich bestätigt, nutzt ein leeres eigenes Schiff und verbraucht vorhandene Lagerware. Die Vorschau nennt schiffsabhängige Reisedauer, aktuelles Raubrisiko, Warenwert, Verkaufserlös, Reiseprämie und Wiederanlage in Rückfracht. Bestehende Abwicklung, Güte, Kostenbasis, Wintergrenzen und Versicherung gelten weiter. Nach Rückkehr bleibt Ware an Bord; Reisebeleg und Nachricht dokumentieren Restgeld, Warenwert, Versicherungsersatz und Handelsergebnis; vorbereitete Flotten berücksichtigen nun ihre direkten Reisekosten (siehe 7.3b). Keine erfundenen dynamischen Fremdpreise, keine automatische Serienfahrt und keine garantierte Marge. Alte Fahrten erhalten keine rückwirkend erfundenen Belege.

### 7.3 Beziehungen zu Herkunftsstädten

**Erster spielbarer Beziehungsbaustein (12. Oktober):** Jede der sieben Seehandelsstädte führt eigenes gespeichertes Vertrauen (0–100). Eine zurückgekehrte Fahrt mit mindestens acht Last dort gesuchter Ware, mindestens 200 Mark tatsächlichem Verkaufserlös und mittlerer Güte 85 gibt +4, höchstens einmal je Stadt in 30 Tagen. Schlechte Güte bei solch einer Lieferung kostet stattdessen drei Punkte. Leere/Kleinstfahrten und Piratenverluste erzeugen keinen Zuwachs. Je 20 Vertrauen sinkt der Abschlusspreis eines neuen Jahresvertrags um 5 %, höchstens 20 %. Rangbedingungen gelten weiter; bereits geschlossene Verträge werden nicht verändert. Nur belegte Rückkehr zählt, nicht Speichern eines Plans oder Ausfahrt.

**Weiterer Ausbau:** Stadtansehen soll außerdem durch eingehaltene relevante Lieferverpflichtungen wachsen, mit einer gemeinsamen Begrenzung pro Zeitraum. Persönliches Kapitänsvertrauen bleibt separat. Stadtansehen eröffnet Verhandlungen über Verträge; Geld und Amtsprivilegien können andere Zugänge bieten, ohne den Beziehungsweg wertlos zu machen.

Abnahme: bestehende bezahlte Verträge behalten ihre Laufzeit; kein rückwirkender Entzug. Kleinstgeschäfte und Eigentransfers farmen keine Diplomatiepunkte.

### 7.3a Außenhandel als langfristiger Spielweg

Der Benutzer hat Außenhandel, Handelsrouten und Handelsbeziehungen ausdrücklich als wichtigen Bestandteil ergänzt. Der oben beschriebene spielbare Anfang wird in die bestehenden 72 Missionen eingebunden; Routen und wiederholte Fahrten zählen nicht als zusätzliche Quests. Ziel ist ein Handelsnetz mit Partnern, Abhängigkeiten und politischen Konflikten, das über die ganze Partie wächst.

| Ausbau | Konkrete Entscheidungen | Verbindung zu bestehenden Geschichten / Abnahme |
| --- | --- | --- |
| Handelsräume mit eigenem Profil | Lübeck als naher Vermittler; Bergen für Fisch und Versorgung; Danzig für Korn und Holz; Riga für Wachs und Pelze; Stockholm für Eisen; Brügge für Tuch und Luxus; London für Wolle und Tuch. Diese Rollen beschreiben die Spielprofile. | Bestehende Warenketten verwenden; Herkunft und Qualität einer Ladung bleiben nachvollziehbar. H01/H02 werden Einstieg, keine zweite Kopie derselben Aufgaben. |
| Regionale Märkte und Berichte | Endliche Vorräte, echte lokale Nachfrage, Produktion, Verbrauch und Störungen. Nur datierte Beobachtungen zeigen konkrete Preise; Ferne erzeugt Informationsrisiko. | Grundlage für H04/H05 und S01/S02. Preise lassen sich nicht allein durch beliebige UI-Aufrufe neu würfeln; Geld und Ware beider Seiten stimmen. Noch nicht umgesetzt. |
| Mehrgliedrige Handelsrouten | Ausfuhr, Zwischenverkauf, Nachkauf, Versorgung und Rückfahrt je Etappe planen; direkter Weg gegen Umweg und höhere Kapitalbindung abwägen. | S03/S06: Geleit und gesperrte Passage betreffen eine echte Etappe. Jede Ladung genau einmal transferieren; Unterbrechung hat definierten sicheren Hafen. Noch nicht umgesetzt. |
| Wiederkehrende Fahrten mit Grenzen | Optionaler Auftrag an einen Kapitän mit Warenmengen, Preisgrenzen, Betriebskapital, Mindestreserve und Abbruchregeln. Rückkehrbericht und ausdrückliche Pause bei Geld-, Güte- oder Sicherheitsproblemen. | S04/S08 und D03. Kein endloses Kaufen ohne Budget; Automatik kann keine unbekannten zukünftigen Preise kennen. Der aktuelle Routenplan startet nur manuell. |
| Beziehungen und Handelsrechte | Stadtvertrauen, persönlicher Kontakt und Mitgliedschaft getrennt halten. Befristete Kontingente, Lieferpläne, Hafengebühren, Schutzrechte und fairer Wettbewerb verhandeln. | H03/H06/P06/F03: Exklusivität verärgert andere Partner, gebrochene Zusagen haben konkrete Belege. Keine heimliche Aufhebung bezahlter Altverträge. Preisnachlass ist bereits spielbar; weitere Vertragsarten bleiben offen. |
| Land- und kombinierter Handel | Köln und weitere später begründete Ziele mit Fuhrleuten, Zwischenlagern und definierten Landetappen anbinden. Hafen und Umland teilen Bestände und Transportbelege. | C05/C09/W02. Eigene Seeroute derzeit nur für Seeziele; vorhandene Karawanen handeln weiterhin wie bisher. Kein bloß umbenanntes Schiff auf einer Landroute. |
| Fernkontore mit Verantwortung | Reales Arbeitskapital, Lager, lokale Person und überprüfbarer Geschäftsbericht; Partnergeschäft, eigener Stützpunkt oder bewusster Rückzug. | H06/H07/D03, K2. Erst vorhandene Pauschale ablösen, wenn echte Auslandsbuchungen funktionieren; nie beide Erträge aus demselben Geschäft. Noch offen. |
| Ereignisse und Diplomatie | Hafenstreik, Missernte, Messe, Embargo, Zollstreit und Gerüchte verändern tatsächliche regionale Bedingungen. Vorbereitung, Alternativroute, Vermittlung oder riskante Umgehung statt pauschaler Zufallsstrafe. | S05/S06/K05/F01–F04. Gemeinsamer Ereigniszustand für Markt, Nachrichten, Reise und Mission; politische Entscheidung wirkt auf benannte Städte und Fraktionen. |

**Reihenfolge:** gespeicherte Routen und Stadtbeziehungen → regionale Bestände und datierte Berichte → echte Lieferabkommen → mehrere Etappen → begrenzte Automatik und eigenständig wirtschaftende Fernkontore. Reise-, Waren- und Vertragsbelege werden dabei erweitert, statt ein paralleles Handelssystem neben den vorhandenen Schiffen aufzubauen.

### 7.3b Eigene Flotte, Versorgung und laufende Kosten — spielbar

Seit 12. Oktober ergänzt `seebetrieb.js` den Routenbaustein. „Flotte & Versorgung“ ist eine eigene Ansicht unter Seefahrt; Werft, Außenhandelsplan und Flottennachrichten führen direkt dorthin. Die bestehende Reiseabwicklung bleibt die einzige Quelle für Verkauf und Rückfracht.

| Typ | Bauzeit | Laderaum vor Proviant | Mannschaft neben Kapitän und Smutje | Rumpfunterhalt täglich | Schadensrisiko je Sturm |
| --- | --- | --- | --- | --- | --- |
| Schnigge | 6 Tage | 40 Last | 4 Matrosen | 2 Mark | 30 % |
| Kogge | 12 Tage | 80 Last | 7 Matrosen | 3 Mark | 22 % |
| Holk | 18 Tage | 130 Last | 11 Matrosen | 5 Mark | 15 % |

**Sichtbare Bauphasen (umgesetzt):** Vier/fünf/sechs zeichnerische Stadien für Schnigge/Kogge/Holk auf zwei Bauplätzen. Der Dialog zeigt Bauphase und Prozentfortschritt. Fischerboote werden ebenfalls bestellt: drei Tage, drei Phasen, Fang und Unterhalt erst nach Stapellauf. `nachttransport.js` liefert den gemeinsamen Fortschritt, `hafenbau.js` zeichnet ihn; der Gebäude-Cache berücksichtigt die Bauphase.

**Werft:** Reguläre Grundpreise bleiben 5.000/9.000/16.000 Mark, bestehende Werftvergünstigungen gelten. Der Bauauftrag bezahlt Material und Arbeit vollständig im Voraus. Höchstens zwei Bauplätze, bestellte Schiffe zählen zum Flottenlimit. Stornierung vor Fertigstellung erstattet 80 %. Erst am Fertigstellungstag entstehen das Schiff und die Nachricht. Die interne Sofortkauffunktion bleibt für alte Integrationen und Testfixtures erhalten; die Spieloberfläche verwendet ausschließlich Bauaufträge.

**Abfahrt vorbereiten:** Kapitäne behalten ihre bisherigen Angebote, Handgelder, Löhne und Eigenschaften. Matrosen kosten einmalig je 20 Mark und täglich eine Mark; der namentlich geführte Smutje 50 Mark Handgeld und zwei Mark täglich. Löhne gelten auch im Hafen. Matrosen und Smutje werden in der Flottenansicht angeworben. Der bisherige Spelunken-Matrosendienst bleibt eine Rumpfreparatur, keine alternative Mannschaftsliste. Abfahrt braucht die vollständige Besatzung, mindestens 50 % Rumpf, Moral 40, keine Schiffsbetriebsschulden und Proviant für die konservativ berechnete Fahrt plus drei Reservetage. Kaperfahrten und die Vitalienjagd verlangen dieselbe Vorbereitung für ihre jeweilige Dauer; ein verlorenes oder umgekehrtes Jagdschiff gewinnt die Mission nicht trotzdem.

**Proviant und Lager:** Getreide, Räucherfisch und Käse ab Güte 85 werden aus realem Lagerbestand gebunkert. Eine Last entspricht 150 Personentagen, belegt Laderaum und bewahrt ihre Anschaffungskosten. Auf See wird pro Person und Tag eine Ration verbraucht; Restproviant kann samt anteiligem Warenwert wieder eingelagert werden. Wasser wird in Häfen abstrahiert ergänzt. Lagerarbeiter müssen angeworben werden: 60 Mark einmalig und zwei Mark täglich je Person, höchstens acht. Jeder bewältigt täglich 80 Last Schiffsumschlag einschließlich Proviant. Kleine Marktgeschäfte erledigt der Spieler selbst. Unbezahlter Lagerbetrieb blockiert Umschlag; ein neuer Tag setzt die Leistung zurück.

**Ausfuhr eigener Produktion:** Erzeugnisse aus Höfen und Werkstätten teilen denselben Lagerbestand wie gekaufte Waren. Alle Handelswaren sind in den Routenplänen auswählbar; die bisherigen Nachfrageprofile kennzeichnen bevorzugte Güter mit Preisaufschlag, sind keine Verkaufssperre für andere Waren. Ein neuer Reisebeleg speichert die tatsächlich verkauften Waren, Gesamtmenge und mittlere Güte; der für Vertrauen relevante Anteil besonders gefragter Güter bleibt separat. Bereits gespeicherte Belege werden unverändert angezeigt. Erzeugnisse behalten ihre bisherige Lagerbewertung zum damaligen Verkaufswert, ohne eine vollständige Herstellungskostenrechnung vorzutäuschen.

**Einkaufsfahrten:** Eine Reisekasse wird aus vorhandener Kasse an Bord übertragen. Ausfuhrmenge 0 mit gewählter Rückfracht erlaubt reine Beschaffung; ansonsten ergänzt das Geld die Verkaufserlöse. Vorbereitete eigene Schiffe kaufen 26 % unter dem bisherigen Herkunftsprofil, Fernkontorvorteile gelten zusätzlich. Dies ist eine bewusste Spielbalance, keine neue unabhängig simulierte Preiswirtschaft. Einkaufspreis am Ziel, hiesiger Einkaufspreis und ein ausdrücklich unsicherer Wiederverkaufsüberschuss helfen vergleichen. Der endgültige Beleg bewertet Rückfracht zum tatsächlichen Einstand und zieht Ausfuhrwarenwert, eingesetzte Reisekasse, Prämie, Schiffsbetrieb und verbrauchten Proviant ab. Eine Geldumbuchung ist kein Gewinn. Erst späterer Warenverkauf realisiert eine mögliche Rückfrachtmarge; Reparaturen und allgemeine Lager-/Gebäudekosten bleiben separat.

**Risiken:** Piraten rauben Handelsladung und Reisekasse; bisherige Schutzfaktoren gelten weiter. Warenversicherung deckt weder Schiff noch Proviant noch Bargeld. Jeder gespeicherte Sturm verzögert eine Reise einmalig um zwei Tage. Ein Navigator multipliziert das Schadensrisiko mit 0,65, unbezahlter Unterhalt mit 1,5. Schaden beträgt 6–18 Rumpfpunkte; erst bei höchstens 20 verbleibenden Punkten folgt ein zusätzlicher Schiffbruchwurf mit 30 %. Bei Verlust verschwinden Schiff und enthaltenes Vermögen wirklich, offene Betriebsschulden bleiben bestehen. Hunger kostet zwölf Moral pro Tag, Rückstände fünf (ohne Rückstände erholt sich Moral um eins). Ab Moral 25 und drei Hungertagen oder Schulden in Höhe von drei Tagesrechnungen besteht täglich 30 % Meutereirisiko: Mannschaft bricht ab und kehrt binnen höchstens fünf Tagen um. Wetterverzögerung kann diese Rückkehr verlängern. Warnungen, Schicksal, Zufallszustand und Reisebelege werden gespeichert.

**Gemeinsame Kosten:** Kontor eine Mark, Hauptlager mindestens eine Mark beziehungsweise eine je angefangenen 300 Last Kapazität täglich. Gewöhnliche eigene Wohnhäuser je Stufe eine Mark; Werkstätten, Betriebe, Höfe und zusätzliche Speicher je eine; Taverne und Badehaus je zwei. Bestehende Produktions-/Meister-/Faktor-/Bootslöhne, Zinsen, Bürgerhausunterhalt und Fernkontorabrechnung bleiben erhalten. Kapitänslöhne werden für vorbereitete Flotten genau einmal berechnet. Fehlendes Geld erzeugt gespeicherte, vermögensmindernde Schulden und wird nicht durch negative Kosten gelöscht. Die Kostenansicht zeigt tägliche Flotten-, Lagerpersonal- und Gebäudebeträge; die Bilanz enthält tatsächliche Buchungen. `?` und Handbuch erklären Abfahrt, Kosten und Risiken.

**Migration und Abnahme:** Laufende alte Reisen enden unter bisherigen Bedingungen; danach muss die vorhandene Flotte vorbereitet werden. Es werden weder historische Kosten noch ausgedachte Mannschaften nachgetragen. Getestet: Bauzeit/Stornierung, Personal, Proviant-/Warenwertbilanz, Umschlaggrenzen, Kosten ohne doppelte Kapitänslöhne, Rückstände, reine Einkaufsfahrt, Piraterie, gespeicherter Sturm, Schiffbruch, Meuterei, Spezialfahrten, Speichern/Laden und DE/EN-Browserablauf auf breiten und schmalen Ansichten (`tools/seebetrieb-test.js`, `tools/seebetrieb-browser-test.cjs`). Dies erweitert Systeme und bestehende Geschichten; es zählt nicht als zusätzliche vollständig geschriebene Mission S01. Materiallieferverträge für die Werft, individuell auswählbare Matroseneigenschaften, mehrgliedrige Versorgungsrouten und eigenständig simulierte Auslandsmärkte bleiben weitere Ausbaustufen.

### 7.4 Ein gemeinsamer Wetterzustand

Ein gespeicherter Wetterdienst liefert für jeden Spieltag Lage, Stärke, Dauer und Vorhersage. Produktion, Ankünfte und Bevölkerung lesen dieselben Werte wie Licht, Wolken, Regen und Klang. Die Simulation erzeugt sie auch ohne Browser. Ereignisse wie Sturmflut sind Folgen definierter Lagen, keine zweite unverbundene Wetterwürfelung.

Abnahme: Laden ändert weder Wetter noch betroffene Ernte; Regentag und Regenklang stimmen überein; ein Tagessprung verarbeitet jede wirtschaftliche Wirkung einmal. Animationsgeschwindigkeit beeinflusst das Wetter nicht.

### 7.5 Eigene Schiffe mit vollständiger Fahrt

Eigene Schiffe erhalten dieselben geprüften Ein-/Auslaufwege wie Besucher, ergänzt um feste Ankerplätze und Ladeboote. Statusfolge: im Hafen, Abfahrt, unterwegs, Ankunft, im Hafen. Wirtschaftliche Reisezeit und visuelle Bewegung bleiben getrennt, aber der gespeicherte Reisebeleg verbindet beide. Eigener Wimpel und wenige Schadensstufen machen die Schiffe erkennbar.

Abnahme: keine Fahrt durch Mole, Land oder andere belegte Liegeplätze; Ladeaktionen während Abfahrt gesperrt; Rückkehr bucht genau einmal. Laden mitten in der Fahrt setzt Darstellung und Zustand widerspruchsfrei fort, ohne die Reise erneut zu starten.

### 7.6 Taten werden zu Stadtgeschichte

Ein begrenztes Register bewahrt prägende, belegte Taten mit Person, Datum und Ergebnis. Gespräche beziehen sich gelegentlich darauf; derselbe Kontakt wiederholt nicht bei jedem Klick denselben Kommentar. Wahlen erklären konkrete Unterstützung oder Vorbehalte aus diesen Erinnerungen zusätzlich zu Fraktionswerten.

Abnahme: keine erfundenen Taten in alten Ständen, datensparsame Verdichtung lange vergangener Ereignisse, Nachfolge trennt Taten des Gründers von denen des Erben. Journal und Schlusschronik verwenden denselben Beleg.

## Ergänzungen aus dem Kernkonzept

Die folgenden Lücken sind keine zusätzlichen lose stehenden Ideen, sondern vervollständigen bereits beschriebene Spielregeln:

| Kennung | Konkretisierung | Abhängigkeit / Abnahme |
| --- | --- | --- |
| K1 | Städtevertrag kann einen optionalen regelmäßigen Lieferplan enthalten. Einzelne Fälligkeiten erscheinen unter einem gemeinsamen Auftrag; Menge, Preis, Güte und Kündigung stehen vorher fest. | Gemeinsame Reservierungen und Termingeschäfte. Bereits gekaufte Handelsprivilegien werden nicht rückwirkend mit neuen Pflichten versehen. |
| K2 | Der Fernkontorfaktor erhält ein begrenztes Arbeitskapital, erlaubte Waren und einen überprüfbaren Geschäftsbericht. Einkommen wird aus wirklichem Handel abgeleitet, bevor der bisherige pauschale Ertrag ersetzt wird. | Fremdmarktmodell und Berichte. Keine gleichzeitige Pauschalrente zusätzlich zu denselben neuen Handelsgewinnen. |
| K3 | Wechsel werden zunächst klar als bestehende Anlagen beschrieben. Eine spätere Verwendung zur Bezahlung in fremden Städten verlangt Einlösung, Gebühren und eindeutige Zuordnung zum Vertrag. | Terminkauf und Fremdmarkt. Ein Wechsel kann nicht zugleich ausgezahlt und als Zahlungsmittel verbraucht werden. |
| K4 | Bürgerrecht, Fremdenordnung und Gewerbefreiheit werden als eigenständige Ratsvorlagen entworfen. Mitgliedschaften bleiben grundsätzlich kombinierbar; exklusive Vorteile entstehen durch bewusst angenommene befristete Pakte. | Szenarien, Fremdenkontor, Wegkapitel. Bestehende Lizenzen und gekaufte Betriebe werden nicht ohne Vorwarnung gelöscht. |
| K5 | Personal erhält gemeinsame Identitäten, Arbeitsvertrag und bis zu zwei kompatible Eigenschaften. Schreiber verbessern Übersicht/Vertragsorganisation, Boten die Zustellung bekannter Information; beide erzeugen keine exklusiven Grundbedienrechte. | Bewohnerprofile, Ausbildung, Berichte. Ein vorhandener Faktor wird migriert, nicht neu ausgewürfelt. |
| K6 | Schuhe werden nur mit vollständiger Kette Gerberei → Schuster und eigenem Verbrauch eingeführt. Feintuch bleibt die vorhandene höherwertige Tuchware; keine zweite bedeutungsgleiche Färbeware. | Chargen und Produktionsketten. Alle Ein- und Ausgänge, Löhne, Mengen und Qualität nachweisbar. |
| K7 | Ratsdarlehen, Zeugenaussage und Erbenkonflikt werden persönliche Kapitel. Sie benötigen nachprüfbare Belege, tatsächliche Familienpersonen und mehrere Ausgänge statt beliebiger Strafereignisse. | Gedächtnis, Prozessbuch, Familie. Keine Aussage gegen eine bereits ausgeschiedene Rivalenperson. |
| K8 | Regelmäßiger Gottesdienst mit dezentem Geläut gehört zum Stadtalltag. Besucher laufen von Wohnungen zur Kirche und zurück; Interdikt und Belegung beeinflussen den Ablauf. | Gemeinsamer Kalender, Bewohnerziele, Klangregler. Keine Menschenansammlung auf blockierten Türen und kein mehrfach ausgelöstes Geläut pro Termin. |

Weitere Ausprägungen des Kernkonzepts werden denselben Paketen zugeordnet:

| Kennung | Konkretisierung | Abhängigkeit / Abnahme |
| --- | --- | --- |
| K9 | Mannschaftskonflikte entstehen aus dokumentierten ausstehenden Löhnen, mangelhafter Versorgung oder einer riskanten Entscheidung. Vor einer Meuterei stehen Warnung und konkrete Abhilfe; Kapitänseigenschaften verändern die Vermittlung. | Personal und Seefahrt, Paket D/E. Kein zufälliger sofortiger Totalverlust; bezahlte Löhne und gesicherte Versorgung werden berücksichtigt, Versicherungen behandeln den benannten Schaden. |
| K10 | Bruderschaft und politische Pakte verknüpfen ihre abstrakten Unterstützerzahlen schrittweise mit tatsächlich bekannten Bewohnern. Als Mitglied zugeordnete Personen behalten ihren Wohnort und Tagesablauf. | Bewohner, Gesuche und Gottesdienst, Paket E. Neue Zuordnung erzeugt keine zusätzlichen Beiträge für bereits gezählte Mitglieder. |
| K11 | Schlusschronik ergänzt tatsächliche Stadtentwicklung, nachgewiesene Rivalennachfolgen und prägende Taten. Freischaltungen werden aus aktuellen Aktionsvoraussetzungen erklärt; Rang und Ehrentitel bleiben unterscheidbar. | Stadtwachstum und Erinnerung, Paket F/G. Keine Angabe über verstorbene Rivalen ohne gespeicherten Tod, keine als garantiert dargestellte alte Balancingkurve. |
| K12 | Alle Lieferauftragsarten erhalten dieselbe verständliche Ergebnisdarstellung wie die Salzgeschichte: Auszahlung, bereits bezahlte Warenkosten, heutige Fehlmenge und gesonderte Risiken. Sonderkosten gehören genau zum verursachenden Auftrag. | Kalkulation und Reservierungen, Paket A/B. Anzeige und spätere Abrechnung stimmen bei unveränderten Preisen und Mengen überein; eine Schätzung behauptet keine garantierte Marge. |
| K13 | Kennzahlen, Fraktionen und Gilde zu einem verständlichen Beziehungs- und Zugangssystem verbinden. Bestehende Werte erhalten klar erklärte Ursachen, Schwellen und Gegenfolgen; Gildenaufnahme, Rang und Lizenzen brauchen passende Voraussetzungen und Pflichten statt allein Geld und Klick. | Fraktionsreaktionen, Beziehungen, Rat, Personal und Erinnerungen gemeinsam nutzen. Konkrete Werte erst nach spielbaren Prototypen balancieren. Keine gelöschten Altbesitze/Lizenzen und keine einzelne Fraktion oder Gilde darf einen Spielweg dauerhaft sperren. |
| K14 | Hauptnavigation, bereichsbezogene Unterpunkte und „Meine Bücher“ zu einem klaren Navigationssystem verbinden. „Kontor“ wird als Hauptbereich zu „Handelshaus“; Kontor, Lagerhaus, Personal und Verträge werden Unterseiten. Seefahrt erhält Hafen, Flotte & Versorgung, Außenhandel & Routen und Werft. | Vorhandene Ansichten und Ortslinks wiederverwenden; kein neues Aufgabenbuch und keine doppelte Waren-/Vertragsquelle. Hauptbereich, Unterseite und zuletzt gewählter sinnvoller Ort bleiben sichtbar und speicherbar, wenn die Navigationsarchitektur dies erfordert. DE/EN, Tastatur, Screenreader, Abzeichen, Kartenlinks und schmale Ansichten prüfen. |

### K13: Kennzahlen, Fraktionen und Gildenlaufbahn

**Ausgangslage im Code:** Vermögen und Rang, Ruf, Frömmigkeit, Verdacht, Einfluss, Wohlstand und Einwohnerzahl existieren bereits. Vier Fraktionswerte beeinflussen ausgewählte Handlungen, Wahlen und Konditionen; manche Geschichten erzeugen bereits differenzierte Gewinne und Verluste. Das genügt noch nicht für eine durchgängig lesbare Dynamik: Fraktionsbeziehungen und ihre Rückkopplungen sind nicht überall sichtbar, mehrere Aktionen belohnen mehrere Gruppen zugleich, und die Werte erklären nicht von selbst, welche konkrete nächste Möglichkeit sie eröffnen. Die Gilde prüft beim Eintritt derzeit vor allem die Gebühr; nach dem Eintritt brauchen Lizenzen im Wesentlichen Mitgliedschaft und Geld. Es gibt keine abgestufte Mitgliedschaft mit allgemeinen Beiträgen, Empfehlungen, Eignung und Rechten.

**Entwurfsregeln:**

1. Werte bekommen in ihrer Übersicht eine kurze Wirkungsbeschreibung, Änderungsgründe, relevante Schwellen und bei zeitlich begrenzten Wirkungen ein Ablaufdatum. Keine neue Zahl ohne eine Spielerentscheidung oder Weltreaktion, die sie nutzt.
2. Aktionen benennen betroffene Fraktionen einzeln. Unterschiedliche Interessen erzeugen glaubwürdige Konflikte; positive Wirkungen für mehrere Gruppen sind möglich, aber kein Standardbonus für alle vier. Personen und Belege erklären, warum eine Gruppe unterstützt, blockiert oder ihre Haltung ändert.
3. Gesellschaftliche Werte sind nicht beliebig farmbar. Wiederholung, Zeit, Zeugen, Kosten und Sättigung begrenzen Dienste, Spenden, Geschenke und Einflussgewinn. Der Spieler sieht vor dem Handeln, ob derselbe Dienst noch zählt.
4. Zugang wird als Kette lesbarer Voraussetzungen gestaltet. Für eine Gildenlizenz können beispielsweise Fraktionsansehen, ein passender Betrieb, eine Empfehlung, ein erfüllter Gildenauftrag und die Gebühr erforderlich sein. Nicht jede Lizenz braucht alle Bedingungen; die Voraussetzungen müssen zur Ware und zum Fortschritt passen.
5. Die Gildenlaufbahn enthält Aufnahme, nachvollziehbare Mitgliedspflichten, erarbeitete Rechte und erkennbare Folgen von Zahlungsrückstand oder Vertragsbruch. Beitragsrückstand, Suspendierung und Austritt haben Vorwarnung, Frist und Abhilfe. Erworbenes Eigentum und bestehende Lizenzen werden nicht rückwirkend gelöscht.
6. Bestechung, Gefälligkeit, Empfehlung und offene politische Fürsprache können alternative Zugänge schaffen. Sie unterscheiden sich durch Kosten, Bindung, Sichtbarkeit und spätere Erpressbarkeit; keine Zahlung garantiert ohne Risiko gesellschaftliche Zustimmung.
7. Fraktionsbeziehungen konkurrieren, aber blockieren keine komplette Karriere durch einen einzigen irreversiblen Schwellenverlust. Wo ein Weg dauerhaft beendet wird, muss es eine bewusste, vorher erklärte Entscheidung sein; es gibt andere erreichbare Ziele und gegebenenfalls einen teuren Weg zur Versöhnung.

**Umsetzungsfolge (präzisiert am 12. Oktober 2026):** Zuerst einen bestehenden Konflikt zu einem vollständigen spielbaren Spannungsbogen vertiefen: Im Brotstreit führen frühere Entscheidungen und Fraktionsbeziehungen zu unterschiedlichen Angeboten für ein Versorgungsabkommen auf Probe. Eine freiwillige Zusage begründet eine echte, befristete Waren-, Geld- oder Einflussverpflichtung. Erfüllung, verhandelter Aufschub, offener Rücktritt und Wortbruch lösen unterscheidbare, später wieder aufgegriffene Reaktionen aus. Die Oberfläche erklärt diese Regeln und Folgen; reine Werteanzeigen erfüllen K13 nicht. Anschließend die geprüften Zusammenhänge auf weitere Konflikte sowie eine Gildenaufnahme und eine Lizenz übertragen. Weitere Rechte, Gildenränge, Beiträge und Gegenreaktionen folgen erst nach spielbaren Tests. Eine neue Fraktions- oder Gildenökonomie soll die Markt- und Produktionssimulation nicht duplizieren.

**Erster spielbarer Ausbau – Brotstreit:** Nach einer neu abgeschlossenen Anhörung wird ein einmaliges Versorgungsabkommen auf Probe vorbereitet. Vierzehn Tage später treffen drei Angebote ein; die bei der Anhörung gespeicherten Beziehungen und das frühere Vorgehen bestimmen ihre Konditionen. Kirchenhilfe verlangt zehn Last Korn, bei Kirchenansehen ab 60 acht, unter 35 zwölf. Der Kaufleute-Ausgleich überweist 300 Mark an Kruse, zuzüglich 150 nach Beschlagnahme/Fälschung und abzüglich 75 bei Kaufleuteansehen ab 60. Ratsaufsicht kostet bei Annahme vier Einfluss, nach früherer Manipulation sechs; die spätere Marktlieferung umfasst sechs Last Korn, bei Zunftansehen ab 60 vier. Korn benötigt Güte 85. Kirchenhilfe wird an Haushalte verbraucht, Ratskorn kommt mit tatsächlicher Güte auf den Markt. Jeder erfüllte Weg stärkt bestimmte Gruppen und belastet eine andere.

Die Antwort ist sieben Tage möglich, die Leistung bis 21 Tage nach Angebot. Annahme setzt eine verbindliche Zusage; einmalig sind sieben zusätzliche Tage gegen zwei Einfluss möglich. Kostenlose Ablehnung begründet keine Pflicht. Offener Rücktritt und Fristbruch erzeugen unterschiedliche spätere Ruf- und Fraktionsverluste. Drei Tage nach dem Ausgang folgt die Ratsreaktion: Erfüllung bringt einen zusätzlichen Unterstützungspunkt für 90 Tage, Wortbruch kostet einen; Rücktritt bringt keinen. Dieser Beleg gilt der Zusagegeneration und verlängert die bestehende Unterstützung aus der Anhörung nicht. Alte abgeschlossene Brotgeschichten erhalten keine nachträglichen Pflichten. Es handelt sich um einen begrenzten K13-Prototyp; allgemeine Gildenlaufbahn und umfassende Kampagnenbalance bleiben offen.

**Zweiter spielbarer Bogen – „Die Bürgschaft der Gilde“:** Auf die aufgelöste Brotfolge folgt eine freiwillige Verantwortung innerhalb der Gilde. Kaufmännischer Fürsprecher und Zunftfürsprecher knüpfen an erfüllte Zusagen oder Fraktionsvertrauen an; ein längerer unabhängiger Weg bleibt erreichbar. Alte abgeschlossene Brotstände ohne Folgeabkommen erhalten beim nächsten regulären Spieltag lediglich ein freiwilliges neues Angebot. Annahme verpflichtet zur eigenen Warenleistung, überträgt aber noch keine Ware und zahlt kein Geld aus. Nach einer Vorbereitungszeit fordert der Rat einen Teil derselben Ladung für den Gemeinbedarf. Ein gespeicherter tatsächlicher Stadtbestand unterscheidet Engpass und Vorsorge. Die vorab angekündigte Bewährungsprobe unterscheidet vollständige Vertragstreue, ausgehandelte Teilung gegen Einfluss, offenen Rücktritt und Fristbruch. Nur der vereinbarte Ratsanteil gelangt mit tatsächlicher Güte auf den Markt; der Patronanteil wird als abgeführte Vertragsladung dokumentiert.

Ein erfolgreicher Abschluss erarbeitet genau einen Anspruch: 20 Prozent Nachlass auf die nächste Werkstattlizenz bei vollständiger Vertragstreue, zehn Prozent beim Kompromiss. Alternativ kann derselbe Anspruch einmalig gegen drei Einfluss eingelöst werden. Anzeige, Aktionsvorschau und Abbuchung verwenden denselben Lizenzpreis. Fehlgeschlagene Käufe verbrauchen den Vorteil nicht; Mitgliedschaft bleibt erforderlich. Bestehende Mitgliedschaften, Lizenzen und Betriebe bleiben erhalten. Dies ist eine zusätzliche Verantwortung innerhalb der Gilde, noch kein vollständiges System allgemeiner Gildenränge oder Beiträge.

**Verflechtung mit eigenständigen Nebenquests:** „Hilfe für das Spital“ und „Brachts dringende Bestellung“ begleiten eine angenommene Gildenbürgschaft und benötigen dieselbe Ware. Je nach Gildenweg erhält das Spital Tuch für Verbands-/Bettzeug, Mehl für die Küche oder Werkzeug für Reparaturen; Brachts Auftrag verfolgt ein eigenes bezahltes Geschäft. Beide Aufgaben besitzen eigene Annahme, Frist, Aufschub, Rücktritt, Abschluss und Nachrichten. Sie laufen nach Annahme unabhängig vom Ausgang der Bürgschaft weiter. Ein gemeinsamer reiner Mengenvergleich zeigt Gildenpflicht, angenommene Nebenquests und normale Lieferverträge, tatsächlichen Lagerbestand sowie Fehlmengen vor Annahme und nach Lieferung. Er reserviert keine Ware und zählt denselben Vorrat nicht mehrfach als gedeckt. Brachts Vergütung stammt aus einer tatsächlichen Hinterlegung seines Vermögens und wird bei Nichterfüllung einmalig zurückgegeben. Dieser Ausbau prüft konkurrierende Zusagen, ohne eine einzige verpflichtende Hauptgeschichte oder eine automatisch unlösbare Aufgabenlage einzuführen.

**Abnahme:** Eine neue Partie erklärt die Startwerte und zeigt mindestens drei verschiedene Ursachen-/Folgenketten im Verlauf. Mindestens eine legale, eine beziehungsbasierte und eine riskante alternative Annäherung an Gildenrechte ist nachvollziehbar; keine ist ein garantierter Geldknopf. Lizenzvoraussetzungen und Status sind auf der Gildenseite sichtbar. Eine Entscheidung kann Fraktionen unterschiedlich bewegen; Übersicht, Nachrichten und Journal nennen Ursache und betroffene Gruppen. Zeitbegrenzte Vorteile laufen korrekt aus. Bestehende Speicherstände behalten Mitgliedschaft, Lizenzen, Gebäude und Werte ohne erfundene Vorgeschichte. DE/EN, Speichern/Laden, schmale Ansicht, wiederholte Aktionen und Langzeitbalance werden geprüft.

### K14: Stadtbereiche und Bücher in einer Navigation

**Umgesetzt am 12. Oktober 2026:** Sechs Hauptbereiche einschließlich Bücher öffnen jeweils ihre eigenen Unterseiten mit kleineren Symbolen im Stil der Hauptnavigation. Rat ist in Rathaus, Rechte & Ämter, Gesetze, Monopolpacht, städtische Vorhaben und Zollpacht aufgeteilt. Handelshaus bietet Kontor, Lagerhaus, Personal und Verträge; Seefahrt bietet Hafen, Flotte & Versorgung, Außenhandel & Routen und Werft. Handel trennt Markttransaktionen, Karawanen am Stadttor, Preise & Verlauf und Marktstände. Preisansicht und Markt teilen sich die Warenauswahl; der Einführungsschritt zum eigenen Geschäft führt zu den Marktständen. Der Handelsnavigationstest prüft echte Markt- und Karawanengeschäfte, unveränderte Wirtschaftsdaten beim Rendern, Tor-Kontext, Warenauswahl samt Speicherung, den zweitägigen Standbau und DE/EN bei 320/390 Pixeln. Der vollständige Einführungstest besteht auch mit dem neuen Stand-Einstieg. Personal verwendet die vorhandenen Faktor- und Lagerarbeiteraktionen. Verträge liest bestehende Aufträge, Vorauszahlungen, Städteabkommen und Routen. Präsentationsmetadaten speichern Buch, Ortsseite und Auswahlkontext getrennt von den Wirtschaftsdaten; alte Spielstände benötigen keine erfundene Vorgeschichte. Die bisherigen Einführungsfortschritte beim Besuch von Hafen und Übersicht bleiben erhalten.

**Geprüft:** Navigation einschließlich Ortsrücksprung, Speichern/Laden, Tastatur, getrennter Ratsseiten und exklusiver Bücher-Unternavigation; DE/EN und schmale Ansichten bis 320 Pixel. Der Navigationstest prüft auf „Rechte & Ämter“ den Kauf der reinen Weste, den Kaperbrief und eine Amtsvergabe samt Voraussetzungen sowie Speicherung und Rückkehr aus den Büchern. Die Ehrbarkeitsaktion erklärt auch die Sperre durch Spelunke oder Netzwerk und verlangt ausdrücklich Ruf 50. Ein gezielter Browserablauf prüft die tatsächliche Zollpachtzahlung und einen Stadtbauauftrag mit Bauzeit. Handbuch und Einführung werden über ihre Browserprüfungen abgesichert; Desktop- und Mobilansicht wurden zusätzlich visuell geprüft. Der ältere Kontor-/Lagerhaus-Browsertest erreicht weiterhin seinen bereits vor K14 vorhandenen Fehler: Er erwartet direkt nach dem Ausbauauftrag 700 statt 400 Last Kapazität, obwohl der Ausbau erst nach der Bauzeit fertig wird. Die Wirtschaftsregel wurde hierfür nicht geändert.

Die bisherige linke Bedienung trennte die fünf Bildkacheln für Stadtbereiche von den unteren Reitern **„Meine Bücher“**. Das umgesetzte Ziel ist eine gemeinsame, hierarchische Navigation: Die erste Ebene wechselt den Bereich; die zweite Ebene führt zu passenden Ansichten. Ein Wechsel der Unterseite ist reine Navigation und löst keine Spielaktion aus.

**Bereiche und Unterseiten:**

| Hauptbereich | Unterseiten |
| --- | --- |
| Handel | Markt, Karawanen, Preise & Verlauf, Marktstände |
| Handelshaus *(bisher Kontor)* | Kontor, Lagerhaus, Personal, Verträge |
| Seefahrt | Hafen, Flotte & Versorgung, Außenhandel & Routen, Werft |
| Rat | Rathaus, Rechte & Ämter, Gesetze, Monopolpacht, Städtische Vorhaben, Zollpacht |
| Umland & Produktion | Umland, Höfe/Produktion und Bestellungen, soweit vorhandene Ansichten getrennt sind |
| Bücher | Übersicht, Planung, Aufträge, Journal, Nachrichten |

Die Ratsunterseiten teilen die bestehenden umfangreichen Inhalte in eigenständige Ansichten. **Rechte & Ämter** bündelt Ehrbarkeit, Kaperbrief und Stadtämter; das Rathaus enthält Rat, Wahlen und politische Verpflichtungen. Die tatsächlichen Kaperfahrten bleiben bei den eigenen Schiffen unter Seefahrt. Zollpacht bleibt beim Rat als vergebender Stelle. Umland erhält keine leeren Unterseiten. Kirche, Gilde, Gewerke und einzelne Gebäude bleiben erreichbare Ortsansichten; wo Inhalte umfangreicher werden, können sie später passende Unterpunkte erhalten. „Personal“ im Handelshaus meint Faktor und Lagerarbeiter. Kapitäne und Schiffsbesatzungen bleiben im Unterpunkt **Flotte & Versorgung**, damit Kosten, Zustand und Einsatzort zusammenbleiben. Verträge fassen bindende Handelstermine und relevante Vereinbarungen zusammen, ersetzen aber weder Aufträge noch Nachrichten.

**Bücher** wird der sechste Hauptbereich. Die fünf bisherigen Buchansichten **Übersicht**, **Planung**, **Aufträge**, **Journal** und **Nachrichten** bilden ausschließlich dessen Unternavigation. Es gibt keine zusätzliche dauerhaft sichtbare Büchergruppe. Alle Unterseiten tragen kleinere Symbole im Stil der Hauptnavigation. Planung zeigt von einem Ort aus aktuelle Mengen, Termine und Alternativen; Aufträge bleiben der Fortschrittseintrag; Journal hält Ergebnisse fest; Nachrichten bleiben datierte Mitteilungen mit Antworten. Kartenklicks, Hilfe-Links, Missionsaktionen, Benachrichtigungsabzeichen und direkte Sprungziele führen jeweils in dieselbe Ansicht. Offene Aufträge und ungelesene Briefe behalten ihre Zähler.

**Abnahme:** Kein bisher erreichbarer Inhalt geht verloren; alle Orts-, Missions- und Hilfelinks öffnen die passende Unterseite. Hauptbereich und aktuelle Unterseite sind eindeutig markiert; Navigation und Speichern/Laden verursachen keine doppelten Buchungen, Statuswechsel aktualisieren Abzeichen. Alle Seiten sind mit Maus, Tastatur und Screenreader bedienbar, bleiben auf Deutsch und Englisch verständlich und passen in schmale Ansichten. Navigation funktioniert weiter, wenn ein Gebäude nicht gebaut oder ein Menüpunkt mangels Voraussetzung gesperrt ist; gesperrte Optionen erklären den Grund. Ein Klick auf Hauptbereich oder Unterseite verändert keine Spielzeit und keinen Spielzustand.

### Ergänzung zu K5: Familienausbildung

Die Ausbildung aus 4.4 wird nach demselben Muster um nautische Navigation und städtische Verwaltung erweitert. Ein Familienmitglied kann dadurch eine Kapitänsrolle übernehmen oder sich für ein Amt qualifizieren; Ausbildung allein verleiht keinen Ratssitz. Freie Stellen, Wahlbedingungen, Alter und laufende Verträge werden weiterhin geprüft.

## Reihenfolge und Fertigstellung

| Paket | Inhalt | Warum in dieser Reihenfolge |
| --- | --- | --- |
| A – Orientierung | 2.2, 2.5, K14, gemeinsame Begriffe und eindeutige Hilfen | Navigation und bestehende Entscheidungen verständlich machen, ohne neue Pflichtinformationen. |
| B – Beziehungen und Vorhaben | 1.3–1.5, 2.1, 2.3–2.4, 4.1, 7.6; erste Kapitel aus 1.2 | Vorhandene Wirtschaft bekommt erkennbare Menschen, Gründe und Folgen. |
| C – Waren und Umwelt | 7.1, 7.4, gemeinsame Reservierungen, dann 3.8, 5.1 und 5.3–5.5 | Verhindert doppelte Bestände und widersprüchliche Effekte späterer Ereignisse. |
| D – Seefahrt und Bindungen | 3.1–3.2, 3.5, 7.2–7.3, 7.5, K1–K3 | Echte Informationen und Transporte tragen den langfristigen Handel. |
| E – Persönliche Stadt | 3.3, 3.6–3.7, 4.2–4.6, 5.6, 5.8, K5, K7–K8, K13 | Beziehungen, Fraktionen und Gildenrechte an Personen, Entscheidungen und Erinnerungen anbinden. |
| F – Große Veränderungen | 3.4, 5.2, 5.7, 6.1–6.5, K4, K6 | Erst danach neue Geometrie, neue Grundstoffe und stadtweite Konflikte. |
| G – Varianten und Abschluss | 1.1 und restliche Kapitel aus 1.2, erneuter Langzeitabgleich | Startszenarien prüfen alle inzwischen konsistenten Wege; Inhalte werden nach Tests als umgesetzt markiert. |

Ein Paket ist erst fertig, wenn die enthaltenen Aktionen über die Oberfläche erreichbar sind, verständliche Gründe für Sperren haben, korrekte Geld-/Warenfolgen erzeugen, gespeichert werden und mit den bestehenden Systemen zusammenarbeiten. Abnahme umfasst gezielte Logiktests, mindestens einen vollständigen Spielablauf über die Oberfläche, DE/EN und schmale Ansicht. Wirtschaftlich relevante Pakete erhalten anschließend einen passenden Langzeitvergleich. Neue Karten- oder Animationsfunktionen werden zusätzlich auf Wege, Tiefensortierung, Anklickbarkeit und wiederkehrende Bildruckler geprüft.

Die Kennzeichnungen in Ideenkatalog und Umsetzungsabgleich werden nach tatsächlicher Abnahme geändert. Ein ausgearbeiteter Entwurf oder ein sichtbarer Knopf allein erledigt keinen Punkt.
