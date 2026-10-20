import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { REAR_INSERT_ASSETS, THEMES, theme, type ThemeId } from '../src/themes';
import { fixedCameraPosition, projectToySurfaceBounds } from '../src/rendering/player-renderer';
import { applyRingAppearance } from '../src/themes/ring-appearance';
import * as THREE from 'three';

test('all supported themes provide complete player palettes and inline mascot art', () => {
  const expected: Record<ThemeId, string> = { ocean: 'octopus', space: 'astronaut', capybaras: 'capybara' };
  assert.deepEqual(Object.keys(THEMES).sort(), Object.keys(expected).sort());
  for (const id of Object.keys(expected) as ThemeId[]) {
    const definition = theme(id);
    assert.equal(definition.id, id);
    assert.equal(definition.mascot, expected[id]);
    for (const key of ['accent', 'accentText', 'surface', 'text', 'muted'] as const) {
      assert.match(definition.ui[key], /^#[0-9a-f]{6}$/i, `${id} has a CSS color for ${key}`);
    }
    assert.ok(definition.colors.rings.length >= 6, `${id} has a full ring palette`);
    assert.equal(definition.assets.mascot.mimeType, 'image/svg+xml');
    assert.equal(definition.assets.mascot.source.startsWith('data:image/svg+xml,'), true);
    assert.match(decodeURIComponent(definition.assets.mascot.source.slice('data:image/svg+xml,'.length)), /^<svg\s/);
  }
});

test('theme definitions and their palettes are immutable shared values', () => {
  assert.equal(Object.isFrozen(THEMES), true);
  assert.equal(Object.isFrozen(theme('ocean')), true);
  assert.equal(Object.isFrozen(theme('ocean').colors.rings), true);
});

test('every theme supplies a bundled rear illustration without external resources', () => {
  const themeIds = Object.keys(THEMES) as ThemeId[];
  assert.deepEqual(Object.keys(REAR_INSERT_ASSETS).sort(), themeIds.sort());
  for (const id of themeIds) {
    const asset = REAR_INSERT_ASSETS[id];
    if (asset.mimeType === 'image/png') {
      assert.match(asset.source, /^\.\/assets\/themes\/[\w.-]+\.png$/);
      const bytes = readFileSync(new URL('../public/' + asset.source, import.meta.url));
      assert.deepEqual([...bytes.subarray(0,8)], [137,80,78,71,13,10,26,10]);
      assert.ok(bytes.readUInt32BE(16) >= 1000 && bytes.readUInt32BE(20) >= 1400);
      continue;
    }
    assert.equal(asset.mimeType, 'image/svg+xml');
    assert.match(asset.source, /^data:image\/svg\+xml,/);
    const source = decodeURIComponent(asset.source.slice('data:image/svg+xml,'.length));
    assert.match(source, /^<svg\s[\s\S]*<\/svg>$/);
    assert.match(source, /\bwidth="1000"\s+height="1400"/);
    assert.doesNotMatch(source, /<(?:image|script|foreignObject)\b/i);
    assert.doesNotMatch(source, /\b(?:xlink:)?href\s*=\s*["'](?!#)/i);
    assert.doesNotMatch(source, /@import|url\(\s*["']?(?:https?:|data:|\/\/)/i);
  }
  assert.ok(Object.isFrozen(REAR_INSERT_ASSETS));
});

test('fixed camera keeps the accepted seven-tenths-of-a-degree front elevation', () => {
  const position = fixedCameraPosition(25);
  const elevation = Math.atan2(position.y, position.z) * 180 / Math.PI;
  assert.equal(position.x, 0);
  assert.ok(Math.abs(elevation - 0.7) < 1e-10);
});

test('ring theme changes update the owned material and retain threaded readability', () => {
  const material = new THREE.MeshPhysicalMaterial();
  const ownedMaterial = material;
  applyRingAppearance(material, 'ocean', 3);
  const oceanColor = material.color.getHex();
  const oceanRoughness = material.roughness;
  applyRingAppearance(material, 'space', 3);
  assert.equal(material, ownedMaterial);
  assert.notEqual(material.color.getHex(), oceanColor);
  assert.notEqual(material.roughness, oceanRoughness);
  assert.ok(material.metalness > 0.5);
  applyRingAppearance(material, 'capybaras', 3, true);
  assert.equal(material.emissive.getHex(), theme('capybaras').colors.peg);
  assert.equal(material.emissiveIntensity, 0.24);
  material.dispose();
});

test('toy surface projection returns frozen CSS-pixel bounds from the fixed camera', () => {
  const camera = new THREE.PerspectiveCamera(37, 390 / 700, 0.1, 100);
  const position = fixedCameraPosition(25);
  camera.position.set(position.x, position.y, position.z);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
  const bounds = projectToySurfaceBounds(camera, 390, 700);
  assert.ok(bounds.left >= 0 && bounds.top > 0);
  assert.ok(bounds.width > 100 && bounds.width <= 390);
  assert.ok(bounds.height > 100 && bounds.height < 700);
  assert.equal(Object.isFrozen(bounds), true);
  assert.deepEqual(projectToySurfaceBounds(camera, 0, 700), { left: 0, top: 0, width: 0, height: 0 });
});
