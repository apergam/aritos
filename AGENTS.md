# Aritos — project context and working agreement

Last consolidated: **October 28, 2026**. This file is the entry point for an agent joining or resuming the project. It describes current decisions; dated reports preserve earlier experiments and measurements.

## Read first and resolve context

1. Read this file and [README.md](README.md) for the product and local commands.
2. Read [the requirements](docs/requirements.md), especially the later amendments: §13 collection, §15 free validation, §21 selected geometry/helpers, §22 completed-round UI, §23 automatic linked villain, §24 mobile UI and §25 endless backlog.
3. Check [the task board](docs/tasks/README.md) and read the exact card selected by the user. The board owns task status; requirements own product decisions.
4. Read [the implementation guide](docs/implementation-guide.md), [module contracts](docs/module-contracts.md), and the relevant [validation report](docs/validation/). Inspect current source signatures before changing a contract: these documents include historical integration stages.
5. Read [the POC report](docs/POC_REPORT.md) when touching physics or interpreting its historical acceptance.

The user's latest explicit decision takes precedence over earlier project notes. Later requirements amendments supersede their earlier scope restrictions. Some historical sections still describe floor-mounted pegs, manual-only enemies, no music or an unfinished player; none is the current production rule. Preserve history as history, and update the current decision/evidence rather than appending contradictory instructions here.

## Product and current state

Aritos recreates a physical water-ring toy: pump water, tilt an enclosed transparent tank and thread freely moving rings onto pegs. It is a single-player static browser game, primarily for phones/tablets, with desktop and both screen orientations supported. The normal finite game has no clock or lives. There are no accounts, multiplayer or game-session backend. Use the existing physics engine; a custom engine and scientific fluid solver are outside scope.

- Stack: TypeScript, **Rapier 3D 0.19.3**, **Three.js 0.180.0**, esbuild. Keep the pinned dependencies and lockfile.
- Player-facing copy is **Spanish**. Requirements, task cards and technical documentation are **English**.
- Last gameplay commit: **`82c08fc`** (mobile redesign); compiled revision **`019e6188`**. A content build revision is not a Git commit ID. Documentation-only commits do not change that compiled behavior.
- Last recorded full verification: **160/160 tests**, TypeScript/build/diff checks and ten desktop-browser viewport checks, recorded in [mobile interface evidence](docs/validation/mobile-interface.md). This is the latest recorded checkpoint, not a claim that every future checkout has been retested.
- The user accepted the physics POC on October 19, selected width 8/raised pegs/helpers for normal play, and praised the automatic mischievous mascot. The new mobile layout still awaits physical Pixel feedback; endless mode is backlog only.

### Entry points

| Entry | Purpose |
| --- | --- |
| `/` | Normal Spanish player: setup, model/theme/mode choice, Jugar, gameplay and settings. |
| `/lab.html` | Preserved physics POC and isolated experimental comparisons. Camera/tuning/debug/diagnostic controls belong here. |
| `/preview.html?scene=stack` | Controlled physical player preview for repeatable collection/classic victory checks. Also supports `free`, `drop`, `depth`. |

Scene query parameters on `/` must not change normal play. Preview sticker rewards use an isolated, nonpersistent sandbox and never read/write normal sticker data. Preview model/theme/audio choices still use normal preferences: restore user preferences after tests. Do not manufacture player progress or permanent rewards to make a validation screenshot.

## Accepted gameplay: preserve these decisions

### Geometry and pumping

| Setting | Current normal player |
| --- | --- |
| Starting rings / pegs | 12 rings, 2 pegs |
| Tank | Full interior width **8**, height **12**, depth **1.8** |
| Ring | Outer diameter **1.3**; real hole, compound collider of 20 capsules |
| Peg arrangement | **Raised**, staggered bases, with fixed physical supports connecting to the rear plastic |
| Pump strength / water drag | **75 / 0.50** |
| Pulse / physics step | **0.24s**, fixed **120Hz**, bounded catch-up (maximum 12 steps/frame) |
| Models | Two independent side buttons, or one central button; button count/outlets belong to the model |
| Side jets | Low on the sides, aimed inward/upward, with a weak bottom return influence during the pulse |

Use `PLAYER_TOY_SETTINGS` / `PLAYER_TOY_LAYOUT` from [selected-toy.ts](src/models/selected-toy.ts) in normal composition and rendering. Use `Simulation.layout` for per-instance physical bounds, pegs, bases, supports and jets. The exported width 9/floor `TOY_PHYSICS` and compatibility constants remain the **historical POC baseline**; do not use them to restore width 9/floor geometry in the player.

One intentional press produces one pulse. Holding does not repeat. Preserve simultaneous side input, keyboard equivalents and pointer/keyboard cancellation on release, blur, hiding and teardown. Themes must not affect mechanics. Variable pressure and twenty starting rings are not production defaults.

### Physical rules and the two finite modes

- Rings translate/rotate in 3D, collide with one another and all fixtures, and remain enclosed even when inverted. A screen-space overlap with a peg is not threading.
- Do not fake insertion using teleportation, invisible locks, collider filtering or artificial joints. The explicitly selected helper route is the limited scripted-assistance exception described below; normal threading/collection still decides progress.
- **Guardar al llegar** (`collect`) is the initial mode. A ring must physically thread and contact a pedestal for **0.12 continuous active seconds**. Only then remove its body/colliders/mesh and increase accumulated progress. Floor contact elsewhere does not count. Pumping cannot lose already collected progress.
- **Modo clásico** retains all rings as dynamic bodies. All current rings must remain threaded for **two continuous active seconds**. Losing a ring resets that interval. Paused time never counts.
- Track dynamic targets correctly after successful villain additions. Preserve collected progress and `active + collected = total`; never hard-code the completed objective to 12 when the actual target is 14.
- Victory is once per round. Keep a persistent result with **Nueva partida** after transient celebration effects expire. Reconcile visual celebration idempotently from `snapshot.won`; do not rely solely on receiving a transient event.
- Nueva partida restores twelve rings, keeps the current model/mode/theme and earned stickers/preferences, resets mascots and clears manual pause. Ordinary restart retains the existing manual-pause behavior; canceling confirmation must preserve the round. Reload restores preferences, not physics, progress, mode or pause state.

### Tilt, lifecycle and mobile interface

- Preserve full 3D tilt, both sideways and forward/back axes, including complete inversion, calibration/recenter and a manual fallback.
- Sensor activation/permission is explicit. A saved motion preference never authorizes an automatic prompt. Denied/missing/invalid/silent sensor data must leave a usable manual path.
- Model changes go through setup and start a new round. Theme/sound changes preserve the current round. Changing screen orientation preserves state and gravity mapping without introducing a pump impulse.
- Keep independent pause reasons (`menu`, `manual`, `document-hidden`, `restart-confirmation`, `decoration`). Removing one must not resume through another. Reset frame accumulation on pause/round/visibility transitions; returning from a hidden page must not replay elapsed hidden time. Preserve bfcache/disposal cleanup.
- Pumps remain **below** the toy and reachable without scrolling during compact play. Current compact layout covers widths ≤1100px or heights ≤600px, uses dynamic viewport height/safe areas, and keeps tilt/mascot tools in a nonmodal, on-demand panel. Opening tools does not pause or remove pump access.
- Preserve both manual axes, invert/recenter and explicit motion activation inside the panel. Keep Escape/focus return and a sticky close action when the panel scrolls. Essential compact actions target at least 44px.
- Landscape shares progress with the header and uses side space for tools when possible. Setup uses compact choices and illustrated theme previews. Do not restore permanently expanded mobile panels or fixed-height scenery that shrinks the toy.
- Player camera elevation remains **0.7 degrees**, not radians. `fitToyCameraDistance` fits the complete acrylic shell with edge margins; resize/ResizeObserver also refreshes sticker projection. Camera experimentation remains lab-only.

## Mascots and linked rings

### Manual helper

The two normal helper actions are **Ensartar un aro** and **Soltar sobre estaca**. The first guides a floor ring toward physical base contact; the second releases above a peg without directly awarding progress. Clearly treat their route as scripted assistance. Reject ineligible targets or blocked destinations. Serialize helper/villain activity, freeze a carried ring correctly during pause, and restore its dynamic state before replacing/freeing a world.

### Automatic mischievous mascot: current finite game

Normal `PlayerMascots` opts into the automatic schedule; historical manual/lab callers remain distinct.

- Once eligible, choose a per-round remaining-count threshold **1–5**, then a **1–3 active-second** wait after reaching/crossing it. Skipped counts still qualify. Collect counts active rings; classic counts unthreaded rings. This is not a render-frame lottery or wall-clock timer.
- At most **one successful appearance per finite round**, adding exactly **two already-linked physical rings**, increasing 12 to a maximum 14. Preserve previously collected progress. Never spawn at zero remaining, after victory, during pause/hidden time or over an active helper.
- Validate both poses and projected gravity fall corridors against walls, pegs, bases, supports and active bodies. Add atomically at a safe fixed-step boundary. No peg-aligned fallback or free insertion. An unsafe automatic attempt retries after one active second without consuming the encounter or playing its success cue.
- The deliberately linked pair starts with disjoint collider material and no joint/glue/runtime pose constraint. Contact physics couples them; collecting one removes only that member and leaves the survivor dynamic.
- User gestures unlock cue audio. Respect global/music gates, music ducking and cancellation on pause/mute/reset/dispose. Restart clears schedule, pending encounter, linked additions and presentation.
- Lab +1/+2 triggers remain manual and unlinked. Do not restore them as the normal player interface.

See [the automatic encounter report](docs/validation/automatic-linked-villain.md) and source in [player-mascots.ts](src/game/mascots/player-mascots.ts), [villain-schedule.ts](src/game/mascots/villain-schedule.ts), [enemies.ts](src/lab/experiments/enemies.ts) and [linked-rings.ts](src/physics/linked-rings.ts).

### Emergent chain investigation

The user also observed and liked two normally pumped rings becoming linked, then separating when one was collected. A high-speed diagnostic demonstrates a numerical collision-crossing mechanism consistent with it; the exact user session was **not** reproduced. Do not report the stress fixture's prescribed speed as measured player input or silently change solver/substeps to remove the interaction. The intentional villain pair does not require tunneling.

[Ring-chain investigation](docs/validation/ring-chain-investigation.md) documents the fixture and limitations. `node --import tsx scripts/diagnostics/ring-links/probe.ts` runs the diagnostic. Its opt-in `--assert-unlinked` mode **intentionally fails** on retained behavior and is outside the normal release suite; do not count it as an unexplained failing release test.

## Themes, audio and earned decorations

- Themes: **Océano, Espacio, Capibaras**, independent of model/mechanics. Ring appearances use theme colors/material finishes with unchanged physical hole/dimensions. Reduced graphics quality also preserves physics.
- The rear plastic has three locally bundled **illustrated PNG scenes**, with an open/readable center. The user rejected the earlier geometric/procedural ocean/capybara backgrounds, approved their illustrated replacements and requested matching space quality. Preserve this art direction; do not replace it with placeholders. Prompts/provenance: [docs/art/](docs/art/), [assets](docs/assets.md), [art report](docs/validation/art-refresh.md).
- Audio uses local Web Audio synthesis: collection **Monedita/Chispas**, distinct original looping music for each theme, and the villain cue. No third-party music service is needed. Do not add unverified rights/cost dependencies.
- Preserve global mute plus an independent saved music toggle. Music starts through a user gesture. Pause/mute/round restart preserve loop position; selecting another theme starts its own phrase. Keep tempo/instrument/register contrast: an earlier ocean/space opening sounded identical and was corrected.
- Settings **Escuchar** auditions a cue without scoring or resuming physics and cancels correctly on hiding/closing/teardown. An activated audio context is not proof that a person audited the mix. Subjective listening remains pending.
- The first genuine completed normal-player round per theme unlocks its one sticker. Rewards/placements are global within that browser, usable across themes/models, with at most one placed instance per design (three total). Repeated victory/theme changes must not create duplicate rewards.
- Decoration editing has its own pause, prevents pumping, and allows placement/move/removal on the toy front. Store normalized toy-relative coordinates and validated catalog IDs, separately from allowlisted preferences. Resize/orientation must not drift placement. Keep separate preloaded thumbnail and placed-image nodes; handle malformed/unavailable storage safely.
- Preferences persist model, theme, sound, music, collection cue and control choice. Never persist the physical round. Preview rewards are sandboxed as noted above. There is no currency, shop, account or new economy.

## Source map and module boundaries

| Path | Responsibility |
| --- | --- |
| `src/main.ts` | Select explicit player/lab/preview entry; keep it thin. |
| `src/app/player-app.ts` | Normal composition, event wiring, preferences, fixed-step frame loop, pause/visibility and teardown. |
| `src/game/session.ts` | Round lifecycle, commands, snapshots, actual objective/victory and independent pause reasons. |
| `src/physics/simulation.ts`, `src/physics.ts` | Rapier bodies, collision/threading/contact rules, pumping and compatibility facade. |
| `src/models/selected-toy.ts`, `toy-model.ts` | Selected production geometry and fixed model mechanics; no theme data. |
| `src/input/poc-controls.ts` | Pump press edges, keyboard tilt, motion permission/calibration/fallback and listener cleanup. |
| `src/game/mascots/` | Normal helper/villain orchestration and active-time schedule. |
| `src/lab/experiments/` | Per-instance geometry/count/pressure/helpers/enemy primitives; reuse selected pieces without promoting every lab variant. |
| `src/rendering/player-renderer.ts`, `src/themes/` | Three-only visuals, current framing/projection and theme definitions/assets. No Rapier body references in the player renderer. |
| `src/ui/player-view.ts`, `round-result.ts`, `public/player.css` | Spanish setup, compact player/tools/dialogs and persistent completed-round action. |
| `src/audio/`, `src/celebration/` | Round-scoped effects/music/visual celebration, deduplication, timing and resource cleanup. |
| `src/stickers/`, `src/platform/preferences.ts` | Validated decorative saves and separate allowlisted preferences. |
| `src/lab/start-lab.ts`, `poc-lab.ts`, `public/style.css` | Laboratory composition/rendering, camera experiments, collision debug and diagnostics. |
| `tests/`, `scripts/diagnostics/`, `docs/validation/` | Automated checks, explicit diagnostics and qualified evidence. |

Snapshots carry values and stable ring IDs scoped by `roundId`; discard stale events/effects after restart. Keep no old body/world references: a reset recreates the Rapier world. Helpers run immediately before the fixed session step; actual collection/scoring remains session-owned. Coordinate contract changes at the composition boundary instead of independently inventing conflicting APIs.

## Backlog and acceptance status

Use [the board](docs/tasks/README.md) for ownership/status. `review` can mean implemented and awaiting user/device feedback; it does not mean the feature is absent. Do not restart accepted work because an old row remains in review.

| Item | Current decision |
| --- | --- |
| T13 width / T20 pegs | Width8 and raised supported pegs already adopted in normal play; width 9/floor stays a historical lab comparison. |
| T22 helpers / T23 villain | Manual helpers and the bounded automatic linked pair are implemented. User praised the villain; endless expansion is separate. |
| T24 mobile UI | Implemented/pushed in `82c08fc`; new Pixel feedback, physical sensor/calibration, independent multitouch and sustained rendered FPS remain pending. |
| T09 / T14 / T15 audio | Implemented; subjective effects/music/mix review remains pending. |
| T16 / T17 visuals | Illustrated panels and ring finishes implemented; space confirmation and ring-finish feedback remain open on the board. |
| T19 stickers | Implemented; reward cadence, placement comfort and user feedback remain open. |
| T18 twenty rings | User-deferred after POC review. Historical candidate remains lab-only; its width 9/floor capacity evidence does not prove width 8/raised capacity. |
| T21 pressure | User-deferred; rethink input/interaction. Current normal pump stays fixed 75, with no pressure slider. Do not assume a phone measures finger force. |
| T25 / BL-17 endless | **Planned/unassigned only**: recurring villain visits dropping one continuous physical chain of **2–5 rings per appearance**. See [T25](docs/tasks/T25-endless-linked-chains.md). |
| Older unassigned ideas | BL-01 time trial; BL-04 broader customization editor; BL-05 physically shake the phone; BL-06 installation and cold offline launch/PWA. |

T25 has not been implemented or dispatched to agents. Starting count, cadence/trigger, chain-length distribution, cumulative progress/empty-tank/end-of-session behavior, rewards and simultaneous-load cap remain open design choices. A five-ring chain means one connected chain, not five loose rings or disconnected pairs. Endless recurrence must not imply unbounded bodies/memory. Keep finite rules unchanged until a separate implementation selection.

Lab comparisons remain opt-in and isolated: widths 9/8/7, twelve/twenty, floor/raised, variable pressure, two helpers and manual enemy encounters. The selector restarts each candidate. Its pressure intensity 0.5–1.5 is snapshotted per 0.24s pulse; distinguish genuine force input from level/charge fallback. Do not combine previously unsupported geometry variants or export lab defaults into normal play without a user decision.

## Working with the user and agents

- Talk to the user in concise, friendly Spanish, matching their casual tone. Lead with the outcome, keep progress updates during sustained work, and report meaningful findings/remaining uncertainty. Ask only for decisions actually needed; proceed with routine reversible work already authorized.
- A backlog addition or prepared implementation guide is **not** authorization to implement the feature, create workers or continue into another card. A later explicit implementation request selects that work. Do not proactively dispatch agents without user/applicable instruction authorization.
- When delegation is authorized, the user's worker configuration is **`gpt-6-luna` with `high` reasoning effort**. If unavailable, report that rather than silently substituting. The orchestrator coordinates assignments, integration, evidence and updates.
- Assign one scoped card per worker, record ownership on the board, and agree on shared contracts first. Use isolated branches/worktrees for authorized parallel work; do not concurrently edit the same checkout/shared composition. Finishing one task does not authorize another.
- Inspect Git state first and preserve other work. Make narrow changes; do not reset/delete unrelated files or upgrade pinned dependencies incidentally. Update the task card/requirements when a decision changes rather than keeping competing lists.
- Report implementation, automated verification, browser observations, physical-device testing and user acceptance separately. Never claim unseen screenshots, audible quality, real multitouch/sensors or mobile FPS from Node tests or desktop emulation.
- Browser QA should use disposable tabs/controlled previews, preserve live user rounds, restore changed preferences and viewport overrides, and retain honest screenshots/measurements. Do not reload an active user round just to show a newer build without authorization.

## Verification and local development

Requirements: **Node.js 22+**, **pnpm 11.25.0**, and Python 3 for the no-cache local server. Install dependencies when needed, preserving `pnpm-lock.yaml`:

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
pnpm serve
```

If the package-manager wrapper is unavailable but dependencies are installed, equivalent checks are:

```sh
node node_modules/typescript/bin/tsc --noEmit
node --import tsx --test tests/*.test.ts
node build.mjs
python3 serve-local.py
```

Run from the repository root. Code changes require the appropriate checks above, meaningful regression tests where needed, and browser verification for UI changes. Do not add tests that merely restate styling/constants. Documentation-only changes require link/decision consistency and `git diff --check`; do not rerun the physics soak merely to edit Markdown.

`build.mjs` writes static `dist/`, copies bundled art and versions HTML/JS/CSS against a common content hash in `dist/build.json`. `pnpm serve` binds **127.0.0.1:8000**, serves `dist/` with `Cache-Control: no-store` and requires an existing build. Rebuild after source changes, then reload an appropriate test page and verify the actual loaded revision; a running server does not rebuild itself. `dist/` and `node_modules/` are ignored and are not committed.

For UI checks cover both models/rules, themes as relevant, small portrait/landscape/tablet layouts, dynamic resize, pumps/manual controls, dialogs/cancel paths, focus and won/new-game state. Record viewport/browser/build and whether input was synthetic. Use actual physical contact in controlled scenes to validate scoring. New full-suite totals belong with their revision/report; do not present earlier counts 6/16/42/53/66/78/130/145/147/158 as current 160 or future results.

### Free mobile validation, costs and hosting

The user declined a paid BrowserStack subscription. T06's free baseline is complete and **non-blocking**; missing physical hardware must not block unrelated development. Use existing automated checks, browser emulation and available free/user-owned/borrowed devices. No paid subscription, billing activation or overage is authorized; do not make a large emulator installation or account a prerequisite.

Physical Android/iOS sensor permission/calibration/inversion, two independent fingers, orientation changes, browser chrome/safe areas, thumb comfort and sustained rendered FPS still need real-device evidence. Pixel screenshots established a problem in the old layout, not acceptance of the new one. Use the protocol in [POC_REPORT.md](docs/POC_REPORT.md) and [mobile access](docs/validation/mobile-access.md); label unavailable tests as not run.

Assets/dependencies are bundled for theme switching and continued play **after complete loading** without a network. Installation and cold offline startup are a separate unimplemented backlog item. Do not claim a PWA/service worker exists. Never publish a site, replace hosting, open a public tunnel or change an account as an incidental local validation step.

### Git and delivery

- Repository: **`https://github.com/apergam/aritos.git`**, primary branch **`main`**. The user updates their dev lab from GitHub and tests on their phone. A successful push does not establish that their hosted build deployed.
- When asked to commit/push, include the authorized source/docs/backlog/evidence, inspect the staged diff, commit, push normally and verify local/remote branch equality plus remaining working-tree changes. Do not force-push or commit credentials, machine-specific paths, generated `dist/` or unrelated edits.
- For multiline commit/PR text use a real file/structured argument. Do not treat shell-interpolated text as harmless data.
- Finish with what changed, the relevant checks/limitations and the real commit/push result when requested. Provide a content revision for dev-lab cache/build verification when useful; never invent a deployment result.

## Decision history and evidence map

| Milestone | Decision / evidence |
| --- | --- |
| October 18 physics investigation | Six original Node tests established a feasible Rapier candidate; no physical-device/FPS acceptance. [POC report](docs/POC_REPORT.md). |
| October 19 accepted POC | Depth reduced 3.3→1.8, bases moved to floor, jets moved to low sides, pumps below tank, collect-at-base selected; user chose strength 75/drag 0.50. Sixteen tests at that checkpoint. |
| October 19–20 foundations/player | Modules, inputs, session/preferences/models, Spanish UI, three themes, audio and celebration integrated. [Foundation evidence](docs/validation/integration-t01-t05.md), [qualified release](docs/validation/release.md). |
| October 20 art/music polish | Replaced rejected ocean/capybara backgrounds with generated illustrations; matched space. Corrected indistinguishable ocean/space music openings. [Art](docs/validation/art-refresh.md), [audio](docs/validation/polish-audio-art.md). |
| October 20 rings/stickers/POCs | Appearance-only finishes and bounded earned decorations; isolated width/count/peg/pressure/helper/enemy comparisons. [Stickers](docs/validation/themed-rings-stickers.md), [lab comparisons](docs/validation/lab-experiments.md). |
| Later selected normal integration | Width8, raised pegs and helpers superseded floor/width 9 normal defaults; manual villain was an intermediate stage. [Integration](docs/validation/selected-toy-integration.md), commit `da06f12`, 145 tests. |
| October 21 completed rounds | Fixed the dead end after four-second feedback expiry with persistent victory/new-game UI; event loss was not proven. [Report](docs/validation/round-completion.md),`6c03688`, 147 tests. |
| October 21 linked villain | Automatic late-round pair superseded manual-only timing; exact user chain formation remains unreplayed. [Chain investigation](docs/validation/ring-chain-investigation.md), [automatic encounter](docs/validation/automatic-linked-villain.md),`4d6081f`, 158 tests. |
| October 21 mobile | Larger toy, compact setup and nonmodal tools; ten emulated viewport checks. [Report](docs/validation/mobile-interface.md),`82c08fc`, 160 tests, build `019e6188`; physical Pixel acceptance pending. |
| Endless backlog | User liked the villain and requested recurring 2–5-ring chains; recorded in §25/T25 only. No endless implementation or new economy. |
| October 28 context consolidation | This document replaces accumulated contradictory notes with the current working agreement. Historical reports remain intact; the endless backlog is included in the requested documentation delivery. |
