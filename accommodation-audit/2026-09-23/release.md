# Veröffentlichung

Freigegebener Umfang: eigene Unterkunftsstatus und Auswahl in Admin und Roadbook, vorhandene Daten zusammenführen, gemeinsam veröffentlichen. Aktuelle Holunderhof-Buchung erhalten, Schlossberghof als nicht verfügbar kennzeichnen.

Web-Ausgangsstand: origin/main 8ae1d80. Native Ausgangsbasis: tatsächlich zuletzt verteilter Build 23 einschliesslich Wetter, Sprache und Animationen; dessen noch lokale Quelldateien werden zusammen mit Build 24 versioniert. Keine Tagebuchdaten enthalten.

Build 24: Release-Archiv erfolgreich, Version 0.1.0 (24), bestehende App-ID com.mrm.roadbook und bestehender CloudKit-Container unverändert. Weitere Ergebnisse werden nach Veröffentlichung ergänzt.

## Bestätigte Ergebnisse

- 89/89 Node-Prüfungen bestanden.
- iPhone: sieben Abläufe im Gesamtdurchlauf bestanden. Der achte Ablauf hatte im Test nach dem Speichern nach unten statt zurück nach oben gescrollt; der Accessibility-Befund zeigte bereits Schlossberghof/Gebucht oben und Holunderhof/Offen in den Details. Nur das Test-Scrollen korrigiert; gezielte Wiederholung erfolgreich. Keine Änderung am Release-Binary.
- iPad: Unterkunftswechsel mit endgültigem Startbestand erfolgreich.
- Release-Archiv und strenge Codesign-Prüfung erfolgreich; Upload um 16:31 Uhr Europe/Zurich erfolgreich. Apple-Verarbeitung abgeschlossen. Build-ID d212d8f2-2882-4d28-823d-ad8affc7f13c.
- Web: Commit 0c4b3ad1b6f5abef694fa06517f1cc9b0028bcc7 auf main, Vercel-Deployment dpl_4ScxpSLKpHhEJnvhpvXKWcLrDfFf, production READY. Produktiver JSON-Feed stimmt exakt mit dem serialisierten Startbestand überein. Neue Schreibschnittstellen weisen fehlende PIN mit 401 zurück.
- Holunderhof produktiv gebucht, Schlossberghof nicht verfügbar. Reale Buchungen wurden für Tests nicht geändert.
- Deutsche Testhinweise gespeichert; beide bisherigen Gruppen zugeordnet. Automatische TestFlight-Benachrichtigung wie bisher aktiviert.
- Release-Dateien in das ursprüngliche Projekt übernommen; vorheriger lokaler Inhalt zusätzlich in /tmp/roadbook-before-release-sync gesichert. Archiv und Build-Protokolle unter companion/.build/accommodation24, nicht im Repository.

Apple bestätigt Build 24 in der externen Gruppe „Roadbook – Anna“ als „Im Test“, Ablauf in 90 Tagen.
