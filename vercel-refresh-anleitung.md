# Vercel Refresh und Aktualisierung unterwegs

Stand: 06.08.2026

## Aktueller Projektstand

Das Projekt ist mit GitHub und Vercel verbunden.

GitHub-Repository:

- `https://github.com/MrM-creates/Bike_Spain`

Die Datei `vercel.json` leitet die Startseite auf `reise-roadbook-2026.html` und die Unterkunftsseite auf `unterkuenfte-2026.html`.

Die HTML-Dateien sind mit `Cache-Control: public, max-age=0, must-revalidate` konfiguriert. Das bedeutet: Nach einem neuen Deployment sollte ein normaler Refresh im Browser die aktuelle Version laden.

Der lokale Ordner ist inzwischen ein Git-Repository und der Branch `main` ist mit GitHub verbunden. Vercel soll von `main` deployen.

## Standardablauf ueber GitHub und Vercel

Das ist der gewuenschte Ablauf fuer unterwegs:

1. In der ChatGPT-App auf dem iPad einen neuen Chat starten.
2. `unterwegs-chatgpt-planung.md` und diese Datei anhaengen.
3. Wenn moeglich auch die aktuelle `reise-roadbook-2026.html` anhaengen oder dem Chat das GitHub-Repo nennen.
4. Der Chat passt die Planung an.
5. Wenn der Chat GitHub-/Codex-Zugriff hat, aktualisiert er `reise-roadbook-2026.html` und pusht auf `main`.
6. Vercel erkennt den Push und deployed automatisch.
7. Auf iPad/iPhone die Roadbook-Seite neu laden.

Wichtig: Ein normaler ChatGPT-Chat ohne GitHub- oder Codex-Werkzeuge kann nicht selbst pushen. Dann soll er eine aktualisierte HTML-Datei oder einen Patch erzeugen, den du ueber GitHub einspielst.

## Variante A: Ablauf vom Desktop

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

Wenn du unterwegs nur mit dem iPad arbeiten willst, ist GitHub die zentrale Quelle.

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

Diese Variante ist nur fuer kleine Abweichungen gedacht. Wenn sich mehrere naechste Etappen wirklich aendern, sollte der Chat die HTML-Datei aktualisieren und ueber GitHub/Vercel neu veroeffentlichen.

## Empfehlung

Fuer die Reise ist die beste Kombination:

- Roadbook-App bewusst einfach halten.
- Komplexe Umplanung in ChatGPT machen.
- Wenn moeglich, den neuen Chat mit GitHub-/Codex-Zugriff nutzen.
- Der Chat aktualisiert `reise-roadbook-2026.html` und pusht nach GitHub.
- Vercel dient als stabile, automatisch aktualisierte Online-Version.
- App bekommt optional eine Funktion `Planungstext exportieren`.

## Spaeter sinnvoller App-Button

Ein Button `Planungshilfe exportieren` sollte einen fertigen Text erzeugen mit:

- aktuellem Tag,
- den naechsten 5 Etappen,
- Fixpunkten,
- offenen Warnungen,
- Unterkunftsstatus,
- euren Sicherheitsregeln.

Diesen Text kannst du unterwegs in ChatGPT einfuegen. Nach der Antwort markierst du die betroffenen Tage im Roadbook als `Geaendert` und speicherst die neue Logik als Notiz.
