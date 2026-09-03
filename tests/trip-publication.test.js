const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { Readable } = require('node:stream');
const { readPublishedTrip, writePublishedTrip, tripTarget } = require('../lib/published-trips');
const { tripForCompanion } = require('../lib/companion-feed');
const publication = require('../assets/trip-publication');
const handler = require('../api/publish-roadbook');
const adriaSource = fs.readFileSync(tripTarget('trip_adria_2026').path, 'utf8');
const fixture = () => readPublishedTrip(adriaSource, 'trip_adria_2026');
const payloadFor = () => {
  const source = fixture();
  source.days[1].roads += ' · geprüfte Alternative';
  return { secret: 'test-only', tripId: source.trip.id, baseVersion: source.publishedVersion, days: source.days,
    accommodations: source.accommodations,
    verification: { verified: true, verificationVersion: 4, sourceChecks: [{ day: 2, officialTitle: 'Official', officialUrl: 'https://official.example/route', motorcycleTitle: 'Motorcycle', motorcycleUrl: 'https://motorcycle.example/route', routingEvidence: 'Test evidence' }] } };
};

async function exercise(payload, { race = false, method = 'POST' } = {}) {
  process.env.GITHUB_ROADBOOK_TOKEN = 'test-token';
  process.env.ROADBOOK_PUBLISH_SECRET = 'test-only';
  const originalFetch = global.fetch;
  const calls = [];
  let content;
  global.fetch = async (url, options = {}) => {
    const path = new URL(url).pathname;
    const body = options.body ? JSON.parse(options.body) : null;
    calls.push({ url, method: options.method || 'GET', body });
    let result;
    if (path.includes('/contents/')) result = { content: Buffer.from(adriaSource).toString('base64'), sha: race && new URL(url).searchParams.get('ref') === 'head' ? 'new-blob' : 'base-blob' };
    else if (path.endsWith('/git/ref/heads/main')) result = { object: { sha: 'head' } };
    else if (path.endsWith('/git/commits/head')) result = { tree: { sha: 'tree' } };
    else if (path.endsWith('/git/blobs')) { content = body.content; result = { sha: 'blob' }; }
    else if (path.endsWith('/git/trees')) result = { sha: 'tree-next' };
    else if (path.endsWith('/git/commits')) result = { sha: 'commit-next' };
    else if (path.endsWith('/git/refs/heads/main')) result = {};
    else throw new Error(`Unexpected GitHub request ${path}`);
    return { ok: true, text: async () => JSON.stringify(result) };
  };
  const request = Readable.from([JSON.stringify(payload)]);
  request.method = method;
  const response = { setHeader() {}, end(value) { this.body = JSON.parse(value); } };
  try { await handler(request, response); } finally { global.fetch = originalFetch; }
  return { status: response.statusCode, body: response.body, calls, content };
}

test('Balkan publication survives repository serialization and reaches the companion without altering Spain', async () => {
  const payload = payloadFor();
  payload.journal = 'PRIVATE'; payload.photos = ['PRIVATE'];
  payload.days[1].journal = 'PRIVATE'; payload.accommodations[0].photos = ['PRIVATE'];
  const result = await exercise(payload);
  assert.equal(result.status, 200, JSON.stringify(result.body));
  assert.equal(result.body.delivery, 'deployment-pending');
  assert.deepEqual(result.body.paths, ['data/trip-adria-2026.js']);
  const saved = readPublishedTrip(result.content, payload.tripId);
  const mobile = tripForCompanion(saved);
  assert.equal(mobile.version, result.body.version);
  assert.equal(mobile.days[1].roads, payload.days[1].roads);
  assert.deepEqual(mobile.days.map(day => day.id), fixture().days.map(day => day.id));
  assert.equal(mobile.days[20].mapsURL, fixture().days[20].main, 'ferry port approach remains intact');
  assert.deepEqual(saved.originalDays, fixture().originalDays);
  assert.deepEqual(saved.trip.fixPoints, fixture().trip.fixPoints);
  assert.equal(saved.days[20].roadApproach, true);
  const { importLegacyRoadbook } = require('../assets/travel-model');
  assert.equal(importLegacyRoadbook(saved).revision.routeVariants.length, importLegacyRoadbook(fixture()).revision.routeVariants.length, 'web road approaches must remain visible');
  assert.ok(!result.content.includes('PRIVATE'));
  const tree = result.calls.find(call => call.url.endsWith('/git/trees'));
  assert.deepEqual(tree.body.tree.map(file => file.path), ['data/trip-adria-2026.js']);
  const context = {};
  vm.runInNewContext(result.content, context);
  assert.equal(context.__TRIP_ADRIA_DATA__.days[1].roads, mobile.days[1].roads);
});

test('PIN, trip target, base version, concurrent writes and invalid plans fail before any repository mutation', async () => {
  const cases = [
    [p => p.secret = 'wrong', 401],
    [p => p.tripId = '../spanien', 400],
    [p => delete p.baseVersion, 400],
    [p => p.baseVersion = 'stale', 409],
    [p => p.days[1].id = p.days[0].id, 400],
    [p => delete p.verification, 400],
    [p => p.verification.sourceChecks = [], 400],
    [p => p.days[20].destination = 'Wrong port', 400],
    [p => p.accommodations[0].title = 'Wrong overnight', 400],
    [p => p.days[1].main = 'javascript:alert(1)', 400]
  ];
  for (const [mutate, expected] of cases) {
    const payload = payloadFor(); mutate(payload);
    const result = await exercise(payload);
    assert.equal(result.status, expected, JSON.stringify(result.body));
    assert.ok(result.calls.every(call => call.method === 'GET'));
  }
  const race = await exercise(payloadFor(), { race: true });
  assert.equal(race.status, 409);
  assert.ok(race.calls.every(call => call.method === 'GET'));
});

test('verification response retains stable IDs, untouched stages and ferry navigation', () => {
  const before = fixture().days;
  const days = structuredClone(before).map(day => { delete day.id; delete day.main; return day; });
  days[1].waypoints = ['Test waypoint'];
  const merged = publication.mergeVerifiedDays(before, { days, replaceFromDay: 2, replaceCount: 1 });
  assert.equal(merged[1].id, before[1].id);
  assert.equal(new URL(merged[1].main).searchParams.get('waypoints'), 'Test waypoint');
  assert.deepEqual(merged[20], before[20]);
  assert.deepEqual(merged[0], before[0]);
});

test('catalog retains base versions and drafts across refresh, deployment and conflicts', () => {
  const storage = new Map();
  const context = { __TRIP_ADRIA_DATA__: fixture(), localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) } };
  vm.runInNewContext(fs.readFileSync('assets/trip-catalog.js', 'utf8'), context);
  const catalog = context.MotorcycleTripCatalog;
  const initial = catalog.getSnapshot('trip_adria_2026', {});
  initial.days[1].note = 'local adjustment';
  const draft = catalog.saveDraft(initial);
  assert.equal(draft.baseVersion, fixture().publishedVersion);
  assert.equal(draft.publishedVersion, fixture().publishedVersion);
  context.__TRIP_ADRIA_DATA__.publishedVersion = '2026-09-04T00:00:00.000Z';
  assert.equal(catalog.getSnapshot(draft.trip.id, {}).baseVersion, fixture().publishedVersion);
  assert.equal(catalog.getSnapshot(draft.trip.id, {}).days[1].note, 'local adjustment');
  const submitted = catalog.markSubmitted(draft, '2026-09-05T00:00:00.000Z');
  assert.equal(catalog.getSnapshot(draft.trip.id, {}).deliveryVersion, submitted.deliveryVersion);
  context.__TRIP_ADRIA_DATA__.publishedVersion = submitted.deliveryVersion;
  assert.equal(catalog.getSnapshot(draft.trip.id, {}).localDraft, undefined);
  const nextDraft = catalog.saveDraft(submitted);
  assert.equal(nextDraft.baseVersion, submitted.deliveryVersion);
  assert.equal(catalog.getSnapshot(draft.trip.id, {}).localDraft, true);
});

test('delivery requires matching trip and at least submitted revision, not just HTTP 200', async () => {
  const originalFetch = global.fetch;
  try {
    global.fetch = async () => ({ ok: true, json: async () => ({ schemaVersion: 1, trips: [{ id: 'trip_adria_2026', version: '2026-09-03T00:00:00.000Z' }] }) });
    assert.equal(await publication.delivered('trip_adria_2026', '2026-09-04T00:00:00.000Z'), false);
    assert.equal(await publication.delivered('trip_adria_2026', '2026-09-03T00:00:00.000Z'), true);
    assert.equal(await publication.delivered('trip_spanien_2026', '2026-09-03T00:00:00.000Z'), false);
  } finally { global.fetch = originalFetch; }
});
