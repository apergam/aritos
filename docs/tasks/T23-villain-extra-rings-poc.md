# T23 — Explore a villain adding extra rings

Dependencies: T03, T04, T08, T09 implementation, T11; coordinate with T15 music when available. Free lab/browser evidence is sufficient for exploration; unavailable hardware checks remain not run.

Read [AGENTS.md](../../AGENTS.md), [requirements section 17](../requirements.md#17-variable-pressure-and-arcade-experiments--october-20-2026), the [implementation guide](../implementation-guide.md), [module contracts](../module-contracts.md), and [task board](README.md). The user subsequently selected this laboratory implementation; see current evidence below.

## Outcome and ownership

Prototype a villain encounter: a villain mascot appears with a villain musical cue and adds one or two conspicuous red/bright rings to the toy. Compare whether the interruption is fun without making the final few rings endlessly frustrating.

Own an isolated encounter controller and lab variant; coordinate dynamic body creation, session objective accounting, theme art, audio and composition. T18 does not supply dynamic spawning: its round-start count comparison is a different experiment, with shared count contracts coordinated by the integration owner.

## Work and acceptance

- Provide manual lab triggers for adding exactly one or exactly two extra rings. Give them distinct stable IDs and readable red/bright appearance; they are ordinary physical rings, not collision-free decorative particles. Match the villain's appearance to the encounter while leaving normal theme mechanics independent.
- Animate the villain and play a short locally available villain musical phrase, respecting saved global/music controls and user activation. A self-contained documented cue can support the prototype before T15; coordinate theme-music ducking/restoration once T15 exists. Muting never prevents the encounter or conceals its visual warning.
- Define encounter timing, frequency, limits and interaction with powerups as open design decisions. Start with a bounded manual encounter; do not add an unlimited automatic spawner or assume that “few rings left” must always summon an enemy.
- Add rings only at a safe simulation boundary with valid non-overlapping spawn poses inside the tank. If no safe space/capacity is available, defer or reject the spawn visibly rather than intersecting walls, pegs or existing bodies.
- In collect mode, successful spawns increase total required rings by exactly the number actually created; preserve already collected progress and maintain active + collected = current total. Failed or duplicate events add neither bodies nor objectives. In classic mode, all current rings become required and a successful addition resets the continuous stability interval.
- Synchronize spawning and victory at the same step. Do not reopen a completed round or repeat its celebration; reject/defer a post-victory encounter. Restart restores the selected starting count and clears added rings, pending spawns, villain animation/audio and encounter state.
- Keep this variant opt-in in the lab. Record limits/capacity and compare one versus two extra rings, both modes/models, and red-ring readability against each theme. Added rings must not make a physically impossible objective.

## Verification and handoff

Test successful/failed/duplicate spawns, unique identities, body/total invariants, classic interval reset, spawn-at-victory ordering, pause/background, restart and stale encounters. Exercise strongest pump/inversion against added bodies and check classic capacity for the bounded maximum. Run typecheck/tests/build and browser visual/audio review; record rights for the cue/art and any unavailable acoustic/device checks.

Coverage: BL-16; requirements section 17; explicit experimental extension to RF-04, RF-25–RF-31 and section 13.


## Feasibility review — October 20

The user requested a review after T17/T19. [Feasibility findings](../validation/enemy-feasibility.md) propose one manual lab encounter, maximum two added rings (14 total), atomic +2 spawning and no late-game automatic punishment. Existing addRing is not a safe encounter API; capacity and fairness remain untested. Implementation is still planned.


## Implemented laboratory candidate — October 20

The user subsequently authorized remaining POC implementation. This card is integrated in /lab.html, build2005c319; see [the comparison and evidence](../validation/lab-experiments.md). Status is review pending player comparison, not a new normal-game default. The report records bounded choices, physical checks, fixes and unavailable device/acoustic acceptance.
