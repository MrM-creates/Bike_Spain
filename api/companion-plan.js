const { companionFeed } = require('../lib/companion-feed');
module.exports = (request, response) => {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-cache');
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Reiseplan kann hier nur gelesen werden.' });
  }
  try { return response.status(200).json(companionFeed()); }
  catch (_) { return response.status(500).json({ error: 'Reiseplan konnte nicht geladen werden.' }); }
};
