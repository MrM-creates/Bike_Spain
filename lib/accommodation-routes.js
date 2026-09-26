const fs = require('node:fs');
const {usesReviewedNavigation} = require('./accommodation-baseline');
const {optionsFor, activeOption, coordinateValid} = require('../assets/accommodation-options');
const {addDays, parseDurationSeconds} = require('../assets/travel-model');
const {staysFor} = require('./booking-status');
const {routePoints} = require('./route-navigation');
const radians = x => x * Math.PI / 180;
function distance(a,b) {
  const x = radians(b[0]-a[0])*Math.cos(radians((a[1]+b[1])/2)), y = radians(b[1]-a[1]);
  return Math.hypot(x,y)*6371000;
}
const length = points => points.slice(1).reduce((n,p,i)=>n+distance(points[i],p),0);
const endpoint = p => `${p[1]},${p[0]}`;
const hotelKey = o => o ? JSON.stringify([o.id,o.name,o.coordinate||null,o.address||'']) : 'none';
function baseURL(day) {
  if(day.main) return day.main;
  const q=new URLSearchParams({api:'1',origin:day.origin,destination:day.destination,travelmode:'driving'});
  if(day.waypoints?.length) q.set('waypoints',day.waypoints.join('|'));
  return `https://www.google.com/maps/dir/?${q}`;
}
async function roadAccess(a,b) {
  if(distance(a,b)<10) return {coordinates:[a,b],distance:distance(a,b),duration:0};
  const response=await fetch(`https://router.project-osrm.org/route/v1/driving/${a.join(',')};${b.join(',')}?overview=full&geometries=geojson&steps=true`, {signal:AbortSignal.timeout(12000)});
  if(!response.ok) throw new Error('Die Routenberechnung ist gerade nicht erreichbar. Bitte erneut versuchen.');
  const data=await response.json(), r=data.routes?.[0];
  if(data.code!=='Ok' || !r || !r.geometry?.coordinates?.every(coordinateValid) || r.geometry.coordinates.length<2 || !Number.isFinite(r.distance) || !Number.isFinite(r.duration) || r.distance>40000 || data.waypoints?.some(w=>w.distance>150) || r.legs?.some(l=>l.steps?.some(s=>s.mode==='ferry'))) throw new Error('Die Zufahrt lässt sich nicht eindeutig berechnen. Bitte die Lage in der Reiseplanung prüfen.');
  return {coordinates:r.geometry.coordinates,distance:r.distance,duration:r.duration};
}
function getBase(snapshot,day,index) {
  const existing=snapshot.accommodationRoutes?.[day.id]?.base;
  if(existing) return existing;
  const file=snapshot.trip.id==='trip_adria_2026'?'adria-routes.geojson':'roadbook-routes.geojson';
  const features=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'../assets',file),'utf8')).features;
  const feature=features.find(f=>f.properties.day===index+1 && f.properties.variant==='original' && !f.properties.optional);
  // A saved geometry is usable only with the navigation signature it was reviewed against.
  const {signature}=require('./companion-maps');
  const saved=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'../data/companion-maps.json'),'utf8')).trips[snapshot.trip.id]?.[day.id];
  const sig=signature({id:day.id,title:day.title,rest:Boolean(day.rest),mapsURL:baseURL(day),roads:day.roads||'',overnight:day.overnight||''});
  if(!feature || (feature.properties.ferry && !feature.properties.roadCoordinateCount) || saved?.signature!==sig || !feature.properties.distanceMeters) throw new Error('Für diese Etappe fehlt eine passende geprüfte Ausgangsroute. Bitte in der Reiseplanung prüfen.');
  return {origin:day.origin,destination:day.destination,main:baseURL(day),km:day.km,time:day.time,coordinates:feature.properties.roadCoordinateCount ? feature.geometry.coordinates.slice(0,feature.properties.roadCoordinateCount) : feature.geometry.coordinates, ferryLines:(saved.map?.lines||[]).filter(l=>l.kind==='ferry'),
    distance:feature.properties.distanceMeters,duration:feature.properties.durationSeconds || parseDurationSeconds(day.time)};
}
// Keep the reviewed middle exactly. Only replace local access within 10 km of each end.
// Never silently reroute an entire motorcycle stage with a shortest-path car profile.
async function calculate(base,origin,destination,route=roadAccess) {
  const points=base.coordinates;
  let start=0,end=points.length-1;
  const join = (hotel,fromStart) => {
    if(distance(hotel,points[fromStart?0:points.length-1])>25000) throw new Error('Die Unterkunft liegt zu weit vom bisherigen Etappenort entfernt. Bitte die Etappe in der Reiseplanung anpassen.');
    let best=fromStart?0:points.length-1, travelled=0;
    for(let i=best; fromStart?i<points.length-1:i>0; i+=fromStart?1:-1){
      if(distance(hotel,points[i])<distance(hotel,points[best])) best=i;
      travelled+=distance(points[i],points[i+(fromStart?1:-1)]);
      if(travelled>10000) break;
    }
    return best;
  };
  if(origin) start=join(origin,true);
  if(destination) end=join(destination,false);
  // Do not discard an explicitly planned coordinate waypoint when trimming local access.
  const via=routePoints(base.main).slice(1,-1).map(s=>s.split(',').map(Number)).filter(p=>p.length===2&&p.every(Number.isFinite)).map(([lat,lon])=>[lon,lat]);
  if (via.length !== routePoints(base.main).length - 2) { start=0; end=points.length-1; }
  for(const p of via) {
    let nearest=0; for(let i=1;i<points.length;i++) if(distance(p,points[i])<distance(p,points[nearest])) nearest=i;
    if(distance(p,points[nearest])<300) {start=Math.min(start,nearest);end=Math.max(end,nearest);}
  }
  if(start>=end) throw new Error('Bitte diese kurze Etappe in der Reiseplanung prüfen.');
  const before=origin?await route(origin,points[start]):null;
  const after=destination?await route(points[end],destination):null;
  const removed=length(points.slice(0,start+1))+length(points.slice(end));
  const retained=Math.max(0,1-removed/length(points));
  const meters=Math.max(0,base.distance-removed)+(before?.distance||0)+(after?.distance||0);
  const seconds=base.duration*retained+(before?.duration||0)+(after?.duration||0);
  return {coordinates:[...(before?.coordinates.slice(0,-1)||[]),...points.slice(start,end+1),...(after?.coordinates.slice(1)||[])],distance:meters,duration:seconds};
}
async function updateAccommodationRoutes(snapshot,stayId,{route}={}) {
  const stays=staysFor(snapshot), stay=stays.find(s=>s.id===stayId)?.stay;
  if(!stay?.options) return;
  const days=snapshot.publishedDays||snapshot.days;
  snapshot.accommodationRoutes ||= {};
  const byDate=date=>stays.find(s=>s.stay.startDate<=date&&s.stay.endDate>date)?.stay;
  for(let i=0;i<days.length;i++) {
    const day=days[i], date=addDays(snapshot.trip.startDate,i), arrival=byDate(date), departure=byDate(addDays(date,-1));
    if(day.rest || (arrival!==stay && departure!==stay)) continue;
    const selected=s=>s?activeOption(s):null;
    const a=selected(departure),b=selected(arrival);
    const old=snapshot.accommodationRoutes[day.id];
    const key=JSON.stringify([hotelKey(a),hotelKey(b)]);
    if(old?.key===key && old.state==='ready') continue;
    // No endpoint change when merely migrating/bookkeeping the original first choice.
    const changed=s=>s?.options && !usesReviewedNavigation(s,activeOption(s));
    if(!old && !changed(arrival) && !changed(departure)) continue;
    const record={key,state:'pending',message:'Unterkunft gespeichert · Route noch nicht aktualisiert',base:old?.base};
    snapshot.accommodationRoutes[day.id]=record;
    try {
      const base=record.base||getBase({...snapshot,accommodationRoutes:{...snapshot.accommodationRoutes,[day.id]:old}},day,i);
      record.base=base;
      if((arrival?.options&&!b)||(departure?.options&&!a)) throw new Error('Neue Unterkunft nötig. Bitte eine verfügbare Unterkunft wählen.');
      const resolve=(s,o)=>!s?.options||usesReviewedNavigation(s,o)?null:coordinateValid(o?.coordinate)?o.coordinate:(()=>{throw new Error('Die genaue Lage fehlt. Bitte in der Reiseplanung bei dieser Unterkunft ergänzen.');})();
      const from=resolve(departure,a),to=resolve(arrival,b);
      const result=await calculate(base,from,to,route);
      const url=new URL(base.main);
      if(from) {url.searchParams.set('origin',endpoint(from));url.searchParams.delete('origin_place_id');}
      if(to) {url.searchParams.set('destination',endpoint(to));url.searchParams.delete('destination_place_id');}
      day.origin=url.searchParams.get('origin'); if(!day.roadApproach) day.destination=url.searchParams.get('destination');day.main=url.href;
      day.km=`ca. ${Math.round(result.distance/1000)} km`;
      const minutes=Math.round(result.duration/60);day.time=`ca. ${Math.floor(minutes/60)} h ${String(minutes%60).padStart(2,'0')}`;
      if(day.navigationDestinationLabel && to) day.navigationDestinationLabel=b.name;
      record.state='ready';record.message='Zufahrt aktualisiert · Fahrzeit geschätzt';record.mapsURL=day.main;
      record.distanceMeters=result.distance;record.durationSeconds=result.duration;
      record.map={lines:[{kind:'road',coordinates:result.coordinates},...(base.ferryLines||[])],stop:{coordinate:base.ferryLines?.at(-1)?.coordinates.at(-1)||to||result.coordinates.at(-1),label:b?.name||day.overnight,approximate:!to}};
    } catch(error) {
      record.message=error.message;
      // Keep navigation targets usable when a reviewed map line cannot be updated.
      // Google Maps chooses the road; the cached distance and map remain pending.
      if ((arrival?.options&&!b)||(departure?.options&&!a)||
          (arrival?.options&&!usesReviewedNavigation(arrival,b)&&!coordinateValid(b?.coordinate))||
          (departure?.options&&!usesReviewedNavigation(departure,a)&&!coordinateValid(a?.coordinate))||
          day.roadApproach) continue;
      try {
        const url=new URL(baseURL(day));
        if (departure?.options&&coordinateValid(a?.coordinate)) {
          url.searchParams.set('origin',endpoint(a.coordinate));
          url.searchParams.delete('origin_place_id');
        }
        if (arrival?.options&&coordinateValid(b?.coordinate)&&!day.roadApproach) {
          url.searchParams.set('destination',endpoint(b.coordinate));
          url.searchParams.delete('destination_place_id');
        }
        routePoints(url.href);
        day.origin=url.searchParams.get('origin');
        if (!day.roadApproach) day.destination=url.searchParams.get('destination');
        day.main=url.href;
        record.mapsURL=day.main;
      } catch (_) { /* Keep the pending route without publishing an invalid link. */ }
    }
  }
}
module.exports={updateAccommodationRoutes,calculate,roadAccess,distance,baseURL};
