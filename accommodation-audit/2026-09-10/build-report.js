const fs = require('node:fs');
const path = require('node:path');
const { readPublishedTrip } = require('../../lib/published-trips');
const root = path.resolve(__dirname, '../..');
const trip = readPublishedTrip(fs.readFileSync(path.join(root, 'data/trip-adria-2026.js'), 'utf8'), 'trip_adria_2026');
// Manuell abgelesene Buchungsangebote; dieses Skript führt keine Liveprüfung durch.
const observations = [
  ['innsbruck-mutters', 'available', 168, 'Koi mit Balkon; Frühstück; kostenlose Stornierung vor 21.09.2026.'],
  ['lienz', 'available', 158, 'Comfort Doppelzimmer; ohne Frühstück; kostenlose Stornierung bereits vor 11.09.2026.'],
  ['graz-west', 'available', 117, 'Superior Doppelzimmer; Frühstück zusätzlich; kostenlose Stornierung vor 25.09.2026.'],
  ['ljubljana-ring', 'available', 109, 'Doppelzimmer mit Zustellbett, Belegung zwei Erwachsene; Frühstück; kostenlose Stornierung vor 24.09.2026.'],
  ['senj', 'available', 66, 'Ganzes Apartment; kostenlose Stornierung vor 14.09.2026.'],
  ['zadar', 'unavailable_on_linked_platform', null, 'Booking zeigt für 29.09.–01.10.2026 keine verfügbaren Zimmer; sämtliche dargestellten Kategorien nicht verfügbar.'],
  ['sibenik-apartment', 'available', 214, 'Apartment mit einem Schlafzimmer. Angezeigter Mitgliederpreis: Erstattung durch Booking.com vor 27.09.2026; kein gewöhnlicher kostenloser Stornotarif. Nicht erstattbarer Tarif CHF 195.'],
  ['makarska-base', 'unavailable_on_linked_platform', null, 'Airbnb-Buchungsfeld: „Dieser Zeitraum ist nicht verfügbar“, bei 03.–06.10.2026 und zwei Gästen. Allgemeine Stornotexte sind trotzdem sichtbar und beweisen keine Buchbarkeit.'],
  ['dubrovnik-lapad', 'available', 352, 'OSCAR Suite; datiertes Angebot mit Gesamtpreis und Reservieren-Schaltfläche; kostenlose Stornierung vor 01.10.2026.'],
  ['kotor-dobrota', 'available', 359, 'Datiertes Angebot mit Gesamtpreis und Reservieren-Schaltfläche; kostenlose Stornierung vor 04.10.2026. Sichere Motorradabstellung weiterhin ungeklärt.'],
  ['ston-return', 'unavailable_on_linked_platform', null, 'Booking zeigt für 13.–14.10.2026 keine verfügbaren Zimmer; Apartment mit Meerblick nicht verfügbar.'],
  ['urbino-country', 'available', 166, 'Country-Apartment; datiertes Angebot mit Gesamtpreis und Reservieren-Schaltfläche; kostenlose Stornierung vor 14.10.2026.'],
  ['ravenna', 'available', 131, 'Doppelzimmer mit Frühstück, kostenlos stornierbar vor 15.10.2026. Günstigerer Tarif CHF 121 nicht kostenlos stornierbar.'],
  ['arqua-petrarca', 'available', 263, '45-m²-Apartment; kostenlos stornierbar vor 17.10.2026. Nicht erstattbarer Tarif CHF 237.'],
  ['iseo', 'available', 242, 'Ca’ Nildes; datiertes Angebot mit Gesamtpreis und Reservieren-Schaltfläche; kostenlose Stornierung vor 15.10.2026. Inserat nennt eine separat zu entrichtende Kurtaxe.'],
  ['como-lazzago', 'available', 190, 'Superior Apartment; angezeigter Mitgliederpreis; kostenlose Stornierung vor 08.10.2026.']
];
// Unterkunfts-ID aus dem tatsächlichen Datensatz auflösen; Namen nicht als neue IDs erfinden.
observations.find(x => x[0] === 'sibenik-apartment')[0] = trip.accommodations.find(x => x.currentFirstChoice.startsWith('My Adriatic Place')).id;
const affectedDays = { zadar: [6, 8], 'makarska-base': [10, 13], 'ston-return': [20, 21] };
const rows = observations.map(([id, status, displayedTotalCHF, evidence]) => {
  const stay = trip.accommodations.find(x => x.id === id);
  if (!stay) throw new Error(`Unbekannte Unterkunft ${id}`);
  return { id, name: stay.currentFirstChoice, checkIn: stay.startDate, checkOut: stay.endDate, adults: 2, units: 1, status, displayedTotalCHF, sourceUrl: stay.currentFirstChoiceUrl, evidence, affectedDayNumbers: affectedDays[id] || [] };
});
const alternatives = [
  { id: 'zadar', status: 'unavailable_on_linked_platform', displayedTotalCHF: null, evidence: 'Booking: beide dargestellten Apartmentkategorien für 29.09.–01.10.2026 nicht verfügbar.' },
  { id: 'makarska-base', status: 'available', displayedTotalCHF: 241.50, evidence: 'Airbnb bietet für 03.–06.10.2026, zwei Gäste, den erstattungsfähigen Tarif CHF 241.50; kostenlose Stornierung vor 02.10.2026. Voreingestellt ist der nicht erstattungsfähige Tarif CHF 217.45 (nur anfängliches 24-Stunden-Fenster). Reservieren-Schaltfläche vorhanden.' },
  { id: 'ston-return', status: 'unavailable_on_linked_platform', displayedTotalCHF: null, evidence: 'Booking: beide dargestellten Apartments für 13.–14.10.2026 nicht verfügbar.' }
].map(item => { const stay = trip.accommodations.find(x => x.id === item.id); return { ...item, name: stay.currentAlternative, sourceUrl: stay.currentAlternativeUrl, checkIn: stay.startDate, checkOut: stay.endDate, adults: 2 }; });
const report = {
  checkedOn: '2026-09-10', tripId: trip.trip.id, planVersion: trip.publishedVersion,
  method: 'Live-Browserprüfung der verlinkten Booking-/Airbnb-Inserate mit exakten Aufenthaltsdaten, zwei Erwachsenen und einer Unterkunft. Angebote und Verfügbarkeitsmeldungen im gerenderten Buchungsbereich abgelesen; kein Buchungsabschluss.',
  scope: '16 Unterkünfte an Land plus drei vorhandene Alternativen; Fährkabine 14.–15.10. separat, nicht geprüft.',
  limitation: 'Nichtverfügbarkeit gilt für den geprüften Buchungsweg. Keine Aussage über andere Kontingente oder Direktanfragen. Preise sind angezeigte Momentaufnahmen; keine Reservierung oder Stellplatzzusage. Der Abgleich mit Routen bezieht sich auf den lokalen Planstand; der Abruf der öffentlichen Produktionsdatei war technisch blockiert.',
  observations: rows, alternatives,
  routeImpact: Object.entries(affectedDays).map(([id, numbers]) => ({ accommodationId: id, days: numbers.map(number => {const d=trip.days.find(x=>x.day===number); return { day:number,id:d.id,title:d.title,origin:d.origin,destination:d.destination };}), state: 'Unterkunftsabhängige Start-/Zielpunkte müssen vor endgültiger Navigation ersetzt und erneut geprüft werden.' }))
};
fs.writeFileSync(path.join(__dirname, 'availability.json'), JSON.stringify(report, null, 2)+'\n');
const label = status => status === 'available' ? 'Angebot angezeigt' : '**Nicht verfügbar im verlinkten Portal**';
const money = value => value === null ? '—' : value.toFixed(2);
const lines = [
  '# Prio-1-Unterkünfte: Verfügbarkeitsprüfung vom 10. September 2026', '',
  '**Ergebnis: 13 von 16 Unterkünften an Land zeigen ein konkretes Angebot. Drei Prio-1-Unterkünfte sind für die geplanten Daten im verlinkten Portal nicht verfügbar. Bei zwei dieser Stopps ist auch die bisherige Alternative nicht verfügbar.**', '',
  `Reise: ${trip.trip.name}. Lokaler Planstand: ${trip.publishedVersion}. Zwei Erwachsene, eine Unterkunft, exakt die hinterlegten An- und Abreisedaten.`, '',
  '## Die drei Probleme und ihre Folgen', '',
  '| Stopp | Nicht verfügbare Prio 1 | Vorhandene Alternative | Betroffene Fahretappen |',
  '|---|---|---|---|',
  '| Zadar, 29.09.–01.10. | Adria Concept | Diklo Modern ebenfalls nicht verfügbar | Tag 6 (29.09.) und Tag 8 (01.10.) |',
  '| Makarska, 03.–06.10. | Villa Pehar | Der Blick verfügbar: CHF 241.50, erstattungsfähiger Tarif | Tag 10 (03.10.) und Tag 13 (06.10.) |',
  '| Ston, 13.–14.10. | Apartman I&M | Apartmani Mirjana ebenfalls nicht verfügbar | Tag 20 (13.10.) und Tag 21 (14.10., zur Fähre) |', '',
  'Die sechs Etappen führen im aktuellen lokalen Datensatz weiterhin zur bisherigen Unterkunft bzw. starten dort. Die allgemeine Streckenführung zwischen den Reiseorten wird dadurch nicht automatisch falsch; die Unterkunftsziele, letzten Zufahrten, Abfahrten und davon abhängigen Distanzen/Fahrzeiten sind jedoch nicht mehr als endgültig verwendbar.', '',
  '## Vollständige Prüfung der ersten Wahl', '',
  'Alle Preise in CHF für den gesamten Aufenthalt, wie angezeigt. Mitgliederpreise und separat genannte Abgaben beachten. Der geprüfte Tarif ist nicht immer der günstigste, weil flexible Stornierung bevorzugt wird.', '',
  '| Aufenthalt 2026 | Erste Wahl / datierter Buchungslink | Befund | Gesamtpreis CHF | Tarif und Evidenz |',
  '|---|---|---|---:|---|',
  ...rows.map(r=>`| ${r.checkIn} bis ${r.checkOut} | [${r.name}](${r.sourceUrl}) | ${label(r.status)} | ${money(r.displayedTotalCHF)} | ${r.evidence} |`), '',
  '## Alternativen der betroffenen Stopps', '',
  ...alternatives.map(r=>`- [${r.name}](${r.sourceUrl}): ${label(r.status)}. ${r.evidence}`), '',
  '## Konkreter Korrekturbedarf', '',
  '1. Zadar: neue Unterkunft für 29.09.–01.10. finden oder ein anderes Kontingent der bisherigen Unterkunft datumsbezogen bestätigen. Die bestehende Alternative kann nicht einfach hochgestuft werden.',
  '2. Makarska: „Der Blick“ ist ein verfügbarer Ersatzkandidat. Vor Übernahme konkrete Lage/Zufahrt und Platz für beide Motorräder klären; Küche, Waschmaschine und Privatstellplatz sind im bisherigen Eignungscheck beschrieben. Der erstattungsfähige Tarif muss ausdrücklich gewählt werden.',
  '3. Ston: neue Unterkunft für 13.–14.10. finden. Die anschliessende Etappe zum Fähr-Check-in in Split muss vom tatsächlichen Übernachtungsort gerechnet werden.',
  '4. Nach Auswahl die sechs betroffenen Fahretappen, Unterkunftsmarker, Google-Maps-Übergaben, gespeicherten Linien und App-Daten gemeinsam korrigieren und prüfen. Ohne gesicherte Ersatzadresse wäre eine neue Haustürroute erneut spekulativ.', '',
  '## Einordnung der früheren Prüfung', '',
  'Der Bericht vom 03.09.2026 bezeichnet Prioritäten ausdrücklich als Eignungsrangfolge. Für acht mehrnächtige Stopps enthält er damals abgelesene Datumstarife. Die übrigen Landstopps haben dort keinen entsprechenden Tarifnachweis. Ohne Buchung bleiben selbst korrekt abgelesene Angebote veränderlich. Aus der heutigen Prüfung lässt sich nicht feststellen, wann die drei Angebote weggefallen sind.', '',
  'Zusätzlich sind ältere Hinweise in den Unterkunftsdaten überholt: Sie sagen teilweise, die Routen endeten noch am Reiseort. Die aktuellen Tagesdaten verwenden inzwischen konkrete Unterkunftsnamen, Adressen oder zugehörige Koordinaten. Für diesen Bericht wurden deshalb die aktuellen Tagesdaten ausgewertet.', '',
  '## Grenzen und Änderungsstand', '',
  '- Die Prüfung betrifft die hinterlegten Portale, nicht sämtliche denkbaren Vertriebskanäle. „Nicht verfügbar“ bedeutet hier nicht nachgewiesen weltweit ausgebucht.',
  '- Airbnb zeigt bei Villa Pehar trotz Nichtverfügbarkeit eine allgemeine Stornofrist. Nur eine Stornofrist oder ein sichtbarer Kalender ist kein buchbares Angebot.',
  '- Die Nachtfährkabine 14.–15.10. wurde nicht geprüft. Sie gehört zur separaten Fährplanung; aus diesem Bericht folgt keine Aussage über Kabinen oder Motorradplätze.',
  '- Keine Unterkunft gebucht, kein Gastgeber angeschrieben, keine Stellplatzzusage eingeholt.',
  '- Nur dieser Prüfbericht und die zugehörigen Prüfdaten wurden angelegt. Unterkunftsprioritäten, Routen, Buchungsstatus und Veröffentlichung wurden nicht verändert.',
  '- Ein zusätzlicher Abruf der Produktionsdatei war technisch blockiert (DNS-Auflösung im Terminal; Browser blockierte den Dateiabruf). Die Routenfolgen sind deshalb gegen den genannten lokalen Planstand belegt, nicht unabhängig gegen die momentan ausgelieferte Produktion.', '',
  'Maschinenlesbare Befunde: [availability.json](availability.json). Das Erzeugungsskript überträgt manuell abgelesene Befunde und führt keine erneute Verfügbarkeitsprüfung durch.', ''
];
fs.writeFileSync(path.join(root, 'unterkunftsverfuegbarkeit-2026-09-10.md'),lines.join('\n').replace('[availability.json](availability.json)','[availability.json](accommodation-audit/2026-09-10/availability.json)'));
console.log(JSON.stringify({checked: rows.length, available:rows.filter(r=>r.status==='available').length, unavailable:rows.filter(r=>r.status!=='available').length, alternatives:alternatives.length, affectedDays:Object.values(affectedDays).flat()}));
