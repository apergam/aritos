# Rear artwork refresh — October 20, 2026

## Space matching follow-up — current candidate

Build **a3889036**, source **d0c5503**. The user accepted the illustrated ocean/capybara backgrounds and requested the same finish for space. Its former SVG is replaced with a locally bundled generated PNG: ringed planet, nebula, smaller planet and exploratory ships framing an open violet center. Peripheral star points are smaller/sparser; physics, rules, music and controls are unchanged. All three rear panels are now illustrated PNGs (~8 MiB total initial image files). Exact generation prompts and filenames are in the linked prompt set below.

Typecheck, build, **66/66 tests** and `git diff --check` pass via direct Node commands. In the in-app browser, the space image was inspected with both button models, switches through all three themes worked, and the cycle was repeated with the already-loaded local HTTP server suspended. No captured error-level console entries; the server was resumed. This is desktop appearance and offline-after-load evidence, not mobile performance or acoustic acceptance. [Current space in game](evidence/aritos-space-v2.png). Final tab: normal two-button/collect player, space. Space awaits the user's visual feedback; ocean/capybaras have explicit positive feedback. No deployment or push.

## Ocean and capybara replacement — preceding candidate


Current local candidate: **8f561176**, source **11ab2c9**. The user disliked the first capybara and ocean illustrations. Both rear inserts are replaced with generated illustrative scenes: a coral reef with fish/turtle, and a wetland with recognizable capybaras resting on its banks. Space retains its existing SVG. These are artwork changes; physics, rules, controls and music are unchanged. The new visual candidate awaits player feedback.

## Resources and provenance

Generated using the built-in image_gen tool, without external stock images or recordings. [Exact prompts and files](../art/rear-scenes-v2-prompts.json) record the two new assets. PNG originals are committed under `public/assets/themes/` with content fingerprints in their names. They are copied into `dist/assets/themes/` and included in the shared build hash. Space and mascot artwork remain embedded SVG. This report does not assert a separate third-party stock license or a change to the project's license.

The two PNGs add about 5 MiB of initial local image assets. The renderer starts loading all themes at construction and retains completed textures; switching after complete loading needs no new origin request. Teardown disposes completed and late textures. This is offline-after-load behavior, not cold offline/PWA startup. Physical-device load time and GPU memory/performance have not been measured.

## Verification

- Direct Node execution was used because the pnpm launcher could not resolve `node` in its child shell: `node node_modules/typescript/bin/tsc --noEmit`, `node --import tsx --test tests/*.test.ts`, `node build.mjs`. Runtime reports Node 24.15.0. All passed; **66/66 tests**, with the theme test checking bundled local PNG signature/dimensions and self-contained SVG resources. `git diff --check` passes.
- The unchanged engine soak completed 600 simulated seconds / 72,000 steps without escapes/NaN (26.229 s, mean 0.364 ms engine-only; not mobile FPS).
- In the in-app browser, inspected ocean and capybara scenes behind rings, pegs and front plastic with the two-button model. Also switched through capybaras/ocean/space with the one-button model; expected controls remain visible and theme switching preserves the current round.
- After both PNGs were observed loaded, the local server process was suspended. All three theme switches still displayed their artwork and no error-level console messages were captured. The server was resumed immediately afterward.
- Final tab: normal player `/`, ocean, two buttons, collect, revision 8f561176. [Ocean in game](evidence/aritos-ocean-v2.png), [capybaras in game](evidence/aritos-capybaras-v2.png).

T16 is back in review for the user's judgment of the replacement art. The music candidate and its listening review are unchanged; see [audio report](polish-audio-art.md). No deployment or push was performed.
