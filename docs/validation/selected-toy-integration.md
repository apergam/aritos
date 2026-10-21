# Selected normal toy integration — October 20, 2026

The user selected width 8, raised pegs, both helper variants, and the villain mascot after trying their isolated laboratory POCs, then explicitly requested integration into the normal game. This report records that integration. Earlier laboratory measurements remain historical evidence for their original settings.

## Result

Normal `/` and controlled previews use `PLAYER_TOY_SETTINGS`: width 8, twelve starting rings, raised pegs at x ±1.7 with base heights −3.8/−2.2 and tip heights 0.55/2.15. Rendered walls, supports, pegs, jet outlets, bubble origins, rear illustrations and sticker bounds consume the same selected layout as physics. Depth remains 1.8, strength 75, damping 0.50, fixed 120 Hz physics and the 0.12 active-second physical base-contact collection rule. Classic retains physical rings and its stable threading rule.

The controls below the toy expose both accepted manual helpers: carry one loose floor ring to a clear peg/base, or release it above a peg. Scripted assistance preserves stable IDs and returns the body to dynamic physics; it does not dispatch a collection or victory shortcut. The second option can use an occupied peg if the release pose is clear. No charges, economy, automatic timing or new cooldown was added. Mascot actions serialize while their presentation/movement is active.

The manual villain adds one or two real red rings atomically, at most once successfully per round, with total objective 13 or 14. Failure to find space does not consume the successful encounter. Existing collected progress remains intact. Restart restores twelve and clears the encounter/helper state. The visual mascot and musical phrase use local assets/synthesis. The phrase honors both global sound and music toggles, briefly ducks the current theme loop, and stops/restores gain on pause, mute, reset or disposal. It does not restart the theme loop.

T18 (twenty rings) and T21 (variable pressure) return to the **planned, deferred** backlog for further design. Historical laboratory comparisons remain available. Neither count nor pressure controls are exposed in normal play. The width-9 floor-peg layout and exported baseline constants remain available for historical laboratory checks.

## Villain landing defect: reproduction and correction

Before correction, a deterministic test moved one existing body to block the first candidate at x −3.55. The next hard-coded candidate x −1.75 was almost centered on the left peg x −1.7. There was room above the tip, so the instantaneous fixture check accepted it; gravity then threaded the ring and physical base contact collected it without pumping.

Already-run RED command: `node --import tsx --test tests/enemy-landing.test.ts`.

Observed RED signal: `{ overlapsPegCatchment: true, collected: 12, won: false }`; expected `{ overlapsPegCatchment: false, collected: 11, won: false }`. The remaining blocker plus spawned ring and eleven previously collected rings are a minimal fixture for the fallback defect.

Ranked hypotheses were shown to the user before probes: (1) the finite shaft clearance omitted the falling catchment corridor, (2) candidate order exposed the peg-aligned fallback after a blocked first lane, (3) the horizontal starting pose and downward gravity completed real threading. Holding gravity/fixture constant and moving the blocker to a different candidate changed the chosen spawn from −1.75 to −3.55 and eliminated automatic collection, confirming the placement cause. Random launch impulses would only mask it and were not used.

Correction `1e84a17` derives side/center candidates and fixtures from each simulation's layout and checks full ring clearance and the projected gravity fall corridor. Follow-up `b993380` rejects paths whose full envelope would exit the tank or intersect a base/support, avoiding an unchecked bounce. Its RED regression previously accepted gravity `{x:3,y:-1,z:0}` with a projected landing beyond the wall; it now reports `no-safe-space`. No ring is spawned when the requested number of safe poses is unavailable. No collisions, scores or future player-controlled threading are disabled.

These checks prevent the reported direct spawn/drop gift under the checked initial gravity. They do not lock rings away from pegs: subsequent pumping, tilting or interactions remain ordinary gameplay. A blocked encounter explains how to center/clear space and retry.

## Automated verification

- `node node_modules/typescript/bin/tsc --noEmit`: passed.
- `node --import tsx --test tests/*.test.ts`: **145/145 passed**, zero failures/skips, about 33 seconds on this host. This includes the original physics soak, count/pressure historical comparisons, audio/music, lifecycle and sticker tests.
- `node build.mjs`: passed; local revision **20eb133f**.
- `git diff --check`: passed.

New/expanded evidence covers actual selected geometry (no patched test-only layout), valid twelve-ring starts, real collection at both raised bases, classic capacity and physical extraction for twelve/fourteen rings, containment/restart in both models/rules, both helper variants, and the exact villain landing defect. Combined mascot tests exercise all four model/rule combinations, serialization, pause freezing, cancelled pending encounters, dynamic body restoration before reset, silence and cue ducking/disposal. Projection checks keep stickers on the narrower tank.

## Browser verification

Tested the built normal `/` in the Codex in-app browser, with desktop sizing and temporary CSS viewport overrides **360×800** and **844×390**, then reset the override. These are browser viewport checks, not physical mobile-device acceptance.

- Two-button/Space collect: manual +2 changed 0/12 to 0/14; repeated villain controls disabled, both helper actions remained usable afterward. The thread helper collected through the normal contact rule; above helper released and subsequently physical play collected another ring.
- Two-button/Ocean collect: the mascot appeared alongside its carried ring; keyboard pause froze it, disabled mascot controls and displayed pause status; resume completed the help.
- Single-button/Capybaras classic: manual +1 changed 0/12 to 0/13; red ring and purple mascot were visible, with only the central pump. Restart returned to 0/12 and reenabled the encounter.
- Both responsive viewports had no horizontal page overflow. Pumps remained below the stage; optional mascot controls were below the pump/tilt controls and reachable by vertical scrolling. Landscape retained its stage and tilt layout rather than shrinking them to fit the extra panel.
- No browser console errors were reported during this pass.

Screenshots: [phone](evidence/selected-toy-phone.png), [landscape](evidence/selected-toy-landscape.png), [paused helper](evidence/selected-helper-paused.png), [normal villain](evidence/selected-villain-normal.png).

Real Android/iOS sensors, measured pressure, independent multitouch, sustained device FPS and subjective audio/mix acceptance remain untested. No paid service, deployment or push was performed in this iteration.
