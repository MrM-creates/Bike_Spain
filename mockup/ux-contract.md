# UX-Vertrag fuer das Karten-Mockup

## Zweck

Das Roadbook fuehrt zwei Motorradreisende sicher durch einen bestaetigten Reiseplan und macht Aenderungsentwuerfe pruefbar, bevor Route und Unterkuenfte gemeinsam veroeffentlicht werden.

## Informationsarchitektur

1. Reisen: Bestehende Motorrad-Reisen oeffnen oder eine neue Reise beginnen.
2. Reiseplan: Karte mit synchronisierten Ansichten `Tage` und `Unterkuenfte`.
3. Roadbook: Der bestaetigte Plan fuer die Durchfuehrung unterwegs.
4. Exporte und Dokumente: GPX/KML und spaeter Reisedokumente. Google Maps bleibt bei der einzelnen Tagesetappe.
5. Einstellungen: Reise- und Darstellungsoptionen.

Im aktuellen Mockup bleiben nur `Reisen` und der geoeffnete `Reiseplan` sichtbar. Weitere Bereiche werden nicht als leere Navigation vorweggenommen.

## Neue Reise

- Der Einstieg erfolgt ausschliesslich ueber die Reiseuebersicht. `Weitere Aktionen` bleibt auf Hilfsaktionen der aktuell geoeffneten Reise beschraenkt.
- Der Flow fragt progressiv `Rahmen`, `Fixpunkte` und `Wuensche` ab; kein langes Gesamtformular.
- Start und Ende werden automatisch als Fixpunkte behandelt.
- Gebuchte Unterkuenfte, Transporte, zwingende Orte und Termine koennen als weitere Fixpunkte erfasst werden.
- Routenstil, Fahrrhythmus, Wunschorte, Uebernachtungsart und `Lass mich ueberraschen` sind weiche Praeferenzen.
- `Lass mich ueberraschen` wird als `Zusaetzliche passende Orte vorschlagen` erklaert. `Nur Asphalt` ist eine harte Routenregel, `Gutes Wetter bevorzugen` eine weiche Planungsregel.
- Nach der Eingabe entsteht zuerst ein automatisch im Web gepruefter Routenentwurf.
- Der erste Entwurf zeigt nicht nur Kennzahlen, sondern eine sichtbare Route und eine kurze verbale Reiseerzaehlung.
- Kartenabschnitte und Textpassagen sind ueber Etappen-IDs gekoppelt: Ein Klick auf einen Text markiert die Strecke, ein Klick auf eine Strecke den passenden Text.
- Die Reiseerzaehlung nennt Auftakt, wichtige Aufenthalte, besondere Strecken, Fixpunkte und flexible Teile, ohne alle Tagesetappen zu wiederholen.
- Die Erzaehlung wird aus dem aktuellen Plan erzeugt und ist keine zweite, separat gepflegte Datenquelle.
- Erst nach der Routenbestaetigung werden Unterkuenfte erzeugt und abgeglichen.
- Das Resultat bleibt ein Entwurf, bis der User den Gesamtplan explizit veroeffentlicht.

## Layout

- Globaler Header: links `Reisen` und der stabile Name der aktuell geoeffneten Reise, in der Mitte der Umschalter `Uebersicht | Roadbook`, rechts Planstatus, die primaere Aktion `Reise anpassen` sowie `Weitere Aktionen`.
- `Uebersicht` zeigt Gesamtkarte, verbale Reisecharakteristik, Eckdaten, Fixpunkte und kompakten Buchungsstand. `Roadbook` enthaelt die operative Tages- und Unterkunftsplanung.
- Eine automatisch erzeugte Routenzusammenfassung ist kein zweiter Reisename. Sie erscheint nur als Reisecharakteristik in der Uebersicht und aktualisiert sich mit dem aktiven Plan.
- `Reise anpassen` ist der freie, reiseweite Einstieg. Praezise Aenderungen an Etappe, Unterkunft oder Fixpunkt bleiben bei den jeweiligen Objekten.
- `Weitere Aktionen` enthaelt nur Hilfsaktionen der aktuellen Reise: Reise exportieren, Reise duplizieren und Hilfe.
- Arbeitsflaeche Desktop: Tagesliste, dominante Karte, Tagesdetails.
- Arbeitsflaeche Mobile: Karte zuerst, kompakter Tagesstreifen, Details darunter.
- Planungsdialog: Wunsch, automatische Pruefung, Routenfreigabe, Unterkunftsabgleich, Gesamtfreigabe.

## Sprache

- Titel benennen Ort und Zustand.
- Hilfetext erklaert nur den naechsten Schritt.
- Aktionen verwenden Verben: `Reise anpassen`, `Route bestaetigen`, `Gesamtplan veroeffentlichen`.
- `Aktueller Plan` und `Entwurf` bleiben immer klar getrennt.

## Design

- Ruhige, helle Kartenoberflaeche mit dunklem Navigationsrahmen.
- Gruen ist die einzige Aktionsfarbe.
- Etappenfarben dienen ausschliesslich der Karten-/Listen-Zuordnung.
- Ruhetage sind blau und zusaetzlich durch Form/Icon erkennbar.
- Systemschrift, kompakte Abstaende, 8–14 px Radien, kaum Schatten.

## Interaktion

- Klick auf Etappe fokussiert Karte und Tagesdetails.
- Klick auf Kartenlinie waehlt denselben Tag in der Liste.
- `Tage` und `Unterkuenfte` sind echte Arbeitskontexte: Der rechte Detailbereich zeigt jeweils nur die fuer diesen Kontext relevanten Aktionen.
- In `Unterkuenfte` steht auf der Karte der gewaehlte Uebernachtungsort im Fokus. Nur ankommende und abgehende Etappen bleiben dezent sichtbar, damit die Auswirkung eines Ortswechsels nachvollziehbar ist.
- Ein Klick auf eine Routenlinie wechselt in den Tageskontext; ein Klick auf einen Uebernachtungsmarker wechselt in den Unterkunftskontext.
- Ruhige Querverweise `Unterkunft dieses Tages ansehen` und `Angrenzende Etappen ansehen` verbinden beide Kontexte ohne doppelte Aktionslisten.
- Klick auf einen Ort oeffnet kontextbezogen `Neue Unterkunft suchen`, `Nacht hinzufuegen`, `Tagesrunde planen`, `Ab hier neu planen` und `Unterkunft ansehen`.
- Klick auf eine Routenlinie oeffnet `Direkt` bzw. `Kurvig & schoen`, `In Google Maps oeffnen`, `Etappe aendern`, `Zwischenziel hinzufuegen` und `Ab hier neu planen`.
- Die Routenart veraendert nur Streckenfuehrung und Fahrzeit der gewaehlten Etappe. Start, Ziel, Unterkunft und Folgetage bleiben gleich.
- Dieselben Routenaktionen sind nach der Auswahl eines Tages im rechten Detailbereich verfuegbar.
- Hotel und Alternative sind direkt verlinkt. Eine neue Unterkunft wird zuerst am gleichen Ort gesucht; erst danach in der nahen Umgebung. Bei einem Ortswechsel werden nur die angrenzenden Etappen neu geprueft.
- Karte und Liste sind zwei Einstiege in dieselben Planungsobjekte; keine Aktion veraendert den bestaetigten Plan direkt.
- Die Unterkunftsansicht ist eine kompakte Perspektive auf denselben Reiseplan und keine zweite Datenquelle.
- Fixpunkte sind farblich, mit Schloss und Text gekennzeichnet. Sie bleiben harte Planungsbedingungen, bis der User sie in einem eigenen Dialog explizit entsperrt.
- Gebuchte Unterkuenfte sind geschuetzt, duerfen aber als klar ausgewiesene Umbuchungsaufgabe vorgeschlagen werden.
- Vergleich ist erst nach der Erstellung eines Entwurfs aktiv und blendet dessen betroffene Etappen gestrichelt ueber den aktuellen Plan.
- Jede Tagesetappe kann direkt bei der Etappe in Google Maps geoeffnet werden. Der globale Export bietet ein GPX-Paket mit einer Datei je Fahretappe sowie eine KML-Datei der gesamten Reise inklusive Uebernachtungen und Fixpunkten.
- Der Planungsdialog fuehrt schrittweise und veraendert nie den aktuellen Plan.

Im normalen Betrachtungszustand bleibt die Schrittfolge verborgen. Sie erscheint erst nach einer konkreten Aenderungsaktion.

## Responsive und Accessibility

- Desktop ab 1100 px: drei Spalten.
- Tablet: Tagesliste und Karte, Details als unterer Bereich.
- Mobile: Karte bleibt im ersten Viewport; Tagesliste wird horizontal bedienbar.
- Fokusrahmen, semantische Buttons, Textlabels neben Farben, 44 px Touch-Ziele und reduzierte Bewegung werden beruecksichtigt.
