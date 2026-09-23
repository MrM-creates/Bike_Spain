# Roadbook MCP verification — 23 September 2026

**Final status: account connected, all five tools discovered, authenticated ChatGPT Work read verified successfully.** Historical pending states below document the investigation; the successful test at the end supersedes them. No live publication was requested or performed.

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

## Live successful consent followed by desktop crash

At 15:46:31 UTC the user's actual consent POST returned 303; at 15:46:34 the token endpoint returned 200. Authenticated MCP requests then returned 200/202 through 15:46:38. This establishes successful PIN validation and at least initial authenticated MCP communication; request bodies were not logged, so it is not evidence of a completed trip-read test. A later token request at 15:46:52 returned 400; its reason is not established.

The user reported the desktop app closing with a crash report. The matching local macOS report confirms a native EXC_BAD_ACCESS/SIGSEGV in the CrBrowserMain thread, with the top frame in V8 Context::Enter. This establishes a native browser-component crash, but not its exact trigger. No crash report or credentials were uploaded.

After restart, Roadbook remains listed among installed plugins, but its detail panel reports “Plugin nicht verfügbar”; some unrelated security settings also fail to load. Browser diagnostics show ChatGPT request failures and a managed challenge response. The final connected-account/tool state and read-only trip invocation are still unconfirmed. No further consent or PIN attempt was initiated during this investigation, and no trip writes were performed.

A subsequent normal page reload completed successfully: the Roadbook settings now display the primary connected account and “Verbunden am 23. Sept. 2026”. This confirms account connection persistence across the desktop crash. Refreshing the connection produced authenticated MCP responses again. The settings still displayed no tools, so a read-only test was sent through the plugin's “Im Chat testen” action, explicitly requesting only `get_trip(trip_adria_2026)` and prohibiting any preparation/publication or other changes. The test returned that `get_trip` is unavailable; no trip values were invented and no data were changed. Added count-only discovery response diagnostics to isolate server delivery from ChatGPT tool exposure.

At 15:53:42 UTC, refreshing the connected app on deployment `dpl_7VzEFkr46tNAAAYtANTD39RHVHDh` (commit `03cc73ff81e80005bdcc3c2f389f0168a3962a40`) emitted `roadbook_mcp_discovery { toolCount: 5, errorCode: null }` with HTTP 200. Thus production authenticated discovery returns all five tools, while the ChatGPT settings still say “Noch keine App-Tools verfügbar” and the actual read-only Work test reports `get_trip` unavailable. Account connection is confirmed; usable ChatGPT tool exposure and trip-read verification remain blocked/unconfirmed. No further PIN entry is needed for the currently saved connection.

## Tool import compatibility correction

The accommodation option schema used a positional `z.tuple`, which the MCP SDK advertised using JSON Schema draft-07 array-valued `items`. Replaced it with a homogeneous numeric array of exactly two elements plus runtime latitude validation. Longitude remains bounded to ±180 and latitude to ±90; the data format stays `[longitude, latitude]`. Added SDK-level checks for portable array schemas and rejection of invalid coordinates/lengths before plan operations. Targeted MCP suite passed 6/6.

Fix commit `08bb865e63a592c9cbf25fe68f83c542e2f10797`, production deployment `dpl_2zAo9V7JrqUcMmVUoDPVZz3wtBf1` READY. After refreshing the existing connected app, ChatGPT immediately displayed all five tools with their scopes and schemas. No reconnection or PIN entry was needed. This before/after verifies the tuple schema was the import blocker in this integration. A fresh Work conversation was started through “Im Chat testen” to run the same read-only `get_trip` check.

## Successful end-to-end ChatGPT Work read

Test conversation: https://chatgpt.com/c/6ab3f74b-8cf0-83eb-92b1-8284af151627 (“Verbindungstest Reisedaten abrufen”). The selected Roadbook plugin invoked `get_trip` for `trip_adria_2026`; the visible activity confirms the actual trip-data retrieval. The final answer reports:

- Published version: `2026-09-23T14:27:31.314Z`.
- 30 travel days.
- Booked stay in Lienz: Hotel Holunderhof, Zettersfeldstraße 36, 9905 Gaimberg.

No trip change, draft preparation or publication was performed. The user can select Roadbook in supported ChatGPT conversations and use the existing saved OAuth connection. New conversations should be used after a metadata update so the new tools are available. The earlier desktop-native crash is documented but its exact trigger is not established; the later metadata refresh and successful read did not reproduce it.
