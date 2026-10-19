# Fieldroom

A fictional, AI-assisted equipment borrowing frontend. Select one item, review a policy, confirm a simulated hold, record pickup, then return it. **Selected, Confirmed, Borrowed and Returned are separate states.**

No real equipment is reserved. There is no campus connection, login, backend, live inventory or telemetry. This is a new prototype created for Hyperbloom October 2026.

## Run

Node.js 18+; no runtime packages or build step. From the source package run `npm start`, then open http://127.0.0.1:4173. Run `npm test` for the eight model/storage tests. Run `npm run test:contrast` for eight static color-pair checks.

The static package contains the same five browser files (`index.html`, `style.css`, `app.mjs`, `model.mjs`, `storage.mjs`) and these documents. Serve those files as static HTTP content; opening index.html directly as a file may block JavaScript modules. The source package includes a loopback-only Node server. No hosting service is required or configured by this project.

## Try the journey

1. Select headphones: **Selected · not confirmed**.
2. Review, read the fictional three-hour indoor-use policy and check its acknowledgment.
3. Confirm the simulated hold: receipt shown, **nothing borrowed yet**.
4. Record pickup: the three-hour loan starts and a return time appears.
5. Record return: the loan closes and the receipt remains.

Keyboard from a fresh page: Tab/Enter for the skip link, Tab/Enter to select headphones, Tab/Enter to review, Tab/Space to acknowledge, then Tab/Enter to confirm, pick up and return. Acknowledgment resets on reload. The prototype controls let you simulate stale stock; confirmation rejects an item that became unavailable. Reset is disabled during an active loan.

## Browser checks

Optional development tool: Playwright with a locally installed Chromium-compatible browser. No Playwright code is shipped to the frontend. Install it only if you want browser verification, following its official instructions. The runners use `require('playwright')` by default; `PLAYWRIGHT_MODULE` may instead point to an existing installed module. `CHROME_PATH` may point to an existing browser; otherwise Playwright uses its installed Chromium. No credentials are needed.

- `npm run test:browser`: 20 regression checks, including keyboard-only completion and visibility of a restored borrowing slip.
- `npm run test:risk`: 22 targeted checks covering reload, duplicate confirmation, cross-tab state changes, storage failures, focus (including cross-tab replacement), history and reduced motion; also generates five PNG captures under demo/.

The suites overlap. Verification during development used installed Chrome and request fulfillment of unchanged local files at a loopback origin because the execution sandbox denied genuine loopback networking. Thus the recorded browser checks establish rendering and browser behavior, **not a genuine HTTP-served or deployed browser journey**. A fresh extracted source package passed its model/storage and contrast checks. No screen-reader user study, formal WCAG audit, multi-browser certification or real-device speed result is claimed.

## Design and persistence

An open equipment list and a stable borrowing slip keep a small task readable. Native controls, a skip link, visible focus, live notices, mobile reflow and reduced-motion support are included. Inventory and policies are fictional. The hypothesis is that explicit lifecycle boundaries can reduce ambiguity; it is not validated user research or a claim that an existing campus service is defective.

State is browser local. Cooperating same-origin tabs use Web Locks and reread saved snapshots before changes. Stale actions ask for review; removed or malformed storage recovers visibly. Without working storage or Web Locks, the UI announces session-only behavior. There is no authoritative inventory, reservation expiry, cross-device recovery or protection against unrelated code that ignores the lock. Device time determines simulated due dates. Back/forward does not undo a transaction.

See PROVENANCE.md for original work, AI assistance, third-party tools and license status. Publication does not make this source open source: no license grant has been selected.
