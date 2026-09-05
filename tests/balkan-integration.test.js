const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {readPublishedTrip} = require('../lib/published-trips');
const {tripForCompanion} = require('../lib/companion-feed');
const {routePoints} = require('../lib/route-navigation');
const {importLegacyRoadbook} = require('../assets/travel-model');
test('integrated Balkan stage preserves the exact Maps URL through web and native feed, with matched geometry', () => {
  const snapshot = readPublishedTrip(fs.readFileSync(require.resolve('../data/trip-adria-2026.js'), 'utf8'), 'trip_adria_2026');
  const feed = tripForCompanion(snapshot);
  const web = importLegacyRoadbook(snapshot);
  const bundled = JSON.parse(fs.readFileSync(require.resolve('../companion/Roadbook/Resources/plans.json'))).trips.find(t => t.id === snapshot.trip.id);
  const routes = JSON.parse(fs.readFileSync(require.resolve('../assets/adria-routes.geojson')));
  for (const f of routes.features.filter(f => f.properties.navigationReview)) {
    const i = f.properties.day - 1;
    assert.equal(feed.days[i].mapsURL, snapshot.days[i].main);
    assert.equal(bundled.days[i].mapsURL, snapshot.days[i].main);
    assert.ok(web.revision.routeVariants.some(v => v.providerRouteRef === snapshot.days[i].main));
    const navigationDestination = new URL(snapshot.days[i].main).searchParams.get('destination');
    const navigationWaypoints = [...snapshot.days[i].waypoints];
    if (navigationWaypoints.at(-1) === navigationDestination) navigationWaypoints.pop();
    assert.deepEqual(routePoints(snapshot.days[i].main), [snapshot.days[i].origin, ...navigationWaypoints, navigationDestination]);
    const joined = bundled.days[i].map.lines.flatMap((line,index)=>index ? line.coordinates.slice(1) : line.coordinates);
    assert.deepEqual(joined, f.geometry.coordinates);
    assert.ok(new URL(snapshot.days[i].main).searchParams.get('destination'));
    assert.ok(snapshot.days[i].waypoints.length <= 3);
  }
});
