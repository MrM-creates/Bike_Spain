# Tagesroute bei Erinnerungen · 3. September 2026

## Ergänzung: gruppierte Übersicht und eindeutiges Schreiben

- `Mein Tagebuch` enthält alle persönlichen Einträge, gruppiert nach Reise und stabiler Etappen-ID. Reiseabfolge statt globaler Neueste-zuerst-Liste; innerhalb einer Etappe chronologisch.
- Gruppen tragen Reise, Tag, Reisedatum und Strecke. Frühere/entfernte Reisen oder Etappen bleiben mitsamt ursprünglichem Kontext sichtbar. Einträge werden nicht anhand gleichlautender Titel oder Tagesnummern vermischt.
- `Eintrag schreiben` führt zuerst zur Reise- und Tagesauswahl, auch für Etappen ohne Erinnerungen. Im Editor bleibt der Kontext über dem scrollenden Formular sichtbar. Aus der Tagesansicht heisst die Aktion `Eintrag für Tag N`.
- Erstellen über beide Wege, Gruppierung trotz umgekehrter Erstellreihenfolge, Neustart, Bearbeiten und Löschen auf iPhone geprüft. Gruppierter Composer inklusive Neustart/Löschen auch auf iPad bestanden. Logs: `/tmp/roadbook-grouped-journal-tests.log`, `/tmp/roadbook-grouped-ipad-tests.log`. Der Karten-Test dieses Laufs scheiterte separat am vererbten Accessibility-Identifier, nicht am Tagebuch; Nachtest separat.
- iPad-Gruppierung visuell anhand `/tmp/roadbook-grouped-ipad-screens/A28184E9-FDA2-4408-B25A-DB28F36142A6.png` geprüft.
- Schema, vorhandene persönliche Einträge, iCloud-Container und Web-App unverändert. Update-Build 3 auf beiden echten Geräten installiert; keine Deinstallation.

## Bisherige Eintragsdetailansicht

`Mein Tagebuch` → Eintrag öffnen zeigt unter der Erinnerung die zugehörige Reise, Tagesnummer, Titel und Fahrdaten bzw. Ruhetag. `Tages-Roadbook öffnen` führt zur vollständigen Tagesansicht. Die bereits verwendete Tageskarte lässt sich direkt aus der Erinnerung vergrössern. Bestehende Design-/Navigationsregeln (App UI Foundation und Flider) bleiben erhalten.

Die Verknüpfung verwendet Reise-ID und stabile Etappen-ID. Die Tagesnummer dient nur der Anzeige. Ist die Etappe nicht mehr vorhanden, erscheint ein Hinweis; Notiz, ursprünglicher Titel/Datum und Fotos bleiben erhalten. Karte und Tages-Roadbook sind klar als **aktueller Reiseplan** gekennzeichnet, nicht als historische Route. Änderungen an gespeichertem Titel/Datum werden sichtbar erläutert. Frühere Einträge enthalten keine historische Streckenkopie.

Keine Änderungen am SwiftData-/CloudKit-Schema, keine Migration und keine Anpassung bestehender Einträge. Keine neuen Server-Funktionen, keine Web-Veröffentlichung und keine TestFlight-Einladung.

## Prüfung

- Gerätebuild erfolgreich: `/tmp/roadbook-journal-route-build.log`.
- Alle drei iPhone-UI-Tests bestanden: `/tmp/roadbook-journal-route-tests.log`. Erstellen, Speichern, Neustart, Tageskontext, Tages-Roadbook, Kartenvergrösserung, Rücknavigation, Bearbeiten und Löschen geprüft. Zusätzlich bestehende Karten- und Kontoausfalltests.
- Sechs gezielte Node-Tests für Feed und Karten bestanden; keine Änderungen an deren Daten.
- iPad: System-Tabs sind oben angeordnet und werden von Xcode doppelt gemeldet. Test verwendet den ersten passenden Button statt eines TabBar-Containers. Vollständiger Eintrags-/Routen-/Karten-/Bearbeitungs-/Löschdurchlauf bestanden: `/tmp/roadbook-journal-route-ipad-tests-3.log`. Screenshot der Eintragsansicht unter `/tmp/roadbook-journal-context-screens` visuell geprüft.
- Auf beiden echten Geräten als Update installiert und Roadbook erfolgreich geöffnet. Keine Deinstallation, keine Änderung persönlicher Einträge durch das Update.
