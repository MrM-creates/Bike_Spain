const vm = require('node:vm');
const { parseTripData, serializeTripData } = require('./trip-data');

// Request values never become file paths or executable code.
const TRIPS = Object.freeze({
  trip_spanien_2026: { path: 'data/trip-spanien-2026.js' },
  trip_adria_2026: { path: 'data/trip-adria-2026.js' }
});
function tripTarget(id = 'trip_spanien_2026') {
  if (!Object.hasOwn(TRIPS, id)) throw Object.assign(new Error('Diese Reise kann noch nicht online veröffentlicht werden.'), { status: 400 });
  return TRIPS[id];
}
function readPublishedTrip(source, id) {
  tripTarget(id);
  if (id === 'trip_spanien_2026') return parseTripData(source);
  // Only trusted, repository-owned source is evaluated (never the submitted snapshot).
  const context = { URLSearchParams };
  vm.runInNewContext(source, context, { timeout: 1000 });
  const snapshot = JSON.parse(JSON.stringify(context.__TRIP_ADRIA_DATA__));
  if (snapshot.trip?.id !== id) throw new Error('Reisequelle passt nicht zur ausgewählten Reise.');
  return snapshot;
}
function writePublishedTrip(snapshot, id) {
  tripTarget(id);
  if (id === 'trip_spanien_2026') return serializeTripData(snapshot);
  return `globalThis.__TRIP_ADRIA_DATA__ = Object.freeze(${JSON.stringify(snapshot, null, 2)});\n`;
}
module.exports = { TRIPS, tripTarget, readPublishedTrip, writePublishedTrip };
