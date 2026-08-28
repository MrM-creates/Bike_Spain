const test = require("node:test");
const assert = require("node:assert/strict");
const {
  PLANNING_POLICY,
  normalizeTripContext,
  resolvedFixPoints,
  nextProtectedAnchor,
  sourcesForTrip,
  fixPointIssue,
  verificationInstructions
} = require("../lib/planning-policy");

const days = Array.from({ length: 10 }, (_, index) => ({
  title: `Tag ${index + 1}`,
  origin: index ? `Ort ${index}` : "Berikon",
  destination: `Ort ${index + 1}`,
  overnight: `Ort ${index + 1}`,
  roads: "A1",
  waypoints: []
}));

const context = normalizeTripContext({
  id: "trip_test",
  name: "Testreise",
  startDate: "2027-05-01",
  startPlace: "Berikon",
  endPlace: "Berikon",
  planningProfile: { countries: ["Schweiz", "Kroatien"] },
  fixPoints: [
    { kind: "start", title: "Start", stageDay: 1, locks: ["date", "place", "stage"] },
    { kind: "stay", title: "Gebuchtes Hotel", stageDay: 5, place: "Ort 5", locks: ["date", "place", "stage"] },
    { kind: "event", title: "Treffen", startsAt: "2027-05-08T18:00:00+02:00", locks: ["date", "place", "stage"] },
    { kind: "end", title: "Rückkehr", stageDay: 10, locks: ["date", "place", "stage"] }
  ]
});

test("planning policy is versioned and independent of a concrete trip", () => {
  assert.equal(PLANNING_POLICY.version, 4);
  assert.doesNotMatch(JSON.stringify(PLANNING_POLICY), /Barcelona|Genua|Spanienreise/);
});

test("arbitrary trip fix points resolve to protected planning anchors", () => {
  assert.deepEqual(resolvedFixPoints(context, days).map((fix) => [fix.kind, fix.dayIndex]), [
    ["start", 0], ["stay", 4], ["event", 7], ["end", 9]
  ]);
  assert.equal(nextProtectedAnchor(context, days, 1).title, "Gebuchtes Hotel");
  assert.equal(nextProtectedAnchor(context, days, 4).title, "Treffen");
});

test("country registry supplies official and motorcycle sources", () => {
  const sources = sourcesForTrip(context);
  assert.ok(sources.official.some((source) => /HAK/.test(source)));
  assert.ok(sources.official.some((source) => /ASTRA/.test(source)));
  assert.ok(sources.motorcycle.length >= 2);
  const prompt = verificationInstructions({ context, singleStage: true, routeStyleOnly: false });
  assert.match(prompt, /offizielle Quelle/);
  assert.match(prompt, /motorradspezifische Quelle/);
});

test("changing any locked fix point is rejected regardless of its kind", () => {
  const changed = structuredClone(days);
  changed[4].overnight = "Anderer Ort";
  assert.match(fixPointIssue(days, changed, context), /Gebuchtes Hotel/);
  const unchanged = structuredClone(days);
  assert.equal(fixPointIssue(days, unchanged, context), "");
});

test("a start fix point protects the departure without freezing the whole first stage", () => {
  const startContext = normalizeTripContext({
    startDate: "2027-05-01",
    fixPoints: [{ kind: "start", title: "Start", startsAt: "2027-05-01T08:00:00+02:00", locks: ["date", "place"] }]
  });
  const changedDestination = structuredClone(days);
  changedDestination[0].destination = "Neues Tagesziel";
  changedDestination[0].overnight = "Neues Tagesziel";
  assert.equal(fixPointIssue(days, changedDestination, startContext), "");
  const changedOrigin = structuredClone(days);
  changedOrigin[0].origin = "Anderer Start";
  assert.match(fixPointIssue(days, changedOrigin, startContext), /Start/);
});
