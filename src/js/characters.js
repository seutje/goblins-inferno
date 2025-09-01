// Character selection and trait wiring
import { versioned } from './assets.js';

export const CHARACTERS = {
  Gnorp: {
    name: 'Gnorp the Pyromaniac',
    weapon: 'inferno',
    stats: { baseSpeed: 2.5, damageMultiplier: 1.3, fireRateMultiplier: 1.0, projSizeMultiplier: 1.1 },
    trait: 'closeDamage',
    sprite: 'src/img/sprite-gnorp.png',
    frameWidth: 175,
    frameHeight: 200,
    animations: {
        idle: { row: 0, frames: 3 },
        walk: { row: 1, frames: 6 },
        attack: { row: 2, frames: 3 },
        hurt: { row: 3, frames: 1 },
        death: { row: 4, frames: 2 }
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
    frameHeight: 200,
    animations: {
        idle: { row: 0, frames: 4 },
        walk: { row: 1, frames: 6 },
        attack: { row: 2, frames: 4 },
        hurt: { row: 3, frames: 4 },
        death: { row: 4, frames: 4 }
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
  player.animations = cfg.animations;
}
