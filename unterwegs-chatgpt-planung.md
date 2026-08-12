# Unterwegs neu planen

Stand: 12.08.2026

Das Roadbook plant Route und Unterkuenfte gemeinsam. Ein separater Chat, kopiertes JSON und manuelles Nachziehen der Hotels sind im Normalfall nicht mehr noetig.

## Normaler Ablauf

1. Im Roadbook `Plan aendern` waehlen.
2. Aenderung beschreiben, zum Beispiel Aufenthalt verlaengern, Etappe auslassen oder ab einem Tag neu planen.
3. `Vorschlaege erstellen` waehlen und Publish-PIN eingeben.
4. Die App laesst ChatGPT zuerst die Route und danach die dazu passende Unterkunftskette planen.
5. Den Entwurf pruefen. Angezeigt werden die wichtigsten Routenentscheidungen, betroffene Unterkuenfte und offene Buchungsaufgaben.
6. Entweder `Entwurf verwerfen`, `Entwurf aendern` oder `Aenderungen uebernehmen & veroeffentlichen` waehlen.
7. Beim Veroeffentlichen werden Route und Unterkuenfte gemeinsam nach GitHub geschrieben. Vercel aktualisiert danach automatisch den gemeinsamen Online-Stand.

Solange der Entwurf nicht veroeffentlicht wurde, bleibt der aktuelle Online-Plan unveraendert.

## Planungsregeln

- Der Reiseplan behaelt insgesamt 30 Kalendertage.
- Die Faehre Barcelona-Genua bleibt fix: Check-in 21.10.2026 um 08:30, Abfahrt 10:30, Ankunft Genua 22.10.2026 um 09:00.
- Zusaetzliche Naechte vor der Faehre werden durch Weglassen optionaler Rundfahrten oder Reservetage, Zusammenlegen oder direktere Etappen ausgeglichen.
- Die Route ist fuehrend; die Unterkuenfte werden daraus abgeleitet.
- Bereits gebuchte Unterkuenfte werden nicht stillschweigend geaendert. Notwendige Verlaengerungen, Umbuchungen oder Stornierungen erscheinen als offene Aufgabe.
- Zwei beladene Triumph Motorraeder, keine Offroad-Strecken, Pisten, Strand- oder Waldwege.
- Historische Ortskerne nicht als direktes Navigationsziel verwenden.
- Bei schlechtem Wetter groessere Strassen und kuerzere Etappen bevorzugen.
- Sichere Abstellung fuer beide Motorraeder ist bei Unterkuenften Pflicht.

## Zustaende

- `Aktueller Plan`: der derzeit gemeinsame und veroeffentlichte Reiseplan.
- `Entwurf`: ein lokal sichtbarer Vorschlag, der noch nicht online gilt.
- `Originalplan laden`: technische Rueckfallbasis unter `Hilfe`; ersetzt nicht automatisch den gemeinsamen Online-Stand.

## Notfallweg

Unter `Hilfe` bleiben die bisherigen Werkzeuge verfuegbar:

- ChatGPT-Text erstellen
- JSON manuell uebernehmen
- lokale Sicherung laden oder herunterladen

Diese Werkzeuge sind nur fuer den Fall gedacht, dass die automatische Planung nicht erreichbar ist. Auch danach muss der Gesamtplan online veroeffentlicht werden, damit beide Reisenden denselben Stand sehen.
