# Roadbook Karten-Mockup

Dieses Verzeichnis ist ein eigenstaendiges, statisches UX-Mockup fuer die naechste Ausbaustufe des Motorrad-Roadbooks.

- Keine Verbindung zu den Publish-APIs
- Keine Aenderung an `reise-roadbook-2026.html` oder `unterkuenfte-2026.html`
- Kein Deployment-Eintrag in `vercel.json`
- Alle Planungsaktionen sind lokale Demo-Interaktionen

Begleitende Dokumente:

- `ux-contract.md`: verbindliche Informations-, Interaktions- und Sprachregeln des Mockups
- `generic-travel-model.md`: technische Spezifikation fuer das generische Reise-, Fixpunkt- und Versionsmodell sowie die verlustfreie Migration der Spanienreise

Lokal starten:

```bash
python3 -m http.server 4173 --directory mockup
```

Danach `http://127.0.0.1:4173` oeffnen.
