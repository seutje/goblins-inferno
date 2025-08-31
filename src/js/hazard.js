// Hazards: lingering area effects like Ignis's fire trail
import { spawnHealthPickup } from './pickups.js';

export class FirePatch {
  constructor(x, y, { radius = 18, duration = 120, dps = 0.5, color = 'rgba(255,80,0,0.35)' } = {}) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.remaining = duration; // frames
    this.dps = dps; // damage per frame (approx)
    this.color = color;
    this.type = 'fire';
  }

  update(gameState) {
    // Apply damage to enemies in radius
    const r = this.radius;
    const r2 = r * r;
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
      const e = gameState.enemies[i];
      const dx = e.x - this.x;
      const dy = e.y - this.y;
      if ((dx * dx + dy * dy) <= r2) {
        if (typeof e.hp === 'number') {
          e.hp -= this.dps;
          if (e.hp <= 0) {
            if (!e.isBoss && Math.random() < 0.10) {
              spawnHealthPickup(gameState, e.x, e.y, { heal: 25 });
            }
            gameState.enemies.splice(i, 1);
          }
        }
      }
    }
    this.remaining--;
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function ensureHazards(gameState) {
  if (!gameState.hazards) gameState.hazards = [];
}

export function spawnFirePatch(gameState, x, y, opts = {}) {
  ensureHazards(gameState);
  gameState.hazards.push(new FirePatch(x, y, opts));
}

export function updateHazards(gameState) {
  ensureHazards(gameState);
  for (let i = gameState.hazards.length - 1; i >= 0; i--) {
    const h = gameState.hazards[i];
    h.update(gameState);
    if (h.remaining <= 0) gameState.hazards.splice(i, 1);
  }
}

export function drawHazards(gameState, ctx) {
  if (!gameState.hazards) return;
  gameState.hazards.forEach(h => h.draw(ctx));
}
