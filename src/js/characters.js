// Character selection and trait wiring
import { versioned } from './assets.js';

export const CHARACTERS = {
  Gnorp: {
    name: 'Gnorp the Pyromaniac',
    weapon: 'inferno',
    stats: { baseSpeed: 2.5, damageMultiplier: 1.3, fireRateMultiplier: 1.0, projSizeMultiplier: 1.1 },
    trait: 'closeDamage',
    sprite: 'src/img/sprite-gnorp.png',
    frameWidth: 170,
    frameHeight: 205,
    sheetCols: 6,
    sheetRows: 5,
    flipWhenRight: false, // new sheet faces right (same as Fizzle)
    animations: {
        idle:  { row: 0, frames: 6 },
        walk:  { row: 1, frames: 6 },
        // Row 3: use first 2 frames for hurt, full row for death
        hurt:  { row: 3, frames: 2 },
        death: { row: 3, frames: 6 }
    }
  },
  Ignis: {
    name: 'Ignis the Arsonist',
    weapon: 'flame',
    stats: { baseSpeed: 3.6, damageMultiplier: 0.9, fireRateMultiplier: 1.2, projSizeMultiplier: 1.0 },
    trait: 'fireTrail',
    sprite: 'src/img/sprite-ignis.png',
    frameWidth: 167,
    frameHeight: 200,
    animations: {
        idle: { row: 0, frames: 3 },
        walk: { row: 1, frames: 6 },
        attack: { row: 2, frames: 3 },
        hurt: { row: 3, frames: 1 },
        death: { row: 4, frames: 2 }
    }
  },
  Fizzle: {
    name: 'Fizzle the Alchemist',
    weapon: 'orb',
    stats: { baseSpeed: 3.0, damageMultiplier: 1.0, fireRateMultiplier: 1.0, projSizeMultiplier: 1.0 },
    trait: 'potions',
    sprite: 'src/img/sprite-fizzle.png',
    frameWidth: 170,
    frameHeight: 205,
    sheetCols: 6,
    sheetRows: 5,
    flipWhenRight: false, // Fizzle sheet faces right; flip when moving left
    animations: {
        // New sheet mapping:
        // - Row 0: standing still (idle)
        // - Row 1: running (walk)
        // - Row 3: harm/death sequences
        // - Row 2, frame index 2: potion proc pose
        idle:  { row: 0, frames: 6 },
        walk:  { row: 1, frames: 6 },
        // Special single-frame pose when potion procs
        proc:  { row: 2, frames: 1, fixedFrame: 2 }, // third frame (0-based index 2)
        // Use only first two frames of 4th row when hurt
        hurt:  { row: 3, frames: 2 },
        // Use full 4th row for death; we'll freeze on last frame in code
        death: { row: 3, frames: 6 }
    }
  }
};

export function applyCharacterToPlayer(player, gameState, characterKey) {
  const cfg = CHARACTERS[characterKey];
  if (!cfg) return;
  gameState.character = characterKey;
  player.weapon = cfg.weapon;
  player.baseSpeed = cfg.stats.baseSpeed;
  // apply multipliers as starting stats
  player.stats.damageMultiplier *= cfg.stats.damageMultiplier;
  player.stats.fireRateMultiplier *= cfg.stats.fireRateMultiplier;
  player.stats.projSizeMultiplier *= cfg.stats.projSizeMultiplier;
  gameState.trait = cfg.trait;
  // set character-specific sprite and animation properties
  player.sprite.src = versioned(cfg.sprite);
  player.frameWidth = cfg.frameWidth;
  player.frameHeight = cfg.frameHeight;
  if (cfg.sheetCols) player.sheetCols = cfg.sheetCols;
  if (cfg.sheetRows) player.sheetRows = cfg.sheetRows;
  if (typeof cfg.flipWhenRight === 'boolean') player.flipWhenRight = cfg.flipWhenRight;
  player.animations = cfg.animations;

  // Character-specific extras
  if (characterKey === 'Fizzle') {
    // Add a small regenerating shield that absorbs damage first
    player.shieldMax = 20;
    player.shield = player.shieldMax;
    player.shieldRegenRate = 0.15; // per frame when regen is active
    player.shieldRegenCooldown = 0; // regen starts after a brief delay once damaged
  }
}
