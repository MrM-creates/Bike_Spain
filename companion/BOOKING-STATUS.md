# Gemeinsamer Buchungsstatus – Build 17

## Automatischer Abgleich bei geöffneter App – Build 19

Das bisherige Aktualisieren beim Start und bei der Rückkehr in die App genügte nicht für zwei gleichzeitig geöffnete Geräte. Bestätigter Nutzerbefund: Der Server lieferte Tag 1 als Angefragt; Herunterziehen auf dem iPad übernahm den Status korrekt. Solange Roadbook aktiv ist, fragt Build 19 deshalb sofort und anschliessend alle 15 Sekunden nach Änderungen. SwiftUI beendet den Abruf beim Wechsel in den Hintergrund und startet ihn bei der Rückkehr neu. Das gilt auch für Mitreisende ohne PIN. Ein abgebrochener Hintergrundwechsel wird nicht als Netzfehler angezeigt.

Der Companion-Endpunkt liefert einen aus dem gesamten Feed berechneten ETag. Die App sendet ihn erst nach erfolgreicher Validierung und Speicherung mit; ein unveränderter Stand ergibt HTTP 304 ohne Reiseplandaten. Eine neue Version wird weiterhin vollständig validiert, vor Rückschritten geschützt, gespeichert und mit ausstehenden Buchungsbestätigungen abgeglichen. Bei Offline-Fehlern bleibt der vorhandene Plan erhalten. Das Schreiben und die automatische Veröffentlichung über GitHub/Vercel bleiben unverändert; die Aktualisierung auf anderen Geräten erfolgt spätestens beim nächsten erfolgreichen Abruf nach der Server-Veröffentlichung, nicht als sofortiger Push.

Die Korrektur wurde isoliert vom gleichzeitig bearbeiteten Reiseplan umgesetzt. Der gebündelte Offline-Startbestand entspricht Build 18; die bereits produktiven neueren Reiseplandaten werden online geladen. Tagebuch, Schlüsselbund und CloudKit-Schema unverändert.

Prüfung: vier Feed-/HTTP-Tests sowohl auf der App-Basis als auch auf dem aktuellen Produktionsstand bestanden. Live HTTP 200 mit ETag und anschliessend HTTP 304 ohne Datenkörper bestätigt (Feed 4.458.721 Bytes). iPhone: automatischer Empfang von Tag 1 und Rückkehr aus dem Hintergrund bestanden (53,049 s); bestehendes Speichern bei verzögertem Feed bestanden (79,739 s). iPad: automatischer Empfang und Rückkehr bestanden (63,865 s). Screenshots geprüft. Tests simulieren die Änderung des anderen Geräts ohne echte Unterkunftsänderung. Release-Archiv, Paketintegrität und strenge Signatur geprüft; Test-Netzwerkcode fehlt im Release. IPA-SHA256: `2eae84d3337c9082f276e1d7941581946346a49636f8e7cbd9c35fa84d5db5ba`. Nachweise unter `companion/.build/booking19/`.

Server-Erweiterung auf dem aktuellen main-Stand bereitgestellt: Commit `502a4437fcba2f21f941b317db657668824e921d`, Deployment `dpl_9ZRnUPpfJuTzfW97Lw5cB4nE3i85`, production READY. Die vorher bereits publizierten Ersatzunterkünfte/Routen und der Tag-1-Status bleiben dabei erhalten.

## Anzeigekorrektur – Build 18

Eine vom Server bestätigte Änderung erscheint sofort als Hauptstatus beim Hotel. Der nachlaufende Feed wird nur noch mit „Gespeichert · wird für Mitreisende aktualisiert.“ erklärt; die doppelte Zeile „Gewünschter Status“ entfällt. Bei verlorener Serverantwort bleibt der bisherige Status sichtbar, bis „Status prüfen“ das Ergebnis bestätigt. Gleiche Darstellung für alle Nächte derselben Unterkunft, mit Kontextprüfung gegen Hotelwechsel. PIN-Freischaltung bleibt geräteweise im bestehenden Schlüsselbund gespeichert.

Geprüft am 10. September: iPhone verzögerte Veröffentlichung über zwei Nächte (60,839 s) und verlorene Antwort ohne erneutes Schreiben (41,245 s) bestanden; iPad verzögerte Veröffentlichung (72,630 s) bestanden. Screenshots beider Formate geprüft. Release-Archiv, Paketintegrität und strenge Signatur mit macOS-Vertrauenskette erfolgreich. Eigener Production-CloudKit-Container und Berechtigungen unverändert. IPA-SHA256: `430edb299558bc1e0f063b4b14edd14299d9b209c5976e3f9a1d4ed561038b37`. Quellenmanifest und Nachweise unter `companion/.build/booking18/`.

Der öffentliche Feed bestätigte die vom Nutzer vorgenommene Änderung für Balkan-Tag 1 als „Angefragt“, Planversion `2026-09-10T11:33:39.165Z`. Für diese Korrektur keine echten Unterkunftsstatus geschrieben und kein Backend geändert. TestFlight-Verteilung siehe [Distribution/TESTFLIGHT.md](Distribution/TESTFLIGHT.md).

## Zweck und Bedienung

Roadbook zeigt allen Mitreisenden den veröffentlichten Buchungsstatus der vorgesehenen Unterkunft. Der Reiseverantwortliche kann Offen, Angefragt oder Gebucht direkt in der Tagesetappe einstellen. Neue Hotels, Alternativen, Reisedaten und Routen werden weiterhin in der Planung bearbeitet. Fähren und Kabinen bleiben lesend.

Die Navigation behält Reisen → Tagesetappe und Mein Tagebuch. In der Tagesetappe steht im Abschnitt Unterkunft immer der Hotelname mit ausgeschriebenem Status und Symbol. Details/Alternative bleiben aufklappbar. Nach Freischaltung in Einstellungen → Buchungsstatus bearbeiten erscheint darunter Buchungsstatus ändern. Der Dialog nennt Hotel und gesamten Aufenthalt, bietet drei Status und eine primäre Aktion Status speichern. Eine Änderung gilt für alle Nächte derselben Unterkunft.

Gestaltung: native SwiftUI-Listen/Formulare, vorhandene Roadbook-Farben, Systemschrift und semantische Hintergründe. Keine zusätzliche Navigation oder Animation. iPhone und iPad verwenden denselben scrollbaren Ablauf. Status ist über Text und VoiceOver zugänglich, unabhängig von Farbe. Fehler bleiben am Bearbeitungsdialog sichtbar; Schliessen kehrt zur Etappe zurück. Ab Build 18 zeigt die Hauptzeile den vom Server bestätigten neuen Status sofort, auch solange der Feed noch nachläuft. Ein kleiner Hinweis darunter lautet „Gespeichert · wird für Mitreisende aktualisiert.“ Die Bestätigung gilt nur für dieselbe Unterkunft mit übereinstimmendem Kontext. Ohne bestätigte Serverantwort bleibt der bisherige Status mit „Speichern noch nicht bestätigt“ und der Aktion „Status prüfen“ sichtbar.

## Datenweg und Berechtigung

`POST /api/update-booking-status` prüft bei jeder Anfrage die bestehende ROADBOOK_PUBLISH_SECRET-PIN. `action: authorize` prüft nur die Freischaltung; `action: check` liest nur den aktuellen Unterkunftsstatus aus der Repository-Quelle. Ohne Aktion sind ausschliesslich Reise-ID, Unterkunfts-ID, Ausgangsrevision und neuer Status zulässig. Andere Felder, einschliesslich Tagebuch- und Fotodaten, werden abgewiesen. PINs werden nicht in das App-Paket oder den Feed eingebaut.

Die native Freischaltung liegt als nicht synchronisierender Keychain-Eintrag mit WhenUnlockedThisDeviceOnly auf dem jeweiligen Gerät. Sperren entfernt ihn. Berechtigt ist, wer die Admin-PIN kennt; es handelt sich nicht um eine personenbezogene Kontorolle. Mitreisende ohne PIN können den Status lesen, aber nicht schreiben. PIN-Wechsel auf dem Server macht alte Freischaltungen unwirksam.

Der Server liest die feste, zur Reise gehörende Datei am konfigurierten GitHub-Branch (standardmässig main) und aktualisiert nur das booking-Feld sowie die Planversion. Der atomare SHA-Vergleich der GitHub Contents API schützt gleichzeitige Änderungen. Das neue Deployment liefert den Status an Admin-Web-App und Companion-Feed. Keine Live-Push-Zusage: Laden beim Start, Rückkehr in den Vordergrund, Herunterziehen in Reise/Etappe oder Aktualisieren in den Einstellungen übernimmt den bereitgestellten Stand.

Der Feed liefert für jede Unterkunft die stabile ID, Statuskennung, Aufenthaltsdaten, Bearbeitbarkeit sowie Revision und Kontext-Hash. Die Revision bindet Hotelname, Link, Daten, bisherigen Status und Planversion. Damit werden auch alte Ansichten nach zwischenzeitlichem Ändern und Zurückändern abgewiesen. Ein anderer geänderter Reiseabschnitt kann ebenfalls eine vorherige Aktualisierung nötig machen. Bestehende App-Versionen ignorieren zusätzliche Felder; alte Feeds bleiben lesbar, bieten aber keine Statusbearbeitung.

Beide bisherigen Publisher verlangen jetzt zwingend die Online-Ausgangsversion. Ein alter Admin-Entwurf wird vor der Veröffentlichung mit Konflikt abgewiesen und bleibt lokal erhalten. Er wird nicht automatisch mit neuen mobilen Buchungen zusammengeführt. Der ältere Spanien-Veröffentlichen-Button sendet die Ausgangsversion jetzt ebenfalls mit.

## Unterwegs und private Daten

Speichern benötigt Internet. Vor dem Senden wird nur die ausstehende Statusänderung lokal atomar gespeichert. Eine bestätigte Serverantwort bedeutet gespeichert und wird ab Build 18 direkt als neuer Hotelstatus angezeigt; die Verteilung im gemeinsamen Feed kann noch nachlaufen. Erst der passende oder neuere Feed bestätigt den Abgleich. Bei verlorener Antwort kann Status prüfen den Repository-Stand ohne erneutes Schreiben abfragen. Es gibt keine automatische Offline-Schreibwarteschlange.

Tagebuchmodelle, private CloudKit-Ablage, Fotos und Tagebuchsicherung werden nicht geändert. Die neue Schnittstelle besitzt keinen Zugriff auf diese Daten. Buchungsstatus sind wie bisher Teil des derzeit öffentlichen Reiseplans. Der Status ist eine manuelle Kennzeichnung, keine Buchung beim Hotel.

## Prüfung und Bereitstellung

Backend-/Datenprüfung: 67/67 Node-Tests bestanden. Sechs neue Tests prüfen beide Reisen, mehrnächtige Aufenthalte, gezielte Feldänderung, Freischaltung, private/unerlaubte Felder, veränderte Hotels/Daten, gleichzeitige Schreibzugriffe, Rücksetzen auf Offen, Fährschutz, lesende Statusabfrage und Schutz beider bisherigen Publisher. Vier veraltete Katalog-Erwartungen wurden an die bereits zuvor gespeicherten reinen Fahrzeiten/Planungshinweise angepasst; keine Reisedaten für diesen Schritt verändert.

Simulator-Build und Swift-Planprüfung erfolgreich. iPhone 17 Pro: 5/5 Tests bestanden (319,427 Sekunden): Leseransicht, falsche/richtige PIN, Status für mehrere Nächte, geändertes Hotel, verzögerter Feed und verlorene Serverantwort. iPad Pro 11 Zoll: Leseransicht bestanden (38,014 Sekunden); Bearbeiten über mehrere Nächte nach Anpassung des Test-Scrollens bei sichtbarer Tastatur bestanden (80,416 Sekunden). Screenshots beider Formate geprüft. UI-Tests verwenden ausschliesslich synthetische Netzwerkantworten und den isolierten Test-Tagebuchstore. Echte Hotelstatus wurden nicht verändert.

Release-Archiv und lokaler TestFlight-Export erfolgreich. IPA-Integrität und strenge Signatur an frisch entpackter Kopie geprüft. Build 17, eigener Production-CloudKit-Container, Production-Push, get-task-allow=false und beta-reports-active=true bestätigt. Die Test-Netzwerkimplementierung und Test-PIN fehlen im Release-Binary. IPA-SHA256: d891353401ee589ad94ec912f711dbc3ccbc5fbf95635cd3f69747a575efe8ca. Artefakte liegen in companion/.build/booking17/. Eine erste Exportanfrage mit automatischer Profilaktualisierung wurde von der automatischen Freigabeprüfung abgewiesen; der anschliessende Export ohne diese Option war erfolgreich. Eine erste Signaturprüfung auf der Desktop-Entpackung meldete Finder-Metadaten; die unveränderte IPA wurde erneut ohne diese Metadaten nach /tmp entpackt und erfolgreich streng geprüft.

### Server-Bereitstellung

- URL: https://motorrad-roadbook-spanien-2026.vercel.app/
- Target: production; Status: READY.
- Commit: cec3f7a31e7d65d6392586c39440e87b63c9fe62 (separate Server-Übernahme auf den aktuellen main-Stand).
- Deployment: dpl_6FVLmbdggJsUU8cbLdmoHthVG5od; Framework: statisches HTML/JS mit Node-Funktionen.
- 23 gezielte API-/Feed-/Publisher-Tests auch auf der isolierten Produktionsbasis bestanden.
- Live-Feed HTTP 200 und exakt gleich dem App-Startbestand; beide Reisen unverändert. Pro Reise 28 bearbeitbare Unterkunftsnächte, die Fährnacht bleibt gesperrt.
- Authentifizierungsanfrage ohne PIN: HTTP 401; GET auf Schreibendpunkt: HTTP 405.
- Unmittelbare Logprüfung: ein Node-24-DeprecationWarning zu url.parse() bei erfolgreichem HTTP 200; keine beobachtete fehlgeschlagene Funktionsausführung. Kein Nachweis dauerhafter Fehlerfreiheit. Drains/Langzeitmonitoring nicht verändert.
- Keine authentifizierte Änderung eines echten Hotels für einen Produktionstest vorgenommen.

Build 17 benötigt sowohl den neuen Backend-Endpunkt/Feed als auch ein App-Update. Der bisher verteilte Build 16 bietet keine Bearbeitung. Keine neue CloudKit-Migration erforderlich.

### TestFlight-Upload

Build 17 wurde am 10. September 2026 um 13:20 Uhr Europe/Zurich erfolgreich aus dem geprüften Archiv zu App Store Connect hochgeladen (Upload succeeded, EXPORT SUCCEEDED). Die Apple-Anmeldung wurde vom Nutzer per Passkey bestätigt. Apple zeigt die Verarbeitung als Abgeschlossen; Build-ID fe477121-d0f8-498e-9cd5-165c6fc00775. Deutsche Testhinweise gespeichert. Der Nutzer hat die Exportangabe selbst bestätigt; das Portal zeigt Gesichert. Die automatische Sicherheitsprüfung verlangte eine ausdrückliche Empfängerfreigabe für die beiden bestehenden Gruppen. Nach Nutzer-Ja wurden „Roadbook – eigener Gerätetest“ und „Roadbook – Anna“ zugeordnet. Die TestFlight-Benachrichtigung wurde nach separater Nutzerzustimmung ausgelöst. Beide Gruppenseiten zeigen Build 17 um 13:27 Uhr „Im Test“, jeweils 1 Tester:in, Ablauf in 90 Tagen. Echte Installation und Statusänderung auf persönlichen Geräten noch nicht bestätigt.
