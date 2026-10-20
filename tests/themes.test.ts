import assert from 'node:assert/strict';
import test from 'node:test';
import { REAR_INSERT_ASSETS, THEMES, theme, type ThemeId } from '../src/themes';
import { fixedCameraPosition } from '../src/rendering/player-renderer';

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

test('every theme bundles an original illustrated rear insert with open center contrast', () => {
  const scenes: Record<ThemeId, string[]> = {
    ocean: ['coral', 'seaweed', 'fill="#ff9d73"'],
    capybaras: ['habitat', 'ellipse cx="94" cy="113"', 'stroke="#537b4d"'],
    space: ['nebula', 'circle cx="151" cy="436"', 'M122 28'],
  };
  for (const id of Object.keys(scenes) as ThemeId[]) {
    const asset = REAR_INSERT_ASSETS[id];
    assert.equal(asset.mimeType, 'image/svg+xml');
    assert.match(asset.source, /^data:image\/svg\+xml,/);
    const source = decodeURIComponent(asset.source.slice('data:image/svg+xml,'.length));
    assert.match(source, /^<svg\s/);
    for (const motif of scenes[id]) assert.ok(source.includes(motif), `${id} insert includes ${motif}`);
    assert.match(source, /radialGradient id="clear"/);
  }
  assert.ok(Object.isFrozen(REAR_INSERT_ASSETS));
});

test('fixed camera keeps the accepted seven-tenths-of-a-degree front elevation', () => {
  const position = fixedCameraPosition(25);
  const elevation = Math.atan2(position.y, position.z) * 180 / Math.PI;
  assert.equal(position.x, 0);
  assert.ok(Math.abs(elevation - 0.7) < 1e-10);
});
