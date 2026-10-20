# T16 — Add illustrated rear plastic inserts

Dependencies: T08, T11. Unavailable physical devices do not block exploration; record those checks as not run.

Read [AGENTS.md](../../AGENTS.md), [requirements section 16](../requirements.md#16-first-version-feedback-and-polish-backlog--october-20-2026), the [implementation guide](../implementation-guide.md), [module contracts](../module-contracts.md), and [task board](README.md) before assignment. The user subsequently selected this card for the October 20 polish iteration. Consult the task board for current integrated status and review evidence.

## Outcome and ownership

Make the transparent toy feel like a physical object with a themed image attached to its rear plastic. Own theme art and theme-owned renderer layers; coordinate with T17, which edits the same theme/rendering paths.

## Work and acceptance

- Prepare rear inserts for ocean (underwater scene), capybaras (habitat) and space (ships/planets), using original or documented reusable art.
- Place the insert on the rear surface, visibly behind rings, pegs and water. Preserve the readable transparent front and depth cues; it is not an overlay on controls or a replacement for the scene.
- Keep contrast around ring holes and peg tips sufficient in all three themes and both models. Inspect moving and resting rings, not only an empty toy.
- Theme switches update only art and preserve round identity, bodies, poses, velocities and progress. No physical colliders or force changes.
- Include assets in initial resources, document provenance, and provide a reduced-quality rendering path where useful without changing mechanics.

## Verification and handoff

Inspect all six model/theme combinations in portrait and landscape; capture representative screenshots. Verify numerical state preservation through paused theme changes and offline-after-load behavior. Run code checks for renderer changes; report rendering cost without inventing mobile FPS.

Coverage: BL-10; RF-32–RF-38, RT-10, RT-12; CA-11–CA-12, CA-20.
