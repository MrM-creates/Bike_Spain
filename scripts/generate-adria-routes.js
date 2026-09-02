const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const sourcePath = path.join(root, "data", "trip-adria-2026.js");
const outputPath = path.join(root, "assets", "adria-routes.geojson");

const coordinates = {
  "Berikon, Switzerland": [8.372, 47.351],
  "Feldkirch, Austria": [9.598, 47.238],
  "Arlberg Road Tunnel, Austria": [10.173, 47.129],
  "Innsbruck, Austria": [11.405, 47.269],
  "Brenner, Italy": [11.506, 47.004],
  "Brunico, Italy": [11.936, 46.797],
  "Lienz, Austria": [12.769, 46.829],
  "Spittal an der Drau, Austria": [13.497, 46.799],
  "Nockalm Road, Austria": [13.747, 46.956],
  "Murau, Austria": [14.169, 47.111],
  "Graz, Austria": [15.439, 47.071],
  "Maribor, Slovenia": [15.646, 46.554],
  "Ljubljana, Slovenia": [14.506, 46.056],
  "Postojna, Slovenia": [14.203, 45.775],
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
  "Split Ferry Port, Croatia": [16.441, 43.503],
  "Ancona, Italy": [13.510, 43.615],
  "Fano, Italy": [13.016, 43.843],
  "Gola del Furlo, Italy": [12.713, 43.640],
  "Urbino, Italy": [12.636, 43.726],
  "San Marino": [12.457, 43.943],
  "Rimini, Italy": [12.568, 44.067],
  "Ravenna, Italy": [12.204, 44.418],
  "Comacchio, Italy": [12.184, 44.694],
  "Ferrara, Italy": [11.620, 44.838],
  "Arquà Petrarca, Italy": [11.718, 45.270],
  "Valeggio sul Mincio, Italy": [10.735, 45.353],
  "Iseo, Italy": [10.050, 45.659],
  "Bergamo, Italy": [9.670, 45.698],
  "Como, Italy": [9.086, 45.808],
  "Gotthard Road Tunnel, Switzerland": [8.582, 46.546]
};

function loadDays() {
  const sandbox = { URLSearchParams };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(fs.readFileSync(sourcePath, "utf8"), sandbox, { filename: sourcePath });
  return sandbox.__TRIP_ADRIA_DATA__.days;
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
    if (/fährtag/i.test(day.type)) {
      features.push({
        type: "Feature",
        properties: {
          name: `${day.day} ${day.title}`,
          day: day.day,
          variant: "original",
          ferry: true,
          transport: true,
          optional: false,
          anchorCount: points.length,
          distanceMeters: null,
          durationSeconds: null,
          source: "official-ferry-timetable"
        },
        geometry: { type: "LineString", coordinates: points }
      });
      continue;
    }
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
