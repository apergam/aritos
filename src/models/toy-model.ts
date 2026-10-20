import type { PumpSide } from '../physics';

export type ToyModelId = 'single-button' | 'two-button';

export type ToyModel = Readonly<{
  id: ToyModelId;
  buttonCount: 1 | 2;
  pumpSides: readonly PumpSide[];
  outlets: readonly PumpSide[];
}>;

/** Mechanical definitions only. Appearance belongs to a theme. */
export const TOY_MODELS: Readonly<Record<ToyModelId, ToyModel>> = Object.freeze({
  'single-button': Object.freeze({
    id: 'single-button', buttonCount: 1,
    pumpSides: Object.freeze(['center'] as const),
    outlets: Object.freeze(['center'] as const),
  }),
  'two-button': Object.freeze({
    id: 'two-button', buttonCount: 2,
    pumpSides: Object.freeze(['left', 'right'] as const),
    outlets: Object.freeze(['left', 'right'] as const),
  }),
});

export function toyModel(id: ToyModelId): ToyModel { return TOY_MODELS[id]; }
