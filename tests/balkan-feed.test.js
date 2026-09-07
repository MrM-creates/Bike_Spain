const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { companionFeed } = require('../lib/companion-feed');

test('filtered Balkan feed reads only its source and retains all reviewed maps and sections', () => {
  const originalRead = fs.readFileSync;
  fs.readFileSync = function(file, ...args) {
    assert.ok(!String(file).endsWith('trip-spanien-2026.js'), 'Unselected source must not be loaded');
    return originalRead.call(this, file, ...args);
  };
  try {
    const feed = companionFeed('trip_adria_2026');
    assert.deepEqual(feed.trips.map(trip => trip.id), ['trip_adria_2026']);
    const trip = feed.trips[0];
    assert.equal(trip.days.length, 30);
    const driving = trip.days.filter(day => !day.rest);
    assert.equal(driving.length, 18);
    assert.ok(driving.every(day => day.map?.lines.length));
    assert.equal(trip.days[24].navigationParts.length, 2);
    assert.equal(trip.status, 'Veröffentlichter Reiseplan');
  } finally { fs.readFileSync = originalRead; }
});

test('filtered endpoint returns the selected trip and rejects unknown or repeated IDs', () => {
  const handler = require('../api/companion-plan');
  const request = tripId => {
    let code, body;
    const response = {setHeader(){}, status(value){code=value; return this;}, json(value){body=value;}};
    handler({method:'GET', query:{tripId}}, response);
    return {code, body};
  };
  assert.equal(request('trip_adria_2026').body.trips[0].id, 'trip_adria_2026');
  for (const id of ['../data/unknown', ['trip_adria_2026','trip_adria_2026'], '']) {
    assert.equal(request(id).code, 400);
  }
});
