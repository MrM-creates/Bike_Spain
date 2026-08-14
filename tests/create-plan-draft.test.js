const assert = require("node:assert/strict");
const { Readable } = require("node:stream");
const handler = require("../api/create-plan-draft");
const { routeContinuityIssue } = handler._test;

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

days[1].origin = "Castelldefels, Spain";
assert.equal(routeContinuityIssue(days, 1, 3), "");

days[2].destination = "Vielha, Spain";
assert.match(routeContinuityIssue(days, 1, 3), /Übernachtung ist aber/);

days[2] = { rest: true, origin: "", destination: "", overnight: "Lleida (Stadtrand)" };
assert.equal(routeContinuityIssue(days, 1, 3), "");

days[2].overnight = "Pamplona";
assert.match(routeContinuityIssue(days, 1, 3), /beginnt in Pamplona/);

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
  global.fetch = async (_url, options) => {
    fetchCount += 1;
    modelRequests.push(JSON.parse(options.body));
    return {
      ok: true,
      json: async () => ({
        output_text: JSON.stringify({
          summary: ["Route angepasst"],
          decision: "changed",
          replaceFromDay: 2,
          replaceCount: 26,
          days: routeDays,
          openItems: []
        })
      })
    };
  };
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
  assert.equal(modelRequests[0].tools, undefined, "initial route generation should not use web search");

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
  assert.equal(fetchCount, 2, "route verification should call the model exactly once");
  assert.deepEqual(modelRequests[1].tools, [{ type: "web_search" }], "route verification should use web search");

  global.fetch = async () => { throw new Error("accommodation stage unexpectedly called the model"); };
  const unverifiedAccommodationResult = await callApi({
    secret: "test-pin",
    stage: "accommodations",
    days: routeResult.body.draft.days,
    accommodations: []
  });
  assert.equal(unverifiedAccommodationResult.status, 500);
  assert.match(unverifiedAccommodationResult.body.error, /automatisch geprüft/);
  const accommodationResult = await callApi({
    secret: "test-pin",
    stage: "accommodations",
    routeVerified: true,
    routeSummary: verifiedResult.body.verifiedDraft.summary,
    days: verifiedResult.body.verifiedDraft.days,
    accommodations: [
      { id: "base", title: "Basisort", currentFirstChoice: "Basis Hotel" },
      { id: "ferry", title: "Kabine auf der Fähre", currentFirstChoice: "Fährkabine" },
      { id: "aosta-como", title: "Aosta", currentFirstChoice: "Aosta Hotel" }
    ]
  });
  assert.equal(accommodationResult.status, 200);
  assert.ok(accommodationResult.body.accommodationPlan.accommodations.base);
  assert.equal(fetchCount, 2, "accommodation stage should not recalculate the route");
  console.log("two-stage planning API tests passed");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
