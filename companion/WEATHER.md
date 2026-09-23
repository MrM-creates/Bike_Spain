# Wetter pro Etappe

## Zweck und Oberfläche
Roadbook zeigt unterwegs das Wetter für den geplanten Reisetag. In der bestehenden Tagesansicht steht unter der Karte eine kompakte, aufklappbare Wetterzeile. Navigation bleibt die primäre Aktion. Details zeigen Start, einen Punkt auf halber Streckenlänge und Ziel; am Ruhetag nur den Aufenthaltsort. Fähren erhalten getrennte Angaben für Abfahrt und Ankunft am Folgetag, keine Seewetterprognose.

Native Listen, Schriftgrössen, Abstände und die bestehende grüne Akzentfarbe bleiben erhalten. Symbole ergänzen Text; Informationen hängen nicht von Farbe ab. Die Zusammenfassung darf bei grosser Schrift umbrechen. Details sind auf iPhone und iPad gleich bedienbar. VoiceOver liest Einheiten und Beschriftungen mit. Wetter lässt sich in den Einstellungen ausschalten.

## Bedeutung der Angaben
09–18 Uhr Ortszeit ist ein ausdrücklich genanntes Tagesfenster, keine geschätzte Ankunftszeit. Die Temperaturspanne, höchste stündliche Niederschlagswahrscheinlichkeit und stärkste Böe beziehen sich auf die abgefragten Punkte und Stunden, nicht auf eine flächendeckende Streckenprognose. Fehlende Böen bleiben unbekannt. Beide vorhandenen Reisen verlaufen in der mitteleuropäischen Zeitzone; diese ist ausdrücklich Teil der Wetteranfrage. Entfernte Tage zeigen „Vorhersage noch nicht verfügbar“, vergangene Tage keine neue Prognose.

## Daten und Aktualisierung
Apple WeatherKit liefert stündliche Vorhersagen. Beim Öffnen der App und bei wiederhergestellter Verbindung werden erreichbare Etappen innerhalb der nächsten zehn Tage geladen. Eine frische Antwort gilt höchstens eine Stunde bzw. bis zum Ablaufdatum des Anbieters. Fehlversuche werden gedrosselt; ein Verbindungswechsel erlaubt einen neuen Versuch. Kein Hintergrundversprechen bei geschlossener App.

Der eigene lokale Wettercache enthält Datum, Route, Messpunkte, Abrufzeit und Quellenangabe. Eine geänderte Route oder ein geändertes Datum hat einen anderen Schlüssel. Ein Fehler überschreibt keine gespeicherten Vorhersagen. Veraltete Werte werden als solche gekennzeichnet. Der Cache ist vom Tagebuch und vom veröffentlichten Reiseplan getrennt. An Apple gehen nur die geplanten Wetterpunkte, kein Geräte-GPS, kein Tagebuch und keine Buchungsdaten. Apple-Weather-Quellenhinweis bleibt auch eingeklappt sichtbar.

## Prüfung
Datumsgrenzen, Sommerzeit, Fähre, Ruhetag, Streckenmittelpunkt, Cache-Gültigkeit und unvollständige Antworten werden unabhängig von Apple geprüft. UI-Tests verwenden ausdrücklich isolierte Testdaten; ein tatsächlicher WeatherKit-Abruf und eine signierte Build-Prüfung werden getrennt protokolliert.

### Prüfstand 18. September 2026

- Swift-Prüfung bestanden: alle 60 Etappen, stabile Schlüssel, geänderte Route/Datum, Streckenlängen-Mittelpunkt, Ruhetag, beide Fähren, Vorhersagegrenze, Sommerzeitwechsel, fehlende Böen, Ablauf und JSON-Rücklesen des Caches.
- Drei Wetterabläufe auf iPhone 17 Pro und iPad Pro 11 bestanden: Details/Tageswechsel, gespeicherte veraltete Offline-Daten und noch nicht verfügbare Fährprognose mit korrektem Ankunftsdatum.
- Ausschalten in den Einstellungen auf dem iPhone bestanden. Der erste automatisierte Tipp traf die breite Schalterbeschriftung; der Test betätigt jetzt gezielt den sichtbaren Schalter.
- Endgültige iPad-Ausrichtung und aktualisierte Niederschlagsbeschriftung nochmals geprüft; Screenshots in den jeweiligen xcresult-Dateien.
- WeatherKit-Capability und App Service im Apple-Entwicklerkonto mit ausdrücklicher Nutzerfreigabe aktiviert.
- **Echter WeatherKit-Abruf bestanden:** Nach ausdrücklicher Nutzerfreigabe („ja, bitte senden“) wurden die geplanten Wetterpunkte und Reisetage an Apple übermittelt. `WeatherLiveUITests/testAppleForecastAndOfflineRelaunch` hat am 18. September um 11:13 Uhr den echten Abruf und das Rücklesen nach einem Neustart ohne Netzwerk bestanden (35,321 s). Die Ansicht zeigte eine vollständig verfügbare Vorhersage mit 2 % maximaler Niederschlagswahrscheinlichkeit und Böen bis 20 km/h; keine Testvorhersage. Beleg: `companion/.build/weather21-live-final.xcresult`.
- Release 0.1.0 (21), reguläres Xcode 27A266a / iPhoneOS 27.0, Archiv und App-Store-Export bestanden. Signatur geprüft, WeatherKit-Berechtigung vorhanden, CloudKit weiter nur `iCloud.com.mrm.roadbook` / Production, keine Wetter-Testschalter im Release.
- Upload nach TestFlight am 18. September um 11:16 Uhr Europe/Zurich erfolgreich. Apple-Verarbeitung abgeschlossen, Build-ID `ec3a5d40-a323-4104-aa4d-1a1c4d2e01d8`; deutsche Testhinweise und unveränderte Verschlüsselungsangabe gespeichert. Nach ausdrücklich erteilter Freigabe beiden bisherigen Gruppen zugeordnet und automatische TestFlight-Benachrichtigung aktiviert. **Build 21 in beiden Gruppen einzeln als „Im Test“ mit 90 Tagen Laufzeit verifiziert.** Installation bzw. tatsächlicher Empfang der Benachrichtigung auf den Geräten nicht separat geprüft.

Verbindliches Paket: `companion/.build/weather21-ready/export/Roadbook.ipa`.
Archiv: `companion/.build/weather21-ready/Roadbook.xcarchive`.
SHA-256: `79a160928d12178b79cd84706774d51e9d0b7e54c65ccf0516e3b4f6cec0f6ff`.

Die älteren Zwischenstände unter `weather21` und `weather21-final` sind keine Verteilungskandidaten.
