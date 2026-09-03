const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { companionFeed } = require('../lib/companion-feed');

const distance = (a, b) => {
  const r = Math.PI / 180;
  return 12742000 * Math.asin(Math.sqrt(Math.sin((b[1]-a[1])*r/2)**2 +
    Math.cos(a[1]*r)*Math.cos(b[1]*r)*Math.sin((b[0]-a[0])*r/2)**2));
};
for (const name of ['adria', 'roadbook']) {
  test(`${name}: full road geometry is dense and retains the calculated route length`, () => {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets', `${name}-routes.geojson`)));
    for (const f of data.features) {
      if (f.properties.ferry && !f.properties.roadCoordinateCount) continue;
      assert.equal(f.properties.roadGeometryResolution, 'full', f.properties.name);
      const coordinates = f.properties.roadCoordinateCount ? f.geometry.coordinates.slice(0, f.properties.roadCoordinateCount) : f.geometry.coordinates;
      let length = 0;
      for (let i = 1; i < coordinates.length; i++) length += distance(coordinates[i-1], coordinates[i]);
      if (f.properties.distanceMeters === 0) { assert.equal(length, 0); continue; }
      // A spherical length differs slightly from OSRM's geodesic length. These
      // regression checks catch sparse overviews and post-routing loop deletion;
      // they are not a substitute for reviewing chosen roads or current closures.
      assert.ok(Math.abs(length/f.properties.distanceMeters - 1) < 0.005, `${f.properties.name}: missing or artificial segments`);
      assert.ok(length/coordinates.length < 150, `${f.properties.name}: sparse geometry`);
    }
  });
}
test('full-resolution companion feed fits the existing iOS download and point limits', () => {
  const feed = companionFeed();
  assert.ok(Buffer.byteLength(JSON.stringify(feed)) < 10_000_000);
  for (const trip of feed.trips) for (const day of trip.days) for (const line of day.map?.lines || []) {
    assert.ok(line.coordinates.length <= 100_000);
  }
});
