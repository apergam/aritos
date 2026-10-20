# T10 — Implement themed celebration

Dependencies: T03, T08.

Read [AGENTS.md](../../AGENTS.md), [requirements](../requirements.md), the [guide](../implementation-guide.md), and `docs/module-contracts.md`. Follow shared verification/handoff rules.

## Outcome and ownership

Replace the POC's technical success message with a themed, non-blocking celebration. Own `src/celebration/` and celebration-owned assets. Consume session victory events and theme identity; coordinate rendering hooks through T08's contract and hand wiring to T11. These are game mascots, not ChatGPT companion pets.

## Work and acceptance

- Ocean uses a dancing octopus, space a dancing astronaut, and capybaras a dancing capybara, with confetti.
- Celebrate once per round in either rule mode. Restart permits a fresh celebration; stale completion/timer callbacks cannot affect the next round.
- Effects expire automatically and never block pumping, orientation, menu actions, or the player's view of the rings.
- Theme changes select the appropriate appearance without altering physics or issuing another victory event.
- Provide a quality setting that reduces particles/effects before affecting simulation. Keep mascot/confetti resources available after initial load.
- Allow continued play/restart after victory, including a collect round with no active rings remaining.

## Verification and handoff

Preview all three mascots and verify input remains usable beneath the celebration. Test repeated victory events, classic removal/rethreading, collect completion, theme change, restart mid-effect, timeout cleanup, and disposal. Typecheck, tests, and build pass. Report chosen effect duration and visual evidence; provide asset manifest/provenance and integration notes.

Coverage: RF-27–RF-31; RT-10; CA-14–CA-15.
