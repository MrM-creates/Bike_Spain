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
5. Der Chat gibt ein JSON fuer `ChatGPT-Plan uebernehmen` aus.
6. Das JSON im Roadbook importieren.
7. Im Roadbook `Online veroeffentlichen` waehlen und Publish-PIN eingeben.
8. Die Vercel Server-Funktion schreibt `currentDays` nach GitHub `MrM-creates/Bike_Spain` auf `main`.
9. Vercel erkennt den Push und deployed automatisch.
10. Auf iPad/iPhone die Roadbook-Seite neu laden.

Wichtig: Der GitHub-Token liegt nicht im Browser, sondern als Vercel Environment Variable in der Server-Funktion.

## Einmalige Einrichtung der Publish-Funktion

Damit `Online veroeffentlichen` funktioniert, braucht das Vercel-Projekt Production Environment Variables:

- `GITHUB_ROADBOOK_TOKEN`: GitHub Fine-grained Personal Access Token fuer `MrM-creates/Bike_Spain` mit `Contents: Read and write`.
- `ROADBOOK_PUBLISH_SECRET`: frei gewaehlte Publish-PIN beziehungsweise Passwort fuer den Roadbook-Button.
- Optional `GITHUB_REPO`: Standard ist `MrM-creates/Bike_Spain`.
- Optional `GITHUB_BRANCH`: Standard ist `main`.

Nach dem Setzen oder Aendern dieser Variablen muss Vercel einmal neu deployen. Den GitHub-Token nie in ChatGPT, im Browser oder in die HTML-Datei kopieren.

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

Wenn du unterwegs nur mit dem iPad arbeiten willst, ist die Roadbook-App der Schreibweg nach GitHub.

Dann ist der Ablauf:

1. ChatGPT erzeugt ein Import-JSON.
2. Roadbook importiert das JSON.
3. `Online veroeffentlichen` schreibt nach GitHub.
4. Vercel deployt automatisch.
5. Roadbook auf dem iPad refreshen.

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

Diese Variante ist nur fuer kleine Abweichungen gedacht. Wenn sich mehrere naechste Etappen wirklich aendern, sollte der Chat ein Import-JSON liefern; die Roadbook-App veroeffentlicht den neuen Stand danach ueber GitHub/Vercel.

## Empfehlung

Fuer die Reise ist die beste Kombination:

- Roadbook-App bewusst einfach halten.
- Komplexe Umplanung in ChatGPT machen.
- ChatGPT liefert JSON, nicht den Deployment-Schritt.
- Die Roadbook-App veroeffentlicht per geschuetzter Server-Funktion nach GitHub.
- Vercel dient als stabile, automatisch aktualisierte Online-Version.

## Planungshilfe im Roadbook

Der Button `Planungshilfe für ChatGPT` erzeugt einen fertigen Text mit:

- aktuellem Tag,
- den naechsten 5 Etappen,
- Fixpunkten,
- offenen Warnungen,
- Unterkunftsstatus,
- euren Sicherheitsregeln.

Diesen Text kannst du unterwegs in ChatGPT einfuegen. Nach der Antwort importierst du das JSON ueber `ChatGPT-Plan uebernehmen` und veroeffentlichst den Stand mit `Online veroeffentlichen`.
