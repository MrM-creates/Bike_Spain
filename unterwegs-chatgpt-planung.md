# Unterwegs mit ChatGPT weiterplanen

Stand: 06.08.2026

Diese Datei ist dafuer gedacht, unterwegs auf dem iPad in einen neuen Chat kopiert oder als Kontext angehaengt zu werden. Der neue Chat kennt das lokale Codex-Projekt nicht, bekommt damit aber die wichtigsten Regeln und den richtigen Arbeitsauftrag.

Zielablauf:

1. Roadbook unterwegs benutzen, aber dort keine neue Reiseplanung machen.
2. In der ChatGPT-App auf dem iPad einen neuen Chat starten.
3. Diese Datei und `vercel-refresh-anleitung.md` anhaengen.
4. Dem Chat sagen, was sich geaendert hat: Wetter, Standort, Muedigkeit, Hotelproblem oder neuer Wunsch.
5. Der Chat passt die naechsten Etappen an.
6. Standardziel: `reise-roadbook-2026.html` im GitHub-Repository `MrM-creates/Bike_Spain` auf Branch `main` aktualisieren, committen und pushen.
7. Vercel-Projekt `motorrad-roadbook-spanien-2026` deployed automatisch von GitHub.
8. Roadbook auf dem iPad neu laden.
9. Nur falls `MrM-creates/Bike_Spain` nicht erreichbar oder nicht beschreibbar ist: ein JSON fuer `ChatGPT-Plan uebernehmen` im Roadbook erzeugen lassen.

Wichtig: Vercel ist die gemeinsame Anzeige. GitHub `MrM-creates/Bike_Spain` ist die Quelle. Der normale unterwegs-Workflow endet deshalb mit Commit/Push nach GitHub; Vercel zieht danach automatisch nach.

## Schnellster Ablauf mit dem Roadbook

Im Roadbook den Planmodus oeffnen:

```text
reise-roadbook-2026.html?admin=1
```

Dann:

1. Beim betroffenen Tag `Ab hier planen` waehlen.
2. Den erzeugten Text in ChatGPT kopieren.
3. ChatGPT soll zuerst die neue Planung als Text klaeren.
4. Danach soll ChatGPT `reise-roadbook-2026.html` direkt aktualisieren, auf `main` committen und nach `https://github.com/MrM-creates/Bike_Spain` pushen; Vercel deployed danach automatisch.
5. Nur falls das Repository nicht erreichbar oder nicht beschreibbar ist: ein einzelnes JSON fuer den Button `ChatGPT-Plan uebernehmen` ausgeben.
6. Nach erfolgreichem Push Roadbook auf iPad/iPhone neu laden.

## Rolle von ChatGPT unterwegs

ChatGPT soll unterwegs nicht die ganze Reise frei neu erfinden, sondern ab dem betroffenen Tag pragmatisch bis zum Fixpunkt Faehre Barcelona - Genua neu ausrichten und das Roadbook-HTML aktualisieren.

Wichtig:

- Der bestehende Roadbook-Plan bleibt die Basis.
- Aenderungen sollen moeglichst klein und nachvollziehbar sein.
- Fixpunkte wie Faehre, Rueckreise, bereits gebuchte Hotels und sichere Motorradabstellung haben Vorrang.
- Keine Offroad-Strecken, keine Pisten, keine Strandzufahrten, keine Waldwege.
- Keine historischen Ortskerne als direktes Navigationsziel.
- Bei schlechtem Wetter lieber groessere Strassen und kuerzere Etappen.

## Reiseprofil

- Reisezeit: 24.09. bis 23.10.2026.
- Start und Ziel: Berikon AG.
- Fahrzeuge: zwei Triumph Motorraeder.
- Fahrstil: ruhig, sicher, keine Offroad-Strecken.
- Gewuenschte Tagesetappen: meistens ca. 180 bis 330 km, einzelne Transfertage duerfen laenger sein.
- Navigation: Google Maps als Routengeruest, aber Strassen und Kontrollpunkte muessen aktiv geprueft werden.
- Unterkuenfte: sichere Abstellung fuer zwei beladene Motorraeder ist wichtiger als maximale Zentrumsnaehe.

## Fixpunkte

- Faehre Barcelona - Genua bleibt fix.
- Check-in: 21.10.2026, 08:30.
- Abfahrt: 21.10.2026, 10:30.
- Ankunft Genua: 22.10.2026, 09:00.
- Rueckreise danach wetterabhaengig via Aosta oder Como.

## Sicherheitsregeln

- Keine automatische Option "kurvigste Route" verwenden.
- Keine unbefestigten Wege akzeptieren.
- Kleine Schlucht-, Pass- oder Nebenstrassen nur trocken, offen, bei guter Sicht und genug Energie fahren.
- Umweltzonen/ZBE beachten: Grenoble, Barcelona, Valencia, Granada/Monachil-Umfeld, Zaragoza.
- Hotels, Garagen und Terminalzufahrten immer direkt pruefen.

## Vorlage fuer einen neuen Chat unterwegs

Kopiere diesen Block in ChatGPT:

```text
Ich bin auf einer Motorradreise von Berikon nach Spanien und zurueck. Ich habe diese Dateien angehaengt:

- unterwegs-chatgpt-planung.md
- vercel-refresh-anleitung.md
- wenn vorhanden: die aktuelle reise-roadbook-2026.html

Bitte nutze die folgenden Regeln:

- Zwei Triumph Motorraeder.
- Keine Offroad-Strecken, keine Pisten, keine Strandzufahrten, keine Waldwege.
- Historische Ortskerne nicht als direktes Navigationsziel verwenden.
- Tagesetappen lieber ruhig und sicher planen.
- Bei schlechtem Wetter lieber groessere Strassen.
- Sichere Motorradabstellung bei Unterkuenften ist Pflicht.
- Die Faehre Barcelona - Genua bleibt fix: Check-in 21.10.2026 um 08:30, Abfahrt 10:30, Ankunft Genua 22.10.2026 um 09:00.

Aktueller Standort:
[Ort eintragen]

Aktueller Reisetag:
[Tag/Datum eintragen]

Problem / Wunsch:
[z.B. Wetter schlecht, wir sind muede, Hotel ausgebucht, wir wollen kuerzer fahren]

Bitte passe die naechsten 5 Etappen an. Erst klaere die neue Planung als Text. Gib pro Tag:
- Start und Ziel
- Uebernachtungsort
- grobe Kilometer und Fahrzeit
- wichtige Kontrollpunkte
- Strassen-/Sicherheitsnotiz
- Google-Maps-Suchbegriffe oder Routenlogik
- was gegenueber dem Originalplan geaendert wurde

Danach aktualisiere, wenn du Zugriff auf Dateien/GitHub hast, die Datei `reise-roadbook-2026.html`, committe die Aenderung auf `main` und pushe nach `https://github.com/MrM-creates/Bike_Spain`.

Wenn du keinen GitHub- oder Dateizugriff hast, erstelle stattdessen einen klaren Patch oder eine vollstaendige aktualisierte `reise-roadbook-2026.html`, damit ich sie manuell in GitHub einspielen kann.
```

## Ergebnis zurueck ins Roadbook bringen

Wenn der neue Chat GitHub pushen konnte:

1. Warten, bis Vercel den neuen Stand deployed hat.
2. Roadbook auf dem iPad neu laden.
3. Pruefen, ob die geaenderten Etappen sichtbar sind.

Wenn der neue Chat nicht pushen konnte:

1. Die ChatGPT-Antwort aufheben.
2. Die aktualisierte HTML-Datei oder den Patch in GitHub einspielen.
3. Warten, bis Vercel deployed.
4. Roadbook auf dem iPad neu laden.

Fuer kleine spontane Abweichungen reicht weiterhin:

1. Im Roadbook den betroffenen Tag als `Geaendert` markieren.
2. Die neue Tageslogik als Unterwegs-Notiz speichern.
3. Sicherung herunterladen.
