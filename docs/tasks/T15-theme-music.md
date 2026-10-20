# T15 — Add looping music for each theme

Dependencies: T09 implementation, T08, T11. Unavailable physical devices do not block exploration; record those checks as not run.

Read [AGENTS.md](../../AGENTS.md), [requirements section 16](../requirements.md#16-first-version-feedback-and-polish-backlog--october-20-2026), the [implementation guide](../implementation-guide.md), [module contracts](../module-contracts.md), and [task board](README.md) before assignment. The user subsequently selected this card for the October 20 polish iteration. Consult the task board for current integrated status and review evidence.

## Outcome and ownership

Add a musical loop for ocean, space and capybaras to reduce monotony. Own music playback/assets in `src/audio/`; coordinate theme IDs, saved controls, startup loading and UI with their owners. This is new scope, separate from the first version's effects-only implementation.

## Work and acceptance

- Prepare a short, distinct loop for each theme and record player listening feedback. Loops must have a smooth seam, unobtrusive mix and no cumulative overlapping tracks.
- Use original project music, public-domain/CC0 material, or another documented license explicitly permitting the intended distribution and looping/editing. Record creator, source, exact license, required attribution and modifications. A “royalty-free” label alone is not the evidence record; do not select unverified tracks or buy assets.
- Start only after an explicit user gesture. Saved global mute must silence both music and effects; provide a separately saved music toggle so effects can stay on without music. Preserve safe behavior if storage or audio is unavailable.
- Pause/background, resume, theme switching, restart and teardown must not create duplicate sources. Choose and document whether restart preserves musical position; it must not reset physics when music/theme changes.
- Bundle/preload all three loops before declaring round resources ready. Theme changes and continuing play after loading must not fetch music from a streaming site or CDN.

## Verification and handoff

Verify looping across multiple boundaries, rapid theme switches, saved mute/music controls, activation failure and cleanup. Check playback with the serving origin unavailable after loading. Record real browser listening and loaded asset size; run code checks. Actual phone audio remains not run until observed.

Coverage: BL-09; requirements section 16 amends RF-43 and CA-19 for this future iteration; RT-12.
