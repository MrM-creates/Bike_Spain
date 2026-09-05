# Datenschutz und Export-Compliance – technische Vorprüfung

Stand 3. September 2026. Dies ist eine technische Bestandsaufnahme, keine abgeschlossene rechtliche Erklärung oder App-Store-Datenschutzkennzeichnung.

Ergänzung 4. September (Build 9): Nutzer können eine unverschlüsselte JSON-Sicherung ihrer lokal verfügbaren Texte und Fotokopien über den System-Dateidialog exportieren. Die App wählt keinen Cloudanbieter oder geteilten Ordner und überträgt keine Sicherung automatisch. Der Nutzer entscheidet über den Speicherort. Import erfolgt nur nach Dateiauswahl, Inhaltsprüfung, Erklärung „meine eigene Sicherung“ und Bestätigung; anschliessend privater CloudKit-Abgleich. Exportdateien unterliegen ausserhalb der App den Berechtigungen des gewählten Speicherorts. Diese Funktion muss in der abschliessenden Datenschutzerklärung mit erläutert werden. Neu hinzugekommen sind FileDocument/FileHandle und ImageIO-Validierung; keine eigene Verschlüsselung und keine neuen SDKs.

## Datenflüsse im aktuellen Quellcode

| Daten | Verarbeitung/Ziel | Stand |
| --- | --- | --- |
| Öffentliche Reisepläne | Mitgeliefertes JSON, lokaler Cache, GET an den eigenen HTTPS-Plan-Endpunkt | Keine Tagebuchinhalte/Account-ID im Request |
| Notizen, Tageszuordnung, ausgewählte Fotokopien | SwiftData lokal und private CloudKit-Datenbank im eigenen Container | Kein CKShare, keine öffentliche/geteilte Tagebuchdatenbank |
| CloudKit-Accountkennung | SHA-256 lokal als Ordnername zur Trennung der lokalen Stores | Nicht an den Planungsserver übertragen |
| Fotos | Auswahl über PhotosPicker, neue JPEG-Kopie bis 2400 Pixel | Keine pauschale Fotobibliotheksfreigabe; EXIF/GPS nicht übernommen; sichtbare Bildinhalte können natürlich persönliche Informationen enthalten |
| Karten | Apple MapKit | Keine eigene Standortfreigabe oder Trackingfunktion implementiert |
| Navigation/Unterkünfte | Externe Links nach Nutzeraktion | Datenschutz des jeweiligen externen Dienstes beachten |
| Technische Anfragedaten beim Planabruf | Hosting beim Plan-Endpunkt (Vercel) | Zugriff/Retention von IP-Adressen und Betriebslogs noch konkret prüfen |

Keine Drittanbieter-SDKs, Werbung oder Analytics-SDKs in der nativen App gefunden. Private Tagebuchdaten werden nicht an ChatGPT oder den Planungsserver geschickt. Keine Behauptung einer zusätzlichen Ende-zu-Ende-Verschlüsselung.

## PrivacyInfo.xcprivacy

Im App-Bundle vorhanden und syntaktisch geprüft:

- `NSPrivacyTracking=false`, keine Tracking-Domains.
- `NSPrivacyAccessedAPITypes=[]`: keine direkten Required-Reason-API-Aufrufe in der nativen Quelle gefunden (insbesondere keine UserDefaults/@AppStorage/@SceneStorage-Nutzung). Spurs UserDefaults-Grund wurde deshalb nicht kopiert. Bei neuen APIs oder SDKs neu prüfen.
- `NSPrivacyCollectedDataTypes` wurde noch **nicht** ausgefüllt. Das bedeutet keine fertig geprüfte „keine Daten erhoben“-Erklärung. Hosting-/Datenerhebungsklärung vor finaler Kennzeichnung abschliessen.

Apple unterscheidet zwischen eigenen/Partner-Datenerhebungen und Daten, die Apple-Frameworks selbst erheben. Nicht pauschal sämtliche private CloudKit-Nutzung als Entwicklerdatenerhebung deklarieren, aber ebenso wenig ungeprüft „keine Daten erhoben“ wählen. Insbesondere das Hosting und etwaige später aktivierte Diagnostik berücksichtigen.

## Verschlüsselung

4. September: Nutzer hat ausdrücklich freigegeben, Apples Auswahl „Keinen der oben genannten Algorithmen“ für Build 9 und 10 zu bestätigen (ausschliesslich Apple-Systemfunktionen, keine zusätzliche Kryptografie). Für Build 9 gespeichert, Portalstatus danach „Bereit zur Übermittlung“. Build 10 folgt nach Verarbeitung. Keine Änderung an Verträgen oder Datenschutzkennzeichnung; Info.plist bleibt in diesen bereits gebauten Paketen unverändert.

Gefunden: System-HTTPS, CloudKit, OS-Dateischutz und CryptoKit SHA-256 für einen lokalen Account-Ordnernamen. Keine selbst implementierten Verschlüsselungsalgorithmen oder Kryptobibliotheken gefunden. Diese technische Grundlage spricht für eine Prüfung der Apple-Ausnahme für Betriebssystem-Kryptografie; sie ersetzt nicht die Erklärung des Accountinhabers.

`ITSAppUsesNonExemptEncryption` ist derzeit nicht gesetzt. Vor Upload/Weitergabe die Apple-Fragen mit dem Verantwortlichen beantworten und ggf. den zutreffenden Wert für spätere Builds festlegen. Nicht „keine Verschlüsselung“ behaupten. Keine Verträge, Händlerstatus-Angaben oder Export-Erklärungen ungefragt bestätigen.

## Noch offen

- Hosting-Logging/Retention und tatsächlichen Entwicklerzugriff klären; darauf basierend Datentypen, Zwecke und Verknüpfung bestimmen.
- Verantwortlichen, erreichbare Datenschutz-/Feedback-Kontaktadresse und gegebenenfalls veröffentlichte Datenschutzerklärung festlegen. Keine fremde oder erfundene URL verwenden.
- Produktionstest für getrennte Apple-Accounts und datensicheren Umstieg abschliessen.
- Beta-Texte und Datenschutzangaben nach tatsächlichem Testergebnis aktualisieren.

## Offizielle Grundlagen

- [Apple: App privacy details](https://developer.apple.com/app-store/app-privacy-details/)
- [Apple: Privacy manifests](https://developer.apple.com/documentation/BundleResources/describing-data-use-in-privacy-manifests)
- [Apple: Private CloudKit database](https://developer.apple.com/documentation/cloudkit/ckcontainer/privateclouddatabase)
- [Apple: Export compliance overview](https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance/)
- [Apple: ITSAppUsesNonExemptEncryption](https://developer.apple.com/documentation/bundleresources/information-property-list/itsappusesnonexemptencryption)
