// Leveling, gems, and upgrades
import { playSound } from './audio.js';
import { versioned } from './assets.js';

const GEM_SHEET_COLS = 6;
const GEM_SHEET_ROWS = 5;
const GEM_FRAME_W = 170;
const GEM_FRAME_H = 205;

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const RARITIES = [
  { key: 'normal', name: 'Normal', color: '#dddddd', boost: 0.25, weight: 60 },
  { key: 'rare', name: 'Rare', color: '#33aaff', boost: 0.50, weight: 25 },
  { key: 'epic', name: 'Epic', color: '#a64cff', boost: 1.00, weight: 10 },
  { key: 'legendary', name: 'Legendary', color: '#ffa500', boost: 2.00, weight: 5 }
];

function rollRarity() {
  const total = RARITIES.reduce((s, r) => s + r.weight, 0);
  let pick = Math.random() * total;
  for (const r of RARITIES) {
    pick -= r.weight;
    if (pick <= 0) return r;
  }
  return RARITIES[0];
}

export function initLevelSystem(gameState, canvas) {
  // Internal timers
  gameState._gemTimer = 120;

  // Initialize player stat multipliers if missing
  if (!gameState.player.stats) {
    gameState.player.stats = {
      speedMultiplier: 1,
      fireRateMultiplier: 1,
      damageMultiplier: 1,
      projSizeMultiplier: 1
    };
  }

  // Define base upgrade pool (rarity applied at roll time)
  const basePool = [
    { id: 'spd', name: 'Fleet Feet', stat: 'speedMultiplier', desc: '+Move speed' },
    { id: 'firerate', name: 'Rapid Fire', stat: 'fireRateMultiplier', desc: '+Fire rate' },
    { id: 'dmg', name: 'Hotter Flames', stat: 'damageMultiplier', desc: '+Projectile damage' },
    { id: 'size', name: 'Bigger Blasts', stat: 'projSizeMultiplier', desc: '+Projectile size' },
    { id: 'firerate2', name: 'Blazing Hands', stat: 'fireRateMultiplier', desc: '+Fire rate' },
    { id: 'dmg2', name: 'White Heat', stat: 'damageMultiplier', desc: '+Projectile damage' }
  ];
  gameState.upgradePool = basePool;

  // Wire modal UI
  const modal = document.getElementById('upgradeModal');
  const slots = [0,1,2].map(i => ({
    container: document.getElementById(`choice${i}`),
    title: document.getElementById(`choice${i}-title`),
    desc: document.getElementById(`choice${i}-desc`)
  }));

  function openUpgrade(choices) {
    gameState.paused = true;
    gameState.upgradeChoices = choices;
    choices.forEach((u, i) => {
      const slot = slots[i];
      if (slot) {
        slot.title.textContent = `${u.rarity.name} ${u.name}`;
        slot.title.style.color = u.rarity.color;
        const pct = Math.round(u.rarity.boost * 100);
        slot.desc.textContent = `${u.desc} (+${pct}%)`;
      }
    });
    modal.style.display = 'flex';
  }

  function closeUpgrade() {
    modal.style.display = 'none';
    gameState.upgradeChoices = [];
    gameState.paused = false;
  }

  gameState.onChooseUpgrade = (idx) => {
    const u = gameState.upgradeChoices[idx];
    if (u && typeof u.apply === 'function') {
      u.apply(gameState);
    }
    playSound('upgrade');
    closeUpgrade();
  };

  slots.forEach((slot, i) => {
    slot.container.addEventListener('click', () => gameState.onChooseUpgrade(i));
  });

  // Expose open function for internal use
  gameState._openUpgradeModal = openUpgrade;
}

export function updateLevelSystem(gameState, canvas) {
  // Spawn gems periodically for now (until enemy loot is wired)
  if (gameState._gemTimer-- <= 0) {
    // Regular world pickups are coins (boss drops remain gems)
    const sprite = new Image();
    sprite.src = versioned('src/img/sprite-coin.png');
    const W = (gameState.world?.width) || canvas.width;
    const H = (gameState.world?.height) || canvas.height;
    const coin = {
      x: randInt(16, W - 16),
      y: randInt(16, H - 16),
      size: 14,
      value: 1,
      color: '#fc3',
      // animation fields (same sheet layout as gem/heart)
      sprite,
      frame: 0,
      frameTimer: 0,
      frameInterval: 8,
      frameWidth: GEM_FRAME_W,
      frameHeight: GEM_FRAME_H,
      row: 1 // use second row
    };
    gameState.gems.push(coin);
    // Scale frequency modestly with difficulty using balance
    const base = gameState.balance?.gemTimerBase ?? 180;
    const min = gameState.balance?.gemTimerMin ?? 90;
    gameState._gemTimer = Math.max(min, base - Math.floor(gameState.difficulty));
  }

  // Animate and attract nearby gems toward the player
  const p = gameState.player;
  if (p) {
    // animate
    for (let i = 0; i < gameState.gems.length; i++) {
      const g = gameState.gems[i];
      if (g.sprite) {
        g.frameTimer++;
        if (g.frameTimer >= g.frameInterval) {
          g.frameTimer = 0;
          g.frame = (g.frame + 1) % GEM_SHEET_COLS;
        }
      }
    }
    const attractRadius = gameState.magnetRadius ?? 110;
    const maxPull = gameState.magnetMaxPull ?? 6; // px/frame near the player
    for (let i = 0; i < gameState.gems.length; i++) {
      const g = gameState.gems[i];
      const dx = g.x - p.x;
      const dy = g.y - p.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < attractRadius) {
        const nx = -dx / dist; // direction gem -> player
        const pull = Math.min(maxPull, 1 + (attractRadius - dist) / 20);
        g.x += nx * pull;
        g.y += (-dy / dist) * pull;
      }
    }
  }

  // Check gem pickup
  // reuse p
  for (let i = gameState.gems.length - 1; i >= 0; i--) {
    const g = gameState.gems[i];
    const dx = g.x - p.x;
    const dy = g.y - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= (g.size + p.size)) {
      // Collect
      gameState.xp += g.value;
      gameState.totalGems += g.value;
      // Treat gem as gold to drive debt interactions
      if (gameState.debt) {
        gameState.debt.gold += g.value;
        if (typeof gameState._refreshDebtHUD === 'function') gameState._refreshDebtHUD();
      }
      // Fizzle trait: small chance to grant a temporary potion effect
      if (gameState.character === 'Fizzle' && Math.random() < 0.15) {
        const duration = 60 * 5;
        if (!gameState._buffs) gameState._buffs = [];
        const roll = Math.floor(Math.random() * 3);
        if (roll === 0) {
          gameState.player.stats.speedMultiplier *= 1.25;
          gameState._buffs.push({ remaining: duration, undo: () => { gameState.player.stats.speedMultiplier /= 1.25; } });
        } else if (roll === 1) {
          gameState.player.stats.damageMultiplier *= 1.25;
          gameState._buffs.push({ remaining: duration, undo: () => { gameState.player.stats.damageMultiplier /= 1.25; } });
        } else {
          gameState.player.stats.fireRateMultiplier *= 1.25;
          gameState._buffs.push({ remaining: duration, undo: () => { gameState.player.stats.fireRateMultiplier /= 1.25; } });
        }
      }
      gameState.gems.splice(i, 1);
      // Level-up check
      while (gameState.xp >= gameState.nextLevelXp) {
        gameState.xp -= gameState.nextLevelXp;
        gameState.level += 1;
        gameState.nextLevelXp = Math.ceil(gameState.nextLevelXp * 1.5);
        // Offer upgrades
        const rolled = sampleUpgrades(gameState.upgradePool, 3).map(base => makeRarityUpgrade(base));
        const choices = rolled;
        if (choices.length > 0 && gameState._openUpgradeModal) {
          gameState._openUpgradeModal(choices);
        }
      }
    }
  }
}

export function drawGems(gameState, ctx) {
  gameState.gems.forEach(g => {
    const s = (g.size || 6) * 2;
    const hasSprite = g.sprite && g.sprite.complete && (g.sprite.naturalWidth || 0) > 0;
    if (hasSprite) {
      const sx = (g.frame % GEM_SHEET_COLS) * (g.frameWidth || GEM_FRAME_W);
      const sy = (g.row % GEM_SHEET_ROWS) * (g.frameHeight || GEM_FRAME_H);
      const destH = s; // base height equal to diameter
      const destW = destH * (GEM_FRAME_W / GEM_FRAME_H);
      ctx.drawImage(
        g.sprite,
        sx, sy, (g.frameWidth || GEM_FRAME_W), (g.frameHeight || GEM_FRAME_H),
        g.x - destW / 2,
        g.y - destH / 2,
        destW, destH
      );
    } else {
      ctx.fillStyle = g.color || '#3ff';
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.size || 6, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function sampleUpgrades(pool, n) {
  const result = [];
  const used = new Set();
  let attempts = 0;
  while (result.length < n && attempts < 50) {
    attempts++;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (!pick) break;
    if (used.has(pick.id)) continue;
    used.add(pick.id);
    result.push(pick);
  }
  return result;
}

function makeRarityUpgrade(base) {
  const rarity = rollRarity();
  const pct = rarity.boost;
  const id = `${base.id}_${rarity.key}`;
  const name = base.name;
  const desc = base.desc;
  const stat = base.stat;
  const apply = (gs) => {
    if (!gs?.player?.stats) return;
    if (stat in gs.player.stats) {
      gs.player.stats[stat] *= (1 + pct);
    }
  };
  return { id, name, desc, stat, rarity, apply };
}
