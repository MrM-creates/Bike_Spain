const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {Readable}=require('node:stream');const {readPublishedTrip,writePublishedTrip}=require('../lib/published-trips');
const {bookingInfo}=require('../lib/booking-status');const {tripForCompanion}=require('../lib/companion-feed');
const fixture=()=>{const t=readPublishedTrip(fs.readFileSync('data/trip-adria-2026.js','utf8'),'trip_adria_2026');const s=t.accommodations.find(s=>s.id==='lienz');s.booking='';for(const o of s.options)o.booking='open';return t;};
async function invoke(handler,payload,{snapshot=fixture(),offline=false,race=false}={}) {
 const previousFetch=global.fetch,env={...process.env};let saved,writes=0;
 Object.assign(process.env,{ROADBOOK_PUBLISH_SECRET:'test-only',GITHUB_ROADBOOK_TOKEN:'test',GITHUB_BRANCH:'main'});
 global.fetch=async(url,request={})=>{
  if(url.startsWith('https://router.project-osrm.org/')) {
   if(offline)throw new Error('Offline');const points=new URL(url).pathname.split('/').at(-1).split(';').map(p=>p.split(',').map(Number));
   return {ok:true,json:async()=>({code:'Ok',waypoints:points.map(location=>({distance:0,location})),routes:[{distance:700,duration:75,geometry:{coordinates:points},legs:[{steps:[{mode:'driving'}]}]}]})};
  }
  assert.ok(url.startsWith('https://api.github.com/'));
  if(request.method==='PUT'){writes++;if(race)return {ok:false,status:409};const body=JSON.parse(request.body);assert.equal(body.sha,'before');saved=readPublishedTrip(Buffer.from(body.content,'base64').toString(),'trip_adria_2026');return {ok:true,json:async()=>({commit:{sha:'after'}})};}
  return {ok:true,json:async()=>({sha:'before',content:Buffer.from(writePublishedTrip(snapshot,snapshot.trip.id)).toString('base64')})};
 };
 const req=Readable.from([Buffer.from(JSON.stringify(payload))]);req.method='POST';const res={setHeader(){},end(data){this.body=JSON.parse(data);}};
 try{await handler(req,res);}finally{global.fetch=previousFetch;process.env=env;}
 return {code:res.statusCode,body:res.body,saved,writes};
}
const booking=require('../api/update-booking-status'),editor=require('../api/update-accommodation-options');
const requestFor=t=>({secret:'test-only',tripId:t.trip.id,stayId:'lienz',optionId:'alternative',booking:'booked',expectedRevision:bookingInfo('lienz',t.accommodations[1],t.publishedVersion,'alternative').bookingRevision});
test('authenticated alternative booking persists status and both recalculated routes atomically',async()=>{
 const t=fixture(),result=await invoke(booking,requestFor(t),{snapshot:t});assert.equal(result.code,200,JSON.stringify(result.body));assert.equal(result.writes,1);assert.equal(result.body.optionId,'alternative');assert.equal(result.saved.accommodationRoutes['adria-2'].state,'ready');assert.equal(result.saved.accommodationRoutes['adria-3'].state,'ready');
 const feed=tripForCompanion(result.saved);assert.equal(feed.days[1].accommodation.options[1].bookingRevision,result.body.bookingRevision);
 assert.equal((await invoke(booking,requestFor(t),{snapshot:result.saved})).code,409);
});
test('route failure is recoverable through version-checked retry without losing booking',async()=>{
 const t=fixture(),r=await invoke(booking,requestFor(t),{snapshot:t,offline:true});assert.equal(r.code,200);assert.equal(r.saved.accommodations[1].options[1].booking,'booked');assert.equal(r.saved.accommodationRoutes['adria-2'].state,'pending');
 const retry=await invoke(booking,{...requestFor(r.saved),action:'retry-route'},{snapshot:r.saved});assert.equal(retry.code,200);assert.equal(retry.saved.accommodationRoutes['adria-2'].state,'ready');
});
test('editor supports a third option and rejects bad PIN, stale plan, duplicate IDs and parallel write',async()=>{
 const t=fixture(),options=structuredClone(t.accommodations[1].options);options.push({id:'third',name:'Third test hotel',url:'https://example.com',note:'',booking:'open',coordinate:[12.75,46.83]});
 const payload={secret:'test-only',tripId:t.trip.id,stayId:'lienz',baseVersion:t.publishedVersion,options};
 const r=await invoke(editor,payload);assert.equal(r.code,200,JSON.stringify(r.body));assert.equal(r.saved.accommodations[1].options.length,3);
 assert.equal((await invoke(editor,{...payload,secret:'wrong'})).code,401);
 assert.equal((await invoke(editor,{...payload,baseVersion:'old'})).code,409);
 assert.equal((await invoke(editor,{...payload,options:[...options,options[0]]})).code,400);
 assert.equal((await invoke(editor,payload,{race:true})).code,409);
});
