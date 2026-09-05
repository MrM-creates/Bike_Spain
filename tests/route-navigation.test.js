const test = require('node:test');
const assert = require('node:assert/strict');
const { navigationParts, routePoints } = require('../lib/route-navigation');
const makeURL = (origin, destination, waypoints) => 'https://www.google.com/maps/dir/?' + new URLSearchParams({api:'1',travelmode:'driving',origin,destination,waypoints:waypoints.join('|')});
const full = makeURL('Hotel A', 'Hotel B', ['A', 'B', 'Safe parking', 'C', 'D']);
const day = {id:'day-1', navigationBreaks:[{waypointIndex:2,label:'Seepause',safeStop:true}]};

test('splits at reviewed parking, preserving every point exactly once in order', () => {
  const parts = navigationParts(day, full);
  assert.equal(parts.length, 2);
  assert.deepEqual(routePoints(parts[0].mapsURL), ['Hotel A','A','B','Safe parking']);
  assert.deepEqual(routePoints(parts[1].mapsURL), ['Safe parking','C','D','Hotel B']);
  assert.equal(parts[0].title, 'Bis Seepause');
  assert.equal(parts[1].id, 'day-1-navigation-2');
});
test('does not invent a stopping point for old or short routes', () => {
  assert.equal(navigationParts({id:'old'}, full), undefined);
});
test('rejects unreviewed stops, wrong order, non-integers and too-long sections', () => {
  for (const stops of [
    [{waypointIndex:2,label:'Tunnel'}],
    [{waypointIndex:2,label:'',safeStop:true}],
    [{waypointIndex:2.5,label:'A',safeStop:true}],
    [{waypointIndex:5,label:'Outside',safeStop:true}],
    [{waypointIndex:4,label:'Too late',safeStop:true}],
    [day.navigationBreaks[0],day.navigationBreaks[0]]
  ]) assert.throws(() => navigationParts({...day,navigationBreaks:stops},full));
  assert.throws(() => navigationParts({...day,rest:true},full));
});
test('ferry parts remain solely on the original land approach', () => {
  const parts = navigationParts({...day,roadApproach:true,destination:'Ancona',navigationDestinationLabel:'Fahrzeughafen Split'}, makeURL('Hotel A','Gat Svetog Duje, Split',['A','B','Safe parking','C','D']));
  assert.equal(routePoints(parts[1].mapsURL).at(-1),'Gat Svetog Duje, Split');
  assert.equal(parts[1].title,'Bis Fahrzeughafen Split');
  assert.ok(parts.every(p=>!p.mapsURL.includes('Ancona')));
});
test('rejects foreign and incomplete URLs and drops segment-specific place IDs', () => {
  assert.throws(()=>navigationParts(day,'https://example.com/maps/dir/'));
  assert.throws(()=>routePoints('https://www.google.com/maps/dir/?api=1&travelmode=driving&origin=A'));
  const parts = navigationParts(day,full+'&destination_place_id=old');
  assert.ok(parts.every(p=>!p.mapsURL.includes('place_id')));
});
test('rejects ambiguous parameters and empty intermediate points', () => {
  assert.throws(()=>routePoints(full+'&origin=Another'));
  assert.throws(()=>routePoints(full+'&avoid=highways&avoid=tolls'));
  assert.throws(()=>routePoints(makeURL('  ','B',[])));
  assert.throws(()=>routePoints(makeURL('A','B',['C','','D'])));
  assert.throws(()=>routePoints(makeURL('A','B',['  '])));
});
test('preserves motorway avoidance in every section', () => {
  const parts = navigationParts(day, full+'&avoid=highways');
  assert.ok(parts.every(p=>new URL(p.mapsURL).searchParams.get('avoid')==='highways'));
});
