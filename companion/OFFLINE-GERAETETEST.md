# Offline-Gerätebefund – 18. September 2026

Der Nutzer bestätigt nach Build 23: App vollständig geschlossen, Flugmodus
eingeschaltet, App erneut geöffnet – alles funktioniert. Damit ist der
zuvor nur vermutete Fehler beim Offline-Neustart auf diesem Gerät nicht
reproduziert. Die pauschale Aussage einer Umsetzungslücke war nicht belegt.

Eine vorsorglich begonnene Änderung an der Kontoverwaltung wurde vollständig
zurückgenommen. Journal.swift und RoadbookApp.swift stimmen per SHA-256 mit
dem verteilten Build 23 überein. Keine neue Version hochgeladen, keine
Änderung an persönlichen Daten, Konten oder Cloud-Schema.

Anschliessend bestätigt der Nutzer den vollständigen Ablauf auf seinen
Geräten: Auf dem iPad offline einen Eintrag erstellt, App geschlossen und
erneut geöffnet; der Eintrag bleibt vorhanden. Nach Rückkehr in den
Online-Modus bleibt der Eintrag auf dem iPad erhalten und erscheint auch
auf dem iPhone. Damit sind lokale Speicherung, Offline-Neustart und der
anschliessende tatsächliche iCloud-Abgleich für diesen Eintrag bestätigt.
Ob der getestete Eintrag Fotos enthielt, wurde nicht angegeben. Keine
Aussage zu Kontowechseln, gleichzeitigen Bearbeitungskonflikten oder voller
iCloud-Ablage aus diesem Test ableiten.

Bereits vorhandene Codeprüfung: Einträge/Fotokopien werden mit
ModelContext.save lokal gespeichert, CloudKit gleicht im Hintergrund ab.
Ein erneuter Zusatzlauf des bestehenden synthetischen Speichertests wurde
nicht abgeschlossen: macOS hatte eine benötigte Quelldatei ausgelagert;
der darauf wartende Prozess wurde beendet. Der oben beschriebene echte
Gerätetest wurde vom Nutzer durchgeführt, nicht vom Agenten automatisiert.
