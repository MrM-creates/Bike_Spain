const express = require('express');
const { mcpAuthRouter } = require('@modelcontextprotocol/sdk/server/auth/router.js');
const { requireBearerAuth } = require('@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const { ORIGIN, SCOPES, createSealer, createGithubStore } = require('../lib/mcp-security');
const { createAuthProvider } = require('../lib/mcp-auth');
const { createMcpServer } = require('../lib/mcp-tools');

function createApp({ origin = ORIGIN, sealer, store, pin, call, fetchImpl, reportAuthEvent, reportDiscovery = event => console.info('roadbook_mcp_discovery', event) } = {}) {
  sealer ||= createSealer(process.env.ROADBOOK_MCP_SECRET, origin);
  store ||= createGithubStore({ token: process.env.GITHUB_ROADBOOK_TOKEN, repo: process.env.GITHUB_REPO, branch: process.env.GITHUB_BRANCH });
  const provider = createAuthProvider({ sealer, store, origin, pin: pin ?? process.env.ROADBOOK_PUBLISH_SECRET, reportAuthEvent });
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    // Form POSTs under no-referrer carry Origin: null and fail the deliberate
    // same-origin CSRF check. strict-origin retains that proof without leaking
    // OAuth query parameters in the Referer header.
    res.setHeader('Referrer-Policy', 'strict-origin');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
    next();
  });
  app.post('/roadbook-connect', express.urlencoded({ extended: false, limit: '16kb' }), provider.consent);
  app.use(mcpAuthRouter({ provider, issuerUrl: new URL(origin), resourceServerUrl: new URL(`${origin}/mcp`), resourceName: 'Roadbook', scopesSupported: SCOPES,
    serviceDocumentationUrl: new URL(`${origin}/roadbook-connection.html`) }));
  app.use('/mcp', (req, res, next) => {
    if (req.headers.origin && ![origin, 'https://chatgpt.com'].includes(req.headers.origin)) return res.status(403).json({ error: 'Unzulässiger Ursprung.' });
    next();
  }, requireBearerAuth({ verifier: provider, requiredScopes: ['roadbook:read'], resourceMetadataUrl: `${origin}/.well-known/oauth-protected-resource/mcp` }));
  app.post('/mcp', express.json({ limit: '2mb' }), async (req, res) => {
    const server = createMcpServer({ store, sealer, call, origin, fetchImpl });
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    if (req.body?.method === 'tools/list') {
      const send = transport.send.bind(transport);
      transport.send = async (message, options) => {
        // Only public discovery counts/error codes; never credentials or trip data.
        reportDiscovery({ toolCount: Array.isArray(message.result?.tools) ? message.result.tools.length : 0,
          errorCode: typeof message.error?.code === 'number' ? message.error.code : null });
        return send(message, options);
      };
    }
    res.on('close', () => { transport.close(); server.close(); });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });
  app.all('/mcp', (req, res) => { res.setHeader('Allow', 'POST'); res.status(405).json({ error: 'Diese Verbindung verwendet einzelne MCP-Anfragen per POST.' }); });
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    res.status(error.type === 'entity.too.large' ? 413 : 503).json({ error: 'Roadbook konnte die Anfrage nicht abschliessen. Bitte erneut versuchen.' });
  });
  return app;
}

let app;
module.exports = (req, res) => {
  try {
    app ||= createApp();
    // Vercel may expose either the original or the rewritten URL. Explicit route
    // selection makes both forms behave identically, including OAuth discovery.
    const url = new URL(req.url, ORIGIN);
    const route = url.searchParams.get('mcp_path') || req.query?.mcp_path;
    if (route) {
      if (!['/mcp', '/authorize', '/token', '/register', '/revoke', '/roadbook-connect', '/.well-known/oauth-authorization-server', '/.well-known/oauth-protected-resource/mcp'].includes(route)) {
        res.statusCode = 404; return res.end();
      }
      url.searchParams.delete('mcp_path');
      req.url = `${route}${url.search}`;
    }
    return app(req, res);
  } catch (_) {
    res.statusCode = 503; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({ error: 'Die Roadbook-Verbindung ist noch nicht eingerichtet.' }));
  }
};
module.exports.createApp = createApp;
