# Übergabe der Balkanroute an die Begleitapp

Stand: 3. September 2026

## Ablauf

1. Etappe bearbeiten oder Reise neu planen: bestehende automatische Quellenprüfung läuft, danach wird ein lokaler Entwurf mit der ursprünglichen Online-Version gespeichert.
2. `Plan veröffentlichen` öffnet die Freigabe mit PIN. `Jetzt veröffentlichen` sendet Route und Unterkünfte an den bestehenden geschützten Publisher.
3. Der Publisher wählt die Reise über eine feste ID-/Dateizuordnung. Balkan schreibt ausschliesslich `data/trip-adria-2026.js`; Spanien behält den bestehenden Weg. Fixpunkte, ursprüngliche Reise und Etappen-IDs bleiben erhalten.
4. Ein Git-Commit startet die bestehende Vercel-Bereitstellung. Die Oberfläche zeigt zunächst `Veröffentlichung wird bereitgestellt` – nicht bereits eine bestätigte Übertragung.
5. `/api/companion-plan` liefert aus der bereitgestellten Version beide Roadbooks. Die Oberfläche bestätigt die Übergabe erst, wenn dieser Feed die passende Reise und mindestens die neue Version enthält.
6. Die Begleitapp lädt den Feed beim Öffnen/manuellen Aktualisieren und behält einen Offline-Cache. Kein Push und kein App-Store-Update pro Routenänderung.

## Schutz und Grenzen

- PIN, feste Dateizuordnung, zwingende Ausgangsversion für Balkan, erneuter Blob-Vergleich gegen den Git-Head und nicht-erzwungener Branch-Update schützen andere Reisen und neuere Änderungen.
- Bei Konflikten bleibt der lokale Entwurf erhalten. `Online-Stand ansehen` öffnet den veröffentlichten Plan getrennt. Kein automatisches Zusammenführen oder Zurücksetzen.
- Unveröffentlichte Altentwürfe werden erhalten; unbekannte Ausgangsversionen dürfen nicht überschreibend veröffentlicht werden.
- Geänderte Fahretappen benötigen die aktuelle Prüfversion, offizielle und unabhängige Motorradquelle sowie dokumentierten Streckenabgleich. Die vorhandene Prüfung bleibt zuständig; die Veröffentlichung ist keine neue Live-Recherche. Die Prüfmetadaten sind derzeit nicht kryptographisch signiert (bestehendes PIN-Vertrauensmodell).
- Die aktuelle generische Planung behält die Anzahl Kalendertage bei. IDs bleiben an ihren Kalendertagen gebunden. Strukturelles Einfügen/Löschen von Tagen ist nicht Bestandteil dieser Übergabe.
- Unterkunftsdaten werden gemeinsam übertragen. Für jede Nacht muss genau eine passende Unterkunft vorhanden sein. Eine Umplanung mit anderen Übernachtungsorten wird bis zum Unterkunftsabgleich abgewiesen, statt alte Hotels am falschen Ort zu veröffentlichen. Die Automatisierung dieses Balkan-Unterkunftsabgleichs ist nicht Teil dieses Schritts.
- Persönliche Tagebuch-/Fotofelder sind nicht Bestandteil des Publish-Payloads oder Feeds. Es wird kein CloudKit-Container berührt. Persönliche Erinnerungen sind in der Begleitapp weiterhin separat gespeichert.
- Die bestehende Web-Kartengeometrie wird durch diesen Publisher nicht neu berechnet. Änderungen an Ortsankern können eine separate Aktualisierung der statischen GeoJSON-Kartengeometrie erfordern; Tageslinks im Feed verwenden den geprüften Google-Maps-Link.

## Tests

- `node --test tests/*.test.js`: 37 Tests bestanden, einschliesslich bestehender Spanien-Publish-Tests.
- Neue Integrationstests: Balkan-Payload → geschützter Handler → simuliertes Git-Commit → serialisierte Reisequelle → Companion-Feed; ID-, Fährzufahrts- und Web-Modell-Parität.
- Abgewiesene Fälle ohne Git-Schreibzugriff: falsche PIN, unbekannte Reise, fehlende/veraltete Ausgangsversion, parallele Änderung, doppelte IDs, fehlende Quellenprüfung, veränderter Fixpunkt, unpassende Unterkunft, unsicherer Maps-Link.
- Browser-Durchlauf auf isoliertem Localhost: Tag 2 ändern, prüfen/speichern, Reload als lokaler Entwurf, falsche PIN, erfolgreiche Freigabe, verzögerte Bereitstellung, bestätigter Feed, Reload des neuen Online-Stands. Keine Konsolenfehler.
- Der lokale Fixture-Server (`node scripts/test-publication-server.js`) verwendet ausschliesslich flüchtige Testdaten, simulierte GitHub-/Rechercheantworten und eine ausdrücklich nicht geheime Test-PIN. Keine echten Reiseänderungen, KI-Kosten oder Repository-Schreibzugriffe.
- Die reale native Cloud-Synchronisierung wird hier weder aktiviert noch getestet.

## Bereitstellung

Produktionsnachweis wird nach Deployment ergänzt. Die vorhandenen Reiseinhalte bleiben bei der Bereitstellung dieser Funktion unverändert.
