# Etappenanimationen

## Zweck und Bedienung

Roadbook begleitet die Reise und hält Erinnerungen fest. Vorbereitete, kleine
Etappenvideos sollen ohne Renderarbeit auf dem iPhone gespeichert, offline
angesehen und über das iOS-Teilen-Menü weitergegeben werden.

Drei Hauptbereiche: Reisen, Mein Tagebuch, Etappenanimationen. Die bestehenden
nativen Listen, Systemschrift und grünen Akzentfarben bleiben erhalten.
Unter Etappenanimationen stehen Datum, Route, Dateigrösse und Downloadstatus. Die
Detailansicht hat abhängig vom Zustand eine primäre Aktion: Laden
oder Video teilen. Mehrfachauswahl erscheint erst nach „Auswählen“; Downloads
laufen nacheinander. Einzelne laufende oder wartende Downloads sind abbrechbar.
Gespeicherte Versionen sind zusätzlich unter „Downloads verwalten“ erreichbar.

Bedienungspräzisierung nach Gerätetest: kompakter, vollständiger Seitentitel
„Etappenanimationen“ auf iPhone und iPad; im Auswahlmodus bietet die untere
Aktionsfläche „Alle auswählen“ bzw. „Auswahl aufheben“. Nur sichtbare Etappen
mit verfügbarem Video sind auswählbar. Der Sammeldownload überspringt bereits
geladene Videos. Zustände werden als „Noch nicht geladen“, „Wird geladen …“,
„Wartet auf Download“ und „Geladen“ ausgeschrieben. Kein zusätzliches
Häkchensymbol für den Downloadstatus; Auswahlhäkchen bezeichnen nur die Auswahl.
Listenstruktur, Farben, Systemschrift und native Übergänge bleiben erhalten.
Die untere Aktionsfläche passt sich bei grosser Schrift vertikal an; Aktionen
haben semantische Beschriftungen. Der Download bleibt die primäre Aktion.

Ein Tagebucheintrag verweist über Reise- und Etappen-ID auf dieselbe lokale
Videodatei. Das Tagebuch enthält keine zweite Kopie. Gemeinsames Teilen von
Text, Fotos und Video ist bewusst eine spätere Erweiterung.

Systemschriften, semantische Beschriftungen, zugängliche Fortschrittsanzeige,
keine automatische Wiedergabe. Auf dem iPad ist die Videohöhe begrenzt. Die
normale iOS-Teilen-Ansicht übernimmt Empfänger-/App-Auswahl. Ein Test öffnet
nur diese Ansicht und sendet niemals selbst Nachrichten.

## Daten und Speicher

- Die App enthält nur den kleinen Katalog `Resources/animations.json`, keine Filme.
- Online-Katalog: `/animations/catalog.json` auf dem vorhandenen Roadbook-Host.
- MP4-Dateien: unveränderliche URLs unter `/animations/media/` mit Inhaltshash.
- Lokal: Application Support/StageAnimations, vom Gerätebackup ausgeschlossen.
- SHA-256, exakte Dateigrösse, erlaubter HTTPS-Host und Abspielbarkeit werden vor
  dem Eintragen eines Downloads überprüft. Unvollständige Dateien sind unsichtbar.
- Nach einem Prozessabbruch werden zurückgelassene temporäre Downloads entfernt.
- Die Dateiendung `.mp4` wird bereits für die AVFoundation-Prüfung verwendet;
  URLSession-Temporärdateien ohne passende Endung wurden vom Simulator abgelehnt.
- Reiseplan-/Routenfingerprints binden ein Video an genau die passende Etappe.
  Ein früherer Download bleibt bei Planänderungen verfügbar und wird entsprechend
  gekennzeichnet. Neue Videos überschreiben keine persönlichen Erinnerungen.
- Löschen betrifft ausschliesslich den ausgewählten Videodownload.
- Der Metadatenkatalog wird beim Öffnen des Bereichs und durch Ziehen aktualisiert.
  Verbindungsfehler beeinflussen vorhandene lokale Videos nicht.
- Downloads laufen im aktiven App-Prozess. Ein garantierter Hintergrunddownload
  oder Fortsetzen nach Beenden der App wird in dieser Version nicht zugesagt.

## Filmformat und Karten

HEVC/H.265 in MP4 (`hvc1`), 720 × 960 Pixel, 60 Bilder/s, 32 Sekunden.
Die Bildfolge verwendet Original-Routenkoordinaten; die Markerposition wird
nicht auf eine vereinfachte oder geglättete Ersatzroute verschoben.

Die ersten Apple-MapKit-Prototypen bleiben lokale Vergleichsartefakte.
Apples Developer Agreement, Schedule 6 §2.5, begrenzt das dauerhafte Speichern
von Map Data: https://developer.apple.com/support/terms/apple-developer-program-license-agreement/
Für die dauerhaft angebotene Serie wird daher OpenFreeMap verwendet.
OpenFreeMap nennt Videos ausdrücklich als erlaubte Darstellung mit Attribution:
https://openfreemap.org/#attribution

Quellenangabe bleibt in jedem Videobild sichtbar:
OpenFreeMap · © OpenMapTiles · © OpenStreetMap.
Kartenstil: Liberty, mit angepasster Wasserfarbe und ausgeblendeten POIs.
Die ursprüngliche Natural-Earth-Reliefalternative wurde nur verglichen und
wegen der zu geringen lokalen Detailauflösung nicht für die Serie gewählt.

## Prüfung

- App-Build für iOS Simulator erfolgreich.
- iPhone: einzelne Videos herunterladen, offline neu starten, Teilen-Menü öffnen,
  Download löschen und beschädigten Transfer ablehnen: bestanden.
- Mehrfachdownload-/Auswahlprüfung wird pro Etappen-ID ausgewertet, damit zwei
  Accessibility-Knoten eines einzelnen Status nicht als zwei Downloads zählen.
- Tagebucheintrag mit zugeordneter Etappe öffnet den vorhandenen Download ohne
  erneute Übertragung: auf dem iPhone bestanden.
- iPad Pro 13: Download, Offline-Neustart, Teilen-Menü und Löschen bestanden.
- Abbrechen und anschliessendes erneutes Herunterladen: auf dem iPhone bestanden.
- Release-Build für ein echtes iOS-Gerät ohne Debug-Testhilfen bestanden.
- Reine Swift-Prüfung: Python-/Swift-Routenfingerprints, Metadatengrenzen,
  erlaubter Host, doppelte IDs und Erkennung geänderter Videobytes bestanden.
- Lokale Transportfixtures unter AnimationPreview/download-test sind synthetisch:
  Sie verwenden dieselbe Testdatei für zwei Etappen und dürfen nie veröffentlicht
  oder in die App als Produktivkatalog übernommen werden.

## Erzeugung der Serie

`AnimationPreview/Batch/prepare.py` erzeugt Kamerapositionen und Routenbindungen.
Die Karten werden mit dem dort erzeugten `capture.js` auf der eigenen
MapLibre-Fläche aufgenommen. `countries.py` ergänzt die Landeswechsel;
`render.py` erzeugt den Film einer Etappe, `finalize.py` prüft die vollständige
Serie und schreibt den Online-Katalog sowie die identische kleine App-Ressource.
Benötigt werden Python mit NumPy, Pillow und Shapely sowie ffmpeg mit libx265.

Die Kamera beginnt bei der gesamten Reise und fährt zur Tagesetappe. Ein neuer
Kartenmassstab wird erst eingeblendet, wenn er das gesamte Bild abdeckt, damit
keine rechteckigen Kanten oder angeschnittenen Beschriftungen entstehen.
Die Motorradposition verwendet jeden Originalpunkt. Kamerabewegung und Tempo
sind separat geglättet. Alle 18 Etappen wurden auf sichtbare Markerpositionen
geprüft; auch die Landeswechsel-Banner verdecken das Fahrzeug nicht.

Sehr kurze A–B–A-Abweichungen unter 150 m an unscharfen Grenzdaten werden nur
bei den Einblendungen unterdrückt; die Routenkoordinaten bleiben unverändert.
So bleibt der echte San-Marino-Besuch sichtbar, ein 47-m-Datenartefakt dagegen
erzeugt keinen zweiten Besuch. Nahe Landeswechsel wie Liechtenstein–Österreich
erhalten eine gemeinsame lesbare Einblendung. Der Fährtag wechselt zum Schiff
und nennt Ancona mit dem Ankunftsdatum 15. Oktober.

Die Filme enthalten die Quellenangabe; `animations/credits.html` verlinkt
Karten- und Grenzdatenquellen. Die App verlinkt diese Seite unter „Kartenquellen“.

Die neue Funktion ist seit dem 18. September 2026 mit TestFlight-Build 22
für die bestehenden Gruppen „Roadbook – eigener Gerätetest“ und
„Roadbook – Anna“ verfügbar. Aktuell ist das Bedienungsupdate Build 23 verteilt.

## Abschlussstand 18. September 2026

### Bedienungsupdate Build 23

- Bereich in „Etappenanimationen“ umbenannt; Alle auswählen/Auswahl aufheben,
  ausgeschriebene Ladezustände ohne zusätzliches Download-Häkchen.
- iPhone: Sammelauswahl einschliesslich nicht verfügbarer Etappen,
  Auswahl aufheben, Teil- zu Gesamtauswahl, beide Downloads, bereits geladene
  Videos überspringen, Teilen sowie Einzel-Download/Offline-Neustart/Löschen:
  zwei gezielte UI-Tests bestanden. iPad: Sammelauswahl/Download/Teilen bestanden.
- Screenshots auf beiden Geräten geprüft. Keine Änderung am Speicherformat,
  am Videospeicherpfad, am Katalog oder an persönlichen Tagebuchdaten.
- Signierter App-Store-Export: 4.977.041 Bytes, keine eingebetteten Videos;
  strenge Signaturprüfung bestanden. Production-CloudKit weiterhin ausschliesslich
  `iCloud.com.mrm.roadbook`; WeatherKit unverändert.
- IPA-SHA256: `860dc7ac99b443a50f7a6e87ae87da8b38fcf48a19104d783be7e7f4bf95e8cb`.
  Artefakte und Protokolle: `companion/.build/animation23-ready/`.
- Upload am 18. September um 14:19:53 Uhr Europe/Zurich erfolgreich.
  Build-ID `aae43f70-f940-40a7-a5e1-2f73c2727136`. Deutsche Testhinweise und
  unveränderte Verschlüsselungsangabe gespeichert; beide bestehenden Gruppen
  zeigen 0.1.0 (23) als „Im Test“, 90 Tage Restlaufzeit. Automatische
  TestFlight-Benachrichtigung aktiviert; tatsächlichen Empfang nicht geprüft.

### Erstverteilung Build 22

- Alle 18 Fahrtage veröffentlicht: 82.839.234 Bytes insgesamt, 2.981.485 bis
  7.321.719 Bytes pro Film. Jeweils HEVC/hvc1, 720 × 960, 60 fps, 1920 Bilder,
  32 Sekunden und kein Audiostream. Der Katalog umfasst 10.898 Bytes.
- Alle Routenbindungen auch unabhängig mit Swift gegen den aktuellen Reiseplan
  geprüft; Videogrösse und SHA-256 stimmen für alle 18 Dateien.
- Server-Commit `2c09a2205821e27c784905949e119805f38dd115`, Vercel-Deployment
  `dpl_B5v1zwgjXsD1p7pv69rH5Yrvn8p4`, Status READY / Production.
- Alle 18 öffentlichen Video-Adressen liefern MP4 und korrekte HTTP-206-
  Teilantworten. Unveränderliche Video-URLs werden langfristig gecacht; der
  Katalog wird neu validiert. Quellenangaben erreichbar, beide Reisepläne
  nach der Veröffentlichung unverändert.
- Echter Download von Tag 1 mit dem finalen Build 22 und anschliessender
  Offline-Neustart bestanden (28,85 Sekunden, keine Fehler).
  Beleg: `/tmp/Roadbook-Animation22-Live.xcresult`.
- Signiertes Archiv und lokaler App-Store-Export von 0.1.0 (22) bestanden.
  IPA: 4.969.400 Bytes, keine eingebetteten Videos. iCloud weiterhin nur
  `iCloud.com.mrm.roadbook` / Production; WeatherKit-Berechtigung unverändert.
- Verbindliches Paket: `companion/.build/animation22-ready/export/Roadbook.ipa`.
  SHA-256: `4c26d98b003c5ae950e33cc05538e2a772541240382971cca274cb2e83f97e9c`.
  Quellenmanifest, Paketprüfung, Protokolle und iPhone-Bild liegen daneben.
- Upload zu Apple am 18. September 2026 um 13:56 Uhr (Europe/Zurich) erfolgreich.
  App-Store-Connect-Build-ID: `68b8dc6b-6cf0-4dad-9b4d-51edae49a27b`.
  Deutsche Testhinweise und Verschlüsselungsauskunft gespeichert.
  Beide bestehenden Testgruppen zeigen für 0.1.0 (22) „Im Test“ und
  90 Tage Restlaufzeit. Installation auf den persönlichen Geräten und
  Empfang einer Benachrichtigung wurden nicht geprüft.
