# Gemeinsame Reisebeschreibung – Build 20

## Zweck und Darstellung

Roadbook begleitet die Reise. Die Reisebeschreibung gibt bei Bedarf Orientierung zum Gesamtverlauf und wird zusammen mit dem veröffentlichten Plan aktualisiert.

Die Navigation bleibt Reisen → Reise → Tagesetappe sowie Mein Tagebuch. Unter der Reisekarte steht die standardmässig geschlossene Zeile „Reisebeschreibung“. Geöffnet enthält sie den gemeinsamen Kurztext und die Abschnitte des Reiseverlaufs. Planstand und Tagesetappen bleiben unabhängig vom Aufklappen erreichbar.

Verwendet werden native SwiftUI-Listen und DisclosureGroup, die Systemschrift, die vorhandene grüne Akzentfarbe und bestehende Abstände. Längere Texte wachsen vertikal, ohne feste Höhe oder Zeilenbegrenzung. iPhone und iPad behalten dieselbe Hierarchie. Native VoiceOver-Bedienung und Dynamic Type bleiben erhalten. Die Animation entspricht dem nativen Auf- und Zuklappen; eine Online-Aktualisierung schliesst die Beschreibung nicht.

## Gemeinsame Quelle

Der Kurztext kommt bereits aus `trip.characterText`. Neu liefert der Companion-Feed zusätzlich `narrativeSegments` mit ausschliesslich Titel und Text aus derselben Quelle wie die Web-Übersicht. Beim Balkan liegt sie in `trip.narrativeSegments`, beim bisherigen Spanienformat auf der obersten Ebene.

Die Begleitapp speichert beides im vorhandenen Offline-Reiseplan. Es gibt keine zweite, unabhängig gepflegte Beschreibung. Alte Feeds ohne Reiseabschnitte bleiben lesbar; ältere App-Versionen ignorieren das neue Zusatzfeld. Der bestehende ETag-Abgleich erkennt auch reine Textänderungen. Routen, Tagebuch, Buchungsstatus und Freischaltung werden dadurch nicht verändert.

Für die aufklappbare Ansicht ist einmalig Build 20 erforderlich. Spätere veröffentlichte Textänderungen kommen mit dem normalen Planabgleich.

## Prüfung und Auslieferung

74 Node-Tests bestanden, einschliesslich Abgleich beider Beschreibungsquellen und alter Daten ohne Reiseabschnitte. Der gezielte UI-Test auf iPhone 17 Pro und iPad Pro 11 Zoll bestand: anfänglich geschlossen, Kurztext und Reiseabschnitt aufklappen, neue veröffentlichte Texte bei geöffneter Ansicht automatisch empfangen, wieder zuklappen und Tagesetappen weiterhin erreichen. Die ersten Testläufe scheiterten an der Textauswahl bzw. der Scrollrichtung im Test; der abschliessende Lauf ist erfolgreich. Bildschirmdarstellung mit synthetischen Testtexten geprüft.

Release-Archiv und App-Store-Export 0.1.0 (20) erfolgreich. Paketintegrität und strenge Codesignatur bestätigt; Testmodus nicht im Release-Binary enthalten. IPA-SHA256: `d2e47e12639ddf7c0d08f93cfe2d0d0f0e3409b8d80ca0abeb82b23d6d338057`.

Der gemeinsame Feed ist produktiv: Commit `806dfc912fd43003f29ba2e7aeecb90e39a44d71`, Vercel-Deployment `dpl_BL7B4cpuruFYoa1RCbZjCPombraZ`, Status READY. Unter der bestehenden Produktionsadresse liefert er exakt die erwarteten Reisepläne mit fünf Balkan- und vier Spanienabschnitten. Keine fehlgeschlagene API-Anfrage in der anschliessenden Logprüfung; eine bestehende Node-Deprecation-Warnung bei HTTP 200 wurde beobachtet.

Archiv, IPA, Quellmanifest, Änderungspatch, Live-Feed und Prüfprotokolle liegen unter `companion/.build/description20/`. Build 20 wurde am 18. September um 10:00 Uhr erfolgreich hochgeladen. Apple-Verarbeitung abgeschlossen. Nach der vom Nutzer abgeschlossenen Freigabe zeigen beide bisherigen Testgruppen Build 20 „Im Test“; die interne Testeransicht meldet „Installiert 0.1.0 (20)“. Details in `Distribution/TESTFLIGHT.md`. Nach Ablehnung der Xcode-Betaversion wurde derselbe Quellstand mit regulärem Xcode 27.0 (`27A266a`) neu gebaut; das für TestFlight verwendete Archiv liegt unter `Roadbook-stable.xcarchive`, die IPA unter `export-stable/Roadbook.ipa`. Deren SHA256 lautet `e40b97c520e9c3e72eaf9229280f665a430e8fd5942f1141f3769b102034ed57`.
