# Berechnete Balkan-Fahrzeiten statt Planungsschätzungen

Planversion: 2026-09-10T09:58:35.540Z. Führende Quelle ist das Motorrad-Roadbook.

Alle 18 Fahrtage verwenden die Dauer der jeweiligen gespeicherten OSRM-Routenberechnung, auf die nächste volle Minute gerundet. Es gibt keine pauschalen Zuschläge oder eingerechneten Pausen. Bei Tag 21 zählt ausschliesslich die Landzufahrt nach Split. Die Zeitgrenze wird auf die ungerundete berechnete Fahrzeit angewandt.

Die Zahlen in den Tagesbeschreibungen wurden synchronisiert und alte pauschale Gesamtunterwegszeiten entfernt. Die Rahmenbedingungen entsprechen der Klarstellung des Nutzers vom 10. September. Strassenverläufe, Maps-Links und ihre 20 Abschnitte, Unterkünfte, Fixtermine und Ruhetage sind unverändert. Andere Reisedaten wurden unverändert erhalten.

## Fahrzeiten

| Tag | Etappe | Bisherige Anzeige | Berechnete Fahrzeit |
|---|---|---|---|
| 1 | Berikon – Arlbergtunnel – Innsbruck | ca. 4 h 30 | ca. 3 h 39 |
| 2 | Innsbruck – Pustertal – Lienz | ca. 3 h 30 | ca. 2 h 40 |
| 3 | Lienz – Drautal – Wörthersee – Graz | ca. 4 h 15 | ca. 3 h 38 |
| 4 | Graz – Maribor – Ljubljana | ca. 2 h 45 | ca. 2 h 06 |
| 5 | Ljubljana – Postojna – Rijeka – Senj | ca. 3 h 15 | ca. 2 h 51 |
| 6 | Senj – Karlobag – Starigrad – Zadar | ca. 3 h 30 | ca. 3 h 16 |
| 8 | Zadar – Biograd – Vodice – Šibenik | ca. 1 h 45 | ca. 1 h 39 |
| 10 | Šibenik – Primošten – Trogir – Omiš – Makarska | ca. 4 h | ca. 2 h 47 |
| 13 | Makarska – Drvenik – Pelješac-Brücke – Ston – Dubrovnik | ca. 4 h | ca. 3 h 10 |
| 16 | Dubrovnik – Karasovići – Bucht von Kotor | ca. 3 h plus Grenze | ca. 2 h 03 |
| 20 | Kotor – Perast – Dubrovnik-Umfahrung – Ston | ca. 4 h plus Grenze | ca. 3 h 08 |
| 21 | Ston – Pelješac-Brücke – Split / Nachtfähre nach Ancona | ca. 3 h plus Check-in und Überfahrt | ca. 2 h 29 |
| 22 | Ancona – Fano – Furlo-Schlucht – Urbino | ca. 3 h | ca. 1 h 51 |
| 24 | Urbino – San Marino – Rimini – Ravenna | ca. 3 h 30 | ca. 2 h 54 |
| 25 | Ravenna – Comacchio – Ferrara – Colli Euganei | ca. 3 h | ca. 2 h 29 |
| 27 | Colli Euganei – Valeggio – Lago d’Iseo | ca. 3 h 15 | ca. 2 h 42 |
| 29 | Lago d’Iseo – Bergamo – Como | ca. 2 h 30 | ca. 1 h 23 |
| 30 | Como – Gotthardtunnel – Berikon | ca. 3 h 15 | ca. 2 h 58 |

## Übernahme durch die Roadbook-App

Der bestehende Endpunkt /api/companion-plan übernimmt die Zeiten und Notizen aus data/trip-adria-2026.js. Die installierte App lädt den Feed beim Start und über die Schaltfläche zum Aktualisieren, prüft die Planversion und speichert den neuen Stand offline. Ein neuer TestFlight-Build ist nicht erforderlich. Die mitgelieferte Ressource im Repository wurde ebenfalls aus dem Balkan-Feed aktualisiert.

## Prüfung vor Veröffentlichung

- Neun gezielte Node-Tests bestanden: exakte Zeitübereinstimmung zur Routenberechnung, Web-Modell, nativer Feed, Offline-Ressource, Kalender und Maps-Abschnitte.
- Gegen den vorigen Git-Stand geprüft: Alle Routenfelder und Geometrien, Maps-Links, Unterkünfte und Fixtermine unverändert; beim nativen Feed ändern sich nur Version, Fahrzeiten und Notizen.
- Der neue Synchronisationsschritt scripts/sync-balkan-durations.js erzeugt bei unveränderten Daten keine weitere Änderung.
- Keine neue Google-Maps- oder Geräteprüfung: Die vorhandenen Linien werden weder neu berechnet noch verändert. Google bleibt eine unabhängige zeitabhängige Gegenprüfung.
