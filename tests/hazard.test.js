import { FirePatch, updateHazards, spawnFirePatch } from '../src/js/hazard.js';

beforeAll(() => {
  globalThis.Image = class { constructor(){ this.complete = true; } };
});

describe('Hazards', () => {
  test('player fire patch damages enemies within radius', () => {
    const gameState = { enemies: [], hazards: [] };
    // Enemy at (50,50)
    const enemy = { x: 50, y: 50, hp: 5 };
    gameState.enemies.push(enemy);

    // Patch centered close to enemy
    spawnFirePatch(gameState, 55, 50, { radius: 20, duration: 5, dps: 1, faction: 'player' });

    // Advance a few frames
    for (let i = 0; i < 3; i++) updateHazards(gameState);

    expect(enemy.hp).toBeLessThan(5);
  });

  test('enemy fire patch damages player within radius', () => {
    const gameState = { player: { x: 50, y: 50, hp: 10, invuln: 0 }, hazards: [] };

    // Patch centered close to player
    spawnFirePatch(gameState, 55, 50, { radius: 20, duration: 5, dps: 1, faction: 'enemy' });

    // Advance a few frames
    for (let i = 0; i < 3; i++) updateHazards(gameState);

    expect(gameState.player.hp).toBeLessThan(10);
  });
});
