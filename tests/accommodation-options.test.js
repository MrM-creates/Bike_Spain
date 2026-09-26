const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
const {optionsFor,activeOption,validateOptions}=require('../assets/accommodation-options');
const {readPublishedTrip}=require('../lib/published-trips');
const {bookingInfo,applyBookingStatus}=require('../lib/booking-status');
const {updateAccommodationRoutes,calculate}=require('../lib/accommodation-routes');
const {tripForCompanion}=require('../lib/companion-feed');
const {attachMaps}=require('../lib/companion-maps');
const fixture=()=>{const t=readPublishedTrip(fs.readFileSync('data/trip-adria-2026.js','utf8'),'trip_adria_2026');const s=t.accommodations.find(s=>s.id==='lienz');s.booking='';for(const o of s.options)o.booking='open';return t;};
const fakeRoute=async(a,b)=>({coordinates:[a,b],distance:500,duration:60});
const set=(t,id,booking,stayId='lienz')=>{const s=t.accommodations.find(s=>s.id===stayId);return applyBookingStatus(t,{stayId,optionId:id,booking,expectedRevision:bookingInfo(stayId,s,t.publishedVersion,id).bookingRevision},new Date(Date.parse(t.publishedVersion)+1000).toISOString());};


test('legacy migration keeps booking on first option; unavailable fallback and third option have own status',()=>{
 const s={firstChoice:'First',alternative:'Second',booking:'booked'};
 assert.equal(optionsFor(s)[0].booking,'booked');assert.equal(optionsFor(s)[1].booking,'open');
 s.options=optionsFor(s);s.options[0].booking='unavailable';assert.equal(activeOption(s).id,'alternative');
 s.options[1].booking='unavailable';assert.equal(activeOption(s),null);
 s.options.push({id:'third',name:'Third',url:'',booking:'asked'});assert.equal(activeOption(s).id,'third');
 assert.throws(()=>validateOptions([...s.options,s.options[0]]));
});
test('Lienz alternative updates arrival and departure, preserves waypoints and untouched days, no baseline mutation',async()=>{
 const t=fixture(), before=structuredClone(t);set(t,'alternative','booked');
 assert.equal(t.accommodations[1].options[0].booking,'open');
 await updateAccommodationRoutes(t,'lienz',{route:fakeRoute});
 for(const n of [1,2]){assert.equal(t.accommodationRoutes[t.days[n].id].state,'ready');assert.deepEqual(t.days[n].waypoints,before.days[n].waypoints);}
 assert.equal(new URL(t.days[1].main).searchParams.get('destination'),'46.8293036,12.7545062');
 assert.equal(new URL(t.days[2].main).searchParams.get('origin'),'46.8293036,12.7545062');
 assert.deepEqual(t.days.filter((_,i)=>i!==1&&i!==2),before.days.filter((_,i)=>i!==1&&i!==2));assert.deepEqual(t.originalDays,before.originalDays);
 const feed=tripForCompanion(t);assert.match(feed.days[1].accommodation.first.name,/Schlossberghof/);assert.equal(feed.days[1].accommodation.activeOptionId,'alternative');
 assert.equal(feed.days[1].accommodation.options[0].booking,'open');assert.equal(feed.days[1].accommodation.bookingEditable,false);
 assert.ok(feed.days[1].map.lines[0].coordinates.length>1000);
 assert.equal(attachMaps(feed,JSON.parse(fs.readFileSync('data/companion-maps.json'))).days[1].map.stop.label,feed.days[1].accommodation.first.name);
});
test('failed route keeps booking and selected hotel navigation while metrics and geometry stay pending; retry succeeds',async()=>{
 const t=fixture();set(t,'alternative','booked');await updateAccommodationRoutes(t,'lienz',{route:async()=>{throw new Error('Offline');}});
 const feed=tripForCompanion(t);assert.equal(feed.days[1].accommodation.status,'Gebucht');assert.equal(new URL(feed.days[1].mapsURL).searchParams.get('destination'),'46.8293036,12.7545062');
 assert.equal(new URL(feed.days[2].mapsURL).searchParams.get('origin'),'46.8293036,12.7545062');
 assert.deepEqual(new URL(feed.days[1].mapsURL).searchParams.get('waypoints'),t.days[1].waypoints.join('|'));assert.equal(feed.days[1].map,null);assert.equal(feed.days[1].distance,'Aktualisierung offen');assert.match(feed.days[1].accommodation.directMapsURL,/destination=/);
 await updateAccommodationRoutes(t,'lienz',{route:fakeRoute});assert.equal(tripForCompanion(t).days[1].routeStatus,'ready');
});
test('third hotel after a waypoint edit keeps both full Maps targets without claiming a reviewed map',async()=>{
 const t=fixture(),s=t.accommodations.find(stay=>stay.id==='lienz');
 s.options.push({id:'third',name:'Third hotel',address:'Lienz',coordinate:[12.77,46.83],booking:'booked'});
 const changed=new URL(t.days[1].main);changed.searchParams.set('waypoints',[...t.days[1].waypoints,'46.82,12.76'].join('|'));t.days[1].main=changed.href;
 await updateAccommodationRoutes(t,'lienz',{route:fakeRoute});
 const feed=tripForCompanion(t);assert.equal(feed.days[1].routeStatus,'pending');
 assert.equal(new URL(feed.days[1].mapsURL).searchParams.get('destination'),'46.83,12.77');
 assert.equal(new URL(feed.days[1].mapsURL).searchParams.get('waypoints'),changed.searchParams.get('waypoints'));
 assert.equal(new URL(feed.days[2].mapsURL).searchParams.get('origin'),'46.83,12.77');
 assert.equal(feed.days[1].map,null);assert.equal(feed.days[1].duration,'');
});
test('cannot silently book two hotels or use a stale option revision',()=>{
 const t=fixture();const s=t.accommodations[1],old=bookingInfo(s.id,s,t.publishedVersion,'first');set(t,'alternative','booked');
 assert.throws(()=>set(t,'first','booked'),/bereits gebucht/);
 assert.throws(()=>applyBookingStatus(t,{stayId:s.id,optionId:'first',booking:'asked',expectedRevision:old.bookingRevision},'new'),/inzwischen/);
});
test('return to first choice restores original navigation and route, no accumulated connectors',async()=>{
 const t=fixture(),before=structuredClone(t);set(t,'alternative','booked');await updateAccommodationRoutes(t,'lienz',{route:fakeRoute});
 set(t,'alternative','open');await updateAccommodationRoutes(t,'lienz',{route:fakeRoute});
 assert.equal(t.days[1].main,before.days[1].main);assert.equal(t.days[2].main,before.days[2].main);
 assert.deepEqual(t.accommodationRoutes['adria-2'].map.lines[0].coordinates,t.accommodationRoutes['adria-2'].base.coordinates);
});
test('rest nights and next departure share selected hotel; all unavailable requires a new hotel',async()=>{
 const t=fixture(),s=t.accommodations.find(s=>s.id==='zadar');s.options=optionsFor(s);s.options[1].coordinate=[15.218,44.133];set(t,'alternative','booked','zadar');await updateAccommodationRoutes(t,'zadar',{route:fakeRoute});
 const feed=tripForCompanion(t);assert.equal(feed.days[6].accommodation.activeOptionId,'alternative');assert.deepEqual(feed.days[6].map.stop.coordinate,[15.218,44.133]);assert.equal(feed.days[7].routeStatus,'ready');
 set(t,'alternative','unavailable','zadar');set(t,'first','unavailable','zadar');await updateAccommodationRoutes(t,'zadar',{route:fakeRoute});assert.equal(tripForCompanion(t).days[5].accommodation.status,'Neue Unterkunft nötig');assert.equal(tripForCompanion(t).days[5].mapsURL,'');
});
test('missing location saves option status and requests location, does not guess coordinates',async()=>{
 const t=fixture();delete t.accommodations[1].options[1].coordinate;set(t,'alternative','booked');await updateAccommodationRoutes(t,'lienz',{route:fakeRoute});assert.match(t.accommodationRoutes['adria-2'].message,/Lage fehlt/);assert.equal(tripForCompanion(t).days[1].mapsURL,'');
});
test('access adjustment retains exact reviewed middle and rejects distant relocation',async()=>{
 const p=[[12,46],[12.01,46],[12.1,46],[12.2,46],[12.21,46]];
 const base={coordinates:p,distance:17000,duration:1500,main:'https://www.google.com/maps/dir/?api=1&travelmode=driving&origin=A&destination=B'};
 const r=await calculate(base,[12.01,46.001],[12.2,46.001],fakeRoute);assert.ok(r.coordinates.some(c=>c[0]===12.1));
 await assert.rejects(()=>calculate(base,[14,48],null,fakeRoute),/zu weit/);
});
test('full-plan publication retains option-specific status and rejects erasing a booked stay',()=>{
 const t=fixture();set(t,'alternative','booked');const next=structuredClone(t);delete next.accommodations[1].options;
 require('../lib/preserve-accommodation-options').preserveAccommodationOptions(t,next);assert.equal(next.accommodations[1].options[1].booking,'booked');
 next.accommodations.splice(1,1);assert.throws(()=>require('../lib/preserve-accommodation-options').preserveAccommodationOptions(t,next),/gebuchter Aufenthalt/);
});
