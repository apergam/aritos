# T09 — Implement sound effects

Dependencies: T03, T05. T06 supplies parallel validation feedback and is not a prerequisite.

Read [AGENTS.md](../../AGENTS.md), [requirements](../requirements.md), the [guide](../implementation-guide.md), and `docs/module-contracts.md`. Follow shared verification/handoff rules. Audio implementation may proceed alongside T06; mobile audio acceptance must still be based on actual device evidence.

## Outcome and ownership

Own `src/audio/`, audio assets under `public/assets/audio/` if needed, and focused lifecycle tests. The POC currently has no game audio. Consume round events and preference updates; expose an audio controller and asset manifest for T11 rather than editing UI or composition.

## Work and acceptance

- Add subtle pump, water, and celebration sounds. Do not add background music.
- Respect the saved mute preference from startup; support safe user activation and failure/no-audio fallback without blocking play.
- Sound responds to actual pump/round events, with no duplicate subscriptions or repeated victory playback. Ignore stale events after restart.
- Pause/background/disposal must not leave an uncontrolled water sound or leak audio resources. Reopening settings must not create duplicate listeners.
- Theme changes preserve mute state and do not trigger unsolicited sounds or restart the round.
- Preload required resources or use self-contained synthesis; supply a complete manifest so post-load play and theme switching require no network.

## Verification and handoff

Test mute/unmute, restored mute, unsupported/failed audio activation, event duplication, restart, and cleanup using meaningful controller tests. Listen in a browser after user interaction and record the browser tested; do not claim phone audio acceptance without device evidence. Typecheck, tests, and build pass. Provide integration examples and asset provenance if using recordings.

Coverage: RF-40, RF-43–RF-44; RT-12; CA-19–CA-20.
