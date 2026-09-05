# Roadbook – TestFlight-Vorbereitung

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
