# T20 — Prototype pegs in other positions

Dependencies: T04, T03, T11. Unavailable physical devices do not block exploration; record those checks as not run.

Read [AGENTS.md](../../AGENTS.md), [requirements section 16](../requirements.md#16-first-version-feedback-and-polish-backlog--october-20-2026), the [implementation guide](../implementation-guide.md), [module contracts](../module-contracts.md), and [task board](README.md) before assignment. This card is planned; recording it does not start an agent or implementation.

## Outcome and ownership

Explore pegs and bases at different heights/positions rather than only the floor. The user corrected the earlier assumption that real toys could not have such arrangements; record this as a new design direction, not an independently researched factual claim. Own a bounded lab geometry variant with matched renderer/colliders and focused physical tests.

## Work and acceptance

- Keep the current floor-mounted arrangement as baseline. Compare at least one raised/offset arrangement with explicit peg/base transforms and visible support or attachment to the rear plastic. Pegs are fixed to the toy, not freely floating dynamic obstacles.
- Keep depth 1.8, twelve rings and accepted pump/drag values for the first comparison; do not combine width/count changes without a separately identified case.
- Visual and physical supports, bases and pegs must agree. Preserve the real hole and physical threading/extraction; verify clearance from walls, supports and other pegs.
- For collect mode, explicitly associate each peg with its base contact surface: an elevated base may collect only after physical threading and 0.12 active seconds of actual contact. The floor itself and a decorative support never award progress.
- Verify classic capacity, accessibility from both pump models, extraction under tilt/inversion, valid spawning, and that an arrangement does not create unreachable objectives.
- Compare readability, variety and play feedback; retain experiments in the lab until a particular arrangement is selected for production.

## Verification and handoff

Check aligned/offset/depth cases, containment, stacking/extraction and physical collection at the candidate bases. Inspect both modes/models in browser and capture variant dimensions/evidence. Run code checks and hand off a comparison, including rejected arrangements and any unresolved capacity constraints.

Coverage: BL-13; requirements section 16; preserve RF-08–RF-10 and physical classic rules; collect contact remains explicit.
