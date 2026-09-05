// Converts the already documented, browser-reviewed Balkan candidates into explicit
// integration records. This does not calculate, integrate or deploy anything.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const auditDir = path.join(root, 'route-audit/2026-09-04');
const reviews = JSON.parse(fs.readFileSync(path.join(auditDir, 'continued-reviews.json')));
const document = JSON.parse(fs.readFileSync(path.join(auditDir, 'balkan-integration.json')));
const evidence = {
  8: 'Google and OSRM agree on the continuous D8 corridor; no Biograd or Vodice centre loops. Public property endpoint Podsolarsko 136.',
  10: 'Google and OSRM agree on D8/Trogir bypass/Omis bypass to Makarska. Old Primosten, Trogir and Dugi Rat detours removed; public building endpoint Put Kulice 5, booked unit access pending.',
  13: 'Google and OSRM agree on D8, Peljesac bridge, D416/D414, legal Ston parking and Dubrovnik approach. Wrong-carriageway bridge loop and wrong Mokošica namesake removed; public building address used.',
  16: 'Google and OSRM agree on D8/border/M1 around the bay without Kamenari ferry, hills or Perast waterfront. Destination is explicitly an approximate public-road anchor for the private Airbnb.',
  20: 'Google and OSRM agree on the M1 bay road, Karasovici, Dubrovnik bypass and D414 to Luka. Destination coordinates resolve Apartman I&M; exact origin apartment door remains private.',
  21: 'Google and OSRM agree on the land approach D414/D8, Peljesac bridge, D425/A1/D1/D8 and Gat Svetog Duje. Wrong-carriageway bridge and Dugopolje toll-loop points removed. Navigation ends at the public port road; berth remains ticket-dependent.',
  22: 'Google and OSRM agree on SS16/A14/Fano/SS73bis and east-west Via Flaminia through Furlo, then SP43 to Urbino. Start is Porta Pia public road after disembarkation, not an invented berth.',
  24: 'Google and OSRM agree on the reviewed San Marino/Rimini/Ravenna corridor. Public parking P3 and Tiberio stops avoid ZTL centres; entrance labels remain parking-level rather than bay-level precision.',
  25: 'Google and OSRM agree on SS309 to Comacchio, Ferrara approach, A13 and Colli Euganei. Via Scalette 2 is retained from matching lodging sources; host confirmation remains required.',
  27: 'Google and OSRM agree on the country-road/A4 corridor via the public Valeggio parking to Ca Nildes. No A31 detour; gated courtyard instructions remain host-provided.',
  29: 'Google and OSRM agree on SP12/SS469/A4/A9 to Via Lazzago 8. Bergamo centre waypoint removed; final private guest lane is supported by the lodging listing but gate instructions remain required.',
  30: 'Google and OSRM agree on A9/A2, continuous Gotthard road tunnel, Axenstrasse/A4 and the lower Berikon approach. Tunnel POI/pass and Werkhof exit detours removed.'
};
for (const [key, geometryEvidence] of Object.entries(evidence)) {
  const day = Number(key), candidate = reviews.find(r => r.day === day);
  if (!candidate || !candidate.status.includes('checked')) throw new Error(`Day ${day}: browser review missing`);
  if (!fs.existsSync(path.join(auditDir, `candidates/adria-${day}.geojson`))) throw new Error(`Day ${day}: geometry candidate missing`);
  if (document.stages.some(s => s.day === day)) continue;
  document.stages.push({day, status: 'geometry-accepted-with-documented-access-warning', geometryEvidence,
    candidate, googleBrowser: {reviewedAt:'2026-09-04',distanceKm:candidate.distanceKm,durationMinutes:candidate.durationMinutes,evidence:candidate.notes},
    open: [candidate.notes, 'Native Google Maps handoff not tested']});
}
document.stages.sort((a,b)=>a.day-b.day);
fs.writeFileSync(path.join(auditDir, 'balkan-integration.json'), JSON.stringify(document, null, 2) + '\n');
console.log('Existing Balkan browser reviews recorded for sequential integration; no routes changed.');
