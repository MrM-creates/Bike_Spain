const { createHash } = require('node:crypto');

const bookingValue = stay => ['asked', 'booked'].includes(stay.booking) ? stay.booking : 'open';
const firstHotel = stay => ({ name: stay.currentFirstChoice || stay.firstChoice || '', url: stay.currentFirstChoiceUrl || stay.firstChoiceUrl || '' });
const staysFor = snapshot => Object.entries(snapshot.accommodations || {}).map(([key, stay]) => ({ key, id: String(stay.id || key), stay }));
function bookingInfo(id, stay, version) {
  const first = firstHotel(stay);
  const bookingContext = createHash('sha256').update(JSON.stringify([id, stay.startDate, stay.endDate, first.name, first.url])).digest('hex');
  // Includes dates and the exact intended hotel, as well as the current status.
  // An old screen cannot mark a replacement hotel or a different stay as booked.
  const revision = createHash('sha256').update(JSON.stringify([
    id, stay.startDate, stay.endDate, first.name, first.url, bookingValue(stay), version
  ])).digest('hex');
  return { id, booking: bookingValue(stay), bookingRevision: revision, bookingContext,
    startDate: stay.startDate, endDate: stay.endDate,
    bookingEditable: Boolean(first.name && stay.startDate && stay.endDate && !stay.inactive &&
      !/fähre|kabine|cabin/i.test(`${stay.title || ''} ${first.name}`)) };
}
function applyBookingStatus(snapshot, payload, version) {
  const matches = staysFor(snapshot).filter(item => item.id === payload.stayId);
  if (matches.length !== 1) throw Object.assign(new Error('Diese Unterkunft ist nicht mehr eindeutig im Reiseplan vorhanden. Bitte den Reiseplan aktualisieren.'), { status: 409 });
  const { id, stay } = matches[0];
  const info = bookingInfo(id, stay, snapshot.publishedVersion);
  if (!info.bookingEditable || info.bookingRevision !== payload.expectedRevision) {
    throw Object.assign(new Error('Unterkunft oder Buchungsstatus wurden inzwischen geändert. Bitte den Reiseplan aktualisieren und die Unterkunft erneut prüfen.'), { status: 409 });
  }
  if (info.booking === payload.booking) return { ...info, changed: false };
  if (payload.booking === 'open') delete stay.booking;
  else stay.booking = payload.booking;
  snapshot.publishedVersion = version;
  if (snapshot.trip.id === 'trip_adria_2026') snapshot.trip.dataVersion = version;
  return { ...bookingInfo(id, stay, snapshot.publishedVersion), changed: true };
}
module.exports = { bookingInfo, bookingValue, staysFor, applyBookingStatus };
