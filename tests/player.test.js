import Player from '../src/js/player.js';

beforeAll(() => {
  globalThis.Image = class {
    constructor() {
      this.complete = true;
    }
  };
});

describe('Player', () => {
  const createPlayer = () => {
    const canvas = { width: 100, height: 100 };
    const gameState = { keys: {}, projectiles: [] };
    const player = new Player(canvas, gameState);
    return { player, gameState };
  };

  test('moves right when KeyD is pressed', () => {
    const { player, gameState } = createPlayer();
    const initialX = player.x;
    gameState.keys['KeyD'] = true;
    player.update();
    expect(player.x).toBeGreaterThan(initialX);
  });

  test('fires a projectile when cooldown allows', () => {
    const { player, gameState } = createPlayer();
    expect(gameState.projectiles).toHaveLength(0);
    player.update();
    expect(gameState.projectiles.length).toBeGreaterThan(0);
  });
});
