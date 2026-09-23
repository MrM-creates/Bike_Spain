const { optionsFor, activeOption } = require('../assets/accommodation-options');
const { createHash } = require('node:crypto');

const bookingValue = stay => ['asked', 'booked'].includes(stay.booking) ? stay.booking : 'open';
const firstHotel = stay => ({ name: stay.currentFirstChoice || stay.firstChoice || '', url: stay.currentFirstChoiceUrl || stay.firstChoiceUrl || '' });
const staysFor = snapshot => Object.entries(snapshot.accommodations || {}).map(([key, stay]) => ({ key, id: String(stay.id || key), stay }));
function bookingInfo(id, stay, version, optionId) {
  const option = optionId ? optionsFor(stay).find(o => o.id === optionId) : null;
  if (optionId && !option) throw Object.assign(new Error('Diese Unterkunft ist nicht mehr vorhanden. Bitte aktualisieren.'), {status:409});
  const first = option || firstHotel(stay);
  const booking = option ? option.booking : bookingValue(stay);
  const bookingContext = createHash('sha256').update(JSON.stringify([id, stay.startDate, stay.endDate, first.name, first.url, ...(optionId ? [optionId, option.coordinate || null, option.address || ''] : [])])).digest('hex');
  // Includes dates and the exact intended hotel, as well as the current status.
  // An old screen cannot mark a replacement hotel or a different stay as booked.
  const revision = createHash('sha256').update(JSON.stringify([
    id, stay.startDate, stay.endDate, first.name, first.url, booking, version, ...(optionId ? [optionId, option.coordinate || null, option.address || ''] : [])
  ])).digest('hex');
  return { id, ...(optionId ? {optionId} : {}), booking, bookingRevision: revision, bookingContext,
    startDate: stay.startDate, endDate: stay.endDate,
    bookingEditable: Boolean((optionId || !stay.options) && first.name && stay.startDate && stay.endDate && !stay.inactive &&
      !/fähre|kabine|cabin/i.test(`${stay.title || ''} ${first.name}`)) };
}
function applyBookingStatus(snapshot, payload, version) {
  const matches = staysFor(snapshot).filter(item => item.id === payload.stayId);
  if (matches.length !== 1) throw Object.assign(new Error('Diese Unterkunft ist nicht mehr eindeutig im Reiseplan vorhanden. Bitte den Reiseplan aktualisieren.'), { status: 409 });
  const { id, stay } = matches[0];
  const info = bookingInfo(id, stay, snapshot.publishedVersion, payload.optionId);
  if (!info.bookingEditable || info.bookingRevision !== payload.expectedRevision) {
    throw Object.assign(new Error('Unterkunft oder Buchungsstatus wurden inzwischen geändert. Bitte den Reiseplan aktualisieren und die Unterkunft erneut prüfen.'), { status: 409 });
  }
  if (info.booking === payload.booking) return { ...info, changed: false };
  if (payload.optionId) {
    const options = optionsFor(stay).map(o => ({...o}));
    if (payload.booking === 'booked' && options.some(o => o.id !== payload.optionId && o.booking === 'booked')) throw Object.assign(new Error('Eine andere Unterkunft ist bereits gebucht. Bitte deren Buchung klären und Status zuerst ändern. Es wird nichts automatisch storniert.'), {status:409});
    options.find(o => o.id === payload.optionId).booking = payload.booking;
    stay.options = options;
    const active = activeOption(stay);
    stay.activeOptionId = active?.id || null;
    stay.booking = active?.booking === 'open' ? '' : active?.booking || '';
  } else if (payload.booking === 'open') delete stay.booking;
  else stay.booking = payload.booking;
  snapshot.publishedVersion = version;
  if (snapshot.trip.id === 'trip_adria_2026') snapshot.trip.dataVersion = version;
  return { ...bookingInfo(id, stay, snapshot.publishedVersion, payload.optionId), changed: true };
}
module.exports = { bookingInfo, bookingValue, staysFor, applyBookingStatus };
