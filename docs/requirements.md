# Water Ring Toy — Requirements

Version 1.0 · October 18, 2026

Product definition established through the grill-me interview. Working title; final branding has not been selected. This document defines the first release; it does not imply that the game has already been implemented or tested.

English translation prepared after the POC was accepted on October 19, 2026. Requirement IDs and product decisions are preserved. Sections 6–7 describe the original feasibility stage; sections 13–14 record the subsequent implementation and acceptance. The game interface remains in Spanish.

## 1. Goal

Recreate the water toy experience in a browser: press buttons to propel rings, tilt the tank, and thread rings onto pegs. It should feel like a physical object with depth, water, and solid pieces, while offering an enjoyable challenge.

Tilting and physical 3D threading are essential from the first release. The water effect is an approximation; a scientific fluid simulation is not required.

## 2. First-release scope

- Single-player classic game, with no time limit or lives.
- Browser-based, primarily for phones and tablets, with functional desktop support.
- Portrait and landscape layouts, preserving the current round when orientation changes.
- Two predefined toy models: one central button or two side buttons.
- Two pegs and twelve rings per round.
- Ocean, space, and capybara themes, compatible with both models.
- 3D physics, a fixed front camera, pumping, and tilting.
- Subtle sound effects, pause, help, restart, and local preferences.
- A themed celebration with a dancing mascot and confetti.
- Access through a link, without accounts or a game-session server.

## 3. User flow

1. Open the link and load the required resources.
2. Choose a toy model and a theme. Restore preferences when available; if there is no model preference, initially offer the two-button model.
3. Show brief help in Spanish: pump, tilt, and thread the rings.
4. Offer motion control. Request permission only when the browser requires it and only from an explicit user interaction. If permission is denied or usable data is unavailable, allow play using alternative controls.
5. Play without a timer. Pumping and tilting can alternate or happen simultaneously.
6. Open settings to pause and change theme, sound, or control mode, recenter the tilt, or restart.
7. Celebrate when the objective is completed, then allow continued play or restart.
8. To change models, leave the round and select another model. Do not change its number of buttons during a round.

## 4. Functional requirements

### 4.1. Models, tank, and rings

| ID | Requirement |
| --- | --- |
| RF-01 | Each model defines a fixed number of buttons and the layout of its jets. |
| RF-02 | The one-button model uses a central pump; the two-button model uses a jet associated with each side. |
| RF-03 | Changing themes does not change the model or its mechanics. |
| RF-04 | Each round contains twelve rings and two pegs. There are no color restrictions or required distribution between pegs. |
| RF-05 | Peg geometry and capacity must allow the objective to be completed with all twelve rings. |
| RF-06 | The tank is shallow, enclosed, and three-dimensional. Rings stay inside it, including when it is inverted. |
| RF-07 | Rings translate and rotate freely in three dimensions, colliding with each other, the pegs, and the tank walls. |
| RF-08 | The hole in each ring exists in its collision representation, not only in its visual geometry. |
| RF-09 | Threading requires a peg to pass through the hole. Screen-space overlap or intersection with the outside of a ring is insufficient. |
| RF-10 | A threaded ring remains a physical body: it stays visible and can come off through pumping or tilting. It is not held by an artificial lock. |

### 4.2. Pumping and the water effect

| ID | Requirement |
| --- | --- |
| RF-11 | Each press produces one pump pulse. Holding a button does not repeat pulses or produce a continuous jet. |
| RF-12 | The two-button model supports simultaneous presses through multitouch and equivalent desktop inputs. |
| RF-13 | Each jet affects rings according to their location; it does not lift every ring with an identical displacement. |
| RF-14 | Motion conveys water resistance: deceleration, slow falling, rotation, and a gradual response to pulses. |
| RF-15 | Subtle assistance may make threading easier, without teleporting rings, ignoring collisions, locking rings onto pegs, or automatically awarding progress. |
| RF-16 | Peg geometry and local jet attenuation provide some stability for threaded rings while still allowing their removal. |

### 4.3. Tilting and inputs

| ID | Requirement |
| --- | --- |
| RF-17 | The main control on compatible devices uses physical orientation, including sideways and forward/backward tilt. |
| RF-18 | The toy can be placed on its side or upside down. The effective gravity direction responds in three dimensions. |
| RF-19 | Recenter defines a comfortable reference posture while preserving the ability to tilt and invert the toy afterward. |
| RF-20 | A touch alternative supports the same play orientations, including inversion. Left/right controls alone are insufficient. |
| RF-21 | Desktop supports pumping through buttons and keyboard, and orientation through keyboard or an equivalent control. Help displays the shortcuts. |
| RF-22 | Denied permission, missing sensors, or missing usable events do not prevent play. Explain how to use the alternative controls. |
| RF-23 | When switching between portrait and landscape, adapt the control mapping and preserve the rings and their state without introducing spurious impulses. |
| RF-24 | Pumping and alternative orientation controls work simultaneously. Game gestures must not accidentally scroll the page. |

### 4.4. Victory and celebration

| ID | Requirement |
| --- | --- |
| RF-25 | The objective is to keep all twelve rings threaded simultaneously for two continuous seconds of active simulation. |
| RF-26 | If a ring comes off before that interval completes, restart the stability check. Paused time does not count toward victory. |
| RF-27 | Completing the objective displays a dancing mascot and confetti. The celebration neither blocks controls nor obscures the rings enough to prevent play. |
| RF-28 | Theme mascots are an octopus for ocean, an astronaut for space, and a capybara for capybaras. |
| RF-29 | Confetti and celebration effects disappear automatically. Their exact duration is tuned during visual polish. |
| RF-30 | Celebration occurs once per round, even if rings subsequently come off and are threaded again. |
| RF-31 | Play may continue after victory, or the player may restart. Restart enables a new celebration in the new round. |

### 4.5. Themes and appearance

| ID | Requirement |
| --- | --- |
| RF-32 | The appearance represents a physical toy: transparent housing, a water-filled tank, buttons, and solid rings. |
| RF-33 | Include three complete themes: ocean, space, and capybaras. |
| RF-34 | Each theme works with both toy models. |
| RF-35 | Theme definitions in code configure the theme concept, housing and button colors, background, ring palette, and mascot. |
| RF-36 | The player selects complete themes. The first release does not include a free-form color or background editor. |
| RF-37 | Changing themes preserves physical state and progress. It does not recreate the round or change collision geometries, forces, or difficulty. |
| RF-38 | The front camera is fixed relative to the toy; free camera navigation is not included. Ring rotation must make depth perceptible. |

### 4.6. Menu, audio, and persistence

| ID | Requirement |
| --- | --- |
| RF-39 | The interface and initial help use Spanish and brief instructions. |
| RF-40 | The menu supports pause, theme selection, enabling or muting effects, control mode management, recentering tilt, and restart. |
| RF-41 | Opening the menu pauses physics. Restart requires confirmation and can be canceled without losing the round. |
| RF-42 | Backgrounding the browser or changing tabs pauses simulation. Returning preserves the round without simulating all elapsed background time at once. |
| RF-43 | Include gentle pumping, water, and celebration effects, without background music. |
| RF-44 | Remember theme, model, sound, and control preferences locally. Basic operation must not depend on storage being available. |
| RF-45 | Closing or reloading the game starts a new round. Do not persist positions, velocities, or progress across openings. |

## 5. Technical and quality requirements

| ID | Requirement |
| --- | --- |
| RT-01 | Implement in TypeScript. |
| RT-02 | Use an existing 3D physics engine. Building a custom engine is out of scope. |
| RT-03 | Adopt Rapier 3D as the initial physics candidate, subject to the feasibility prototype described below. |
| RT-04 | Separate physics, round rules, inputs, rendering, model definitions, and theme definitions. |
| RT-05 | Apply pumping, resistance, and the water effect through engine forces, impulses, and parameters. A full fluid solver is not required. |
| RT-06 | Use a stable physics timestep independent of drawing frequency, and limit catch-up after pauses. |
| RT-07 | Prioritize Chrome on Android and Safari on iPhone/iPad. Keep functional controls in desktop browsers. |
| RT-08 | Adapt the layout to phones and tablets in portrait and landscape, with comfortable buttons and no clipping of essential controls. |
| RT-09 | Aim for 60 FPS and accept a sustained minimum of 30 FPS on the registered reference devices. Record model, operating system, browser, and graphics settings; do not extrapolate to every device. |
| RT-10 | Reduce reflections, particles, and confetti first when needed for smooth rendering, preserving rules and stable physics. |
| RT-11 | Serve over HTTPS for normal sensor access and detect actual browser capabilities. An initial connection is required to load the game. |
| RT-12 | After all round resources are loaded, play does not depend on server requests. Include assets for all three themes so theme changes do not require connectivity. |
| RT-13 | Do not add accounts, multiplayer, or a game-session backend to the first release. |
| RT-14 | Pin dependency versions during implementation and record those used in testing. |

The concrete devices and versions in the test matrix must be recorded while preparing the prototype, before accepting performance or compatibility. This is pending technical validation, not a claim of already verified compatibility.

## 6. Engine decision and p5.js review

### Conclusion

p5.js can render this project using WebGL, including 3D rings with `torus()`, materials, lighting, and a camera. Its main API does not supply the required 3D rigid-body dynamics and collisions as a replacement for the chosen engine. Rapier therefore remains the physics candidate, following the user's authorization to use it if p5 does not cover that role.

p5.js and Rapier can play complementary roles: rendering and simulation. Integrating them is an implementation possibility that had not yet been tested at the time of this decision. The renderer would be selected during the prototype; p5.js remained a viable option, neither a mandatory dependency nor a rejected library.

| Reviewed option | Role and conclusion |
| --- | --- |
| Rapier 3D | Initial physics candidate, with rigid bodies, collisions, and compound shapes. Validate against actual ring geometry. |
| cannon-es | Existing alternative; its matrix documents collision limitations between certain shapes. Not the initial choice. |
| Ammo.js / Bullet | Existing alternative with a Bullet-derived API. Its integration was considered less convenient for this scope. |
| p5.js | A 3D rendering option, not a complete substitute for the required physics. |
| p5play | Its Box2D-based physics is 2D and does not meet the agreed 3D dynamics requirement. |

### Initial collision approximation

Evaluate one rigid body per ring, composed of several convex pieces around its circumference, preserving the hole. Do not turn the whole ring into one convex hull. Rapier recommends convex decomposition for moving non-convex bodies.

At the time of the original specification, this was an implementation hypothesis awaiting validation. It had not yet demonstrated that the discretization was smooth enough for threading, stacking, and removing rings without artificial snagging. See section 14 and `POC_REPORT.md` for subsequent results.

## 7. Required prototype before visual polish

The first implementation deliverable must include:

- A closed tank with simple geometry and a front camera.
- Two pegs and twelve rings with physical holes.
- Both pump models.
- Orientation control and alternative interaction, including inversion.
- Approximate water resistance and threading detection.
- Collision-shape visualization and development performance measurements.

It must demonstrate threading, stacking, removal, stability, and smooth operation. If evaluation fails, adjust geometries, timesteps, parameters, and collision approximations. If significant problems persist, evaluate another existing engine. Do not address them by creating a custom engine or replacing threading with a predetermined animation.

### Acceptance criteria

| ID | Test | Required result |
| --- | --- | --- |
| CA-01 | Drop an aligned ring over a peg and a misaligned ring beside one. | The first can thread; the second collides or falls without receiving false progress. |
| CA-02 | Move a ring in front of and behind a peg. | Depth determines contact; screen-space overlap does not mean threading. |
| CA-03 | Stack rings and tilt or invert the tank. | Rings can physically come off without artificial locks. |
| CA-04 | Pump repeatedly and on both sides simultaneously. | Jets respond locally and multitouch works; holding a button does not repeat pulses. |
| CA-05 | Observe ring and wall interactions during pumping and inversion. | No observed escapes, reproducible tunneling, persistent vibration, or rings stuck due to errors. |
| CA-06 | Play continuously for ten minutes with twelve rings. | No accumulating instability or lost bodies. Maintain at least 30 FPS on registered reference devices, without prolonged drops below that threshold. |
| CA-07 | Compare play at different drawing frequencies. | Simulation speed and the two-second victory interval remain consistent. |
| CA-08 | Deny permission and test an environment with no orientation data. | Pumping, play, and inversion remain possible through alternative controls. |
| CA-09 | Switch between portrait and landscape and recenter control. | The round is preserved, controls remain accessible, and orientation responds coherently. |
| CA-10 | Evaluate the water effect and the ability to complete the objective. | The user validates that pumping, falling, rotation, and tilt recall the toy and make threading enjoyable. |

## 8. Full-release acceptance

| ID | Test | Required result |
| --- | --- | --- |
| CA-11 | Run every combination of two models and three themes. | All six combinations work, with mechanics independent of appearance. |
| CA-12 | Change themes with some rings threaded and others moving. | Bodies, positions, velocities, and progress are preserved when play resumes. |
| CA-13 | Keep twelve rings threaded for less than two seconds, then remove one. | No celebration; the interval restarts. |
| CA-14 | Keep twelve rings threaded for two continuous active seconds. | The correct mascot dances and confetti appears; play remains possible. |
| CA-15 | Remove and reinsert rings after celebrating, then restart. | No repeated celebration in the same round; a new round can celebrate again. |
| CA-16 | Open settings or background the app. | Physics and the victory interval pause; returning causes no sudden catch-up. |
| CA-17 | Request restart and cancel confirmation. | Canceling preserves the round; confirming starts twelve rings and resets celebration. |
| CA-18 | Close and reopen the game. | Preferences are restored and a fresh round starts without restoring previous positions. |
| CA-19 | Mute, change themes, and reopen. | The sound preference is respected; no background music is introduced. |
| CA-20 | Disconnect after complete loading and switch themes. | Play and theme switching continue with already loaded resources. |
| CA-21 | Open the link across the registered platform and orientation matrix. | Loading succeeds, controls are usable, and sensors or alternatives are verified according to actual capabilities. |

Reviewing library documentation does not replace these tests. No criterion is considered passed merely because an API exists.

## 9. Explicit backlog

| ID | Future feature |
| --- | --- |
| BL-01 | Time-trial mode. |
| BL-02 | A mode where a threaded ring disappears and accumulates progress. Keep it separate from classic mode. |
| BL-03 | Configurable number of rings per round; the next bounded experiment compares twelve with about twenty (T18). |
| BL-04 | A customization editor mixing theme colors, backgrounds, and other elements. |
| BL-05 | Physically shake the device to agitate the water. |
| BL-06 | Web app installation and opening without a connection. |
| BL-07 | Narrower toy / less horizontal travel comparison (T13). |
| BL-08 | More rewarding collection sound: coin-like or sparkling (T14). |
| BL-09 | Theme-specific, reusable looping background music (T15). |
| BL-10 | Illustrated inserts on the rear plastic for each theme (T16). |
| BL-11 | Theme-specific ring colors/materials/decorations (T17). |
| BL-12 | Earned stickers that can be placed on the toy (T19). |
| BL-13 | Laboratory experiments with raised/offset pegs and bases (T20). |
| BL-14 | Variable pump pressure/intensity POC, with honest hardware capability detection and practical fallback (T21). |
| BL-15 | Aquatic mascot powerups: thread a floor ring, or position it above a peg without insertion (T22). |
| BL-16 | Villain encounter adding one or two red/bright physical rings, accompanied by villain music (T23). |

The first release excludes a custom physics engine, accounts, multiplayer, and a game-session server. A scientific fluid simulation is not part of the defined product requirements either. Section 13 records the subsequent promotion of BL-02 into the POC.

## 10. Delivery order

1. Physics prototype and Rapier validation; renderer selection.
2. Complete controls, round lifecycle, pause, and victory.
3. Toy models, themes, and preferences.
4. Sound, dancing mascots, confetti, and polish.
5. Functional, compatibility, and performance validation on registered devices.

Each stage preserves previously passed criteria. Visual polish cannot substitute for resolving physics.

## 11. Decision traceability

| Interview questions | Consolidated decision |
| --- | --- |
| 1, 5, 26 | Classic play through a link, without accounts; initial connection and local play. Time limits and offline opening go to the backlog. |
| 2, 6, 24 | Mobile/tablet priority; portrait and landscape; Chrome Android and Safari iOS/iPadOS; functional desktop support. |
| 3, 9, 14, 21 | 3D physics with subtle assistance, real holes, possible removal, and full inversion. |
| 7, 11, 16, 20 | Predefined one/two-button models; one pulse per press; themes independent of mechanics. The earlier proposal to change button count in settings was superseded. |
| 8, 13 | Tilting in the first release. Deferring it was rejected. |
| 10 | Twelve rings and two pegs; configurable counts go to the backlog. |
| 12, 19 | Switchable themes without losing the round: ocean, space, and capybaras. Pastel was superseded. |
| 15, 22 | Victory after two stable seconds, themed dancing mascot and confetti, without blocking play. |
| 17, 18, 23 | Local preferences, no persisted round, pause, Spanish interface, and effects without music. |
| 25, 27 and p5 review | TypeScript, prototype first, existing engine. Rapier for physics; p5 viable for rendering, with renderer selection during the prototype. |

## 12. Technical sources consulted

Consulted on October 18, 2026. Product decisions come from the interview; these sources support the tools' capabilities. They are historical references, not evidence of device compatibility.

- [p5.js — WebGL](https://p5js.org/reference/p5/constants/WEBGL/): 3D rendering, materials, lighting, and camera.
- [p5.js — torus](https://p5js.org/reference/p5/torus/): visual ring geometry.
- [p5.js — reference](https://p5js.org/reference/): scope of its main API.
- [p5play — World](https://p5play.org/learn/world): Box2D-based simulation.
- [Box2D — Overview](https://box2d.org/documentation/): scope of 2D physics.
- [Rapier — Getting started](https://rapier.rs/docs/user_guides/javascript/getting_started_js/): JavaScript/WebAssembly integration.
- [Rapier — Colliders](https://rapier.rs/docs/user_guides/javascript/colliders/): geometries and moving non-convex bodies.
- [Rapier — Rigid bodies](https://rapier.rs/docs/user_guides/javascript/rigid_bodies/): forces, damping, and continuous collision detection.
- [cannon-es — documentation](https://pmndrs.github.io/cannon-es/docs/index.html): shape types and collision matrix.
- [Ammo.js — official repository](https://github.com/kripken/ammo.js): Bullet integration.
- [W3C — Device Orientation and Motion](https://www.w3.org/TR/orientation-event/): secure contexts, orientation, and permissions.

## 13. POC iteration — October 19, 2026: accumulated progress

At the user's request, BL-02 is brought forward into the POC as a separate mode, “Guardar al llegar a la base” (collect at the base), initially selected in the laboratory. RF-10 and RF-25/RF-26 continue to describe classic mode, which remains available.

In collect mode:

- A ring must thread physically and touch a pedestal for 0.12 continuous seconds of active simulation before disappearing.
- Disappearing removes the rigid body, its colliders, and its visual mesh, adding one unit to accumulated progress. Pumping or inversion never subtracts already collected rings.
- A loose ring on the floor, resting on a pedestal without threading, or visually overlapping a peg does not award progress.
- The objective is to collect all twelve rings; diagnostic scenes use their initial ring count as the objective. That denominator stays fixed even as fewer bodies remain.
- Victory occurs on collecting the last ring, once per round. Restart restores rings and clears progress. Changing mode, model, or scene restarts the experiment.
- Classic mode retains its rings, free removal, and victory after two simultaneous stable seconds; accumulated progress does not replace its rule.

This iteration originally still required user playtesting to accept its feel and difficulty; section 14 records the subsequent POC acceptance. The original classic specification is retained as a reference.

## 14. POC completion — October 19, 2026

The user accepts the POC with pump strength **75**, water resistance **0.50**, and collect-at-the-base as the initial mode. Classic mode remains defined in this document and available in the laboratory. Completion validates the prototype experience with the user; it does not accept the entire full release or compatibility/performance criteria requiring real mobile devices. The scope of the next implementation iteration will be agreed separately.


## 15. Free parallel validation decision — October 19, 2026

The user authorized replacing the T06 real-device development gate with a no-cost validation task that runs alongside the remaining implementation. T06 completion is not a prerequisite for the player interface, themes, audio, celebration or production integration. Their code dependencies still apply.

Use automated tests, desktop viewport/touch/sensor emulation and practical local emulators as the baseline. Free physical-device quotas or borrowed/user-owned phones may add evidence when available; no paid subscription, billing activation or paid overage is authorized. Missing hardware must not become a new blanket development blocker.

Record each result as automated, desktop/emulator or actual-device evidence, with pass/fail/not-run outcomes. Physical calibration/inversion, independent simultaneous touches, real browser permissions and sustained mobile FPS remain unaccepted until tested on suitable actual hardware. The RF/RT/CA criteria remain intact; this changes execution order and access policy, not what has been proved. T12 may produce a readiness report with explicit not-run criteria, without claiming full mobile acceptance.

This documentation update starts no new workers or implementation; work resumes when the user returns in the next session.


## 16. First-version feedback and polish backlog — October 20, 2026

The user praised the integrated first version and requested recording a polish backlog. This is user feedback on the version, not proof of acoustic quality, full mobile compatibility or completion of every acceptance criterion. Existing physical-device gaps and T09 listening review remain explicit. This request adds planned work; it does not authorize starting these implementation tasks now.

| User idea | Planned task | Scope / decision still needed |
| --- | --- | --- |
| A narrower toy to reduce long horizontal travel and repetitive waiting | [T13](tasks/T13-narrower-tank-poc.md) | Compare measured widths in the lab before selecting a new default. |
| More exciting disappearing-ring sound | [T14](tasks/T14-collection-reward-sound.md) | Audition coin-like and sparkling collection cues; preserve actual-event semantics. |
| Looping music matching each theme | [T15](tasks/T15-theme-music.md) | Locally included loops with documented reuse/distribution rights and seamless playback; no track selected yet. |
| A themed picture on the rear plastic | [T16](tasks/T16-themed-rear-inserts.md) | Underwater scene, capybara habitat, ships/planets; preserve visibility through the transparent toy. |
| Themed rings or different ring colors | [T17](tasks/T17-themed-rings.md) | Start with appearance; physical hole/dimensions remain consistent. |
| More rings, perhaps twenty | [T18](tasks/T18-twenty-rings-poc.md), existing BL-03 | Compare twelve and twenty, including classic capacity and performance; no new default yet. |
| Reward a sticker that the player can position on their toy | [T19](tasks/T19-sticker-rewards-poc.md) | Explore unlock rule, placement and local decorative persistence; reward cadence remains undecided. |
| Pegs/bases in positions other than the floor | [T20](tasks/T20-alternate-peg-poc.md) | New lab variants with explicit attachment and physical base contact; select after comparison. |

For the future music iteration, this request supersedes the earlier “without background music” scope in RF-43 and CA-19. Those entries and the first-version evidence remain historical references; mute, user activation and offline-after-load still apply. The music task must record actual asset provenance and licensing instead of treating “free” or “royalty-free” as a complete asset record. No paid purchases or subscriptions are requested.

T19 is a bounded extension to the earlier no-editor scope (RF-36), focused on earned stickers rather than a complete customization editor. New width/count/peg experiments do not silently replace the accepted 75 / 0.50 setup, depth 1.8, twelve rings and floor bases. Theme art and ring colors remain independent of mechanics. Task cards define comparison and handoff evidence; the board is the status source. No new workers were launched by this backlog update.


## 17. Variable pressure and arcade experiments — October 20, 2026

The user requested three further backlog additions, not immediate implementation:

| Idea | Planned task | Scope / open decisions |
| --- | --- | --- |
| Variable pumping pressure like the force of a real button press | [T21](tasks/T21-variable-pressure-poc.md) | Lab comparison of fixed and variable strength; establish supported pressure inputs or clearly labeled approximations, mapping and timing. |
| An aquatic helper mascot assists with the last few rings | [T22](tasks/T22-mascot-powerups-poc.md) | Compare taking a floor ring onto a peg versus positioning it above the peg without insertion. Availability, charges, trigger and movement method remain undecided. |
| A villain appears with villain music and adds one or two conspicuous rings | [T23](tasks/T23-villain-extra-rings-poc.md) | Bounded lab encounter with physical spawning and explicit objective updates; automatic timing/frequency and balance remain undecided. |

T21 retains a fixed-strength baseline and one pulse per intentional activation. It investigates force measurement versus an accessible approximation; ordinary input is not assumed to measure physical force. A charging/release control, if compared, must document its activation timing rather than silently changing RF-11 behavior.

T22/T23 introduce optional arcade experiments beyond the unassisted first version. T22 is a potential explicit exception to RF-15's no-automatic-threading scope: any scripted placement or awarded completion must be identified as assistance, confined to the experiment, and never presented as proof of natural physical threading. The “above the peg” variant does not itself award progress. The existing classic and collect paths retain their normal physics and contact criteria outside an explicitly documented assist exception.

T23 explicitly extends the initial/fixed-count assumptions in RF-04, classic victory criteria and section 13 for its experimental round only. Successfully added rings increase the objective; already collected progress is preserved. Classic stability restarts after adding rings. Failed spawns do not change the objective, and a completed round cannot be reopened by an encounter. Exact limits and ordering are part of the task's evidence, not changes already implemented in the current session contract.

Keep normal play and its accepted setup available unchanged. Compare pressure, powerups and enemies separately before combining them with width/count/peg changes. No new worker or code change is started by recording these ideas, and no paid asset/service or economy is requested.


## 18. Selected polish iteration — October 20, 2026

After recording sections 16–17, the user selected collection reward sound (T14), music (T15) and rear plastic illustrations (T16) for implementation. Geometry and arcade POCs are deferred to a later round. Workers use the requested `gpt-6-luna` / `high`; T14 and T16 ran in parallel and T15 followed the integrated audio base.

This implements the section 16 music extension: original local synthesized theme loops, global mute plus a saved independent music toggle, and two saved collection cue choices with explicit audition. T16 supplies bundled original SVG rear inserts. See [the polish report](validation/polish-audio-art.md) for current checks and listening limitations. T14/T15 remain in review for acoustic feedback; no paid service, external track, physics retuning or publication was introduced.


## 19. Theme music feedback — October 20, 2026

The user reported that changing theme appeared to leave the same music. Tests confirmed correct buffer selection through the settings pause/resume path but reproduced an identical opening between ocean and space. The revised candidate differentiates tempo, meter/register and instrument for each theme, and a new theme starts at its own phrase beginning. Pause, mute and round restart preserve musical position. This refines T15's recognizability; subjective acceptance of the revised music remains open. See [the current report](validation/polish-audio-art.md).


## 20. Matched illustrated rear panels — October 20, 2026

The user approved the replacement ocean and capybara rear illustrations and requested the same quality for space. T16 now supplies three locally bundled generated PNG panels, with quiet center space for readable rings/pegs. Mascots remain SVG; art changes do not change physical state, models, rules or music. The matched space candidate and provenance are recorded in [the art report](validation/art-refresh.md). This acceptance is visual feedback on ocean/capybaras, not mobile or acoustic validation.


## 19. Selected themed rings and earned stickers — October 20, 2026

The user selected T17 and T19 for implementation, followed by a feasibility review of T23 enemies. The integration owner selected this smallest reward rule for the candidate: the first genuine completed normal-player round in each theme unlocks that theme's one sticker (octopus, spaceship, capybara), with no currency, purchases or accounts. Rewards are global to this browser and usable across themes and both models. Repeat victories do not create duplicate stickers. Changing the theme of an already rewarded round does not award another.

Up to three stickers (one instance per unlocked design) can be placed, moved or removed on the toy front. Editing pauses physics and pumping. Normalized positions and unlocks persist locally across reloads; unavailable/malformed storage falls back safely. Restart resets only the round. Controlled previews use an explicitly nonpersistent sandbox and neither read nor write normal rewards. The existing game rules and physical ring hole/dimensions remain unchanged.

T17 compares the existing distinct theme palettes with glossy ocean, metallic space and satin capybara finishes, applied in place to stable ring meshes. It introduces no protrusions or collision changes. Both visual candidates await user feedback. T23 review does not authorize automatic enemies in normal play.


## 20. Remaining POCs selected for implementation — October 20, 2026

After approving the direction of T17/T19, the user explicitly requested starting the remaining POC work. This authorizes T13, T18, T20, T21, T22 and T23 as isolated manual laboratory candidates. It supersedes earlier backlog-only/review-only timing statements for those cards, without promoting experiments into normal play. See docs/validation/lab-experiments.md for exact dimensions and evidence.

The integration owner selected minimal bounded comparison rules: widths9/8/7, twelve versus20, the raised fixed-support layout, intensity.5–1.5 with.24-second pulses (fixed/levels immediate, charge/hardware on release, keyboard/unsupported pressure uses explicit fallback), manual scripted one-ring assists, and one manual enemy encounter adding1 or2 rings atomically to a maximum14. Helpers do not directly award progress; normal contact rules still decide. The thread-assist candidate conservatively needs a clear peg, while above-assist can release over an occupied stack if the target is clear. Scripted motion is explicitly labeled as assistance, separate from natural physics validation.

No automatic enemy timing, powerup economy, pressure hardware compatibility or subjective musical acceptance is inferred from implementation. The later normal-game selection is recorded in section 21; width 8/raised pegs and the bounded manual assists/enemy supersede the earlier statement that no candidate changed normal defaults. Twenty rings and variable pressure remain laboratory-only.


## 21. Selected normal-game integration — October 20, 2026

After comparing the laboratory candidates, the user explicitly selected the width-8 toy with raised pegs, both manual mascot-assist options, and one manual villain encounter per round for normal play. The selected geometry uses the real immutable `PLAYER_TOY_SETTINGS` layout, not a test-only geometry fixture. See [selected-toy integration evidence](validation/selected-toy-integration.md) for the recorded integration checks (145 passing tests and browser verification); do not infer these checks from the earlier laboratory report.

The production setup keeps twelve starting rings, pump strength **75**, water resistance **0.50**, and the selected initial collect-at-the-base mode. The villain may add one or two real physical rings once per round; the round objective follows successful additions and is capped at fourteen total. The two mascot actions remain explicit/manual. Their scripted movement is identified as assistance; the ordinary physics/contact rules decide collection, and positioning above a peg awards no progress by itself. These selected features are not automatic triggers or an economy.

T18's twenty-ring candidate and T21's variable-pressure controls remain opt-in laboratory comparisons. Normal play retains twelve rings and fixed strength 75; there is no production pressure slider. The original width-9/floor-peg arrangement remains the historical accepted POC baseline for comparison. Do not rewrite earlier measurements as if they were collected on the selected width-8 raised toy. User selection records the intended production behavior; it does not itself claim that integration or device acceptance checks passed.


## 22. Visible completed-round outcome — October 21, 2026

After reporting a 12/12 dead end, the user requested a noticeable celebration and a new-game action. A completed round must retain its success result and an accessible **Nueva partida** action after short effects finish. Derive completion from the existing won state; preserve real collection/classic victory rules and actual targets, including villain additions. The action starts a fresh twelve-ring round in the same model/mode/theme, keeps earned stickers/preferences and resets per-round mascots. Keep reduced-motion behavior and once-per-round celebration. See [verification](validation/round-completion.md).


## 23. Automatic linked villain — October 21, 2026

The user now authorizes the villain to appear randomly when one to five rings remain and to drop a chain. Normal play replaces the manual villain buttons with one automatic encounter per round, adding a **linked pair of two physical rings** (maximum fourteen total) and preserving already collected progress. The implementation chooses a random threshold from1–5 plus a1–3 active-second wait; crossing a skipped threshold is eligible. For collect, remaining means active rings; for classic, it means unthreaded rings. Pause/visibility, helper serialization, safe atomic spawning and post-win rejection remain mandatory. A failed unsafe attempt defers without consuming the encounter. The pair starts deliberately linked with non-intersecting collider material and no artificial joint; normal motion, threading and individual collection continue. No extra score/bonus is introduced. The prior manual-only timing restriction in sections20–21 is superseded for normal play; lab manual comparisons remain available. See [validation](validation/automatic-linked-villain.md).
