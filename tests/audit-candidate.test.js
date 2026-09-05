const test = require('node:test');
const assert = require('node:assert/strict');
const { candidatePoints } = require('../scripts/generate-audit-candidate');
const candidate = { endpointCoordinates:[[8,47],[5,44]], waypoints:['46,7'] };

test('audit geometry converts latitude-longitude links without swapping endpoints', () => {
  assert.deepEqual(candidatePoints(candidate), [[8,47],[7,46],[5,44]]);
});
test('audit geometry keeps explicit rendering anchors separate from Google waypoints', () => {
  const c = {...candidate,geometryWaypointCoordinates:[[7.5,46.5],[7,46]]};
  assert.deepEqual(candidatePoints(c), [[8,47],[7.5,46.5],[7,46],[5,44]]);
  assert.deepEqual(c.waypoints,['46,7']);
});
test('audit refuses unsupported avoidance rather than silently taking motorways', () => {
  for (const avoid of ['highways','tolls','ferries','highways|tolls']) {
    assert.throws(()=>candidatePoints({...candidate,avoid}),/cannot enforce/);
  }
});
test('audit rejects missing endpoints, unresolved names and invalid coordinates', () => {
  for (const change of [
    {endpointCoordinates:[[8,47]]},
    {waypoints:['Unresolved hotel']},
    {waypointCoordinates:[]},
    {waypointCoordinates:[[7,91]]},
    {geometryWaypointCoordinates:[[NaN,45]]},
    {geometryWaypointCoordinates:[[181,45]]},
    {geometryWaypointCoordinates:[['7',45]]}
  ]) assert.throws(()=>candidatePoints({...candidate,...change}));
});
