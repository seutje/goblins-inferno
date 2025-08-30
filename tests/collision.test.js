import { Projectile } from '../src/projectile.js';

beforeAll(() => {
  globalThis.Image = class { constructor(){ this.complete = true; } };
});

// Minimal copy of collision logic for unit scope: simulate a hit
function collide(projectiles, enemies) {
  for (let pi = projectiles.length - 1; pi >= 0; pi--) {
    const p = projectiles[pi];
    for (let ei = enemies.length - 1; ei >= 0; ei--) {
      const e = enemies[ei];
      const halfW = (e.frameWidth || 0) / 2;
      const halfH = (e.frameHeight || 0) / 2;
      const left = e.x - halfW;
      const right = e.x + halfW;
      const top = e.y - halfH;
      const bottom = e.y + halfH;
      const nearestX = Math.max(left, Math.min(p.x, right));
      const nearestY = Math.max(top, Math.min(p.y, bottom));
      const dx = p.x - nearestX;
      const dy = p.y - nearestY;
      const r = (p.size || 0);
      if (dx * dx + dy * dy <= r * r) {
        if (typeof e.hp === 'number') e.hp -= (p.damage || 0);
        projectiles.splice(pi, 1);
        if (e.hp !== undefined && e.hp <= 0) enemies.splice(ei, 1);
        break;
      }
    }
  }
}

describe('Projectile-Enemy Collision', () => {
  test('enemy hp decreases on hit', () => {
    const enemies = [{ x: 50, y: 50, frameWidth: 20, frameHeight: 20, hp: 3 }];
    const p = new Projectile(50, 50, { damage: 2, size: 6 });
    const projectiles = [p];
    collide(projectiles, enemies);
    expect(enemies[0].hp).toBe(1);
    expect(projectiles.length).toBe(0);
  });
});

