import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_STICKERS, normalizeStickerPoint, parseStickerData, processStickerVictory, type StickerData } from '../src/stickers';

test('a theme victory grants its one catalog reward once and earned rewards cross themes', () => {
  let data: StickerData = { unlocked: [], placements: [] };
  let awardedRound: number | null = null;
  const first = processStickerVictory(data, 4, awardedRound, 4, 'ocean', DEFAULT_STICKERS);
  data = first.data; awardedRound = first.awardedRoundId;
  assert.deepEqual(data.unlocked, ['ocean-octopus']);
  assert.equal(first.reward?.id, 'ocean-octopus');
  const duplicateVictory = processStickerVictory(data, 4, awardedRound, 4, 'ocean', DEFAULT_STICKERS);
  assert.equal(duplicateVictory.data, data);
  assert.equal(duplicateVictory.reward, null);
  // Theme changes within a round retain the once-per-round guard.
  const afterThemeChange = processStickerVictory(data, 4, awardedRound, 4, 'space', DEFAULT_STICKERS);
  assert.equal(afterThemeChange.data, data);
  assert.equal(afterThemeChange.reward, null);
  const nextRound = processStickerVictory(data, 5, awardedRound, 5, 'space', DEFAULT_STICKERS);
  data = nextRound.data;
  assert.deepEqual(data.unlocked, ['ocean-octopus', 'space-rocket']);
  const stale = processStickerVictory(data, 5, nextRound.awardedRoundId, 4, 'capybaras', DEFAULT_STICKERS);
  assert.equal(stale.data, data);
  assert.equal(parseStickerData(JSON.stringify({ version: 1, data }), DEFAULT_STICKERS).unlocked.length, 2);
});

test('reload parsing allowlists IDs, clamps no malformed coordinates, and caps unique placements at three', () => {
  const payload = JSON.stringify({ version: 1, data: {
    unlocked: ['ocean-octopus', 'space-rocket', 'capybara-capy', 'unknown', 'ocean-octopus'],
    placements: [
      { id: 'ocean-octopus', x: 0.1, y: 0.2 },
      { id: 'space-rocket', x: 0.5, y: 0.5 },
      { id: 'capybara-capy', x: 0.9, y: 0.8 },
      { id: 'ocean-octopus', x: 0.4, y: 0.4 },
      { id: 'bad', x: 0.4, y: 0.4 },
      { id: 'space-rocket', x: Number.NaN, y: 0.1 },
    ],
  } });
  assert.deepEqual(parseStickerData(payload, DEFAULT_STICKERS), {
    unlocked: ['ocean-octopus', 'space-rocket', 'capybara-capy'],
    placements: [
      { id: 'ocean-octopus', x: 0.1, y: 0.2 },
      { id: 'space-rocket', x: 0.5, y: 0.5 },
      { id: 'capybara-capy', x: 0.9, y: 0.8 },
    ],
  });
});

test('malformed, unsupported, and unavailable save data safely falls back empty', () => {
  assert.deepEqual(parseStickerData('{broken', DEFAULT_STICKERS), { unlocked: [], placements: [] });
  assert.deepEqual(parseStickerData('{"version":9,"data":{"unlocked":["ocean-octopus"]}}', DEFAULT_STICKERS), { unlocked: [], placements: [] });
  assert.deepEqual(parseStickerData(null, DEFAULT_STICKERS), { unlocked: [], placements: [] });
});

test('placement coordinates stay inside the toy surface and reject invalid dimensions', () => {
  assert.deepEqual(normalizeStickerPoint({ x: 18, y: 900 }, 300, 200), { x: 0.06, y: 0.94 });
  assert.deepEqual(normalizeStickerPoint({ x: 150, y: 100 }, 300, 200), { x: 0.5, y: 0.5 });
  // A 29px sticker (14% of a 205px toy front) remains fully inside the surface.
  assert.deepEqual(normalizeStickerPoint({ x: 0, y: 0 }, 205, 274, 29 / (2 * 205) + 0.01, 29 / (2 * 274) + 0.01), {
    x: 29 / (2 * 205) + 0.01,
    y: 29 / (2 * 274) + 0.01,
  });
  assert.equal(normalizeStickerPoint({ x: 5, y: 5 }, 0, 200), null);
  assert.equal(normalizeStickerPoint({ x: Number.NaN, y: 5 }, 300, 200), null);
});
