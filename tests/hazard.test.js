import { FirePatch, updateHazards, spawnFirePatch } from '../src/hazard.js';

beforeAll(() => {
  globalThis.Image = class { constructor(){ this.complete = true; } };
});

describe('Hazards', () => {
  test('fire patch damages enemies within radius', () => {
    const gameState = { enemies: [], hazards: [] };
    // Enemy at (50,50)
    const enemy = { x: 50, y: 50, hp: 5 };
    gameState.enemies.push(enemy);

    // Patch centered close to enemy
    spawnFirePatch(gameState, 55, 50, { radius: 20, duration: 5, dps: 1 });

    // Advance a few frames
    for (let i = 0; i < 3; i++) updateHazards(gameState);

    expect(enemy.hp).toBeLessThan(5);
  });
});

