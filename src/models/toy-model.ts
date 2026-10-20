export type ToyModelId = 'single-button' | 'two-button';
export type PumpSide = 'left' | 'right' | 'center';

export type ToyVector = Readonly<{ x: number; y: number; z: number }>;
export type ToyOutlet = Readonly<{ origin: ToyVector; direction: ToyVector }>;

export type ToyPhysicsConfig = Readonly<{
  /** Interior half-extents; z=.9 means the accepted 1.8-unit full depth. */
  tank: Readonly<{ x: number; y: number; z: number }>;
  ring: Readonly<{ radius: number; tube: number; segments: number }>;
  pegs: readonly Readonly<{ x: number; z: number }>[];
  pegRadius: number;
  /** The base top sits above its foot, which rests on the tank floor. */
  base: Readonly<{ topY: number; footHeight: number; halfWidth: number; halfDepth: number }>;
  pegTipY: number;
  strength: number;
  drag: number;
  pulseDuration: number;
}>;

const freezeVector = (v: ToyVector): ToyVector => Object.freeze({ ...v });
const freezeOutlet = (outlet: ToyOutlet): ToyOutlet => Object.freeze({
  origin: freezeVector(outlet.origin),
  direction: freezeVector(outlet.direction),
});

/** Shared accepted mechanics. Themes and other appearance data never enter this configuration. */
export const TOY_PHYSICS: ToyPhysicsConfig = Object.freeze({
  tank: Object.freeze({ x: 4.5, y: 6, z: 0.9 }),
  ring: Object.freeze({ radius: 0.52, tube: 0.13, segments: 20 }),
  pegs: Object.freeze([Object.freeze({ x: -1.7, z: 0 }), Object.freeze({ x: 1.7, z: 0 })]),
  pegRadius: 0.11,
  base: Object.freeze({ topY: -5.7, footHeight: 0.3, halfWidth: 0.76, halfDepth: 0.76 }),
  pegTipY: -5.7 + 4.35,
  strength: 75,
  drag: 0.5,
  pulseDuration: 0.24,
});

const sideSlope = 0.48;
const sideRise = Math.sqrt(1 - sideSlope ** 2);

/** Stable, fixed outlet data shared by physics and rendering. */
export const TOY_OUTLETS: Readonly<Record<PumpSide, ToyOutlet>> = Object.freeze({
  left: freezeOutlet({
    origin: { x: -TOY_PHYSICS.tank.x + 0.3, y: -TOY_PHYSICS.tank.y + 0.75, z: 0 },
    direction: { x: sideSlope, y: sideRise, z: 0 },
  }),
  right: freezeOutlet({
    origin: { x: TOY_PHYSICS.tank.x - 0.3, y: -TOY_PHYSICS.tank.y + 0.75, z: 0 },
    direction: { x: -sideSlope, y: sideRise, z: 0 },
  }),
  center: freezeOutlet({
    origin: { x: 0, y: -TOY_PHYSICS.tank.y + 0.3, z: 0 },
    direction: { x: 0, y: 1, z: 0 },
  }),
});

export type ToyModel = Readonly<{
  id: ToyModelId;
  buttonCount: 1 | 2;
  /** The button-to-pump mapping. Both side pumps may be pulsed in the same step. */
  pumpSides: readonly PumpSide[];
  /** Kept as side identifiers for existing input and lab consumers. */
  outlets: readonly PumpSide[];
  /** Concrete positions and directions for each outlet exposed by this model. */
  outletDefinitions: Readonly<Partial<Record<PumpSide, ToyOutlet>>>;
  /** Shared across both models so button selection cannot alter game physics. */
  physics: ToyPhysicsConfig;
}>;

/** Mechanical definitions only. Appearance belongs to a theme. */
export const TOY_MODELS: Readonly<Record<ToyModelId, ToyModel>> = Object.freeze({
  'single-button': Object.freeze({
    id: 'single-button', buttonCount: 1,
    pumpSides: Object.freeze(['center'] as const),
    outlets: Object.freeze(['center'] as const),
    outletDefinitions: Object.freeze({ center: TOY_OUTLETS.center }),
    physics: TOY_PHYSICS,
  }),
  'two-button': Object.freeze({
    id: 'two-button', buttonCount: 2,
    pumpSides: Object.freeze(['left', 'right'] as const),
    outlets: Object.freeze(['left', 'right'] as const),
    outletDefinitions: Object.freeze({ left: TOY_OUTLETS.left, right: TOY_OUTLETS.right }),
    physics: TOY_PHYSICS,
  }),
});

export function toyModel(id: ToyModelId): ToyModel { return TOY_MODELS[id]; }
