# Vercel Refresh und Aktualisierung unterwegs

Stand: 06.08.2026

## Aktueller Projektstand

Das Projekt ist lokal mit Vercel verknuepft. In `.vercel/project.json` sind Organisation und Projekt-ID hinterlegt. Die Datei `vercel.json` leitet die Startseite auf `reise-roadbook-2026.html` und die Unterkunftsseite auf `unterkuenfte-2026.html`.

Die HTML-Dateien sind mit `Cache-Control: public, max-age=0, must-revalidate` konfiguriert. Das bedeutet: Nach einem neuen Deployment sollte ein normaler Refresh im Browser die aktuelle Version laden.

Wichtig: Der lokale Ordner ist aktuell kein Git-Repository. Damit gibt es unterwegs vom iPad aus noch keinen automatischen Weg, lokale Dateiaenderungen direkt an Vercel zu uebergeben.

## Variante A: Einfachster Ablauf vom Desktop

Wenn du wieder am Desktop bist:

1. Roadbook-Dateien aktualisieren.
2. Lokal kurz pruefen.
3. Mit Vercel produktiv deployen.
4. Auf iPad/iPhone die Roadbook-Seite neu laden.

Technischer Befehl vom Projektordner:

```bash
vercel --prod
```

Danach auf dem iPad:

- Seite neu laden.
- Falls die alte Version sichtbar bleibt: Browser-Tab schliessen und neu oeffnen.

## Variante B: Wirklich unterwegs aktualisieren

Wenn du unterwegs nur mit dem iPad arbeiten willst, sollte das Projekt in ein GitHub-Repository und dieses Repository mit Vercel verbunden werden.

GitHub-Repository:

- `https://github.com/MrM-creates/Bike_Spain`

Dann ist der Ablauf:

1. Roadbook-Dateien in GitHub bearbeiten oder ersetzen.
2. Aenderung auf dem Branch `main` speichern.
3. Vercel deployt automatisch.
4. Roadbook auf dem iPad refreshen.

Das ist die beste Loesung, wenn du ohne Desktop aktualisieren willst.

Voraussetzung in Vercel:

- Das Vercel-Projekt muss mit `MrM-creates/Bike_Spain` verbunden sein.
- Production Branch sollte `main` sein.
- Root Directory bleibt leer beziehungsweise auf Projektwurzel.
- Build Command bleibt leer, weil es eine statische HTML-App ist.
- Output Directory bleibt leer beziehungsweise Standard.

## Variante C: App bleibt stabil, Planung bleibt im Chat

Fuer unterwegs ist das oft am robustesten:

1. Roadbook bleibt unveraendert online.
2. Abweichungen werden in der App als Notiz und Status gespeichert.
3. ChatGPT plant die naechsten Etappen als Text.
4. Erst spaeter werden die dauerhaften Aenderungen sauber ins Roadbook uebernommen und deployed.

## Empfehlung

Fuer die Reise ist die beste Kombination:

- Roadbook-App bewusst einfach halten.
- Komplexe Umplanung in ChatGPT machen.
- App bekommt eine Funktion `Planungstext exportieren`.
- Vercel dient als stabile, aktualisierbare Online-Version.
- Wenn echte iPad-Aktualisierung wichtig ist: GitHub + Vercel-Autodeploy einrichten.

## Spaeter sinnvoller App-Button

Ein Button `Planungshilfe exportieren` sollte einen fertigen Text erzeugen mit:

- aktuellem Tag,
- den naechsten 5 Etappen,
- Fixpunkten,
- offenen Warnungen,
- Unterkunftsstatus,
- euren Sicherheitsregeln.

Diesen Text kannst du unterwegs in ChatGPT einfuegen. Nach der Antwort markierst du die betroffenen Tage im Roadbook als `Geaendert` und speicherst die neue Logik als Notiz.
