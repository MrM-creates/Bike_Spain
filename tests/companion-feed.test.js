const { test } = require('node:test');
const assert = require('node:assert/strict');
const { companionFeed, tripForCompanion } = require('../lib/companion-feed');
test('read-only companion contains both trips and preserves stable stage IDs', () => {
  const feed = companionFeed();
  assert.equal(feed.schemaVersion, 1);
  assert.deepEqual(feed.trips.map(t => t.id), ['trip_adria_2026', 'trip_spanien_2026']);
  for (const trip of feed.trips) {
    assert.equal(trip.days.length, 30);
    assert.equal(new Set(trip.days.map(d => d.id)).size, 30);
    assert.equal(trip.days.filter(d => d.accommodation).length, 29);
  }
  assert.equal(feed.trips[0].days[15].id, 'adria-16');
  assert.match(feed.trips[0].status, /entwurf/i);
  assert.equal(new URL(feed.trips[0].days[20].mapsURL).searchParams.get('destination'), 'Split Ferry Port, Croatia');
});
test('journal properties never enter public plan feed', () => {
  const snapshot = { trip: { id: 'test', name: 'test', startDate: '2026-01-01' }, days: [{id:'stable',title:'Day',journal:'SECRET', photos:['SECRET']}], journal: 'SECRET' };
  assert.ok(!JSON.stringify(tripForCompanion(snapshot)).includes('SECRET'));
  snapshot.days.push({id:'stable'});
  assert.throws(() => tripForCompanion(snapshot), /stabile IDs/);
});
test('companion endpoint rejects writes', () => {
  let status; let body;
  const response = { setHeader(){}, status(value){ status=value; return this; }, json(value){body=value;} };
  require('../api/companion-plan')({method:'POST',body:{journal:'secret'}},response);
  assert.equal(status,405); assert.ok(body.error);
});
