import { updateSpawner } from '../src/js/spawner.js';
import { updateProjectiles } from '../src/js/projectile.js';
import { spawnFirePatch, updateHazards } from '../src/js/hazard.js';
import { updateBoss } from '../src/js/boss.js';

beforeAll(() => {
  globalThis.Image = class { constructor(){ this.complete = true; this.naturalWidth = 16; } };
});

test('core update functions run for many frames without growth', () => {
  const canvas = { width: 300, height: 200 };
  const gameState = {
    keys: {},
    enemies: [],
    projectiles: [],
    hazards: [],
    gems: [],
    difficulty: 0,
    spawnTimer: 0,
    spawnInterval: 60,
    player: { x: 150, y: 100, size: 10, stats: { damageMultiplier: 1, projSizeMultiplier: 1 } }
  };

  // Seed a hazard
  spawnFirePatch(gameState, 100, 100, { duration: 10 });

  for (let i = 0; i < 120; i++) {
    updateSpawner(gameState, canvas);
    updateProjectiles(gameState, canvas);
    updateHazards(gameState);
    updateBoss(gameState, canvas);
  }

  expect(gameState.enemies.length).toBeGreaterThan(0);
  // Hazards should expire
  expect(gameState.hazards.length).toBe(0);
});
