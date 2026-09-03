const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
require('../data/trip-adria-2026');
const trip = global.__TRIP_ADRIA_DATA__;
const routes = JSON.parse(fs.readFileSync(require.resolve('../assets/adria-routes.geojson'), 'utf8'));
const hours = (text) => {
  const match = text.match(/(\d+) h(?: (\d+))?/);
  return match ? Number(match[1]) + Number(match[2] || 0) / 60 : NaN;
};

test('Balkan: all driving days have exactly one geometry and realistic bounded plan times', () => {
  const driving = trip.days.filter(day => !day.rest);
  assert.equal(driving.length, 18);
  assert.equal(trip.days.filter(day => day.rest).length, 12);
  assert.deepEqual(routes.features.map(f => f.properties.day), driving.map(d => d.day));
  for (const day of driving) {
    const route = routes.features.find(f => f.properties.day === day.day);
    assert.equal(route.properties.name, `${day.day} ${day.title}`);
    assert.ok(hours(day.time) <= 5, `Tag ${day.day}: maximal fünf Stunden`);
    assert.ok(hours(day.time) * 3600 >= route.properties.durationSeconds, `Tag ${day.day}: Planwert nicht unter Routerzeit`);
    const maps = new URL(day.main);
    assert.equal(maps.searchParams.get('origin'), day.origin);
    assert.equal(maps.searchParams.get('destination'), day.roadApproach ? 'Split Ferry Port, Croatia' : day.destination);
    assert.equal(maps.searchParams.get('waypoints') || '', (day.roadApproach ? day.waypoints.slice(0, -1) : day.waypoints).join('|'));
    assert.ok((maps.searchParams.get('waypoints') || '').split('|').filter(Boolean).length <= 3);
  }
});

test('Balkan: dates, accommodation pairs and unconfirmed booking status agree', () => {
  const nightDates = trip.accommodations.flatMap(stay => {
    assert.equal(stay.booking, 'open');
    assert.ok(stay.currentFirstChoice && stay.currentAlternative);
    const dates = [];
    for (let date = Date.parse(stay.startDate); date < Date.parse(stay.endDate); date += 86400000) dates.push(new Date(date).toISOString().slice(0, 10));
    return dates;
  });
  assert.equal(trip.accommodations.length, 17);
  assert.deepEqual(nightDates, Array.from({length: 29}, (_, i) => new Date(Date.parse(trip.trip.startDate) + i * 86400000).toISOString().slice(0, 10)));
  assert.match(trip.days[15].note, /EES gilt nicht/);
  assert.equal(trip.days[15].time, 'ca. 3 h plus Grenze');
});
