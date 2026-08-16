const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { parseTripData } = require("../lib/trip-data");

const root = path.join(__dirname, "..");
const tripData = parseTripData(fs.readFileSync(path.join(root, "data", "trip-spanien-2026.js"), "utf8"));

test("published trip has one unambiguous sequence of 30 calendar days", () => {
  assert.equal(tripData.publishedDays.length, 30);
  assert.deepEqual(tripData.publishedDays.map((day) => day.day), Array.from({ length: 30 }, (_, index) => index + 1));
  assert.deepEqual(tripData.publishedDays.map((day) => day.id), Array.from({ length: 30 }, (_, index) => `day-${index + 1}`));
});

test("original plan is a complete, fixed fallback snapshot", () => {
  assert.equal(tripData.originalPlanVersion, "2026-08-16T14:49:12.000Z");
  assert.equal(tripData.baselineDays.length, 30);
  assert.deepEqual(tripData.baselineDays.map((day) => day.id), Array.from({ length: 30 }, (_, index) => `day-${index + 1}`));
  assert.equal(tripData.baselineDays[10].overnight, "La Patacona");
  assert.match(tripData.baselineDays[10].destination, /Olympia Hotel/);
  assert.equal(tripData.baselineDays[13].overnight, "Águilas");
  assert.equal(tripData.baselineDays[25].overnight, "Castelldefels");
  assert.equal(tripData.baselineDays[26].overnight, "Castelldefels");
  assert.equal(Object.keys(tripData.baselineAccommodations).length, 19);
  assert.equal(tripData.baselineAccommodations.alboraya.firstChoice, "Olympia Hotel, Events & Spa · Alboraya");
});

test("corrected destinations and overnight places are canonical", () => {
  assert.equal(tripData.publishedDays[10].overnight, "La Patacona");
  assert.match(tripData.publishedDays[10].destination, /Olympia Hotel/);
  assert.match(tripData.publishedDays[12].origin, /Olympia Hotel/);
  assert.deepEqual(tripData.places.laPatacona, { name: "La Patacona", latitude: 39.4953, longitude: -0.3525 });
  assert.equal(tripData.publishedDays[13].overnight, "Águilas");
  assert.match(tripData.publishedDays[13].destination, /Senator Águilas/);
  assert.equal(tripData.publishedDays[14].overnight, "Monachil");
  assert.match(tripData.publishedDays[14].origin, /Senator Águilas/);
  assert.equal(tripData.publishedDays[25].title, "Zaragoza – Castelldefels");
  assert.equal(tripData.publishedDays[25].overnight, "Castelldefels");
  assert.equal(tripData.publishedDays[26].title, "Castelldefels / Fährvorbereitung");
  assert.equal(tripData.publishedDays[26].overnight, "Castelldefels");
  assert.equal(tripData.publishedDays[28].overnight, "Aosta");
});

test("route and accommodation destinations contain no obsolete either-or places", () => {
  const activePlan = JSON.stringify({
    publishedDays: tripData.publishedDays,
    baselineDays: tripData.baselineDays,
    accommodations: tripData.accommodations,
    baselineAccommodations: tripData.baselineAccommodations
  });
  assert.doesNotMatch(activePlan, /Lourmarin oder|N[iî]mes oder|Aosta oder Como|aosta-como/i);
  assert.equal(tripData.accommodations.lourmarin.title, "Lourmarin");
  assert.equal(tripData.accommodations.nimes.title, "Nîmes");
  assert.equal(tripData.accommodations.aosta.title, "Aosta");
});

test("accommodation schedule covers exactly 29 consecutive nights", () => {
  const stays = Object.entries(tripData.accommodations)
    .map(([id, stay]) => ({ id, ...stay }))
    .sort((left, right) => left.startDate.localeCompare(right.startDate));
  assert.equal(stays.length, 19);
  assert.equal(stays[0].startDate, tripData.trip.startDate);
  assert.equal(stays.at(-1).endDate, tripData.trip.endDate);
  assert.equal(stays.reduce((sum, stay) => sum + Math.round((Date.parse(stay.endDate) - Date.parse(stay.startDate)) / 86400000), 0), 29);
  stays.slice(1).forEach((stay, index) => assert.equal(stay.startDate, stays[index].endDate));
  assert.equal(tripData.accommodations.alboraya.title, "La Patacona");
  assert.equal(tripData.accommodations.alboraya.firstChoice, "Olympia Hotel, Events & Spa · Alboraya");
  assert.equal(tripData.accommodations.alboraya.alternative, "La Mozaira · Alboraya");
  assert.equal(tripData.accommodations.aguilas.firstChoice, "Senator Águilas");
  assert.equal(tripData.accommodations.aguilas.alternative, "Hotel El Paso");
  assert.equal(tripData.accommodations["castelldefels-2"].title, "Castelldefels");
  assert.equal(tripData.accommodations["castelldefels-2"].firstChoice, "ibis Barcelona Castelldefels");
  assert.equal(tripData.baselineAccommodations["castelldefels-2"].firstChoice, "ibis Barcelona Castelldefels");
  Object.values({ ...tripData.accommodations, ...tripData.baselineAccommodations }).forEach((stay) => {
    assert.doesNotMatch(stay.firstChoice || "", /dasselbe|gleiche Unterkunft|wie am \d/i);
  });
  assert.equal(tripData.accommodations.aosta.title, "Aosta");
  assert.equal(tripData.accommodations.ferry.alternative, undefined);

  const scheduledNights = stays.flatMap((stay) => {
    const nightCount = Math.round((Date.parse(stay.endDate) - Date.parse(stay.startDate)) / 86400000);
    const overnight = stay.id === "ferry" ? stay.firstChoice : stay.title.split(" / ")[0];
    return Array.from({ length: nightCount }, () => overnight);
  });
  assert.deepEqual(scheduledNights, tripData.publishedDays.slice(0, -1).map((day) => day.overnight));
});

test("start, ferry and end are bound to protected stage numbers", () => {
  assert.deepEqual(tripData.fixPoints.map((fixPoint) => fixPoint.stageDay), [1, 28, 30]);
  assert.deepEqual(tripData.fixPoints.map((fixPoint) => fixPoint.kind), ["start", "transport", "end"]);
});
