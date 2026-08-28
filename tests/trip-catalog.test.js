const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const storage = new Map();
global.localStorage = {
  getItem(key) { return storage.has(key) ? storage.get(key) : null; },
  setItem(key, value) { storage.set(key, String(value)); }
};

require("../data/trip-adria-2026.js");
require("../assets/trip-catalog.js");

const catalog = global.MotorcycleTripCatalog;
const spain = { planKind: "published", trip: { id: "trip_spanien_2026", name: "Spanien 2026", startDate: "2026-09-24" }, days: Array.from({ length: 30 }, () => ({})) };
assert.ok(catalog);
assert.equal(catalog.list(spain).length, 2);

const adria = catalog.getSnapshot("trip_adria_2026", {});
assert.equal(adria.days.length, 30);
assert.equal(adria.trip.name, "Adria & Balkan 2026");
assert.equal(adria.days[3].roads, "D8");
assert.equal(adria.days[6].overnight, "Zadar");
assert.equal(adria.days[19].overnight, "Kotor oder Perast");
assert.equal(adria.days[29].overnight, "Berikon");

const created = catalog.createTrip({
  name: "Testreise",
  startDate: "2027-05-01",
  endDate: "2027-05-03",
  startPlace: "Berikon",
  endPlace: "Berikon"
});
assert.equal(created.days.length, 3);
assert.equal(catalog.list(spain).length, 3);
assert.equal(catalog.getSnapshot(created.trip.id, {}).trip.name, "Testreise");

const routes = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "assets", "adria-routes.geojson"), "utf8"));
assert.equal(routes.features.length, 14);
assert.deepEqual(routes.features.map((feature) => feature.properties.day), [1, 2, 3, 4, 8, 11, 14, 17, 21, 22, 24, 27, 29, 30]);
assert.ok(routes.features.every((feature) => feature.geometry.type === "LineString" && feature.geometry.coordinates.length > 10));
assert.ok(routes.features.every((feature) => feature.properties.source === "osrm-driving-via-roadbook-anchors"));

console.log("trip catalog tests passed");
