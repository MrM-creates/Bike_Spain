const fs = require('node:fs');
const {usesReviewedNavigation}=require('./accommodation-baseline');
const path = require('node:path');
const { tripTarget, readPublishedTrip } = require('./published-trips');
const { addDays } = require('../assets/travel-model');
const { attachMaps } = require('./companion-maps');
const { navigationParts } = require('./route-navigation');
const { optionsFor, activeOption, label } = require('../assets/accommodation-options');
const { bookingInfo } = require('./booking-status');
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
    narrativeSegments: (snapshot.trip.narrativeSegments || snapshot.narrativeSegments || []).map(segment => ({
      title: segment.title || '', text: segment.text || ''
    })),
    days: days.map((day, index) => {
      if (!day.id || seen.has(day.id)) throw new Error('Etappen benötigen eindeutige stabile IDs');
      seen.add(day.id);
      const date = addDays(snapshot.trip.startDate, index);
      const stay = stays.find(s => s.startDate <= date && s.endDate > date);
      const option = (name, url, note) => name ? { name, url: url || '', note: note || '' } : null;
      const route = snapshot.accommodationRoutes?.[day.id];
      const pending = route?.state === 'pending';
      const mapsURL = day.rest ? '' : pending ? (route.mapsURL === day.main ? route.mapsURL : '') : googleMapsRouteUrl(day) || '';
      const active = stay ? activeOption(stay) : null;
      const options = stay ? optionsFor(stay).map(o => ({...o, ...bookingInfo(String(stay.id), stay, snapshot.publishedVersion, o.id), id:o.id})) : [];
      const directURL = active ? `https://www.google.com/maps/dir/?${new URLSearchParams({api:'1', destination:active.coordinate ? `${active.coordinate[1]},${active.coordinate[0]}` : active.address || `${active.name}, ${stay.title || day.overnight}`,travelmode:'driving'})}` : '';
      const restMap = day.rest && active?.coordinate && !usesReviewedNavigation(stay,active) ? {lines:[],stop:{coordinate:active.coordinate,label:active.name,approximate:false}} : null;
      const restChanged = day.rest && stay?.options && !usesReviewedNavigation(stay,active);
      return {
        id: day.id, number: index + 1, date, title: day.title,
        rest: Boolean(day.rest), distance: pending ? 'Aktualisierung offen' : String(day.km || ''), duration: pending ? '' : String(day.time || ''),
        overnight: day.overnight || '', roads: day.roads || '',
        notes: [day.note, day.travelNote, day.alert].filter(Boolean).join('\n\n'),
        mapsURL,
        navigationParts: pending ? undefined : navigationParts(day, mapsURL),
        routeStatus: route?.state || null, routeMessage: route?.message || null,
        ...(route || restMap || restChanged ? {map: pending ? null : restMap || route?.map || null, accommodationMap:true} : {}),
        accommodation: stay ? {
          ...bookingInfo(String(stay.id), stay, snapshot.publishedVersion),
          status: active ? label(active.booking) : 'Neue Unterkunft nötig',
          options, activeOptionId:active?.id || null, directMapsURL:directURL,
          // Legacy readers show the active hotel but cannot edit an option-aware stay.
          bookingEditable: false,
          booking: active?.booking || 'open',
          first: active ? option(active.name, active.url, active.note) : null,
          alternative: option(stay.currentAlternative || stay.alternative, stay.currentAlternativeUrl || stay.alternativeUrl, stay.currentAlternativeNotes),
          notes: stay.reviewNote || stay.parking || ''
        } : null
      };
    })
  };
}

function companionFeed(tripId) {
  const root = path.resolve(__dirname, '..');
  const ids = ['trip_adria_2026', 'trip_spanien_2026'];
  if (tripId !== undefined && !ids.includes(tripId)) throw new Error('Unbekannte Reise');
  const trips = (tripId === undefined ? ids : [tripId]).map(id =>
    readPublishedTrip(fs.readFileSync(path.join(root, tripTarget(id).path), 'utf8'), id));
  const maps = JSON.parse(fs.readFileSync(path.join(root, 'data/companion-maps.json'), 'utf8'));
  return { schemaVersion: 1, trips: trips.map(snapshot => attachMaps(tripForCompanion(snapshot), maps)) };
}
module.exports = { companionFeed, tripForCompanion };
