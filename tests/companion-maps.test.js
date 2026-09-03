const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { companionFeed } = require('../lib/companion-feed');
const { attachMaps, signature } = require('../lib/companion-maps');
const maps = require('../data/companion-maps.json');

test('both trips carry exact original geometry, no direct routes or optional excursions', () => {
  const feed = companionFeed();
  for (const [index, filename] of ['adria-routes.geojson', 'roadbook-routes.geojson'].entries()) {
    const trip = feed.trips[index];
    const features = JSON.parse(fs.readFileSync(require.resolve('../assets/' + filename))).features.filter(f => f.properties.variant === 'original' && !f.properties.optional);
    assert.equal(trip.days.filter(d => !d.rest).length, features.length);
    for (const day of trip.days) {
      assert.ok(day.map?.stop, `${trip.id}/${day.id}: overnight base`);
      assert.equal(day.map.stop.approximate, true);
      if (day.rest) { assert.equal(day.map.lines.length, 0); continue; }
      const feature = features.find(f => f.properties.day === day.number);
      const joined = day.map.lines.flatMap((line, i) => i ? line.coordinates.slice(1) : line.coordinates);
      assert.deepEqual(joined, feature.geometry.coordinates);
    }
  }
});
test('Balkan ferry separates road approach from schematic sea crossing', () => {
  const map = companionFeed().trips[0].days[20].map;
  assert.deepEqual(map.lines.map(l => l.kind), ['road', 'ferry']);
  assert.equal(map.lines[1].coordinates.length, 2);
  assert.deepEqual(map.lines[0].coordinates.at(-1), map.lines[1].coordinates[0]);
  assert.deepEqual(map.lines[1].coordinates.at(-1), [13.510,43.615]);
});
test('route edits invalidate old geometry; date and note edits preserve it', () => {
  const original = companionFeed().trips[0];
  for (const field of ['id','title','rest','mapsURL','roads','overnight']) {
    const trip = structuredClone(original);
    trip.days[0][field] = field === 'rest' ? true : 'changed';
    assert.equal(attachMaps(trip,maps).days[0].map, null, field);
  }
  const trip = structuredClone(original);
  trip.days[0].date = '2026-09-25'; trip.days[0].notes += 'weather';
  assert.equal(signature(trip.days[0]), signature(original.days[0]));
  assert.ok(attachMaps(trip,maps).days[0].map);
  const changedArrival = structuredClone(original);
  changedArrival.days[5].mapsURL += '&changed=1';
  assert.equal(attachMaps(changedArrival,maps).days[6].map, null, 'rest day must not keep the old base after changed arrival');
});
