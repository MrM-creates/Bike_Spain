const fs = require('node:fs');
const path = require('node:path');
const {readPublishedTrip} = require('../../lib/published-trips');
const root = path.resolve(__dirname, '../..');
const read = p => JSON.parse(fs.readFileSync(path.join(root,p)));
const trip = readPublishedTrip(fs.readFileSync(path.join(root,'data/trip-adria-2026.js'),'utf8'),'trip_adria_2026');
const collection = read('assets/adria-routes.geojson');
const anchors = {
  zadar: {name:'Arborea', address:'Ulica Augusta Šenoe 38a, Zadar', coordinate:[15.217936041002558,44.13247343788357], source:'https://www.booking.com/hotel/hr/arborea-luxury-apartment-with-private-yard.de.html', evidence:'Public map link data-atlas-latlng; address search on Google only partially matches number 38. Use the published listing marker, not the partial address result.'},
  makarska: {name:'INA Makarska-Ratac', address:'Vukovarska 135, Makarska', coordinate:[17.007086,43.306819], source:'https://www.ina.hr/station/makarska-ratac/', evidence:'Official station page address and linked map lat=43.306819&lng=17.007086. User-approved orientation point; not the location of Der Blick.'},
  ston: {name:'Apartments Ivanka', address:'Hodilje 118, Ston', coordinate:[17.690087,42.854686], source:'https://www.booking.com/hotel/hr/apartments-ivanka-ston1.de.html', evidence:'Public map link data-atlas-latlng and visible address Hodilje 118.'}
};
const changes = {6:['zadar','destination'],8:['zadar','origin'],10:['makarska','destination'],13:['makarska','origin'],20:['ston','destination'],21:['ston','origin']};
const fallback = {
  6:[[14.9021456,44.9941346],[15.183677,44.447464],[15.493408,44.272672],[15.523357,44.222638],[15.2162747,44.1393374]],
  20:[[18.7644,42.466333],[18.699843,42.486779],[18.433912,42.490432],[17.6812,42.8608]],
  21:[[17.6812,42.8608],[17.579727,42.88533],[16.571883,43.590818],[16.440671,43.502762]]
};
(async()=>{
fs.mkdirSync(path.join(__dirname,'routes'),{recursive:true});
fs.writeFileSync(path.join(__dirname,'navigation-anchors.json'),JSON.stringify({checkedOn:'2026-09-10',anchors},null,2)+'\n');
const baseline = path.join(__dirname,'routes/baseline.json');
if (!fs.existsSync(baseline)) fs.writeFileSync(baseline,JSON.stringify({publishedVersion:trip.publishedVersion, days:trip.days, accommodations:trip.accommodations, originalDays:trip.originalDays, trip:trip.trip, features:collection.features},null,2)+'\n');
for (const [key,[place,field]] of Object.entries(changes)) {
 const number=Number(key), day=trip.days.find(d=>d.day===number), feature=collection.features.find(f=>f.properties.day===number);
 let points=structuredClone(feature.properties.auditInputs?.geometryPoints||fallback[number]);
 // Old Makarska house-access shaping points no longer belong to the neutral stop.
 if(number===10) points.splice(-2,1);
 if(number===13) points.splice(1,1);
 const coordinate=anchors[place].coordinate;
 points[field==='origin'?0:points.length-1]=coordinate;
 const endpoint=[...coordinate].reverse().map(x=>x.toFixed(7)).join(',');
 const maps=new URL(day.main);maps.searchParams.set(field,endpoint);
 const url='https://router.project-osrm.org/route/v1/driving/'+points.map(p=>p.join(',')).join(';')+'?overview=full&steps=true&geometries=geojson&continue_straight=true';
 const res=await fetch(url,{signal:AbortSignal.timeout(45000)}); if(!res.ok) throw new Error('OSRM '+res.status);
 const data=await res.json(), route=data.routes?.[0]; if(!route?.geometry?.coordinates?.length) throw new Error('Missing route');
 const roads={};for(const leg of route.legs)for(const s of leg.steps){if(s.mode==='ferry')throw new Error('Unexpected ferry'); const key=s.ref||s.name||'unnamed';roads[key]=(roads[key]||0)+s.distance;}
 const report={day:number,place,changedField:field,endpoint,mapsURL:maps.href,geometryPoints:points,fetchedAt:new Date().toISOString(),routingURL:url,distanceMeters:route.distance,durationSeconds:route.duration,roadDistancesMeters:roads,snappedWaypoints:data.waypoints.map(({name,location,distance})=>({name,location,distance})),roadSteps:route.legs.map(l=>l.steps.map(({name,ref,distance,maneuver})=>({name,ref,distance,maneuver}))),geometry:route.geometry};
 fs.writeFileSync(path.join(__dirname,`routes/adria-${number}.json`),JSON.stringify(report)+'\n');
 console.log(JSON.stringify({day:number,km:route.distance/1000,minutes:route.duration/60,roads,snaps:report.snappedWaypoints}));
 await new Promise(r=>setTimeout(r,1100));
}
})().catch(e=>{console.error(e);process.exitCode=1});
