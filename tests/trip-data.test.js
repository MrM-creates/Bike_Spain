const test = require("node:test");
const assert = require("node:assert/strict");
const { parseTripData, serializeTripData, normalizePlanKind } = require("../lib/trip-data");

test("canonical trip data round-trips without changing its content", () => {
  const input = { schemaVersion: 1, publishedVersion: "v1", publishedDays: [{ day: 1 }] };
  assert.deepEqual(parseTripData(serializeTripData(input)), input);
});

test("legacy original plan kind maps to the published baseline", () => {
  assert.equal(normalizePlanKind("original"), "published");
  assert.equal(normalizePlanKind("published"), "published");
  assert.equal(normalizePlanKind("adjusted"), "adjusted");
});
