# Prüfung der Unterkunftsanpassung

Stand: 23. September 2026. Freigabe von Web/Backend und TestFlight-Build 24 wird in release.md dokumentiert.

## Datenübernahme

Ausgangspunkt ist der aktuelle veröffentlichte Stand 8ae1d80 mit der Holunderhof-Buchung. Bestehende Buchungen, Reisedaten, originale Tage und bereits geprüfte Tagesnavigation bleiben erhalten. Schlossberghof ist laut Nutzer nicht verfügbar. Die früheren Prüfungen vom 03., 04. und 10. September bleiben gültige historische Befunde; es wurde keine neue allgemeine Verfügbarkeitsprüfung behauptet.

Die bisherigen Erstwahl-Ziele werden als geprüfte Navigationsbasis übernommen. Ein Statuswechsel am selben Hotel verändert diese Basis nicht. Makarska bleibt ausdrücklich am festen Orientierungspunkt INA Makarska-Ratac, Vukovarska 135; dieser wird nicht zur Hoteladresse umgedeutet. Die Standortbelege für Ergänzungen stehen in data/accommodation-locations.json.

14 der 16 bestehenden Land-Alternativen haben einen öffentlich überprüfbaren Standort. Für Miss Mia in Dubrovnik und Bright & Elegant in Kotor wurde kein ausreichend eindeutiger genauer Standort übernommen. Wird eine dieser Alternativen gewählt, bleibt die Buchung gespeichert; die genaue Lage muss vor der automatischen Routenanpassung ergänzt werden. Die bestehenden Erstwahl-Routen sind davon nicht betroffen.

## Prüfung

- 89 Node-Prüfungen bestanden, einschliesslich Migration, Erhalt aktueller Buchungen, wiederholter Migration, festem Makarska-Punkt, eigener Status je Hotel, Priorität gebuchter/verfügbarer Optionen, Buchungskonflikten, konkurrierenden Änderungen, API-Speicherung, ausstehender Route und Wiederholung.
- Online-Prüfung der 14 Alternativen in isolierten Plankopien: 26 An-/Abfahrtanpassungen erfolgreich; Makarska bleibt unverändert. Nutzerfreigabe für Koordinatenübertragung an OSRM liegt vor. Keine echte Buchung geändert. Ergebnisse: live-access-check.json.
- Admin-Oberfläche: Holunderhof als aktuelle gebuchte Unterkunft, Schlossberghof unter Details als nicht verfügbar; Standorte und eigene Status im Editor vorhanden.
- Vorheriger vollständiger Browserdurchlauf mit isoliertem Testserver: Alternative buchen, Veröffentlichung und automatische Aktualisierung erfolgreich.
- Vorheriger iPhone-Durchlauf: 8/8 Buchungstests bestanden; iPad-Unterkunftswechsel bestanden. Wiederholung mit endgültigem Startbestand in release.md.

## Grenzen

Nur örtliche Zu- und Abfahrten werden geändert. Die geprüfte mittlere Strecke und Google-Zwischenpunkte bleiben erhalten. Distanz und Fahrzeit sind Schätzwerte. Bei benannten Zwischenpunkten wird konservativ die bisherige Zufahrt beibehalten und die neue Verbindung angehängt. Google Maps berechnet beim Öffnen selbst; sein Verlauf kann von der angezeigten Linie abweichen.

Fehlende Lage, nicht passende Ausgangsroute oder Fehler beim Routendienst werden sichtbar als offen markiert. Veraltete Navigation wird dann nicht als aktuelle Route angeboten. Alte native Versionen lesen die aktuelle Unterkunft weiter, dürfen deren Status aber nicht über das alte pauschale Feld ändern.
