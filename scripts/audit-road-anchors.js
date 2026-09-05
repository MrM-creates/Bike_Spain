// Read-only road-anchor lookup. Output is a candidate, not a Google verification.
const config = JSON.parse(process.argv[2]);
(async () => {
  const response = await fetch('https://router.project-osrm.org/route/v1/driving/' + config.points.map(p=>p.join(',')).join(';') + '?overview=false&steps=true&geometries=geojson', {signal:AbortSignal.timeout(30000)});
  if (!response.ok) throw new Error(`OSRM ${response.status}`);
  const result = await response.json(), route = result.routes?.[0];
  if (!route) throw new Error(result.message || 'No route');
  const steps = route.legs.flatMap(l=>l.steps);
  const normalizeRef = value => String(value || '').replace(/\s+/g, '');
  const coordinates = steps.filter(s=>config.refs.some(ref=>normalizeRef(ref)===normalizeRef(s.ref)) || config.names?.includes(s.name)).flatMap(s=>s.geometry.coordinates);
  if (!coordinates.length) throw new Error('Requested roads not present: ' + [...new Set(steps.map(s=>s.ref||s.name))].join(', '));
  const anchors = config.targets.map(p=>coordinates.reduce((a,b)=>Math.hypot(b[0]-p[0],b[1]-p[1])<Math.hypot(a[0]-p[0],a[1]-p[1])?b:a));
  console.log(JSON.stringify({anchors,roads:[...new Set(steps.map(s=>s.ref||s.name))],distanceMeters:route.distance}));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
