# Beta-Texte – Arbeitsfassung

Stand 4. September 2026: Eine gekürzte Fassung der Beschreibung und Prüfanmerkungen einschliesslich Sicherungsfunktion ist in App Store Connect gespeichert; die Kontaktangaben ebenfalls. Dieser ausführlichere Testleitfaden bleibt die Arbeitsfassung für die Verteilung. Noch kein Build zur Beta-Prüfung eingereicht.

## Beta-App-Beschreibung

Roadbook begleitet unsere Motorradreisen auf iPhone und iPad. Zwei getrennte Reisepläne – Balkan und Spanien – zeigen Tagesetappen, Strecken auf der Karte, Hinweise und Unterkunftsvorschläge. Pfeile wechseln direkt zum nächsten oder vorherigen Reisetag. Navigationslinks öffnen die geplante Strecke in Google Maps.

Persönliche Erinnerungen und ausgewählte Fotos werden dem jeweiligen Reisetag zugeordnet und über die private iCloud-Ablage des eigenen Apple-Accounts abgeglichen. Es gibt kein gemeinsames Tagebuch. Änderungen am Reiseplan erfolgen in der separaten Planungs-Webapp; die Begleitapp lädt veröffentlichte Pläne automatisch oder auf Wunsch neu.

Gespeicherte Reisepläne bleiben offline lesbar. Kartenmaterial und Navigation benötigen eine Verbindung beziehungsweise eine separat vorbereitete Navigationsapp. Das Tagebuch benötigt beim kalten App-Start aktuell eine erfolgreiche iCloud-Prüfung. Fähren sind schematisch dargestellt; Unterkunftsvorschläge sind keine bestätigten Buchungen. Die App ersetzt keine Prüfung aktueller Strassensperrungen oder Verkehrsregeln.

## Was getestet werden soll

Bitte zunächst ausschliesslich entbehrliche Testeinträge und Testfotos verwenden:

1. Beide Reisen öffnen, Tageskarte vergrössern, mit den Pfeilen wechseln und Strecken-/Unterkunftshinweise aufklappen. Prüfen, dass Karte, Titel und Datum zusammenpassen.
2. Google-Maps-Link öffnen und danach zu Roadbook zurückkehren.
3. Eine Erinnerung mit Foto anlegen. Unter „Mein Tagebuch“ müssen Reise und Tagesetappe eindeutig erkennbar sein. Bearbeiten und nach Neustart wieder öffnen.
4. Bei zwei Geräten mit demselben iCloud-Account den Abgleich in beide Richtungen testen. Er erfolgt im Hintergrund und kann etwas dauern. Ein anderer Account darf diese Inhalte nicht sehen.
5. Reisepläne aktualisieren: persönliche Einträge dürfen nicht verschwinden. Die Karten beim Eintrag zeigen den aktuellen Plan, keine historische Streckenkopie.
6. Im Flugmodus den gespeicherten Reiseplan öffnen. Die bekannte Einschränkung beim kalten Tagebuchstart ist keine zugesagte Offline-Funktion.
7. Unter Einstellungen → Tagebuch sichern die auf dem Gerät vorhandenen Testinhalte exportieren. Die Datei enthält Texte und Fotos unverschlüsselt: nur am eigenen geschützten Speicherort ablegen. Dieselbe eigene Sicherung einlesen, die Vorschau prüfen und ausdrücklich bestätigen. Identische Inhalte dürfen dabei nicht verdoppelt werden. Zum Wechsel von Development auf TestFlight nur auf einem Gerät importieren, danach den privaten iCloud-Abgleich mit dem zweiten Gerät abwarten.

Bei Fehlern bitte Gerät, Betriebssystem, Reise, Tag und die Schritte nennen. Screenshots nach Möglichkeit ohne private Texte/Fotos; persönliche Inhalte sind für einen Fehlerbericht nicht nötig.

## App Review Notes (English draft)

Roadbook is an iPhone/iPad companion for a small private motorcycle travel test group. It contains two read-only itineraries (Balkan and Spain), daily maps, route notes, accommodation suggestions, and external navigation links. No app-specific account, subscription, payment, or reviewer demo credentials are required to browse the bundled itineraries.

To test: open either trip, select a day, expand its route/accommodation details, then use the day arrows. For journal testing, the device must be signed into iCloud with iCloud Drive available. Add a synthetic note and a selected photo to a day; find it under “Mein Tagebuch”. Notes and photo copies are stored in the signed-in user's private CloudKit database. There is no sharing feature or access to another traveller's journal.

Published itinerary updates are downloaded from our read-only HTTPS endpoint. No journal text or photos are uploaded to that endpoint. Maps use Apple MapKit; the Google Maps button opens an external navigation URL. Ferry lines are schematic. Accommodation entries are suggestions, not reservations.

Known limitations: no offline map tiles or in-app turn-by-turn navigation. A cold journal start currently requires a successful iCloud account check. Downloaded/bundled itineraries remain available without that check. Please use disposable test journal content during this beta.

**Distribution gate:** Production schema is deployed and owner-provided review/feedback contacts are saved in App Store Connect. A build upload for internal validation is not an external beta submission or an invitation. Complete backup/recovery verification, the safe device transition and real Production sync tests before external beta distribution. No personal contact values are stored in this draft.
