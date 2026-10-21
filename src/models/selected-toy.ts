import { createLabLayout, type LabSimulationSettings } from '../lab/experiments/geometry';

/** User-selected production geometry; shared mechanics remain unchanged. */
export const PLAYER_TOY_SETTINGS = Object.freeze({
  width: 8,
  ringCount: 12,
  pegLayout: 'raised',
} satisfies LabSimulationSettings);

export const PLAYER_TOY_LAYOUT = createLabLayout(PLAYER_TOY_SETTINGS);
