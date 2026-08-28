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
assert.equal(adria.trip.characterTitle, "Adriawind, Küstenkurven und stille Buchten");
assert.match(adria.days[2].title, /Nockalmstraße.*Graz/);
assert.match(adria.days[3].title, /Graz.*Ljubljana/);
assert.equal(adria.days[6].overnight, "Zadar");
assert.deepEqual(adria.days.slice(15, 19).map((day) => day.overnight), Array(4).fill("Kotor oder Perast"));
assert.equal(adria.days[20].type, "Fährtag");
assert.equal(adria.days[20].overnight, "Ancona");
assert.match(adria.days[21].title, /Ancona.*Urbino/);
assert.equal(adria.trip.fixPoints[1].id, "fix_adria_ferry_split_ancona");
assert.equal(adria.trip.fixPoints[1].stageDay, 21);
assert.equal(adria.trip.fixPoints[1].startsAt, "2026-10-14T20:00:00+02:00");
assert.equal(adria.trip.planningAlternatives[0].id, "nightjet-feldkirch-graz");
assert.ok(!adria.days.some((day) => /Nightjet|Nachtzug/i.test(day.title)));
assert.ok(!adria.days.slice(20).some((day) => /Plitvice|Rovinj|Innsbruck|Splügen|Engadin/.test(day.title)));
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
assert.equal(routes.features.length, 18);
assert.deepEqual(routes.features.map((feature) => feature.properties.day), [1, 2, 3, 4, 5, 6, 8, 10, 13, 16, 20, 21, 22, 24, 25, 27, 29, 30]);
assert.ok(routes.features.every((feature) => feature.geometry.type === "LineString" && feature.geometry.coordinates.length >= 3));
assert.equal(routes.features.find((feature) => feature.properties.day === 21).properties.source, "official-ferry-timetable");
assert.equal(routes.features.find((feature) => feature.properties.day === 21).properties.transport, true);
assert.ok(routes.features.filter((feature) => feature.properties.day !== 21).every((feature) => feature.properties.source === "osrm-driving-via-roadbook-anchors" && feature.geometry.coordinates.length > 10));

console.log("trip catalog tests passed");
