const crypto = require('node:crypto');
const signature = day => crypto.createHash('sha256').update(JSON.stringify([
  day.id, day.title, day.rest, day.mapsURL, day.roads, day.overnight
])).digest('hex');

// Bind only explicitly reviewed geometry. A later route edit must never inherit an old line.
function attachMaps(trip, document) {
  const maps = document.trips[trip.id] || {};
  let previousStop = null;
  return { ...trip, days: trip.days.map(day => {
    const saved = maps[day.id];
    let map = saved?.signature === signature(day) ? saved.map : null;
    if (day.rest && JSON.stringify(map?.stop) !== JSON.stringify(previousStop)) map = null;
    previousStop = map?.stop || null;
    return { ...day, map };
  }) };
}

function mapsForTrip(trip, collection) {
  const features = collection.features.filter(f => f.properties.variant === 'original' && !f.properties.optional);
  const result = {};
  let lastStop;
  let lastOvernight;
  for (const day of trip.days) {
    const matching = features.filter(f => f.properties.day === day.number);
    if (!day.rest && matching.length !== 1) throw new Error(`Geometrie fehlt/mehrdeutig: ${trip.id}/${day.id}`);
    const lines = [];
    let stop;
    if (!day.rest) {
      const { properties: p, geometry: g } = matching[0];
      if (g.type !== 'LineString' || g.coordinates.length < 2 || !g.coordinates.every(c =>
        c.length === 2 && c.every(Number.isFinite) && Math.abs(c[0]) <= 180 && Math.abs(c[1]) <= 90)) throw new Error('Ungültige Koordinaten');
      if (p.ferry && p.roadCoordinateCount) {
        lines.push({ kind: 'road', coordinates: g.coordinates.slice(0, p.roadCoordinateCount) });
        lines.push({ kind: 'ferry', coordinates: g.coordinates.slice(p.roadCoordinateCount - 1) });
      } else { lines.push({ kind: p.ferry ? 'ferry' : 'road', coordinates: g.coordinates }); }
      stop = { coordinate: g.coordinates.at(-1), label: day.overnight, approximate: true };
      lastStop = stop; lastOvernight = day.overnight;
    } else if (lastOvernight === day.overnight) { stop = lastStop; }
    result[day.id] = { signature: signature(day), map: { lines, stop: stop || null } };
  }
  return result;
}
module.exports = { signature, attachMaps, mapsForTrip };
