# T22 — Explore mascot ring-assist powerups

Dependencies: T03, T08, T10, T11. Free lab/browser evidence is sufficient for exploration; unavailable hardware checks remain not run.

Read [AGENTS.md](../../AGENTS.md), [requirements section 17](../requirements.md#17-variable-pressure-and-arcade-experiments--october-20-2026), the [implementation guide](../implementation-guide.md), [module contracts](../module-contracts.md), and [task board](README.md). Planned only: recording this card starts no implementation or agents.

## Outcome and ownership

Prototype help for the difficult last few rings. An aquatic mascot appears and handles one loose ring. Compare two separately selectable assists: take a floor ring to a peg and thread it; or position it above a peg without inserting it.

Own a small lab-only assist controller/scene and mascot feedback. Coordinate physical movement, round events, session rules and rendering with their owners. This is an explicit proposed arcade mechanic rather than evidence that the unassisted physical game solves those rings itself.

## Work and acceptance

- Implement two distinguishable lab triggers for comparison: “thread one ring” and “position above a peg.” Select an eligible loose floor ring by stable ID and show the mascot's approach, movement and release. Do not silently affect several rings.
- Record the movement approach: physical guided motion where feasible, or an explicitly labeled scripted assist. Any bypass of ordinary collision/placement rules is an isolated, documented experiment; never silently weaken the baseline threading detector or claim assisted motion as a physics validation pass.
- For the positioning variant, release above the tip without awarding progress or fixing the ring to the peg; ordinary physics decides whether it enters. For the threading variant, prefer real threading and, in collect mode, real 0.12-active-second base contact before collection. If a candidate instead directly grants completion, declare and compare that rule exception explicitly.
- Handle no eligible ring, occupied/blocked destination, ring already collected, stale round IDs and a restart during animation safely. Pause/background freezes assist progress; cleanup removes mascot/effects without leaving an orphan constraint or locked body.
- Use a manual lab trigger first. Record proposals for availability, “few rings” threshold, charges/cooldown and mascot appearance across themes; none is agreed yet. No shop, paid resource or permanent economy is part of this card.
- Compare both models and modes. Assistance must not erase collected progress, celebrate twice, obscure pump controls or activate in ordinary play without selecting the experimental variant. Report assistance use separately from unassisted completion.

## Verification and handoff

Test both variants, actual versus unearned progress, no-target/blocked-target cases, duplicate triggers, round restart, pause and disposal. Inspect the mascot and release in browser; record whether each movement was physical or scripted. Run code checks and collect player feedback on whether the help reduces frustration without removing the challenge.

Coverage: BL-15; requirements section 17; experimental extension to RF-15, RF-25–RF-31 and section 13; baseline rules unchanged.
