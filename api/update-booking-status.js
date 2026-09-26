const { createHash, timingSafeEqual } = require('node:crypto');
const { tripTarget, readPublishedTrip, writePublishedTrip } = require('../lib/published-trips');
const { readGithubText } = require('../lib/mcp-security');
const { applyBookingStatus, staysFor, bookingInfo } = require('../lib/booking-status');

const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const json = (response, status, body) => {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(body));
};
async function readBody(request) {
  const chunks = []; let size = 0;
  for await (const chunk of request) {
    size += Buffer.byteLength(chunk);
    if (size > 8192) fail(413, 'Die Anfrage ist zu gross.');
    chunks.push(Buffer.from(chunk));
  }
  const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(400, 'Ungültige Anfrage.');
  return value;
}
async function github(path, options = {}) {
  const response = await fetch(`https://api.github.com${path}`, { ...options,
    signal: AbortSignal.timeout(20000),
    headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${process.env.GITHUB_ROADBOOK_TOKEN}`,
      'Content-Type': 'application/json', 'User-Agent': 'roadbook-booking-status', 'X-GitHub-Api-Version': '2022-11-28' } });
  if (!response.ok) {
    if ([409, 422].includes(response.status)) fail(409, 'Der Reiseplan wurde gleichzeitig geändert. Bitte aktualisieren und erneut prüfen.');
    fail(502, 'Speichern konnte nicht bestätigt werden. Bitte den Reiseplan aktualisieren und den Status prüfen.');
  }
  return response.json();
}
module.exports = async (request, response) => {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return json(response, 405, { error: 'Nur POST ist erlaubt.' });
  }
  try {
    if (!process.env.ROADBOOK_PUBLISH_SECRET || !process.env.GITHUB_ROADBOOK_TOKEN) fail(503, 'Statusänderungen sind noch nicht eingerichtet.');
    const payload = await readBody(request);
    const digest = value => createHash('sha256').update(value).digest();
    if (typeof payload.secret !== 'string' || !timingSafeEqual(digest(payload.secret.trim()), digest(process.env.ROADBOOK_PUBLISH_SECRET.trim()))) {
      fail(401, 'Die PIN ist nicht gültig. Bitte die Bearbeitung erneut freischalten.');
    }
    const checking = payload.action === 'check';
    const retrying = payload.action === 'retry-route';
    if (payload.action && !['authorize','check','retry-route'].includes(payload.action)) fail(400, 'Unbekannte Aktion.');
    if (payload.optionId !== undefined && (typeof payload.optionId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(payload.optionId))) fail(400, 'Ungültige Unterkunft.');
    const allowed = payload.action === 'authorize' ? ['action', 'secret'] : checking ? ['action', 'secret', 'tripId', 'stayId', 'optionId'] : ['tripId', 'stayId', 'optionId', 'booking', 'expectedRevision', 'secret', 'action'];
    if (Object.keys(payload).some(key => !allowed.includes(key))) fail(400, 'Hier kann nur der Buchungsstatus geändert werden.');
    if (payload.action === 'authorize') return json(response, 200, { ok: true });
    if (typeof payload.tripId !== 'string' || typeof payload.stayId !== 'string' || !payload.stayId ||
        (!checking && (!['open', 'asked', 'booked', 'unavailable'].includes(payload.booking) || !/^[a-f0-9]{64}$/.test(payload.expectedRevision || '')))) fail(400, 'Die Unterkunftsangaben sind unvollständig. Bitte den Reiseplan aktualisieren.');
    const target = tripTarget(payload.tripId);
    const repo = process.env.GITHUB_REPO || 'MrM-creates/Bike_Spain';
    const branch = process.env.GITHUB_BRANCH || 'main';
    const contentPath = `/repos/${repo}/contents/${encodeURIComponent(target.path)}`;
    const current = await github(`${contentPath}?ref=${encodeURIComponent(branch)}`);
    const source = await readGithubText(current, sha => github(`/repos/${repo}/git/blobs/${encodeURIComponent(sha)}`));
    const snapshot = readPublishedTrip(source, payload.tripId);
    if (checking) {
      const matches = staysFor(snapshot).filter(item => item.id === payload.stayId);
      if (matches.length !== 1) fail(409, 'Die Unterkunft wurde inzwischen geändert. Bitte den Reiseplan aktualisieren.');
      return json(response, 200, { ok: true, tripId: payload.tripId, stayId: payload.stayId,
        ...bookingInfo(matches[0].id, matches[0].stay, snapshot.publishedVersion, payload.optionId), version: snapshot.publishedVersion });
    }
    const version = new Date(Math.max(Date.now(), Date.parse(snapshot.publishedVersion) + 1 || 0)).toISOString();
    const result = applyBookingStatus(snapshot, payload, version);
    if (result.changed || retrying) {
      if (payload.optionId) {
        await require('../lib/accommodation-routes').updateAccommodationRoutes(snapshot, payload.stayId);
        snapshot.publishedVersion = version;
        if (snapshot.trip.id === 'trip_adria_2026') snapshot.trip.dataVersion = version;
        const item = staysFor(snapshot).find(s => s.id === payload.stayId);
        Object.assign(result, bookingInfo(item.id, item.stay, version, payload.optionId));
      }
      // The Contents API compares the blob SHA atomically. No force write or stale full-plan payload.
      await github(contentPath, { method: 'PUT', body: JSON.stringify({
        message: `Update booking status: ${payload.tripId} / ${payload.stayId}`,
        content: Buffer.from(writePublishedTrip(snapshot, payload.tripId)).toString('base64'), sha: current.sha, branch
      }) });
    }
    return json(response, 200, { ok: true, tripId: payload.tripId, stayId: payload.stayId,
      ...(payload.optionId ? {optionId:payload.optionId} : {}), booking: result.booking, bookingRevision: result.bookingRevision, bookingContext: result.bookingContext, version: snapshot.publishedVersion, delivery: 'deployment-pending' });
  } catch (error) {
    json(response, error.status || (error instanceof SyntaxError ? 400 : 502), {
      error: error.status ? error.message : 'Speichern konnte nicht bestätigt werden. Bitte den Reiseplan aktualisieren und den Status prüfen.'
    });
  }
};
