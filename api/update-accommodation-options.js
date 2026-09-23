const {createHash,timingSafeEqual}=require('node:crypto');
const {tripTarget,readPublishedTrip,writePublishedTrip}=require('../lib/published-trips');
const {staysFor,bookingInfo}=require('../lib/booking-status');
const {validateOptions,activeOption}=require('../assets/accommodation-options');
const {updateAccommodationRoutes}=require('../lib/accommodation-routes');
const fail=(status,message)=>{throw Object.assign(new Error(message),{status});};
async function github(path,options={}) {
  const r=await fetch(`https://api.github.com${path}`,{...options,signal:AbortSignal.timeout(20000),headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${process.env.GITHUB_ROADBOOK_TOKEN}`,'Content-Type':'application/json','User-Agent':'roadbook-accommodations'}});
  if(!r.ok) fail([409,422].includes(r.status)?409:502, 'Speichern nicht bestätigt. Bitte den aktuellen Online-Stand laden und erneut prüfen.');
  return r.json();
}
module.exports=async(req,res)=>{
  res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
  try {
    if(req.method!=='POST'){res.setHeader('Allow','POST');fail(405,'Nur POST ist erlaubt.');}
    if(!process.env.ROADBOOK_PUBLISH_SECRET||!process.env.GITHUB_ROADBOOK_TOKEN) fail(503,'Veröffentlichen ist noch nicht eingerichtet.');
    const chunks=[];let size=0;for await(const chunk of req){size+=Buffer.byteLength(chunk);if(size>100000)fail(413,'Zu viele Unterkunftsdaten.');chunks.push(chunk);}
    const p=JSON.parse(Buffer.concat(chunks.map(c=>Buffer.from(c))).toString());
    const digest=v=>createHash('sha256').update(v).digest();
    if(typeof p.secret!=='string'||!timingSafeEqual(digest(p.secret.trim()),digest(process.env.ROADBOOK_PUBLISH_SECRET.trim())))fail(401,'Die PIN ist nicht gültig.');
    if(Object.keys(p).some(k=>!['secret','tripId','stayId','baseVersion','options'].includes(k)))fail(400,'Unbekannte Unterkunftsangaben.');
    let options;try{options=validateOptions(p.options);}catch(e){fail(400,e.message);}
    if(options.filter(o=>o.booking==='booked').length>1)fail(409,'Bitte zuerst die bestehende Buchung klären. Es wird nichts automatisch storniert.');
    const target=tripTarget(p.tripId),repo=process.env.GITHUB_REPO||'MrM-creates/Bike_Spain',branch=process.env.GITHUB_BRANCH||'main';
    const path=`/repos/${repo}/contents/${encodeURIComponent(target.path)}`;
    const file=await github(`${path}?ref=${encodeURIComponent(branch)}`);
    const snapshot=readPublishedTrip(Buffer.from(file.content,'base64').toString(),p.tripId);
    if(!p.baseVersion||p.baseVersion!==snapshot.publishedVersion)fail(409,'Der Reiseplan wurde inzwischen geändert. Bitte den Online-Stand laden; deine Eingaben bleiben hier erhalten.');
    const entry=staysFor(snapshot).find(s=>s.id===p.stayId);
    if(!entry||!bookingInfo(entry.id,entry.stay,snapshot.publishedVersion,require('../assets/accommodation-options').optionsFor(entry.stay)[0]?.id).bookingEditable)fail(409,'Diese Unterkunft kann hier nicht geändert werden.');
    entry.stay.options=options;
    const active=activeOption(entry.stay);entry.stay.activeOptionId=active?.id||null;entry.stay.booking=active?.booking==='open'?'':active?.booking||'';
    await updateAccommodationRoutes(snapshot,p.stayId);
    const version=new Date(Math.max(Date.now(),Date.parse(snapshot.publishedVersion)+1)).toISOString();
    snapshot.publishedVersion=version;if(p.tripId==='trip_adria_2026')snapshot.trip.dataVersion=version;
    await github(path,{method:'PUT',body:JSON.stringify({message:`Update accommodation options: ${p.tripId} / ${p.stayId}`,content:Buffer.from(writePublishedTrip(snapshot,p.tripId)).toString('base64'),sha:file.sha,branch})});
    res.statusCode=200;res.end(JSON.stringify({ok:true,version,delivery:'deployment-pending'}));
  }catch(e){res.statusCode=e.status||(e instanceof SyntaxError?400:502);res.end(JSON.stringify({error:e.status?e.message:'Speichern konnte nicht bestätigt werden. Bitte den Online-Stand prüfen.'}));}
};
