const fs=require('node:fs');
const {optionsFor,activeOption}=require('../assets/accommodation-options');
const {readPublishedTrip,writePublishedTrip}=require('../lib/published-trips');
function migrate(snapshot, locations) {
  const geometry=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'../assets/', snapshot.trip.id==='trip_adria_2026'?'adria-routes.geojson':'roadbook-routes.geojson')));
  for(const [key,stay] of Object.entries(snapshot.accommodations)) {
    if(/fähre|kabine|cabin/i.test(`${stay.title} ${stay.currentFirstChoice||stay.firstChoice}`)) continue;
    const id=stay.id||key, existing=Boolean(stay.options);
    stay.options=optionsFor(stay).map(o=>({...o}));
    if(!stay.options.length)continue;
    const dateIndex=Math.round((Date.parse(stay.startDate)-Date.parse(snapshot.trip.startDate))/86400000);
    const day=(snapshot.publishedDays||snapshot.days)[dateIndex];
    const first=stay.options.find(o=>o.id==='first');
    const fixed=snapshot.trip.id==='trip_adria_2026'&&id==='makarska-base';
    if(first&&!existing){
      const url=day.main?new URL(day.main):null, target=url?.searchParams.get('destination')||day.destination;
      const xy=target?.split(',').map(Number);
      const feature=geometry.features.find(f=>f.properties.day===dateIndex+1&&f.properties.variant==='original'&&!f.properties.optional);
      // Public route targets were already reviewed and accepted. Preserve them exactly.
      if(!fixed && id!=='kotor-dobrota') first.coordinate=xy?.length===2&&xy.every(Number.isFinite)?[xy[1],xy[0]]:feature?.geometry.coordinates.at(-1);
      if(target && !(xy?.length===2&&xy.every(Number.isFinite)))first.address=target;
    }
    for(const o of stay.options){const info=locations[snapshot.trip.id]?.[id]?.[o.id];if(info&&info.name===o.name){if(info.address)o.address=info.address;if(info.coordinate)o.coordinate=info.coordinate;if(info.note&&!o.note.includes(info.note))o.note=[o.note,info.note].filter(Boolean).join('\n\n');}}
    if(!existing && first)stay.accommodationNavigation={optionId:first.id,name:first.name,coordinate:first.coordinate||null,address:first.address||'',fixed,source:'Bereits veröffentlichte und geprüfte Tagesroute',...(fixed?{label:'INA Makarska-Ratac, Vukovarska 135',coordinate:[17.007086,43.306819],hotelCoordinate:null}:{} )};
    if(snapshot.trip.id==='trip_adria_2026'&&id==='lienz'){
      const alternative=stay.options.find(o=>o.id==='alternative');
      if(alternative?.name.includes('Schlossberghof')&&alternative.booking!=='booked'){
        alternative.booking='unavailable';
        const note='Am 23.09.2026 laut Nutzer nicht mehr verfügbar. Holunderhof ist gebucht.';
        if(!alternative.note.includes(note))alternative.note=[alternative.note,note].filter(Boolean).join('\n\n');
      }
    }
    const active=activeOption(stay);stay.activeOptionId=active?.id||null;if((stay.booking||'open')!==(active?.booking||'open')) stay.booking=active?.booking==='open'?'':active?.booking||'';
  }
  return snapshot;
}
if(require.main===module){const target=process.argv[2]||'data/trip-adria-2026.js',id=process.argv[3]||'trip_adria_2026';const t=readPublishedTrip(fs.readFileSync(target,'utf8'),id);migrate(t,JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'../data/accommodation-locations.json'),'utf8')));t.publishedVersion=new Date().toISOString();if(t.trip.dataVersion)t.trip.dataVersion=t.publishedVersion;fs.writeFileSync(target,writePublishedTrip(t,id));console.log(t.trip.id,t.publishedVersion);}
module.exports={migrate};
