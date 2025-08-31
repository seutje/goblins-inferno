import { Enemy } from './enemy.js';
import { versioned } from './assets.js';
import { spawnFirePatch } from './hazard.js';
import { Projectile } from './projectile.js';
import { playSound } from './audio.js';

class BaseBoss extends Enemy {
  constructor(canvas, gameState) {
    super(canvas, gameState);
    this.isBoss = true;
    this.hpMax = this.hp;
    this.name = 'Boss';
    // Visual sheet size will be computed dynamically; scale to desired hit radius
    this.frameWidth = 64;
    this.frameHeight = 64;
    this.size = 36;
  }

  takeHit(projectile, gameState) {
    // Default boss takes damage like normal enemy
    if (typeof this.hp === 'number') this.hp -= (projectile.damage || 0);
  }
}

export class CreditorChampion extends BaseBoss {
  constructor(canvas, gameState) {
    super(canvas, gameState);
    this.name = "Creditor's Champion";
    this.hp = 400;
    this.hpMax = this.hp;
    this.speed = 1.1;
    this.slamCooldown = 120; // frames
    this.sprite.src = versioned('src/img/boss-champion.png');
  }

  update() {
    const player = this.gameState.player;
    if (player) {
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d > 0) {
        this.x += (dx / d) * this.speed;
        this.y += (dy / d) * this.speed;
        this.state = 'walk';
      }
      if (this.slamCooldown-- <= 0) {
        // Create a plus-shaped set of fire patches centered near player
        const offsets = [
          [0, 0], [24, 0], [-24, 0], [0, 24], [0, -24]
        ];
        offsets.forEach(([ox, oy]) => spawnFirePatch(this.gameState, player.x + ox, player.y + oy, { radius: 18, duration: 150, dps: 0.7 }));
        this.state = 'attack';
        this.slamCooldown = 180;
      }
    }
    this.advanceFrame();
  }
}

export class InterestDragon extends BaseBoss {
  constructor(canvas, gameState) {
    super(canvas, gameState);
    this.name = 'The Interest Dragon';
    this.hp = 550;
    this.hpMax = this.hp;
    this.speed = 0.8;
    this.volleyCooldown = 90;
    this.sprite.src = versioned('src/img/boss-dragon.png');
  }

  update() {
    const p = this.gameState.player;
    if (p) {
      // Float horizontally to mirror player slowly
      const dx = p.x - this.x;
      this.x += Math.sign(dx) * this.speed;
      // Stay near top quarter
      if (this.y > this.canvas.height * 0.25) this.y -= this.speed;
    }
    if (this.volleyCooldown-- <= 0) {
      // Rain fireballs from above
      for (let i = 0; i < 8; i++) {
        const x = Math.random() * this.canvas.width;
        const y = -10;
        const proj = new Projectile(x, y, { damage: 2, speed: 3, size: 4, color: 'orange', dx: 0, dy: 1, faction: 'enemy' });
        this.gameState.projectiles.push(proj);
      }
      // Aim a few toward player
      if (p) {
        for (let i = 0; i < 3; i++) {
          const dx = p.x - this.x;
          const dy = p.y - this.y;
          const d = Math.hypot(dx, dy) || 1;
          const proj = new Projectile(this.x, this.y, { damage: 3, speed: 4, size: 5, color: 'red', dx: dx / d, dy: dy / d, faction: 'enemy' });
          this.gameState.projectiles.push(proj);
        }
      }
      this.state = 'attack';
      this.volleyCooldown = 120;
    }
    this.advanceFrame();
  }
}

export class DebtCollector extends BaseBoss {
  constructor(canvas, gameState) {
    super(canvas, gameState);
    this.name = 'The Debt Collector';
    this.hp = 700;
    this.hpMax = this.hp;
    this.speed = 1.0;
    this.absorbTimer = 0; // when >0, absorbing projectiles
    this.reflectBurst = 0; // counts reflected shots queued
    this.sprite.src = versioned('src/img/boss-collector.png');
  }

  update() {
    const p = this.gameState.player;
    if (p) {
      const dx = p.x - this.x;
      const dy = p.y - this.y;
      const d = Math.hypot(dx, dy) || 1;
      // Keep mid-distance
      const targetDist = 200;
      if (d > targetDist + 10) {
        this.x += (dx / d) * this.speed;
        this.y += (dy / d) * this.speed;
      } else if (d < targetDist - 10) {
        this.x -= (dx / d) * this.speed;
        this.y -= (dy / d) * this.speed;
      }
    }

    // Phase toggling: absorb for a short window when below half health
    if (this.hp < this.hpMax * 0.6) {
      if (this.absorbTimer <= 0 && Math.random() < 0.01) {
        this.absorbTimer = 90; // absorb for 1.5s
        this.state = 'attack';
      }
    }

    if (this.absorbTimer > 0) {
      this.absorbTimer--;
      // Periodically reflect stored shots back at player
      if (this.reflectBurst > 0 && this.absorbTimer % 10 === 0) {
        this.fireAtPlayer(1);
        this.reflectBurst--;
      }
    } else if (p && Math.random() < 0.02) {
      // Non-absorb basic shot
      this.fireAtPlayer(1);
    }

    this.advanceFrame();
  }

  fireAtPlayer(count = 1) {
    const p = this.gameState.player;
    if (!p) return;
    for (let i = 0; i < count; i++) {
      const dx = p.x - this.x;
      const dy = p.y - this.y;
      const d = Math.hypot(dx, dy) || 1;
      const proj = new Projectile(this.x, this.y, { damage: 3, speed: 5, size: 5, color: '#4cf', dx: dx / d, dy: dy / d, faction: 'enemy' });
      this.gameState.projectiles.push(proj);
    }
  }

  takeHit(projectile, gameState) {
    if (this.absorbTimer > 0) {
      // Absorb and queue reflection instead of taking damage
      this.reflectBurst = Math.min(this.reflectBurst + 1, 10);
      return; // no damage
    }
    // Normal damage when not absorbing
    super.takeHit(projectile, gameState);
  }
}

export function updateBoss(gameState, canvas) {
  if (!gameState._bossInit) {
    gameState._bossInit = true;
    gameState._bossIndex = 0;
    gameState._bossThresholds = gameState.balance?.bossThresholds || [30, 80, 140]; // difficulty milestones
  }

  // Spawn next boss when threshold is reached and no active boss
  if (!gameState.boss && gameState.difficulty >= (gameState._bossThresholds[gameState._bossIndex] || Infinity)) {
    let BossClass = CreditorChampion;
    if (gameState._bossIndex === 1) BossClass = InterestDragon;
    else if (gameState._bossIndex === 2) BossClass = DebtCollector;
    const boss = new BossClass(canvas, gameState);
    boss.x = canvas.width / 2;
    boss.y = 80;
    gameState.boss = boss;
    gameState.enemies.push(boss);
    playSound('boss_spawn');
  }

  // Cleanup when boss dies
  if (gameState.boss && gameState.boss.hp <= 0) {
    // Remove from enemies list
    const idx = gameState.enemies.indexOf(gameState.boss);
    if (idx >= 0) gameState.enemies.splice(idx, 1);
    // Rewards
    if (gameState.debt) gameState.debt.gold += 250;
    for (let i = 0; i < 10; i++) {
      const gem = {
        x: Math.max(16, Math.min(canvas.width - 16, gameState.boss.x + (Math.random() - 0.5) * 80)),
        y: Math.max(16, Math.min(canvas.height - 16, gameState.boss.y + (Math.random() - 0.5) * 80)),
        size: 12,
        value: 2,
        color: '#9ff'
      };
      gameState.gems.push(gem);
    }
    gameState.boss = null;
    gameState._bossIndex = Math.min(gameState._bossIndex + 1, 3);
    if (typeof gameState._refreshDebtHUD === 'function') gameState._refreshDebtHUD();
    playSound('boss_down');
  }
}

export function drawBossHUD(gameState, ctx, canvas) {
  const b = gameState.boss;
  if (!b) return;
  const pad = 10;
  const w = canvas.width - pad * 2;
  const h = 14;
  const x = pad;
  const y = pad;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(x, y, w, h);
  const frac = Math.max(0, Math.min(1, (b.hp || 0) / (b.hpMax || 1)));
  ctx.fillStyle = '#e33';
  ctx.fillRect(x, y, w * frac, h);
  ctx.strokeStyle = '#555';
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = '#eee';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${b.name}  ${Math.ceil((b.hp||0))}/${Math.ceil((b.hpMax||0))}`, x + 4, y + h - 3);
}
