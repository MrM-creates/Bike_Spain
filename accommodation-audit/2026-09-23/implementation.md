# Unterkunftswechsel – Umsetzung

Die Roadbook-App zeigt Reisenden die aktuell relevante Unterkunft und führt zur richtigen Adresse. Die Admin-App pflegt dieselben Unterkunftsoptionen und deren Lage.

## Oberfläche
Bestehende Bereiche Reiseübersicht, Etappen, Tagebuch und Einstellungen bleiben. In der Etappe stehen Hotelname, eigener Status und eine Aktion „Buchungsstatus ändern“ oben. Weitere Optionen erscheinen unter „Details & Alternativen“. Pro Hotel: Offen, Angefragt, Gebucht, Nicht verfügbar. Alle nicht verfügbar: „Neue Unterkunft nötig“. Statusauswahl und Speichern bleiben getrennt. Eine zweite gleichzeitige Buchung wird nicht stillschweigend aufgehoben.

Bestehende Schrift, Farben, Abstände, Formulare und mobile Aufteilung werden weiterverwendet. Statusänderungen erhalten Textfeedback; Fehler nennen Grund und nächste Handlung. Native Dynamic Type, VoiceOver und Web-Labels bleiben nutzbar. Keine neue Hauptnavigation, keine zusätzliche dekorative Animation.

## Daten und Route
Stabile Options-IDs; alte Status gehören bei der Migration zur bisherigen ersten Wahl. Eine gebuchte Option ist aktiv, sonst die erste nicht als nicht verfügbar markierte Option. Bis zu 20 Optionen pro Aufenthalt. Ein Hotelwechsel betrifft Ankunft, Aufenthaltsnächte und Abfahrt, keine Fährkabine. Fehlende eindeutige Lage oder fehlgeschlagene Berechnung bleibt als offen erkennbar; Buchungsstatus wird dennoch gespeichert. Keine stillschweigende Übernahme einer alten Kartenlinie.

Der bestehende geprüfte Mittelteil einer Route bleibt geometrisch erhalten. Der Routingdienst berechnet nur die örtliche Zu-/Abfahrt. Google-Links behalten ihre Zwischenpunkte und Vermeidungsparameter; die Straßenwahl in Google bleibt dessen Berechnung. Distanzen und Zeiten sind Schätzwerte. Änderungen am ganzen Reiseverlauf bleiben beim Planungsprozess.
