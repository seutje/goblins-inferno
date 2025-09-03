import { spawnHealthPickup, updatePickups } from '../src/js/pickups.js';

beforeAll(() => {
  globalThis.Image = class {
    constructor() {
      this.complete = true;
      this.naturalWidth = 16;
      this.naturalHeight = 16;
    }
  };
});

describe('Pickups', () => {
  test('health pickup heals player and is removed', () => {
    const gameState = { player: { x: 50, y: 50, size: 10, hp: 50, maxHp: 100 }, pickups: [] };
    spawnHealthPickup(gameState, 50, 50, { heal: 25 });
    expect(gameState.pickups.length).toBe(1);
    updatePickups(gameState);
    expect(gameState.pickups.length).toBe(0);
    expect(gameState.player.hp).toBe(75);
  });

  test('health pickup is attracted toward player', () => {
    const gameState = { player: { x: 50, y: 50, size: 6, hp: 80, maxHp: 100 }, pickups: [] };
    spawnHealthPickup(gameState, 100, 50, { heal: 5 });
    const beforeX = gameState.pickups[0].x;
    updatePickups(gameState);
    expect(gameState.pickups[0].x).toBeLessThan(beforeX);
  });
});

