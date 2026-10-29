# T25 — Explore endless villain mode with linked chains

Status: **planned — backlog only**. Owner: Unassigned. No implementation or agent dispatch is authorized by recording this card.

Dependencies: integrated T03, T11 and T23 implementations; coordinate mobile UI with T24. Physical-device acceptance remains parallel, not a development gate.

Read [requirements §25](../requirements.md#25-endless-linked-chain-mode-backlog--october-21-2026), [the board](README.md), [the guide](../implementation-guide.md) and [current linked-pair evidence](../validation/automatic-linked-villain.md) before assignment.

## Requested outcome

A separate endless mode where the mischievous mascot returns and drops one continuous chain of **2–5 physically linked rings per appearance**. Preserve the existing finite modes and their bounded villain encounter.

## Decisions before implementation

- Starting rings, encounter timing/trigger, chain-length selection and difficulty progression, if any.
- Whether to reuse collection at the base, how cumulative progress is shown, what happens when the tank is empty, and how the player exits/restarts. Reaching a finite target must not accidentally terminate an endless session.
- Maximum simultaneous rings and how to defer a visit while space is crowded; recurring play must not create unlimited bodies, retained objects or stale effects.
- Interaction with manual helpers and existing sticker rewards. No additional economy or reward rule is selected by this request.

## Future acceptance and verification

- Demonstrate real, initially non-intersecting continuous chains of lengths 2, 3, 4 and 5, without artificial glue/joints. Every added member is a normal physical ring with a real hole and stable ID; individual collection leaves remaining members valid.
- Spawn each chain atomically and safely relative to walls, pegs, other bodies and the gravity fall path. Defer unsafe/crowded encounters rather than intersecting geometry or gifting peg insertion.
- Freeze scheduling during pause/background, serialize helpers, and clear pending encounters/bodies/effects on restart or disposal. Bound current load independently of cumulative collected progress.
- Verify repeat encounters, length limits, safe rejection, counting and empty-tank behavior, containment under pumping/inversion and long-session resource stability. Inspect chain readability and enjoyment in both models/all themes; label emulation versus real device evidence.
- Preserve the current finite modes' twelve starting rings, single late linked pair, fourteen-ring cap and persistent victory/new-game behavior.

Coverage: BL-17; requirements §25. Implementation checks and user acceptance are pending.
