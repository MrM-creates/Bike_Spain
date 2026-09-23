# Roadbook – TestFlight-Verlauf

**Aktueller verteilter Stand: 0.1.0 (23).** Beide bisherigen Testgruppen zeigen „Im Test“.

## Klarere Etappenanimationen – Build 23 verteilt, 18. September 2026

Vollständiger Bereichsname, Alle auswählen/Auswahl aufheben und ausgeschriebene
Ladezustände. Gezielte Bedienungsprüfungen auf iPhone und iPad bestanden,
Screenshots geprüft, signiertes Paket streng verifiziert. Upload um 14:19:53 Uhr
Europe/Zurich erfolgreich. Build-ID `aae43f70-f940-40a7-a5e1-2f73c2727136`.
Deutsche Testhinweise und unveränderte Verschlüsselungsangabe gespeichert.
Beiden bestehenden Gruppen zugeordnet, automatische Benachrichtigung aktiviert.
Beide Gruppenlisten zeigen 0.1.0 (23) als „Im Test“, 90 Tage Restlaufzeit.
Benachrichtigungsempfang und Geräteinstallation nicht separat geprüft.
Artefakte: `companion/.build/animation23-ready/`; Paketdetails in
[ANIMATIONS.md](../ANIMATIONS.md).

## Etappenanimationen – Build 22 verteilt, 18. September 2026

Upload um 13:56 Uhr Europe/Zurich erfolgreich. Build-ID
`68b8dc6b-6cf0-4dad-9b4d-51edae49a27b`. Deutsche Testhinweise und unveränderte
Verschlüsselungsangabe gespeichert. Beide bestehenden Gruppen „Roadbook –
eigener Gerätetest“ und „Roadbook – Anna“ anschliessend mit 0.1.0 (22),
„Im Test“ und 90 Tagen Restlaufzeit geprüft. Der Nutzer bestätigt auf seinem
Gerät schnelle Downloads, funktionierendes Teilen und den Tagebuchlink.
Artefakte: `companion/.build/animation22-ready/`. Details: [ANIMATIONS.md](../ANIMATIONS.md).

## Wetter – Build 21 verteilt, 18. September 2026

Die Wetteranzeige pro Etappe ist umgesetzt und auf iPhone und iPad geprüft. Nach ausdrücklicher Freigabe ist auch der echte WeatherKit-Abruf mit anschliessendem Offline-Neustart bestanden. Das signierte Paket liegt unter `companion/.build/weather21-ready/export/Roadbook.ipa`. Upload am 18. September um **11:16 Uhr Europe/Zurich** erfolgreich; Apple-Verarbeitung abgeschlossen. Build-ID `ec3a5d40-a323-4104-aa4d-1a1c4d2e01d8`. Deutsche Testhinweise und die unveränderte Verschlüsselungsangabe sind gespeichert. Nach ausdrücklicher Nutzerbestätigung („Ja, für beide Gruppen freigeben“) beiden bestehenden Gruppen zugeordnet, automatische TestFlight-Benachrichtigung aktiviert. Anschliessend die Build-Listen beider Gruppen geprüft: **0.1.0 (21) steht in „Roadbook – eigener Gerätetest“ und „Roadbook – Anna“ jeweils auf „Im Test“, Ablauf in 90 Tagen.** Tatsächlicher Empfang der Benachrichtigungen und Installation auf den Geräten nicht separat geprüft. Prüfungen und SHA-256: [WEATHER.md](../WEATHER.md).

## Gemeinsame Reisebeschreibung – Build 20, 18. September 2026

Build **0.1.0 (20)** lokal gebaut, archiviert und als signierte IPA exportiert. Aufklappbare gemeinsame Reisebeschreibung inklusive Reiseverlauf; automatische Textänderung bei geöffneter Ansicht auf iPhone und iPad geprüft. 74 Node-Tests bestanden; Feed-Erweiterung produktiv. Upload am 18. September um **10:00 Uhr Europe/Zurich** erfolgreich; Apple-Verarbeitung abgeschlossen, deutsche Testhinweise und die unveränderte Verschlüsselungsangabe gespeichert. Build-ID `8ccd5a84-83cd-4209-bc67-2b0da8c4bc66`. Der erste Versuch mit Xcode Beta wurde wegen nicht unterstütztem SDK zurückgewiesen. Unveränderter geprüfter Quellstand anschliessend mit regulärem Xcode 27.0 (`27A266a`) neu archiviert, exportiert und streng signaturgeprüft. IPA-SHA256: `e40b97c520e9c3e72eaf9229280f665a430e8fd5942f1141f3769b102034ed57`. Nach Blockierung der automatischen Freigabeprüfung hat der Nutzer die Gruppenzuordnung selbst abgeschlossen („gemacht“). Anschliessend beide Gruppenseiten live geprüft: **Build 20 in „Roadbook – eigener Gerätetest“ und „Roadbook – Anna“ jeweils „Im Test“**, Ablauf in 90 Tagen, jeweils 1 Tester:in. Die interne Testeransicht meldet bereits „Installiert 0.1.0 (20)“. Kein erneuter Freigabe- oder Benachrichtigungsschritt durch den Agenten; tatsächlicher Empfang einer Benachrichtigung nicht separat geprüft. Artefakte unter `companion/.build/description20/`, Details in [REISEBESCHREIBUNG.md](../REISEBESCHREIBUNG.md).

## Automatischer Geräteabgleich – Build 19, 10. September 2026

Build **0.1.0 (19)** um **13:58 Uhr Europe/Zurich** erfolgreich hochgeladen. Apple-Verarbeitung abgeschlossen, deutsche Testhinweise gespeichert. Build-ID `f4f4284a-4248-41c5-8c3b-7285354cdd9a`. Nach ausdrücklicher Nutzerfreigabe im Chat („Aber hier die Freigabe!“) die unveränderte Exportangabe gespeichert und den beiden bestehenden Gruppen „Roadbook – eigener Gerätetest“ und „Roadbook – Anna“ mit aktivierter automatischer TestFlight-Benachrichtigung zugeordnet. Beide Gruppenseiten zeigen Build 19 „Im Test“, jeweils 1 Tester:in, Ablauf in 90 Tagen. Keine neuen Gruppen oder Einladungen. Installation und Abgleich auf den persönlichen Geräten mit Build 19 stehen noch zur Bestätigung aus. Der neue Build fragt bei geöffneter App alle 15 Sekunden nach veröffentlichten Änderungen und pausiert im Hintergrund. Unveränderte Pläne werden mit ETag/HTTP 304 ohne Datenkörper bestätigt.

Zwei gezielte iPhone-Tests und ein iPad-Test bestanden: automatischer Empfang von „Angefragt“ für Tag 1 ohne manuelle Aktualisierung, Rückkehr aus dem Hintergrund sowie bestehendes Speichern bei verzögertem Feed. Screenshots, Release-Archiv, Paketintegrität und strenge Signatur geprüft. Eigener Production-CloudKit-Container unverändert. Quellcommit `6943b13`; Servercommit `502a443`, production READY. Artefakte und Nachweise unter `companion/.build/booking19/`. Umsetzung in isoliertem Worktree, danach lokal übernommen; sechs parallel geänderte Reiseplandateien anhand SHA256 unverändert erhalten. Die gebündelten Reiseplandaten entsprechen Build 18; neuere veröffentlichte Pläne werden online geladen. Details: [BOOKING-STATUS.md](../BOOKING-STATUS.md).

## Klarer Buchungsstatus – Build 18, 10. September 2026

Build **0.1.0 (18)** um **13:40 Uhr Europe/Zurich** erfolgreich hochgeladen. Apple-Verarbeitung abgeschlossen; Exportangabe gespeichert, deutsche Testhinweise gesichert. Build-ID `69090afe-6e2d-48d6-aec3-ecefadac17f4`. Nutzerfreigabe für Gruppen und Sicherheit liegt vor. Nach der zusätzlichen ausdrücklichen Nutzerzustimmung zur TestFlight-Mitteilung an Anna mit aktivierter automatischer Benachrichtigung eingereicht. Beide bestehenden Gruppenseiten zeigen Build 18 „Im Test“, jeweils 1 Tester:in, Ablauf in 90 Tagen. Die interne Testeransicht meldet bereits „Installiert 0.1.0 (18)“; die tatsächliche Statusbedienung auf dem Gerät wurde noch nicht vom Nutzer bestätigt. Ein bestätigter neuer Status erscheint sofort beim Hotel, während die Veröffentlichung im gemeinsamen Feed nachlaufen darf. Die doppelte Anzeige „Gewünschter Status“ entfällt nach erfolgreichem Speichern.

Zwei gezielte iPhone-Tests (verzögerter Feed über zwei Nächte, verlorene Antwort) und der iPad-Test bestanden. Screenshots geprüft. Archiv/IPA, strenge Codesignatur und unveränderte Production-CloudKit-Berechtigungen bestätigt. Quellcommit `42c7be5`. Nachweise unter `companion/.build/booking18/`, Details in [BOOKING-STATUS.md](../BOOKING-STATUS.md).

## Buchungsstatus – Build 17, 10. September 2026

Build **0.1.0 (17)** wurde um **13:20 Uhr Europe/Zurich** erfolgreich hochgeladen; Apple zeigt den Upload als **Abgeschlossen**. Build-ID `fe477121-d0f8-498e-9cd5-165c6fc00775`. Deutsche Testhinweise gespeichert. Die Exportangabe hat der Nutzer selbst bestätigt; im Portal gespeichert. Nach ausdrücklicher Nutzerfreigabe beiden bestehenden Gruppen „Roadbook – eigener Gerätetest“ und „Roadbook – Anna“ zugeordnet. Automatische Benachrichtigung zunächst deaktiviert; Apple zeigte intern „Im Test“, extern „Genehmigt“. Nach separater ausdrücklicher Zustimmung wurde „Tester benachrichtigen“ ausgelöst. Um 13:27 Uhr zeigen beide Gruppen Build 17 „Im Test“, jeweils 1 Tester:in, Ablauf in 90 Tagen. Beide Gruppenseiten live geprüft. Keine neuen Gruppen oder Tester angelegt. Installation und echte Statusänderung auf persönlichen Geräten noch nicht bestätigt.

Server-Erweiterung ist bereits produktiv (Commit `cec3f7a`, Deployment `dpl_6FVLmbdggJsUU8cbLdmoHthVG5od`). 67 Node-Prüfungen, fünf iPhone-Tests und beide iPad-Abläufe erfolgreich. Release-Archiv und lokale IPA streng signaturgeprüft, eigener Production-CloudKit-Container unverändert. Lokaler Quellcommit `65b8f31`; Paket und Nachweise unter `companion/.build/booking17/`. Details: [BOOKING-STATUS.md](../BOOKING-STATUS.md).

## Veröffentlichung Build 16 – 10. September 2026

Version **0.1.0 (16)** erfolgreich zu TestFlight hochgeladen (11:31 Uhr Europe/Zurich); Apple-Verarbeitung abgeschlossen. Nach ausdrücklicher Nutzerbestätigung wurde die unveränderte Verschlüsselungsantwort „Keinen der oben genannten Algorithmen“ gespeichert. Deutsche Testhinweise zum Bearbeiten-Dialog sind gespeichert. Die beiden bestehenden Gruppen **Roadbook – eigener Gerätetest** und **Roadbook – Anna** wurden mit aktivierter automatischer Testerbenachrichtigung zugeordnet und eingereicht. Beide Gruppenseiten zeigen Build 16 **„Im Test“**, jeweils 1 Tester:in, Ablauf in 90 Tagen. Keine neue Testergruppe oder Einladung, kein öffentlicher Link. Build-ID: `cab7351f-aedd-490c-a9e7-9dd0b56be742`.

Der App-Store-Connect-Export wurde auf Paketintegrität, strenge Signatur, Production-CloudKit/APNs, ausschliesslich `iCloud.com.mrm.roadbook`, `get-task-allow=false` und `beta-reports-active=true` geprüft. SHA-256 der lokal exportierten IPA: `b6b8c177b5ce3ad60cb8703a720b3ec83eed331c1a990af72f684ec5209fb423`. Export unter `/Volumes/Interne SSD/Development/Verification-2026-09-10/Roadbook-Build16-TestFlight/export/`; Upload aus demselben geprüften Archiv mit `UploadOptions-TestFlight.plist`. Quellstand `94fa601`, alle 22 Einträge des Build-16-Quellmanifests vor Veröffentlichung erneut bestätigt. Protokolle und Prüfergebnisse unter `/Users/MrM/Documents/ChatGPT/To do/Exporte/Entwicklungspruefung-2026-09-10/Roadbook-Build16/`.

Die automatische Freigabeprüfung hatte das erste Speichern der Export-Compliance-Antwort abgelehnt; erst nach dem anschliessenden ausdrücklichen Nutzer-Ja wurde dieselbe Antwort gespeichert. Installation und echte Sprachergänzung des neuen Builds auf persönlichen Geräten sind noch nicht bestätigt.

## Build 15 – automatische Interpunktion, 9. September 2026

Automatische Satzzeichen auf jeder Speech-Recognition-Anfrage aktiviert (`addsPunctuation = true`). Keine Änderungen an Oberfläche, Datenmodell oder Berechtigungen. 20 bestehende Transcript-Assertions bestanden, Release-Archiv erfolgreich. Tatsächliche Erkennungsqualität auf dem Gerät noch zu prüfen. Export und strenge Signaturprüfung erfolgreich. Production-CloudKit/APNs, ausschliesslich eigener Container, get-task-allow=false und beta-reports-active=true bestätigt. Quellmanifest und Release-Artefakte unter `.build/distribution/2026-09-09-build15/`. IPA-SHA-256: `08da3c605d1d34338187869e41877a253f3e9fa73920794c4f51766950bebc29`. Upload um 09:01 erfolgreich; Apple-Verarbeitung abgeschlossen. Unveränderte Verschlüsselungsangabe und deutsche Testhinweise gespeichert. Build 15 beiden bestehenden Gruppen zugewiesen und mit aktivierter automatischer Testerbenachrichtigung eingereicht. Die interne Gruppe „Roadbook – eigener Gerätetest“ und die externe Gruppe „Roadbook – Anna“ zeigen für 0.1.0 (15) jeweils „Im Test“, 1 Tester:in, Ablauf in 90 Tagen. Beide Gruppenseiten live bestätigt. Build-ID `ad9e1d57-a53f-4319-aed2-c9b914d3486d`.

## Build 14 – finale Tagebuchüberarbeitung, 9. September 2026

Übernimmt die unten dokumentierte Tagebuchüberarbeitung aus Build 13 mit einer abschliessenden Titelkorrektur: Der gemeinsame Editor heisst Eintrag und bleibt damit auf schmalen iPhones vollständig lesbar. Direkter Tagebuchablauf auf dem kleineren iPhone erneut bestanden, Screenshot visuell bestätigt. Die übrigen iPhone-/iPad-/Foto-/Sprachprüfungen gelten unverändert.

Release-Archiv, Export und strenge Signaturprüfung erfolgreich. Eigene Production-CloudKit-Ablage und Berechtigungen unverändert bestätigt. Quellmanifest, Archiv, IPA, Testprotokoll und finaler Screenshot unter `.build/distribution/2026-09-09-build14/`. IPA-SHA-256: `0a2856c2bb7a7b157389add65de8861147045a24f199286a0da4c56086cf7220`.

Upload am 9. September um 08:30 erfolgreich (Upload succeeded, EXPORT SUCCEEDED). Apple-Verarbeitung abgeschlossen, unveränderte Verschlüsselungsangabe „Keinen der oben genannten Algorithmen“ und deutsche Testhinweise gespeichert. Der internen Gruppe „Roadbook – eigener Gerätetest“ und der externen Gruppe „Roadbook – Anna“ zugewiesen, mit aktivierter automatischer Testerbenachrichtigung über „Zur Prüfung übermitteln“ eingereicht. Beide Gruppenseiten zeigen für 0.1.0 (14) „Im Test“, jeweils 1 Tester:in; am 9. September live geprüft. Anna hat weiterhin den Status „Eingeladen“. Build-ID `ca1cf5a9-62ec-47d0-b6bb-80956f0f0f3a`, Ablauf in 90 Tagen. Build 13 bleibt ohne Gruppenzuweisung.

## Build 13 – schlankes Tagebuch, 9. September 2026

Auf Nutzerwunsch nach dem Voice-Release überarbeitet: runder orangefarbener Mikrofonbutton wie in Spur, Lieber tippen als zweite Option, direkter gemeinsamer Editor mit Etappenwahl, kompakte Eintragsliste mit Fotovorschauen, Datenschutzhinweise in Einstellungen, verbesserter Dunkelkontrast und kompakte Eintragsdetails. Kein Schemawechsel und keine Migration persönlicher Einträge.

iPhone-Hauptabläufe (5 Tests), Etappengruppierung, Foto-/Reisewechsel sowie iPad-Sprache und direkter Einstieg bestanden. Zusätzlich direkter Einstieg aus leerem Tagebuch auf kleinerem iPhone bestanden. Hell-/Dunkel-Screenshots geprüft. Details: `../VOICE-NOTES.md`.

Release-Archiv und Export erfolgreich, Codesignatur streng geprüft. Version 0.1.0 (13), eigener Production-CloudKit-Container, Production-APNs, get-task-allow=false und beta-reports-active=true bestätigt. Archivierte und getestete App-Quellen identisch (SHA-256-Manifest). Dauerhafte Ablage `.build/distribution/2026-09-09-build13/`, mit Archiv, IPA, Signaturnachweisen, Testprotokollen und Screenshots. IPA-SHA-256: `1300c08e92633d54cb25aee23ef030ae59c1a7d7731b1ec8c92c75606c75844d`.

TestFlight-Upload am 9. September um 08:19 erfolgreich (Upload succeeded, EXPORT SUCCEEDED). Build-ID `4245ea51-93b7-4cea-8be9-82a111b729e6`. Ohne Gruppenzuweisung belassen: Auf dem kleineren iPhone wird der Navigationstitel noch gekürzt. Build 14 korrigiert ausschliesslich diesen Titel auf Eintrag.

## Build 12 – Voice-Notizen, 9. September 2026

Der Nutzer hat die Veröffentlichung in TestFlight ausdrücklich beauftragt. Version 0.1.0 (12) mit Sprachaufnahme/Mitschrift, Tippen als Alternative, Weiterdiktieren und erhaltenem Etappenkontext erfolgreich als Release archiviert. Drei neue iPhone-UI-Tests, iPad-Hauptablauf, bestehender Text-Speichertest und 29 Swift-Assertions bestanden; Details in `../VOICE-NOTES.md`.

Archiv dauerhaft unter `companion/.build/distribution/2026-09-09-build12/Roadbook.xcarchive`, Buildprotokoll und SHA-256-Manifest der Quellen daneben. Archiv-Info.plist bestätigt Bundle-ID, Build 12 und beide Sprach-/Mikrofon-Nutzungserklärungen. Keine Änderung am CloudKit-Schema oder an persönlichen Tagebuchdaten.

Nach erneuter Apple-Anmeldung durch den Nutzer Export und Signaturprüfung erfolgreich. Exportiertes IPA unter `companion/.build/distribution/2026-09-09-build12/export/Roadbook.ipa`, SHA-256 `4e067794304743c002587d505fd71bf3aebfce555a853d1e6cc973b78670daf5`. Signierte Entitlements bestätigen ausschliesslich Roadbooks eigenen Production-CloudKit-Container, Production-APNs, `get-task-allow=false` und `beta-reports-active=true`. Upload am 9. September um 07:51 erfolgreich: „Upload succeeded“, „Uploaded package is processing“, `EXPORT SUCCEEDED`. Apple-Verarbeitung abgeschlossen, Verschlüsselungsangabe „Keinen der oben genannten Algorithmen“ wie beim bisherigen Paket gespeichert, deutsche Voice-Testhinweise gespeichert. Build 12 wurde der internen Gruppe „Roadbook – eigener Gerätetest“ zugewiesen: Status auf deren Build-Seite „Im Test“, 1 Tester. Nach ausdrücklicher zusätzlicher Nutzerfreigabe auch der externen Gruppe „Roadbook – Anna“ zugewiesen und mit aktivierter automatischer Testerbenachrichtigung über „Zur Prüfung übermitteln“ eingereicht. Auch deren Build-Seite zeigt anschliessend für 0.1.0 (12) „Im Test“. Anna wurde am 9. September 2026 auf ausdrücklichen Nutzerwunsch per E-Mail eingeladen. Die externe Gruppe zeigt 1 Testerin und den Status „Eingeladen“; kein öffentlicher Link erstellt. Beide Gruppenseiten live geprüft. Build-ID `9cca66e9-d867-4bf5-8b9d-0c7dc6ad9b9f`, Ablauf in 90 Tagen. Die zunächst von der automatischen Sicherheitsprüfung blockierte externe Gruppenzuweisung wurde erst nach konkreter Nutzerzustimmung durchgeführt.

Stand: 5. September 2026. **App-Eintrag angelegt, CloudKit-Schema nach ausdrücklicher Zustimmung in Production bereitgestellt. Build 11 mit der vollständigen Balkanroute und „Wegpunkte & Strassen“ erfolgreich hochgeladen, verarbeitet und nach bestätigter Export-Compliance der internen Gruppe „Roadbook – eigener Gerätetest“ zugewiesen. Status: „Im Test“. Noch kein externes Beta-Review.** Vollständiger iPhone-Sicherungs-/Importtest bestanden. Keine persönlichen Tagebuchdaten gelesen oder migriert; nur der bestehende Accountinhaber ist interner Tester.

## Build 11 – aktueller Paketstand

Version 0.1.0 (11) wurde am 5. September erfolgreich als Release archiviert, lokal exportiert, signaturgeprüft und zu App Store Connect hochgeladen. Apple zeigt den Upload als abgeschlossen; die Verschlüsselungsfrage wurde nach ausdrücklicher Zustimmung mit „Keinen der oben genannten Algorithmen“ gespeichert. Build 11 ist der internen Gruppe „Roadbook – eigener Gerätetest“ zugewiesen und hat den Status „Im Test“. Production-CloudKit, Production-Push, `get-task-allow=false`, `beta-reports-active=true` und ausschliesslich `iCloud.com.mrm.roadbook` wurden am exportierten IPA geprüft. SHA-256: `03aa760525378ec9ac2946f087c1376863225e6137ee0189c569785c28cb387e`. Artefakte: `companion/.build/distribution/2026-09-05-build11/`.

Enthalten sind alle 18 geprüften Balkan-Fahretappen, die aktualisierten Offline-Karten sowie die neue getrennte Darstellung von Start, Zwischenzielen, Etappenziel und Strassen. Interne Korrekturprotokolle werden nicht als Streckenhinweis gezeigt; freigegebene Wetter-, Sperr-, Grenz- und Fährhinweise bleiben sichtbar. Node-Tests, Swift-Plan-/Hinweisprüfungen, Simulator-Build und Produktions-Web-Smoke-Test waren erfolgreich.

## Build 9 – aktueller Paketstand

## Geräte-Update Build 10

Fortsetzung: Release-Archiv und Export Build 10 erfolgreich, entpackte IPA signaturgeprüft, ausschliesslich eigener Production-Container und `get-task-allow=false`. Dauerhafte Artefakte `companion/.build/distribution/2026-09-04-build10/`; IPA-SHA256 `1a9e290073b1d96ec7611a2b15bf21c1cf7f1a141c99063404dbc687429c2451`. Upload am 4. September um 10:00 erfolgreich; Portal bestätigt „Verarbeitung läuft“. Log `/tmp/roadbook-testflight-build10-upload.log`.

Verschlüsselungsangabe nach ausdrücklichem Nutzer-Ja für Builds 9/10 freigegeben; Build 9 bereits gespeichert und „Bereit zur Übermittlung“, Build 10 nach Verarbeitung nachholen. Interne Gruppe „Roadbook – eigener Gerätetest“ (`5f79011b-3f21-45f6-9e84-ccedb318d3bd`) mit genau dem bestehenden Accountinhaber als Tester angelegt; automatische Verteilung aus, noch kein Build zugeordnet. Keine externe Einladung, keine neue Benutzerrolle, keine Beta-Review-Einreichung.

UX-Korrekturen umgesetzt: Exporterfolg mit Systemdialog „Sicherung erstellt“, Tagebucheinträge vor optionalem Routenlink, Eintragsdetail mit Text/Fotos vor Etappenkontext und ohne eingebettete Karte. Beide gezielten iPhone-UI-Tests bestanden (107.702 s, 0 Fehler; `/tmp/roadbook-journal-ux10-tests.log`), Eintragsansicht anhand Screenshot geprüft. Debug-Gerätebuild und Signaturprüfung erfolgreich; Build 10 auf iPhone und iPad installiert. Weiterhin Development, kein Datenmodellwechsel. Build 10 noch nicht archiviert/zu TestFlight hochgeladen; dort liegt Build 9. Vor externer Verteilung neuen Stand paketieren.

Nutzer bestätigt nach dem Geräteupdate: Tagebucheinträge vollständig vorhanden und Sicherung erstellt. Anschliessend UX-Korrekturen für Build 10 angefordert: sichtbare Speicherbestätigung und Eintrag direkt statt Routenumweg. Build 9 bleibt der bereits hochgeladene Stand; für die externe Beta den korrigierten Build verwenden. Kein Production-Wechsel erfolgt.

- Upload am 4. September um 09:36 erfolgreich: „Uploaded package is processing“, „Upload succeeded“, `EXPORT SUCCEEDED`. Log `/tmp/roadbook-testflight-upload-20260904.log`. Dies ist noch keine abgeschlossene Verarbeitung, Export-Compliance-Freigabe oder Beta-Prüfung. Keine Testergruppe/Einladung angelegt.
- Version 0.1.0 (9), Release-Archiv und lokaler Export erfolgreich. Entpackte IPA mit `codesign --verify --deep --strict` geprüft; Production-CloudKit/APNs, `get-task-allow=false`, `beta-reports-active=true` und eigener Container bestätigt.
- Dauerhafte Ablage: `companion/.build/distribution/2026-09-04/Roadbook.xcarchive` sowie `companion/.build/distribution/2026-09-04/export/` (IPA, ExportOptions, DistributionSummary, Packaging.log).
- SHA-256 der IPA: `aefc3f92221dcd8752b5c9da834def3a47e2846ccc52d4ea99418969e404057e`.
- Separates Debug-Sicherungsupdate: `/tmp/roadbook-backup-device-20260904/Build/Products/Debug-iphoneos/Roadbook.app`. Signatur, Build 9 und Development-Entitlements vor Installation erneut bestätigt. Nach Nutzerfreigabe „los“ auf beiden physischen Geräten erfolgreich installiert und gestartet (`devicectl` jeweils Exit 0). Kein TestFlight-/Production-Wechsel. Nutzerprüfung bestehender Inhalte und tatsächlicher Export stehen noch aus.
- `Checks/BackupChecks.swift`: erfolgreicher Round-trip mit synthetischen Fotos/Texten, erhaltenen IDs/Datumsangaben, lokaler Idempotenz, Konfliktabbruch vor Teiländerungen, Ablehnung doppelter IDs, verwaister/fehlender Fotos und übergrosser/ungültiger Dateien. Kein Live-CloudKit-Test.
- 43 Node-Tests erneut erfolgreich. Simulator-Export auf iPhone 17 Pro und iPad Air 11-inch erfolgreich, einschliesslich tatsächlich gespeicherter synthetischer Datei. Vollständiger iPhone-UI-Roundtrip ebenfalls bestanden: Export, Dateiauswahl, Vorschau, gesperrte Übernahme bis zur eigenen Bestätigung, Import ohne Verdopplung (`/tmp/roadbook-backup-ui-iphone-roundtrip-r5.log`, TEST SUCCEEDED, 40.059 Sekunden). Dateinameneingabe und gezieltes Betätigen des Schalters im Beta-Simulator korrigiert; keine App-Änderung gegenüber dem archivierten Build. Echter Geräte-/Production-Abgleich bleibt offen.
- Dateiexport/-import an getrennten Buttons angebunden. Erster Testlauf scheiterte am Dialog; zweiter erreichte den Dialog, erwartete aber einen nicht vorhandenen Abbrechen-Knopf. Der Test prüft jetzt Apples tatsächlichen Sichern-Button und Dateiauswahl. Dark-Mode-Akzent der Sicherungsansicht aufgehellt.

## Apple-Testinformationen

Beta-Beschreibung, Prüfanmerkungen und Kontaktangaben für Roadbook gespeichert. Benutzer bestätigte zuerst die Übernahme des Namens aus Spur und lieferte danach Telefonnummer und E-Mail ausdrücklich für Roadbook; dieselbe E-Mail als Feedback-Adresse verwendet. Apple bestätigt „Gesichert“, die vorherigen Validierungsfehler sind verschwunden. Persönliche Kontaktdaten stehen nicht in dieser Datei. Datenschutz-URL, Marketing-URL und Lizenzvertrag nicht erfunden/verändert.

## Verifizierter Stand

- Referenz: `SpurNative/Distribution/TESTFLIGHT.md` im Projekt „To do“. Spur by Mr M, App-ID `6808194280`, Build 0.1 (1): am 3. September live in App Store Connect „Warten auf Prüfung“. Spur unverändert.
- Roadbook: Bundle-ID `com.mrm.roadbook`, Team `VXWU7PXWZY`, eigener Container `iCloud.com.mrm.roadbook`.
- Version **0.1.0 (8)**, Release, iOS 17+, iPhone und iPad, arm64.
- Archivierung und lokaler App-Store-Connect-Export mit Xcode 27 beta (`27A5252f`) erfolgreich. Apples Upload-Prüfung für dieses Roadbook-Paket steht noch aus; erfolgreicher lokaler Export ist keine Apple-Freigabe.
- Export: Cloud Managed Apple Distribution, `get-task-allow=false`, `beta-reports-active=true`, APNs `production`, CloudKit `Production`, ausschliesslich Roadbooks eigener Container. Development-Entitlements bleiben unverändert.
- Icon 1024 × 1024, ohne Alpha; Datenschutzmanifest im archivierten App-Bundle enthalten; Orientierungsangaben für iPhone und iPad vorhanden.
- Paketintegrität (`unzip -t`) erfolgreich. 43 Node-Tests erfolgreich. Swift-Planprüfung auf den tatsächlich archivierten Reisedaten erfolgreich: zwei Reisen, 60 Tage, Daten/Links/Serialisierung und Ablehnung ungültiger Feeds.
- Signatur direkt aus der entpackten IPA mit `codesign --verify --deep --strict` erfolgreich: „valid on disk“, „satisfies its Designated Requirement“. Eingebettete Entitlements entsprechen der Export-Zusammenfassung. Dafür war Zugriff auf die macOS-Zertifikatsprüfung ausserhalb der Sandbox nötig; die eingeschränkte erste Prüfung meldete fehlendes Vertrauen.
- Bestehende Swift-Prüfprogramme erneut auf archivierten Ressourcen ausgeführt: 60 Tageshinweise korrekt; lokale Text-/Fotopersistenz, getrennte synthetische Stores, Verkleinerung und ungültige Bilder geprüft. Kein neuer CloudKit-Synchronisationstest. Beim synthetischen lokalen Store gab es eine Sandbox-Diagnose zu Store-Changed-Notifications; die Persistenzprüfungen liefen erfolgreich durch.
- Release-Warnungen: unerreichbare Debug-Testzweige sowie ausgelassene AppIntents-Metadaten (kein AppIntents-Framework). Kein Archivierungs- oder Exportfehler.

## Apple-Portal: App-Eintrag angelegt

Die Erstellung eines iOS-App-Eintrags mit Name `Roadbook`, Deutsch, Bundle-ID/SKU `com.mrm.roadbook` wurde versucht. Apple meldet: **„Der eingegebene App-Name wird bereits verwendet.“** Der Dialog wurde abgebrochen; kein Roadbook-App-Eintrag angelegt.

Nach Nutzerbestätigung am 4. September erfolgreich als **Roadbook by Mr M** erstellt. Apple-ID **6808538943**, iOS, Deutsch, Bundle-ID/SKU `com.mrm.roadbook`. Gerätename bleibt `Roadbook`. [TestFlight](https://appstoreconnect.apple.com/teams/82e82ec7-5827-4c85-9e2d-79586c35a605/apps/6808538943/testflight).

## CloudKit: echte Voraussetzung vor Verteilung

Read-only in der CloudKit Console geprüft; keine privaten Records geöffnet:

| Umgebung | Sichtbare Record Types |
| --- | --- |
| Development | `CD_JournalEntry` (15 Felder), `CD_JournalPhoto` (11 Felder), `Users` (7 Felder) |
| Production | nur `Users` (7 Felder) |

Diese Tabelle beschreibt den Stand vor Deployment. Am 4. September nach ausdrücklicher Zustimmung („ja“) die vollständige Vorschau geprüft und bereitgestellt: zwei neue Record Types, 25 Entry-Indizes, 12 Photo-Indizes; Standardrollen `_creator` WRITE, `_icloud` CREATE und `_world` READ an den neuen Typen. Bestehender `Users`-Typ unverändert. Apple bestätigt **„Changes Deployed – The schema is deployed to Production.“** Diese Rollen wirken in der öffentlichen Datenbank, nicht auf fremde private Datenbanken. Die App nutzt ausschliesslich `.private(cloudID)`, keine Public-/Shared-Database. [Apple: Permissions and access control](https://developer.apple.com/icloud/cloudkit/designing/). Keine Datenkopie, kein Reset, keine Änderung an Spur/MindMap.

TestFlight nutzt CloudKit Production. Ein Schema-Deployment überträgt die Datenstruktur, **nicht die vorhandenen persönlichen Development-Einträge**. Dokumentation: [Apple: CloudKit-Schema bereitstellen](https://developer.apple.com/documentation/CloudKit/deploying-an-icloud-container-s-schema).

Die bisher auf beiden Geräten verwendete Version 7 nutzt Development. Ab Build 9 erhält Release einen getrennten Pfad `PrivateJournalProduction/<owner>`; Debug behält `PrivateJournal/<owner>`. Ein Update löscht oder migriert den alten Store nicht. Die neue explizite Sicherung/Übernahme ist in `../JOURNAL-BACKUP.md` beschrieben. **Erst das Debug-Sicherungsupdate testen und eigene Backups erstellen, dann TestFlight installieren.**

Vor dem Wechsel:

1. Mit dem Nutzer klären, welche bereits vorhandenen Notizen und Fotos erhalten werden müssen.
2. Die implementierte Sicherung/Übernahme ist im iPhone-Simulator vollständig geprüft. Als Nächstes nach Nutzerbestätigung das Debug-Sicherungsupdate installieren und eigene Sicherungen erstellen. Tatsächlicher Production-Abgleich steht noch aus. iCloud-Synchronisierung ist kein Backup.
3. Schema nach bewusster Freigabe bereitstellen. Zwei frische Testinstallationen mit synthetischen Inhalten für echten Production-Abgleich verwenden; nicht die einzigen Kopien persönlicher Daten als Migrationstest benutzen.
4. Schreiben, Neustart, Text-/Fotosynchronisierung in beide Richtungen prüfen. Getrennter Apple-Account darf fremde Einträge nicht sehen. Erst danach bestehende Geräte umstellen und externe Tester einladen.

Weiterer bekannter Beta-Punkt: Beim kalten Start braucht das private Tagebuch eine erfolgreiche iCloud-Accountprüfung. Gespeicherte Reisepläne sind offline lesbar, vollständig offline verfügbares Tagebuch und Offline-Karten sind nicht zugesagt.

## Dauerhaft lokal abgelegte Artefakte

Relativ zum Projektstamm (von Git ignoriert, enthalten keine persönlichen Tagebuchdaten):

- `companion/.build/distribution/2026-09-03/Roadbook.xcarchive`
- `companion/.build/distribution/2026-09-03/export/Roadbook.ipa`
- `companion/.build/distribution/2026-09-03/export/DistributionSummary.plist`
- `companion/.build/distribution/2026-09-03/export/ExportOptions.plist`
- `companion/.build/distribution/2026-09-03/export/Packaging.log`

SHA-256 der IPA: `4693f05486e939f3fbce861b4aca8a0d98fcca0b8b3a4ef6e1768799133be08d`.

Originale/Logs zusätzlich unter `/tmp/Roadbook-TestFlight-20260903.xcarchive`, `/tmp/Roadbook-TestFlight-20260903-export`, `/tmp/roadbook-testflight-archive.log`, `/tmp/roadbook-testflight-export.log` und `/tmp/roadbook-testflight-node-tests.log`. Temporäre Pfade sind nicht die dauerhafte Ablage.

## Wiederholbare Paketvorbereitung

Im Repository-Stamm ausführen; vor neuem Build Reisedaten und Versionsnummer bewusst prüfen. Keine bereits zur Verteilung hochgeladene Buildnummer wiederverwenden.

```sh
DEVELOPER_DIR=/Applications/Xcode-beta.app/Contents/Developer xcodebuild \
  -project companion/Roadbook.xcodeproj -scheme Roadbook \
  -configuration Release -destination 'generic/platform=iOS' \
  -archivePath /tmp/Roadbook-TestFlight-next.xcarchive archive

DEVELOPER_DIR=/Applications/Xcode-beta.app/Contents/Developer xcodebuild \
  -exportArchive -archivePath /tmp/Roadbook-TestFlight-next.xcarchive \
  -exportPath /tmp/Roadbook-TestFlight-next-export \
  -exportOptionsPlist companion/Distribution/ExportOptions-TestFlight.plist \
  -allowProvisioningUpdates
```

`ExportOptions-TestFlight.plist` erzeugt nur ein lokales Paket. `UploadOptions-TestFlight.plist` lädt dagegen bei Verwendung mit `-exportArchive` wirklich zu Apple hoch. Letzteres wurde am 4. September für Build 9 erfolgreich ausgeführt. Keine Passwörter/API-Schlüssel im Projekt hinterlegen.

## Noch vor Upload bzw. externer Beta-Freigabe

- [x] Portalname bestätigen und App-Eintrag erstellen.
- [ ] Datenschutzeinschätzung und Verschlüsselungsangaben abschliessen; siehe `PRIVACY-REVIEW.md`. `ITSAppUsesNonExemptEncryption` ist bewusst noch nicht gesetzt, keine Rechtsbestätigung stellvertretend abgeben.
- [x] Tatsächliche Feedback-/Review-Kontaktdaten vom Nutzer bestätigt und bei Apple gespeichert. Keine erfundene Datenschutz-URL eingetragen.
- [ ] Beta-Beschreibung und Testhinweise aus `BETA-NOTES.md` nach Umsetzung der offenen Punkte übernehmen.
- [ ] Schema und Datensicherung/Übergang wie oben abschliessen; für interne Validierung ebenfalls Production verwenden.
- [x] Build 9 zu Apple hochladen.
- [ ] Abschluss der Apple-Verarbeitung prüfen und erforderliche Export-Compliance-Angaben bestätigen lassen.
- [ ] Production-Funktionstests erfolgreich durchführen; dokumentierte Grenzen bewerten.
- [ ] Privaten externen Testkreis ohne öffentlichen Einladungslink anlegen. Keine Admin-/Developer-Rolle für eine reine Testerin vergeben.
- [ ] Ersten externen Build zur Beta-Prüfung einreichen; erst danach gezielte Einladung an die vom Nutzer genannte Testerin. Keine automatische Benachrichtigung vor Bereitschaft.

Roadbook benötigt eine eigene Beta-Prüfung; Spurs Freigabe gilt nicht automatisch für diese App. TestFlight setzt keine öffentliche App-Store-Veröffentlichung voraus. [Apple: TestFlight overview](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/)
