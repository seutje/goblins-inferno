// Character selection and trait wiring
import { versioned } from './assets.js';

export const CHARACTERS = {
  Gnorp: {
    name: 'Gnorp the Pyromaniac',
    weapon: 'inferno',
    stats: { baseSpeed: 2.5, damageMultiplier: 1.3, fireRateMultiplier: 1.0, projSizeMultiplier: 1.1 },
    // Special: extra damage to nearby enemies handled in collision logic
    trait: 'closeDamage'
  },
  Ignis: {
    name: 'Ignis the Arsonist',
    weapon: 'flame',
    stats: { baseSpeed: 3.6, damageMultiplier: 0.9, fireRateMultiplier: 1.2, projSizeMultiplier: 1.0 },
    // Special: fire trail (placeholder flag)
    trait: 'fireTrail'
  },
  Fizzle: {
    name: 'Fizzle the Alchemist',
    weapon: 'orb',
    stats: { baseSpeed: 3.0, damageMultiplier: 1.0, fireRateMultiplier: 1.0, projSizeMultiplier: 1.0 },
    // Special: potions on gem pickup
    trait: 'potions'
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
  // set character-specific sprite
  if (characterKey === 'Gnorp') player.sprite.src = versioned('src/img/sprite-gnorp.png');
  else if (characterKey === 'Ignis') player.sprite.src = versioned('src/img/sprite-ignis.png');
  else if (characterKey === 'Fizzle') player.sprite.src = versioned('src/img/sprite-fizzle.png');
}
