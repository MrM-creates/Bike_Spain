const crypto = require('node:crypto');

const ORIGIN = 'https://motorrad-roadbook-spanien-2026.vercel.app';
const SCOPES = ['roadbook:read', 'roadbook:write'];
const digest = value => crypto.createHash('sha256').update(String(value)).digest('hex');
const equal = (a, b) => crypto.timingSafeEqual(Buffer.from(digest(a)), Buffer.from(digest(b)));
const random = () => crypto.randomBytes(24).toString('base64url');

// Auth codes, tokens and prepared changes contain private state. Authenticated
// encryption prevents callers from changing it and avoids exposing it in URLs.
function createSealer(secret, origin = ORIGIN, now = () => Date.now()) {
  if (!secret || Buffer.byteLength(secret) < 32) throw new Error('Roadbook-Anmeldung ist noch nicht eingerichtet.');
  const key = crypto.createHash('sha256').update(secret).digest();
  return {
    seal(kind, data, seconds) {
      const nonce = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);
      cipher.setAAD(Buffer.from(`${origin}:${kind}:v1`));
      const plain = JSON.stringify({ data, exp: Math.floor(now() / 1000) + seconds, jti: random() });
      const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
      return `v1.${Buffer.concat([nonce, cipher.getAuthTag(), encrypted]).toString('base64url')}`;
    },
    open(kind, value) {
      try {
        if (typeof value !== 'string' || !/^v1\.[A-Za-z0-9_-]+$/.test(value) || value.length > 1500000) throw new Error();
        const raw = Buffer.from(value.slice(3), 'base64url');
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, raw.subarray(0, 12));
        decipher.setAAD(Buffer.from(`${origin}:${kind}:v1`));
        decipher.setAuthTag(raw.subarray(12, 28));
        const parsed = JSON.parse(Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8'));
        if (!Number.isInteger(parsed.exp) || parsed.exp <= Math.floor(now() / 1000) || typeof parsed.jti !== 'string') throw new Error();
        return parsed;
      } catch (_) { throw new Error('Die Freigabe ist ungültig oder abgelaufen. Bitte erneut verbinden beziehungsweise den Entwurf neu vorbereiten.'); }
    }
  };
}

function createGithubStore({ token, repo = 'MrM-creates/Bike_Spain', branch = 'main', fetchImpl = fetch }) {
  const request = async (path, options = {}) => {
    const response = await fetchImpl(`https://api.github.com/repos/${repo}${path}`, {
      ...options, signal: AbortSignal.timeout(20000),
      headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'roadbook-mcp', 'X-GitHub-Api-Version': '2022-11-28' }
    });
    if (!response.ok) throw Object.assign(new Error('Der gemeinsame Roadbook-Speicher ist gerade nicht erreichbar.'), { status: response.status });
    return response.status === 204 ? null : response.json();
  };
  const markerPath = key => `roadbook-mcp/${digest(key)}`;
  const exists = async key => {
    try { await request(`/git/ref/${markerPath(key)}`); return true; }
    catch (error) { if (error.status === 404) return false; throw error; }
  };
  let head;
  return {
    request,
    async readTrip(tripId) {
      const { tripTarget, readPublishedTrip } = require('./published-trips');
      const target = tripTarget(tripId);
      const file = await request(`/contents/${encodeURIComponent(target.path)}?ref=${encodeURIComponent(branch)}`);
      return readPublishedTrip(Buffer.from(file.content, 'base64').toString('utf8'), tripId);
    },
    exists,
    // Creation is atomic across serverless instances. Only hashes of random IDs
    // are stored; these refs contain no tokens, PINs or travel data. They point
    // to an existing commit and neither change main nor trigger a deployment.
    async claim(key) {
      head ||= (await request(`/git/ref/heads/${encodeURIComponent(branch)}`)).object.sha;
      try {
        await request('/git/refs', { method: 'POST', body: JSON.stringify({ ref: `refs/${markerPath(key)}`, sha: head }) });
        return true;
      } catch (error) {
        if (error.status === 422 && await exists(key)) return false;
        throw error;
      }
    },
    async allowLogin(now = Date.now()) {
      const window = Math.floor(now / 300000);
      for (let slot = 0; slot < 6; slot++) if (await this.claim(`login:${window}:${slot}`)) return true;
      return false;
    }
  };
}
module.exports = { ORIGIN, SCOPES, digest, equal, random, createSealer, createGithubStore };
