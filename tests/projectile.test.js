import { Projectile, updateProjectiles } from '../src/js/projectile.js';

beforeAll(() => {
  globalThis.Image = class {
    constructor() {
      this.complete = true;
      this.naturalWidth = 16;
      this.naturalHeight = 16;
    }
  };
});

describe('Projectiles', () => {
  test('bounces off walls and decrements bouncesLeft', () => {
    const canvas = { width: 100, height: 100 };
    const gameState = { projectiles: [], world: { width: 100, height: 100 } };
    // Start near right edge moving right so it hits the wall
    const p = new Projectile(98, 50, { size: 5, speed: 10, dx: 1, dy: 0, bouncesLeft: 1 });
    gameState.projectiles.push(p);
    updateProjectiles(gameState, canvas);
    // Still present, now moving left, bouncesLeft reduced
    expect(gameState.projectiles).toHaveLength(1);
    expect(gameState.projectiles[0].dx).toBeLessThan(0);
    expect(gameState.projectiles[0].bouncesLeft).toBe(0);
  });

  test('removed when hitting wall with no bounces left', () => {
    const canvas = { width: 100, height: 100 };
    const gameState = { projectiles: [], world: { width: 100, height: 100 } };
    const p = new Projectile(98, 50, { size: 5, speed: 10, dx: 1, dy: 0, bouncesLeft: 0 });
    gameState.projectiles.push(p);
    updateProjectiles(gameState, canvas);
    expect(gameState.projectiles).toHaveLength(0);
  });

  test('shockwave expands and expires after lifetime', () => {
    const canvas = { width: 200, height: 200 };
    const gameState = { projectiles: [] };
    const shock = new Projectile(100, 100, { isShockwave: true, speed: 2, size: 1, faction: 'enemy' });
    gameState.projectiles.push(shock);
    for (let i = 0; i < 61; i++) {
      updateProjectiles(gameState, canvas);
    }
    expect(gameState.projectiles).toHaveLength(0);
  });
});

