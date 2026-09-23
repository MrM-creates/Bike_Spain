# Roadbook MCP

Production endpoint: `https://motorrad-roadbook-spanien-2026.vercel.app/mcp`.

The remote service works without a local Mac. Register it in ChatGPT developer mode, authenticate on the Roadbook consent page, then select the connection in a supported conversation. Installing the source folder in local Codex does not itself register a cloud ChatGPT connection. Chat history is not shared; the versioned published trip is shared.

## Tools

- `get_trip`: authoritative GitHub snapshot, accommodations, version, fixed points and planning policy.
- `prepare_accommodation_change`: review an existing stay's options/status; no actual hotel reservation.
- `prepare_plan_change`: patch existing stable day IDs and stay dates; reuse online route verification. Protected ferry/start/end stages and existing bookings remain protected. New overnight blocks currently require the existing Admin planner.
- `publish_change`: decrypt a short-lived prepared change and run the existing publisher. Write scope and an explicit publication request are required. Current version and atomic GitHub update prevent stale overwrites.
- `get_delivery_status`: compare requested version with the live companion feed. A GitHub commit is not proof of completed deployment.

## Authentication and infrastructure

The official MCP SDK serves Streamable HTTP and OAuth authorization-code/PKCE S256. Dynamic client registration is restricted to ChatGPT callbacks and local loopback callbacks for Codex. The resource must be the exact `/mcp` URL. Access tokens last one hour; rotating refresh tokens have a fixed 30-day grant lifetime. Scopes are `roadbook:read` and `roadbook:write`. Consent has an HttpOnly/Secure/SameSite cookie and an Origin/CSRF check. PIN attempts are limited globally to six per five minutes across serverless instances.

Required existing environment: `GITHUB_ROADBOOK_TOKEN`, `ROADBOOK_PUBLISH_SECRET`, and `OPENAI_API_KEY` for route checks. Optional existing `GITHUB_REPO` and `GITHUB_BRANCH` select the same authoritative repository. New `ROADBOOK_MCP_SECRET` must have at least 32 random bytes and is configured only as a sensitive production environment variable. Never put it into plugin files, chat, commits or client-side code. Its rotation invalidates every OAuth grant, client registration and prepared draft; reconnect clients afterwards.

Auth codes, client registration state, tokens and drafts use AES-256-GCM with purpose-specific authenticated data. The server never sends the PIN or GitHub/OpenAI credentials to MCP clients. A draft is encrypted, compressed and limited to 900 KB when expanded. Only the connection that prepared it can publish it within 30 minutes.

One-time code/refresh/draft consumption and revocation use atomic GitHub reference creation in the separate `refs/roadbook-mcp/<sha256>` namespace. These markers point at an existing commit; they do not change main, store tokens or contain personal data. Duplicate creation is accepted only after confirming the exact marker exists; other GitHub failures fail closed. This avoids an additional database subscription for this single-owner service. Markers are deliberately retained: deleting them while grants are live could re-enable replay. After rotating `ROADBOOK_MCP_SECRET` and redeploying, old markers can be removed by the operator. No automatic cleanup runs.

`/revoke` revokes the entire refresh family. Removing a client in ChatGPT may or may not call this endpoint; rotating the server secret is the emergency revocation path. The single owner PIN intentionally grants access to both existing trips. The existing public companion feed remains unchanged; OAuth protects this new write-capable interface.

## Publication behavior and limits

PIN injection occurs inside the server when invoking existing handlers; no model supplies or sees it. Plan publication retains existing accommodation option identities/statuses, preserves booked stays, validates fixed points and rebuilds Google route parameters for checked riding days. Existing route geometry is only reused when its signature matches. This interface does not promise to regenerate every detailed map after arbitrary itinerary changes: the app can show a pending route check when no suitable reviewed geometry exists. That warning is included in the preview.

No live trip is changed for smoke tests. Unit and HTTP integration tests cover the full login/PKCE flow, consent origin checks, bad PINs, wrong resource, replay, refresh rotation, revocation, scope enforcement, version conflicts, immutable drafts and existing publication adapters. Run `npm test`.

## Consent page contract

Purpose: let the trip owner connect ChatGPT/Codex once without entering credentials in a chat. Structure: one screen explaining scope and duration, one labelled PIN field, one primary connect button, and a return link. Use the Flider D-04 neutral background/text with the existing dark blue Roadbook action color, system fonts, 8/12 px radii and 24 px spacing. Single column, max 520 px, fluid mobile width, visible keyboard focus and textual error feedback. No animation, trackers or external resources.
