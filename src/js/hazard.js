// Hazards: lingering area effects like Ignis's fire trail
import { spawnHealthPickup } from './pickups.js';
import { spawnCoin } from './level.js';
import { versioned } from './assets.js';
import { getImage } from './preload.js';

const SHEET_COLS = 6;
const SHEET_ROWS = 5;
const FRAME_W = 170;
const FRAME_H = 205;

export class FirePatch {
  constructor(x, y, { radius = 18, duration = 120, dps = 0.5, color = 'rgba(255,80,0,0.35)', faction = 'player' } = {}) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.remaining = duration; // frames
    this.dps = dps; // damage per frame (approx)
    this.color = color;
    this.type = 'fire';
    this.faction = faction;
    // Animated sprite sheet (like heart pickup)
    this.sprite = getImage('src/img/sprite-fire.png');
    this.frame = 0;
    this.frameTimer = 0;
    this.frameInterval = 6;
    this.frameWidth = FRAME_W;
    this.frameHeight = FRAME_H;
    this.row = 0;
  }

  update(gameState) {
    // Animate
    this.frameTimer++;
    if (this.frameTimer >= this.frameInterval) {
      this.frameTimer = 0;
      this.frame = (this.frame + 1) % SHEET_COLS;
    }

    if (this.faction === 'player') {
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
                        if (!e.isBoss) {
                          if (Math.random() < 0.10) {
                              spawnHealthPickup(gameState, e.x, e.y, { heal: 25 });
                          }
                          // Drop a coin when a non-boss dies in fire
                          spawnCoin(gameState, e.x, e.y, { value: 1 });
                          gameState.enemies.splice(i, 1);
                        }
                    }
                }
            }
        }
    } else { // faction === 'enemy'
        // Apply damage to player in radius (respect shields)
        const player = gameState.player;
        if (player && player.invuln <= 0) {
            const r = this.radius;
            const r2 = r * r;
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            if ((dx * dx + dy * dy) <= r2) {
                let dmg = this.dps || 0;
                if ((player.shield || 0) > 0) {
                    const absorbed = Math.min(player.shield, dmg);
                    player.shield -= absorbed;
                    dmg -= absorbed;
                    player.shieldRegenCooldown = Math.max(player.shieldRegenCooldown || 0, 120);
                }
                if (dmg > 0) {
                    player.hp = Math.max(0, (player.hp || 0) - dmg);
                    player.invuln = 60; // 1 second of invulnerability
                }
            }
        }
    }

    this.remaining--;
  }

  draw(ctx) {
    const hasSprite = this.sprite && this.sprite.complete && (this.sprite.naturalWidth || 0) > 0;
    if (hasSprite) {
      const sx = (this.frame % SHEET_COLS) * (this.frameWidth || FRAME_W);
      const sy = (this.row % SHEET_ROWS) * (this.frameHeight || FRAME_H);
      const destH = this.radius * 2;
      const destW = destH * (FRAME_W / FRAME_H);
      ctx.drawImage(
        this.sprite,
        sx, sy, (this.frameWidth || FRAME_W), (this.frameHeight || FRAME_H),
        this.x - destW / 2,
        this.y - destH / 2,
        destW, destH
      );
    } else {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export class BlackHole {
  constructor(x, y, { radius = 150, duration = 300, pullForce = 2.5 } = {}) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.remaining = duration;
    this.pullForce = pullForce;
    this.type = 'black_hole';
    this.angle = 0;
  }

  update(gameState) {
    const player = gameState.player;
    if (player) {
      const dx = this.x - player.x;
      const dy = this.y - player.y;
      const d = Math.hypot(dx, dy);
      if (d < this.radius) {
        const force = (1 - (d / this.radius)) * this.pullForce;
        player.x += (dx / d) * force;
        player.y += (dy / d) * force;
      }
    }
    this.remaining--;
    this.angle += 0.05;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.5, 'rgba(50,0,100,0.5)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.9)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function ensureHazards(gameState) {
  if (!gameState.hazards) gameState.hazards = [];
}

export function spawnFirePatch(gameState, x, y, opts = {}) {
  ensureHazards(gameState);
  gameState.hazards.push(new FirePatch(x, y, opts));
}

export function spawnBlackHole(gameState, x, y, opts = {}) {
  ensureHazards(gameState);
  gameState.hazards.push(new BlackHole(x, y, opts));
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
