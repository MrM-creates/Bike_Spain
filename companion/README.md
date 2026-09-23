# Roadbook – persönliche Reisebegleitung

Native SwiftUI-App für iPhone und iPad ab iOS 17. Projekt: `Roadbook.xcodeproj`, Scheme: `Roadbook`.

## Aktueller Stand

**Version 0.1.0 (19)**, am 10. September 2026 für beide bestehenden TestFlight-Gruppen freigegeben; beide zeigen „Im Test“. Die geöffnete App prüft alle 15 Sekunden auf veröffentlichte Änderungen, sodass ein auf dem anderen Gerät geänderter Hotelstatus automatisch erscheint. Im Hintergrund pausiert der Abruf; unveränderte Pläne werden nicht erneut heruntergeladen. Nach bestätigtem Speichern steht der neue Buchungsstatus sofort beim Hotel. Während der gemeinsame Feed nachläuft, erscheint ein kleiner Hinweis darunter. Zwei gezielte iPhone-Tests und der iPad-Test bestanden, Screenshots und Release-Signatur geprüft. Die PIN-Freischaltung bleibt auf dem jeweiligen Gerät gespeichert. Ablauf und Grenzen: [BOOKING-STATUS.md](BOOKING-STATUS.md), Veröffentlichung: [Distribution/TESTFLIGHT.md](Distribution/TESTFLIGHT.md).

Die App-Version und die Reiseplanversion sind getrennt. Der gebündelte Stand und der öffentliche Companion-Feed stimmen bei der Prüfung vom 10. September vollständig überein:

- Balkan: `2026-09-10T09:58:35.540Z`, 30 Tage.
- Spanien: `2026-08-16T14:49:12.000Z`, 30 Tage.

Der Server für Buchungsstatus ist produktiv bereitgestellt. Änderungen werden in dieselben Reiseplandaten geschrieben, die auch die Admin-App liest. Die App benötigt zum Speichern Internet; Tagebuch und Fotos bleiben privat.

## Funktionen

- Balkan und Spanien als getrennte Roadbooks mit Tagesetappen, Unterkünften, Status, Quellen und Google-Maps-Links.
- Übersichtskarte, Tageskarten und gespeicherte Streckenlinien. Fährlinien sind schematisch; Übernachtungsorte können ungefähr sein. Keine Offline-Karten oder Turn-by-turn-Navigation.
- Validierter Startbestand, Online-Aktualisierung und atomarer Offline-Cache der Pläne. Einstellungen → Reisepläne → Reisepläne aktualisieren; die App lädt auch beim Start den Online-Stand.
- Ab Build 17: Hotelname und Buchungsstatus sichtbar ohne Aufklappen; nach Freischaltung in den Einstellungen Offen/Angefragt/Gebucht für die vorgesehene Unterkunft ändern. Abgleich mit dem öffentlichen Reiseplan, für alle Nächte des Aufenthalts.
- Persönliches Tagebuch mit Text und bis zu acht Fotos pro Eintrag. Einträge behalten Reise-/Etappen-ID sowie ursprünglichen Titel und Datum, auch wenn der Plan später geändert wird.
- Neue Einträge bieten den Mikrofonbutton und „Lieber tippen“. Stoppen, Prüfen, Bearbeiten und Weiterdiktieren; gespeichert wird nur Text. Die automatische Zeichensetzung ist seit Build 15 aktiv. Ablauf und Grenzen: [VOICE-NOTES.md](VOICE-NOTES.md).
- Privat gespeicherte Fotos werden verkleinert und ohne Standortmetadaten übernommen; Originale bleiben in der Mediathek.

## Entwickeln

Eigene Identitäten: `com.mrm.roadbook` und `iCloud.com.mrm.roadbook`. Die App verwendet nicht den Container von Spur oder Mindmap.

Auf diesem Mac liegt Xcode unter `/Applications/Xcode-beta.app`; im Terminal ist derzeit Command Line Tools ausgewählt. Beispiel aus dem Repository-Stamm mit explizitem temporärem Build-Ausgabeordner:

```sh
DEVELOPER_DIR=/Applications/Xcode-beta.app/Contents/Developer xcodebuild \
  -project companion/Roadbook.xcodeproj -scheme Roadbook \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath /tmp/Roadbook-Development-Check CODE_SIGNING_ALLOWED=NO build
```

`-derivedDataPath` legt nur die Build-Ausgabe fest und kann auf einen anderen vorhandenen Ausgabeordner zeigen. Es ist keine Projektverlagerung notwendig. **Die lokale Signierung wurde am 10. September wiederhergestellt**; Simulator-Build und signaturgeprüftes Release-Archiv mit der neuen Apple-Development-Identität sind erfolgreich. Der anschliessende Build 16 wurde erfolgreich für TestFlight exportiert und veröffentlicht. Siehe [ENTWICKLUNGSSTATUS.md](ENTWICKLUNGSSTATUS.md).

`Roadbook/Resources/plans.json` wird mit `node scripts/export-companion.js` vom Repository-Stamm aus den kanonischen Reisedaten erzeugt. Es wird nicht manuell gepflegt. `api/companion-plan.js` liefert denselben Feed. IDs müssen bei Umplanungen stabil bleiben; entfernte Etappen-IDs dürfen nicht neu vergeben werden.

## Prüfen

Vom Repository-Stamm: `node --test tests/*.test.js`. Die Katalogprüfung berücksichtigt die im Release vom 7. September korrigierten Entfernungen und kennzeichnet genau die zehn überarbeiteten Kartenlinien als geprüft.

`RoadbookUITests` im Xcode-Scheme verwendet mit `-ui-testing` einen separaten lokalen Store ohne CloudKit. Der Test `testPlanStatusAndRefreshInSettings` erwartet den gebündelten Balkan-Planstand vom 7. September. Echte Sprache und geräteübergreifender Abgleich benötigen zusätzlich den [Gerätecheck](GERAETECHECK.md).

## Veröffentlichung der Reisepläne

[Öffentliche Web-App](https://motorrad-roadbook-spanien-2026.vercel.app/) und [Companion-Feed](https://motorrad-roadbook-spanien-2026.vercel.app/api/companion-plan). Der Balkan-Editor speichert zunächst lokal. „Plan veröffentlichen“ gibt Änderungen nach PIN-Eingabe zentral frei und bestätigt die Übergabe erst nach Prüfung des Feeds. Einzelheiten: [publication-handoff.md](../publication-handoff.md).

Nur veröffentlichte Reiseänderungen erscheinen im Feed; lokale Browserentwürfe nicht. Persönliche Tagebuch-/Fotodaten werden weder in den öffentlichen Feed noch an ChatGPT übertragen. Ab Build 17 schreibt die native App ausschliesslich autorisierte Buchungsstatusänderungen auf den Planungsserver. Hotelwechsel und Routenbearbeitung bleiben in der Web-App. Eine Planaktualisierung benötigt kein neues TestFlight-Paket.

## Private Daten und offene Geräteprüfungen

SwiftData verwendet die private CloudKit-Ablage. Development-Abgleich zwischen iPhone/iPad wurde zuvor vom Nutzer bestätigt; Production-Schema und Distribution-Berechtigungen wurden eingerichtet. Der aktuelle persönliche Geräteabgleich wird durch die Entwicklerprüfung vom 10. September nicht erneut bestätigt.

- Zwei verschiedene Apple-Konten, Konflikte, voller Speicher und vollständige Wiederherstellung sind gesondert zu prüfen.
- Beim kalten Start verlangt das Cloud-Tagebuch weiterhin eine erfolgreiche Kontoprüfung. Bei ungeklärtem Konto bleiben Reisepläne und Navigation erreichbar; das Tagebuch ist gesperrt. Sichere Offline-Tagebuchnutzung nach Neustart ist noch nicht freigegeben.
- Hintergrundabgleich ist kein Backup und keine Garantie sofortiger Synchronisierung.
- Development- und Production-Tagebücher verwenden getrennte Speicherwege. Lokale Entwicklungseinträge werden nicht automatisch übernommen.
- Die manuelle Tagebuchsicherung enthält lokal verfügbare Daten und ist unverschlüsselt. Import/Wiederherstellung gehören nicht zum normalen Gerätecheck. Details: [JOURNAL-BACKUP.md](JOURNAL-BACKUP.md).

Große `.build`-Archive, `DerivedData`, lokale Prüfartefakte und persönliche Tagebuchsicherungen gehören nicht in den Quellcode-Commit. Historische Buildberichte bleiben erhalten; „aktuell“ und „offen“ beziehen sich dort auf ihr jeweiliges Datum.
