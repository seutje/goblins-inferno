import { DebtSkeleton, LoanerImp, BailiffOgre } from '../src/js/enemy.js';

beforeAll(() => {
  globalThis.Image = class {
    constructor() {
      this.complete = true;
    }
  };
});

describe('Enemy Types', () => {
  const canvas = { width: 100, height: 100 };
  const gameState = { player: { x: 80, y: 50 } };

  test('DebtSkeleton moves toward the player', () => {
    const enemy = new DebtSkeleton(canvas, gameState);
    enemy.x = 10;
    enemy.y = 50;
    const initialX = enemy.x;
    enemy.update();
    expect(enemy.x).toBeGreaterThan(initialX);
  });

  test('LoanerImp is faster than DebtSkeleton', () => {
    const skeleton = new DebtSkeleton(canvas, gameState);
    const imp = new LoanerImp(canvas, gameState);
    skeleton.x = imp.x = 10;
    skeleton.y = imp.y = 50;
    skeleton.update();
    imp.update();
    expect(imp.x - 10).toBeGreaterThan(skeleton.x - 10);
  });

  test('BailiffOgre charges when close', () => {
    const ogre = new BailiffOgre(canvas, gameState);
    ogre.x = 70;
    ogre.y = 50;
    ogre.chargeCooldown = 0;
    ogre.update();
    expect(ogre.state).toBe('attack');
  });
});
