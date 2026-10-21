import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { fitToyCameraDistance, fixedCameraPosition, projectToySurfaceBounds } from '../src/rendering/player-renderer';
import { PLAYER_TOY_LAYOUT } from '../src/models/selected-toy';

const tank = PLAYER_TOY_LAYOUT.tank;
const sizes = [[304, 348], [344, 444], [377, 506], [414, 680], [828, 256], [1008, 634], [760, 440]];

test('adaptive framing keeps the complete shallow acrylic shell inside every phone/tablet/desktop viewport', () => {
  for (const [width, height] of sizes) {
    const camera = new THREE.PerspectiveCamera(37, width / height, .1, 100);
    const position = fixedCameraPosition(fitToyCameraDistance(width, height, tank));
    camera.position.set(position.x, position.y, position.z);
    camera.lookAt(0, 0, 0); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    let largestExtent = 0;
    for (const x of [-tank.x - .29, tank.x + .29])
      for (const y of [-tank.y - .31, tank.y + .31])
        for (const z of [-tank.z - .24, tank.z + .24]) {
          const projected = new THREE.Vector3(x, y, z).project(camera);
          assert.ok(Math.abs(projected.x) <= .920001 && Math.abs(projected.y) <= .920001, `${width}×${height}: no shell corner clipped`);
          assert.ok(projected.z > -1 && projected.z < 1, 'inside depth clipping planes');
          largestExtent = Math.max(largestExtent, Math.abs(projected.x), Math.abs(projected.y));
        }
    assert.ok(largestExtent >= .9199, 'fill one dimension instead of leaving unused space in both');
    const surface = projectToySurfaceBounds(camera, width, height, tank);
    assert.ok(surface.width > 0 && surface.height > 0 && surface.left > 0 && surface.top > 0, 'sticker surface remains visible');
  }
});

test('browser chrome height changes update framing smoothly without changing camera elevation or physical layout', () => {
  const layoutBefore = JSON.stringify(PLAYER_TOY_LAYOUT);
  let previous = 0;
  for (let height = 350; height <= 700; height++) {
    const distance = fitToyCameraDistance(377, height, tank);
    const position = fixedCameraPosition(distance);
    assert.ok(Number.isFinite(distance) && distance > 0);
    assert.ok(Math.abs(Math.atan2(position.y, position.z) * 180 / Math.PI - .7) < 1e-10);
    if (previous) assert.ok(Math.abs(distance - previous) < .1, 'no framing jump at aspect-ratio crossover');
    previous = distance;
  }
  assert.equal(JSON.stringify(PLAYER_TOY_LAYOUT), layoutBefore);
  assert.ok(Number.isFinite(fitToyCameraDistance(0, 0, tank)), 'hidden setup viewport has a safe fallback');
});
