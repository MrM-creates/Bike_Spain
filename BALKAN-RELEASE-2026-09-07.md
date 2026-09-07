# Nachtrag: vollständige iPad-Prüfung und Tag-24-Korrektur

Neue Planversion: `2026-09-07T19:02:54.824Z` (7.9.2026, 21:02 Zürich).

Der Datenstand 19:18 wurde auf dem iPad mit Roadbook 0.1.0 (11) über alle 19 tatsächlichen Maps-Schaltflächen der 18 Balkan-Fahrtage geprüft. Start, Ziel, alle gelieferten Koordinaten und ihre Reihenfolge stimmen. Alle Teilstrecken der nativen Strassenanweisungen wurden aufgeklappt und erfasst. 15 Strassenfolgen stimmen mit dem Roadbook überein; drei Abweichungen wurden festgestellt:

- Tag 4: aktuelle A1-Nachtsperre Slovenske Konjice–Dramlje, von Promet.si für den Prüfzeitpunkt bestätigt. Kein Nachweis derselben Sperre am Reisetag 27. September; der geplante A1-Verlauf bleibt bestehen.
- Tag 24: Der Covignano-Punkt war nur in der Kartenlinie vorhanden. Nach seiner Ergänzung wählte Maps zeitweise die A14 nach Ravenna. Die Maps-Übergabe enthält deshalb jetzt auch Strassenpunkte auf der geplanten SS16 und Via Darsena. Beide korrigierten URLs wurden vor der Veröffentlichung direkt in der nativen Maps-App geprüft: Covignano, SS16 und Ravenna-Zufahrt stimmen. Zwei Abschnitte treffen sich lückenlos am ohnehin vorgesehenen Tiberio-Parkplatz. Kein zusätzlicher Besuch, keine neue Kartenlinie.
- Tag 30: Google fährt aktuell über A2/A14 statt Axen und weicht bei Rotkreuz von der A4 ab. Die bekannte Heimweg-Abweichung bleibt vom Nutzer akzeptiert; dieser Tag wird nicht als übereinstimmend bezeichnet.

Nur der Maps-Verlauf von Tag 24 wurde geändert. Die veralteten Hinweise auf eine noch nicht erfolgte native Prüfung wurden aus den Balkan-Tagestexten entfernt. Andere Routen, Termine, Unterkünfte, Fahrzeitvorgaben und Geometrien bleiben erhalten. Die gemeinsame Datenquelle wird von Web und bestehender Roadbook-App geladen; kein neuer TestFlight-Build ist nötig.

Validierung vor Veröffentlichung: beide korrigierten Maps-URLs auf dem iPad, acht gezielte Node-Tests für Datenbindung, mobile Abschnitte, identische Web-/Feed-Übergabe und die drei Strassenpunkte auf der bestehenden Linie. Der abschliessende Aufruf der veröffentlichten Tag-24-Schaltflächen wird im lokalen [iPad-Prüfbericht](route-audit/2026-09-07/ipad-xctest/ALL-18-IPAD.md) dokumentiert. Die Prüfung belegt den beobachteten Strassenverlauf, keine exportierte Google-Polylinie oder Befahrbarkeit an einem zukünftigen Reisetag.

---

# Balkan-Routenkorrektur vom 7. September 2026

Planversion: `2026-09-07T17:18:38.159Z`. Führende Quelle bleibt das Motorrad-Roadbook auf GitHub/Vercel. Roadbook 0.1.0 (11) lädt diese Daten bereits über den bestehenden Feed; für diese Datenkorrektur ist kein neuer TestFlight-Build erforderlich.

Alle 18 Fahretappen wurden im korrigierten Web-Entwurf über ihre tatsächlichen Maps-Schaltflächen geöffnet, Tag 25 mit beiden Abschnitten. Start, Ziel und sämtliche Zwischenpunkte kamen in der vorgesehenen Reihenfolge an. 17 beobachtete Strassenfolgen stimmen überein. Das ist kein Nachweis der Befahrbarkeit am Reisetag und keine abgeschlossene native Geräteprüfung.

Tag 30 bleibt über Gotthardtunnel/Axen/A4 geplant. Google wich im A4-Bereich Küssnacht/Cham ab. Eine temporäre Sperre ist als Ursache nicht bestätigt. Der Nutzer kennt den Heimweg und hat diese bekannte Abweichung als nicht blockierend akzeptiert. Tag 30 wird ausdrücklich nicht als bestandener Strassenabgleich ausgewiesen; ein Hinweis steht im Reiseplan.

Korrigiert wurden Strassenlisten, Zufahrten, Kartenlinien und Entfernungen an den Tagen 3, 5, 8, 10, 13, 22, 24, 25, 27 und 29. Die Maps-Hauptlinks ändern sich an 5, 22, 25 und 27. Tag 25 enthält vier Zwischenpunkte und wird am Parkplatz Comacchio in zwei lückenlose Abschnitte geteilt. Web und Companion-Feed verwenden denselben geprüften Teiler. Alle übrigen Links sowie Kalender, Unterkünfte, Fixtermine und Ruhetage bleiben erhalten.

Der Feed unterstützt optional `?tripId=trip_adria_2026`, damit die veröffentlichte Balkanreise isoliert geprüft werden kann. Ohne Parameter lädt Roadbook weiterhin wie bisher seine Reisepläne. Unbekannte oder mehrfache Reise-IDs werden abgewiesen. Andere Reisedaten wurden bei der Vorbereitung unverändert erhalten.

Geprüft: 14 gezielte Node-Tests für Balkan-Daten, Web-/Feed-Übergabe, Kartenbindung, Abschnittsgrenzen und Parameterprüfung; Swift-Dekodierung, Validierung und JSON-Roundtrip mit dem ausgelieferten Planmodell. Native Google-Maps-Aufrufe aus der aktualisierten Roadbook-App sind separat ausstehend.

Das ausführliche lokale Prüfprotokoll liegt unter `route-audit/2026-09-07/web-handoff-check/README.md`; der eingefrorene Entwurf bleibt als historische Evidenz erhalten. Veröffentlichung bedeutet keine nachträgliche Umdeutung der früheren Prüfungen.
