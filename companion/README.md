# Roadbook – persönliche Reisebegleitung

Native SwiftUI-App für iPhone/iPad ab iOS 17. Projekt: `Roadbook.xcodeproj`, Scheme `Roadbook`.

## Umfang dieser ersten Version

- Balkan und Spanien als getrennte, read-only Roadbooks; Balkan zuerst in der Auswahl.
- Tagesetappen, Ruhetage, Unterkunftskandidaten, Status, Quellenhinweise und originale Google-Maps-Links.
- Gebündelter Startstand, validierte Downloads und atomarer Offline-Cache.
- Übersichtskarte je Reise, Tageskarten und vergrösserbare Apple-Karte mit gespeicherten Streckenlinien. Fährverbindungen schematisch; Übernachtungsorte ausdrücklich ungefähr, keine bestätigten Hotelkoordinaten. Datenübergabe und Prüfung: `MAPS.md`.
- Kartenbetonte Tagesansicht: grosse Karte zuerst, danach Maps-Link, wichtige Originalhinweise und aufklappbare Strecke/Unterkunft/Einträge. Unterkunftsname, Status, Eintragsanzahl und Schreibaktion bleiben sichtbar. Darstellungsprüfung der Hinweise: `DAY-LAYOUT.md`.
- Tagespfeile oben rechts wechseln direkt zum vorherigen/nächsten Tag, inklusive aktualisierter Karte und persönlichem Eintragskontext. Der normale Zurück-Pfeil kehrt zur Einstiegsansicht zurück.
- Persönliche Texte und bis zu acht Fotos pro Erinnerung; bearbeiten/löschen mit Bestätigung.
- Tagebuch unabhängig vom Reiseplan: Trip-/Etappen-ID plus ursprünglicher Titel/Datum. Keine automatische Löschung bei Planänderungen.
- Tagebucheinträge zeigen die zugehörige aktuelle Tagesroute samt Karte und Link zum Tages-Roadbook. Ursprünglicher Titel und Datum bleiben erhalten; bei entfernter Etappe wird keine andere Route zugeordnet. Bisher keine historische Streckenkopie je Eintrag, deutlich als aktueller Plan gekennzeichnet.
- Native PhotosPicker-Auswahl, JPEG-Kopien mit maximal 2’400 Pixeln längster Kante, Bildbeschreibung. Originale unverändert; EXIF/Standortmetadaten nicht übernommen.
- Keine Schreiboperation vom Mobilgerät auf den Planungsserver. Keine Journal-/Fotodaten im öffentlichen Feed oder bei ChatGPT.

## Entwicklungsstand und Grenzen

Standardmässig **private CloudKit-Ablage** im eigenen Container `iCloud.com.mrm.roadbook`. Development-Signing und Berechtigungen wurden am 3. September 2026 erfolgreich erstellt und geprüft. Der Nutzer hat anschliessend den echten Abgleich von Testnotizen und Fotos zwischen iPhone und iPad bestätigt. Die Trennung zweier Apple-Accounts ist noch nicht geprüft. Ein eingerichteter Speicher bedeutet nicht, dass jeder Hintergrundabgleich bereits erfolgreich war. App-Store-Connect-Eintrag und Production-Schema sind seit 4. September vorbereitet; Build 11 ist seit 5. September in der internen TestFlight-Gruppe. Eigenständiges App-Icon eingebunden; Gestaltung und Prompts: `ICON-DESIGN.md`. Es gibt keine Offline-Karten, Turn-by-turn-Navigation oder gemeinsame Tagebuchfreigabe. Die iPad-Version verwendet dieselbe adaptive Listen-Navigation; kein eigener Desktop-Arbeitsplatz.

Die Leseschnittstelle `/api/companion-plan` ist veröffentlicht (Commit `c958ed6`, HTTP 200, beide Reisen mit je 30 Tagen geprüft). Die App lädt beim Start automatisch den Online-Stand. Manuell: Zahnrad → Einstellungen → Reisepläne → „Reisepläne aktualisieren“. Die Reiseauswahl zeigt pro Reise den Planstand aus deren Version, nicht den Downloadzeitpunkt. Bestehende Web-UI unverändert. Nur im Repository veröffentlichte Änderungen erscheinen im Feed; lokale Browserentwürfe nicht. Beide produktiven Reisen werden als „Veröffentlichter Reiseplan“ angezeigt.

**Veröffentlichung angebunden:** Der Balkan-Editor speichert Änderungen zunächst lokal. `Plan veröffentlichen` gibt Route und passende Unterkünfte nach PIN-Eingabe zentral frei. Die Oberfläche bestätigt die Übergabe erst, wenn der Companion-Feed die neue Version liefert. Ausgangsversion, stabile IDs und geschützte Fixpunkte werden geprüft. Details und Tests: `../publication-handoff.md`. Kein Push-Dienst und kein App-Store-Update je Routenänderung.

## Xcode und Datenquelle

```sh
node scripts/export-companion.js
DEVELOPER_DIR=/Applications/Xcode-beta.app/Contents/Developer xcodebuild -project companion/Roadbook.xcodeproj -scheme Roadbook -destination 'generic/platform=iOS Simulator' -derivedDataPath companion/DerivedData CODE_SIGNING_ALLOWED=NO build
```

`Resources/plans.json` wird aus den kanonischen Reisedaten erzeugt, nicht manuell gepflegt. `api/companion-plan.js` erzeugt denselben Feed zur Laufzeit. Quell-IDs müssen bei Umplanungen erhalten bleiben; IDs gelöschter Tage dürfen nicht für andere Tage wiederverwendet werden. Einträge entfernten Tagen bleiben unter Mein Tagebuch erreichbar.

## TestFlight-Vorbereitung

Version **0.1.0 (11)** wurde am 5. September 2026 mit der vollständigen Balkanroute und der neuen Wegpunktdarstellung als Release archiviert, lokal exportiert, signaturgeprüft und erfolgreich zu App Store Connect hochgeladen; Apple verarbeitet das Paket. Noch keine Beta-Prüfung oder Einladung. Apple-Portalname **Roadbook by Mr M**, App-ID **6808538943**. Production-Schema nach ausdrücklicher Nutzerfreigabe bereitgestellt. Vor dem Wechsel müssen die bestehenden Development-Einträge gesichert und anschliessend bewusst übernommen werden. Details, Paketpfade, Beta-Texte und Freigabeschritte: [Distribution/TESTFLIGHT.md](Distribution/TESTFLIGHT.md).

## Eigene iCloud-Ablage – Development-Abgleich bestätigt, Production offen

Spur (Projekt To do) dient als Referenz: SwiftData + private CloudKit-Datenbank. Das bestehende Developer-Team ist in `Config.xcconfig` übernommen. **Nicht den Container von Spur oder MindMap verwenden.**

1. Eigene App-ID `com.mrm.roadbook` und Container `iCloud.com.mrm.roadbook`: Development-Profil erfolgreich durch Xcode bereitgestellt. Keine Änderung an Spur oder MindMap.
2. CloudKit- und Development-Push-Berechtigungen sind in `Roadbook.entitlements` aktiviert; `Info.plist` enthält Remote notifications und den expandierten Container-Namen.
3. `ROADBOOK_CLOUD_CONTAINER = iCloud.com.mrm.roadbook` ist gesetzt. Development-Schema und echte Entwicklungssynchronisation bestätigt; Production-Schema am 4. September bereitgestellt. Distribution-Signatur mit Production-CloudKit und Production-Push geprüft. Echte Production-Synchronisation noch offen.
4. Mit echten Geräten prüfen: zwei Geräte desselben Accounts sehen nur dessen Daten; zweiter Account sieht diese Einträge nicht. Kein CKShare und keine Public/Shared Database verwenden.
5. iCloud-Ausfall, voller Speicher, gleichzeitiges Bearbeiten, grosse Fotos und Accountwechsel testen. Accountwechsel schliesst die bisherige Ansicht und wählt einen getrennten Store. Bei fehlender Accountprüfung wird nicht automatisch unter einem anderen Account hochgeladen.

Lokale Testeinträge werden **nicht automatisch migriert**. Debug behält den bisherigen Pfad; Release verwendet ab Build 9 `PrivateJournalProduction/<owner>`. Einstellungen → Tagebuch sichern ermöglicht einen bewussten Export und kontrolliertes Einlesen. Datei ist unverschlüsselt und muss geschützt gespeichert werden. Details: [JOURNAL-BACKUP.md](JOURNAL-BACKUP.md).

**Noch wichtige Einschränkung im Cloud-Modus:** Das Tagebuch verlangt bei kaltem App-Start derzeit eine erfolgreiche Accountprüfung. Bei ungeklärtem Konto bleiben beide Reisepläne, Etappen und Navigationslinks zugänglich; nur das Tagebuch ist gesperrt. Erneut versuchen und Rückkehr in den Vordergrund (höchstens alle 30 Sekunden, nur bei geschlossenem Speicher) können die Prüfung wiederholen. Bereits geöffnete Editoren werden durch blosse Vordergrundwechsel nicht verworfen. Echte Offline-Tagebuchnutzung nach Neustart ist noch nicht freigegeben. Vor Reiseeinsatz muss eine sichere Offline-Accountbindung mit Wiederanmeldung/Accountwechsel getestet werden. Im explizit unkonfigurierten lokalen Modus sind Kaltstart und Tagebuch offline möglich.

SwiftData-Synchronisierung ist eventual consistency, kein Backup oder zugesagter Konfliktschutz. Die manuelle Sicherung enthält nur lokal verfügbare Daten; nicht auf zwei Geräten gleichzeitig importieren. Konfliktverhalten des laufenden Cloud-Abgleichs und vollständige Wiederherstellung auf echten Geräten bleiben zu prüfen. Kein Teilen-Schalter suggeriert bereits vorhandene Berechtigungen.

## Tests

Node: `node --test tests/*.test.js` vom Repository-Stamm. Feed-Tests sichern stabile IDs, beide Reisen, korrekte Fähr-Hafenzufahrt und Ausschluss persönlicher Felder. Der Endpoint lehnt POST ab.

Xcode-UI-Tests: Scheme Roadbook auf iPhone/iPad testen. `-ui-testing` verwendet einen separaten lokalen Store und greift auch bei aktivierter Cloud-Konfiguration nicht auf iCloud zu. Tests entfernen ausschliesslich selbst angelegte Testeinträge.

## Vor einer Reiseversion

Zwei-Account-Tests und explizite Gegenrichtungsprüfung; Offline-Neustart des Tagebuchs im Cloud-Modus; Speicherfehler und Wiederherstellung auf echten Geräten; Dynamic Type; freigegebener Plan-Feed; abschliessende Datenschutzangaben und TestFlight-Prüfung. Noch keine TestFlight- oder öffentliche Store-Veröffentlichung.
