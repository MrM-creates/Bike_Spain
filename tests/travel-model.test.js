const assert = require("node:assert/strict");
const {
  importLegacyRoadbook,
  assertLegacyParity,
  parseDistanceMeters,
  parseDurationSeconds
} = require("../assets/travel-model");

const days = [
  { id: "d1", title: "Berikon – Grenoble", type: "Anreise", origin: "Berikon, Switzerland", destination: "Grenoble, France", overnight: "Grenoble", km: "404 km", time: "4 h 20", roads: "A1 · A41" },
  { id: "d2", title: "Grenoble", type: "Ruhetag", overnight: "Grenoble", rest: true, roads: "Keine Fahrroute" },
  { id: "d3", title: "Grenoble – Barcelona", type: "Fahrtag", origin: "Grenoble, France", destination: "Barcelona, Spain", overnight: "Barcelona", km: "ca. 620 km", time: "6 h 30", routeStyle: "direct" },
  { id: "d4", title: "Fähre Barcelona – Genua", type: "Fährtag", origin: "Barcelona, Spain", destination: "Genua, Italy", overnight: "Kabine auf der Fähre" }
];

const model = importLegacyRoadbook({
  planKind: "original",
  publishedVersion: "2026-08-15T08:00:00.000Z",
  days,
  accommodations: [{ id: "grenoble", title: "Grenoble", startDate: "2026-09-24", endDate: "2026-09-26", booking: "booked", currentFirstChoice: "Hotel Test", currentFirstChoiceUrl: "https://example.com/hotel", currentAlternative: "Hotel Alternative", currentAlternativeUrl: "https://example.com/alternative", parking: "Garage bestätigt" }],
  trip: {
    id: "trip_test",
    name: "Testreise 2026",
    startDate: "2026-09-24",
    startPlace: "Berikon",
    endPlace: "Genua",
    transportMatchers: ["Fährtag", "Fähre"],
    fixPoints: [
      { kind: "start", title: "Start Berikon", place: "Berikon" },
      { kind: "transport", title: "Fähre", stageTitlePattern: "Fähre Barcelona", bookingRef: "ferry-confirmation" },
      { kind: "end", title: "Ende Genua", place: "Genua" }
    ],
    narrativeSegments: [{ title: "Süden", text: "Nach Barcelona", fromDay: 1, toDay: 4 }]
  }
});

assertLegacyParity(model, { sourceDays: 4, stages: 4, rideStages: 2, restStages: 1, transportStages: 1, stays: 3, fixPoints: 3 });
assert.equal(model.trip.mode, "motorcycle");
assert.equal(model.source.planKind, "original");
assert.equal(model.source.publishedVersion, "2026-08-15T08:00:00.000Z");
assert.equal(model.trip.publishedRevisionId, model.revision.id);
assert.equal(model.revision.phase, "ready");
assert.equal(model.revision.stages[0].date, "2026-09-24");
assert.equal(model.revision.stages[1].kind, "rest");
assert.equal(model.revision.stages[3].kind, "transport");
assert.equal(model.revision.routeVariants[0].style, "direct");
assert.equal(model.revision.routeVariants[1].style, "direct");
assert.match(model.revision.routeVariants[0].providerRouteRef, /^https:\/\/www\.google\.com\/maps\/dir\/\?/);
assert.match(model.revision.routeVariants[0].providerRouteRef, /origin=Berikon%2C\+Switzerland/);
assert.equal(model.revision.stays[0].nightCount, 2);
assert.equal(model.revision.bookings[0].status, "booked");
assert.equal(model.revision.bookings[1].protected, true);
assert.equal(model.revision.stays[0].accommodationOptionIds.length, 2);
assert.equal(model.revision.accommodationOptions[1].name, "Hotel Alternative");
assert.equal(model.revision.fixPoints[1].targetRef.id, model.revision.stages[3].id);
assert.equal(model.revision.narrativeSegments[0].stageIds.length, 4);
assert.equal(parseDistanceMeters("ca. 180–200 km"), 200000);
assert.equal(parseDurationSeconds("ca. 4 h 25"), 15900);

console.log("travel model tests passed");
