// Split only at explicitly reviewed stopping places. Never truncate waypoints.
function routePoints(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.hostname !== 'www.google.com' || url.username || url.password || url.pathname !== '/maps/dir/' ||
      url.searchParams.get('api') !== '1' || url.searchParams.get('travelmode') !== 'driving') {
    throw new Error('Ungültiger Navigationslink');
  }
  for (const key of ['api', 'origin', 'destination', 'travelmode', 'waypoints', 'avoid']) {
    if (url.searchParams.getAll(key).length > 1) throw new Error('Mehrdeutiger Navigationslink');
  }
  const origin = url.searchParams.get('origin'), destination = url.searchParams.get('destination');
  const raw = url.searchParams.get('waypoints');
  const waypoints = raw ? raw.split('|') : [];
  if (waypoints.some(point => !point.trim())) throw new Error('Leerer Zwischenpunkt');
  if (!origin?.trim() || !destination?.trim()) throw new Error('Start oder Ziel fehlt');
  return [origin, ...waypoints, destination];
}

function navigationParts(day, mapsURL) {
  if (!day.navigationBreaks?.length) return undefined;
  if (day.rest) throw new Error('Ruhetage haben keine Navigationsabschnitte');
  const points = routePoints(mapsURL);
  const breaks = day.navigationBreaks;
  let previous = 0;
  const ends = breaks.map(stop => {
    const index = stop.waypointIndex + 1;
    if (!Number.isInteger(stop.waypointIndex) || index <= previous || index >= points.length - 1 ||
        stop.safeStop !== true || typeof stop.label !== 'string' || !stop.label.trim()) {
      throw new Error('Teilung benötigt einen geprüften Haltepunkt in Routenreihenfolge');
    }
    previous = index;
    return { index, label: stop.label.trim() };
  });
  ends.push({ index: points.length - 1, label: day.navigationDestinationLabel || points.at(-1) });
  let start = 0;
  const parts = ends.map((end, index) => {
    const leg = points.slice(start, end.index + 1);
    if (leg.length > 5) throw new Error('Ein Navigationsabschnitt hat mehr als drei Zwischenpunkte');
    const url = new URL(mapsURL);
    url.searchParams.set('origin', leg[0]);
    url.searchParams.set('destination', leg.at(-1));
    url.searchParams.delete('waypoints');
    // Place-ID arrays from another segment must not leak into a new route.
    ['origin_place_id', 'destination_place_id', 'waypoint_place_ids'].forEach(key => url.searchParams.delete(key));
    if (leg.length > 2) url.searchParams.set('waypoints', leg.slice(1, -1).join('|'));
    start = end.index;
    return { id: `${day.id}-navigation-${index + 1}`, title: `Bis ${end.label}`, mapsURL: url.href };
  });
  const flattened = parts.flatMap((part, index) => routePoints(part.mapsURL).slice(index ? 1 : 0));
  if (JSON.stringify(flattened) !== JSON.stringify(points)) throw new Error('Navigationsabschnitte verändern die Route');
  return parts;
}

module.exports = { routePoints, navigationParts };
