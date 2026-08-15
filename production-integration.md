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
- eine lokale Vorschau für `Direkt` bzw. `Kurvig & schön`, die den veröffentlichten Plan nicht verändert und über eine klar beschriftete Kartenlegende mit ihm verglichen werden kann;
- sichtbar neu berechnete Distanz und Fahrzeit für die gewählte Routenvorschau;
- einen kompakten Entscheidungsdialog zum Verwerfen oder Übernehmen einer neuen Routenart;
- eine klar getrennte, auf lokale Streckenwünsche und Wegpunkte begrenzte Aktion `Etappe anpassen`;
- kontextgebundene Änderungsdialoge für die ausgewählte Etappe oder Unterkunft;
- einen Exportdialog: die aktuell ausgewählte Routenart der Tagesroute in Google Maps sowie die bereinigte Gesamtreise als KML oder GPX;
- `Reise anpassen` als Einstieg in den bereits etablierten Änderungsflow.

## Sicherheitsgrenzen

- Die neue Ansicht schreibt keine Plan- oder Unterkunftsdaten.
- Die bestehenden Publish-Endpunkte wurden nicht verändert.
- Der veröffentlichte Plan bleibt die einzige Datenquelle der neuen Übersicht.
- Geschützte Fixpunkte werden nur lesend übernommen.
- Es wurde kein Deployment ausgelöst.
- Der externe Routingdienst wird nur vom Entwicklungsskript verwendet. Die App selbst lädt die erzeugte lokale GeoJSON-Datei und sendet zur Laufzeit keine Reise- oder Buchungsdaten an den Routingdienst.

## Datenbrücke

`reise-roadbook-2026.html` stellt einen eingefrorenen Read-only-Snapshot bereit. `assets/travel-model.js` überführt diesen in `Trip`, `PlanRevision`, `Stage`, `RouteVariant`, `Stay`, `AccommodationOption`, `Booking`, `FixPoint`, `NarrativeSegment` und `PublishedRelease`.

Der Import prüft die Parität zwischen den 30 bestehenden Reisetagen und den 30 erzeugten Etappen. Tagesnummern dienen nur der Anzeige; Beziehungen verwenden stabile IDs.

`scripts/generate-roadbook-routes.js` reproduziert `assets/roadbook-routes.geojson` aus den KML-Ankern. Dabei werden optionale Zusatzrunden von der Hauptlinie getrennt, Ortsanker ohne Wendeschleifen passiert und die portablen Exporte `reiseplanung-verfeinert-2026-export.kml` sowie `reiseplanung-verfeinert-2026.gpx` erzeugt. Übersicht und Roadbook filtern daraus dieselben `original`-Geometrien; nur eine ausdrücklich gewählte Routenvorschau blendet die passende `direct`-Variante ein.

Der Heimweg von Aosta nach Berikon verwendet Martigny und Lausanne als Korridor. Der zuvor irrtümlich gesetzte Sion-Anker wurde entfernt, damit die Route keinen Hin-und-zurück-Abstecher mehr enthält.

## Nächster Integrationsschritt

Nach visueller Freigabe kann das generische Modell schrittweise zur gemeinsamen Leseschicht für Roadbook und Unterkünfte werden. Schreibende Änderungen, neue Reisen und die Veröffentlichung neuer Revisionen bleiben davon getrennte, ausdrücklich freizugebende Schritte.
