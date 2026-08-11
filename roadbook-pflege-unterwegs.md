# Roadbook unterwegs pflegen

## Aktueller Stand

Das `reise-roadbook-2026.html` ist nicht nur eine statische Ansicht. Im Modus `Planen` koennen Tage bearbeitet, verschoben, hinzugefuegt, als gefahren/geaendert/ausgelassen markiert und mit Unterwegs-Notizen versehen werden. Die Aenderungen werden im Browser lokal gespeichert.

Zusaetzlich gibt es im Planmodus schnelle Reise-Aktionen:

- `Verlaengern`: fuegt nach dem aktuellen Tag einen zusaetzlichen Ruhetag am gleichen Ort ein.
- `Auslassen`: markiert den Tag als ausgelassen und speichert eine kurze Notiz.
- `Ab hier planen`: erzeugt einen fertigen ChatGPT-Planungstext fuer die naechsten Etappen.
- `ChatGPT-Plan uebernehmen`: importiert ein strukturiertes JSON aus ChatGPT und ersetzt die betroffenen Tage im Roadbook.

Wichtig: Lokale Speicherung bedeutet pro Geraet und pro Browser. Aenderungen auf dem iPhone erscheinen nicht automatisch auf dem Mac oder einem zweiten Telefon.

## Empfohlener Betrieb fuer die Reise

1. Vor der Abfahrt das Roadbook auf den Geraeten oeffnen, die unterwegs genutzt werden.
2. Nach jeder relevanten Aenderung im Planmodus `Sicherung herunterladen` verwenden.
3. Die Sicherungsdatei in iCloud Drive, Google Drive oder einem gemeinsamen Chat ablegen.
4. Auf einem zweiten Geraet bei Bedarf `Sicherung laden` verwenden.
5. Hotelbuchungen zusaetzlich auf der Unterkunftsseite als `Angefragt` oder `Gebucht` markieren.

Das ist die einfachste Variante ohne Server, Login oder Datenbank. Sie ist robust, solange ihr konsequent exportiert, wenn ein Geraet gewechselt wird.

## Bessere Ausbaustufe

Die naechste sinnvolle Stufe waere eine kleine Roadbook-App mit einer gemeinsamen Datenquelle:

- `roadbook.html` bleibt die Bedienoberflaeche.
- `roadbook-data.json` wird die zentrale Stammdaten-Datei fuer Etappen, Hotels und Faehre.
- Unterwegs-Aenderungen werden als separate Sicherung oder in einer kleinen Cloud-Datenquelle gespeichert.
- Die App zeigt klar: `Originalplan`, `Unterwegs geaendert`, `Gefahren`, `Ausgelassen`.

Geeignete Datenquellen:

- Google Sheet: am einfachsten unterwegs zu editieren, gut fuer Hotels, Status und Notizen.
- GitHub Pages plus JSON-Datei: sauber fuer versionierte Planung, aber unterwegs weniger bequem.
- Kleine Web-App mit Supabase/Firestore: am flexibelsten fuer mehrere Geraete, braucht aber Login, Hosting und etwas mehr Pflege.

## Empfehlung

Fuer diese Reise reicht wahrscheinlich der bestehende Planmodus plus Sicherung in iCloud/Google Drive. Wenn mehrere Personen gleichzeitig editieren sollen oder Hotelbuchungen automatisch auf allen Geraeten aktuell sein muessen, ist ein Google-Sheet-Backend die pragmatischste naechste Stufe.

## Planung und Vercel-Aktualisierung

Der komplexe Planungsteil sollte unterwegs nicht auf dem Handy oder iPad erledigt werden. Sinnvoller ist:

- Roadbook unterwegs lesen, markieren und mit Notizen pflegen.
- Echte Umplanung mit `Ab hier planen` in einem neuen ChatGPT-Chat auf dem iPad machen.
- Bei Bedarf `unterwegs-chatgpt-planung.md` und `vercel-refresh-anleitung.md` als zusaetzlichen Kontext anhaengen.
- Der neue Chat passt die naechsten Etappen an.
- Wenn der Chat GitHub-/Codex-Zugriff hat, aktualisiert er `reise-roadbook-2026.html`, committet auf `main` und pusht nach GitHub.
- Vercel deployed danach automatisch; unterwegs reicht ein Refresh im Browser.
- Wenn der Chat nicht pushen kann, soll er ein Import-JSON fuer `ChatGPT-Plan uebernehmen` liefern.
- Fuer den dauerhaften Online-Stand muss ein per JSON uebernommener Plan spaeter trotzdem in `reise-roadbook-2026.html` eingespielt und ueber GitHub/Vercel deployed werden.

Ergaenzende Dateien:

- `unterwegs-chatgpt-planung.md`: Kontext und Vorlage fuer neue ChatGPT-Chats unterwegs.
- `vercel-refresh-anleitung.md`: erklaert, wie Aktualisierungen per Vercel funktionieren und was fuer iPad-only Updates noetig waere.
