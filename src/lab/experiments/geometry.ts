import { TOY_PHYSICS, type ToyOutlet } from '../../models/toy-model';
import type { PumpSide, Vec } from '../../physics/simulation';

export type LabWidth = 9 | 8 | 7;
export type LabSimulationSettings = Readonly<{
  /** Full interior width in toy units. Defaults to the accepted 9-unit baseline. */
  width?: LabWidth;
  /** Foundation for the separate ring-count experiment. */
  ringCount?: 12 | 20;
  /** Foundation for the separate peg-position experiment. */
  pegLayout?: 'floor' | 'raised';
}>;

export type LabPeg = Readonly<{ x: number; z: number; baseY: number; tipY: number }>;
export type LabLayout = Readonly<{
  width: LabWidth;
  tank: Readonly<{ x: number; y: number; z: number }>;
  pegs: readonly LabPeg[];
  jets: Readonly<Record<PumpSide, ToyOutlet>>;
  ringCount: 12 | 20;
  pegLayout: 'floor' | 'raised';
}>;

const freezeOutlet = (origin: Vec, direction: Vec): ToyOutlet => Object.freeze({
  origin: Object.freeze({ ...origin }), direction: Object.freeze({ ...direction }),
});
const sideSlope = 0.48;
const sideRise = Math.sqrt(1 - sideSlope ** 2);

/** Builds a per-simulation immutable layout; shared accepted constants are never modified. */
export function createLabLayout(settings: LabSimulationSettings = {}): LabLayout {
  const width = settings.width ?? 9;
  const xHalf = width / 2;
  const tank = Object.freeze({ x: xHalf, y: TOY_PHYSICS.tank.y, z: TOY_PHYSICS.tank.z });
  const baseY = TOY_PHYSICS.base.topY;
  const pegXs = width === 9 ? [-1.7, 1.7] : [-1.7, 1.7];
  const pegs = Object.freeze(pegXs.map(x => Object.freeze({
    x, z: 0, baseY, tipY: (settings.pegLayout ?? 'floor') === 'floor' ? TOY_PHYSICS.pegTipY : baseY + (TOY_PHYSICS.pegTipY - TOY_PHYSICS.base.topY),
  })));
  const jets = Object.freeze({
    left: freezeOutlet({ x: -xHalf + .3, y: -tank.y + .75, z: 0 }, { x: sideSlope, y: sideRise, z: 0 }),
    right: freezeOutlet({ x: xHalf - .3, y: -tank.y + .75, z: 0 }, { x: -sideSlope, y: sideRise, z: 0 }),
    center: freezeOutlet({ x: 0, y: -tank.y + .3, z: 0 }, { x: 0, y: 1, z: 0 }),
  });
  return Object.freeze({ width, tank, pegs, jets, ringCount: settings.ringCount ?? 12, pegLayout: settings.pegLayout ?? 'floor' });
}

