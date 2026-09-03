// Explicit acceptance step after reviewing geometry against current published routes.
// Never run automatically on publication: the GeoJSON may still belong to the old route.
const fs = require('node:fs');
const path = require('node:path');
const { tripTarget, readPublishedTrip } = require('../lib/published-trips');
const { tripForCompanion } = require('../lib/companion-feed');
const { mapsForTrip } = require('../lib/companion-maps');
if (!process.argv.includes('--bind-reviewed-geometry')) throw new Error('Erst Geometrie prüfen, dann --bind-reviewed-geometry verwenden.');
const root = path.resolve(__dirname, '..');
const trips = {};
for (const [id, filename] of [['trip_adria_2026','adria-routes.geojson'], ['trip_spanien_2026','roadbook-routes.geojson']]) {
  const snapshot = readPublishedTrip(fs.readFileSync(path.join(root, tripTarget(id).path), 'utf8'), id);
  trips[id] = mapsForTrip(tripForCompanion(snapshot), JSON.parse(fs.readFileSync(path.join(root, 'assets', filename))));
}
fs.writeFileSync(path.join(root, 'data/companion-maps.json'), JSON.stringify({ schemaVersion: 1, trips }) + '\n');
console.log('Reviewed map geometry bound to stable stage IDs and route signatures.');
