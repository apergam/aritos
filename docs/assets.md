# Player assets and offline strategy

Themes and mascot art are defined in `src/themes/index.ts`. The octopus, astronaut and capybara are project-native inline SVG drawings embedded as data URIs; ocean plants/waves, space stars/planet and capybara reeds/lily pads are procedural Three.js geometry. UI controls use CSS and inline vector/system emoji shapes. No third-party image or recording was downloaded for this iteration.

All effects, including coin/sparkle collection candidates, in `src/audio/audio-controller.ts` are Web Audio oscillator/gain synthesis. `AUDIO_ASSET_MANIFEST` has no network assets. Celebration uses the theme's inline SVG and local `public/celebration.css`; it does not fetch art on victory.

The build bundles all theme/art definitions and Rapier/WASM with application code, copies local CSS, uses system fonts and versions the shared static entries by content hash. No remote font import remains. Theme changes and play after complete loading require no serving-origin requests. No service worker, installation or cold offline launch is implemented.

Pinned renderer/physics packages retain their upstream licenses, confirmed from local package metadata: Three.js 0.180.0 (`MIT`), `@dimforge/rapier3d-compat` 0.19.3 (`Apache-2.0`). Keep their license notices when redistributing. This document records provenance rather than an external asset clearance review.


## October 20 audio/art polish

`src/themes/rear-inserts.ts` contains three original code-authored SVG scenes: reef/sea life, capybara pond habitat and planets/ships. Every SVG has explicit raster dimensions (1000×1400); sources are embedded data URIs in `REAR_INSERT_ASSETS`. No downloaded artwork, web font, external `<image>` or remote SVG dependency is included. Textures sit on the inside rear plastic, behind physical rings and pegs, and all three are loaded at renderer construction. High/reduced rendering adjusts opacity and texture quality; it never changes physics.

`src/audio/theme-music.ts` contains original project note patterns and waveform synthesis for ocean, space and capybaras. There are no third-party recordings, samples, borrowed songs or upstream music attribution/license requirements. The source is project-native code, not a licensed external track. No purchase, subscription or streaming embed was used. `THEME_MUSIC_MANIFEST` records the source strategy, themes, BPM and duration.

Each loop is eight bars at 100 BPM (19.2 seconds), rendered to mono PCM at at most 24 kHz on first gesture. At 24 kHz the three buffers total 5,529,600 bytes (~5.27 MiB), not downloaded asset bytes. One source loops; short envelopes bring notes, bar transitions and the finite loop edge toward zero amplitude. All loops remain available locally for theme switching. Global sound gates effects/music, a separate music preference permits effects-only play, and a restored mute never starts music. Acoustic smoothness/mix remains subject to user listening; finite sample and lifecycle tests do not establish subjective quality.
