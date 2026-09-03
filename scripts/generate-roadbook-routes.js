const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const sourcePath = path.join(root, "reiseplanung-verfeinert-2026.kml");
const outputPath = path.join(root, "assets", "roadbook-routes.geojson");
const gpxOutputPath = path.join(root, "reiseplanung-verfeinert-2026.gpx");
const kmlOutputPath = path.join(root, "reiseplanung-verfeinert-2026-export.kml");
const source = fs.readFileSync(sourcePath, "utf8");
const placemarks = Array.from(source.matchAll(/<Placemark>([\s\S]*?)<\/Placemark>/g)).map((match) => match[1]);
const cache = new Map();

const decode = (value) => String(value || "")
  .replaceAll("&amp;", "&")
  .replaceAll("&lt;", "<")
  .replaceAll("&gt;", ">");
const encodeXml = (value) => String(value).replace(/[&<>\"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
async function routedGeometry(coordinates) {
  const key = coordinates.map(([longitude, latitude]) => `${longitude},${latitude}`).join(";");
  if (cache.has(key)) return cache.get(key);
  const url = `https://router.project-osrm.org/route/v1/driving/${key}?overview=full&geometries=geojson&steps=false&continue_straight=true`;
  await sleep(1100);
  const response = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { "User-Agent": "motorcycle-roadbook-route-builder/1.0" } });
  if (!response.ok) throw new Error(`OSRM ${response.status}`);
  const data = await response.json();
  const route = data.routes?.[0];
  if (!route?.geometry?.coordinates?.length) throw new Error(data.message || "Keine Route");
  const result = { geometry: route.geometry, distanceMeters: route.distance, durationSeconds: route.duration };
  cache.set(key, result);
  return result;
}

async function routedGeometryBySegments(coordinates) {
  const combined = [];
  let distanceMeters = 0;
  let durationSeconds = 0;
  for (let index = 0; index < coordinates.length - 1; index += 1) {
    const segment = await routedGeometry([coordinates[index], coordinates[index + 1]]);
    combined.push(...segment.geometry.coordinates.slice(index === 0 ? 0 : 1));
    distanceMeters += segment.distanceMeters;
    durationSeconds += segment.durationSeconds;
  }
  return {
    geometry: { type: "LineString", coordinates: combined },
    distanceMeters,
    durationSeconds
  };
}

function writePortableExports(features) {
  const publishedRoutes = features.filter((feature) => feature.properties.variant === "original" && !feature.properties.optional);
  const gpxTracks = publishedRoutes.map((feature) => `<trk><name>${encodeXml(feature.properties.name)}</name><trkseg>${feature.geometry.coordinates.map(([longitude, latitude]) => `<trkpt lat="${latitude}" lon="${longitude}"></trkpt>`).join("")}</trkseg></trk>`).join("");
  fs.writeFileSync(gpxOutputPath, `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Motorrad-Roadbook" xmlns="http://www.topografix.com/GPX/1/1"><metadata><name>Spanien 2026</name></metadata>${gpxTracks}</gpx>\n`);
  const kmlRoutes = publishedRoutes.map((feature) => `<Placemark><name>${encodeXml(feature.properties.name)}</name><styleUrl>#${feature.properties.ferry ? "ferry" : "route"}</styleUrl><LineString><tessellate>1</tessellate><coordinates>${feature.geometry.coordinates.map(([longitude, latitude]) => `${longitude},${latitude},0`).join(" ")}</coordinates></LineString></Placemark>`).join("");
  fs.writeFileSync(kmlOutputPath, `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>Spanien 2026 – Roadbook</name><Style id="route"><LineStyle><color>ff466b17</color><width>4</width></LineStyle></Style><Style id="ferry"><LineStyle><color>ff18619a</color><width>4</width></LineStyle></Style>${kmlRoutes}</Document></kml>\n`);
  console.log(`Generated GPX export in ${path.relative(root, gpxOutputPath)}`);
  console.log(`Generated KML export in ${path.relative(root, kmlOutputPath)}`);
}

async function main() {
  if (process.argv.includes("--exports-only")) {
    writePortableExports(JSON.parse(fs.readFileSync(outputPath, "utf8")).features);
    return;
  }
  const features = [];
  for (const placemark of placemarks) {
    const name = decode(placemark.match(/<name>([\s\S]*?)<\/name>/)?.[1]?.trim());
    const coordinateText = placemark.match(/<LineString>[\s\S]*?<coordinates>([\s\S]*?)<\/coordinates>[\s\S]*?<\/LineString>/)?.[1];
    if (!coordinateText) continue;
    const anchors = coordinateText.trim().split(/\s+/).map((entry) => entry.split(",").slice(0, 2).map(Number));
    const day = Number(name.match(/^\s*(\d+)/)?.[1]);
    if (!day || anchors.length < 2) continue;
    const ferry = /faehre|fähre/i.test(name);
    for (const variant of ["original", "direct"]) {
      const requested = variant === "direct" ? [anchors[0], anchors.at(-1)] : anchors;
      let route = { geometry: { type: "LineString", coordinates: anchors }, distanceMeters: null, durationSeconds: null };
      let routeSource = ferry ? "kml" : "kml-fallback";
      if (!ferry) {
        try {
          route = await routedGeometry(requested);
          routeSource = variant === "original" ? "osrm-driving-via-kml-anchors" : "osrm-driving-direct";
        } catch (error) {
          if (variant === "original" && requested.length > 2) {
            try {
              route = await routedGeometryBySegments(requested);
              routeSource = "osrm-driving-segmented-via-kml-anchors";
            } catch (segmentError) {
              console.warn(`${name} (${variant}): ${segmentError.message}; KML-Anker werden verwendet.`);
            }
          } else {
            console.warn(`${name} (${variant}): ${error.message}; KML-Anker werden verwendet.`);
          }
        }
      }
      features.push({
        type: "Feature",
        properties: {
          name,
          day,
          variant,
          ferry,
          optional: /optional|zusatzrunde/i.test(name),
          anchorCount: anchors.length,
          distanceMeters: route.distanceMeters,
          durationSeconds: route.durationSeconds,
          roadGeometryResolution: ferry ? null : "full",
          source: routeSource
        },
        // Preserve all routed points, including legitimate hairpins and waypoint approaches.
        geometry: route.geometry
      });
    }
  }
  const collection = {
    type: "FeatureCollection",
    name: "Spanien 2026 – straßenfolgende Roadbook-Routen",
    generatedAt: new Date().toISOString(),
    sourceKml: path.basename(sourcePath),
    features
  };
  const unroutedRoads = features.filter((feature) => !feature.properties.ferry && !feature.properties.source.startsWith("osrm-driving"));
  if (unroutedRoads.length) {
    throw new Error(`${unroutedRoads.length} Routen konnten nicht straßenfolgend berechnet werden; bestehende Exporte bleiben unverändert.`);
  }
  fs.writeFileSync(outputPath, `${JSON.stringify(collection)}\n`);
  writePortableExports(features);
  console.log(`Generated ${features.length} route variants in ${path.relative(root, outputPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
