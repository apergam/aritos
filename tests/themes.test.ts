import assert from 'node:assert/strict';
import test from 'node:test';
import { THEMES, theme, type ThemeId } from '../src/themes';

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
