# Gerätevorbereitung · 3. September 2026

## Eingerichtet

- Eigene App `com.mrm.roadbook`, Developer-Team aus bestehender Konfiguration.
- Xcode hat ein eigenes Development-Profil mit CloudKit für `iCloud.com.mrm.roadbook` und Development-Push bereitgestellt. Signatur ausserhalb der Sandbox erfolgreich verifiziert. Keine Änderung an Spur/MindMap und kein TestFlight-Upload.
- Container-Name im gebauten `Info.plist` ausdrücklich geprüft; Remote notifications aktiviert. Beliebige `INFOPLIST_KEY_…`-Buildwerte allein erzeugten den benutzerdefinierten Schlüssel nicht, daher steht er im Quell-Plist.
- Update 0.1.0 (4): vereinfachte Reiseauswahl mit Planstand je Reise, manuelles Aktualisieren unter Einstellungen. Auf iPad und iPhone erfolgreich als Update installiert; iPad geöffnet. Gezielter UI-Test auf beiden Simulatorformaten bestanden (`/tmp/roadbook-settings-tests.log`, `/tmp/roadbook-settings-ipad-tests.log`), Screenshots visuell geprüft. Automatischer Startabgleich und persönliche Daten unverändert.
- Update 0.1.0 (5): kartenbetonte Tagesansicht mit kompaktem Kopf, grosser Karte, wichtigen Originalhinweisen und aufklappbarer Strecke/Unterkunft/Einträgen. Auf beiden echten Geräten erfolgreich installiert und geöffnet. Keine Deinstallation, keine Schema- oder CloudKit-Änderung. Prüfung und Darstellungskonzept: `DAY-LAYOUT.md`.
- Version 0.1.0 (1) ursprünglich erfolgreich auf MrM iPad (iPad Pro 11 M4) und MrM Phone 17 (iPhone 17 Pro) installiert und per Gerätewerkzeug gestartet.
- Erfolgreicher Build: `/tmp/roadbook-cloud-signing-2.log`; Produkt: `/tmp/roadbook-device-build-20260903/Build/Products/Debug-iphoneos/Roadbook.app`.
- DerivedData für signierte Geräte-Builds ausserhalb des Desktop-Ordners verwenden. Der erste Build scheiterte beim Signieren an Finder-Dateiattributen im Desktop-Buildordner; keine Nutzerdaten wurden dafür gelöscht.

## Prüfungen

- Swift-Planprüfung: beide Reisen, 60 Etappen, Unterkunftszuordnung, IDs, Datumsdarstellung, Maps-URLs und Ablehnung ungültiger Feeds bestanden.
- Swift-Speicherprüfung: synthetische Notiz und Foto nach erneutem Öffnen unverändert; getrennte lokale Stores bleiben getrennt; Bildverkleinerung und Ablehnung ungültiger Bilder bestanden. Das ist **kein CloudKit-Nachweis**.
- Beim UI-Test wurde ein nicht öffnender Erinnerungseditor gefunden: Sheet-Präsentation von der List-Section auf den auslösenden Button verlegt. Anschliessend Erstellen, Speichern, Neustart, erneutes Öffnen und Löschen erfolgreich getestet.
- Fehlendes iCloud-Konto darf die Reiseansicht nicht sperren. Beide Roadbooks und Maps-Link bleiben verfügbar; Tagebuch ist gesperrt und bietet Wiederholen.
- Abschliessender UI-Testlauf: **2 Tests bestanden**, `TEST SUCCEEDED`; `/tmp/roadbook-device-prep-tests-2.log`.

## Jetzt gemeinsam bestätigen

1. Auf beiden Geräten denselben iCloud-Account verwenden.
2. Unter Reisen eine Tagesetappe öffnen und eine kurze Test-Erinnerung speichern.
3. Auf dem zweiten Gerät unter Mein Tagebuch prüfen, ob der Eintrag nach dem Hintergrundabgleich erscheint; danach Gegenrichtung und ein Testfoto prüfen.
4. Bei Problemen den Text aus Mein Tagebuch bzw. Einstellungen → Speicher erfassen. Installieren und Starten beweisen noch keinen erfolgreichen Cloud-Abgleich.

Der Nutzer hat am 3. September 2026 bestätigt: Testnotiz auf dem anderen Gerät angekommen; auch Fotos erfolgreich abgeglichen. Gegenrichtung und separater Apple-Account noch nicht ausdrücklich bestätigt. Keine echten Reiseerinnerungen ohne Sicherung erfassen.

## Noch vor Reisebetrieb / TestFlight

- Development-Schema für Distribution prüfen; Grundabgleich von Text/Fotos durch Nutzer bestätigt, Gegenrichtung explizit prüfen.
- Separaten Apple-Account prüfen: keine Einsicht in die Einträge des anderen Accounts. Aktuell keine Sharing-Funktion.
- Tagebuch-Kaltstart ohne Netz sicher lösen und Kontowechsel prüfen. Reisepläne bleiben schon jetzt unabhängig davon lesbar.
- Export/Backup, Speicherfehler, Fototest und Konfliktverhalten ergänzen bzw. prüfen.
- Distribution-Signing, Production-CloudKit-Schema, Datenschutzangaben und eigener Roadbook-TestFlight-Build. Eigenständiges orange-/cremeweisses App-Icon inzwischen eingebunden. Die parallele Spur-Vorbereitung bleibt unabhängig.
