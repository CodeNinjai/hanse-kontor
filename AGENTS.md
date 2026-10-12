# Zusammenarbeit mit Codex

- Der Hauptagent arbeitet mit `gpt-6-astra` bei mittlerem Reasoning und koordiniert Aufgaben, Architekturentscheidungen und die Integration.
- Bei klar abgegrenzten Codeänderungen delegiert der Hauptagent die Implementierung an den benutzerdefinierten Agenten `luna` (`gpt-6-luna`, mittleres Reasoning). Luna bearbeitet die Dateien im gemeinsamen Arbeitsverzeichnis.
- Der Hauptagent prüft Lunas Änderungen im Zusammenhang mit dem restlichen Projekt und übernimmt die abschließende Kommunikation. Unabhängige Teilaufgaben dürfen gleichzeitig delegiert werden, aber diese Projektkonfiguration begrenzt sie auf einen ausführenden Agenten.
- Für reine Erklärungen, kleine Dokumentationsfragen oder Aufgaben ohne Codeänderung ist keine Delegation nötig.
- Bestehende nicht zugehörige Änderungen im Arbeitsverzeichnis bleiben erhalten. Vorhandene Projektkonventionen und Anweisungen in Unterverzeichnissen gelten weiter.
- Das Arbeitsverzeichnis enthält umfangreiche laufende Änderungen und neue, noch nicht versionierte Dateien. Vor Änderungen zuerst `git status` ansehen; keine pauschalen Bereinigungen, Zurücksetzungen oder Änderungen außerhalb des aktuellen Auftrags vornehmen.
