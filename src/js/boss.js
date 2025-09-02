import { Enemy } from './enemy.js';
import { versioned } from './assets.js';
import { saveMeta } from './meta.js';
import { spawnFirePatch, spawnBlackHole } from './hazard.js';
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
    this.hp = 800; // Colossal health
    this.hpMax = this.hp;
    this.speed = 0.8; // Slow
    this.abilityCooldown = 180; // Time between abilities
    this.shieldTimer = 0; // Countdown for shield duration
    this.shieldActive = false;
    this.sprite.src = versioned('src/img/sprite-champion.png');
  }

  update() {
    const player = this.gameState.player;
    if (!player) return;

    // Behavior logic
    if (this.shieldActive) {
      // If shield is up, stand still
      this.state = 'idle';
    } else {
      // Otherwise, move towards the player
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d > 50) { // Keep some distance
        this.x += (dx / d) * this.speed;
        this.y += (dy / d) * this.speed;
        this.state = 'walk';
      } else {
        this.state = 'idle';
      }
    }

    // Ability usage
    this.abilityCooldown--;
    if (this.abilityCooldown <= 0) {
      this.useAbility();
      this.abilityCooldown = 240; // Reset cooldown
    }

    if (this.shieldTimer > 0) {
      this.shieldTimer--;
      if (this.shieldTimer <= 0) {
        this.shieldActive = false;
      }
    }

    this.advanceFrame();
  }

  useAbility() {
    const choice = Math.random();
    if (choice < 0.6) {
      this.fieryClubSlam();
    } else {
      this.debtShield();
    }
  }

  fieryClubSlam() {
    this.state = 'attack';
    playSound('boss_attack');
    // Create a shockwave projectile
    const shockwave = new Projectile(this.x, this.y, {
      damage: 30, // Devastating damage
      speed: 4,
      size: 20,
      color: 'orange',
      faction: 'enemy',
      knockback: 5,
      isShockwave: true, // Custom flag for circular expansion
    });
    this.gameState.projectiles.push(shockwave);

    // Inferno Zone: Create lingering fire patches
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * 2 * Math.PI;
      const radius = 60;
      const x = this.x + Math.cos(angle) * radius;
      const y = this.y + Math.sin(angle) * radius;
      spawnFirePatch(this.gameState, x, y, { radius: 25, duration: 300, dps: 2, faction: 'enemy' });
    }
  }

  debtShield() {
    this.state = 'attack'; // Or a specific shield animation
    playSound('shield_up');
    this.shieldActive = true;
    this.shieldTimer = 300; // Shield lasts for 5 seconds
  }

  takeHit(projectile, gameState) {
    if (this.shieldActive) {
      playSound('reflect');
      // Reflect magic
      const player = gameState.player;
      if (player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const d = Math.hypot(dx, dy) || 1;
        const reflectedProj = new Projectile(this.x, this.y, {
          damage: projectile.damage * 1.5, // Reflected projectile is stronger
          speed: projectile.speed * 1.2,
          size: projectile.size,
          color: 'purple',
          dx: dx / d,
          dy: dy / d,
          faction: 'enemy',
        });
        gameState.projectiles.push(reflectedProj);
      }
      return; // Absorb hit, no damage
    }
    super.takeHit(projectile, gameState);
  }
}

export class InterestDragon extends BaseBoss {
  constructor(canvas, gameState) {
    super(canvas, gameState);
    this.name = 'The Interest Dragon';
    this.hp = 1200; // Colossal health
    this.hpMax = this.hp;
    this.speed = 1.0; // Medium speed
    this.abilityCooldown = 150; // Time between abilities
    this.shieldTimer = 0; // Countdown for shield duration
    this.shieldActive = false;
    this.sprite.src = versioned('src/img/sprite-dragon.png');
    this._absorbPhase = 0; // visual pulse for absorb state
  }

  update() {
    const player = this.gameState.player;
    if (!player) return;

    // Behavior: Float near the top, mirroring player's horizontal position
    const dx = player.x - this.x;
    this.x += Math.sign(dx) * this.speed * 0.8;
    if (this.y > this.canvas.height * 0.25) {
      this.y -= this.speed;
    } else {
      this.y += Math.sin(this.frame * 0.1) * 0.5; // Gentle bobbing motion
    }

    // Ability usage
    this.abilityCooldown--;
    if (this.abilityCooldown <= 0) {
      this.useAbility();
      this.abilityCooldown = 180; // Reset cooldown
    }

    if (this.shieldTimer > 0) {
      this.shieldTimer--;
      if (this.shieldTimer <= 0) {
        this.shieldActive = false;
      }
    }

    // Drive absorb visual pulse
    if (this.shieldActive) this._absorbPhase += 0.2; else this._absorbPhase *= 0.9;

    this.advanceFrame();
  }

  useAbility() {
    const choice = Math.random();
    if (choice < 0.45) {
      this.fieryRain();
    } else if (choice < 0.8) {
      this.debtSpiral();
    } else {
      this.loanSreath();
    }
  }

  fieryRain() {
    this.state = 'attack';
    playSound('boss_attack');
    const p = this.gameState.player;

    // Rain fireballs from above
    for (let i = 0; i < 12; i++) {
      const x = Math.random() * this.canvas.width;
      const y = -10 - Math.random() * 50;
      const proj = new Projectile(x, y, {
        damage: 15, // Devastating damage
        speed: 3 + Math.random() * 2,
        size: 5,
        color: 'orange',
        dx: 0,
        dy: 1,
        faction: 'enemy'
      });
      this.gameState.projectiles.push(proj);
    }

    // Spawn a few "gold bombs"
    for (let i = 0; i < 3; i++) {
      const x = Math.random() * this.canvas.width;
      const y = -20 - Math.random() * 50;
      const proj = new Projectile(x, y, {
        damage: 25,
        speed: 2.5,
        size: 8,
        color: 'gold',
        dx: 0,
        dy: 1,
        faction: 'enemy',
        isGoldBomb: true, // Custom flag
      });
      this.gameState.projectiles.push(proj);
    }
  }

  debtSpiral() {
    this.state = 'attack';
    playSound('black_hole'); // Assuming a sound effect exists
    // Create a black hole hazard that pulls the player in
    const targetX = this.gameState.player.x + (Math.random() - 0.5) * 100;
    const targetY = this.gameState.player.y + (Math.random() - 0.5) * 100;

    spawnBlackHole(this.gameState, targetX, targetY, {
      duration: 300, // Lasts 5 seconds
      pullForce: 2.5, // How strongly it pulls
      radius: 150,
    });
  }

  loanSreath() {
    this.state = 'attack'; // Or a specific shield animation
    playSound('shield_up');
    this.shieldActive = true;
    this.shieldTimer = 240; // Shield lasts for 4 seconds
  }

  takeHit(projectile, gameState) {
    if (this.shieldActive) {
      playSound('absorb'); // Assuming a sound effect exists
      // Absorb projectile and gain health
      this.hp = Math.min(this.hpMax, this.hp + projectile.damage);
      // Maybe create a visual effect here
      return; // Absorb hit, no damage
    }
    super.takeHit(projectile, gameState);
  }

  draw(ctx) {
    // Draw base sprite
    super.draw(ctx);
    // Overlay absorb visuals when active
    if (this.shieldActive) {
      const r = this.size + 10 + Math.sin(this._absorbPhase) * 3;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      // Radial golden glow
      const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r);
      g.addColorStop(0, 'rgba(248, 200, 90, 0.35)');
      g.addColorStop(1, 'rgba(248, 120, 40, 0.0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
      ctx.fill();
      // Orbiting sparks implying absorption
      for (let i = 0; i < 5; i++) {
        const a = this._absorbPhase * 1.6 + (i * (Math.PI * 2 / 5));
        const rr = r - 6 - (i % 2) * 5;
        const sx = this.x + Math.cos(a) * rr;
        const sy = this.y + Math.sin(a) * rr;
        ctx.fillStyle = 'rgba(255, 223, 112, 0.85)';
        ctx.beginPath();
        ctx.arc(sx, sy, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
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
    this.sprite.src = versioned('src/img/sprite-collector.png');
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
    boss.x = (gameState.world?.width || canvas.width) / 2;
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
    // Grant meta gem currency
    if (gameState.meta) {
      gameState.meta.gems = (gameState.meta.gems || 0) + 1;
      saveMeta(gameState.meta);
    }
    for (let i = 0; i < 10; i++) {
      const sprite = new Image();
      sprite.src = versioned('src/img/sprite-gem.png');
      const gem = {
        x: Math.max(16, Math.min(canvas.width - 16, gameState.boss.x + (Math.random() - 0.5) * 80)),
        y: Math.max(16, Math.min(canvas.height - 16, gameState.boss.y + (Math.random() - 0.5) * 80)),
        size: 12,
        value: 2,
        color: '#9ff',
        // animation (matches little gems): row 2 (index 1)
        sprite,
        frame: 0,
        frameTimer: 0,
        frameInterval: 8,
        row: 1,
        // ensure frame dims consistent with heart/gem/coin sheets
        frameWidth: 170,
        frameHeight: 205
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
  const y = canvas.height - pad - h; // move to bottom of the canvas
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
