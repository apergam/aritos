# T11 — Integrate the production app and assets

Dependencies: T07, T08, T09, T10.

Read [AGENTS.md](../../AGENTS.md), [requirements](../requirements.md), the [guide](../implementation-guide.md), `docs/module-contracts.md`, and dependency handoffs. Follow shared verification/handoff rules.

## Outcome and ownership

Wire the completed modules into a playable product and retain a separate laboratory path. Own `src/app/`, `src/main.ts`, app-level lab routing/composition, `public/index.html`, shared styles, asset startup, and required build changes in this wave. Do not rewrite the independently owned modules; coordinate defects at their boundaries.

## Work and acceptance

- Connect model/theme choice, Spanish onboarding/help, controls, preferences, pause/restart, both rule modes, audio, and celebration through the agreed contracts.
- Make the production view the normal player entry. Expose scenes, camera sliders, tuning, collision debug, and diagnostics only through an explicit laboratory entry/path; preserve the lab's diagnostic utility.
- Keep the camera fixed in production and pump controls below the tank. Preserve accepted geometry and tuning.
- Load all resources needed by all themes, audio, and mascots before claiming loading complete. Remove reliance on the current remote Google Fonts import: bundle appropriately licensed fonts or use system fallbacks.
- After loading, changing themes/controls and playing must not depend on network access. Do not add a service worker/PWA or cold-offline feature to satisfy this different requirement.
- Preserve versioned assets and no-cache local serving. Keep a static build without accounts or a game backend. Do not publish or replace the original hosted site.
- Document the actual entry paths and integrated contracts, including teardown/restart behavior.

## Verification and handoff

Run full checks, then exercise model/theme/mode combinations and the complete menu flow in a browser. Verify theme changes preserve physical state and sound preference; canceling restart preserves the round; confirmed restart clears it. Disconnect after full loading and exercise all themes. Capture network/diagnostic evidence and known limitations for T12, without claiming release/mobile acceptance yourself.

Coverage: RF-03, RF-37–RF-45; RT-04, RT-10–RT-14; CA-11–CA-12, CA-16–CA-20.
