# Balkan-Routenkorrektur vom 7. September 2026

Planversion: `2026-09-07T17:18:38.159Z`. Führende Quelle bleibt das Motorrad-Roadbook auf GitHub/Vercel. Roadbook 0.1.0 (11) lädt diese Daten bereits über den bestehenden Feed; für diese Datenkorrektur ist kein neuer TestFlight-Build erforderlich.

Alle 18 Fahretappen wurden im korrigierten Web-Entwurf über ihre tatsächlichen Maps-Schaltflächen geöffnet, Tag 25 mit beiden Abschnitten. Start, Ziel und sämtliche Zwischenpunkte kamen in der vorgesehenen Reihenfolge an. 17 beobachtete Strassenfolgen stimmen überein. Das ist kein Nachweis der Befahrbarkeit am Reisetag und keine abgeschlossene native Geräteprüfung.

Tag 30 bleibt über Gotthardtunnel/Axen/A4 geplant. Google wich im A4-Bereich Küssnacht/Cham ab. Eine temporäre Sperre ist als Ursache nicht bestätigt. Der Nutzer kennt den Heimweg und hat diese bekannte Abweichung als nicht blockierend akzeptiert. Tag 30 wird ausdrücklich nicht als bestandener Strassenabgleich ausgewiesen; ein Hinweis steht im Reiseplan.

Korrigiert wurden Strassenlisten, Zufahrten, Kartenlinien und Entfernungen an den Tagen 3, 5, 8, 10, 13, 22, 24, 25, 27 und 29. Die Maps-Hauptlinks ändern sich an 5, 22, 25 und 27. Tag 25 enthält vier Zwischenpunkte und wird am Parkplatz Comacchio in zwei lückenlose Abschnitte geteilt. Web und Companion-Feed verwenden denselben geprüften Teiler. Alle übrigen Links sowie Kalender, Unterkünfte, Fixtermine und Ruhetage bleiben erhalten.

Der Feed unterstützt optional `?tripId=trip_adria_2026`, damit die veröffentlichte Balkanreise isoliert geprüft werden kann. Ohne Parameter lädt Roadbook weiterhin wie bisher seine Reisepläne. Unbekannte oder mehrfache Reise-IDs werden abgewiesen. Andere Reisedaten wurden bei der Vorbereitung unverändert erhalten.

Geprüft: 14 gezielte Node-Tests für Balkan-Daten, Web-/Feed-Übergabe, Kartenbindung, Abschnittsgrenzen und Parameterprüfung; Swift-Dekodierung, Validierung und JSON-Roundtrip mit dem ausgelieferten Planmodell. Native Google-Maps-Aufrufe aus der aktualisierten Roadbook-App sind separat ausstehend.

Das ausführliche lokale Prüfprotokoll liegt unter `route-audit/2026-09-07/web-handoff-check/README.md`; der eingefrorene Entwurf bleibt als historische Evidenz erhalten. Veröffentlichung bedeutet keine nachträgliche Umdeutung der früheren Prüfungen.
