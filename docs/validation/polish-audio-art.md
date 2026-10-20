# Audio and rear-plastic polish — October 20, 2026

Ready for local player review. Source integration: `c25218a`; content build **3bbe1ed3**. T14/T15 implementation is integrated but remains in review for subjective audition and mix/choice feedback. T16 is integrated and visually inspected. No physical-device or subjective audio acceptance is claimed; the first version's [mobile limitations](release.md) remain.

## Scope delivered

- T14: coin and sparkle reward candidates consumed only by real collection events, once per ring/round. Settings save the choice and offer an explicit Escuchar audition while physics stays paused. Coin is provisional; the user has not yet selected a preferred candidate.
- T15: distinct original ocean, space and capybara synthesized loops, 19.2 seconds each. Music starts after explicit play/activation, pauses with the game and preserves position across pause/mute/theme change and round restart. One source plays at a time. Global mute gates both music and effects; independent saved music choice permits effects-only play. No external tracks/samples or network audio are used.
- T16: original bundled SVG scenes on the inside rear plastic, behind rings and pegs. Panel dimensions derive from the accepted tank. Theme changes only update visual/audio state, preserving the round. Texture load completion after disposal is cleaned up safely.
- Workers `/root/t14_reward`, `/root/t15_music`, `/root/t16_rear` used `gpt-6-luna` with `high` reasoning. T14/T16 were parallel; T15 followed audio integration. Parent owns composition, preferences/UI, review corrections and recorded evidence. No source under physics/session/models changed in this iteration.

## Automated checks

`pnpm typecheck`, `pnpm test`, `pnpm build` and `git diff --check` passed. **64/64 tests:** 16 physics, 10 session, 8 input, 7 preference, 4 model, 4 theme, 8 effects audio, 5 music and 2 celebration.

The unchanged physics stress test completed 600 simulated seconds / 72,000 ticks without escapes or NaN: 24.456 seconds local wall time, mean engine step 0.340 ms. These are Node engine timings, not mobile FPS.

New checks cover reward uniqueness and bounded overlap; settings preview during pause; cancellation while already paused; overlapping delayed auditions; saved/legacy/invalid audio preferences; mute and pending activation; music pause/mute/theme offset and one-source ownership; finite, bounded and distinct PCM loops with matched boundary samples; and embedded SVG asset integrity/no external dependencies.

Review fixes: explicit SVG width/height to obtain raster textures, inset dimensions matching the physical tank instead of an oversized hardcoded plane, preview ownership to prevent an old delayed resume suspending a new audition, and note/bar release envelopes in addition to the loop boundary fade. Browser activation tests below indicate calls succeeded; actual acoustic judgment was not performed.

At 24 kHz, three mono buffers occupy ~5.27 MiB. Worker-local generation measured ~250–290 ms; this was not a phone CPU test. Music is synthesized once on initial explicit activation, then cached; no progressive oscillator/timer allocation is required to loop.

## Desktop browser evidence

Codex in-app browser on this Mac; explicit viewport checks are desktop emulation, not physical phones. Normal screenshot dimensions follow the app panel; responsive test dimensions are recorded explicitly below.

- Six model/theme combinations in the real-physics drop preview retained **1/2** progress and manual pause while changing the rear illustration. Exactly the model's expected pump buttons were visible. [Observed states](evidence/polish-theme-cases.json). Visual ring/peg positions remained consistent across the paused comparisons; numerical velocity/pose captures were not collected.
- Inspected rear art in all three themes behind opaque rings/pegs and transparent front acrylic. Capybara habitat, sea life and planets/ships are visible. [Ocean](evidence/polish-ocean-two-button.png), [space](evidence/polish-space-two-button.png), [capybaras](evidence/polish-capybaras-two-button.png).
- Escuchar activated both coin and sparkle samples and displayed the matching sample status without resuming physics. A reported successful activation is not an audition by the agent or proof of audible quality.
- Reload retained music-off with global effects enabled and coin selected. A subsequent reload retained global mute; music showed “Silenciada por el sonido general” and Escuchar was disabled. Legacy mute behavior also passes automated parsing tests. Theme/model remain saved choices; reload starts fresh setup/round.
- At **360×640, 390×844 and 844×390**, no horizontal page overflow; visible pump buttons remain below the tank (62/62/52 px high respectively). The settings dialog scrolls and its close action, music toggle, cue selector and sample button are accessible. [Bounds](evidence/polish-layouts.json), [compact settings](evidence/polish-settings-360x640.png).
- After loading, the local HTTP server process was suspended. All three themes and reward sample activations worked with **1/2** retained; pumping worked after closing settings. The server was then resumed. [Record](evidence/polish-offline-checks.json). This removes the serving origin after loading, not cold-offline startup. Music sample data are self-contained/cached; listening during this test was not performed.
- No error-level browser console messages captured in final checks. The final tab is normal player `/`, two-button model, capybaras, collect, music/effects enabled and coin selected, build `3bbe1ed3`.

## Remaining review

1. User listening: choose coin or sparkle, judge three melodies/mix and the loop seam; adjust timbre/levels if needed. T09/T14/T15 acoustic review remains open.
2. Real-device audio activation/performance plus existing Android/iOS sensors, independent fingers, background/orientation and sustained FPS checks remain not run. No paid access was created.
3. Width, variable pressure, ring counts, alternate pegs, stickers, powerups and enemies remain planned for a later iteration. The selected polish changed no accepted physics or rules.

Artwork and music provenance is recorded in [assets](../assets.md). All work is saved locally; no deployment or push was performed for this iteration.
