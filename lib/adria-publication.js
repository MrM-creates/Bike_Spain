const { PLANNING_POLICY, normalizeTripContext, fixPointIssue } = require('./planning-policy');
const { addDays } = require('../assets/travel-model');
const fail = message => { throw Object.assign(new Error(message), { status: 400 }); };
const https = value => { try { return new URL(value).protocol === 'https:'; } catch (_) { return false; } };
const routeFields = ['title', 'type', 'rest', 'origin', 'destination', 'overnight', 'waypoints', 'roads', 'km', 'time'];
const routeChanged = (before, after) => routeFields.some(key => JSON.stringify(before[key] ?? '') !== JSON.stringify(after[key] ?? ''));
const stayFields = ['id', 'title', 'startDate', 'endDate', 'booking', 'currentFirstChoice', 'currentFirstChoiceUrl', 'currentAlternative', 'currentAlternativeUrl', 'currentFirstChoiceNotes', 'currentAlternativeNotes', 'firstChoice', 'firstChoiceUrl', 'alternative', 'alternativeUrl', 'parking', 'reviewedAt', 'motorcycleParking', 'reviewNote', 'reviewSources', 'note'];

function applyAdriaPublication(current, payload, days) {
  if (days.length !== current.days.length) fail('Die Reisedauer darf beim Veröffentlichen nicht verändert werden.');
  // This editor keeps calendar slots fixed. Never let an AI response reassign journal IDs.
  if (days.some((day, index) => day.id !== current.days[index].id)) fail('Etappen-IDs passen nicht zum Online-Plan. Bitte den Entwurf erneut prüfen.');
  const issue = fixPointIssue(current.days, days, normalizeTripContext(current.trip));
  if (issue) fail(`Geschützter Fixpunkt: ${issue}`);
  for (let i = 0; i < days.length; i++) {
    if (current.days[i].roadApproach && (days[i].main !== current.days[i].main || days[i].roadApproach !== true)) fail('Die geschützte Hafenzufahrt darf nicht verändert werden.');
  }
  const changedRides = days.map((day, i) => routeChanged(current.days[i], day) && !day.rest ? i + 1 : null).filter(Boolean);
  if (changedRides.length && (payload.verification?.verified !== true || Number(payload.verification?.verificationVersion) < PLANNING_POLICY.version)) {
    fail('Geänderte Fahretappen zuerst mit der aktuellen Routenprüfung prüfen.');
  }
  for (const dayNumber of changedRides) {
    const check = payload.verification?.sourceChecks?.find(item => Number(item.day) === dayNumber);
    if (!check || !check.officialTitle || !check.motorcycleTitle || !https(check.officialUrl) || !https(check.motorcycleUrl) || check.officialUrl === check.motorcycleUrl || !check.routingEvidence) fail(`Tag ${dayNumber}: offizieller Quellencheck, Motorradquelle oder Streckenabgleich fehlt.`);
  }
  for (const day of days) {
    if (!Array.isArray(day.waypoints) || day.waypoints.some(point => typeof point !== 'string')) fail('Zwischenziele müssen Ortsangaben sein.');
    if (day.main) {
      let url;
      try { url = new URL(day.main); } catch (_) { fail('Ungültiger Google-Maps-Link.'); }
      if (url.protocol !== 'https:' || url.hostname !== 'www.google.com' || url.pathname !== '/maps/dir/') fail('Ungültiger Google-Maps-Link.');
      if (!day.roadApproach && !day.rest && (url.searchParams.get('origin') !== day.origin || url.searchParams.get('destination') !== day.destination || (url.searchParams.get('waypoints') || '') !== day.waypoints.join('|'))) fail('Google-Maps-Link und geprüfte Route stimmen nicht überein.');
    }
  }
  const accommodations = payload.accommodations ?? current.accommodations;
  if (!Array.isArray(accommodations)) fail('Unterkünfte müssen als vollständige Liste übergeben werden.');
  const stays = accommodations.map(stay => Object.fromEntries(stayFields.filter(key => stay?.[key] !== undefined).map(key => [key, stay[key]])));
  if (new Set(stays.map(stay => stay.id)).size !== stays.length || stays.some(stay => !stay.id || !stay.title || !/^\d{4}-\d{2}-\d{2}$/.test(stay.startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(stay.endDate) || stay.startDate >= stay.endDate)) fail('Unterkünfte benötigen eindeutige IDs und gültige Aufenthaltsdaten.');
  for (const stay of stays) {
    for (const key of stayFields.filter(key => key.endsWith('Url'))) if (stay[key] && !https(stay[key])) fail('Unterkunftslinks müssen sichere HTTPS-Adressen sein.');
  }
  for (let index = 0; index < days.length - 1; index++) {
    const date = addDays(current.trip.startDate, index);
    const matches = stays.filter(stay => stay.startDate <= date && stay.endDate > date);
    if (matches.length !== 1 || matches[0].title !== days[index].overnight) fail(`Tag ${index + 1}: Unterkunft und Übernachtungsort passen noch nicht zusammen. Bitte vor der Veröffentlichung abgleichen.`);
  }
  current.days = days.map((day, i) => ({ ...day, day: i + 1 }));
  current.accommodations = stays;
  // Only plan data is persisted; submitted journal/photos/trip settings are ignored.
}
module.exports = { applyAdriaPublication, routeChanged };
