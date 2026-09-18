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
assert.equal(catalog.defaultTripId, "trip_adria_2026");
assert.equal(catalog.getSnapshot(catalog.defaultTripId, spain).trip.id, "trip_adria_2026");
assert.equal(catalog.getSnapshot("trip_spanien_2026", spain).trip.id, "trip_spanien_2026");
assert.equal(catalog.list(spain).length, 2);

const adria = catalog.getSnapshot("trip_adria_2026", {});
assert.equal(adria.days.length, 30);
assert.equal(adria.trip.name, "Adria & Balkan 2026");
assert.equal(adria.trip.characterTitle, "Adriawind, Küstenkurven und stille Buchten");
assert.match(adria.days[2].title, /Drautal.*Wörthersee.*Graz/);
assert.equal(adria.days[2].time, "ca. 3 h 38");
assert.equal(adria.days[2].km, "ca. 283 km");
assert.equal(adria.days[2].routeStyle, "direct");
assert.ok(!adria.days[2].waypoints.some((point) => /Nockalm|Murau/.test(point)));
assert.equal(adria.trip.preferences.targetDailyRidingHours, 4);
assert.equal(adria.trip.preferences.maxDailyRidingHours, 5);
const { normalizeTripContext, commonInstructions } = require("../lib/planning-policy");
const adriaInstructions = commonInstructions(normalizeTripContext(adria.trip));
assert.match(adriaInstructions, /5 Stunden reine Fahrzeit sind die Obergrenze/);
assert.match(adriaInstructions, /Grenzwartezeiten, Check-in und Überfahrt sind nicht Teil der Fahrzeit/);
assert.match(adria.days[3].title, /Graz.*Ljubljana/);
assert.equal(adria.days[6].overnight, "Zadar");
assert.deepEqual(adria.days.slice(15, 18).map((day) => day.overnight), Array(3).fill("Kotor oder Perast"));
assert.equal(adria.days[20].type, "Fährtag");
assert.equal(adria.days[20].overnight, "Ancona");
assert.equal(adria.days[19].overnight, "Shkodër");
assert.equal(adria.days[18].destination, adria.days[20].origin);
assert.equal(adria.days[18].time, "ca. 3 h 12");
assert.equal(adria.days[20].time, "ca. 1 h 59");
const ferryNavigation = new URL(adria.days[20].main);
assert.equal(ferryNavigation.searchParams.get("origin"), "42.07142304764,19.513024609089");
assert.equal(ferryNavigation.searchParams.get("destination"), "41.3167417,19.4654539");
assert.equal(ferryNavigation.searchParams.get("waypoints"), "41.446792,19.706222");
assert.match(adria.days[21].title, /Ancona.*Urbino/);
assert.equal(adria.trip.fixPoints[1].id, "fix_adria_ferry_durres_ancona");
assert.equal(adria.trip.fixPoints[1].stageDay, 21);
assert.equal(adria.trip.fixPoints[1].startsAt, "2026-10-14T19:00:00+02:00");
assert.equal(adria.trip.planningAlternatives[0].id, "nightjet-feldkirch-graz");
assert.ok(!adria.trip.planningAlternatives.some(a => a.id === "split-ancona-ferry-watch"));
assert.ok(!adria.days.some((day) => /Nightjet|Nachtzug/i.test(day.title)));
assert.ok(!adria.days.slice(20).some((day) => /Plitvice|Rovinj|Innsbruck|Splügen|Engadin/.test(day.title)));
assert.match(adria.days[24].title, /Comacchio.*Ferrara/);
assert.ok(!adria.days[24].title.includes("Chioggia"));
assert.equal(adria.days[24].km, "ca. 155 km");
assert.equal(adria.days[29].overnight, "Berikon");
const expectedAccommodationIds = [
  "innsbruck-mutters", "lienz", "graz-west", "ljubljana-ring", "senj", "zadar", "sibenik",
  "makarska-base", "dubrovnik-lapad", "kotor-dobrota", "shkoder", "durres-ancona-cabin",
  "urbino-country", "ravenna", "arqua-petrarca", "iseo", "como-lazzago"
];
assert.deepEqual(adria.accommodations.map((stay) => stay.id), expectedAccommodationIds);
assert.ok(adria.accommodations.every((stay) => stay.currentFirstChoice && stay.currentFirstChoiceUrl));
assert.ok(adria.accommodations.every((stay) => stay.currentAlternative && stay.currentAlternativeUrl));
assert.ok(adria.accommodations.every((stay) => /zwei|Zwei/.test(stay.parking)));
const apartmentStays = adria.accommodations.filter((stay) => (Date.parse(stay.endDate) - Date.parse(stay.startDate)) / 86400000 >= 2);
assert.equal(apartmentStays.length, 9);
assert.equal(adria.trip.preferences.apartmentFromNights, 2);
assert.equal(adria.trip.preferences.preferPrivateKitchen, true);
assert.equal(adria.trip.preferences.preferWashingMachine, true);
for (const stay of apartmentStays) {
  assert.match(stay.currentFirstChoiceNotes, /Küche/);
  assert.match(stay.currentAlternativeNotes, /Küche/);
  assert.match(stay.currentFirstChoiceNotes, /Waschmaschine/);
  assert.match(stay.currentAlternativeNotes, /Waschmaschine/);
  assert.match(stay.reviewedAt, /^2026-09-\d{2}$/);
  assert.equal(stay.motorcycleParking, "unknown", "Inseratsangabe ist keine bestätigte Motorradabstellung");
  assert.ok(stay.reviewNote);
  for (const link of [stay.currentFirstChoiceUrl, stay.currentAlternativeUrl]) {
    const url = new URL(link);
    assert.equal(url.protocol, "https:");
    assert.equal(url.searchParams.get("checkin") || url.searchParams.get("check_in"), stay.startDate);
    assert.equal(url.searchParams.get("checkout") || url.searchParams.get("check_out"), (stay.id === "kotor-dobrota" && link === stay.currentFirstChoiceUrl) ? "2026-10-13" : stay.endDate);
    assert.equal(url.searchParams.get("group_adults") || url.searchParams.get("adults"), "2");
  }
}
const { importLegacyRoadbook } = require("../assets/travel-model");
const reviewedModel = importLegacyRoadbook(adria);
for (const stay of reviewedModel.revision.stays.filter((stay) => stay.nightCount >= 2)) {
  assert.match(stay.reviewedAt, /^2026-09-\d{2}$/);
  assert.equal(stay.reviewNote, adria.accommodations.find(s => s.startDate === stay.startDate).reviewNote);
  const options = reviewedModel.revision.accommodationOptions.filter((option) => option.stayId === stay.id);
  assert.equal(options.length, 2);
  assert.ok(options.every((option) => option.notes && option.checkedAt && option.motorcycleParking === "unknown"));
}
const plannedNights = adria.accommodations.flatMap((stay) => {
  const nights = [];
  for (let date = new Date(`${stay.startDate}T00:00:00Z`); date < new Date(`${stay.endDate}T00:00:00Z`); date.setUTCDate(date.getUTCDate() + 1)) {
    nights.push({ date: date.toISOString().slice(0, 10), title: stay.title });
  }
  return nights;
});
assert.equal(plannedNights.length, 29);
assert.deepEqual(plannedNights.map((night) => night.title), adria.days.slice(0, -1).map((day) => day.overnight));
const makarskaStay = adria.accommodations.find((stay) => stay.id === "makarska-base");
const dubrovnikStay = adria.accommodations.find((stay) => stay.id === "dubrovnik-lapad");
const kotorStay = adria.accommodations.find((stay) => stay.id === "kotor-dobrota");
assert.equal(makarskaStay.startDate, "2026-10-03");
assert.equal(makarskaStay.endDate, "2026-10-06");
assert.match(makarskaStay.currentFirstChoice, /Der Blick/);
assert.match(makarskaStay.currentAlternative, /Sun Spalato/);
assert.match(makarskaStay.parking, /zwei beladene Motorräder/);
assert.equal(dubrovnikStay.startDate, "2026-10-06");
assert.equal(dubrovnikStay.endDate, "2026-10-09");
assert.match(dubrovnikStay.currentFirstChoice, /OSCAR Suite/);
assert.match(dubrovnikStay.currentAlternative, /Miss Mia/);
assert.match(dubrovnikStay.parking, /zwei Maschinen/);
assert.equal(kotorStay.startDate, "2026-10-09");
assert.equal(kotorStay.endDate, "2026-10-12");
assert.match(kotorStay.currentFirstChoice, /sensationeller Aussicht/);
assert.match(kotorStay.parking, /schriftlich bestätigen/);
const shkoderStay = adria.accommodations.find((stay) => stay.id === "shkoder");
assert.equal(shkoderStay.startDate, "2026-10-12");
assert.equal(shkoderStay.endDate, "2026-10-14");
assert.equal(shkoderStay.booking, "open");
assert.match(shkoderStay.currentFirstChoice, /All Seasons/);
assert.match(shkoderStay.currentAlternative, /RIRA/);
assert.match(kotorStay.currentFirstChoiceNotes, /Derzeit nicht verfügbar/);

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
const corrected = new Map(routes.features.filter((f) => [1, 10, 13, 22].includes(f.properties.day)).map((f) => [f.properties.day, f]));
for (const [day, feature] of corrected) {
  assert.ok(feature.properties.durationSeconds < 5 * 3600, `Tag ${day}: Routerzeit unter fünf Stunden`);
  assert.equal(feature.properties.roadEvidence.ferryMeters, 0);
  assert.ok(feature.properties.roadEvidence.snappedWaypoints.every((w) => w.distance < 100));
  const nav = new URL(adria.days[day - 1].main);
  assert.equal(nav.searchParams.get("waypoints"), adria.days[day - 1].waypoints.join("|"));
  assert.ok(adria.days[day - 1].waypoints.length <= 3, "Mobile Maps: höchstens drei Zwischenziele");
}
const arlberg = corrected.get(1).properties.roadEvidence;
assert.ok(arlberg.snappedWaypoints.some((w) => w.name === "Arlberg Schnellstraße" && w.distance < 1));
assert.ok(!adria.days[0].waypoints.includes("47.126940,10.160801"), "Do not restore the tunnel-name/surface-road snapping bug");
assert.equal(adria.days[0].destination, "Hotel dasMEI, Nattererstrasse 20-22, Mutters");
assert.ok(arlberg.roadDistancesMeters.S16 > 50000);
assert.ok(!Object.keys(arlberg.roadDistancesMeters).some((road) => /L197|B197|Paul-Bantlin/.test(road)));
for (const day of [10, 13]) {
  const roads = corrected.get(day).properties.roadEvidence.roadDistancesMeters;
  assert.ok(!Object.keys(roads).some((road) => /\bA1\b/.test(road)), `Tag ${day}: keine A1`);
  assert.ok(roads.D8 > 120000);
}
assert.ok(corrected.get(10).geometry.coordinates.some(([lon, lat]) => lon > 16.68 && lon < 16.74 && lat > 43.4 && lat < 43.46), "Omiš an der Küste enthalten");
assert.ok(corrected.get(13).properties.roadEvidence.roadDistancesMeters.D416 > 100, "Pelješac bridge approach retained");
assert.ok(corrected.get(13).geometry.coordinates.some(([lon,lat]) => lon > 17.52 && lon < 17.59 && lat > 42.90 && lat < 42.95), "Pelješac bridge crossing retained");
const urbino = corrected.get(22);
assert.ok(urbino.properties.roadEvidence.roadDistancesMeters.A14 > 39000);
assert.ok(urbino.properties.roadEvidence.roadDistancesMeters.SS73bis > 30000);
assert.ok(!urbino.properties.roadEvidence.roadDistancesMeters.SP43);
assert.match(adria.days[21].roads, /A14.*SS73bis/);
assert.match(adria.days[21].note, /Keine Furlo-Schlucht/);
const shortenedDay = routes.features.find((feature) => feature.properties.day === 3);
assert.ok(shortenedDay.properties.distanceMeters > 275000 && shortenedDay.properties.distanceMeters < 300000);
assert.ok(shortenedDay.properties.durationSeconds < 4.5 * 3600);
assert.match(shortenedDay.properties.name, /Wörthersee/);
assert.ok(shortenedDay.geometry.coordinates.some(([lon, lat]) => Math.abs(lon - 14.0413) < 0.01 && Math.abs(lat - 46.6142) < 0.01));
assert.deepEqual(routes.features.map((feature) => feature.properties.day), [1, 2, 3, 4, 5, 6, 8, 10, 13, 16, 19, 21, 22, 24, 25, 27, 29, 30]);
assert.ok(routes.features.every((feature) => feature.geometry.type === "LineString" && feature.geometry.coordinates.length >= 3));
const returnRoad = routes.features.find((feature) => feature.properties.day === 19);
assert.ok(returnRoad.properties.distanceMeters > 130000 && returnRoad.properties.distanceMeters < 135000);
assert.ok(returnRoad.properties.durationSeconds < 4 * 3600);
assert.equal(returnRoad.properties.roadEvidence.ferryMeters, 0);
assert.ok(returnRoad.properties.roadEvidence.snappedWaypoints.every((point) => point.distance < 100));
const ferryRoad = routes.features.find((feature) => feature.properties.day === 21);
assert.equal(ferryRoad.properties.source, "osrm-road-approach-and-schematic-ferry");
assert.equal(ferryRoad.properties.distanceScope, "road-approach-only");
assert.equal(ferryRoad.properties.seaGeometry, "schematic-not-navigation");
assert.ok(ferryRoad.properties.distanceMeters > 110000 && ferryRoad.properties.distanceMeters < 112000);
assert.ok(ferryRoad.properties.durationSeconds < 3 * 3600);
assert.ok(ferryRoad.properties.roadEvidence.roadDistancesMeters.A1 > 30000);
assert.equal(ferryRoad.properties.roadEvidence.ferryMeters, 0);
assert.ok(ferryRoad.properties.roadEvidence.snappedWaypoints.every((point) => point.distance < 100));
assert.ok(ferryRoad.properties.roadCoordinateCount > 30);
assert.equal(ferryRoad.geometry.coordinates.length, ferryRoad.properties.roadCoordinateCount + 4);
const portCoordinate = ferryRoad.geometry.coordinates[ferryRoad.properties.roadCoordinateCount - 1];
assert.ok(Math.abs(portCoordinate[0] - 19.4654539) < 0.005 && Math.abs(portCoordinate[1] - 41.3167417) < 0.005);
assert.deepEqual(ferryRoad.geometry.coordinates.at(-1), [13.510, 43.615]);
assert.equal(routes.features.find((feature) => feature.properties.day === 21).properties.transport, true);
// Die im Release vom 7. September geprüften zehn Linien tragen ihre eigene
// Herkunftskennzeichnung. Alle übrigen Strassenlinien behalten die bisherige.
const reviewedRouteDays = new Set([3, 5, 6, 8, 10, 13, 19, 22, 24, 25, 27, 29]);
for (const feature of routes.features.filter((feature) => feature.properties.day !== 21)) {
  assert.equal(feature.properties.source, reviewedRouteDays.has(feature.properties.day)
    ? "osrm-driving-via-reviewed-roadbook-anchors"
    : "osrm-driving-via-roadbook-anchors");
  assert.ok(feature.geometry.coordinates.length > 10);
}

console.log("trip catalog tests passed");
