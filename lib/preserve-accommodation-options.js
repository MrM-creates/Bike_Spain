const {staysFor}=require('./booking-status');
const {validateOptions, optionsFor}=require('../assets/accommodation-options');
// General planners cannot silently erase option-specific statuses or change the identity
// of a booked hotel. Hotel edits go through the dedicated version-checked editor.
function preserveAccommodationOptions(previous,next) {
  const old=staysFor(previous);
  for(const {id,stay} of staysFor(next)) {
    const before=old.find(s=>s.id===id)?.stay;
    if(stay.options) stay.options=validateOptions(stay.options);
    if(before?.accommodationNavigation) stay.accommodationNavigation=before.accommodationNavigation;
    if(!before?.options) continue;
    if(stay.options && JSON.stringify(stay.options)!==JSON.stringify(validateOptions(before.options))) throw Object.assign(new Error('Bitte Unterkunftsoptionen zuerst unter „Unterkünfte & Status bearbeiten“ speichern und danach den Plan neu laden.'),{status:409});
    for(const key of ['currentFirstChoice','firstChoice','currentAlternative','alternative']) if(stay[key] && before[key] && stay[key]!==before[key]) throw Object.assign(new Error('Die Unterkunft hat eigene Buchungsstatus. Bitte Hotelwechsel in „Unterkünfte & Status bearbeiten“ vornehmen.'),{status:409});
    stay.options=before.options;stay.activeOptionId=before.activeOptionId;stay.booking=before.booking;
  }
  for(const {id,stay} of old) if(optionsFor(stay).some(o=>o.booking==='booked')&&!staysFor(next).some(s=>s.id===id)) throw Object.assign(new Error('Ein gebuchter Aufenthalt würde entfernt. Bitte die Buchung zuerst klären.'),{status:409});
  if(previous.accommodationRoutes) {
    next.accommodationRoutes={};
    const days=next.publishedDays||next.days, oldDays=previous.publishedDays||previous.days;
    for(const [id,record] of Object.entries(previous.accommodationRoutes)) {
      const day=days.find(d=>d.id===id), prior=oldDays.find(d=>d.id===id);
      if(day&&prior&&['origin','destination','main','waypoints'].every(k=>JSON.stringify(day[k])===JSON.stringify(prior[k]))) next.accommodationRoutes[id]=record;
    }
  }
}
module.exports={preserveAccommodationOptions};
