import { CreditorChampion, InterestDragon, DebtCollector, updateBoss } from '../src/js/boss.js';

beforeAll(() => {
  globalThis.Image = class { constructor(){ this.complete = true; } };
});

function mkGame() {
  const canvas = { width: 300, height: 200 };
  const gameState = {
    enemies: [],
    projectiles: [],
    difficulty: 0,
    gems: [],
    debt: { gold: 0 },
    player: { x: 150, y: 150 }
  };
  return { canvas, gameState };
}

test('boss spawns at threshold', () => {
  const { canvas, gameState } = mkGame();
  gameState.difficulty = 100; // beyond first threshold
  updateBoss(gameState, canvas);
  expect(gameState.boss).toBeTruthy();
  expect(gameState.enemies.includes(gameState.boss)).toBe(true);
});

test('debt collector absorbs and reflects without taking damage', () => {
  const { canvas, gameState } = mkGame();
  const boss = new DebtCollector(canvas, gameState);
  gameState.boss = boss;
  gameState.enemies.push(boss);
  boss.absorbTimer = 30;
  const hpBefore = boss.hp;
  const projectile = { damage: 5 };
  boss.takeHit(projectile, gameState);
  expect(boss.hp).toBe(hpBefore); // no damage while absorbing
  // queued reflection should increase reflectBurst
  expect(boss.reflectBurst).toBeGreaterThan(0);
});

test("reflected shots don't inherit player's projectile size multiplier", () => {
  const { canvas, gameState } = mkGame();
  const boss = new CreditorChampion(canvas, gameState);
  gameState.boss = boss;
  gameState.enemies.push(boss);
  // Simulate player stats buffing projectile size 3x
  gameState.player.stats = { projSizeMultiplier: 3 };
  boss.shieldActive = true; // so takeHit reflects

  // Incoming player projectile had size already multiplied: base 5 * 3 = 15
  const incoming = { damage: 4, speed: 5, size: 15 };
  boss.takeHit(incoming, gameState);

  expect(gameState.projectiles.length).toBe(1);
  const reflected = gameState.projectiles[0];
  expect(reflected.faction).toBe('enemy');
  // Size should be normalized back to base (approximately 5)
  expect(reflected.size).toBeCloseTo(5, 5);
});

test("reflected shots don't inherit player's damage multiplier", () => {
  const { canvas, gameState } = mkGame();
  const boss = new CreditorChampion(canvas, gameState);
  gameState.boss = boss;
  gameState.enemies.push(boss);
  // Player has +2x damage multiplier
  gameState.player.stats = { damageMultiplier: 2 };
  boss.shieldActive = true;

  // Incoming projectile already has player damage applied: base 4 * 2 = 8
  const incoming = { damage: 8, speed: 10, size: 5 };
  boss.takeHit(incoming, gameState);

  expect(gameState.projectiles.length).toBe(1);
  const reflected = gameState.projectiles[0];
  // Expect base damage (4) * 1.5 reflect scaling = 6
  expect(reflected.damage).toBeCloseTo(6, 5);
  // Speed uses reflect scaling only (no player buffs)
  expect(reflected.speed).toBeCloseTo(12, 5);
});

test("dragon fireballs/gold bombs ignore player multipliers and meta", () => {
  const { canvas, gameState } = mkGame();
  const dragon = new InterestDragon(canvas, gameState);
  gameState.enemies.push(dragon);
  // Inflate player stats and meta to try to leak
  gameState.player.stats = { damageMultiplier: 3, projSizeMultiplier: 4 };
  gameState._metaMods = { bounce: 5, pierce: 5 };
  const before = gameState.projectiles.length;
  dragon.fieryRain();
  const created = gameState.projectiles.slice(before);
  // Should have created 15 projectiles total
  expect(created.length).toBe(15);
  const fireballs = created.filter(p => p.color === 'orange');
  const bombs = created.filter(p => p.color === 'gold');
  // Sizes should be fixed, not scaled by player
  fireballs.forEach(p => expect(p.size).toBeCloseTo(5, 5));
  bombs.forEach(p => expect(p.size).toBeCloseTo(8, 5));
  // Bounce/pierce should default to 0
  created.forEach(p => {
    expect(p.bouncesLeft || 0).toBe(0);
    expect(p.pierceLeft || 0).toBe(0);
    expect(p.faction).toBe('enemy');
  });
});
