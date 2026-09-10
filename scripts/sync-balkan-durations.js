// Use the saved, reviewed road geometry as the source of pure driving times.
// No routing requests, pause allowances or changes to navigation are made here.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { readPublishedTrip, writePublishedTrip } = require('../lib/published-trips');
const { companionFeed } = require('../lib/companion-feed');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'data/trip-adria-2026.js');
const source = fs.readFileSync(sourcePath, 'utf8');
const trip = readPublishedTrip(source, 'trip_adria_2026');
const collection = JSON.parse(fs.readFileSync(path.join(root, 'assets/adria-routes.geojson')));
const rows = [];
for (const day of trip.days.filter(day => !day.rest)) {
  const matches = collection.features.filter(f => f.properties.day === day.day &&
    f.properties.variant === 'original' && !f.properties.optional);
  assert.equal(matches.length, 1, `Tag ${day.day}: eindeutige Routenberechnung erforderlich`);
  const seconds = matches[0].properties.durationSeconds;
  assert.ok(Number.isFinite(seconds) && seconds > 0, `Tag ${day.day}: Fahrzeit fehlt`);
  assert.ok(seconds <= trip.trip.preferences.maxDailyRidingHours * 3600,
    `Tag ${day.day}: berechnete Fahrzeit überschreitet das Tageslimit`);
  const minutes = Math.round(seconds / 60);
  const time = `ca. ${Math.floor(minutes / 60)} h${minutes % 60 ? ` ${String(minutes % 60).padStart(2, '0')}` : ''}`;
  rows.push({ day: day.day, previous: day.time, seconds, time });
  for (const key of ['days', 'originalDays', 'publishedDays']) {
    const target = trip[key]?.find(d => d.id === day.id);
    if (!target) continue;
    target.time = time;
    const note = (target.note || '').replace(/^Reine Fahrzeit(?: an Land)?: ca\. \d+ h(?: \d+)?\.\s*/, '');
    target.note = `Reine Fahrzeit${target.roadApproach ? ' an Land' : ''}: ${time}.\n\n${note}`.trim();
  }
}

if (writePublishedTrip(trip, trip.trip.id) !== source) {
  trip.publishedVersion = new Date().toISOString();
  trip.trip.dataVersion = trip.publishedVersion;
  fs.writeFileSync(sourcePath, writePublishedTrip(trip, trip.trip.id));
}

// Update only the Balkan part of the generated offline resource.
const bundlePath = path.join(root, 'companion/Roadbook/Resources/plans.json');
const bundle = JSON.parse(fs.readFileSync(bundlePath));
const index = bundle.trips.findIndex(t => t.id === trip.trip.id);
assert.ok(index >= 0, 'Balkan-Reise fehlt in der App-Ressource');
bundle.trips[index] = companionFeed(trip.trip.id).trips[0];
fs.writeFileSync(bundlePath, JSON.stringify(bundle, null, 2) + '\n');
console.log(JSON.stringify({ version: trip.publishedVersion, rows }, null, 2));
