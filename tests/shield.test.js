import Player from '../src/js/player.js';
import { applyCharacterToPlayer } from '../src/js/characters.js';
import { spawnFirePatch, updateHazards } from '../src/js/hazard.js';

beforeAll(() => {
  globalThis.Image = class { constructor(){ this.complete = true; this.naturalWidth = 16; this.naturalHeight = 16; } };
});

describe('Fizzle Shield', () => {
  function mk() {
    const canvas = { width: 200, height: 120 };
    const gameState = { world: { width: 200, height: 120 }, player: null, enemies: [], hazards: [], keys: {}, projectiles: [] };
    const player = new Player(canvas, gameState);
    gameState.player = player;
    applyCharacterToPlayer(player, gameState, 'Fizzle');
    // Place player near center
    player.x = 100; player.y = 60;
    return { canvas, gameState, player };
  }

  test('enemy fire patch damages shield before HP', () => {
    const { gameState, player } = mk();
    const hpBefore = player.hp;
    const shieldBefore = player.shield;
    // Enemy fire patch overlapping player
    spawnFirePatch(gameState, player.x, player.y, { radius: 20, duration: 5, dps: 2, faction: 'enemy' });
    updateHazards(gameState);
    expect(player.shield).toBeLessThan(shieldBefore);
    expect(player.hp).toBe(hpBefore); // HP untouched on first tick
  });

  test('shield regenerates after cooldown', () => {
    const { gameState, player } = mk();
    // Deal some shield damage
    spawnFirePatch(gameState, player.x, player.y, { radius: 20, duration: 1, dps: 5, faction: 'enemy' });
    updateHazards(gameState);
    const damagedShield = player.shield;
    // Wait out cooldown and a few regen ticks
    player.shieldRegenCooldown = 5; // make short for test
    for (let i = 0; i < 10; i++) player.update();
    expect(player.shield).toBeGreaterThan(damagedShield);
  });
});
