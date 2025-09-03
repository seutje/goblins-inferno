import { initMeta, applyMetaAtRunStart } from '../src/js/meta.js';

describe('Meta progression', () => {
  beforeEach(() => {
    // Mock localStorage for initMeta/loadMeta
    const data = { gems: 3, upgrades: { magnet: 2, multishot: 3, bounce: 1, pierce: 2 } };
    global.localStorage = {
      getItem: (k) => JSON.stringify(data),
      setItem: () => {}
    };
    // Minimal document stub for UI wiring in initMeta
    const elMap = new Map();
    global.document = {
      getElementById: (id) => {
        if (!elMap.has(id)) {
          elMap.set(id, { style: {}, textContent: '', disabled: false, addEventListener: () => {} });
        }
        return elMap.get(id);
      },
      addEventListener: () => {}
    };
  });

  test('initMeta sets magnet radius based on upgrades', () => {
    const gameState = {};
    initMeta(gameState);
    expect(gameState.meta).toBeTruthy();
    expect(gameState.magnetRadius).toBe(110 + 20 * 2); // base 110 + 20 per level
  });

  test('applyMetaAtRunStart populates _metaMods from meta upgrades', () => {
    const gameState = {};
    initMeta(gameState);
    applyMetaAtRunStart(gameState);
    expect(gameState._metaMods).toEqual({ multishot: 3, bounce: 1, pierce: 2 });
  });
});
