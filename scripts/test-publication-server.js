// Local-only integration fixture. No outbound requests, no repository writes, no real secrets.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { readPublishedTrip } = require('../lib/published-trips');
const { tripForCompanion } = require('../lib/companion-feed');
const publish = require('../api/publish-roadbook');
const root = path.resolve(__dirname, '..');
let source = fs.readFileSync(path.join(root, 'data/trip-adria-2026.js'), 'utf8');
let deployed = source;
let nextSource;
let revision = 1;
let pending = false;
process.env.GITHUB_ROADBOOK_TOKEN = 'test-token';
process.env.ROADBOOK_PUBLISH_SECRET = 'test-only';
process.env.GITHUB_BRANCH = 'main';
global.fetch = async (url, options = {}) => {
  if (!url.startsWith('https://api.github.com/')) throw new Error('Fixture blocks outbound requests');
  const p = new URL(url).pathname;
  const body = options.body ? JSON.parse(options.body) : {};
  let result;
  if (p.includes('/contents/')) result = { sha: `blob-${revision}`, content: Buffer.from(source).toString('base64') };
  else if (p.includes('/git/ref/heads/')) result = { object: { sha: `head-${revision}` } };
  else if (p.includes('/git/commits/head-')) result = { tree: { sha: 'base-tree' } };
  else if (p.endsWith('/git/blobs')) { nextSource = body.content; result = { sha: 'next-blob' }; }
  else if (p.endsWith('/git/trees')) result = { sha: 'next-tree' };
  else if (p.endsWith('/git/commits')) result = { sha: `next-commit-${revision}` };
  else if (p.includes('/git/refs/heads/')) { source = nextSource; revision++; pending = true; result = {}; }
  else throw new Error(`Unknown fixture endpoint: ${p}`);
  return { ok: true, text: async () => JSON.stringify(result) };
};
http.createServer(async (request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1');
  response.setHeader('Cache-Control', 'no-store');
  try {
    if (url.pathname === '/api/publish-roadbook') return await publish(request, response);
    if (url.pathname === '/api/create-plan-draft') {
      const chunks = []; for await (const chunk of request) chunks.push(chunk);
      const payload = JSON.parse(Buffer.concat(chunks).toString());
      const day = payload.replaceFromDay;
      response.setHeader('Content-Type', 'application/json');
      return response.end(JSON.stringify({ ok: true, verifiedDraft: { days: payload.days.map(({ id, main, ...day }) => day), replaceFromDay: day, replaceCount: 1, verified: true, verificationVersion: 4, createdAt: new Date().toISOString(), sourceChecks: [{ day, officialTitle: 'Fixture official', officialUrl: 'https://official.example/route', motorcycleTitle: 'Fixture motorcycle', motorcycleUrl: 'https://motorcycle.example/route', routingEvidence: 'Local test only' }] } }));
    }
    if (url.pathname === '/api/companion-plan') {
      response.setHeader('Content-Type', 'application/json');
      const spain = readPublishedTrip(fs.readFileSync(path.join(root, 'data/trip-spanien-2026.js'), 'utf8'), 'trip_spanien_2026');
      const feed = { schemaVersion: 1, trips: [readPublishedTrip(deployed, 'trip_adria_2026'), spain].map(tripForCompanion) };
      response.end(JSON.stringify(feed));
      // First check sees the old deployment; next check sees the new one.
      if (pending) { deployed = source; pending = false; }
      return;
    }
    if (url.pathname === '/data/trip-adria-2026.js') { response.setHeader('Content-Type', 'text/javascript'); return response.end(deployed); }
    const relative = url.pathname === '/' ? 'reise-roadbook-2026.html' : decodeURIComponent(url.pathname).slice(1);
    const file = path.resolve(root, relative);
    if (!file.startsWith(root + path.sep) || !/^(assets\/|data\/|reise-roadbook-2026\.html$)/.test(relative)) { response.statusCode = 404; return response.end(); }
    const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.geojson': 'application/json', '.png': 'image/png' };
    response.setHeader('Content-Type', mime[path.extname(file)] || 'text/plain');
    const content = fs.readFileSync(file);
    // Existing legacy route-verification UI uses prompt(), unsupported by the in-app test browser.
    // Only this localhost fixture supplies its non-secret test PIN; production files are unchanged.
    response.end(relative === 'reise-roadbook-2026.html' ? content.toString().replace('<head>', '<head><script>window.prompt = () => "test-only";</script>') : content);
  } catch (error) { response.statusCode = 500; response.end(error.message); }
}).listen(4399, '127.0.0.1', () => console.log('Local publication fixture: http://127.0.0.1:4399 — PIN test-only; no external writes'));
