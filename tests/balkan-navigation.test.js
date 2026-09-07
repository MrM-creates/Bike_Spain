const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {readPublishedTrip} = require('../lib/published-trips');
const {tripForCompanion} = require('../lib/companion-feed');
const {importLegacyRoadbook} = require('../assets/travel-model');
const {routePoints} = require('../lib/route-navigation');

const trip = () => readPublishedTrip(fs.readFileSync('data/trip-adria-2026.js','utf8'),'trip_adria_2026');

test('published Balkan plan preserves every point through the actual web and native imports', () => {
  const source = trip();
  const web = importLegacyRoadbook(source);
  const native = tripForCompanion(source);
  assert.equal(native.days.filter(day => !day.rest).length, 18);
  assert.equal(native.days.find(day => day.number === 25).navigationParts.length, 2);
  for (const day of native.days.filter(day => !day.rest)) {
    for (const link of day.navigationParts || [{mapsURL: day.mapsURL}]) {
      assert.ok(routePoints(link.mapsURL).length <= 5, `Too many mobile waypoints: ${day.id}`);
    }
  }
  for (const day of source.days.filter(d => d.navigationBreaks?.length)) {
    const nativeDay = native.days[day.day - 1];
    const webRoute = web.revision.routeVariants.find(r => r.providerRouteRef === day.main);
    assert.deepEqual(webRoute.navigationParts, nativeDay.navigationParts);
    assert.ok(nativeDay.navigationParts.length > 1);
    const points = nativeDay.navigationParts.flatMap((part, index) => {
      const points = routePoints(part.mapsURL);
      assert.ok(points.length <= 5);
      return points.slice(index ? 1 : 0);
    });
    assert.deepEqual(points, routePoints(day.main));
    assert.equal(new URL(nativeDay.navigationParts[0].mapsURL).searchParams.get('destination'),
      new URL(nativeDay.navigationParts[1].mapsURL).searchParams.get('origin'));
  }
});

test('browser-loaded splitter and model retain the same Balkan sections as Node', () => {
  const context = vm.createContext({URL, URLSearchParams});
  for (const file of ['assets/route-navigation.js','assets/travel-model.js']) {
    vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
  }
  const source = trip();
  const browserModel = context.MotorcycleTravelModel.importLegacyRoadbook(source);
  const nodeModel = importLegacyRoadbook(source);
  assert.deepEqual(JSON.parse(JSON.stringify(browserModel.revision.routeVariants)),
    JSON.parse(JSON.stringify(nodeModel.revision.routeVariants)));
});
