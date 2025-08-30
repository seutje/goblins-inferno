import Enemy from '../src/enemy.js';

beforeAll(() => {
  globalThis.Image = class {
    constructor() {
      this.complete = true;
    }
  };
});

describe('Enemy', () => {
  const createEnemy = () => {
    const canvas = { width: 100, height: 100 };
    const gameState = { player: { x: 80, y: 50 } };
    const enemy = new Enemy(canvas, gameState);
    enemy.x = 10;
    enemy.y = 50;
    return enemy;
  };

  test('moves toward the player', () => {
    const enemy = createEnemy();
    const initialX = enemy.x;
    enemy.update();
    expect(enemy.x).toBeGreaterThan(initialX);
  });
});
