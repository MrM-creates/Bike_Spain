const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { Readable } = require("node:stream");
const createPlanDraft = require("../api/create-plan-draft");
const publishRoadbook = require("../api/publish-roadbook");
const publishAccommodations = require("../api/publish-accommodations");
const { parseTripData } = require("../lib/trip-data");

const root = path.join(__dirname, "..");
const source = fs.readFileSync(path.join(root, "data", "trip-spanien-2026.js"), "utf8");
const tripData = parseTripData(source);
const { expectedStays, placesMatch, protectedStartIssue, routeContinuityIssue, verifyAccommodationState } = createPlanDraft._test;

const call = async (handler, body) => {
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

const response = (body, ok = true, status = 200) => ({
  ok,
  status,
  text: async () => JSON.stringify(body),
  json: async () => body
});

test("Castelldefels blocks follow changed travel days instead of fixed labels", () => {
  const original = expectedStays(tripData.publishedDays).filter((stay) => placesMatch(stay.title, "Castelldefels"));
  assert.deepEqual(original.map((stay) => [stay.startDate, stay.endDate, stay.nightCount]), [
    ["2026-09-29", "2026-10-01", 2],
    ["2026-10-19", "2026-10-21", 2]
  ]);

  const changed = structuredClone(tripData.publishedDays);
  changed[25].overnight = "Zaragoza";
  const recalculated = expectedStays(changed).filter((stay) => placesMatch(stay.title, "Castelldefels"));
  assert.deepEqual(recalculated.map((stay) => [stay.startDate, stay.endDate, stay.nightCount]), [
    ["2026-09-29", "2026-10-01", 2],
    ["2026-10-20", "2026-10-21", 1]
  ]);
});

test("hotel replacement at the same stop does not alter or invalidate the route", () => {
  const stays = Object.entries(tripData.accommodations)
    .sort(([, left], [, right]) => left.startDate.localeCompare(right.startDate));
  const state = Object.fromEntries(stays.map(([id, stay], index) => [id, {
    ...stay,
    firstChoice: id === "alboraya" ? "Anderes Hotel in La Patacona" : stay.firstChoice,
    order: String(index + 1),
    inactive: ""
  }]));
  const audit = verifyAccommodationState(tripData.publishedDays, state);
  assert.equal(audit.version, 1);
  assert.equal(routeContinuityIssue(tripData.publishedDays, 1, 27), "");
});

test("moving an accommodation to another place is rejected until adjacent stages match", () => {
  const stays = Object.entries(tripData.accommodations)
    .sort(([, left], [, right]) => left.startDate.localeCompare(right.startDate));
  const state = Object.fromEntries(stays.map(([id, stay], index) => [id, {
    ...stay,
    title: id === "alboraya" ? "Valencia Altstadt" : stay.title,
    order: String(index + 1),
    inactive: ""
  }]));
  assert.throws(() => verifyAccommodationState(tripData.publishedDays, state), /passt nicht zur Route/);
});

test("replanning preserves the selected boundary and all protected fix points", () => {
  const selectedIndex = 11;
  const candidate = structuredClone(tripData.publishedDays);
  candidate[selectedIndex].origin = "Barcelona";
  assert.match(routeContinuityIssue(candidate, selectedIndex, 27), /beginnt in Barcelona/);
  assert.equal(protectedStartIssue(tripData.publishedDays, { place: "Berikon" }), "");
  assert.match(protectedStartIssue([{ ...tripData.publishedDays[0], origin: "Zürich" }], { place: "Berikon" }), /geschützten Startpunkt/);
  assert.equal(tripData.publishedDays[27].title, "Fähre Barcelona – Genua");
  assert.equal(tripData.publishedDays[29].destination, "Berikon, Switzerland");
});

test("all route replanning requests produce bounded local drafts", async () => {
  const previousFetch = global.fetch;
  const oldSecret = process.env.ROADBOOK_PUBLISH_SECRET;
  const oldKey = process.env.OPENAI_API_KEY;
  process.env.ROADBOOK_PUBLISH_SECRET = "test-pin";
  process.env.OPENAI_API_KEY = "test-key";
  const seen = [];
  global.fetch = async (_url, options = {}) => {
    const request = JSON.parse(options.body);
    const input = JSON.parse(request.input);
    seen.push(input.requestedChange);
    const days = structuredClone(input.currentSegment);
    const type = input.requestedChange.type;
    const setRest = (day, overnight, status = "changed") => Object.assign(day, {
      title: overnight,
      type: "Ruhetag",
      overnight,
      km: "",
      time: "",
      roads: "Keine Fahrroute",
      points: "",
      note: "",
      rest: true,
      origin: "",
      destination: "",
      waypoints: [],
      status,
      routeStyle: ""
    });
    const setTransfer = (day, origin, destination) => Object.assign(day, {
      title: `${origin} – ${destination}`,
      type: "Fahrtag",
      overnight: destination,
      km: "200 km",
      time: "3 h",
      roads: "A-2",
      points: "Direkte Verbindung",
      note: "Aktuelle Lage prüfen.",
      rest: false,
      origin,
      destination,
      waypoints: [],
      status: "changed",
      routeStyle: "direct"
    });
    if (type === "Aufenthalt verlaengern" || type === "Aufenthalt verkuerzen") {
      const target = input.requestedChange.targetNightsAtPlace;
      setTransfer(days[0], input.previousDay.overnight, "Falset");
      for (let index = 1; index < target; index += 1) setRest(days[index], "Falset");
      if (days[target]) setTransfer(days[target], "Falset", "Barcelona");
      for (let index = target + 1; index < days.length; index += 1) setRest(days[index], "Barcelona");
    } else if (type === "Etappe oder Ausflug auslassen") {
      setRest(days[0], days[0].overnight, "skipped");
    } else {
      days[0].note = `${days[0].note || ""} Neu geplant.`.trim();
      days[0].status = "changed";
    }
    return response({ output_text: JSON.stringify({
      summary: [`${type} umgesetzt`],
      decision: "changed",
      replaceFromDay: input.replaceFromDay,
      replaceCount: input.replaceCount,
      days,
      openItems: []
    }) });
  };
  try {
    const cases = [
      { change: { type: "extend", place: "Falset", nights: 1 }, expectedStart: 8, nights: 3 },
      { change: { type: "shorten", place: "Falset", nights: 1 }, expectedStart: 8, nights: 1 },
      { change: { type: "skip", place: "Priorat-Runde" }, expectedStart: 9, skipped: true },
      { change: { type: "reroute", startDay: 12, instruction: "Ab Valencia Richtung Norden neu planen" }, expectedStart: 12 },
      { change: { type: "free", startDay: 14, instruction: "Ruhetag verschieben und Etappen kürzen" }, expectedStart: 14 }
    ];
    for (const useCase of cases) {
      const result = await call(createPlanDraft, {
        secret: "test-pin",
        stage: "route",
        change: useCase.change,
        days: tripData.publishedDays
      });
      assert.equal(result.status, 200, result.body.error);
      assert.equal(result.body.draft.replaceFromDay, useCase.expectedStart);
      assert.equal(result.body.draft.days.length, tripData.publishedDays.length);
      assert.deepEqual(
        result.body.draft.days.slice(0, useCase.expectedStart - 1).map((day) => day.title),
        tripData.publishedDays.slice(0, useCase.expectedStart - 1).map((day) => day.title)
      );
      assert.equal(result.body.draft.days[27].title, "Fähre Barcelona – Genua");
      assert.equal(result.body.draft.days[29].destination, "Berikon, Switzerland");
      if (useCase.nights) assert.equal(result.body.draft.lockedStay.nights, useCase.nights);
      if (useCase.skipped) assert.equal(result.body.draft.days[useCase.expectedStart - 1].status, "skipped");
    }
    assert.deepEqual(seen.map((change) => change.type), [
      "Aufenthalt verlaengern",
      "Aufenthalt verkuerzen",
      "Etappe oder Ausflug auslassen",
      "Ab diesem Tag neu planen",
      "Weitere Anpassung"
    ]);
  } finally {
    global.fetch = previousFetch;
    if (oldSecret === undefined) delete process.env.ROADBOOK_PUBLISH_SECRET;
    else process.env.ROADBOOK_PUBLISH_SECRET = oldSecret;
    if (oldKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = oldKey;
  }
});

test("invalid and incomplete replanning input leaves the current plan untouched", async () => {
  const previousFetch = global.fetch;
  const oldSecret = process.env.ROADBOOK_PUBLISH_SECRET;
  const oldKey = process.env.OPENAI_API_KEY;
  process.env.ROADBOOK_PUBLISH_SECRET = "test-pin";
  process.env.OPENAI_API_KEY = "test-key";
  let modelCalls = 0;
  global.fetch = async (_url, options = {}) => {
    modelCalls += 1;
    const input = JSON.parse(JSON.parse(options.body).input);
    return response({ output_text: JSON.stringify({
      summary: [], decision: "changed", replaceFromDay: input.replaceFromDay,
      replaceCount: input.replaceCount, days: input.currentSegment.slice(1), openItems: []
    }) });
  };
  try {
    const missingInstruction = await call(createPlanDraft, {
      secret: "test-pin", stage: "route", change: { type: "reroute", startDay: 12 }, days: tripData.publishedDays
    });
    assert.equal(missingInstruction.status, 500);
    assert.match(missingInstruction.body.error, /beschreibe/);
    assert.equal(modelCalls, 0);

    const missingPlace = await call(createPlanDraft, {
      secret: "test-pin", stage: "route", change: { type: "skip", place: "Nicht vorhandener Ort" }, days: tripData.publishedDays
    });
    assert.equal(missingPlace.status, 500);
    assert.match(missingPlace.body.error, /nicht gefunden/);
    assert.equal(modelCalls, 0);

    const incomplete = await call(createPlanDraft, {
      secret: "test-pin", stage: "route", change: { type: "reroute", startDay: 12, instruction: "Neu planen" }, days: tripData.publishedDays
    });
    assert.equal(incomplete.status, 500);
    assert.match(incomplete.body.error, /statt .* benötigten Tagen/);
  } finally {
    global.fetch = previousFetch;
    if (oldSecret === undefined) delete process.env.ROADBOOK_PUBLISH_SECRET;
    else process.env.ROADBOOK_PUBLISH_SECRET = oldSecret;
    if (oldKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = oldKey;
  }
});

test("stale roadbook publication is rejected before GitHub is changed", async () => {
  const previousFetch = global.fetch;
  const previousEnv = { ...process.env };
  let writes = 0;
  process.env.GITHUB_ROADBOOK_TOKEN = "test-token";
  process.env.ROADBOOK_PUBLISH_SECRET = "test-pin";
  process.env.GITHUB_BRANCH = "codex/replanning-e2e-test";
  global.fetch = async (_url, options = {}) => {
    if (options.method && options.method !== "GET") writes += 1;
    return response({ content: Buffer.from(source).toString("base64"), sha: "file-sha" });
  };
  try {
    const result = await call(publishRoadbook, {
      secret: "test-pin",
      days: tripData.publishedDays,
      baseVersion: "stale-version"
    });
    assert.equal(result.status, 409);
    assert.match(result.body.error, /inzwischen geändert/);
    assert.equal(writes, 0);
  } finally {
    global.fetch = previousFetch;
    process.env = previousEnv;
  }
});

test("roadbook publication commits only the canonical data file to the configured branch", async () => {
  const previousFetch = global.fetch;
  const previousEnv = { ...process.env };
  const requests = [];
  process.env.GITHUB_ROADBOOK_TOKEN = "test-token";
  process.env.ROADBOOK_PUBLISH_SECRET = "test-pin";
  process.env.GITHUB_BRANCH = "codex/replanning-e2e-test";
  global.fetch = async (url, options = {}) => {
    requests.push({ url, options });
    if (/\/git\/ref\/heads\//.test(url)) return response({ object: { sha: "head-sha" } });
    if (/\/git\/commits\/head-sha$/.test(url)) return response({ tree: { sha: "tree-sha" } });
    if (/\/git\/blobs$/.test(url)) return response({ sha: "blob-sha" });
    if (/\/git\/trees$/.test(url)) return response({ sha: "new-tree-sha" });
    if (/\/git\/commits$/.test(url)) return response({ sha: "new-commit-sha" });
    if (/\/git\/refs\/heads\//.test(url)) return response({ object: { sha: "new-commit-sha" } });
    if (/\/contents\//.test(url)) return response({ content: Buffer.from(source).toString("base64"), sha: "file-sha" });
    throw new Error(`Unexpected GitHub request: ${url}`);
  };
  try {
    const result = await call(publishRoadbook, {
      secret: "test-pin",
      days: tripData.publishedDays,
      accommodations: tripData.accommodations,
      baseVersion: tripData.publishedVersion,
      reason: "E2E preview test"
    });
    assert.equal(result.status, 200);
    assert.equal(result.body.branch, "codex/replanning-e2e-test");
    assert.deepEqual(result.body.paths, ["data/trip-spanien-2026.js"]);
    const treeRequest = requests.find(({ url }) => /\/git\/trees$/.test(url));
    const treeBody = JSON.parse(treeRequest.options.body);
    assert.deepEqual(treeBody.tree.map((item) => item.path), ["data/trip-spanien-2026.js"]);
    assert.ok(requests.some(({ url, options }) => /refs\/heads\/codex%2Freplanning-e2e-test$/.test(url) && options.method === "PATCH"));
  } finally {
    global.fetch = previousFetch;
    process.env = previousEnv;
  }
});

test("publishing a hotel replacement leaves all roadbook days unchanged", async () => {
  const previousFetch = global.fetch;
  const previousEnv = { ...process.env };
  let publishedContent = "";
  process.env.GITHUB_ROADBOOK_TOKEN = "test-token";
  process.env.ROADBOOK_PUBLISH_SECRET = "test-pin";
  process.env.GITHUB_BRANCH = "codex/replanning-e2e-test";
  global.fetch = async (url, options = {}) => {
    if (options.method === "PUT") {
      publishedContent = Buffer.from(JSON.parse(options.body).content, "base64").toString("utf8");
      return response({ commit: { sha: "hotel-commit" } });
    }
    return response({ content: Buffer.from(source).toString("base64"), sha: "file-sha" });
  };
  try {
    const accommodations = structuredClone(tripData.accommodations);
    accommodations.alboraya.firstChoice = "Anderes Hotel in La Patacona";
    const result = await call(publishAccommodations, { secret: "test-pin", accommodations, baseVersion: tripData.publishedVersion });
    assert.equal(result.status, 200);
    const published = parseTripData(publishedContent);
    assert.deepEqual(published.publishedDays, tripData.publishedDays);
    assert.equal(published.accommodations.alboraya.firstChoice, "Anderes Hotel in La Patacona");
  } finally {
    global.fetch = previousFetch;
    process.env = previousEnv;
  }
});
