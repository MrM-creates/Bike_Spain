const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { Readable } = require('node:stream');
const handler = require('../api/update-booking-status');
const { tripTarget, readPublishedTrip, writePublishedTrip } = require('../lib/published-trips');
const { tripForCompanion } = require('../lib/companion-feed');
const { bookingInfo, staysFor } = require('../lib/booking-status');
const fixture = id => {const t=readPublishedTrip(fs.readFileSync(tripTarget(id).path, 'utf8'), id);for(const s of Object.values(t.accommodations)){delete s.options;delete s.activeOptionId;delete s.accommodationNavigation;}return t;};

async function run(payload, { id = 'trip_adria_2026', snapshot = fixture(id), race = false, method = 'POST', targetHandler = handler } = {}) {
  const oldFetch = global.fetch, oldEnv = { ...process.env };
  Object.assign(process.env, { GITHUB_ROADBOOK_TOKEN: 'test-token', ROADBOOK_PUBLISH_SECRET: 'test-only', GITHUB_BRANCH: 'main' });
  const calls = []; let saved;
  global.fetch = async (url, options = {}) => {
    calls.push({ url, options });
    if (options.method === 'PUT') {
      if (race) return { ok: false, status: 409 };
      const body = JSON.parse(options.body);
      assert.equal(body.sha, 'current-sha');
      assert.equal(body.branch, 'main');
      saved = readPublishedTrip(Buffer.from(body.content, 'base64').toString('utf8'), id);
      return { ok: true, json: async () => ({ commit: { sha: 'new-commit' } }) };
    }
    const body = { sha: 'current-sha', content: Buffer.from(writePublishedTrip(snapshot, id)).toString('base64') };
    return { ok: true, json: async () => body, text: async () => JSON.stringify(body) };
  };
  const request = Readable.from([Buffer.from(typeof payload === 'string' ? payload : JSON.stringify(payload))]);
  request.method = method;
  const response = { setHeader() {}, end(data) { this.body = JSON.parse(data); } };
  try { await targetHandler(request, response); }
  finally { global.fetch = oldFetch; process.env = oldEnv; }
  return { code: response.statusCode, body: response.body, saved, calls };
}
function requestFor(id = 'trip_adria_2026') {
  const snapshot = fixture(id);
  const item = staysFor(snapshot).find(({ id, stay }) => bookingInfo(id, stay).bookingEditable && stay.endDate > new Date(Date.parse(stay.startDate) + 86400000).toISOString().slice(0, 10));
  return { secret: 'test-only', tripId: id, stayId: item.id, expectedRevision: bookingInfo(item.id, item.stay, snapshot.publishedVersion).bookingRevision, booking: 'booked' };
}

test('status-only update reaches every night in both shared plans without changing routes, hotels or baseline', async () => {
  for (const id of ['trip_adria_2026', 'trip_spanien_2026']) {
    const before = fixture(id), payload = requestFor(id);
    const result = await run(payload, { id });
    assert.equal(result.code, 200, JSON.stringify(result.body));
    assert.equal(result.calls.length, 2);
    assert.ok(result.calls.every(call => call.url.includes(encodeURIComponent(tripTarget(id).path))));
    const copy = structuredClone(result.saved);
    const stay = staysFor(copy).find(item => item.id === payload.stayId).stay;
    const originalStay = staysFor(before).find(item => item.id === payload.stayId).stay;
    if (Object.hasOwn(originalStay, 'booking')) stay.booking = originalStay.booking;
    else delete stay.booking;
    copy.publishedVersion = before.publishedVersion;
    if (id === 'trip_adria_2026') copy.trip.dataVersion = before.trip.dataVersion;
    assert.deepEqual(copy, before);
    const feed = tripForCompanion(result.saved);
    const affected = feed.days.filter(day => day.accommodation?.id === payload.stayId);
    assert.ok(affected.length > 1);
    assert.ok(affected.every(day => day.accommodation.status === 'Gebucht' && day.accommodation.bookingRevision === result.body.bookingRevision));
    assert.equal(result.body.delivery, 'deployment-pending');
    const stale = await run(payload, { id, snapshot: result.saved });
    assert.equal(stale.code, 409);
    assert.equal(stale.saved, undefined);
    const reopen = await run({ ...payload, expectedRevision: result.body.bookingRevision, booking: 'open' }, { id, snapshot: result.saved });
    assert.equal(reopen.code, 200);
    assert.equal(staysFor(reopen.saved).find(item => item.id === payload.stayId).stay.booking, undefined);
  }
});

test('PIN is required on every request and reader access cannot write', async () => {
  for (const secret of ['', 'wrong', null]) {
    const result = await run({ ...requestFor(), secret });
    assert.equal(result.code, 401); assert.equal(result.calls.length, 0);
  }
  const authorize = await run({ action: 'authorize', secret: 'test-only' });
  assert.equal(authorize.code, 200); assert.equal(authorize.calls.length, 0);
  const result = await run(requestFor(), { method: 'GET' });
  assert.equal(result.code, 405); assert.equal(result.calls.length, 0);
});

test('replacement hotels, changed dates/status, unknown stays and concurrent writes cannot be overwritten', async () => {
  const payload = requestFor();
  for (const mutate of [stay => stay.currentFirstChoice = 'Different hotel', stay => stay.currentFirstChoiceUrl = 'https://different.example', stay => stay.endDate = '2026-12-01', stay => stay.booking = 'asked']) {
    const snapshot = fixture(payload.tripId);
    mutate(staysFor(snapshot).find(item => item.id === payload.stayId).stay);
    const result = await run(payload, { snapshot });
    assert.equal(result.code, 409); assert.equal(result.calls.length, 1);
  }
  assert.equal((await run({ ...payload, stayId: 'missing' })).code, 409);
  const race = await run(payload, { race: true });
  assert.equal(race.code, 409); assert.equal(race.saved, undefined);
});

test('journal data, other fields, invalid states and oversized requests are rejected before repository access', async () => {
  for (const patch of [{ journal: 'PRIVATE' }, { photos: ['PRIVATE'] }, { firstChoice: 'replacement' }, { booking: 'cancelled' }, { expectedRevision: '' }, { tripId: '../other' }]) {
    const result = await run({ ...requestFor(), ...patch });
    assert.equal(result.code, 400); assert.equal(result.calls.length, 0);
  }
  assert.equal((await run('x'.repeat(9000))).code, 413);
  assert.equal((await run('{')).code, 400);
});

test('ferry cabins are read-only and authenticated status checks never write', async () => {
  const snapshot = fixture('trip_adria_2026');
  const item = staysFor(snapshot).find(({ stay }) => /kabine/i.test(stay.currentFirstChoice || stay.firstChoice));
  const info = bookingInfo(item.id, item.stay, snapshot.publishedVersion);
  assert.equal(info.bookingEditable, false);
  assert.equal((await run({ ...requestFor(), stayId: item.id, expectedRevision: info.bookingRevision })).code, 409);
  const payload = requestFor();
  const check = await run({ action: 'check', secret: payload.secret, tripId: payload.tripId, stayId: payload.stayId });
  assert.equal(check.code, 200); assert.equal(check.body.booking, 'open'); assert.equal(check.calls.length, 1);
});

test('both legacy publishers reject a stale or missing base after a mobile booking', async () => {
  for (const id of ['trip_adria_2026', 'trip_spanien_2026']) {
    const before = fixture(id);
    const updated = (await run(requestFor(id), { id })).saved;
    for (const targetHandler of [require('../api/publish-roadbook'), ...(id === 'trip_spanien_2026' ? [require('../api/publish-accommodations')] : [])]) {
      for (const baseVersion of [before.publishedVersion, undefined]) {
        const result = await run({ secret: 'test-only', tripId: id, baseVersion, days: before.days || before.publishedDays, accommodations: before.accommodations }, { id, snapshot: updated, targetHandler });
        assert.equal(result.code, baseVersion ? 409 : 400, JSON.stringify(result.body));
        assert.ok(result.calls.every(call => !call.options.method));
      }
    }
  }
});
