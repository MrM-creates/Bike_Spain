# Etappen-Notizen per Stimme

Lokaler Entwicklungsstand vom 9. September 2026.

Referenz im Projekt To do: `SpurNative/Spur/NoteCaptureView.swift`, `SpeechNoteRecorder.swift`, `SpeechTranscriptAccumulator.swift` und `SpeechRecognitionFeedback.swift`. Roadbook übernimmt den Recorder und die Behandlung von Erkennungsergebnissen; der Editor bleibt im bestehenden Etappen-/Tagebuchablauf.

## Bedienung

Eintrag hinzufügen → runder Mikrofonbutton wie in Spur → Stoppen → Mitschrift prüfen bzw. korrigieren → Speichern. Weiter diktieren startet direkt eine ergänzende Aufnahme. Lieber tippen ist als zweite Option vorhanden; während der Aufnahme beendet Lieber tippen die Erkennung und übernimmt den bis dahin erkannten Text. Beim Bearbeiten eines gespeicherten Eintrags steht ab Build 16 „Notiz sprechen“ direkt über dem Texteditor, wie in Spur. Der Text bleibt während der Aufnahme sichtbar; gesprochene Ergänzungen werden angehängt. „Aufnahme stoppen“ schliesst die Erkennung ab, danach sind Tippen und Speichern wieder möglich. Verwerfen lässt den gespeicherten Eintrag unverändert. Details: [EDIT-VOICE.md](EDIT-VOICE.md).

Mikrofon und Apple-Spracherkennung werden erst beim Aufnahmestart angefragt. Sprache: Deutsch/Schweiz. Wenn unterstützt erfolgt die Erkennung auf dem Gerät, andernfalls kann Apple die Aufnahme verarbeiten. Keine Audiodatei wird gespeichert. Die Erklärung steht unter Einstellungen → Datenschutz. Berechtigungsfehler lassen Tippen weiterhin zu.

Beim Stoppen werden bis zu zwei Sekunden lang letzte Erkennungsergebnisse abgewartet. Speichern ist während der Aufnahme und dieses Abschlusses gesperrt. Pausen und korrigierte Teilresultate werden ohne doppelte Textabschnitte zusammengesetzt. Im Hintergrund und beim Schliessen wird der Recorder beendet; bereits erkannter Text bleibt im offenen Entwurf. Verwerfen verwirft nur den Entwurf. Fotos, bestehende Notizen, Etappen-IDs und das CloudKit-Schema verwenden weiterhin den bisherigen Speicherweg.

## Prüfungen

Die übernommenen Swift-Prüfungen decken 20 Szenarien zur Zusammensetzung von Erkennungsergebnissen und 9 Assertions für Fehlertexte ab. Die UI-Tests simulieren Erkennung ausschliesslich in Debug mit `-ui-testing -ui-test-speech`; normale Builds verwenden den echten Recorder. Sie prüfen verspätete letzte Wörter, Korrekturen, weiteres Diktieren, Speicherung/Neustart, Berechtigungsfehler, Wechsel zum Tippen und Hintergrundwechsel. Der bisherige Text-Speichertest bleibt ebenfalls erhalten.

Echte Mikrofonqualität, Dialekterkennung und System-Berechtigungsdialoge müssen auf einem iPhone/iPad geprüft werden. Ein Simulatorlauf mit künstlichen Erkennungsergebnissen bestätigt diese nicht. Version 0.1.0 (15) ist inzwischen in TestFlight veröffentlicht; beide zugeordneten Gruppen zeigen „Im Test“. Anna wurde am 9. September 2026 per E-Mail in die externe Gruppe „Roadbook – Anna“ eingeladen; bestätigter Status „Eingeladen“. Siehe Distribution/TESTFLIGHT.md.

### Ergebnis vom 9. September 2026

- Simulator-Build erfolgreich; Info.plist gültig.
- 20 Transcript- und 9 Fehlertext-Assertions bestanden.
- iPhone: alle drei neuen UI-Tests bestanden, 0 Fehler (100,543 s); bisheriger Text-/Speicher-/Neustarttest ebenfalls bestanden (72,612 s).
- iPad: Voice-Hauptablauf inklusive Korrektur, Weiterdiktieren und Neustart bestanden, 0 Fehler (36,861 s).
- Screenshots des Sprachstarts auf iPhone/iPad und des bearbeitbaren Ergebnisses auf iPhone visuell geprüft.
- Gefundene Fehler behoben: Rand-Leerzeichen manueller Korrekturen werden beim Weiterdiktieren erhalten; Verwerfen-/Weiter-bearbeiten-Auswahl als expliziter System-Alert.

Lokale Testprotokolle: `/tmp/roadbook-voice-iphone-final.log`, `/tmp/roadbook-voice-ipad-final.log`; Text-Regression im ersten Lauf `/tmp/roadbook-voice-iphone-tests-v2.log`. Wegen blockierter macOS-Dateikoordination des Desktop-Projektordners erfolgten Build/UI-Tests aus einer inhaltlich identischen Kopie unter `/tmp/roadbook-voice-verification`; Buildausgabe unter `/tmp/roadbook-voice-derived`. Die Simulatorprüfung selbst installierte nichts auf persönlichen Geräten. Anschliessend wurde Build 12 auf ausdrücklichen Nutzerwunsch zu TestFlight hochgeladen; Verteilungsstand siehe Distribution/TESTFLIGHT.md.

### Überarbeitung des Tagebuchs nach Build 12

Der direkte Tagebucheinstieg öffnet denselben Editor wie eine Tagesroute. Die Etappe wird im Kopf ausgewählt; Text/Fotos bleiben bei einer neuen Auswahl erhalten. Ohne Etappe ist Speichern gesperrt. Bereits gespeicherte Einträge und der Einstieg aus einer Tagesroute behalten ihre feste Zuordnung. Übersicht ohne Hinweiskasten, mit kompakten Etappengruppen und verkleinerten Fotovorschauen. Der runde Aufnahmebutton übernimmt Form, Symbol und Orange (#E45B32) aus Spur; die Modus-Umschaltung entfällt.


Abnahme der Überarbeitung: fünf iPhone-Ablaufprüfungen bestanden (Sprache inkl. Korrektur/Weiterdiktieren/Neustart, Berechtigungsfehler, Hintergrundwechsel, direkter Etappenwechsel, bestehender Routeneinstieg). Gruppierung nach Etappen ebenfalls bestanden. Separater Fototest mit künstlichem Bild: Auswahl, Wechsel von Balkan nach Spanien vor dem Speichern, Vorschau, Wiederöffnen und Entfernen bestanden. iPad: Sprache und direkter Etappenwechsel bestanden; kleineres iPhone: direkter Einstieg aus leerem Tagebuch bestanden. Hell-/Dunkel-Screenshots visuell geprüft. Der erste Foto-Testlauf verwendete den falschen Selektor im Systemdialog; korrigierter Test mit PXGGridLayout-Info und Fertig erfolgreich. Finale Release-Quellen stimmen mit den getesteten App-Quellen überein. Nachweise unter `.build/distribution/2026-09-09-build13/`.

Build 14 übernimmt die geprüfte Tagebuchüberarbeitung unverändert und kürzt den Navigationstitel auf Eintrag. Damit bleibt er auch auf dem kleineren iPhone vollständig sichtbar. Build 13 wurde hochgeladen, aber keiner Gruppe zugewiesen.

Finale Build-14-Prüfung: direkter Ablauf auf kleinem iPhone erneut bestanden; Screenshot bestätigt den vollständigen Titel Eintrag. Nachweise unter `.build/distribution/2026-09-09-build14/`.

Build 14 am 9. September 2026 für beide bestehenden Testgruppen veröffentlicht: interner Gerätetest und Roadbook – Anna zeigen jeweils „Im Test“. Automatische Testerbenachrichtigung aktiviert; Anna weiterhin eingeladen.

### Automatische Interpunktion – Build 15

`SFSpeechAudioBufferRecognitionRequest.addsPunctuation = true` aktiviert Apples automatische Satzzeichen für jede neue Aufnahme und beim Weiterdiktieren. Die formatierte Mitschrift bleibt unverändert bearbeitbar. Bestehende Einträge werden nicht nachträglich verändert. Die 20 bestehenden Transcript-Assertions bestanden erneut; die tatsächliche Erkennungsqualität muss mit freier Sprache auf dem Gerät geprüft werden. Referenz: https://developer.apple.com/documentation/speech/sfspeechrecognitionrequest/addspunctuation

Build 15 für beide bestehenden Testgruppen in TestFlight veröffentlicht; beide zeigen „Im Test“.

### Sprache beim Bearbeiten – Build 16

Am 10. September für beide bisherigen TestFlight-Gruppen veröffentlicht, jeweils „Im Test“. Fünf gezielte Simulator-UI-Tests bestanden; Details und Grenzen in [EDIT-VOICE.md](EDIT-VOICE.md).
