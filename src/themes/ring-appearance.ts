import * as THREE from 'three';
import { theme } from './index';
import type { ThemeId } from './types';

/** Ring finishes are appearance only; geometry and the physical opening stay fixed. */
export type RingFinish = Readonly<{
  roughness: number;
  metalness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  emissive: number;
  emissiveIntensity: number;
}>;

export const RING_FINISHES: Readonly<Record<ThemeId, RingFinish>> = Object.freeze({
  ocean: Object.freeze({ roughness: 0.16, metalness: 0.04, clearcoat: 1, clearcoatRoughness: 0.08, emissive: 0x063d42, emissiveIntensity: 0.1 }),
  space: Object.freeze({ roughness: 0.24, metalness: 0.64, clearcoat: 0.72, clearcoatRoughness: 0.16, emissive: 0x30234d, emissiveIntensity: 0.22 }),
  capybaras: Object.freeze({ roughness: 0.39, metalness: 0.02, clearcoat: 0.34, clearcoatRoughness: 0.27, emissive: 0x302016, emissiveIntensity: 0.035 }),
});

/** Apply the chosen finish without replacing the stable ring mesh/material. */
export function applyRingAppearance(material: THREE.MeshPhysicalMaterial, themeId: ThemeId, ringId: number, threaded = false): void {
  const colors = theme(themeId).colors;
  const finish = RING_FINISHES[themeId];
  material.color.setHex(colors.rings[Math.abs(ringId) % colors.rings.length]);
  material.roughness = finish.roughness;
  material.metalness = finish.metalness;
  material.emissive.setHex(threaded ? colors.peg : finish.emissive);
  material.emissiveIntensity = threaded ? 0.24 : finish.emissiveIntensity;
  material.clearcoat = finish.clearcoat;
  material.clearcoatRoughness = finish.clearcoatRoughness;
}
