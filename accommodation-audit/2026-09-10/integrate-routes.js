const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {readPublishedTrip,writePublishedTrip}=require('../../lib/published-trips');
const {tripForCompanion}=require('../../lib/companion-feed');
const {mapsForTrip,attachMaps}=require('../../lib/companion-maps');
const root=path.resolve(__dirname,'../..'), id='trip_adria_2026';
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p))), write=(p,v,pretty=false)=>fs.writeFileSync(path.join(root,p),JSON.stringify(v,null,pretty?2:undefined)+'\n');
const source='data/trip-adria-2026.js',t=readPublishedTrip(fs.readFileSync(path.join(root,source),'utf8'),id);
const baseline=read('accommodation-audit/2026-09-10/routes/baseline.json');
assert.equal(t.publishedVersion,baseline.publishedVersion,'Source changed since calculation; rebase required');
const options=read('accommodation-audit/2026-09-10/replacement-options.json');
const neutral='Orientierungspunkt Makarska: INA Makarska-Ratac, Vukovarska 135 (43.306819, 17.007086). Ankunft und nächste Abfahrt verwenden diesen festen Punkt. Die Adresse von «Der Blick» wird erst nach Buchung bekannt; zur tatsächlich gewählten Unterkunft am jeweiligen Tag separat navigieren. Diese letzte Strecke ist nicht in Kilometer und Fahrzeit enthalten.';
for(const stayId of ['zadar','makarska-base','ston-return']) {
 const stay=t.accommodations.find(s=>s.id===stayId),p=options.options.find(o=>o.stayId===stayId&&o.rank===1),a=options.options.find(o=>o.stayId===stayId&&o.rank===2);
 assert.equal(stay.booking,'open','Do not replace an already booked stay');
 stay.currentFirstChoice=p.name;stay.currentFirstChoiceUrl=p.url;
 stay.currentFirstChoiceNotes=(p.address?'Adresse: '+p.address+'. ':'')+p.unit+'. '+p.listingEvidence+' Am 10.09.2026 für '+p.checkIn+' bis '+p.checkOut+' und zwei Erwachsene verfügbar angezeigt: CHF '+p.displayedTotalCHF+' insgesamt, kostenlos stornierbar vor '+p.freeCancellationBefore+'. Momentaufnahme, nicht gebucht.';
 if(a){stay.currentAlternative=a.name;stay.currentAlternativeUrl=a.url;stay.currentAlternativeNotes='Adresse: '+a.address+'. '+a.unit+'. '+a.listingEvidence+' Am 10.09.2026: CHF '+a.displayedTotalCHF+' insgesamt für zwei Erwachsene, kostenlos stornierbar vor '+a.freeCancellationBefore+'.';}
 else {stay.currentAlternative='Sun Spalato Residence · bedingt passende Reserve';stay.currentAlternativeUrl='https://www.booking.com/hotel/hr/sun-spalato-residence-ivano.de.html?checkin=2026-10-03&checkout=2026-10-06&group_adults=2&no_rooms=1&group_children=0';stay.currentAlternativeNotes='Zadarska ulica 1, Makarska. Am 10.09. für 03.–06.10. und zwei Erwachsene angezeigt: Erdgeschosswohnung, 55 m², Küche, Privatparkplatz, CHF 222 Mitgliederpreis. Kostenlose Stornierung nur vor 19.09.2026; deshalb weniger flexibel als Der Blick. Eigene Waschmaschine dieser Einheit nicht bestätigt.';}
 stay.parking='Privatparkplatz laut Inserat; sicherer Platz für zwei beladene Motorräder und geeignete Einfahrt nicht verbindlich bestätigt.';
 stay.reviewedAt='2026-09-10';stay.motorcycleParking='unknown';
 stay.reviewNote='Am 10.09.2026 für die Reisedaten als verfügbar geprüft, nicht gebucht. Preis, Verfügbarkeit und Stornofrist bei späterer Buchung erneut prüfen. '+stay.parking+' '+(stayId==='makarska-base'?neutral:'Navigation zur veröffentlichten Kartenposition von '+p.name+' ('+p.address+'). Die konkrete Parkplatzeinfahrt vor Ort bzw. mit dem Gastgeber abgleichen.');
 if(stayId==='ston-return')stay.reviewNote+=' Ausgewählt ist ein Doppelzimmer ohne zugesagte Küche; der Pool ist zum Reisetermin geschlossen.';
 stay.reviewSources=[p.url,...(a?[a.url]:[]),...(stayId==='makarska-base'?['https://www.ina.hr/station/makarska-ratac/']:[])];
}
const collection=read('assets/adria-routes.geojson'),draft=read('accommodation-audit/2026-09-10/route-change-draft.json');
for(const n of [6,8,10,13,20,21]){
 const day=t.days.find(d=>d.day===n),r=read(`accommodation-audit/2026-09-10/routes/adria-${n}.json`),f=collection.features.find(f=>f.properties.day===n);
 assert.ok(r.geometry.coordinates.length>100);assert.ok(r.durationSeconds<5*3600);
 day[r.changedField]=r.endpoint;day.main=r.mapsURL;
 const m=Math.round(r.durationSeconds/60);day.time=`ca. ${Math.floor(m/60)} h ${String(m%60).padStart(2,'0')}`;day.km=`ca. ${Math.round(r.distanceMeters/1000)} km${day.roadApproach?' plus Nachtfähre':''}`;
 let note=day.note.replace(/^Reine Fahrzeit(?: an Land)?:[^\n]*\n\n/,'');
 if(n===6){note=note.replace(/Ziel ist der öffentliche Google-Marker[\s\S]*?abgeglichen\. /,'Ziel ist Arborea, Ulica Augusta Šenoe 38a, am veröffentlichten Booking-Kartenmarker. ');day.roads='D8/E65 · Jadranska Magistrala · D306/Hrvatskog Sabora · Matije Gupca · Antuna Gustava Matoša · Tina Ujevića · Arborea';}
 if(n===8){day.roads='Arborea · Tina Ujevića · Antuna Gustava Matoša · Matije Gupca · D306/Hrvatskog Sabora · D8/Jadranska Magistrala · Podsolarsko';note+=' Start bei Arborea, Ulica Augusta Šenoe 38a, am selben Kartenpunkt wie die Ankunft.';}
 if(n===10){note=note.replace(/\n\nVilla Pehar:[\s\S]*$/,'')+'\n\n'+neutral;day.roads='D8 · Trogirska cesta · Ivana Pavla II · Jadranska Magistrala · Omiška obilaznica · INA Makarska-Ratac';}
 if(n===13){note=note.replace(/Das Ziel ist vorläufig ein Ortsanker[\s\S]*?Unterkunftsentscheidung\. /,'');note+='\n\n'+neutral;day.roads=day.roads.replace(/^Put Kulice · Svetog Florijana · Zagrebačka · Lička · /,'INA Makarska-Ratac · ');}
 if(n===20){note=note.replace(/Unterkunft bevorzugt in Luka oder Hodilje[^.]*\./,'Ziel ist Apartments Ivanka in Hodilje 118, am veröffentlichten Booking-Kartenmarker.');note=note.replace(/Google-Maps-Link und Kartenlinie wurden am 04\.09\.2026 abgeglichen\.[\s\S]*$/,'Der Start verwendet denselben öffentlichen Strassenanker in Sveti Stasije.');day.roads='E65/E80/M1 · Karasovići · D8/Jadranska Magistrala · D414 · Hodilje';}
 if(n===21){note=note.replace(/Google-Maps-Link und Kartenlinie wurden am 04\.09\.2026 abgeglichen\.\s*/,'');note+='\n\nStart bei Apartments Ivanka, Hodilje 118, am selben Kartenpunkt wie die Ankunft.';day.roads='Hodilje · '+day.roads;}
 day.note=`Reine Fahrzeit${day.roadApproach?' an Land':''}: ${day.time}.\n\n${note.trim()}`;
 const sea=f.properties.ferry?f.geometry.coordinates.at(-1):null;
 f.geometry=structuredClone(r.geometry);if(sea){f.properties.roadCoordinateCount=f.geometry.coordinates.length;f.geometry.coordinates.push(sea);}
 Object.assign(f.properties,{anchorCount:r.geometryPoints.length,distanceMeters:r.distanceMeters,durationSeconds:r.durationSeconds,roadGeometryResolution:'full',source:sea?'osrm-road-approach-and-schematic-ferry':'osrm-driving-via-reviewed-roadbook-anchors',auditInputs:{mapsURL:r.mapsURL,geometryPoints:r.geometryPoints},roadEvidence:{roadDistancesMeters:r.roadDistancesMeters,ferryMeters:0,snappedWaypoints:r.snappedWaypoints},navigationReview:{date:'2026-09-10',nativeGoogleMaps:'not-tested',evidence:'Unterkunftswechsel: vollständige OSRM-Strassenlinie neu berechnet, veröffentlichte Zielkoordinate und Strassenfolge geprüft. Google-Browser-Abgleich siehe accommodation-audit/2026-09-10/routes/google-review.json.',scope:'Public map coordinates and road routing; no guarantee of private driveway or travel-date traffic conditions'}});
 const d=draft.stages.find(s=>s.day===n);Object.assign(d,{proposedEndpoint:r.endpoint,proposedMapUrl:r.mapsURL,status:'integrated',geometry:`routes/adria-${n}.json`,distanceMeters:r.distanceMeters,durationSeconds:r.durationSeconds,verification:{verified:true,scope:'Published marker and recalculated road sequence; private driveway not confirmed',evidence:'routes/google-review.json'}});
}
assert.deepEqual(t.originalDays,baseline.originalDays,'Preserve original comparison plan');assert.deepEqual(t.trip,baseline.trip,'Preserve dates, ferry and preferences');
for(const d of t.days.filter(d=>![6,8,10,13,20,21].includes(d.day)))assert.deepEqual(d,baseline.days.find(b=>b.day===d.day));
t.publishedVersion=new Date().toISOString();
const converted=tripForCompanion(t),maps=read('data/companion-maps.json'),bundled=read('companion/Roadbook/Resources/plans.json');
maps.trips[id]=mapsForTrip(converted,collection);
const next={...bundled,trips:bundled.trips.map(x=>x.id===id?attachMaps(converted,maps):x)};
fs.writeFileSync(path.join(root,source),writePublishedTrip(t,id));write('assets/adria-routes.geojson',collection);write('data/companion-maps.json',maps);write('companion/Roadbook/Resources/plans.json',next,true);
draft.state='integrated-awaiting-deployment';draft.readyToPublish=true;draft.integratedVersion=t.publishedVersion;draft.publicationRequirements=['Integration checks and live deployment verification'];draft.primaryOptions=options.options.filter(o=>o.rank===1);write('accommodation-audit/2026-09-10/route-change-draft.json',draft,true);
console.log(t.publishedVersion);
