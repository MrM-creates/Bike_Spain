const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const routes = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "assets", "roadbook-routes.geojson"), "utf8"));
const gpx = fs.readFileSync(path.join(__dirname, "..", "reiseplanung-verfeinert-2026.gpx"), "utf8");
const kml = fs.readFileSync(path.join(__dirname, "..", "reiseplanung-verfeinert-2026-export.kml"), "utf8");
const originals = routes.features.filter((feature) => feature.properties.variant === "original");
const direct = routes.features.filter((feature) => feature.properties.variant === "direct");
const roadOriginals = originals.filter((feature) => !feature.properties.ferry);
const day16 = originals.find((feature) => feature.properties.day === 16);
const day25 = originals.find((feature) => feature.properties.day === 25);
const distanceKilometers = (a, b) => {
  const radians = Math.PI / 180;
  const latitudeA = a[1] * radians;
  const latitudeB = b[1] * radians;
  const latitudeDelta = (b[1] - a[1]) * radians;
  const longitudeDelta = (b[0] - a[0]) * radians;
  const value = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(longitudeDelta / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(value));
};

assert.equal(routes.type, "FeatureCollection");
assert.equal(routes.features.length, 48);
assert.equal(originals.length, 24);
assert.equal(direct.length, 24);
assert.ok(roadOriginals.every((feature) => feature.geometry.type === "LineString"));
assert.ok(roadOriginals.every((feature) => feature.geometry.coordinates.length >= 20));
assert.ok(roadOriginals.every((feature) => feature.properties.source.startsWith("osrm-driving")));
assert.ok(originals.find((feature) => feature.properties.day === 1).geometry.coordinates.length > 100);
assert.equal(day16.properties.name, "16 Altea - Monachil");
assert.ok(Math.min(...day16.geometry.coordinates.map((coordinate) => distanceKilometers(coordinate, [-1.1307, 37.9922]))) > 2);
assert.equal(day25.properties.name, "25 Zaragoza - Castelldefels");
assert.ok(Math.abs(day25.geometry.coordinates.at(-1)[0] - 1.9794) < 0.01);
assert.ok(Math.abs(day25.geometry.coordinates.at(-1)[1] - 41.2787) < 0.01);
assert.equal((gpx.match(/<trk>/g) || []).length, 23);
assert.ok(gpx.includes("25 Zaragoza - Castelldefels"));
assert.ok(!gpx.includes("Gorges de la Meouge optional"));
assert.equal((kml.match(/<Placemark>/g) || []).length, 23);
assert.ok(kml.includes("25 Zaragoza - Castelldefels"));
assert.ok(!kml.includes("Gorges de la Meouge optional"));

console.log("route geometry tests passed");
