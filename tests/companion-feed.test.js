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
  assert.equal(feed.trips[0].status, 'Veröffentlichter Reiseplan');
  assert.equal(new URL(feed.trips[0].days[20].mapsURL).searchParams.get('destination'), 'Gat Svetog Duje, Split');
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
test('conditional companion reads keep unchanged plans off the wire and distinguish trip feeds', () => {
  const handler = require('../api/companion-plan');
  const read = (query = {}, tag) => {
    const result = { headers: {} };
    const response = { setHeader(k,v){result.headers[k]=v;}, status(v){result.status=v;return this;}, json(v){result.body=v;}, end(){result.ended=true;} };
    handler({method:'GET',query,headers:tag ? {'if-none-match':tag} : {}},response);
    return result;
  };
  const full = read();
  assert.equal(full.status,200);
  assert.ok(full.body.trips.length===2);
  assert.match(full.headers.ETag,/^"[a-f0-9]{64}"$/);
  const unchanged = read({},full.headers.ETag);
  assert.equal(unchanged.status,304);
  assert.equal(unchanged.body,undefined);
  assert.equal(unchanged.ended,true);
  assert.equal(unchanged.headers['Cache-Control'],'no-cache');
  assert.equal(read({},'W/'+full.headers.ETag).status,304);
  assert.equal(read({},'"older-plan"').status,200);
  const single = read({tripId:'trip_adria_2026'},full.headers.ETag);
  assert.equal(single.status,200);
  assert.notEqual(single.headers.ETag,full.headers.ETag);
  assert.equal(single.body.trips.length,1);
  assert.equal(read({tripId:'unknown'},full.headers.ETag).status,400);
});
