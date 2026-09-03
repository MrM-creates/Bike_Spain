const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { parseTripData } = require('./trip-data');
const { addDays } = require('../assets/travel-model');
const googleMapsRouteUrl = day => {
  if (day.main) return day.main;
  if (!day.origin || !day.destination || /fährtag/i.test(day.type || '')) return '';
  const params = new URLSearchParams({ api: '1', origin: day.origin, destination: day.destination, travelmode: 'driving' });
  if (day.waypoints?.length) params.set('waypoints', day.waypoints.join('|'));
  return `https://www.google.com/maps/dir/?${params}`;
};

// Explicit allowlist: personal journal data is never accepted or published here.
function tripForCompanion(snapshot) {
  const days = snapshot.publishedDays || snapshot.days;
  if (!days?.length) throw new Error('Reisetage fehlen');
  const stays = Object.entries(snapshot.accommodations || {}).map(([id, stay]) => ({ id: stay.id || id, ...stay }));
  const seen = new Set();
  return {
    id: snapshot.trip.id, name: snapshot.trip.name,
    version: snapshot.publishedVersion,
    status: snapshot.planKind === 'draft' ? 'Online-Reiseentwurf' : 'Veröffentlichter Reiseplan',
    startDate: snapshot.trip.startDate,
    endDate: addDays(snapshot.trip.startDate, days.length - 1),
    description: snapshot.trip.characterText || '',
    days: days.map((day, index) => {
      if (!day.id || seen.has(day.id)) throw new Error('Etappen benötigen eindeutige stabile IDs');
      seen.add(day.id);
      const date = addDays(snapshot.trip.startDate, index);
      const stay = stays.find(s => s.startDate <= date && s.endDate > date);
      const option = (name, url, note) => name ? { name, url: url || '', note: note || '' } : null;
      return {
        id: day.id, number: index + 1, date, title: day.title,
        rest: Boolean(day.rest), distance: String(day.km || ''), duration: String(day.time || ''),
        overnight: day.overnight || '', roads: day.roads || '',
        notes: [day.note, day.travelNote, day.alert].filter(Boolean).join('\n\n'),
        mapsURL: day.rest ? '' : googleMapsRouteUrl(day) || '',
        accommodation: stay ? {
          status: stay.booking === 'booked' ? 'Gebucht' : stay.booking === 'asked' ? 'Angefragt' : 'Offen',
          first: option(stay.currentFirstChoice || stay.firstChoice, stay.currentFirstChoiceUrl || stay.firstChoiceUrl, stay.currentFirstChoiceNotes),
          alternative: option(stay.currentAlternative || stay.alternative, stay.currentAlternativeUrl || stay.alternativeUrl, stay.currentAlternativeNotes),
          notes: stay.reviewNote || stay.parking || ''
        } : null
      };
    })
  };
}

function companionFeed() {
  const root = path.resolve(__dirname, '..');
  const spain = parseTripData(fs.readFileSync(path.join(root, 'data/trip-spanien-2026.js'), 'utf8'));
  const context = { URLSearchParams };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'data/trip-adria-2026.js'), 'utf8'), context, { timeout: 1000 });
  return { schemaVersion: 1, trips: [context.__TRIP_ADRIA_DATA__, spain].map(tripForCompanion) };
}
module.exports = { companionFeed, tripForCompanion };
