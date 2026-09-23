# Roadbook MCP verification — 23 September 2026

Implementation commit: `5ead4ffc2058a23a04a8590223ab87065cd5465d`.
Production deployment: `dpl_8C3DkoQJ2cafUnNs61e4eTY1PBhQ`, READY.

- Full Node suite: 95 tests passed, zero failed. Includes real HTTP/official MCP SDK login, PKCE, consent CSRF, resource binding, auth-code replay, refresh rotation/family revocation, tool discovery, authenticated reads, write-scope enforcement, encrypted/version-bound/connection-bound/single-use drafts, unchanged bookings/fixed points and per-day route verification/navigation reconstruction.
- Dependencies: installation audit reported zero vulnerabilities. Official plugin validator passed.
- Live OAuth authorization-server and protected-resource metadata: HTTP 200, correct production endpoints, read/write scopes and S256 discovery.
- Live MCP without an access token: HTTP 401 with correct protected-resource challenge.
- Live public client registration and authorization consent page: successful; inspected the actual deployed page in the browser. No PIN entered and no access granted during this smoke test.
- Real GitHub one-time marker: first atomic claim succeeded, duplicate rejected, read succeeded. Exactly that random temporary marker was then removed. No branch or trip data changed.
- Live Adria companion version remains `2026-09-23T14:27:31.314Z`; no trip or hotel mutation was made for this feature's tests.
- New sensitive production `ROADBOOK_MCP_SECRET` configured directly through Vercel; no value printed or saved in the repository/chat.

Pending user action: ChatGPT is signed out in the browser used for setup. After sign-in, create/authorize the account's Roadbook connection and confirm tool discovery there. **Cloud ChatGPT activation and an authenticated production tool invocation are not yet confirmed.** A publication test in production was deliberately not performed because it would alter the actual shared trip; publication is exercised against test storage and existing publisher tests.

The implementation can read both trips and prepare changes to existing stages and stays. Creating new overnight blocks still uses the existing Admin planner. New detailed route geometry is not guaranteed for arbitrary full route changes; the preparation result explains any required subsequent map/arrival-route review.
