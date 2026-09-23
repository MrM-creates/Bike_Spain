(function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
window.openAccommodationEditor=async function(snapshot,stayId){
  const stays=Array.isArray(snapshot.accommodations)?snapshot.accommodations:Object.entries(snapshot.accommodations).map(([id,s])=>({id,...s}));
  const stay=stays.find(s=>s.id===stayId);if(!stay)return;
  const options=window.RoadbookAccommodations.optionsFor(stay).map(o=>({...o}));
  const dialog=document.createElement('dialog');dialog.className='accommodation-editor';dialog.setAttribute('aria-label','Unterkünfte und Status');
  dialog.innerHTML=`<form><h2>Unterkünfte & Status</h2><p>Jedes Hotel hat seinen eigenen Status. Eine gebuchte Unterkunft wird automatisch zum Ziel. Buchungen und Stornierungen beim Anbieter erledigst du selbst.</p><div data-options></div><button type="button" data-add>Weitere Unterkunft hinzufügen</button><p>Für den automatischen Hotelwechsel bitte die genaue Lage hinterlegen. Koordinaten stehen beispielsweise im Kartenlink des Hotels.</p><label>Admin-PIN<input name="pin" type="password" autocomplete="current-password" required></label><p role="status" data-feedback></p><div class="accommodation-editor-actions"><button type="button" data-close>Schliessen</button><button type="submit">Speichern & veröffentlichen</button></div></form>`;
  document.body.append(dialog);
  const form=dialog.querySelector('form'), list=dialog.querySelector('[data-options]'), feedback=dialog.querySelector('[data-feedback]');
  let busy=false;
  const render=()=>{list.innerHTML=options.map((o,i)=>`<fieldset data-option="${i}"><legend>${i===0?'Erste Wahl':`Alternative ${i}`}</legend><label>Name<input data-field="name" value="${esc(o.name)}" maxlength="300" required></label><label>Website<input data-field="url" type="url" value="${esc(o.url)}"></label><label>Status<select data-field="booking">${window.RoadbookAccommodations.statuses.map(s=>`<option value="${s}" ${s===o.booking?'selected':''}>${window.RoadbookAccommodations.label(s)}</option>`).join('')}</select></label><details><summary>Lage & Hinweise</summary><label>Adresse<input data-field="address" value="${esc(o.address||'')}"></label><div class="accommodation-location"><label>Breitengrad<input data-field="latitude" type="number" step="any" min="-90" max="90" value="${o.coordinate?.[1]??''}"></label><label>Längengrad<input data-field="longitude" type="number" step="any" min="-180" max="180" value="${o.coordinate?.[0]??''}"></label></div><label>Hinweise<textarea data-field="note">${esc(o.note||'')}</textarea></label></details></fieldset>`).join('');};
  const collect=()=>Array.from(list.children).map((el,i)=>{const value=k=>el.querySelector(`[data-field="${k}"]`).value.trim();const lat=value('latitude'),lon=value('longitude');if(Boolean(lat)!==Boolean(lon))throw new Error('Bitte beide Koordinaten ergänzen.');return {id:options[i].id,name:value('name'),url:value('url'),booking:value('booking'),address:value('address'),note:value('note'),...(lat&&lon?{coordinate:[Number(lon),Number(lat)]}:{})};});
  dialog.querySelector('[data-add]').onclick=()=>{try{options.splice(0,options.length,...collect());options.push({id:`hotel-${crypto.randomUUID()}`,name:'',url:'',booking:'open',note:''});render();list.lastElementChild.querySelector('input').focus();}catch(e){feedback.textContent=e.message;}};
  dialog.querySelector('[data-close]').onclick=()=>{if(!busy)dialog.close();};
  dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault();});dialog.addEventListener('close',()=>dialog.remove());
  form.onsubmit=async e=>{e.preventDefault();if(busy)return;let values;try{values=window.RoadbookAccommodations.validateOptions(collect());}catch(error){feedback.textContent=error.message;return;}
    busy=true;form.querySelectorAll('button').forEach(b=>b.disabled=true);feedback.textContent='Unterkünfte werden gespeichert und Routen geprüft …';
    try{const r=await fetch('/api/update-accommodation-options',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:form.elements.pin.value,tripId:snapshot.trip.id,stayId,baseVersion:snapshot.publishedVersion,options:values})});const result=await r.json();if(!r.ok||!result.ok)throw new Error(result.error||'Speichern nicht bestätigt.');
      form.elements.pin.value='';feedback.textContent='Gespeichert. Der gemeinsame Reiseplan wird bereitgestellt …';
      for(let i=0;i<20;i++){await new Promise(resolve=>setTimeout(resolve,3000));const feed=await fetch('/api/companion-plan',{cache:'no-store'}).then(r=>r.json());if(feed.trips?.some(t=>t.id===snapshot.trip.id&&t.version>=result.version)){location.reload();return;}}
      feedback.textContent='Gespeichert. Die Veröffentlichung dauert noch. Bitte den Online-Stand später neu laden.';
    }catch(error){feedback.textContent=error.message;}finally{busy=false;form.querySelectorAll('button').forEach(b=>b.disabled=false);}
  };
  render();dialog.showModal();
};
})();
