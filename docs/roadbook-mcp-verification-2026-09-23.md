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

ChatGPT account setup: the user signed in, authorized developer mode and Roadbook access, and the personal Roadbook MCP app was created. Pending user action: complete the Admin-PIN consent form and confirm tool discovery in ChatGPT. **Cloud ChatGPT activation and an authenticated production tool invocation are not yet confirmed.** A publication test in production was deliberately not performed because it would alter the actual shared trip; publication is exercised against test storage and existing publisher tests.

The implementation can read both trips and prepare changes to existing stages and stays. Creating new overnight blocks still uses the existing Admin planner. New detailed route geometry is not guaranteed for arbitrary full route changes; the preparation result explains any required subsequent map/arrival-route review.

## Native browser consent correction

Fix commit: `7b3dd7b0701f0130923d63dca9178076cb560d80`.
Production deployment: `dpl_9i2Zf3hdUF8xpJBscMtoTL9gU28R`, READY.

The initial HTTP integration tests supplied an Origin header themselves and therefore missed native HTML form behavior: `Referrer-Policy: no-referrer` caused the browser to submit `Origin: null`, which the consent CSRF check correctly rejected before examining the PIN. Changed the response policy to `strict-origin`, preserving the same-origin POST Origin while excluding URL paths and queries from the referrer. The CSRF check still rejects null and foreign origins.

- Targeted MCP tests: 6 passed, zero failed, including assertions for the header and null-origin rejection.
- Production response header confirmed as `strict-origin`.
- Actual native browser consent submission using a deliberately invalid, non-secret test PIN reached the expected “Die PIN stimmt nicht. Bitte erneut eingeben.” response, instead of the previous restart error. This confirms the browser form passes the Origin/cookie check and reaches PIN validation.
- Fresh empty consent form reopened for the user. Real authentication, ChatGPT tool discovery and the read-only production trip test remain pending; no production trip changes were made.

## Follow-up browser failure and callback test

The user's next direct form submission still returned HTTP 403 on the corrected deployment (production log at 15:38:28 UTC). Therefore the strict-origin fix alone did **not** establish that the user's browser session works. Added category-only diagnostics for missing/null/foreign Origin and missing/mismatched consent cookies. No PINs, cookie contents, URLs, authorization codes or tokens are logged. Rejected browser bindings now offer an explicit fresh GET authorization link reconstructed only from the authenticated consent ticket; no failed PIN form is retained. Invalid/expired consent no longer renders a permanently unusable empty-ticket PIN form.

An isolated native-browser test with a fabricated PIN also reproduced a separate successful-login failure: the browser remained on the form when a 303 redirected outside the form's origin. The consent CSP now permits only the exact registered callback in addition to self. Repeating the same native-browser test then reached the local callback success screen. Local test servers and tab were closed.

- Recovery/diagnostics commit: `ba9fc177f91803331127c06681489fb9b65037f3`.
- Callback policy commit: `fba1be55c67192858240c86dcf525c4a712e9772`.
- Production deployment: `dpl_5uFw8Vohc9Gmv8Yp4Nyu8SZENa4U`, READY.
- Targeted MCP suite: 6/6 passed after each change. Covers category-only diagnostics, preserved OAuth state/PKCE/resource on recovery, fresh browser binding, retained CSRF rejection, and exact callback policy on initial and invalid-PIN forms.
- A fresh ChatGPT authorization popup was opened, with the user asked to reload it manually before entering the PIN so the page and cookie are initialized together in their browser. Actual account connection and read-only trip test remain pending.
