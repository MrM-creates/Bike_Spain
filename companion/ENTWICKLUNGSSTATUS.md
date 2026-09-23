# Roadbook – Entwicklungsstatus

Stand: 10. September 2026. Aktueller verteilter Stand **0.1.0 (19)**; beide bisherigen TestFlight-Gruppen zeigen „Im Test“. Die Umgebungsreparatur endete bei Commit `2789487`. Anschliessend wurde auf `codex/roadbook-edit-voice` die Sprachfunktion beim Bearbeiten korrigiert (Quellcommit `94fa601`), auf iPhone/iPad im Simulator geprüft und nach Nutzerfreigabe veröffentlicht. Siehe [EDIT-VOICE.md](EDIT-VOICE.md) und [Distribution/TESTFLIGHT.md](Distribution/TESTFLIGHT.md).

## Gesicherte Grundlage

Der aktuelle Quellstand wurde vor den Test-/Dokumentationskorrekturen lokal in Git gespeichert: `711efbf`. Die Reparatur erfolgt auf `codex/development-repair-2026-09-10`. Eine zusätzliche kleine Quellsicherung mit Commit-ID und SHA-256-Manifest liegt unter `/Volumes/Interne SSD/Development/Quellsicherungen-2026-09-10/`. Diese Sicherung enthält keine privaten Signierschlüssel, App-Daten oder Buildcaches. Kein GitHub-Push und keine Veröffentlichung im Rahmen dieser Reparatur.

## Umgebung

- Originalprojektpfad beibehalten. Vollständiges Xcode 27.0 (27A5252f) und iOS-27-Simulator vorhanden.
- Terminal-Befehle verwenden `DEVELOPER_DIR=/Applications/Xcode-beta.app/Contents/Developer`; die globale Xcode-Auswahl bleibt unverändert.
- Build-Ausgaben mit `-derivedDataPath` ausdrücklich wählen. Die App-Quellen benötigen keine SSD-Verknüpfung.
- Simulator-Build und der zuvor offene UI-Test wurden am 10. September mit unverändertem App-Code erfolgreich geprüft. Die übernommenen Testkorrekturen wurden anschliessend aus dem Originalprojekt erneut erfolgreich geprüft (je 1 gezielter UI-Test). Roadbooks vollständige Node-Suite besteht mit 60/60 Tests.

## Signierung und Geräteprüfung

**Signierung wiederhergestellt:** Xcode zeigte beim alten Entwicklerzertifikat ausdrücklich „Missing Private Key“. Der Nutzer hat am 10. September in Xcode eine neue Apple-Development-Identität erstellt. Danach wurden beide Release-Archive erfolgreich aus den unveränderten Originalquellen gebaut. Die Signaturen wurden mit `codesign --verify --deep --strict` bestätigt; App-ID, Buildnummer, eigener CloudKit-Container und neues Zertifikat im Provisioningprofil stimmen. Das alte Zertifikat wurde nicht widerrufen oder gelöscht. Die Ursache für den zuvor fehlenden Schlüssel ist nicht nachgewiesen.

Lokales Archiv dieser App: `/Volumes/Interne SSD/Development/Verification-2026-09-10/Roadbook-Build15-SigningCheck.xcarchive`. Geprüft ist die Apple-Development-Signierung des Release-Archivs (`get-task-allow=true`), nicht ein neuer App-Store-/TestFlight-Export. Es gab keinen Upload und keine Installation auf persönlichen Geräten. Die Provisioningprofile wurden von Xcode für die neue Identität aktualisiert; private Schlüssel wurden nicht ausgelesen oder exportiert. Prüfprotokolle und maschinenlesbare Ergebnisse liegen im To-do-Projekt unter `Exporte/Entwicklungspruefung-2026-09-10/`.


**Geräte bestätigt:** Der Nutzer hat am 10. September die echte Sprachnotiz auf iPhone und iPad sowie die anschliessende Bearbeitung auf dem iPad mit Übernahme am iPhone für Spur und Roadbook bestätigt. Damit sind Spracheingabe neuer Notizen und der beobachtete iCloud-Abgleich in beiden Richtungen geprüft. Das ist kein Zwei-Account-, Konflikt- oder Offline-Kaltstarttest. Separater Roadbook-Befund: Im Bearbeiten-Dialog ist der Sprachzugang nicht wie in Spur sichtbar; diese anschliessende UI-Korrektur ist im lokalen Build 16 enthalten.

Der ursprüngliche Prüfbericht liegt im To-do-Projekt unter `Exporte/Entwicklungspruefung-2026-09-10/PRUEFBERICHT.md`; sein Stand vor dieser Reparatur bleibt als Nachweis erhalten.

**Build 16 abgeschlossen:** Vier iPhone- und ein iPad-UI-Test bestanden, Screenshots geprüft und Release-Archiv `Roadbook-Build16-EditVoice.xcarchive` streng signaturgeprüft. Anschliessend erfolgreich zu TestFlight hochgeladen und für beide bestehenden Gruppen freigegeben; Details in [EDIT-VOICE.md](EDIT-VOICE.md).

**Build 17 abgeschlossen:** Gemeinsamer Buchungsstatus für vorgesehene Hotels direkt in der Etappe sichtbar und nach Admin-PIN-Freischaltung bearbeitbar. Backend produktiv, 67 Node-Prüfungen, fünf iPhone-Tests und beide iPad-Abläufe bestanden. Release-Archiv/IPA geprüft, zu TestFlight hochgeladen und nach Nutzerfreigaben beiden bestehenden Gruppen zugewiesen. Beide zeigen „Im Test“. Quellcommit `65b8f31`, Servercommit `cec3f7a`. Details und Grenzen: [BOOKING-STATUS.md](BOOKING-STATUS.md).

**Build 18 abgeschlossen:** Bestätigter Hotelstatus erscheint sofort während des Feed-Abgleichs. Zwei iPhone-Tests, ein iPad-Test, Screenshots und Release-Paket geprüft. Quellcommit `42c7be5`. Nach Nutzerfreigaben für Sicherheit, Gruppen und TestFlight-Mitteilung beiden vorhandenen Gruppen zugewiesen; beide „Im Test“. Die interne Testeransicht meldet Build 18 installiert. Details: [BOOKING-STATUS.md](BOOKING-STATUS.md).

**Build 19 abgeschlossen:** Automatischer Abruf veröffentlichter Änderungen alle 15 Sekunden bei aktiver App, mit ETag/HTTP 304 und Pause im Hintergrund. Zwei iPhone-Tests und ein iPad-Test bestanden, einschliesslich Statusübernahme in offener Tagesansicht ohne manuelles Aktualisieren. Quellcommit `6943b13`, Servercommit `502a443` produktiv. Release-Paket und Signatur geprüft. Nach ausdrücklicher Nutzerfreigabe Exportangabe gespeichert und beide bestehenden Gruppen inklusive TestFlight-Benachrichtigung freigegeben; beide zeigen „Im Test“. Installation und Abgleich auf persönlichen Geräten mit Build 19 noch nicht bestätigt. Details: [BOOKING-STATUS.md](BOOKING-STATUS.md).
