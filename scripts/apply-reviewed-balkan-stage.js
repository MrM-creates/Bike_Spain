// Applies exactly one accepted Balkan review to the canonical trip source.
const fs = require('node:fs');
const path = require('node:path');
const {readPublishedTrip, writePublishedTrip} = require('../lib/published-trips');
const root = path.resolve(__dirname, '..');
const number = Number(process.argv[2]);
if (!Number.isInteger(number)) throw new Error('One day required');
const integration = JSON.parse(fs.readFileSync(path.join(root,'route-audit/2026-09-04/balkan-integration.json')));
const review = integration.stages.find(s=>s.day===number);
if (!review || !review.status.startsWith('geometry-accepted')) throw new Error('Accepted review required');
const source = path.join(root,'data/trip-adria-2026.js');
const trip = readPublishedTrip(fs.readFileSync(source,'utf8'),'trip_adria_2026');
const warnings = {
  10:'Villa Pehar: Die öffentliche Gebäudeadresse Put Kulice 5 ist plausibel; Wohnung und Einfahrt nach der Buchung mit dem Gastgeber bestätigen.',
  13:'OSCAR Suite: Die öffentliche Gebäudeadresse ist geprüft; Garageneinfahrt nach der Buchung bestätigen.',
  16:'Das Ziel ist der öffentliche Strassenanker in Sveti Stasije, nicht die private Haustür. Die genaue Wohnungslage wird von Airbnb erst nach der Buchung mitgeteilt.',
  20:'Der Start verwendet denselben öffentlichen Strassenanker in Sveti Stasije. Das Ziel führt anhand veröffentlichter Koordinaten zu Apartman I&M in Luka.',
  21:'Die Navigation endet an der öffentlichen Hafenstrasse Gat Svetog Duje. Fahrzeugspur und Liegeplatz richten sich nach Ticket und Beschilderung vor Ort.',
  22:'Start ist die öffentliche Strasse bei Porta Pia nach der Ausschiffung. Die tatsächliche Hafenausfahrt richtet sich nach der Ankunftsspur.',
  24:'Die Stopps führen zu den öffentlichen Parkplätzen P3 und Tiberio, nicht in die Altstadt oder ZTL.',
  25:'Für Giulio & Fufo wird Via Scalette 2 verwendet; die Zufahrt vor der Buchung mit dem Gastgeber bestätigen.',
  27:'Ca Nildes liegt an einer privaten Hofzufahrt. Tor- und Parkhinweise nach der Buchung beim Gastgeber erfragen.',
  29:'Die letzten Meter sind eine private Gästezufahrt. Tor- und Parkhinweise nach der Buchung beim Gastgeber erfragen.',
  30:'Ziel bleibt der öffentliche Ortsanker Berikon; eine private Wohnadresse ist nicht in der Reise gespeichert.'
};
const update = day => {
  if (day.day !== number) return day;
  const c=review.candidate;
  const params=new URLSearchParams({api:'1',origin:c.origin,destination:c.destination,travelmode:'driving'});
  if(c.waypoints.length) params.set('waypoints',c.waypoints.join('|'));
  const ferry = number === 21;
  const existing = String(day.note||'').split('\n\n').filter(p=>!p.startsWith('Navigation geprüft:')&&!p.startsWith('Verbleibende Einschränkung:')).join('\n\n');
  return {...day, origin:c.origin, destination:ferry ? day.destination : c.destination, waypoints:ferry ? [...c.waypoints,c.destination] : c.waypoints,
    roads:(c.roads||[]).join(' · '), points:c.waypoints.join(' · '), main:`https://www.google.com/maps/dir/?${params}`,
    note:[existing, 'Google-Maps-Link und Kartenlinie wurden am 04.09.2026 abgeglichen. Die native Google-Maps-App wurde noch nicht auf einem Gerät geprüft.', warnings[number]].filter(Boolean).join('\n\n')};
};
trip.days=trip.days.map(update); trip.originalDays=trip.originalDays.map(update);
fs.writeFileSync(source,writePublishedTrip(trip,'trip_adria_2026'));
console.log(`Balkan day ${number}: accepted route fields applied to canonical source.`);
