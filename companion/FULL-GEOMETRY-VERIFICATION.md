# Gemeinsame Kartenkorrektur und Tagespfeile

## Verification Report: vollständige Strecken

**Story:** Öffnen einer Reise oder Tagesetappe lädt den zentralen vollständigen Streckenverlauf und stellt ihn sowohl in der Admin-App als auch in der Begleitapp dar.

| Boundary | Status | Evidence |
|---|---|---|
| UI renders | Bestanden | Admin-Übersicht und D8-Tageskarte lokal sowie veröffentlichte Übersicht visuell geprüft; keine Browserfehler/-warnungen |
| Client → API | Bestanden | Live-GET `/api/companion-plan`: HTTP 200, 4’499’751 Bytes |
| API → Data | Bestanden | Beide Live-GeoJSON-Dateien vollständig identisch mit geprüften lokalen Dateien |
| Data → Response | Bestanden | Gesamter Live-Feed strukturell exakt gleich `companionFeed()`; 43 Node-Tests bestanden |
| Response → UI | Bestanden | Swift-Planchecks; iPad-UI-Test mit garantiert frischem Bundle für beide Reisekarten und Balkan-Tageskarte bestanden |

UI-Test mit frischem Bundle: `/tmp/roadbook-full-geometry-native-fresh-tests.log`. Der Simulator-Build enthält nachweislich 7’576 Punkte für Balkan Tag 1. Frühere Simulator-Caches werden im UI-Test nicht länger übernommen; dafür separater `UITestReadOnlyPlans`-Ordner. Persönliche Gerätespeicher bleiben unberührt.

Bei der Sichtprüfung der dichten Linien fielen spitze Gehrungsverbindungen im Kartenrand auf. Build 7 verwendet `lineJoin: .round` für Aussen- und Innenlinie, ohne Änderung der Koordinaten. Signierter Gerätebuild erfolgreich (`/tmp/roadbook-full-geometry-final-build.log`), auf iPhone und iPad ohne Deinstallation installiert. Enthält weiterhin die auf beiden Formaten geprüften Tagespfeile aus Build 6.

Finaler iPad-Kartentest ebenfalls bestanden (`/tmp/roadbook-full-geometry-rounded-tests.log`); finale Bilder unter `/tmp/roadbook-full-geometry-final-screens`.

## Deploy Result

- **URL**: https://motorrad-roadbook-spanien-2026.vercel.app
- **Target**: production
- **Status**: READY
- **Commit**: `4e4a74c23ec69b2bc9d7009523c1e29e59a5be10`
- **Framework**: statische Web-App mit Node-Funktionen
- **Build Duration**: ca. 7,5 s (buildingAt bis ready)
- **Deployment**: `dpl_GQZzco9VmtgqL7QzNc39bMwtouU9`

### Post-Deploy Observability

- **Error scan**: keine Runtime-Fehler für `/api/companion-plan` im abgefragten 15-Minuten-Zeitraum.
- **Drains**: nicht geprüft.
- **Monitoring**: kein neues dauerhaftes Monitoring eingerichtet; Zeitpunktprüfung plus tatsächliche Live-Abrufe.

Die Vercel-Deployments-/CLI-Leitlinien führten zur Prüfung von Zielprojekt, Commit-Zuordnung, Live-Datenvergleich und Fehlerprotokoll. Navigation folgt weiterhin der bestehenden App-UI-Foundation-/Flider-Struktur. Keine neue Hauptnavigation und keine Wischgeste auf der Karte.

## Nutzerübergabe und Grenzen

Admin-App neu laden; auf iPhone/iPad Roadbook nach dem Entsperren öffnen und bei Bedarf Einstellungen → Reisepläne aktualisieren. Build 7 wurde installiert, die Sichtprüfung auf den echten gesperrten Geräten ist nicht bestätigt. Die Geometrie kann ohne weiteres App-Binary über den Feed aktualisiert werden.

Die geplanten Zwischenpunkte, Datumsangaben, Unterkünfte, Google-Maps-Links und Tagebuchdaten sind unverändert. Darstellung der Routerlinie ist nicht gleich tagesaktuelle Befahrbarkeitsprüfung; Google Maps berechnet beim Öffnen des Links selbst neu. Einzelheiten und alte/neue Distanzen: `../route-geometry-resolution.md`.
