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
assert.equal(adria.days[2].time, "ca. 4 h 15");
assert.equal(adria.days[2].km, "ca. 285 km");
assert.equal(adria.days[2].routeStyle, "direct");
assert.ok(!adria.days[2].waypoints.some((point) => /Nockalm|Murau/.test(point)));
assert.equal(adria.trip.preferences.targetDailyRidingHours, 4);
assert.equal(adria.trip.preferences.maxDailyRidingHours, 5);
const { normalizeTripContext, commonInstructions } = require("../lib/planning-policy");
const adriaInstructions = commonInstructions(normalizeTripContext(adria.trip));
assert.match(adriaInstructions, /5 Stunden reine Fahrzeit sind die Obergrenze/);
assert.match(adriaInstructions, /Grenz- und Fährwartezeiten zusätzlich/);
assert.match(adria.days[3].title, /Graz.*Ljubljana/);
assert.equal(adria.days[6].overnight, "Zadar");
assert.deepEqual(adria.days.slice(15, 19).map((day) => day.overnight), Array(4).fill("Kotor oder Perast"));
assert.equal(adria.days[20].type, "Fährtag");
assert.equal(adria.days[20].overnight, "Ancona");
assert.equal(adria.days[19].overnight, "Ston / Mali Ston");
assert.equal(adria.days[19].destination, adria.days[20].origin);
assert.equal(adria.days[19].time, "ca. 4 h plus Grenze");
assert.equal(adria.days[20].time, "ca. 3 h plus Check-in und Überfahrt");
const ferryNavigation = new URL(adria.days[20].main);
assert.equal(ferryNavigation.searchParams.get("origin"), "Ston, Croatia");
assert.equal(ferryNavigation.searchParams.get("destination"), "Split Ferry Port, Croatia");
assert.equal(ferryNavigation.searchParams.get("waypoints"), "42.930204,17.534612");
assert.match(adria.days[21].title, /Ancona.*Urbino/);
assert.equal(adria.trip.fixPoints[1].id, "fix_adria_ferry_split_ancona");
assert.equal(adria.trip.fixPoints[1].stageDay, 21);
assert.equal(adria.trip.fixPoints[1].startsAt, "2026-10-14T20:00:00+02:00");
assert.equal(adria.trip.planningAlternatives[0].id, "nightjet-feldkirch-graz");
assert.equal(adria.trip.planningAlternatives[1].id, "split-ancona-ferry-watch");
assert.match(adria.trip.planningAlternatives[1].decision, /22\.09\.2026/);
assert.ok(!adria.days.some((day) => /Nightjet|Nachtzug/i.test(day.title)));
assert.ok(!adria.days.slice(20).some((day) => /Plitvice|Rovinj|Innsbruck|Splügen|Engadin/.test(day.title)));
assert.match(adria.days[24].title, /Comacchio.*Ferrara/);
assert.ok(!adria.days[24].title.includes("Chioggia"));
assert.equal(adria.days[24].km, "ca. 150 km");
assert.equal(adria.days[29].overnight, "Berikon");
const expectedAccommodationIds = [
  "innsbruck-mutters", "lienz", "graz-west", "ljubljana-ring", "senj", "zadar", "sibenik",
  "makarska-base", "dubrovnik-lapad", "kotor-dobrota", "ston-return", "split-ancona-cabin",
  "urbino-country", "ravenna", "arqua-petrarca", "iseo", "como-lazzago"
];
assert.deepEqual(adria.accommodations.map((stay) => stay.id), expectedAccommodationIds);
assert.ok(adria.accommodations.every((stay) => stay.currentFirstChoice && stay.currentFirstChoiceUrl));
assert.ok(adria.accommodations.every((stay) => stay.currentAlternative && stay.currentAlternativeUrl));
assert.ok(adria.accommodations.every((stay) => /zwei Maschinen/.test(stay.parking)));
const apartmentStays = adria.accommodations.filter((stay) => (Date.parse(stay.endDate) - Date.parse(stay.startDate)) / 86400000 >= 2);
assert.equal(apartmentStays.length, 8);
assert.equal(adria.trip.preferences.apartmentFromNights, 2);
assert.equal(adria.trip.preferences.preferPrivateKitchen, true);
assert.equal(adria.trip.preferences.preferWashingMachine, true);
for (const stay of apartmentStays) {
  assert.match(stay.currentFirstChoiceNotes, /Küche/);
  assert.match(stay.currentAlternativeNotes, /Küche/);
  assert.match(stay.currentFirstChoiceNotes, /Waschmaschine/);
  assert.match(stay.currentAlternativeNotes, /Waschmaschine/);
  assert.equal(stay.reviewedAt, "2026-09-03");
  assert.equal(stay.motorcycleParking, "unknown", "Inseratsangabe ist keine bestätigte Motorradabstellung");
  assert.match(stay.reviewNote, /nicht gebucht/);
  for (const link of [stay.currentFirstChoiceUrl, stay.currentAlternativeUrl]) {
    const url = new URL(link);
    assert.equal(url.protocol, "https:");
    assert.equal(url.searchParams.get("checkin") || url.searchParams.get("check_in"), stay.startDate);
    assert.equal(url.searchParams.get("checkout") || url.searchParams.get("check_out"), stay.endDate);
    assert.equal(url.searchParams.get("group_adults") || url.searchParams.get("adults"), "2");
  }
}
const { importLegacyRoadbook } = require("../assets/travel-model");
const reviewedModel = importLegacyRoadbook(adria);
for (const stay of reviewedModel.revision.stays.filter((stay) => stay.nightCount >= 2)) {
  assert.equal(stay.reviewedAt, "2026-09-03");
  assert.match(stay.reviewNote, /Hauszufahrt/);
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
assert.match(makarskaStay.currentFirstChoice, /Villa Pehar/);
assert.match(makarskaStay.currentAlternative, /Der Blick/);
assert.match(makarskaStay.parking, /zwei Maschinen/);
assert.equal(dubrovnikStay.startDate, "2026-10-06");
assert.equal(dubrovnikStay.endDate, "2026-10-09");
assert.match(dubrovnikStay.currentFirstChoice, /OSCAR Suite/);
assert.match(dubrovnikStay.currentAlternative, /Miss Mia/);
assert.match(dubrovnikStay.parking, /zwei Maschinen/);
assert.equal(kotorStay.startDate, "2026-10-09");
assert.equal(kotorStay.endDate, "2026-10-13");
assert.match(kotorStay.currentFirstChoice, /sensationeller Aussicht/);
assert.match(kotorStay.parking, /schriftlich bestätigen/);
const stonStay = adria.accommodations.find((stay) => stay.id === "ston-return");
assert.equal(stonStay.startDate, "2026-10-13");
assert.equal(stonStay.endDate, "2026-10-14");
assert.equal(stonStay.booking, "open");
assert.match(stonStay.currentFirstChoice, /I&M.*Luka/);
assert.match(stonStay.currentAlternative, /Mirjana.*Hodilje/);
assert.match(stonStay.parking, /Verfügbarkeit.*noch offen/);

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
assert.ok(arlberg.snappedWaypoints.some((w) => w.name === "Arlbergtunnel" && w.distance < 1));
assert.ok(arlberg.roadDistancesMeters.S16 > 50000);
assert.ok(!Object.keys(arlberg.roadDistancesMeters).some((road) => /L197|B197|Paul-Bantlin/.test(road)));
for (const day of [10, 13]) {
  const roads = corrected.get(day).properties.roadEvidence.roadDistancesMeters;
  assert.ok(!Object.keys(roads).some((road) => /\bA1\b/.test(road)), `Tag ${day}: keine A1`);
  assert.ok(roads.D8 > 120000);
}
assert.ok(corrected.get(10).geometry.coordinates.some(([lon, lat]) => lon > 16.68 && lon < 16.74 && lat > 43.4 && lat < 43.46), "Omiš an der Küste enthalten");
assert.ok(corrected.get(13).properties.roadEvidence.snappedWaypoints.some((w) => /Pelješki/.test(w.name)));
const furlo = corrected.get(22);
assert.ok(furlo.properties.roadEvidence.roadDistancesMeters.A14 > 35000);
assert.match(adria.days[21].roads, /A14/);
assert.ok(furlo.properties.roadEvidence.snappedWaypoints.some((w) => w.name === "Via Flaminia" && w.distance < 1));
assert.ok(!Object.keys(furlo.properties.roadEvidence.roadDistancesMeters).some((road) => /Furlo Monte/i.test(road)));
assert.ok(furlo.geometry.coordinates.some(([lon, lat]) => lon > 12.75 && lon < 12.76 && lat > 43.66 && lat < 43.67), "Furlo: östlicher Zugang");
assert.ok(furlo.geometry.coordinates.some(([lon, lat]) => lon > 12.70 && lon < 12.72 && lat > 43.63 && lat < 43.64), "Furlo: westlicher Ausgang");
assert.match(adria.days[21].note, /Öffnungsmeldung stammt von 2022/);
const shortenedDay = routes.features.find((feature) => feature.properties.day === 3);
assert.ok(shortenedDay.properties.distanceMeters > 275000 && shortenedDay.properties.distanceMeters < 300000);
assert.ok(shortenedDay.properties.durationSeconds < 4.5 * 3600);
assert.match(shortenedDay.properties.name, /Wörthersee/);
assert.ok(shortenedDay.geometry.coordinates.some(([lon, lat]) => Math.abs(lon - 14.0413) < 0.01 && Math.abs(lat - 46.6142) < 0.01));
assert.deepEqual(routes.features.map((feature) => feature.properties.day), [1, 2, 3, 4, 5, 6, 8, 10, 13, 16, 20, 21, 22, 24, 25, 27, 29, 30]);
assert.ok(routes.features.every((feature) => feature.geometry.type === "LineString" && feature.geometry.coordinates.length >= 3));
const returnRoad = routes.features.find((feature) => feature.properties.day === 20);
assert.ok(returnRoad.properties.distanceMeters > 140000 && returnRoad.properties.distanceMeters < 160000);
assert.ok(returnRoad.properties.durationSeconds < 4 * 3600);
assert.equal(returnRoad.properties.roadEvidence.ferryMeters, 0);
assert.ok(returnRoad.properties.roadEvidence.snappedWaypoints.every((point) => point.distance < 100));
const ferryRoad = routes.features.find((feature) => feature.properties.day === 21);
assert.equal(ferryRoad.properties.source, "osrm-road-approach-and-schematic-ferry");
assert.equal(ferryRoad.properties.distanceScope, "road-approach-only");
assert.equal(ferryRoad.properties.seaGeometry, "schematic-not-navigation");
assert.ok(ferryRoad.properties.distanceMeters > 175000 && ferryRoad.properties.distanceMeters < 195000);
assert.ok(ferryRoad.properties.durationSeconds < 3 * 3600);
assert.ok(ferryRoad.properties.roadEvidence.roadDistancesMeters.A1 > 90000);
assert.equal(ferryRoad.properties.roadEvidence.ferryMeters, 0);
assert.ok(ferryRoad.properties.roadEvidence.snappedWaypoints.every((point) => point.distance < 100));
assert.ok(ferryRoad.properties.roadCoordinateCount > 30);
assert.equal(ferryRoad.geometry.coordinates.length, ferryRoad.properties.roadCoordinateCount + 1);
const portCoordinate = ferryRoad.geometry.coordinates[ferryRoad.properties.roadCoordinateCount - 1];
assert.ok(Math.abs(portCoordinate[0] - 16.441) < 0.005 && Math.abs(portCoordinate[1] - 43.503) < 0.005);
assert.deepEqual(ferryRoad.geometry.coordinates.at(-1), [13.510, 43.615]);
assert.equal(routes.features.find((feature) => feature.properties.day === 21).properties.transport, true);
assert.ok(routes.features.filter((feature) => feature.properties.day !== 21).every((feature) => feature.properties.source === "osrm-driving-via-roadbook-anchors" && feature.geometry.coordinates.length > 10));

console.log("trip catalog tests passed");
