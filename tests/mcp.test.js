const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { createApp } = require('../api/roadbook-mcp');
const { ORIGIN, createSealer, createGithubStore } = require('../lib/mcp-security');
const { createOperations } = require('../lib/mcp-tools');
const { readPublishedTrip } = require('../lib/published-trips');
const fixture = () => readPublishedTrip(fs.readFileSync('data/trip-adria-2026.js', 'utf8'), 'trip_adria_2026');
const seal = () => createSealer('test-secret-with-more-than-thirty-two-bytes');
function memoryStore(snapshot = fixture()) {
  const used = new Set();
  return { snapshot, used, readTrip: async () => structuredClone(snapshot), exists: async key => used.has(key),
    claim: async key => { if (used.has(key)) return false; used.add(key); return true; }, allowLogin: async () => true };
}

test('encrypted grants reject tampering, wrong use, wrong key and expiration', () => {
  let now = 100000;
  const s = createSealer('x'.repeat(64), ORIGIN, () => now);
  const value = s.seal('code', { hidden: 'private' }, 60);
  assert.equal(s.open('code', value).data.hidden, 'private');
  assert.ok(!value.includes('private'));
  assert.throws(() => s.open('access', value));
  assert.throws(() => seal().open('code', value));
  assert.throws(() => s.open('code', value.slice(0, 30) + (value[30] === 'A' ? 'B' : 'A') + value.slice(31)));
  now += 60000;
  assert.throws(() => s.open('code', value));
});

test('GitHub one-time claims are atomic and distinguish duplicate markers from service failure', async () => {
  const refs = new Set(); let broken = false;
  const store = createGithubStore({ token: 'test', fetchImpl: async (url, options = {}) => {
    const path = new URL(url).pathname;
    if (path.endsWith('/heads/main')) return new Response(JSON.stringify({ object: { sha: 'head' } }));
    if (broken) return new Response('{}', { status: 500 });
    if (options.method === 'POST') {
      const ref = JSON.parse(options.body).ref;
      if (refs.has(ref)) return new Response('{}', { status: 422 });
      refs.add(ref); return new Response('{}', { status: 201 });
    }
    return new Response('{}', { status: refs.has(`refs/${path.split('/git/ref/')[1]}`) ? 200 : 404 });
  } });
  assert.deepEqual((await Promise.all([store.claim('same'), store.claim('same')])).sort(), [false, true]);
  assert.equal(await store.exists('other'), false);
  assert.ok([...refs].every(ref => /^refs\/roadbook-mcp\/[a-f0-9]{64}$/.test(ref)));
  broken = true;
  await assert.rejects(store.claim('other'));
});

test('OAuth with real SDK: consent, PKCE, resource binding, replay protection, refresh rotation and MCP scopes', async t => {
  const store = memoryStore();
  const authEvents = [];
  const discoveryEvents = [];
  const app = createApp({ sealer: seal(), store, pin: 'test-pin', reportAuthEvent: event => authEvents.push(event), reportDiscovery: event => discoveryEvents.push(event) });
  const listener = app.listen(0, '127.0.0.1');
  await new Promise(resolve => listener.once('listening', resolve));
  t.after(() => listener.close());
  const base = `http://127.0.0.1:${listener.address().port}`;
  const get = path => fetch(base + path, { redirect: 'manual' });
  const post = (path, data, headers = {}) => fetch(base + path, { method: 'POST', redirect: 'manual', headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...headers }, body: new URLSearchParams(data) });
  const metadata = await (await get('/.well-known/oauth-protected-resource/mcp')).json();
  assert.equal(metadata.resource, `${ORIGIN}/mcp`);
  assert.equal((await get('/mcp')).status, 401);
  const registration = { redirect_uris: ['https://chatgpt.com/connector/oauth/test-connection'], token_endpoint_auth_method: 'none', grant_types: ['authorization_code', 'refresh_token'], response_types: ['code'] };
  const register = data => fetch(base + '/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  assert.equal((await register({ ...registration, redirect_uris: ['https://evil.example/callback'] })).status, 400);
  const client = await (await register(registration)).json();
  assert.ok(client.client_id);
  const verifier = crypto.randomBytes(32).toString('base64url');
  const params = { client_id: client.client_id, redirect_uri: registration.redirect_uris[0], response_type: 'code', code_challenge: crypto.createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256', scope: 'roadbook:read roadbook:write', resource: `${ORIGIN}/mcp`, state: 'test-state' };
  const login = await get('/authorize?' + new URLSearchParams(params));
  assert.equal(login.status, 200);
  assert.equal(login.headers.get('referrer-policy'), 'strict-origin', 'native form POSTs must retain Origin without exposing OAuth query parameters');
  assert.ok(login.headers.get('content-security-policy').includes("form-action 'self' " + registration.redirect_uris[0] + ';'), 'form policy permits the registered OAuth callback after the successful POST');
  const cookie = login.headers.get('set-cookie').split(';')[0];
  const page = await login.text();
  const ticket = page.match(/name="ticket" value="([^"]+)"/)[1];
  assert.equal((await post('/roadbook-connect', { ticket, pin: 'test-pin' }, { Cookie: cookie, Origin: 'https://evil.example' })).status, 403);
  assert.equal((await post('/roadbook-connect', { ticket, pin: 'test-pin' }, { Cookie: cookie, Origin: 'null' })).status, 403);
  assert.equal((await post('/roadbook-connect', { ticket, pin: 'test-pin' }, { Cookie: cookie })).status, 403);
  assert.equal((await post('/roadbook-connect', { ticket, pin: 'test-pin' }, { Origin: ORIGIN })).status, 403);
  const mismatch = await post('/roadbook-connect', { ticket, pin: 'test-pin' }, { Cookie: '__Host-roadbook-connect=another-window', Origin: ORIGIN });
  assert.equal(mismatch.status, 403);
  const recoveryPage = await mismatch.text();
  assert.ok(!recoveryPage.includes('name="pin"'), 'failed browser binding must not offer a broken PIN form');
  assert.ok(!recoveryPage.includes('test-pin'));
  const restart = recoveryPage.match(/href="([^\"]+)">Anmeldung neu starten/)[1].replaceAll('&amp;', '&');
  assert.deepEqual(Object.fromEntries(new URL(restart, ORIGIN).searchParams), params, 'recovery preserves exactly the original OAuth request');
  const restarted = await get(restart);
  assert.equal(restarted.status, 200);
  const freshCookie = restarted.headers.get('set-cookie').split(';')[0];
  const freshTicket = (await restarted.text()).match(/name="ticket" value="([^\"]+)"/)[1];
  assert.equal((await post('/roadbook-connect', { ticket: freshTicket, pin: 'wrong' }, { Cookie: freshCookie, Origin: ORIGIN })).status, 401, 'recovery establishes a usable new browser binding');
  assert.deepEqual(authEvents, ['origin_mismatch', 'origin_null', 'origin_missing', 'cookie_missing', 'cookie_mismatch'].map(reason => ({ event: 'consent_rejected', reason })), 'diagnostics contain no submitted data or OAuth secrets');
  assert.equal(store.used.size, 0, 'rejected browser binding and wrong PIN do not grant access');
  const wrongPin = await post('/roadbook-connect', { ticket, pin: 'wrong' }, { Cookie: cookie, Origin: ORIGIN });
  assert.equal(wrongPin.status, 401);
  assert.equal(wrongPin.headers.get('content-security-policy'), login.headers.get('content-security-policy'), 'retry form preserves the exact callback policy');
  const consent = await post('/roadbook-connect', { ticket, pin: 'test-pin' }, { Cookie: cookie, Origin: ORIGIN });
  assert.equal(consent.status, 303);
  const redirect = new URL(consent.headers.get('location'));
  assert.equal(redirect.searchParams.get('state'), 'test-state');
  const grant = { client_id: client.client_id, grant_type: 'authorization_code', code: redirect.searchParams.get('code'), code_verifier: verifier, redirect_uri: params.redirect_uri, resource: params.resource };
  assert.equal((await post('/token', { ...grant, code_verifier: 'wrong' })).status, 400);
  assert.equal((await post('/token', { ...grant, resource: 'https://evil.example/mcp' })).status, 400);
  const tokenResponse = await post('/token', grant);
  assert.equal(tokenResponse.status, 200);
  const tokens = await tokenResponse.json();
  assert.equal((await post('/token', grant)).status, 400);
  const mcp = (method, params, access = tokens.access_token) => fetch(base + '/mcp', { method: 'POST', headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
  assert.equal((await mcp('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'test', version: '1' } })).status, 200);
  const listed = await (await mcp('tools/list', {})).json();
  assert.equal(listed.result.tools.length, 5);
  assert.deepEqual(discoveryEvents, [{ toolCount: 5, errorCode: null }]);
  const read = await (await mcp('tools/call', { name: 'get_trip', arguments: { tripId: 'trip_adria_2026' } })).json();
  assert.equal(read.result.structuredContent.trip.id, 'trip_adria_2026');
  assert.ok(!JSON.stringify(read).includes('test-pin'));
  const refreshed = await post('/token', { client_id: client.client_id, grant_type: 'refresh_token', refresh_token: tokens.refresh_token, resource: params.resource, scope: 'roadbook:read' });
  assert.equal(refreshed.status, 200);
  const next = await refreshed.json();
  const denied = await (await mcp('tools/call', { name: 'publish_change', arguments: { draft: 'x', confirmed: true } }, next.access_token)).json();
  assert.equal(denied.result.isError, true);
  assert.match(denied.result.content[0].text, /Freigabe/);
  assert.equal((await post('/token', { client_id: client.client_id, grant_type: 'refresh_token', refresh_token: tokens.refresh_token, resource: params.resource })).status, 400);
  assert.equal((await mcp('tools/list', {}, next.access_token)).status, 401, 'replaying a refresh token revokes its whole family');
});

test('prepared changes are private, version-bound, connection-bound, single-use and reuse the existing publisher', async () => {
  const store = memoryStore(); const writes = [];
  const ops = createOperations({ store, sealer: seal(), call: async (handler, payload) => { writes.push({ handler, payload }); return { ok: true, version: 'next', delivery: 'deployment-pending' }; } });
  const snapshot = store.snapshot;
  const note = 'Hinweis für den nächsten Reisetag';
  const prepared = await ops.preparePlan({ tripId: snapshot.trip.id, baseVersion: snapshot.publishedVersion, reason: 'Redaktioneller Hinweis ergänzen', dayUpdates: [{ id: snapshot.days[1].id, changes: { note } }] }, 'client-a');
  assert.equal(prepared.published, false);
  assert.equal(writes.length, 0);
  assert.equal(prepared.review.changes.length, 1);
  assert.ok(!prepared.draft.includes(note));
  await assert.rejects(ops.publish({ draft: prepared.draft, confirmed: true }, 'client-b'), /andere/);
  await assert.rejects(ops.publish({ draft: prepared.draft, confirmed: false }, 'client-a'), /Auftrag/);
  const result = await ops.publish({ draft: prepared.draft, confirmed: true }, 'client-a');
  assert.equal(result.delivery, 'deployment-pending');
  assert.equal(writes[0].handler, require('../api/publish-roadbook'));
  assert.equal(writes[0].payload.days[1].note, note);
  assert.deepEqual(writes[0].payload.accommodations, snapshot.accommodations);
  await assert.rejects(ops.publish({ draft: prepared.draft, confirmed: true }, 'client-a'), /bereits/);
  const newer = await ops.preparePlan({ tripId: snapshot.trip.id, baseVersion: snapshot.publishedVersion, reason: 'Noch ein Hinweis', dayUpdates: [{ id: snapshot.days[2].id, changes: { note } }] }, 'client-a');
  snapshot.publishedVersion = 'newer-booking';
  await assert.rejects(ops.publish({ draft: newer.draft, confirmed: true }, 'client-a'), /inzwischen/);
  assert.equal(writes.length, 1);
});

test('booking protection, protected stages and invalid changes fail before any write', async () => {
  const store = memoryStore(); let calls = 0;
  const ops = createOperations({ store, sealer: seal(), call: async () => { calls++; throw new Error('Unexpected call'); } });
  const snapshot = store.snapshot;
  const stay = snapshot.accommodations.find(s => s.id === 'lienz');
  const options = structuredClone(stay.options).map(o => ({ ...o, booking: 'open' }));
  await assert.rejects(ops.prepareOptions({ tripId: snapshot.trip.id, baseVersion: snapshot.publishedVersion, stayId: stay.id, options, reason: 'Buchung ändern' }, 'client'), /Buchung/);
  const prepared = await ops.prepareOptions({ tripId: snapshot.trip.id, baseVersion: snapshot.publishedVersion, stayId: stay.id, options, reason: 'Buchung ist geklärt', acknowledgeBookingChange: true }, 'client');
  assert.equal(prepared.prepared, true);
  const route = { tripId: snapshot.trip.id, baseVersion: snapshot.publishedVersion, reason: 'Geschützte Etappe ändern', dayUpdates: [{ id: snapshot.days[20].id, changes: { destination: 'Wrong port' } }] };
  await assert.rejects(ops.preparePlan(route, 'client'), /Fixpunkt|Hafenzufahrt/);
  await assert.rejects(ops.preparePlan({ ...route, dayUpdates: [{ id: snapshot.days[1].id, changes: { id: 'new-id' } }] }, 'client'));
  assert.equal(calls, 0);
});

test('changed riding days are checked on the server and rebuild navigation without changing other days', async () => {
  const store = memoryStore(); const calls = [];
  const ops = createOperations({ store, sealer: seal(), call: async (handler, payload) => {
    calls.push({ handler, payload });
    assert.equal(handler, require('../api/create-plan-draft'));
    const days = payload.days.map(require('../api/create-plan-draft')._test.normalizeInputDay);
    return { ok: true, verifiedDraft: { verified: true, verificationVersion: 4, days, openItems: [], sourceChecks: [{ day: 2, officialTitle: 'Official', officialUrl: 'https://official.example/route', motorcycleTitle: 'Motorcycle', motorcycleUrl: 'https://motorcycle.example/route', routingEvidence: 'Test route evidence' }] } };
  } });
  const before = structuredClone(store.snapshot);
  const prepared = await ops.preparePlan({ tripId: before.trip.id, baseVersion: before.publishedVersion, reason: 'Etappe erneut prüfen', dayUpdates: [{ id: before.days[1].id, changes: { roads: before.days[1].roads + ' · geprüft' } }] }, 'client');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].payload.stage, 'verify-route');
  assert.equal(calls[0].payload.replaceFromDay, 2);
  assert.equal(prepared.review.changes.length, 1);
  const after = prepared.review.changes[0].after;
  const maps = new URL(after.main);
  assert.equal(maps.searchParams.get('origin'), after.origin);
  assert.equal(maps.searchParams.get('destination'), after.destination);
  assert.equal(prepared.review.sourceChecks.length, 1);
  assert.deepEqual(store.snapshot, before, 'prepare never persists changes');
});
