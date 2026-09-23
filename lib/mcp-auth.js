const { InvalidClientMetadataError, InvalidGrantError, InvalidTokenError, InvalidScopeError, InvalidTargetError } = require('@modelcontextprotocol/sdk/server/auth/errors.js');
const { SCOPES, equal, random } = require('./mcp-security');

const callbackAllowed = value => {
  try {
    const url = new URL(value);
    if (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname) && ['/callback', '/oauth/callback'].includes(url.pathname) && !url.username && !url.password && !url.search && !url.hash) return true;
    return url.origin === 'https://chatgpt.com' && !url.search && !url.hash &&
      (url.pathname === '/connector_platform_oauth_redirect' || /^\/connector\/oauth\/[A-Za-z0-9_-]+$/.test(url.pathname));
  } catch (_) { return false; }
};
const html = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function consentPage(ticket, error = '', writable = true) {
  return `<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Roadbook verbinden</title>
  <style>:root{--bg:#f5f5f7;--text:#1d1d1f;--surface:#fff;--accent:#001f3f;--radius:12px;--space:1.5rem}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:17px/1.55 system-ui,sans-serif}main{max-width:520px;margin:8vh auto;padding:var(--space)}h1{font-size:2rem;line-height:1.2}form{background:var(--surface);padding:var(--space);border-radius:var(--radius)}label{display:block;font-weight:600}input,button{font:inherit;width:100%;padding:14px;border:1px solid #767676;border-radius:8px;margin-top:8px}button{background:var(--accent);color:white;margin-top:24px;cursor:pointer}input:focus-visible,button:focus-visible,a:focus-visible{outline:3px solid #007aff;outline-offset:3px}.error{border-left:3px solid #ac2525;padding-left:12px}small{display:block;margin-top:20px}a{color:var(--accent)}@media(max-width:600px){main{margin:3vh auto}}</style>
  <main><p>ROADBOOK · CHATGPT</p><h1>Deine Reise im Chat planen</h1><p>Du erlaubst ChatGPT oder Codex, eure Reisepläne und Buchungsstände zu lesen${writable ? ' und von dir beauftragte Änderungen zu veröffentlichen. Veröffentlichte Änderungen erscheinen in beiden Apps' : ''}.</p>
  <p>Diese Freigabe gilt für Spanien und Adria für bis zu 30 Tage. Die Verbindung läuft auf dem Server und funktioniert auch unterwegs.</p>
  <form method="post" action="/roadbook-connect"><input type="hidden" name="ticket" value="${html(ticket)}">${error ? `<p class="error" role="alert">${html(error)}</p>` : ''}<label for="pin">Admin-PIN</label><input id="pin" name="pin" type="password" required autocomplete="current-password" maxlength="200"><button type="submit">Roadbook mit ChatGPT verbinden</button></form>
  <small>Die PIN bleibt bei Roadbook und wird nicht an ChatGPT übermittelt. Du kannst die Verbindung in ChatGPT wieder entfernen. <a href="/">Zurück zum Roadbook</a></small></main></html>`;
}

function createAuthProvider({ sealer, store, origin, pin }) {
  const resource = `${origin}/mcp`;
  const target = value => { if (String(value || '') !== resource) throw new InvalidTargetError('Nur die Roadbook-Verbindung kann freigegeben werden.'); };
  const scopesFor = requested => {
    const scopes = requested?.length ? [...new Set(requested)] : [...SCOPES];
    if (scopes.some(s => !SCOPES.includes(s)) || !scopes.includes('roadbook:read')) throw new InvalidScopeError('Ungültige Roadbook-Berechtigung.');
    return scopes;
  };
  const grant = (kind, value, client) => {
    let ticket;
    try { ticket = sealer.open(kind, value); } catch (_) { throw new InvalidGrantError('Freigabe abgelaufen oder ungültig.'); }
    if (ticket.data.clientId !== client.client_id) throw new InvalidGrantError('Freigabe gehört zu einer anderen Verbindung.');
    return ticket;
  };
  const revoked = async family => { if (await store.exists(`revoked:${family}`)) throw new InvalidGrantError('Die Verbindung wurde widerrufen.'); };
  const tokens = (data, lifetime = 30 * 86400) => ({
    access_token: sealer.seal('access', data, 3600), token_type: 'Bearer', expires_in: 3600,
    refresh_token: sealer.seal('refresh', data, lifetime), scope: data.scopes.join(' ')
  });
  const provider = {
    clientsStore: {
      getClient(clientId) {
        try { return { ...sealer.open('client', clientId).data, client_id: clientId }; } catch (_) { return undefined; }
      },
      registerClient(client) {
        if (!client.redirect_uris?.length || client.redirect_uris.length > 5 || !client.redirect_uris.every(callbackAllowed)) throw new InvalidClientMetadataError('Nur ChatGPT-Rücksprungadressen sind zugelassen.');
        if (!['none', 'client_secret_post'].includes(client.token_endpoint_auth_method || 'client_secret_post')) throw new InvalidClientMetadataError('Diese Anmeldung wird nicht unterstützt.');
        const info = {
          redirect_uris: client.redirect_uris, client_name: 'ChatGPT – Roadbook',
          token_endpoint_auth_method: client.token_endpoint_auth_method || 'client_secret_post',
          grant_types: ['authorization_code', 'refresh_token'], response_types: ['code'],
          scope: SCOPES.join(' '), client_id_issued_at: Math.floor(Date.now() / 1000),
          ...(client.client_secret ? { client_secret: client.client_secret, client_secret_expires_at: client.client_secret_expires_at } : {})
        };
        return { ...info, client_id: sealer.seal('client', info, 365 * 86400) };
      }
    },
    async authorize(client, params, res) {
      target(params.resource);
      const csrf = random();
      const ticket = sealer.seal('consent', {
        clientId: client.client_id, redirectUri: params.redirectUri, state: params.state,
        scopes: scopesFor(params.scopes), challenge: params.codeChallenge, resource, csrf
      }, 600);
      res.cookie('__Host-roadbook-connect', csrf, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 600000 });
      res.type('html').send(consentPage(ticket, '', scopesFor(params.scopes).includes('roadbook:write')));
    },
    async consent(req, res) {
      let ticket;
      try { ticket = sealer.open('consent', req.body?.ticket); } catch (_) { return res.status(400).type('html').send(consentPage('', 'Die Anmeldung ist abgelaufen. Bitte in ChatGPT erneut verbinden.')); }
      const cookie = String(req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith('__Host-roadbook-connect='))?.slice('__Host-roadbook-connect='.length);
      if (req.headers.origin !== origin || !cookie || !equal(cookie, ticket.data.csrf)) return res.status(403).send('Bitte die Anmeldung in ChatGPT erneut starten.');
      if (!await store.allowLogin()) return res.status(429).type('html').send(consentPage(req.body.ticket, 'Zu viele Anmeldeversuche. Bitte in fünf Minuten erneut versuchen.', ticket.data.scopes.includes('roadbook:write')));
      if (!pin || !equal(String(req.body.pin || '').trim(), pin.trim())) return res.status(401).type('html').send(consentPage(req.body.ticket, 'Die PIN stimmt nicht. Bitte erneut eingeben.', ticket.data.scopes.includes('roadbook:write')));
      if (!await store.claim(`consent:${ticket.jti}`)) return res.status(400).send('Diese Anmeldung wurde bereits verwendet. Bitte in ChatGPT erneut verbinden.');
      const code = sealer.seal('code', ticket.data, 300);
      const redirect = new URL(ticket.data.redirectUri);
      redirect.searchParams.set('code', code);
      if (ticket.data.state) redirect.searchParams.set('state', ticket.data.state);
      res.clearCookie('__Host-roadbook-connect', { httpOnly: true, secure: true, sameSite: 'lax', path: '/' });
      res.redirect(303, redirect.href);
    },
    async challengeForAuthorizationCode(client, code) { return grant('code', code, client).data.challenge; },
    async exchangeAuthorizationCode(client, code, unusedVerifier, redirectUri, requestedResource) {
      target(requestedResource);
      const ticket = grant('code', code, client);
      if (redirectUri !== ticket.data.redirectUri) throw new InvalidGrantError('Rücksprungadresse stimmt nicht überein.');
      if (!await store.claim(`code:${ticket.jti}`)) throw new InvalidGrantError('Freigabe wurde bereits eingelöst.');
      return tokens({ clientId: client.client_id, scopes: ticket.data.scopes, resource, family: random() });
    },
    async exchangeRefreshToken(client, refresh, scopes, requestedResource) {
      target(requestedResource);
      const ticket = grant('refresh', refresh, client);
      const requested = scopes ? scopesFor(scopes) : ticket.data.scopes;
      if (requested.some(s => !ticket.data.scopes.includes(s))) throw new InvalidScopeError('Berechtigungen können nicht erweitert werden.');
      await revoked(ticket.data.family);
      if (!await store.claim(`refresh:${ticket.jti}`)) {
        await store.claim(`revoked:${ticket.data.family}`);
        throw new InvalidGrantError('Freigabe wurde bereits verwendet. Bitte erneut verbinden.');
      }
      return tokens({ ...ticket.data, scopes: requested }, ticket.exp - Math.floor(Date.now() / 1000));
    },
    async verifyAccessToken(access) {
      try {
        const ticket = sealer.open('access', access);
        target(ticket.data.resource);
        await revoked(ticket.data.family);
        return { token: access, clientId: ticket.data.clientId, scopes: ticket.data.scopes, expiresAt: ticket.exp, resource: new URL(resource), extra: { owner: 'roadbook-owner' } };
      } catch (_) { throw new InvalidTokenError('Bitte Roadbook erneut verbinden.'); }
    },
    async revokeToken(client, request) {
      let ticket;
      for (const kind of ['access', 'refresh']) {
        try { ticket = grant(kind, request.token, client); break; } catch (_) { /* RFC 7009: invalid tokens are successful no-ops. */ }
      }
      if (ticket) await store.claim(`revoked:${ticket.data.family}`);
    }
  };
  return provider;
}
module.exports = { createAuthProvider, callbackAllowed, consentPage };
