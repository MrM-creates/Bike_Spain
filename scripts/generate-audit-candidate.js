// Audit-only output: never replaces a published route or its geometry binding.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function candidatePoints(candidate) {
  // The public OSRM driving profile does not implement Google's avoid options.
  // Refuse rather than silently draw a motorway route for a land-road link.
  if (candidate.avoid) throw new Error('OSRM cannot enforce Google avoidance; separately reviewed geometry required');
  if (!Array.isArray(candidate.endpointCoordinates) || candidate.endpointCoordinates.length !== 2 ||
      !Array.isArray(candidate.waypoints)) throw new Error('Reviewed candidate with two endpoints required');
  const waypointCoordinates = candidate.waypointCoordinates || candidate.waypoints.map(w => {
    if (typeof w !== 'string' || !/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(w)) throw new Error('Numeric waypoint required');
    return w.split(',').map(Number).reverse();
  });
  if (!Array.isArray(waypointCoordinates) || waypointCoordinates.length !== candidate.waypoints.length) throw new Error('Waypoint coordinate count mismatch');
  const intermediate = candidate.geometryWaypointCoordinates ?? waypointCoordinates;
  if (!Array.isArray(intermediate)) throw new Error('Geometry anchors must be an array');
  const points = [candidate.endpointCoordinates[0], ...intermediate, candidate.endpointCoordinates[1]];
  for (const point of [...points, ...waypointCoordinates]) {
    if (!Array.isArray(point) || point.length !== 2 || !point.every(Number.isFinite) ||
        Math.abs(point[0]) > 180 || Math.abs(point[1]) > 90) throw new Error('Invalid longitude/latitude');
  }
  return points;
}
async function main() {
  const day = Number(process.argv[2]);
  const trip = process.argv[3] || 'adria';
  if (!['adria', 'spanien'].includes(trip) || !Number.isInteger(day) || day < 1 || day > 30) throw new Error('Expected day 1–30 and adria/spanien');
  const auditDir = path.join(root, 'route-audit/2026-09-04');
  const audit = JSON.parse(fs.readFileSync(path.join(auditDir, 'stages.json')));
  const stage = audit.trips.find(t => t.id === `trip_${trip}_2026`).stages.find(s => s.day === day);
  const continued = JSON.parse(fs.readFileSync(path.join(auditDir, trip === 'adria' ? 'continued-reviews.json' : 'spain-reviews.json')));
  const acceptedPath = path.join(auditDir, 'balkan-integration.json');
  const accepted = trip === 'adria' && fs.existsSync(acceptedPath) ? JSON.parse(fs.readFileSync(acceptedPath)).stages : [];
  const c = accepted.find(item => item.day === day)?.candidate || continued.find(item => item.day === day) || stage?.candidate;
  if (!stage || !c) throw new Error('Reviewed driving stage required');
  const points = candidatePoints(c);
  const url = 'https://router.project-osrm.org/route/v1/driving/' + points.map(p => p.join(',')).join(';') + '?overview=full&steps=true&geometries=geojson&continue_straight=true';
  const response = await fetch(url, {signal: AbortSignal.timeout(30000)});
  if (!response.ok) throw new Error(`OSRM ${response.status}`);
  const data = await response.json(), route = data.routes?.[0];
  if (!route?.geometry?.coordinates?.length) throw new Error(data.message || 'No route');
  const roadDistancesMeters = {};
  for (const leg of route.legs) for (const s of leg.steps) {
    const key = s.ref || s.name || 'unnamed';
    roadDistancesMeters[key] = (roadDistancesMeters[key] || 0) + s.distance;
    if (s.mode === 'ferry') throw new Error('Unexpected ferry');
  }
  const roadSteps = route.legs.map(leg => leg.steps.map(({name,ref,distance,maneuver}) => ({name,ref,distance,location:maneuver.location,type:maneuver.type,modifier:maneuver.modifier})));
  const feature = {type:'Feature', properties:{day, title:stage.title, status:'candidate-not-published', source:'OSRM independently calculated; not Google geometry', generatedAt:new Date().toISOString(), auditInputs:{origin:c.origin,destination:c.destination,waypoints:c.waypoints,geometryPoints:points}, distanceMeters:route.distance, durationSeconds:route.duration, roadDistancesMeters, roadSteps, snappedWaypoints:data.waypoints.map(({name,location,distance})=>({name,location,distance}))}, geometry:route.geometry};
  fs.mkdirSync(path.join(auditDir, 'candidates'), {recursive:true});
  fs.writeFileSync(path.join(auditDir, 'candidates', `${trip}-${day}.geojson`), JSON.stringify(feature)+'\n');
  console.log(JSON.stringify(feature.properties, null, 2));
}
if (require.main === module) main().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports = { candidatePoints };
