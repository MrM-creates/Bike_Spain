# Kartenbetonte Tagesansicht · Build 6

## Direkt zum nächsten/vorherigen Tag

Build 6 ergänzt oben rechts zwei Tagespfeile mit mindestens 44 Punkten Trefferfläche und VoiceOver-Beschriftung inklusive Zieltag. Reihenfolge nach Tagesnummer, Auswahl über stabile Etappen-ID. Erster/letzter Tag deaktiviert den jeweiligen Pfeil. Die Ansicht wird ersetzt, nicht auf den Navigationsstapel gelegt; der normale Zurück-Pfeil führt weiterhin zur ursprünglichen Einstiegsansicht. Jeder Tageswechsel setzt Scrollposition, Kartenausschnitt und Aufklappbereiche zurück und bindet den Editor an den neu ausgewählten Tag. Keine Wischgeste überlagert die Karte.

Swift-Planchecks für beide Reisen bestanden, inklusive Grenzen, unbekannter ID und unsortierter Eingabe. Signierter Build erfolgreich (`/tmp/roadbook-day-paging-build.log`), Build 6 auf beiden echten Geräten ohne Deinstallation installiert. UI-Nachtests prüfen alle 30 Tage, Rückwärtswechsel, Grenzen, Scroll-Reset, Editor-Tageskontext und Rückkehr zur Reise. Der erste iPhone-Lauf scheiterte allein an der abschliessenden Abfrage der ausserhalb des sichtbaren Bereichs liegenden Reisekarte; die Prüfung verwendet jetzt die sichtbare Tagesliste.

Screenshot der Tagespfeile auf iPhone visuell geprüft (`/tmp/roadbook-day-paging-screens/4C9BFF8C-F073-4306-9D70-02C40A14C216.png`). Beide echten Geräte waren beim Fernstart gesperrt; Installation erfolgreich, App nach Entsperren selbst öffnen. Die dokumentierte Geometrie-Ungenauigkeit (`MAPS.md`) bleibt in Build 6 unverändert.

iPad-Nachtest erfolgreich: `/tmp/roadbook-day-paging-ipad-retest.log`, ein Test ohne Fehler, inklusive sämtlicher Tageswechsel und Rückkehr zur Reise.

iPhone-Nachtest ebenfalls erfolgreich: `/tmp/roadbook-day-paging-iphone-retest.log`, ein Test ohne Fehler. Die Navigationsregeln aus App UI Foundation und Flider wurden in der bestehenden Oberfläche umgesetzt, ohne neue Hauptnavigation oder konfliktträchtige Wischgesten.

## Bedienung

Die Tagesansicht zeigt zuerst Tag/Datum, Titel und Fahrdaten bzw. Ruhetag, dann die grosse Tageskarte. Vorschauhöhen passen sich an Fensterhöhe und iPhone-/iPad-Breite an. Karte vergrössern öffnet weiterhin die interaktive Kartenansicht; Vorschauen behindern das Scrollen nicht. Darunter steht der unveränderte Google-Maps-Link, falls vorhanden.

`Wegpunkte & Strassen` und `Unterkunft` sind zunächst eingeklappt. Der Routenbereich zeigt Start, alle Zwischenziele und das Etappenziel in der geprüften Reihenfolge sowie die vorgesehenen Strassen; interne Korrekturhistorie gehört nicht in diesen Bereich. Unterkunftsstatus und erste Wahl bleiben sichtbar. Das persönliche Tagebuch zeigt Tagesnummer, Eintragsanzahl und jederzeit die Aktion `Eintrag für Tag N`; nur die bestehenden Einträge sind einklappbar. Die globale Tagebuchübersicht bleibt unverändert nach Reise/Etappe gruppiert.

## Wichtige Hinweise

Der Plan enthält Fliesstexthinweise, aber keine maschinenlesbare Warnstufe. `Resources/reviewed-day-notes.json` hält deshalb die ausdrücklich geprüfte Darstellung der 60 vorhandenen Texte fest. Wichtige Passagen erscheinen unverändert ausserhalb des eingeklappten Streckenbereichs. Im aufklappbaren Routenbereich stehen ausschliesslich die praktisch nutzbaren Navigationspunkte und Strassenangaben.

Die Zuordnung verlangt Reise-ID, Etappen-ID und exakt denselben vollständigen Hinweistext. Fehlt die Zuordnung, ist die Ressource defekt oder ändert sich der Hinweis, zeigt die App vorsichtshalber den gesamten Text ausserhalb des eingeklappten Bereichs. Keine Schlüsselwort-Heuristik, keine automatische neue Reiseberatung und keine angebliche Live-Warnung. Bei neuen App-Startständen neue Texte bewusst prüfen; die bestehende Review-Datei nicht blind neu erzeugen.

Die Darstellung ist kein neuer Faktencheck von Fahrplänen, Einreise- oder Verkehrshinweisen. Reiseinhalte, Geometrie, Feed, SwiftData-Modelle und CloudKit-Konfiguration bleiben unverändert.

## Prüfung

`Checks/DayNotesChecks.swift`: 60 eindeutige Zuordnungen, Originalwortlaut, geänderte/fehlende Texte vollständig sichtbar, Fähr-Check-in/Buchungsstatus sowie Wetter-/Sperrhinweise geprüft. Erfolgreicher signierter Gerätebuild: `/tmp/roadbook-map-first-build.log`.

Erste UI-Prüfung: Ruhetag und Fährhinweise auf beiden Formaten sowie kompletter Tagebuchablauf auf iPhone bestanden. Der neue Aufklapptest scheiterte beim erneuten Einklappen an mehrfach von SwiftUI geerbten Testkennungen; die Abfrage wurde auf das erste passende Disclosure-Bedienelement präzisiert. iPad-Bilder der Tageskarte, Eintragsliste und Ruhekarte visuell geprüft unter `/tmp/roadbook-map-first-ipad-screens`. Danach Tageskopf zu einer kompakten Zeile mit mehrzeiligem Inhalt zusammengefasst und Bedienelemente im Dunkelmodus heller eingefärbt; finaler Gerätebuild `/tmp/roadbook-map-first-final-build.log`.

Nachtest erfolgreich: iPad-Aufklapp-/Schreibablauf (`/tmp/roadbook-map-first-ipad-retest.log`), finale iPhone-Tagesansicht und Kontoausfall (`/tmp/roadbook-map-first-final-tests.log`). Bereits im ersten iPhone-Lauf bestanden: Eintrags-Persistenz/Bearbeiten/Löschen, Ruhetag/Fähre, beide Reisen in der dunklen Vollbildkarte. Build 5 auf beiden echten Geräten installiert und geöffnet, keine persönlichen Einträge/Fotos für die Prüfung ausgelesen oder verändert.

Zusätzlicher finaler iPad-Querformat-Test bestanden (`/tmp/roadbook-map-first-ipad-landscape.log`): Karte im ersten sichtbaren Bereich, Strecken-/Unterkunftsdetails öffnen und schliessen, Eintragsliste öffnen und schliessen sowie Editor mit korrektem Tageskontext. Finale iPhone-Screenshots unter `/tmp/roadbook-map-first-final-iphone-screens` visuell geprüft.
