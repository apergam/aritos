# Ring-chain investigation — October 20, 2026

## User observation and scope

The user observed two rings pulling one another during normal pumping, without using a mascot. After one ring was threaded and collected, it disappeared and the other continued independently. The user likes the interaction and suggested it might become a feature. This investigation preserves the current game; it does not change physics, collection, rewards or defaults.

**Conclusion:** a real geometric chain can form through a fast dynamic collision in the installed Rapier 0.19.3 simulation, even with CCD enabled. After that transition, ordinary collision response can keep the rings linked and transfer motion. This is a demonstrated mechanism consistent with the observation, **not a replay or confirmed cause of that exact user session**.

## Reproduction

Portable diagnostic:

```sh
node --import tsx scripts/diagnostics/ring-links/probe.ts
```

It uses the existing Simulation, approved width-8 raised layout, unchanged 20-capsule ring geometry, damping, solver iterations and default 1/120-second world step. The minimized fixture has two initially unlinked dynamic rings separated by a minimum collider distance of approximately **0.19689** units. One has a prescribed initial speed of **60 units/second** and an angular velocity; the other is initially stationary. There are no mascot calls, pumps, artificial joints or pose teleports during this collision. Prescribed speed is a stress fixture, not a claim about the user's measured input.

An independently checked detector counts signed crossings of one ring's polygon centerline through the other's spanning disk. It uses the actual 20-segment closed centerline and a convex polygon inclusion check, rather than screen overlap or just body proximity. Known linked, separated and frontal-overlap examples classify as 1, 0 and 0.

The fixture changes from linking number zero to −1 at **tick 14**, about **0.117 seconds**. It remains linked for the rest of the two-second observation. The ring collider chain is closed; adjacent capsules share endpoints. The evidence does not support an intentional physical opening between segments.

The intentionally failing invariant can also be run:

```sh
node --import tsx scripts/diagnostics/ring-links/probe.ts --assert-unlinked
```

Already-run RED output:

```text
AssertionError: Initially separate rings formed a chain during a dynamic collision
14 !== null
```

This is an opt-in investigation signal, outside the normal test suite. It intentionally fails on the retained behavior; it is not an unresolved acceptance test added to the release suite.

## Hypotheses and probes

Before comparative probes, the user was shown three ranked hypotheses: (1) a time-step crossing during a fast collision, (2) collision geometry approximation, (3) transient contact jamming rather than a genuine chain. The reduced two-ring fixture made a historical bisection unnecessary for establishing this mechanism; there is no evidence yet about which commit first allowed the user's encounter.

Changing one parameter at a time produced:

| Fixture variation | Chain formed during two seconds? |
| --- | --- |
| Current 120 Hz / one CCD substep / initial speed 60 | Yes, tick 14 |
| Same fixture, half initial linear speed (30) | No |
| Same fixture, quarter initial linear speed (15) | No |
| Same fixture, 240 Hz world step | No |
| Same fixture, 480 Hz world step | No |
| Same 120 Hz fixture, maximum CCD substeps 4 | No |
| Same 120 Hz fixture, maximum CCD substeps 8 | No |

These results support a numerical collision crossing in this fixture. They do not establish that more substeps universally prevent chaining, nor that a new accuracy/performance setting should be adopted. Rapier's [integration parameter documentation](https://rapier.rs/docs/user_guides/javascript/integration_parameters/) describes missed fast-object collisions between time steps and the accuracy/performance tradeoff. That currently published guide covers a newer release; the results above were measured on the repository's installed **0.19.3**, not inferred from the latest guide.

A second isolated fixture takes the resulting linked poses, zeros both velocities and moves the pair away from fixtures. It applies upward impulse **only to ring A** for one second and observes two seconds total. Ring B rises approximately **1.08 units**, and the pair remains geometrically linked throughout. Both impulse-joint and multibody-joint counts are **zero**. This rules out mere screen overlap and demonstrates sustained contact coupling in the reproduction.

Removing ring A's rigid body and colliders leaves exactly one valid ring body continuing independently. This mirrors the existing `collectAtBase` lifecycle: collection removes the collected body's colliders; there is no separate attachment to release or a second ring to collect automatically. It explains why the user can free its partner by scoring one ring.

## Limits of the diagnosis

Four initial scenarios (alternating pumps, rapid pumping, inclination and a helper comparison) ran sixty simulated seconds each without detecting a chain. Thirty further deterministic scenarios ran thirty simulated seconds each, also without a detected chain. These searches covered approximately **19 simulated minutes**, not an exhaustive set of player inputs, timings or prior states. Some requested helper actions were rejected because no eligible floor ring was available; these comparisons do not establish helper safety.

Additional normal-layout pumping measurements reached maximum individual speeds of about 14.56, 19.78 and 41.05 units/second with alternating pulses every 0.75, 0.167 and 0.05 seconds respectively. The last is deliberately extreme input. These figures do not prove that the user's rings collided at the stress fixture's relative speed; the session has no saved pose/input replay.

The exact formation sequence in the user's session remains **unreproduced**. A future replay/capture would be needed to attribute that particular encounter confidently. No claim is made about frequency, mobile performance or the effect of changing solver settings across the complete game.

## Feature candidate, not an implementation decision

The appealing mechanic is a pair that moves as a chain until one member is collected, freeing the other. A future isolated POC could start a deliberately linked pair, keep ordinary physical motion/collection and compare enjoyment or a chain bonus. Intentional linked starts would make the experiment reproducible. Formation rules, frequency, scoring and user acceptance are open; no new reward, automatic linking or release rule is authorized by this investigation.

## Verification

The portable diagnostic passes its detector sanity checks, all seven collision comparisons, the force-transfer assertion and body-removal continuation check. Its explicit `--assert-unlinked` mode fails as documented. Direct strict TypeScript checking of both diagnostic files passed. Output measurements are retained in [ring-chain-results.jsonl](ring-chain-results.jsonl).

Production source, build20eb133f, accepted tuning and current running page are unchanged. No deployment or push was performed. The existing 145-test release result remains historical; the complete suite was not repeated for this documentation/standalone-diagnostic change.
