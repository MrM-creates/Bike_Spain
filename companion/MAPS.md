# Karten in der Begleitapp

## Vollständige Geometrie veröffentlicht · 3. September 2026

Die folgende Diagnose ist inzwischen durch die gemeinsame Datenkorrektur behoben: beide Generatoren liefern `overview=full`, Spanien entfernt keine Rückwegschleifen mehr. Beide GeoJSON-Dateien, GPX/KML und Companion-Feed sind aktualisiert und mit Commit `4e4a74c` veröffentlicht. 43 Node-Tests, Swift-Planchecks und iPad-Kartentests mit frischem gebündeltem Stand bestanden. Balkan Tag 1 enthält jetzt 7’576 statt 33 Punkte; alle 18 Balkan-Routerdistanzen und Fahrzeiten sind unverändert. Detailnachweise und Grenzen: `../route-geometry-resolution.md`.

HTTP-200-Abruf aller drei Live-Dateien stimmt vollständig mit den geprüften lokalen Dateien überein. Der Native-UI-Test wird nun bewusst aus dem aktuellen Bundle mit eigenem `UITestReadOnlyPlans`-Cache initialisiert; alte Simulator-Caches gelten nicht als Nachweis neuer Geometrie. Keine Änderung des echten Gerätecaches oder persönlicher Daten durch Tests. Der erste Kartentest mit bisherigem Simulator-Cache ist deshalb kein Beleg für die neue Auflösung; massgeblich ist `/tmp/roadbook-full-geometry-native-fresh-tests.log`.

## Ursprünglicher Genauigkeitsbefund · vor der Korrektur

Die sichtbaren Linien sind **nicht strassengenau**. Beide Generatoren (`scripts/generate-adria-routes.js` und `scripts/generate-roadbook-routes.js`) fragen OSRM mit `overview=simplified` ab. Beispiel Balkan Tag 1: 294’079,4 m berechnete Fahrstrecke, aber nur 33 Koordinaten in `assets/adria-routes.geojson`. Die App verbindet diese Punkte gerade; damit schneidet die Darstellung Kurven und kann neben Strassen liegen. Der Spanien-Generator entfernt zusätzlich geometrisch erkannte Rückwegschleifen (`removeBacktrackingSpurs`), ohne die gespeicherte Routendistanz neu zu berechnen. Ob und welche konkreten Abschnitte davon betroffen sind, ist nicht ermittelt.

Die bisherigen Daten-/UI-Tests belegen Zuordnung, Übertragung und Sichtbarkeit, **keine vollständige Strassenübereinstimmung**. OSRM-Strassenberechnung und hinterlegte Zwischenpunkte sind nicht mit einer vollständigen fachlichen Routenprüfung gleichzusetzen. Google Maps berechnet unabhängig neu; gleiche Zwischenpunkte garantieren keinen identischen Verlauf.

Noch offen: vollständige Strassengeometrie erzeugen, gegen beabsichtigte Strassen/Zwischenpunkte und Navigationslinks prüfen, keine Schleifen stillschweigend wegschneiden, anschliessend neu geprüfte Geometrie an den Feed binden und veröffentlichen. Fähren bleiben ausdrücklich schematisch. In diesem Diagnoseschritt wurden weder Reiseverläufe noch Geometrien oder öffentliche Daten verändert.

## Nachbesserung am 3. September · Build 3

Die Nutzerrückmeldung zeigte eine Lücke in der bisherigen Prüfung: Simulator-Screenshots im hellen Modus waren nicht repräsentativ für das echte iPad im Dunkelmodus. Direkter Gerätescreenshot `/tmp/roadbook-actual-ipad-build2.png` zeigt, dass die dunkelgrüne Route auf grünem Nacht-Gelände kaum erkennbar war. Die Linien waren vorhanden, der Kontrast unzureichend.

- Strecken jetzt mit 9-Punkt-Kontrastrand und 5-Punkt-Innenlinie: dunkelgrün/weiss bei heller Karte, helles Mintgrün/schwarz bei dunkler Karte. Fähre analog Ocker/Gold und gestrichelt. Ziele mit weissem Rand.
- Alter öffentlicher Cache auf beiden Geräten enthielt zudem keine Kartenfelder. Sichere Ergänzung aus identischem gebündeltem Plan wird nun bereits beim Start atomar gespeichert, auch offline. Die initiale Planaktualisierung hängt nicht mehr an der beim Öffnen des Journals ersetzten View.
- Reale Cachekontrolle nach Build 2: beide Geräte 19 Balkan- und 23 Spanien-Segmente, je 30 Tageskarten. Keine privaten Einträge/Fotos für diese Diagnose ausgelesen. Cachebefund allein wurde ausdrücklich nicht als Nachweis sichtbarer Linien gewertet.
- Swift-Regressionscheck: alter echter Gerätecache wird ergänzt; 42 Segmente bleiben bei Encode/Decode erhalten; geänderte Route erhält keine alten Linien. Ungültige Koordinaten bleiben abgelehnt.
- UI prüft nun beide Kartenstile und beide Reisen ausdrücklich. Karte weist zudem die Anzahl der Fahr-Etappen mit Verlauf aus. Ein vererbter Accessibility-Identifier der Vollbildansicht wurde entfernt, damit einzelne Kartenhinweise korrekt adressierbar sind.
- Build 3 erfolgreich signiert und auf iPhone/iPad als Update installiert. Abschliessende Kontrastprüfung siehe ergänzte Nachweise.
- Abschliessend beide Karten-UI-Tests bestanden: `/tmp/roadbook-contrast-tests.log` (Balkanübersicht, Balkan-Tageskarte und Spanienübersicht jeweils explizit hell/dunkel). Screenshots in `/tmp/roadbook-contrast-screens` visuell geprüft: Linien und Fähre heben sich jetzt deutlich ab. Der alte Identifier-Fehler ist im Nachtest behoben.
- Echte Geräte: Build 3 auf beiden installiert. iPad gestartet; sichtbare Karte nach dem Update muss vom Nutzer wieder geöffnet werden (Screenshot direkt nach Neustart zeigt zunächst die Reiseauswahl). Ein iPhone-Fernstart scheiterte vorübergehend an der Geräteverbindung, nicht an Installation oder Build. Keine Aussage über abgeschlossene Sichtprüfung auf echtem iPhone ohne weiteren Nachweis.
- Erneuter iPhone-Start: vom System abgelehnt, weil das Gerät gesperrt ist. Installation bleibt erfolgreich; Nutzer kann Roadbook nach Entsperren selbst öffnen. Nutzerbestätigung der korrigierten iPad-Karte noch ausstehend.

## Anzeige

Reise öffnen → Übersicht mit kompletter Route. Tagesetappe öffnen → Tageskarte; an Ruhetagen die Basis. `Karte vergrössern` öffnet die interaktive Apple-Karte, `Gesamte Strecke` setzt den Ausschnitt zurück. Die Vorschauen selbst greifen keine Scrollgesten ab. Native List-/Navigationsstruktur nach App UI Foundation und Flider, keine zusätzliche Hauptnavigation.

Die App verwendet keine Directions-Neuberechnung: Die grünen Linien sind exakt die vorhandenen originalen GeoJSON-Koordinaten der Web-App. Direktrouten und optionale Ausflüge sind ausgeschlossen. Fähren erscheinen gestrichelt und schematisch. Beim Balkan-Fährtag sind Hafenzufahrt und Seestrecke getrennte Segmente. Die Nummern entsprechen den Reisetagen; gleiche Basis an aufeinanderfolgenden Tagen wird zusammengefasst.

Übernachtungsorte sind **ungefähre Lagen** am jeweiligen Routenziel. Die Quelldaten enthalten keine geprüften Hotel-/Apartment-Koordinaten. Deshalb keine scheinbar präzisen Unterkunfts-Pins; Kandidaten und Links bleiben in der Tagesansicht zugänglich. Kartengrundlage gegebenenfalls online; gespeicherte Linien sind keine Offline-Karten. Keine Standortberechtigung, kein Tracking.

## Daten und Aktualisierung

- `data/companion-maps.json`: explizit geprüfte Zuordnung aus beiden GeoJSON-Dateien zu Reise- und Etappen-ID. `schemaVersion: 1`.
- Signatur bindet die Karte an ID, Titel, Ruhetag, Maps-URL, Strassenhinweise und Übernachtungsort. Datum und persönliche Bemerkungen verändern die Streckengeometrie nicht.
- `lib/companion-maps.js` liefert bei einer geänderten Route keine alte Linie. Abhängige Ruhetage verlieren ebenfalls die alte Basis. UI erklärt fehlende passende Geometrie.
- `/api/companion-plan` liefert Karte zusammen mit dem Plan; bestehende Clients ignorieren das zusätzliche optionale Feld.
- `node scripts/export-companion.js` erzeugt den App-Startstand aus demselben Feed.
- Alte App-Caches ohne Karten können nur bei identischer Reiseversion und identischen Streckenfeldern aus dem gebündelten Stand ergänzt werden. Downloads und Cache enthalten anschliessend beides.
- Nach einer echten Umplanung zuerst GeoJSON prüfen/aktualisieren; erst dann `node scripts/export-companion-maps.js --bind-reviewed-geometry` ausführen. Dieser bewusste Freigabeschritt läuft **nicht** automatisch bei einer blossen Planveröffentlichung. Danach Kartendaten veröffentlichen und den App-Startstand aktualisieren. Kein App-Update für neue Kartendaten nötig, sobald sie im Online-Feed sind.

## Nachweise · 3. September 2026

- 40 Node-Tests bestanden, darunter exakter Koordinatenvergleich aller 41 Fahr-/Transporttage, Trennung der Fährsegmente, Ausschluss optionaler/direct Varianten und Invalidierung bei Planänderungen.
- Swift-Planchecks bestanden, inklusive Koordinatenreihenfolge, ungültiger Koordinaten und Fähr-/Ruhetagdaten.
- Karten-UI-Test auf iPhone 17 Pro und iPad Air 11 M4 Simulator bestanden: Reiseübersicht und Etappenkarte öffnen, Ausschnitt zurücksetzen; Screenshots visuell geprüft. Lokale Bildnachweise unter `/tmp/roadbook-map-iphone-screens` und `/tmp/roadbook-map-ipad-screens`.
- Erster kompletter iPhone-Testlauf hatte einen Scroll-/Hittability-Fehler im vorhandenen Tagebuchtest. Test-Helfer an die längere Reiseansicht angepasst; abschliessend alle 3 iPhone-UI-Tests bestanden (`/tmp/roadbook-maps-ui-tests-2.log`), inklusive Tagebuch und ungeklärtem iCloud-Konto. Zusätzlich 1 iPad-Kartentest bestanden.
- Finaler signierter Gerätebuild erfolgreich (`/tmp/roadbook-maps-final-build.log`); als Update auf iPhone und iPad installiert, keine Deinstallation und keine Änderung am Tagebuchschema.

## Deploy Result

- URL: https://motorrad-roadbook-spanien-2026.vercel.app/api/companion-plan
- Target: production
- Status: READY
- Commit: `0a8abd4`
- Framework: statische Web-App mit Node-Funktionen
- Build Duration: 458 ms
- Deployment: `dpl_HaYaTgrZHNYzAytnbn8kUsVMc3Ud`
- Live-GET: HTTP 200, beide Reisen mit je 30 Karten-Datensätzen; strukturell identisch zum lokal geprüften Feed. Reiseinhalte und Web-Oberfläche unverändert.
- Post-Deploy Observability: keine Fehlerlogs für dieses Deployment im abgefragten Zeitraum; externe Drains nicht geprüft, kein neues Monitoring eingerichtet.

TestFlight und Einladung der Mitreisenden wurden nicht ausgeführt. Tagebuch-/CloudKit-Schema unverändert.
