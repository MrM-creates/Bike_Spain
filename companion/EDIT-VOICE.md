# Spracheingabe beim Bearbeiten – Build 16

## Zweck und Struktur
Roadbook bewahrt Reiseerinnerungen als persönliche Texte und Fotos. Bereits gespeicherte Texte sollen sich im gleichen Editor per Sprache ergänzen lassen. Zielgruppe sind die bestehenden iPhone-/iPad-Nutzer. Die Hauptbereiche bleiben Reisen und Mein Tagebuch; beide führen über den Eintragsdetaildialog zu Bearbeiten.

## Layout und Texte
Stabiler Kopf mit Abbrechen, Eintrag und Speichern; darunter der bestehende Etappenkontext. Im Bearbeiten-Dialog folgt unmittelbar ein Sprachbutton über dem Textfeld, danach Fotos. Kein neuer Tab oder zusätzlicher Dialog. Speichern bleibt die Abschlussaktion. Der Sprachbutton nennt wie Spur „Notiz sprechen“ beziehungsweise „Aufnahme stoppen“, mit „Die Aufnahme wird in Text umgewandelt“ beziehungsweise „Roadbook schreibt live mit“. Vorbereiten und Abschluss sind sichtbar benannt.

## Gestaltung und Interaktion
Vorbild ist Spurs `EntryEditorView.voiceNoteButton`: beschriftete Zeile, runder Mikrofon-/Stoppindikator, Systemschrift. Roadbook verwendet seinen vorhandenen `voiceAccent`, semantische Hintergrundfarben, 12 Punkte Innenabstand, 38-Punkte-Symbolkreis und mindestens 58 Punkte Zeilenhöhe. Keine zusätzliche Animation. Aufnahme startet ausschliesslich durch Antippen; Textfeld und Sprachbutton bleiben am selben Ort. Die Mitschrift ergänzt den unveränderten bisherigen Text. Während laufender/abschliessender Erkennung ist manuelles Tippen und Speichern gesperrt; danach wieder verfügbar. Abbrechen schützt den Entwurf und verändert den gespeicherten Eintrag nicht.

## Anpassung und Barrierefreiheit
Der vorhandene scrollbare Editor mit maximal 640 Punkten Inhaltsbreite bleibt erhalten. Mehrzeilige Beschriftungen und Systemschrift unterstützen Dynamic Type auf iPhone/iPad. Die ganze Zeile ist antippbar; der Zustand hat Text und VoiceOver-Wert, nicht nur eine Farbe. Ein Fehler lässt den vorhandenen Text erhalten und manuelle Bearbeitung zu. Etappen-ID, Fotos und CloudKit-Schema bleiben unverändert.

## Prüfung
Gezielte UI-Fälle: vorhandenen Text per Sprache ergänzen, manuell korrigieren und nochmals diktieren, speichern und nach Neustart wieder öffnen; gesprochenen Entwurf verwerfen; verweigerte Sprachfreigabe mit erhaltenem Text und manueller Bearbeitung. Bestehender Neuanlage-Test sichert den unveränderten ursprünglichen Ablauf. iPhone-/iPad-Screenshots prüfen Sichtbarkeit und Kontext. Simulierte Erkennung ist kein Nachweis echter Mikrofonqualität.

Build 16 wurde nach Abschluss der lokalen Prüfungen und ausdrücklicher Nutzerfreigabe über TestFlight veröffentlicht; beide bisherigen Testgruppen zeigen „Im Test“.

## Lokales Prüfergebnis vor Veröffentlichung

- iPhone 17 Pro, iOS 27: 4/4 gezielte UI-Tests bestanden (151,990 Sekunden). Ergänzen bestehender Notizen samt manueller Zwischenkorrektur, wiederholter Aufnahme, Erhalt der Etappe, Speicherung ohne Verdopplung und Neustart; Verwerfen; verweigerte Mikrofonfreigabe; bestehender Neuanlage-Ablauf.
- iPad Pro 11 Zoll (M5), iOS 27: Ergänzen/Speichern/Neustart ebenfalls bestanden (52,097 Sekunden).
- Screenshots auf beiden Formaten geprüft: Button oberhalb des Textfelds sichtbar, Text während Aufnahme erhalten. Helle Ansicht auf beiden Geräten, dunkle Ansicht auf iPhone geprüft.
- Release-Archiv Build 16 erfolgreich erstellt; `codesign --verify --deep --strict`, Bundle-ID, Buildnummer und ausschliesslich `iCloud.com.mrm.roadbook` erfolgreich geprüft. Apple-Development-signiertes Archiv, kein neuer Distribution-Export oder TestFlight-Upload.

Archiv: `/Volumes/Interne SSD/Development/Verification-2026-09-10/Roadbook-Build16-EditVoice.xcarchive`. Logs, fünf Screenshots, Signaturprüfung und SHA-256-Quellmanifest: `/Users/MrM/Documents/ChatGPT/To do/Exporte/Entwicklungspruefung-2026-09-10/Roadbook-Build16/`. Vollständige XCTest-Ergebnisse zusätzlich unter `/tmp/roadbook-edit-voice-20260910/`. Die UI-Tests verwendeten synthetische Notizen und simulierte Spracherkennung im isolierten Store ohne CloudKit. Echte Mikrofonaufnahme und Synchronisation des neuen Bearbeiten-Ablaufs auf persönlichen Geräten sind damit nicht nachgewiesen.

## Veröffentlichung Build 16 – 10. September 2026

Version **0.1.0 (16)** erfolgreich zu TestFlight hochgeladen (11:31 Uhr Europe/Zurich); Apple-Verarbeitung abgeschlossen. Nach ausdrücklicher Nutzerbestätigung wurde die unveränderte Verschlüsselungsantwort „Keinen der oben genannten Algorithmen“ gespeichert. Deutsche Testhinweise zum Bearbeiten-Dialog sind gespeichert. Die beiden bestehenden Gruppen **Roadbook – eigener Gerätetest** und **Roadbook – Anna** wurden mit aktivierter automatischer Testerbenachrichtigung zugeordnet und eingereicht. Beide Gruppenseiten zeigen Build 16 **„Im Test“**, jeweils 1 Tester:in, Ablauf in 90 Tagen. Keine neue Testergruppe oder Einladung, kein öffentlicher Link. Build-ID: `cab7351f-aedd-490c-a9e7-9dd0b56be742`.

Der App-Store-Connect-Export wurde auf Paketintegrität, strenge Signatur, Production-CloudKit/APNs, ausschliesslich `iCloud.com.mrm.roadbook`, `get-task-allow=false` und `beta-reports-active=true` geprüft. SHA-256 der lokal exportierten IPA: `b6b8c177b5ce3ad60cb8703a720b3ec83eed331c1a990af72f684ec5209fb423`. Export unter `/Volumes/Interne SSD/Development/Verification-2026-09-10/Roadbook-Build16-TestFlight/export/`; Upload aus demselben geprüften Archiv mit `UploadOptions-TestFlight.plist`. Quellstand `94fa601`, alle 22 Einträge des Build-16-Quellmanifests vor Veröffentlichung erneut bestätigt. Protokolle und Prüfergebnisse unter `/Users/MrM/Documents/ChatGPT/To do/Exporte/Entwicklungspruefung-2026-09-10/Roadbook-Build16/`.

Die automatische Freigabeprüfung hatte das erste Speichern der Export-Compliance-Antwort abgelehnt; erst nach dem anschliessenden ausdrücklichen Nutzer-Ja wurde dieselbe Antwort gespeichert. Installation und echte Sprachergänzung des neuen Builds auf persönlichen Geräten sind noch nicht bestätigt.
