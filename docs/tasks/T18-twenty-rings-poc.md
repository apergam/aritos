# T18 — Compare twelve and twenty rings

Status: **planned — deferred by the user after POC review**. The user deferred twenty rings after playing the comparison; reconsider enjoyment and crowding before another iteration. Historical implementation and evidence below are retained; there is no active assignment.

Dependencies: T04, T03, T11. Unavailable physical devices do not block exploration; record those checks as not run.

Read [AGENTS.md](../../AGENTS.md), [requirements section 16](../requirements.md#16-first-version-feedback-and-polish-backlog--october-20-2026), the [implementation guide](../implementation-guide.md), [module contracts](../module-contracts.md), and [task board](README.md) before assignment. The user subsequently selected this laboratory implementation; see current evidence below.

## Outcome and ownership

Test whether about twenty rings improve activity and enjoyment. Own a bounded lab count variant and focused model/session/physics checks; coordinate shared changes. Keep twelve as the player default until the comparison is accepted. This card does not implement an arbitrary count editor.

## Work and acceptance

- Compare twelve and twenty rings with the accepted geometry/tuning first, in both models and both modes. If T13 produces a narrower candidate, run that combination as a separate follow-up, not a confounded first comparison.
- Create non-overlapping valid starts and derive objective denominator, progress and victory from each round's initial count. Restart restores that exact count; removed collect-mode bodies do not shrink the objective.
- Demonstrate containment and sufficient physical stack capacity in classic mode for the candidate. If twenty cannot fit or causes jams, report it; do not shorten contact rules or award fake progress. Any geometry change is an explicit further candidate.
- Compare activity, congestion, completion feel and engine/render cost against twelve rings. Do not infer mobile performance from Node timing.
- Record whether twenty is viable, a smaller count is preferable, or twelve should remain. Production adoption requires user selection.

## Verification and handoff

Test initial count, collection invariants, once-per-round victory/restart and physical stacking/extraction for viable counts. Run a ten-minute simulated stress comparison and inspect drawn play in browser. Run code checks and record real-device FPS only if hardware is available.

Coverage: BL-03 (existing backlog, not a duplicate); requirements section 16; RF-04–RF-05 and classic criteria remain the twelve-ring baseline.


## Implemented laboratory candidate — October 20

The user selected twelve rings for normal play; twenty remains an opt-in laboratory comparison. Its measured capacity/stress evidence uses the historical width-9 floor layout and does not establish a twenty-ring capacity claim for the selected width-8 raised toy. See [the lab comparison](../validation/lab-experiments.md). Production count controls are not part of this task.
