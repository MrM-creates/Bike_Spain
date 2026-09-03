# Vollständige Streckenlinien · 3. September 2026

## Umfang

Gemeinsame Datenkorrektur für Admin-/Web-App und iPhone-/iPad-Begleitapp. Bestehende Reisepläne, Wegpunkte, Unterkünfte, Datumsangaben, Google-Maps-Links und persönliche Daten bleiben unverändert. Kein Wechsel des Kartenanbieters, keine Google-API oder neue Cloud-Konfiguration.

Die bisherigen Generatoren verwendeten OSRM `overview=simplified`. Neu: `overview=full`, maximal ein Request pro 1,1 Sekunden, 30 Sekunden Request-Timeout. Der Spanien-Generator entfernt keine vermeintlichen Rückwegschleifen mehr: Rundungen, Haarnadelkurven und Wegpunktzufahrten bleiben exakt wie vom Router geliefert. Fähren bleiben schematische Linien; beim Balkan-Fährtag wird die vollständige Hafenzufahrt separat übergeben.

## Vergleich

- Balkan: alle 18 Features mit exakt unveränderter Routendistanz und Routerfahrzeit; Start-/Endkoordinaten identisch. Vorher vorhandene Strassen-/Wegpunktnachweise unverändert, für weitere Etappen erstmals ebenfalls mitgeliefert.
- Balkan Tag 1: 33 → 7’576 Koordinaten bei unverändert 294’079,4 m. Insgesamt 78’465 Koordinaten inklusive schematischem Fährende.
- Spanien: alle 48 Features nach Name und Variante verglichen, inklusive optionaler Runde. Endpunkte unverändert, maximale Distanzänderung 175,9 m und maximale Zeitänderung 16,9 s. Es handelt sich um neu abgefragte Routerdaten, nicht nur um eine verlustfreie Rekonstruktion des alten Overviews. GPX/KML aus derselben vollständigen Geometrie erneuert.
- Kugelförmig gemessene Linienlänge weicht bei allen Strassenvarianten weniger als 0,5 % von der Routerdistanz ab. Strassenpunkte im Mittel weniger als 150 m auseinander. Diese Prüfungen schützen vor starker Vereinfachung und nachträglichem Löschen von Linienabschnitten.
- Vollständiger Companion-Feed: 4’499’751 Bytes, unter dem bisherigen 10-MB-Limit. Kein Segment überschreitet das bisherige 100’000-Punkte-Limit.

## Prüfung und Übergabe

Story: Reise/Tagesetappe öffnen → GeoJSON bzw. Companion-Feed laden → dieselbe vollständige Linie auf der jeweiligen Karte zeichnen.

- 43 Node-Tests erfolgreich (`/tmp/roadbook-full-geometry-tests.log`), darunter exakte Übereinstimmung Feed/GeoJSON, Fährtrennung, Invalidierung nach Routenänderung, bestehende Kontrollen für Arlbergtunnel, D8, Pelješac-Brücke und Furlo sowie neue Auflösungs-/Grössenregressionen.
- Native Swift-Planchecks gegen den erneuerten Startstand ausgeführt.
- Admin-App lokal: Übersicht und Tagesansicht geöffnet, D8 Tag 6 visuell geprüft, keine Browser-Fehler/Warnungen. Bestehender Loader lädt GeoJSON mit `cache: no-store`.
- Begleitapp akzeptiert aktualisierte Karten auch bei gleicher Reiseversion. Der veröffentlichte Feed wird beim App-Start oder über Einstellungen → Reisepläne aktualisieren geladen. Kein weiteres App-Binary für diese Kartendaten notwendig; lokaler gebündelter Startstand für spätere Builds ebenfalls erneuert.

## Grenzen

Eine vollständige OSRM-Strassenlinie ist kein Nachweis aktueller Befahrbarkeit, perfekter Übereinstimmung mit jedem Kartenanbieter oder eines identischen Google-Maps-Navigationsverlaufs. Google Maps berechnet den bestehenden Wegpunkt-Link selbst neu. Tagesaktuelle Sperren/Wetter und die endgültige Navigation bleiben gesondert zu prüfen. Keine neue vollständige Motorrad-/Verkehrsquellenrecherche in diesem Geometrie-Fix.

Technische Referenzen: https://project-osrm.org/docs/v5.22.0/api/#route-service ; Google-Routenergebnisse auf Karten: https://developers.google.com/maps/documentation/routes/policies
