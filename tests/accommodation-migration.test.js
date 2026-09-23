const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {readPublishedTrip}=require('../lib/published-trips');
const {migrate}=require('../scripts/migrate-accommodation-options');
const {updateAccommodationRoutes}=require('../lib/accommodation-routes');
const locations=require('../data/accommodation-locations.json');
const load=()=>readPublishedTrip(fs.readFileSync('data/trip-adria-2026.js','utf8'),'trip_adria_2026');
test('migration preserves bookings, reviewed dates and navigation, and is idempotent',async()=>{
 const t=load();for(const s of t.accommodations){delete s.options;delete s.activeOptionId;delete s.accommodationNavigation;}
 const before=structuredClone(t);migrate(t,locations);
 assert.deepEqual(t.days,before.days);assert.deepEqual(t.originalDays,before.originalDays);
 for(const s of t.accommodations){assert.equal(s.booking,before.accommodations.find(x=>x.id===s.id).booking);if(s.options)await updateAccommodationRoutes(t,s.id,{route:async()=>{throw new Error('Baseline must not be recalculated');}});}
 assert.deepEqual(t.accommodationRoutes,{});assert.deepEqual(t.days,before.days);
 const lienz=t.accommodations.find(s=>s.id==='lienz');assert.equal(lienz.options[0].booking,'booked');assert.equal(lienz.options[1].booking,'unavailable');
 const migrated=structuredClone(t);migrate(t,locations);assert.deepEqual(t,migrated);
});
test('Makarska retains the explicitly agreed fixed navigation point after accommodation changes',async()=>{
 const t=load(),before=structuredClone(t.days),s=t.accommodations.find(s=>s.id==='makarska-base');
 s.options[0].booking='unavailable';s.options[1].booking='booked';
 await updateAccommodationRoutes(t,s.id,{route:async()=>{throw new Error('Fixed navigation must not change');}});
 assert.deepEqual(t.days,before);assert.deepEqual(t.accommodationRoutes,{});
});
test('existing option-specific bookings survive re-running the migration',()=>{
 const t=load(),s=t.accommodations.find(s=>s.id==='lienz');s.options[0].booking='open';s.options[1].booking='booked';s.booking='booked';
 migrate(t,locations);assert.equal(s.options[1].booking,'booked');assert.equal(s.activeOptionId,'alternative');
});
