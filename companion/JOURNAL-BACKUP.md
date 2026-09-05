# Tagebuch sichern – Vertrag und Übergang

## Zweck und Struktur

UX-Ergänzung nach Gerätefeedback: Eine erfolgreich gespeicherte Sicherung zeigt einen Systemdialog „Sicherung erstellt“ mit „OK“, unabhängig von der Scrollposition. Abbruch zeigt keinen Erfolg. Tagebuch bleibt nach Reisen/Tagen gruppiert; Einträge stehen vor dem optionalen Routenlink. Eintragsdetail zeigt privaten Text und Fotos zuerst, den Etappenkontext danach ohne eingebettete Karte. Hauptaktion ist Bearbeiten, Zurück führt zur Liste. Native Listen, Systemschrift/Dynamic Type, bestehende Farben und Abstände bleiben auf iPhone/iPad erhalten; semantische Beschriftungen und Systemdialog sorgen für zugängliches Feedback. Keine Änderung an Datenmodell oder Speicherung.

Roadbook bleibt eine persönliche Reisebegleitung für zwei Reisende. Sicherung und kontrolliertes Einlesen schützen ihre eigenen Texte/Fotos beim Wechsel zu TestFlight, ohne Reiseplanung oder automatische Freigaben einzuführen.

IA bleibt: Reisen / Mein Tagebuch. Einstellungen → Tagebuch sichern → optional Sicherung einlesen. Kein neuer Hauptbereich.

Layout: stabiler Navigationstitel und Zurückweg; Hauptinhalt erklärt Umfang und Dateischutz, primär „Sicherung speichern“; sekundär „Sicherung einlesen“. Nach Dateiauswahl zeigt eine Vorschau Anzahl und Datum, erst die ausdrückliche Bestätigung schreibt Daten.

Copy: „auf diesem Gerät verfügbar“ statt „vollständig mit iCloud synchronisiert“. Datei enthält private Inhalte unverschlüsselt; nur an einem eigenen, geschützten Ort speichern. Keine automatische Cloud-Verteilung der Sicherungsdatei. Beim Import ausdrücklich: eigene Sicherung, aktueller iCloud-Account, anschliessender privater Abgleich.

Design: bestehende native SwiftUI-Listen und Systemschrift/Dynamic Type; RoadbookStyle-Akzent und vorhandene Abstands-/Radiuswerte (16/12). Flider-Prinzipien: eine Hauptaktion, sekundäre Wartung nachgelagert, keine visuelle Neugestaltung. Systemfarben für Dark Mode, 44-Punkt-Aktionsflächen, beschriftete Symbole. iPhone und iPad nutzen denselben Ablauf mit System-Dateiauswahl; kein Desktopbereich.

Interaktion: System-Navigation und Dateidialog, Fortschritt/Fehler als Text, keine eigene Animation. Export-Abbruch ist kein Erfolg. Import validiert vor dem Schreiben und speichert in einem separaten Context ohne Autosave; Fehler rollen dessen Änderungen zurück, nicht fremde Editoren.

## Sicherheitsregeln

- Nur explizit ausgewählte Dateien einlesen; keine Hintergrundmigration und kein Löschen alter Stores.
- Alle IDs, ursprünglichen Etappentitel/-daten und Zeitstempel erhalten.
- Identische IDs/Inhalte erneut einlesen ist ohne Duplikate möglich. Konflikte brechen vollständig ab, statt vorhandene Erinnerungen zu überschreiben.
- Fehlende Fotodaten, doppelte IDs, verwaiste Fotos, unbekannte Formate/Versionen und übergrosse Dateien ablehnen. Keine Foto- oder Textinhalte protokollieren.
- Sicherung enthält nur lokal verfügbare Daten; kein CloudKit-Abgleich-/Vollständigkeitsversprechen. Vor Gerätewechsel beide Geräte vergleichen und Sicherung separat aufbewahren.
- Release verwendet einen neuen lokalen Speicherpfad für Production. Debug bleibt am bisherigen Development-Pfad, damit ein Sicherungsupdate die bisherigen Einträge weiter öffnen kann. Release nicht mit Development-Signierung auf bestehende Geräte installieren.
- Zwei-Account- und Production-Synchronisationstest bleiben separate Freigabeschritte.
- CloudKit-Abgleich ist asynchron: nur auf einem Gerät importieren und auf dem anderen auf den Abgleich warten. Lokale Idempotenz ist kein geräteübergreifender Unique-Constraint; gleichzeitiges Einlesen auf zwei noch nicht synchronisierten Geräten wird nicht als duplikatsicher zugesagt.

## Prüfstand 4. September 2026

- Datenprüfung mit synthetischen Texten und JPEG-Fotos bestanden: verlustfreier Roundtrip, IDs/Datumsangaben erhalten, wiederholter Import ohne Duplikate, keine Teiländerung bei Konflikten und Ablehnung ungültiger Sicherungen.
- System-Dateiexport auf iPhone- und iPad-Simulator bestanden. Vollständiger iPhone-UI-Ablauf inklusive eigener Bestätigung und erneutem Import bestanden (`roadbook-backup-ui-iphone-roundtrip-r5.log`). Die Testkorrekturen betreffen die Dateinamen- und Schalterbedienung des Simulators, nicht das ausgelieferte App-Verhalten.
- Tatsächliche Sicherung auf den bisherigen Geräten sowie Production-Synchronisation noch offen. Bestehende persönliche Inhalte wurden für diese Tests nicht gelesen oder verändert.
