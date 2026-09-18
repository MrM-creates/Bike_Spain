const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {readPublishedTrip}=require('../lib/published-trips');
const {companionFeed}=require('../lib/companion-feed');
const snapshot=readPublishedTrip(fs.readFileSync(require.resolve('../data/trip-adria-2026.js'),'utf8'),'trip_adria_2026');
const baseline=JSON.parse(fs.readFileSync(require.resolve('../accommodation-audit/2026-09-10/routes/baseline.json')));
const publicationBase=JSON.parse(fs.readFileSync(require.resolve('../accommodation-audit/2026-09-10/routes/publication-base.json')));
const feed=companionFeed('trip_adria_2026').trips[0];
test('replacement stops join arrivals, rest days and departures without changing the remaining trip',()=>{
 for(const [arrival,departure] of [[6,8],[10,13],[19,21]]){
  const a=snapshot.days[arrival-1],d=snapshot.days[departure-1];assert.equal(a.destination,d.origin);
  const stop=feed.days[arrival-1].map.stop.coordinate;
  assert.deepEqual(stop,feed.days[departure-1].map.lines[0].coordinates[0]);
  for(let i=arrival;i<departure-1;i++)assert.deepEqual(feed.days[i].map.stop.coordinate,stop);
 }
 assert.deepEqual(snapshot.originalDays,baseline.originalDays);

 for(const d of snapshot.days.filter(d=>![6,8,10,13,19,20,21,22].includes(d.day)))assert.deepEqual(d,baseline.days.find(b=>b.id===d.id));
 for(const s of snapshot.accommodations.filter(s=>!['innsbruck-mutters','zadar','makarska-base','kotor-dobrota','shkoder','durres-ancona-cabin'].includes(s.id)))assert.deepEqual(s,publicationBase.accommodations.find(b=>b.id===s.id));
});
test('Makarska orientation point stays distinct from lodging and ferry navigation ends on land',()=>{
 const m=feed.days[9];assert.match(m.accommodation.first.name,/Der Blick/);assert.match(m.notes,/Orientierungspunkt Makarska/);
 assert.match(m.accommodation.notes,/erst nach Buchung/);assert.equal(new URL(m.mapsURL).searchParams.get('destination'),'43.3068190,17.0070860');
 assert.equal(new URL(feed.days[20].mapsURL).searchParams.get('destination'),'41.3167417,19.4654539');
 assert.deepEqual(feed.days[20].map.lines[1].coordinates.at(-1),baseline.features.find(f=>f.properties.day===21).geometry.coordinates.at(-1));
 const current=JSON.stringify({days:snapshot.days,stays:snapshot.accommodations.filter(s=>['zadar','makarska-base','ston-return'].includes(s.id))});
 assert.doesNotMatch(current,/Villa Pehar|Adria Concept|Apartman I&M|Diklo – Modern|Apartmani Mirjana/);
});
