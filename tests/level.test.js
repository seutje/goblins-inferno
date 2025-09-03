import { spawnCoin, updateLevelSystem } from '../src/js/level.js';

beforeAll(() => {
  globalThis.Image = class {
    constructor() {
      this.complete = true;
      this.naturalWidth = 16;
      this.naturalHeight = 16;
    }
  };
});

describe('Level and Gems', () => {
  test('spawnCoin clamps to world bounds', () => {
    const gameState = { gems: [], world: { width: 100, height: 100 } };
    spawnCoin(gameState, -100, -100, { value: 1 });
    expect(gameState.gems.length).toBe(1);
    const g = gameState.gems[0];
    expect(g.x).toBeGreaterThanOrEqual(16);
    expect(g.y).toBeGreaterThanOrEqual(16);
    expect(g.x).toBeLessThanOrEqual(84);
    expect(g.y).toBeLessThanOrEqual(84);
  });

  test('collecting coin increases xp, levels up, and adds gold to debt', () => {
    const canvas = { width: 120, height: 80 };
    const gameState = {
      world: { width: 120, height: 80 },
      player: { x: 60, y: 40, size: 10, stats: {} },
      gems: [],
      xp: 0,
      level: 1,
      nextLevelXp: 1,
      totalGems: 0,
      debt: { gold: 0 }
    };
    // Avoid DOM wiring from initLevelSystem; only logic we need is pickup/level
    gameState.upgradePool = [];
    spawnCoin(gameState, 60, 40, { value: 1 });
    // Immediately collect
    updateLevelSystem(gameState, canvas);
    expect(gameState.gems.length).toBe(0);
    expect(gameState.level).toBe(2);
    expect(gameState.nextLevelXp).toBe(2); // ceil(1 * 1.5) = 2
    expect(gameState.totalGems).toBe(1);
    expect(gameState.debt.gold).toBe(1);
  });
});
