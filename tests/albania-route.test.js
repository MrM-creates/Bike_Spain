const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { companionFeed } = require('../lib/companion-feed');
const { readPublishedTrip } = require('../lib/published-trips');
const trip = readPublishedTrip(fs.readFileSync(require.resolve('../data/trip-adria-2026.js'), 'utf8'), 'trip_adria_2026');
const feed = companionFeed().trips[0];
const routes = JSON.parse(fs.readFileSync(require.resolve('../assets/adria-routes.geojson')));

test('Albania calendar preserves the confirmed booking and stable journal slots', () => {
  assert.equal(trip.accommodations[0].booking, 'booked');
  assert.equal(feed.days[0].accommodation.status, 'Gebucht');
  assert.deepEqual(trip.days.map(d => d.id), trip.originalDays.map(d => d.id));
  assert.deepEqual(feed.days.slice(18, 22).map(d => [d.date, d.rest]), [
    ['2026-10-12', false], ['2026-10-13', true], ['2026-10-14', false], ['2026-10-15', false]
  ]);
  const kotor = trip.accommodations.find(s => s.id === 'kotor-dobrota');
  assert.equal(kotor.endDate, '2026-10-12');
  assert.equal(kotor.booking, 'open');
  assert.match(kotor.reviewNote, /derzeit nicht verfügbar/);
  assert.deepEqual(feed.days.slice(18, 20).map(d => d.accommodation.id), ['shkoder', 'shkoder']);
  assert.equal(feed.days[21].accommodation.id, 'urbino-country');
  assert.equal(feed.days[20].accommodation.bookingEditable, false);
});

test('Albania corridors exclude rejected shortcuts and keep ferry navigation on land', () => {
  const roads = n => routes.features.find(f => f.properties.day === n).properties.roadEvidence.roadDistancesMeters;
  assert.ok(roads(19)['M-1'] > 100000);
  for (const road of ['R-29', 'Kamenički most', 'Topliški put']) assert.ok(!roads(19)[road]);
  assert.ok(roads(21).A1 > 30000 && roads(21).SH2 > 20000);
  for (const road of ['SH52', 'SH62']) assert.ok(!roads(21)[road]);
  assert.ok(roads(22).A14 > 39000 && roads(22).SS73bis > 30000);
  assert.ok(!roads(22).SP43);
  assert.equal(new URL(feed.days[20].mapsURL).searchParams.get('destination'), '41.3167417,19.4654539');
  assert.equal(trip.trip.fixPoints[1].startsAt, '2026-10-14T19:00:00+02:00');
  assert.equal(trip.trip.fixPoints[1].endsAt, '2026-10-15T11:30:00+02:00');
});

test('bundled companion and server deliver the same complete plan', () => {
  const bundled = JSON.parse(fs.readFileSync(require.resolve('../companion/Roadbook/Resources/plans.json')));
  assert.deepEqual(bundled, JSON.parse(JSON.stringify(companionFeed())));
});
