// Accept one explicitly reviewed Balkan stage, not an entire collection.
// Source route edits are made separately; refuse any mismatch with reviewed inputs.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { readPublishedTrip } = require('../lib/published-trips');
const { tripForCompanion } = require('../lib/companion-feed');
const { mapsForTrip, attachMaps } = require('../lib/companion-maps');
const root = path.resolve(__dirname, '..');
const read = name => JSON.parse(fs.readFileSync(path.join(root, name)));
const write = (name, value) => fs.writeFileSync(path.join(root, name), JSON.stringify(value) + '\n');
const number = Number(process.argv[2]);
if (!Number.isInteger(number) || number < 1 || number > 30) throw new Error('One Balkan day number required');
const audit = read('route-audit/2026-09-04/balkan-integration.json');
const review = audit.stages.find(s => s.day === number);
if (!review?.status?.startsWith('geometry-accepted') || !review.geometryEvidence) throw new Error('Explicit geometry acceptance required');
const trip = readPublishedTrip(fs.readFileSync(path.join(root, 'data/trip-adria-2026.js'), 'utf8'), 'trip_adria_2026');
const day = trip.days.find(d => d.day === number);
if (!day || day.rest) throw new Error('Driving day required');
const candidate = read(`route-audit/2026-09-04/candidates/adria-${number}.geojson`);
const params = new URL(day.main).searchParams;
assert.equal(params.get('origin'), review.candidate.origin, 'origin');
assert.equal(params.get('destination'), review.candidate.destination, 'destination');
assert.equal(params.get('waypoints') || '', review.candidate.waypoints.join('|'));
assert.equal(candidate.properties.day, number);
assert.deepEqual(candidate.properties.auditInputs, {
  origin: review.candidate.origin,
  destination: review.candidate.destination,
  waypoints: review.candidate.waypoints,
  geometryPoints: require('./generate-audit-candidate').candidatePoints(review.candidate)
});
const collection = read('assets/adria-routes.geojson');
const feature = collection.features.find(f => f.properties.day === number && f.properties.variant === 'original');
if (!feature) throw new Error('Route feature required');
if (feature.properties.ferry) {
  const seaArrival = feature.geometry.coordinates.at(-1);
  feature.geometry = {type:'LineString', coordinates:[...candidate.geometry.coordinates, seaArrival]};
  feature.properties.roadCoordinateCount = candidate.geometry.coordinates.length;
} else feature.geometry = candidate.geometry;
Object.assign(feature.properties, {
  name: `${number} ${day.title}`, anchorCount: candidate.properties.auditInputs.geometryPoints.length,
  distanceMeters: candidate.properties.distanceMeters, durationSeconds: candidate.properties.durationSeconds,
  roadGeometryResolution: 'full', source: feature.properties.ferry ? 'osrm-road-approach-and-schematic-ferry' : 'osrm-driving-via-roadbook-anchors',
  roadEvidence: {roadDistancesMeters: candidate.properties.roadDistancesMeters, ferryMeters: feature.properties.ferry ? feature.properties.roadEvidence.ferryMeters : 0,
    snappedWaypoints: candidate.properties.snappedWaypoints},
  navigationReview: {date: '2026-09-04', nativeGoogleMaps: 'not-tested', evidence: review.geometryEvidence}
});
const maps = read('data/companion-maps.json');
const oldOtherTrips = JSON.stringify(Object.fromEntries(Object.entries(maps.trips).filter(([id]) => id !== trip.trip.id)));
const converted = tripForCompanion(trip);
const generated = mapsForTrip(converted, collection);
const changedIds = [day.id];
for (let i = number; i < trip.days.length && trip.days[i].rest; i++) changedIds.push(trip.days[i].id);
for (const id of changedIds) maps.trips[trip.trip.id][id] = generated[id];
assert.equal(JSON.stringify(Object.fromEntries(Object.entries(maps.trips).filter(([id]) => id !== trip.trip.id))), oldOtherTrips);
const resource = 'companion/Roadbook/Resources/plans.json';
const previous = read(resource);
const next = {...previous, trips: previous.trips.map(t => t.id === trip.trip.id ? JSON.parse(JSON.stringify(attachMaps(converted, maps))) : t)};
assert.deepEqual(next.trips.filter(t => t.id !== trip.trip.id), previous.trips.filter(t => t.id !== trip.trip.id), 'Other trips must remain unchanged');
write('assets/adria-routes.geojson', collection);
write('data/companion-maps.json', maps);
fs.writeFileSync(path.join(root, resource), JSON.stringify(next, null, 2) + '\n');
console.log(`Balkan day ${number}: active geometry, map binding and companion resource updated; no deployment or device install.`);
