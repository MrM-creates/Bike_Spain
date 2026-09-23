(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RoadbookAccommodations = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const statuses = ['open', 'asked', 'booked', 'unavailable'];
  const label = value => ({open:'Offen', asked:'Angefragt', booked:'Gebucht', unavailable:'Nicht verfügbar'})[value] || 'Offen';
  const coordinateValid = p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite) && Math.abs(p[0]) <= 180 && Math.abs(p[1]) <= 90;
  function optionsFor(stay) {
    if (Array.isArray(stay.options)) return stay.options;
    return [
      {id:'first', name:stay.currentFirstChoice || stay.firstChoice, url:stay.currentFirstChoiceUrl || stay.firstChoiceUrl || '', note:stay.currentFirstChoiceNotes || '', booking:statuses.includes(stay.booking) ? stay.booking : 'open'},
      {id:'alternative', name:stay.currentAlternative || stay.alternative, url:stay.currentAlternativeUrl || stay.alternativeUrl || '', note:stay.currentAlternativeNotes || '', booking:'open'}
    ].filter(o => o.name);
  }
  const activeOption = stay => optionsFor(stay).find(o => o.booking === 'booked') || optionsFor(stay).find(o => o.booking !== 'unavailable') || null;
  function validateOptions(options) {
    if (!Array.isArray(options) || options.length > 20) throw new Error('Bitte höchstens 20 Unterkünfte pro Aufenthalt hinterlegen.');
    const ids = new Set();
    return options.map(o => {
      if (!o || typeof o.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(o.id) || ids.has(o.id) || typeof o.name !== 'string' || !o.name.trim() || o.name.length > 300 || !statuses.includes(o.booking)) throw new Error('Unterkünfte brauchen eindeutige IDs, Namen und einen gültigen Status.');
      ids.add(o.id);
      if (o.url) { const u = new URL(o.url); if(u.protocol !== 'https:' || u.username || u.password) throw new Error('Bitte einen HTTPS-Link zur Unterkunft verwenden.'); }
      if (o.coordinate != null && !coordinateValid(o.coordinate)) throw new Error('Die Lage der Unterkunft ist ungültig.');
      return {id:o.id, name:o.name.trim(), url:String(o.url || '').slice(0,2000), note:String(o.note || '').slice(0,4000), booking:o.booking,
        ...(o.coordinate ? {coordinate:o.coordinate.slice()} : {}), ...(o.address ? {address:String(o.address).slice(0,500)} : {})};
    });
  }
  return {statuses, label, coordinateValid, optionsFor, activeOption, validateOptions};
});
