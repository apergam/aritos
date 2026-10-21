# T13 — Compare a narrower toy

Dependencies: T04, T11. Unavailable physical devices do not block exploration; record those checks as not run.

Read [AGENTS.md](../../AGENTS.md), [requirements section 16](../requirements.md#16-first-version-feedback-and-polish-backlog--october-20-2026), the [implementation guide](../implementation-guide.md), [module contracts](../module-contracts.md), and [task board](README.md) before assignment. The user subsequently selected this laboratory implementation; see current evidence below.

## Outcome and ownership

Explore whether less horizontal travel makes play more interactive and less repetitive. This is a laboratory experiment, not a new production default.

Own a bounded lab variant and focused geometry/physics checks. Coordinate changes to `src/models/`, `src/physics/`, lab/renderer geometry and shared composition with the integration owner; do not silently edit the accepted player configuration.

## Work and acceptance

- Keep the accepted width as a named baseline and offer at least two narrower candidates with explicit dimensions. Keep depth 1.8, ring size, pump strength 75, damping 0.50, twelve rings and the current peg arrangement fixed for the first comparison.
- Derive walls, visible housing, spawning and nozzle positions consistently from the candidate width. Record any necessary peg-clearance adjustment as a separate variable; do not hide retuning in the comparison.
- Compare both models and both rules: horizontal travel, response to pumping, inactive waiting and whether play feels less repetitive. Use the same documented pump/tilt sequence for technical comparisons; manual enjoyment needs player feedback.
- Preserve holes, containment, physical threading/extraction, pedestal contact and classic stack capacity. Never make threading automatic to improve completion rates.
- Record candidate measurements and player feedback in a comparison report. Promote a width to the player only after the user chooses it.

## Verification and handoff

Run focused containment, valid spawning, pump locality, threading and stacking/extraction checks for each viable width. Build/typecheck/test code changes, inspect portrait/landscape in the browser, and distinguish measured behavior from subjective play feedback. Hand off a comparison and recommendation, including candidates rejected for jams or insufficient capacity.

Coverage: BL-07; requirements section 16; preserve RF-06–RF-16 and CA-01–CA-07.


## Implemented laboratory candidate — October 20

The user subsequently authorized remaining POC implementation. This card is integrated in /lab.html, build2005c319; see [the comparison and evidence](../validation/lab-experiments.md). Status is review pending player comparison, not a new normal-game default. The report records bounded choices, physical checks, fixes and unavailable device/acoustic acceptance.
