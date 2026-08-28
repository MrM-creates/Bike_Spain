const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const sourcePath = path.join(root, "assets", "adria-trip-2026.js");
const outputPath = path.join(root, "assets", "adria-routes.geojson");

const coordinates = {
  "Berikon, Switzerland": [8.372, 47.351],
  "Feldkirch, Austria": [9.598, 47.238],
  "Innsbruck, Austria": [11.405, 47.269],
  "Brenner, Italy": [11.506, 47.004],
  "Brunico, Italy": [11.936, 46.797],
  "Villach, Austria": [13.846, 46.614],
  "Ljubljana, Slovenia": [14.506, 46.056],
  "Rijeka, Croatia": [14.442, 45.327],
  "Senj, Croatia": [14.905, 44.989],
  "Karlobag, Croatia": [15.074, 44.527],
  "Starigrad, Croatia": [15.439, 44.296],
  "Zadar, Croatia": [15.232, 44.119],
  "Biograd na Moru, Croatia": [15.446, 43.938],
  "Vodice, Croatia": [15.782, 43.761],
  "Šibenik, Croatia": [15.895, 43.735],
  "Primošten, Croatia": [15.923, 43.586],
  "Trogir, Croatia": [16.252, 43.516],
  "Makarska, Croatia": [17.017, 43.296],
  "Ploče, Croatia": [17.432, 43.055],
  "Pelješac Bridge, Croatia": [17.538, 42.929],
  "Ston, Croatia": [17.697, 42.838],
  "Dubrovnik, Croatia": [18.094, 42.651],
  "Karasovići Border Crossing": [18.436, 42.493],
  "Herceg Novi, Montenegro": [18.531, 42.453],
  "Perast, Montenegro": [18.699, 42.486],
  "Kotor, Montenegro": [18.771, 42.424],
  "Šestanovac, Croatia": [16.914, 43.454],
  "Gornja Ploča, Croatia": [15.685, 44.305],
  "Plitvice Lakes, Croatia": [15.616, 44.880],
  "Učka Tunnel, Croatia": [14.225, 45.315],
  "Rovinj, Croatia": [13.638, 45.081],
  "Trieste, Italy": [13.777, 45.649],
  "Verona, Italy": [10.992, 45.438],
  "Como, Italy": [9.086, 45.808],
  "Gotthard Road Tunnel, Switzerland": [8.582, 46.546]
};

function loadDays() {
  const storage = new Map();
  const sandbox = {
    URLSearchParams,
    localStorage: {
      getItem(key) { return storage.get(key) || null; },
      setItem(key, value) { storage.set(key, String(value)); }
    }
  };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(fs.readFileSync(sourcePath, "utf8"), sandbox, { filename: sourcePath });
  return sandbox.MotorcycleTripCatalog.getSnapshot("trip_adria_2026", {}).days;
}

async function routeThrough(points) {
  const pathPart = points.map(([longitude, latitude]) => `${longitude},${latitude}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${pathPart}?overview=simplified&geometries=geojson&steps=false&continue_straight=true`;
  const response = await fetch(url, { headers: { "User-Agent": "motorcycle-roadbook-adria-builder/1.0" } });
  if (!response.ok) throw new Error(`OSRM ${response.status}`);
  const result = await response.json();
  const route = result.routes?.[0];
  if (!route?.geometry?.coordinates?.length) throw new Error(result.message || "Keine Route gefunden");
  return route;
}

async function main() {
  const features = [];
  for (const day of loadDays()) {
    if (day.rest || !day.origin || !day.destination) continue;
    const names = [day.origin, ...(day.waypoints || []), day.destination];
    const points = names.map((name) => {
      if (!coordinates[name]) throw new Error(`Koordinate fehlt: ${name}`);
      return coordinates[name];
    });
    const route = await routeThrough(points);
    features.push({
      type: "Feature",
      properties: {
        name: `${day.day} ${day.title}`,
        day: day.day,
        variant: "original",
        ferry: false,
        optional: false,
        anchorCount: points.length,
        distanceMeters: route.distance,
        durationSeconds: route.duration,
        source: "osrm-driving-via-roadbook-anchors"
      },
      geometry: route.geometry
    });
  }
  const collection = {
    type: "FeatureCollection",
    name: "Adria & Balkan 2026 – strassenfolgende Roadbook-Routen",
    generatedAt: new Date().toISOString(),
    features
  };
  fs.writeFileSync(outputPath, `${JSON.stringify(collection)}\n`);
  console.log(`Generated ${features.length} Adria routes in ${path.relative(root, outputPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
