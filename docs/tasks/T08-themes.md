# T08 — Implement complete themes

Dependencies: T06.

Read [AGENTS.md](../../AGENTS.md), [requirements](../requirements.md), the [guide](../implementation-guide.md), and `docs/module-contracts.md`. Follow shared verification/handoff rules. The real-device gate must pass before visual theme work starts.

## Outcome and ownership

The POC has one laboratory appearance, not three complete themes. Own `src/themes/`, theme-owned rendering changes in `src/rendering/`, and `public/assets/themes/`. Provide theme data, renderer hooks, and complete asset manifests to T11. Coordinate rendering changes with T10; do not edit physics, session, model mechanics, or shared composition.

## Work and acceptance

- Implement ocean, space, and capybara definitions: housing/button colors, background, ring palette, and mascot identity. Each works with one- and two-button models.
- Convey a physical water toy with transparent housing, water, solid rings, visible depth, and bases on the floor. Preserve the accepted tank and collision geometry.
- Apply theme changes to existing visuals without rebuilding Rapier bodies or clearing velocities, progress, timers, or round identity.
- Keep the player camera fixed. Preserve the current accepted default until the user supplies a preferred camera configuration; camera experimentation remains in the lab.
- Supply all assets for preloading. No theme-specific fetch may be required after initial loading. No customization editor.
- Allow visual quality reduction without changing forces, timesteps, collision geometry, or objective difficulty.

## Verification and handoff

Inspect all six model/theme combinations. Test a theme switch while paused with threaded/moving rings: compare body identity, poses, velocities, mode, progress, and round identity before/after appearance changes, then resume. Typecheck, tests, and build pass. Supply asset provenance/licenses where applicable and manifests for T10/T11; full offline verification belongs to integration/release tasks.

Coverage: RF-03, RF-32–RF-38; RT-10, RT-12; CA-11–CA-12, CA-20.
