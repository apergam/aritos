# T05 — Persist preferences safely

Dependencies: T01.

Read [AGENTS.md](../../AGENTS.md), [requirements](../requirements.md), the [guide](../implementation-guide.md), and `docs/module-contracts.md`. Follow shared verification/handoff rules.

## Outcome and ownership

The POC exposes settings but does not implement reliable product preference storage. Own `src/platform/preferences.ts` (or T01's documented equivalent) and focused storage tests. Work against stable model/theme/control IDs, not renderer or physics objects. Do not edit UI or shared composition.

## Work and acceptance

- Read/write theme, toy model, sound, and control preferences. Define validated defaults and a small versioned data format.
- Missing, malformed, unsupported, partially invalid, or inaccessible storage must not prevent play. Catch both read and write failures; recover valid fields where practical.
- No valid model preference means two buttons. Preserve accepted mechanical tuning independently of preferences.
- Never persist positions, velocities, victory/contact timers, active bodies, or collected progress. Reload creates a fresh round.
- Preference updates do not recreate the current round. Model changes still go through the session's new-round command; theme changes preserve state.
- If persisting rule mode is proposed, record it as a product decision first; it is not required by RF-44. The accepted initial mode remains collect.

## Verification and handoff

Test absent data, malformed JSON, invalid enum values, unknown format versions, and storage exceptions. Verify that serialization contains only supported preferences, without a round snapshot. Typecheck, tests, and build pass. Provide load/update/fallback examples for T07/T11, including sound restoration without playing a sound during startup.

Coverage: RF-44–RF-45; CA-18–CA-19.
