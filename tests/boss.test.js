import { CreditorChampion, InterestDragon, DebtCollector, updateBoss } from '../src/boss.js';

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

