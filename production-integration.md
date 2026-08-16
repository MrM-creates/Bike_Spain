# Production-Integration: generische Reiseübersicht

Stand: 15. August 2026

## Umfang dieses Schritts

Die bestehende Spanienreise kann über einen Feature-Parameter zusätzlich als generische Reiseübersicht geöffnet werden:

```text
/reise-roadbook-2026.html?tripOverview=1
```

Ohne `tripOverview=1` startet weiterhin unverändert die bisherige Roadbook-Oberfläche.

Die Integration umfasst:

- ein generisches, browser- und testbares Reise- und Versionsmodell;
- einen verlustfreien Read-only-Import des veröffentlichten Spanienplans;
- eine Reiseübersicht mit Charakteristik, Eckdaten, Fixpunkten und Unterkunftsstatus;
- dieselbe OpenStreetMap-Karte in Übersicht und Roadbook mit statisch vorbereiteten, straßenfolgenden Routen über die veröffentlichten KML-Wegpunkte;
- eine gekoppelte Auswahl zwischen Reisebeschreibung und Kartenabschnitten;
- eine Übersichtskarte, die bestätigte Routenänderungen aus dem Roadbook sofort übernimmt und als Roadbook-Entwurf kennzeichnet;
- den Wechsel zwischen `Übersicht` und einem dreispaltigen Roadbook-Arbeitsbereich;
- synchronisierte Tages- und Unterkunftslisten links, die echte Karte in der Mitte und kontextabhängige Details rechts;
- verlinkte Unterkunft und Alternative sowie Buchungsstatus im Unterkunftskontext;
- Tagesrouten in unterschiedlichen Farben und nummerierte Übernachtungsmarker;
- eine Vorschau für `Direkt` bzw. `Kurvig & schön`, die den veröffentlichten Plan nicht verändert und über eine klar beschriftete Kartenlegende mit ihm verglichen werden kann;
- sichtbar neu berechnete Distanz und Fahrzeit für die gewählte Routenvorschau;
- einen kompakten Entscheidungsdialog zum Verwerfen oder Übernehmen einer neuen Routenart;
- die dauerhafte Ablage einer bestätigten Routenart im bestehenden lokalen Reiseentwurf; der Entwurf wird nach einem Reload wiederhergestellt und kann sauber zurückgesetzt werden;
- eine auf genau eine Tagesetappe begrenzte automatische Webprüfung für reine Routenart-Änderungen;
- eine klar getrennte, auf lokale Streckenwünsche und Wegpunkte begrenzte Aktion `Etappe anpassen`;
- kontextgebundene Änderungsdialoge für die ausgewählte Etappe oder Unterkunft;
- einen Exportdialog: die aktuell ausgewählte Routenart der Tagesroute in Google Maps sowie die bereinigte Gesamtreise als KML oder GPX;
- `Reise anpassen` als Einstieg in den bereits etablierten Änderungsflow.

## Sicherheitsgrenzen

- Die neue Ansicht schreibt ausschließlich in den bereits vorhandenen lokalen Reiseentwurf. Ohne ausdrückliche Veröffentlichung ändert sich der gemeinsame Online-Plan nicht.
- Der Publish-Endpunkt akzeptiert das neue Feld `routeStyle`, veröffentlicht aber weiterhin nur nach dem bestehenden PIN-, Prüf- und Bestätigungsflow.
- Der veröffentlichte Plan bleibt die unveränderliche Vergleichsbasis für Übersicht, Roadbook und Karte.
- Geschützte Fixpunkte werden nur lesend übernommen.
- Es wurde kein Deployment ausgelöst.
- Der externe Routingdienst wird nur vom Entwicklungsskript verwendet. Die App selbst lädt die erzeugte lokale GeoJSON-Datei und sendet zur Laufzeit keine Reise- oder Buchungsdaten an den Routingdienst.

## Datenbrücke

`data/trip-spanien-2026.js` ist die kanonische Quelle für veröffentlichten Stand, festen Originalplan, 30 Etappen, 19 Unterkunftsstopps und die drei geschützten Fixpunkte. Roadbook, Unterkunftsansicht und beide Publish-Endpunkte lesen beziehungsweise aktualisieren diese eine Quelle. `reise-roadbook-2026.html` stellt daraus den veröffentlichten Snapshot sowie eine schmale Entwurfsbrücke bereit. `assets/travel-model.js` überführt den Snapshot in `Trip`, `PlanRevision`, `Stage`, `RouteVariant`, `Stay`, `AccommodationOption`, `Booking`, `FixPoint`, `NarrativeSegment` und `PublishedRelease`.

Der Import prüft die Parität zwischen den 30 bestehenden Reisetagen und den 30 erzeugten Etappen. Tagesnummern dienen nur der Anzeige; Beziehungen verwenden stabile IDs.

`scripts/generate-roadbook-routes.js` reproduziert `assets/roadbook-routes.geojson` aus den KML-Ankern. Dabei werden optionale Zusatzrunden von der Hauptlinie getrennt, Ortsanker ohne Wendeschleifen passiert und die portablen Exporte `reiseplanung-verfeinert-2026-export.kml` sowie `reiseplanung-verfeinert-2026.gpx` erzeugt. Übersicht und Roadbook filtern daraus dieselben `original`-Geometrien; nur eine ausdrücklich gewählte Routenvorschau blendet die passende `direct`-Variante ein.

La Patacona, Águilas, Monachil, Castelldefels und Aosta sind als eindeutige Übernachtungsorte hinterlegt. Für La Patacona ist das Olympia Hotel in Alboraya die konkrete erste Wahl; in Águilas ist es das Senator Águilas direkt am Meer. Kartenmarker, Anfahrten, Abfahrten und Exporte verwenden die konkreten Zielanker. Der Heimweg von Aosta nach Berikon verwendet Martigny und Lausanne als Korridor.

## Entwurfs- und Prüfzustände

1. Eine andere Routenart erzeugt zunächst nur eine sichtbare Vorschau.
2. `Übernehmen` speichert die Änderung im vorhandenen lokalen Entwurf und kennzeichnet sie als `Prüfung ausstehend`.
3. Nach einem Reload werden Entwurf, Karte, Routenhinweise und Google-Maps-Link aus demselben Änderungsstand rekonstruiert.
4. `Route automatisch prüfen` sendet bei einer reinen Routenart-Änderung nur die ausgewählte Tagesetappe an die bestehende Webprüfung. Start, Ziel, Unterkunft, Folgetag und Fährfixpunkt werden kontrolliert.
5. Erst der bestehende Veröffentlichungsflow kann aus dem geprüften Entwurf einen neuen gemeinsamen Online-Stand machen.

Die Fährerkennung unterscheidet nun ausdrücklich zwischen `Fahrtag` und `Fährtag`; ein normaler Motorradtag kann dadurch nicht mehr versehentlich als Transport-Fixpunkt gelten.

## Nächster Integrationsschritt

Vor einem neuen Preview-Deployment werden die straßenfolgenden Geometrien neu erzeugt, sämtliche Änderungsarten (`Etappe anpassen`, Aufenthalt ändern, Unterkunft ersetzen und `Reise anpassen`) gegen denselben Revisionsstand getestet und Desktop sowie Mobile visuell abgenommen. Erst nach erfolgreicher Preview-Abnahme und ausdrücklicher Freigabe folgt Production. Neue Reisen bleiben ein eigener späterer Integrationsschritt.
