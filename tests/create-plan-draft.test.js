const assert = require("node:assert/strict");
const { Readable } = require("node:stream");
const handler = require("../api/create-plan-draft");
const { accommodationContextWithSlots, accommodationNameIssue, ferryIndexOf, isoForDay, maximumDistance, normalizeInputDay, protectedStartIssue, routeAuditSummary, routeContinuityIssue, routeDetailIssue, routeVerificationSummary, verifyAccommodationState } = handler._test;

const days = [
  { overnight: "Castelldefels" },
  {
    rest: false,
    origin: "La Patacona, Spain",
    destination: "Lleida, Spain",
    overnight: "Lleida (Stadtrand)"
  },
  {
    rest: false,
    origin: "Lleida, Spain",
    destination: "La Seu d Urgell, Spain",
    overnight: "La Seu d Urgell (Ortsrand)"
  }
];

assert.match(routeContinuityIssue(days, 1, 3), /Tag 2 beginnt in La Patacona/);
assert.equal(ferryIndexOf([{ title: "Normaler Tag", type: "Fahrtag", overnight: "Ziel" }]), -1);
assert.equal(ferryIndexOf([{ title: "Fähre Barcelona – Genua", type: "Fährtag", overnight: "Kabine auf der Fähre" }]), 0);

days[1].origin = "Castelldefels, Spain";
assert.equal(routeContinuityIssue(days, 1, 3), "");

days[2].destination = "Vielha, Spain";
assert.match(routeContinuityIssue(days, 1, 3), /Übernachtung ist aber/);

days[2] = { rest: true, origin: "", destination: "", overnight: "Lleida (Stadtrand)" };
assert.equal(routeContinuityIssue(days, 1, 3), "");

days[2].overnight = "Pamplona";
assert.match(routeContinuityIssue(days, 1, 3), /beginnt in Pamplona/);

assert.equal(maximumDistance("ca. 180–200 km"), 200);
const checkedRoute = [
  makeCheckedDay("Start", "Start", true),
  makeCheckedDay("Start – Vielha", "Vielha", false, {
    origin: "Start", destination: "Vielha", km: "220 km", time: "4 h 15",
    roads: "N-260 · C-28", note: "Pòrt dera Bonaigua; Schlechtwetteralternative über N-230 und Vielha-Tunnel."
  }),
  makeCheckedDay("Picos-Runde", "Potes", false, {
    origin: "Potes", destination: "Potes", km: "180–200 km", time: "4 h",
    roads: "N-621 · N-625 · AS-114", note: "Puerto de San Glorio; Schlechtwetteralternative durch Desfiladero de la Hermida.",
    waypoints: ["Riaño", "Arenas de Cabrales"]
  })
];
assert.equal(routeDetailIssue(checkedRoute, 1, 3), "");
assert.match(routeAuditSummary(checkedRoute, 1, 3), /Tag 2 „Start – Vielha“ mit bis zu 220 km/);
assert.match(routeVerificationSummary(checkedRoute, 1, 3)[1], /Vielha → Potes/);
assert.match(routeVerificationSummary(checkedRoute, 1, 3)[2], /Tag 2 bis Tag 3/);
checkedRoute[1].note = "Kurvige Fahrt nach Vielha.";
assert.match(routeDetailIssue(checkedRoute, 1, 3), /Bonaigua/);

assert.throws(() => verifyAccommodationState(checkedRoute, {}), /Übernachtungsblöcken/);
assert.equal(protectedStartIssue([{ origin: "Berikon, Switzerland", overnight: "Grenoble" }], { place: "Berikon" }), "");
assert.match(protectedStartIssue([{ origin: "Zürich", overnight: "Grenoble" }], { place: "Berikon" }), /geschützten Startpunkt Berikon/);
const expandedSlots = accommodationContextWithSlots(
  [{ title: "A" }, { title: "B" }, { title: "C" }],
  [{ id: "existing", title: "A" }]
);
assert.deepEqual(expandedSlots.allSlotIds, ["existing", "replanned-stop-1", "replanned-stop-2"]);
assert.equal(expandedSlots.expandedContext.length, 3, "replanning may add accommodation display slots");
assert.equal(accommodationNameIssue({ firstChoice: "Hotel Test", alternative: "Hotel Zwei" }), undefined);
assert.equal(accommodationNameIssue({ firstChoice: "Hotel Test mit Parkplatz und Adresse im Namensfeld" }), "firstChoice");

console.log("create-plan-draft tests passed");

const callApi = async (body) => {
  const request = Readable.from([Buffer.from(JSON.stringify(body))]);
  request.method = "POST";
  let responseBody = "";
  const response = {
    statusCode: 200,
    setHeader() {},
    end(value) { responseBody = value; }
  };
  await handler(request, response);
  return { status: response.statusCode, body: JSON.parse(responseBody) };
};

const makeDay = (title, overnight, rest = true) => ({
  title,
  type: rest ? "Ruhetag" : "Fahrtag",
  overnight,
  rest,
  origin: "",
  destination: "",
  waypoints: [],
  status: "planned"
});

function makeCheckedDay(title, overnight, rest, overrides = {}) {
  return {
    title,
    type: rest ? "Ruhetag" : "Fahrtag",
    overnight,
    km: "",
    time: "",
    roads: "Keine Fahrroute",
    points: "",
    note: "",
    travelNote: "",
    rest,
    origin: "",
    destination: "",
    waypoints: [],
    status: "planned",
    ...overrides
  };
}

const sourceChecksFor = (input, responseDays) => responseDays.flatMap((day, index) => day.rest ? [] : [{
  day: Number(input.replaceFromDay) + index,
  officialTitle: "Offizielle Verkehrsbehörde",
  officialUrl: "https://official.example/traffic",
  motorcycleTitle: "Motorrad-Routencheck",
  motorcycleUrl: "https://motorcycle.example/route",
  routingEvidence: "Straßenfolge, Sperrlage und Motorradtauglichkeit wurden gegengeprüft.",
  checkedAt: "2026-08-28T12:00:00Z",
  warnings: []
}]);

(async () => {
  process.env.ROADBOOK_PUBLISH_SECRET = "test-pin";
  process.env.OPENAI_API_KEY = "test-key";
  const currentDays = Array.from({ length: 27 }, () => makeDay("Basis", "Basisort"));
  currentDays.push(makeDay("Fähre Barcelona – Genua", "Kabine auf der Fähre", false));
  currentDays.push(makeDay("Genua – Aosta", "Aosta"));
  currentDays.push(makeDay("Aosta – Berikon", "Berikon"));

  const routeDays = Array.from({ length: 26 }, () => ({
    title: "Basis",
    type: "Ruhetag",
    overnight: "Basisort",
    km: "",
    time: "",
    roads: "Keine Fahrroute",
    points: "",
    note: "",
    travelNote: "",
    rest: true,
    origin: "",
    destination: "",
    waypoints: [],
    status: "changed"
  }));
  let fetchCount = 0;
  const modelRequests = [];
  const successfulModelFetch = async (_url, options) => {
    fetchCount += 1;
    const request = JSON.parse(options.body);
    modelRequests.push(request);
    const input = JSON.parse(request.input);
    const styleOnly = input.requestedChange?.scope === "route-style";
    const verification = Array.isArray(input.candidateSegment);
    const responseDays = styleOnly ? [{
      ...input.candidateSegment[0],
      km: "118 km",
      time: "1 h 35 min",
      roads: "A-1 · A-2",
      points: "Direkte, geprüfte Verbindung.",
      note: "Aktuelle Verkehrslage vor Abfahrt prüfen.",
      waypoints: [],
      routeStyle: "direct"
    }] : (verification ? input.candidateSegment : routeDays);
    return {
      ok: true,
      json: async () => ({
        output_text: JSON.stringify({
          summary: ["Route angepasst"],
          decision: "changed",
          replaceFromDay: input.replaceFromDay,
          replaceCount: input.replaceCount,
          days: responseDays,
          openItems: [],
          sourceChecks: sourceChecksFor(input, responseDays)
        })
      })
    };
  };
  global.fetch = successfulModelFetch;
  const routeResult = await callApi({
    secret: "test-pin",
    stage: "route",
    change: { type: "reroute", startDay: 2, instruction: "Neue Richtung" },
    days: currentDays
  });
  assert.equal(routeResult.status, 200);
  assert.equal(routeResult.body.draft.phase, "route");
  assert.equal(routeResult.body.draft.decision, "Vorgeschlagene Planänderung");
  assert.equal(routeResult.body.draft.verified, false);
  assert.equal(routeResult.body.draft.accommodations, undefined);
  assert.equal(fetchCount, 1, "route stage should call the model exactly once");
  assert.deepEqual(modelRequests[0].tools, [{ type: "web_search" }], "initial route generation should research the route on the web");
  assert.match(modelRequests[0].instructions, /offizielle Strassenbehoerden/);
  assert.match(modelRequests[0].instructions, /temporaeren Sperrung/);

  const verifiedResult = await callApi({
    secret: "test-pin",
    stage: "verify-route",
    days: routeResult.body.draft.days,
    replaceFromDay: routeResult.body.draft.replaceFromDay,
    change: routeResult.body.draft.request,
    lockedStay: routeResult.body.draft.lockedStay
  });
  assert.equal(verifiedResult.status, 200);
  assert.equal(verifiedResult.body.verifiedDraft.phase, "route");
  assert.equal(verifiedResult.body.verifiedDraft.verified, true);
  assert.equal(verifiedResult.body.verifiedDraft.verificationVersion, 3);
  assert.equal(fetchCount, 8, "long route verification should check seven bounded chunks");
  modelRequests.slice(1, 8).forEach((request) => {
    assert.deepEqual(request.tools, [{ type: "web_search" }], "route verification should use web search");
    assert.equal(request.reasoning.effort, "medium", "long route chunks should receive deeper verification");
    assert.ok(JSON.parse(request.input).candidateSegment.length <= 4, "verification chunks should stay bounded");
  });

  const movedStartDays = currentDays.map((day) => ({ ...day }));
  movedStartDays[0] = makeCheckedDay("Zürich – Basisort", "Basisort", false, {
    origin: "Zürich", destination: "Basisort", km: "120 km", time: "2 h", roads: "A1"
  });
  global.fetch = async (_url, options) => {
    const request = JSON.parse(options.body);
    const input = JSON.parse(request.input);
    return {
      ok: true,
      json: async () => ({ output_text: JSON.stringify({
        summary: ["Route geprüft"], decision: "changed", replaceFromDay: input.replaceFromDay, replaceCount: input.replaceCount,
        days: input.candidateSegment, openItems: [], sourceChecks: sourceChecksFor(input, input.candidateSegment)
      }) })
    };
  };
  const protectedStartResult = await callApi({
    secret: "test-pin",
    stage: "verify-route",
    days: movedStartDays,
    replaceFromDay: 1,
    change: { type: "reroute", startDay: 1 },
    lockedStart: { place: "Berikon" }
  });
  assert.equal(protectedStartResult.status, 500);
  assert.match(protectedStartResult.body.error, /geschützten Startpunkt Berikon/);
  global.fetch = successfulModelFetch;

  const styleDays = currentDays.map((day) => ({ ...day }));
  styleDays[1] = makeCheckedDay("Basisort – Zielort", "Zielort", false, {
    origin: "Basisort",
    destination: "Zielort",
    km: "120 km",
    time: "1 h 40 min",
    roads: "A-1 · A-2",
    points: "Direkte Verbindung.",
    routeStyle: "direct",
    status: "changed"
  });
  styleDays[2] = makeCheckedDay("Zielort", "Zielort", true);
  assert.equal(styleDays.findIndex((day) => /Fähre/.test(day.title)), 27);
  assert.equal(ferryIndexOf(styleDays.map(normalizeInputDay)), 27);
  assert.equal(isoForDay(27), "2026-10-21");
  const styleVerifiedResult = await callApi({
    secret: "test-pin",
    stage: "verify-route",
    days: styleDays,
    replaceFromDay: 2,
    change: { type: "route-style", scope: "route-style", startDay: 2 }
  });
  assert.equal(styleVerifiedResult.status, 200);
  assert.equal(styleVerifiedResult.body.verifiedDraft.replaceCount, 1);
  assert.equal(styleVerifiedResult.body.verifiedDraft.days[1].routeStyle, "direct");
  assert.equal(styleVerifiedResult.body.verifiedDraft.days[2].overnight, "Zielort", "the following day must remain unchanged");
  assert.deepEqual(modelRequests[8].tools, [{ type: "web_search" }], "route-style verification should use web search");
  assert.equal(JSON.parse(modelRequests[8].input).candidateSegment.length, 1, "only the selected stage should be verified");

  const adriaDays = [
    makeCheckedDay("Berikon – Senj", "Senj", false, { origin: "Berikon", destination: "Senj", km: "700 km", time: "8 h", roads: "A3 · A13 · A14 · A12 · A10 · A11 · A1 · D8", routeStyle: "direct" }),
    makeCheckedDay("Senj", "Senj", true)
  ];
  const adriaVerifiedResult = await callApi({
    secret: "test-pin",
    stage: "verify-route",
    days: adriaDays,
    trip: { id: "trip_adria_2026", name: "Adria & Balkan 2026", startDate: "2026-09-24", fixPoints: [], planningProfile: { countries: ["Kroatien"], officialSources: ["HAK"], motorcycleSources: ["Motorradführer"] } },
    replaceFromDay: 1,
    change: { type: "Etappe bearbeiten", scope: "stage" }
  });
  assert.equal(adriaVerifiedResult.status, 200, adriaVerifiedResult.body.error);
  assert.equal(adriaVerifiedResult.body.verifiedDraft.verificationVersion, 3);
  assert.equal(adriaVerifiedResult.body.verifiedDraft.sourceChecks.length, 1);

  global.fetch = async () => { throw new Error("accommodation stage unexpectedly called the model"); };
  const unverifiedAccommodationResult = await callApi({
    secret: "test-pin",
    stage: "accommodations",
    days: routeResult.body.draft.days,
    accommodations: []
  });
  assert.equal(unverifiedAccommodationResult.status, 500);
  assert.match(unverifiedAccommodationResult.body.error, /aktuellen Prüfung/);
  const accommodationResult = await callApi({
    secret: "test-pin",
    stage: "accommodations",
    routeVerified: true,
    routeVerificationVersion: 2,
    routeSummary: verifiedResult.body.verifiedDraft.summary,
    days: verifiedResult.body.verifiedDraft.days,
    accommodations: [
      { id: "base", title: "Basisort", currentFirstChoice: "Basis Hotel" },
      { id: "ferry", title: "Kabine auf der Fähre", currentFirstChoice: "Fährkabine" },
      { id: "aosta", title: "Aosta", currentFirstChoice: "Aosta Hotel" }
    ]
  });
  assert.equal(accommodationResult.status, 200);
  assert.ok(accommodationResult.body.accommodationPlan.accommodations.base);
  assert.equal(accommodationResult.body.accommodationAudit.version, 1);
  assert.match(accommodationResult.body.accommodationAudit.summary[0], /Ort, Reihenfolge, Datum und Nächtezahl/);
  assert.equal(fetchCount, 10, "accommodation stage should not recalculate the route");

  const accommodationVerificationResult = await callApi({
    secret: "test-pin",
    stage: "verify-accommodations",
    days: verifiedResult.body.verifiedDraft.days,
    accommodations: accommodationResult.body.accommodationPlan.accommodations
  });
  assert.equal(accommodationVerificationResult.status, 200);
  assert.equal(accommodationVerificationResult.body.accommodationAudit.version, 1);
  console.log("two-stage planning API tests passed");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
