const { companionFeed } = require('../lib/companion-feed');
const { createHash } = require('node:crypto');
module.exports = (request, response) => {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-cache');
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Reiseplan kann hier nur gelesen werden.' });
  }
  const tripId = request.query?.tripId;
  if (tripId !== undefined && !['trip_adria_2026', 'trip_spanien_2026'].includes(tripId)) {
    return response.status(400).json({ error: 'Unbekannte Reise.' });
  }
  try {
    const feed = companionFeed(tripId);
    const etag = '"' + createHash('sha256').update(JSON.stringify(feed)).digest('hex') + '"';
    response.setHeader('ETag', etag);
    const tags = String(request.headers?.['if-none-match'] || '').split(',').map(tag => tag.trim().replace(/^W\//, ''));
    if (tags.includes(etag) || tags.includes('*')) return response.status(304).end();
    return response.status(200).json(feed);
  }
  catch (_) { return response.status(500).json({ error: 'Reiseplan konnte nicht geladen werden.' }); }
};
