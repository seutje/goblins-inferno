import { updateSpawner } from '../src/js/spawner.js';

beforeAll(() => {
  globalThis.Image = class {
    constructor() {
      this.complete = true;
    }
  };
});

describe('Enemy Spawner', () => {
  test('spawns enemies when timer reaches zero', () => {
    const canvas = { width: 100, height: 100 };
    const gameState = { enemies: [], spawnTimer: 0, spawnInterval: 60, difficulty: 0 };
    updateSpawner(gameState, canvas);
    expect(gameState.enemies.length).toBe(1);
  });
});
