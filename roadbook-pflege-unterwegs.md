# Roadbook unterwegs pflegen

## Aktueller Stand

Das `reise-roadbook-2026.html` ist nicht nur eine statische Ansicht. Im Modus `Planen` koennen Tage bearbeitet, verschoben, hinzugefuegt, als gefahren/geaendert/ausgelassen markiert und mit Unterwegs-Notizen versehen werden. Die Aenderungen werden im Browser lokal gespeichert.

Zusaetzlich gibt es im Planmodus schnelle Reise-Aktionen:

- `Verlaengern`: fuegt nach dem aktuellen Tag einen zusaetzlichen Ruhetag am gleichen Ort ein.
- `Auslassen`: markiert den Tag als ausgelassen und speichert eine kurze Notiz.
- `Ab hier planen`: erzeugt einen fertigen ChatGPT-Planungstext fuer die naechsten Etappen.
- `ChatGPT-Plan uebernehmen`: importiert ein strukturiertes JSON aus ChatGPT und ersetzt die betroffenen Tage im Roadbook.
- `Online veroeffentlichen`: schreibt den aktuellen Roadbook-Plan serverseitig nach GitHub; Vercel deployed danach automatisch.

Wichtig: Lokale Speicherung ist nur ein Fallback. Der gemeinsame gueltige Stand fuer beide Reisende ist die Vercel-Version, die aus GitHub `MrM-creates/Bike_Spain` deployed wird.

## Empfohlener Betrieb fuer die Reise

1. Roadbook unterwegs im Modus `Fahren` nutzen.
2. Bei relevanten Aenderungen wie zusaetzlicher Nacht, ausgelassenem Tag, Wetterproblem oder Hotelproblem in den Modus `Planen` wechseln.
3. Beim betroffenen Tag `Ab hier planen` waehlen und den Text in ChatGPT verwenden.
4. ChatGPT liefert ein JSON fuer `ChatGPT-Plan uebernehmen`.
5. JSON im Roadbook importieren und danach `Online veroeffentlichen` waehlen.
6. Die App schreibt `currentDays` serverseitig nach GitHub `MrM-creates/Bike_Spain`; Vercel deployed automatisch.
7. Beide Geraete laden anschliessend denselben aktuellen Stand.
8. `Lokale Sicherung herunterladen` und `Lokale Sicherung laden` bleiben unter `Hilfe` als Fallback fuer Sonderfaelle.

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

Fuer diese Reise ist der beste Standard nicht lokale Sicherung, sondern GitHub/Vercel als gemeinsamer Stand. Sicherungen bleiben als Notfallweg sinnvoll, sollen aber nicht der normale Reiseablauf sein.

## Planung und Vercel-Aktualisierung

Der komplexe Planungsteil sollte unterwegs nicht auf dem Handy oder iPad erledigt werden. Sinnvoller ist:

- Roadbook unterwegs lesen, markieren und mit Notizen pflegen.
- Echte Umplanung mit `Ab hier planen` in einem neuen ChatGPT-Chat auf dem iPad machen.
- Bei Bedarf `unterwegs-chatgpt-planung.md` und `vercel-refresh-anleitung.md` als zusaetzlichen Kontext anhaengen.
- Der neue Chat passt die naechsten Etappen an.
- Standardziel: Der Chat liefert ein Import-JSON fuer `ChatGPT-Plan uebernehmen`.
- Nach dem Import veroeffentlicht die Roadbook-App den aktuellen Stand ueber `Online veroeffentlichen`.
- Die Server-Funktion schreibt `currentDays` nach GitHub `MrM-creates/Bike_Spain`; Vercel deployed danach automatisch.
- Wenn `Online veroeffentlichen` fehlschlaegt, lokale Sicherung herunterladen und spaeter manuell/Codex nachziehen.

Ergaenzende Dateien:

- `unterwegs-chatgpt-planung.md`: Kontext und Vorlage fuer neue ChatGPT-Chats unterwegs.
- `vercel-refresh-anleitung.md`: erklaert, wie Aktualisierungen per Vercel funktionieren und was fuer iPad-only Updates noetig waere.
