import { TOY_PHYSICS } from '../../models/toy-model';

export type RingCount = 12 | 20;
export type RingStartPose = Readonly<{ x: number; y: number; z: number }>;
export type CountPeg = Readonly<{ x: number; z: number; baseY?: number; tipY?: number }>;

const RING_EXTENT = TOY_PHYSICS.ring.radius + TOY_PHYSICS.ring.tube;
const BASE_Y = TOY_PHYSICS.base.topY;
const TIP_Y = TOY_PHYSICS.pegTipY;
const DEFAULT_PEGS: readonly CountPeg[] = TOY_PHYSICS.pegs.map(peg => Object.freeze({
  ...peg, baseY: BASE_Y, tipY: TIP_Y,
}));

/** Keeps the accepted twelve-ring spacing and packs twenty below the peg tip. */
export function stackSpacing(count: RingCount): number {
  return count === 12 ? 0.55 : 0.34;
}

/** Starting centers for the physical stack scene, alternating rings across pegs. */
export function stackStartPoses(
  count: RingCount,
  pegs: readonly CountPeg[] = DEFAULT_PEGS,
): readonly RingStartPose[] {
  if (pegs.length === 0) throw new RangeError('At least one peg is required to stack rings.');
  const perPeg = Math.ceil(count / pegs.length);
  const spacing = stackSpacing(count);
  return Object.freeze(Array.from({ length: count }, (_, index) => {
    const peg = pegs[index % pegs.length];
    return Object.freeze({
      x: peg.x,
      y: (peg.baseY ?? BASE_Y) + 0.6 + Math.floor(index / pegs.length) * spacing,
      z: peg.z,
    });
  })).map((pose, index) => {
    const peg = pegs[index % pegs.length];
    const highestRingEdge = pose.y + RING_EXTENT;
    if (highestRingEdge > (peg.tipY ?? TIP_Y) + 1e-9) {
      throw new RangeError(`A ${count}-ring stack exceeds its peg tip.`);
    }
    return pose;
  });
}

/** A clear floor scatter, preserving all existing twelve-ring start positions. */
export function freeStartPoses(
  count: RingCount,
  halfWidth = TOY_PHYSICS.tank.x,
): readonly RingStartPose[] {
  const columns = [-3.8, -2.5, -0.675, 0.675, 2.5, 3.8];
  const poses = Array.from({ length: count }, (_, index) => Object.freeze({
    x: columns[index % columns.length],
    y: -4.7 + Math.floor(index / columns.length) * 1.4,
    z: ((index % 3) - 1) * 0.24,
  }));
  for (const pose of poses) {
    if (Math.abs(pose.x) + RING_EXTENT > halfWidth) {
      throw new RangeError('A free ring start overlaps a tank side wall.');
    }
  }
  return Object.freeze(poses);
}
