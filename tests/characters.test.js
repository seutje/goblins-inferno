import Player from '../src/player.js';
import { applyCharacterToPlayer } from '../src/characters.js';

beforeAll(() => {
  globalThis.Image = class { constructor(){ this.complete = true; } };
});

function mk() {
  const canvas = { width: 100, height: 100 };
  const gameState = { keys: {}, projectiles: [] };
  const player = new Player(canvas, gameState);
  return { canvas, gameState, player };
}

describe('Character Selection', () => {
  test('Gnorp sets inferno weapon and damage boost', () => {
    const { player, gameState } = mk();
    const dmgBefore = player.stats.damageMultiplier;
    applyCharacterToPlayer(player, gameState, 'Gnorp');
    expect(player.weapon).toBe('inferno');
    expect(player.stats.damageMultiplier).toBeGreaterThan(dmgBefore);
  });

  test('Ignis increases base speed and uses flame', () => {
    const { player, gameState } = mk();
    const speedBefore = player.baseSpeed;
    applyCharacterToPlayer(player, gameState, 'Ignis');
    expect(player.weapon).toBe('flame');
    expect(player.baseSpeed).toBeGreaterThan(speedBefore);
  });

  test('Fizzle sets orb weapon', () => {
    const { player, gameState } = mk();
    applyCharacterToPlayer(player, gameState, 'Fizzle');
    expect(player.weapon).toBe('orb');
  });
});

