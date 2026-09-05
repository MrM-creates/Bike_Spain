# Navigationsübergabe – Vertrag

## Zweck
Unterwegs die geprüften Wegpunkte einer Tagesetappe vollständig an Google Maps übergeben. Die App bleibt ein lesbares Roadbook, kein eigener Navigator. Planung und Änderungen bleiben in der Web-App; private Erinnerungen sind unberührt.

## Struktur
Roadbook → Reise → Tag bleibt unverändert, daneben Mein Tagebuch und Einstellungen. Keine neue Hauptnavigation. Die grosse Tageskarte und der bestehende Kopf bleiben oben. Direkt darunter steht Navigation; danach folgen Hinweise, Unterkunft und Tagebuch.

## Layout und Sprache
Eine kurze Etappe behält „Route in Google Maps öffnen“. Mehrteilige Etappen zeigen zuerst „Abschnitt 1 … öffnen“ und die weiteren nummerierten Abschnitte aufklappbar. Jeder Abschnitt nennt sein tatsächliches Zwischenziel, der letzte die Unterkunft oder den Hafen. Erläuterung: Abschnitte der Reihe nach öffnen; Google berechnet zwischen Wegpunkten neu. Keine Garantie für Offline-Navigation oder unveränderlichen Strassenverlauf.

## Gestaltung und Interaktion
Bestehendes Grün, Systemschrift/Dynamic Type, vorhandene Listenabstände und native DisclosureGroups wiederverwenden. Kein neues Farbsystem, keine dekorative Animation. Öffnen erfolgt nur auf Tippen. Kein automatischer Start des nächsten Abschnitts und kein angeblich erkannter Fortschritt. Tageswechsel setzt aufklappbare Bereiche wie bisher zurück.

## Responsive und Accessibility
Dieselbe Reihenfolge auf iPhone und iPad, mehrzeilige Zielnamen, mindestens 44-Punkt-Aktionen, Text plus Symbol und eindeutige VoiceOver-Beschriftung „Abschnitt N von M …“. Keine horizontale Schrittleiste, die bei grosser Schrift abgeschnitten wird.

## Datenvertrag und Abnahme
Teilungen werden ausdrücklich in der Reiseplanung festgelegt, ausschliesslich an geeigneten Haltepunkten. Kein automatisches Aufteilen an beliebigen Strassen- oder Tunnelankern. Die Teile müssen zusammen exakt dieselben geordneten Wegpunkte wie der Gesamtlink enthalten, ohne Lücke und ohne zusätzliches Ziel. Höchstens drei Zwischenpunkte je Teil für die konservative mobile Übergabe. Fähren verwenden nur den vorhandenen Land-Anfahrtslink. Unpassende Teilungen werden beim Export abgelehnt, nicht still korrigiert. Alte Feeds ohne Teilungen bleiben lesbar.

Tests: Reihenfolge, Auslassungen, doppelte Punkte, falsche Ziele, Ruhetage und Fähren; Swift-Decodierung alter/neuer Feeds; sichtbare Bedienung auf Simulator. Ein bestandener Simulator- oder Browsercheck ersetzt weder Google-Maps-App- noch Offline-Abnahme auf dem tatsächlichen Telefon.
