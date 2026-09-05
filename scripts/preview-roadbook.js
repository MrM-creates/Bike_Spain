// Read-only localhost preview. Never serves personal files or allows publication.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
http.createServer((req, res) => {
  try {
    if (req.method !== 'GET') {res.writeHead(405); return res.end();}
    const relative = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).slice(1) || 'reise-roadbook-2026.html';
    if (relative === 'api/companion-plan') {
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(require('../lib/companion-feed').companionFeed()));
    }
    if (!/^(assets\/|data\/|reise-roadbook-2026\.html$)/.test(relative)) {res.writeHead(404);return res.end();}
    const file = path.resolve(root, relative);
    if (!file.startsWith(root + path.sep)) {res.writeHead(404);return res.end();}
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', ({'.html':'text/html','.js':'text/javascript','.json':'application/json','.geojson':'application/json','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file));
  } catch {res.writeHead(404);res.end();}
}).listen(4175, '127.0.0.1', () => console.log('Read-only preview: http://127.0.0.1:4175/reise-roadbook-2026.html?trip=trip_adria_2026'));
