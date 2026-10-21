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
export type LabSupport = Readonly<{
  center: Readonly<{ x: number; y: number; z: number }>;
  halfExtents: Readonly<{ x: number; y: number; z: number }>;
}>;
export type LabLayout = Readonly<{
  width: LabWidth;
  tank: Readonly<{ x: number; y: number; z: number }>;
  pegs: readonly LabPeg[];
  /** Fixed physical struts joining raised pedestals to the rear plastic. */
  supports: readonly LabSupport[];
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
  const count = settings.ringCount ?? 12, arrangement = settings.pegLayout ?? 'floor';
  if (![9,8,7].includes(width) || ![12,20].includes(count) || !['floor','raised'].includes(arrangement)) throw new RangeError('Unknown laboratory settings.');
  if ((count===20 && (width!==9 || arrangement!=='floor')) || (arrangement==='raised' && width===7)) throw new RangeError('Compare one laboratory geometry variable at a time.');
  const xHalf = width / 2;
  const tank = Object.freeze({ x: xHalf, y: TOY_PHYSICS.tank.y, z: TOY_PHYSICS.tank.z });
  const baseY = TOY_PHYSICS.base.topY;
  const pegXs = width === 9 ? [-1.7, 1.7] : [-1.7, 1.7];
  const pegLayout = settings.pegLayout ?? 'floor';
  const pegs = Object.freeze(pegXs.map((x, index) => {
    const pegBaseY = pegLayout === 'raised' ? (index === 0 ? -3.8 : -2.2) : baseY;
    return Object.freeze({ x, z: 0, baseY: pegBaseY, tipY: pegBaseY + (TOY_PHYSICS.pegTipY - TOY_PHYSICS.base.topY) });
  }));
  const supports: readonly LabSupport[] = pegLayout === 'raised' ? Object.freeze(pegs.map(peg => Object.freeze({
    center: Object.freeze({ x: peg.x, y: (peg.baseY + peg.tipY) / 2, z: -tank.z + .06 }),
    halfExtents: Object.freeze({ x: .18, y: (peg.tipY - peg.baseY) / 2, z: .09 }),
  }))) : Object.freeze([]);
  const jets = Object.freeze({
    left: freezeOutlet({ x: -xHalf + .3, y: -tank.y + .75, z: 0 }, { x: sideSlope, y: sideRise, z: 0 }),
    right: freezeOutlet({ x: xHalf - .3, y: -tank.y + .75, z: 0 }, { x: -sideSlope, y: sideRise, z: 0 }),
    center: freezeOutlet({ x: 0, y: -tank.y + .3, z: 0 }, { x: 0, y: 1, z: 0 }),
  });
  return Object.freeze({ width, tank, pegs, supports, jets, ringCount: settings.ringCount ?? 12, pegLayout });
}

